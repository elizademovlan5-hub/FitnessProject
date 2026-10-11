using System.Security.Cryptography;
using System.Text;
using FitnessProject.Application.DTOs.Auth;
using FitnessProject.Application.Interfaces;
using FitnessProject.Domain.Entities;
using FitnessProject.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitnessProject.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    readonly UserManager<ApplicationUser> _userManager;
    readonly RoleManager<IdentityRole> _roleManager;
    readonly AppDbContext _db;
    readonly IEmailService _emailService;
    readonly IJwtService _jwtService;
    readonly IWebHostEnvironment _environment;
    readonly IConfiguration _configuration;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager,
        AppDbContext db,
        IEmailService emailService,
        IJwtService jwtService,
        IWebHostEnvironment environment,
        IConfiguration configuration)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _db = db;
        _emailService = emailService;
        _jwtService = jwtService;
        _environment = environment;
        _configuration = configuration;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        var email = dto.Email.Trim().ToLowerInvariant();
        var existingUser = await _userManager.FindByEmailAsync(email);
        if (existingUser is not null)
        {
            if (existingUser.EmailConfirmed)
            {
                return Conflict(new { message = "Bu email artıq qeydiyyatdan keçib." });
            }

            return Conflict(new { message = "Bu email üçün təsdiq tamamlanmayıb. resend-otp endpoint-indən istifadə edin." });
        }

        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            FullName = dto.FullName.Trim(),
            EmailConfirmed = false,
            IsActive = true
        };

        var createResult = await _userManager.CreateAsync(user, dto.Password);
        if (!createResult.Succeeded)
        {
            return BadRequest(new { message = "Qeydiyyat tamamlanmadı.", errors = createResult.Errors.Select(x => x.Description) });
        }

        if (!await _roleManager.RoleExistsAsync("User"))
        {
            var roleResult = await _roleManager.CreateAsync(new IdentityRole("User"));
            if (!roleResult.Succeeded)
            {
                return StatusCode(500, new { message = "User rolu yaradıla bilmədi." });
            }
        }
        await _userManager.AddToRoleAsync(user, "User");

        var code = CreateOtpCode();
        await SaveOtpAsync(user, code);
        var sent = await _emailService.SendOtpAsync(email, code);

        var response = new Dictionary<string, object?>
        {
            ["message"] = sent ? "Email təsdiq kodu göndərildi. Qeydiyyatı tamamlamaq üçün OTP-ni təsdiqləyin." : "SMTP qurulmayıb. Development rejimində OTP cavabda göstərilir; email göndərmək üçün SMTP parametrlərini qurun."
        };
        if (!sent && _environment.IsDevelopment())
        {
            response["developmentOtp"] = code;
        }
        return Ok(response);
    }

    [HttpPost("verify-email")]
    public async Task<IActionResult> VerifyEmail(VerifyOtpDto dto)
    {
        var email = dto.Email.Trim().ToLowerInvariant();
        var user = await _userManager.FindByEmailAsync(email);
        if (user is null)
        {
            return BadRequest(new { message = "İstifadəçi tapılmadı." });
        }
        if (user.EmailConfirmed)
        {
            return Ok(new { message = "Email artıq təsdiqlənib. Login edə bilərsiniz." });
        }

        var verification = await _db.EmailVerifications
            .Where(x => x.UserId == user.Id && !x.IsUsed && x.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync();

        if (verification is null || !FixedHashEquals(verification.CodeHash, HashCode(dto.Code.Trim())))
        {
            return BadRequest(new { message = "OTP səhvdir və ya vaxtı bitib." });
        }

        verification.IsUsed = true;
        user.EmailConfirmed = true;
        await _db.SaveChangesAsync();
        await _userManager.UpdateAsync(user);

        return Ok(new { message = "Email təsdiqləndi. İndi login edə bilərsiniz." });
    }

    [HttpPost("resend-otp")]
    public async Task<IActionResult> ResendOtp(ResendOtpDto dto)
    {
        var email = dto.Email.Trim().ToLowerInvariant();
        var user = await _userManager.FindByEmailAsync(email);
        if (user is null || user.EmailConfirmed)
        {
            return BadRequest(new { message = "Bu email üçün yeni OTP göndərmək mümkün deyil." });
        }

        var code = CreateOtpCode();
        await SaveOtpAsync(user, code);
        var sent = await _emailService.SendOtpAsync(email, code);
        var response = new Dictionary<string, object?>
        {
            ["message"] = sent ? "Yeni OTP email-ə göndərildi." : "SMTP qurulmayıb. Development OTP aşağıdadır."
        };
        if (!sent && _environment.IsDevelopment())
        {
            response["developmentOtp"] = code;
        }
        return Ok(response);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var email = dto.Email.Trim().ToLowerInvariant();
        var user = await _userManager.FindByEmailAsync(email);
        if (user is null || !user.IsActive || !await _userManager.CheckPasswordAsync(user, dto.Password))
        {
            return Unauthorized(new { message = "Email və ya şifrə yanlışdır." });
        }
        if (!user.EmailConfirmed)
        {
            return BadRequest(new { message = "Əvvəlcə email təsdiqini tamamlayın." });
        }

        var roles = await _userManager.GetRolesAsync(user);
        var token = _jwtService.CreateToken(user, roles);
        var expiryMinutes = int.TryParse(_configuration["Jwt:ExpiryMinutes"], out var mins) ? mins : 60;

        return Ok(new
        {
            token,
            tokenType = "Bearer",
            expiresInMinutes = expiryMinutes,
            user = new { user.FullName, user.Email, user.ProfilePhotoUrl, roles }
        });
    }

    async Task SaveOtpAsync(ApplicationUser user, string code)
    {
        var oldCodes = await _db.EmailVerifications
            .Where(x => x.UserId == user.Id && !x.IsUsed)
            .ToListAsync();
        foreach (var oldCode in oldCodes)
        {
            oldCode.IsUsed = true;
        }

        _db.EmailVerifications.Add(new EmailVerification
        {
            UserId = user.Id,
            CodeHash = HashCode(code),
            ExpiresAt = DateTime.UtcNow.AddMinutes(10),
            IsUsed = false,
            CreatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();
    }

    static string CreateOtpCode() => RandomNumberGenerator.GetInt32(100000, 1000000).ToString();

    static string HashCode(string code) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(code)));

    static bool FixedHashEquals(string first, string second)
    {
        var firstBytes = Encoding.UTF8.GetBytes(first);
        var secondBytes = Encoding.UTF8.GetBytes(second);
        return firstBytes.Length == secondBytes.Length && CryptographicOperations.FixedTimeEquals(firstBytes, secondBytes);
    }
}
