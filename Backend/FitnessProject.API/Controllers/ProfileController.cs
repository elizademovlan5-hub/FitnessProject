using System.Security.Claims;
using FitnessProject.Application.DTOs.Profile;
using FitnessProject.Application.Interfaces;
using FitnessProject.Domain.Entities;
using FitnessProject.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitnessProject.API.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class ProfileController : ControllerBase
{
    readonly UserManager<ApplicationUser> _userManager;
    readonly ICloudinaryService _cloudinaryService;
    readonly AppDbContext _db;

    public ProfileController(UserManager<ApplicationUser> userManager, ICloudinaryService cloudinaryService, AppDbContext db)
    {
        _userManager = userManager;
        _cloudinaryService = cloudinaryService;
        _db = db;
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMyProfile()
    {
        var user = await _userManager.FindByIdAsync(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        if (user is null) return NotFound(new { message = "Profil tapılmadı." });

        var roles = await _userManager.GetRolesAsync(user);
        return Ok(new
        {
            user.FullName,
            user.Email,
            user.ProfilePhotoUrl,
            user.HeightCm,
            user.WeightKg,
            user.FitnessGoal,
            user.CreatedAt,
            roles
        });
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateMyProfile(UpdateProfileDto dto)
    {
        var user = await _userManager.FindByIdAsync(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        if (user is null) return NotFound(new { message = "Profil tapılmadı." });

        user.FullName = dto.FullName.Trim();
        user.HeightCm = dto.HeightCm;
        user.WeightKg = dto.WeightKg;
        user.FitnessGoal = string.IsNullOrWhiteSpace(dto.FitnessGoal) ? null : dto.FitnessGoal.Trim();
        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            return BadRequest(new { message = "Profil yenilənmədi.", errors = result.Errors.Select(x => x.Description) });
        }

        return Ok(new { message = "Profil yeniləndi." });
    }

    [HttpPost("photo")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(5_000_000)]
    public async Task<IActionResult> UploadProfilePhoto(IFormFile file)
    {
        if (file is null || file.Length == 0) return BadRequest(new { message = "Şəkil faylı seçin." });
        if (!file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase)) return BadRequest(new { message = "Yalnız şəkil faylı yüklənə bilər." });
        if (!_cloudinaryService.IsConfigured) return BadRequest(new { message = "Cloudinary parametrlərini appsettings.json-da doldurun." });

        var user = await _userManager.FindByIdAsync(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        if (user is null) return NotFound(new { message = "Profil tapılmadı." });

        using var stream = file.OpenReadStream();
        user.ProfilePhotoUrl = await _cloudinaryService.UploadImageAsync(stream, file.FileName, "fitness/profile");
        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded) return BadRequest(new { message = "Profil şəkli URL-i saxlanmadı.", errors = result.Errors.Select(x => x.Description) });

        return Ok(new { message = "Profil şəkli Cloudinary-yə yükləndi.", photoUrl = user.ProfilePhotoUrl });
    }

    [HttpPost("monthly-photo")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(5_000_000)]
    public async Task<IActionResult> UploadMonthlyPhoto(IFormFile file)
    {
        if (file is null || file.Length == 0) return BadRequest(new { message = "Şəkil faylı seçin." });
        if (!file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase)) return BadRequest(new { message = "Yalnız şəkil faylı yüklənə bilər." });
        if (!_cloudinaryService.IsConfigured) return BadRequest(new { message = "Cloudinary parametrlərini appsettings.json-da doldurun." });

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var month = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
        var alreadyUploaded = await _db.MonthlyProgressPhotos.AnyAsync(x => x.UserId == userId && x.PhotoMonth == month);
        if (alreadyUploaded)
        {
            return Conflict(new { message = "Bu ay üçün aylıq foto artıq yüklənib." });
        }

        using var stream = file.OpenReadStream();
        var photoUrl = await _cloudinaryService.UploadImageAsync(stream, file.FileName, "fitness/monthly-progress");
        _db.MonthlyProgressPhotos.Add(new MonthlyProgressPhoto
        {
            UserId = userId,
            PhotoUrl = photoUrl,
            PhotoMonth = month,
            UploadedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();
        return Ok(new { message = "Aylıq foto saxlanıldı.", photoUrl, photoMonth = month });
    }

    [HttpGet("monthly-photos")]
    public async Task<IActionResult> GetMonthlyPhotos()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var photos = await _db.MonthlyProgressPhotos.AsNoTracking()
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.PhotoMonth)
            .Select(x => new { x.PhotoUrl, x.PhotoMonth, x.UploadedAt })
            .ToListAsync();
        return Ok(photos);
    }
}
