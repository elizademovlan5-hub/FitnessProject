using System.Security.Claims;
using FitnessProject.Application.DTOs.Admin;
using FitnessProject.Application.DTOs.Workouts;
using FitnessProject.Application.Helpers;
using FitnessProject.Application.Interfaces;
using FitnessProject.Domain.Entities;
using FitnessProject.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitnessProject.API.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
    readonly AppDbContext _db;
    readonly UserManager<ApplicationUser> _userManager;
    readonly RoleManager<IdentityRole> _roleManager;
    readonly ICloudinaryService _cloudinaryService;

    public AdminController(AppDbContext db, UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager, ICloudinaryService cloudinaryService)
    {
        _db = db;
        _userManager = userManager;
        _roleManager = roleManager;
        _cloudinaryService = cloudinaryService;
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _userManager.Users.OrderBy(x => x.Email).ToListAsync();
        var result = new List<object>();
        foreach (var user in users)
        {
            result.Add(new
            {
                user.FullName,
                user.Email,
                user.ProfilePhotoUrl,
                user.IsActive,
                user.EmailConfirmed,
                user.CreatedAt,
                roles = await _userManager.GetRolesAsync(user)
            });
        }
        return Ok(result);
    }

    [HttpPut("users/role")]
    public async Task<IActionResult> SetUserRole(SetUserRoleDto dto)
    {
        var email = dto.Email.Trim();
        var requestedRole = dto.Role.Trim();
        if (!requestedRole.Equals("Admin", StringComparison.OrdinalIgnoreCase) &&
            !requestedRole.Equals("User", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { message = "Rol yalnız Admin və ya User ola bilər." });
        }
        requestedRole = requestedRole.Equals("Admin", StringComparison.OrdinalIgnoreCase) ? "Admin" : "User";

        var target = await _userManager.FindByEmailAsync(email);
        if (target is null) return NotFound(new { message = "İstifadəçi tapılmadı." });
        var roles = await _userManager.GetRolesAsync(target);
        if (roles.Contains("Admin") && requestedRole == "User")
        {
            var admins = await _userManager.GetUsersInRoleAsync("Admin");
            if (admins.Count(x => x.IsActive) <= 1)
                return BadRequest(new { message = "Son aktiv Admin-in rolunu dəyişmək olmaz." });
        }

        if (!await _roleManager.RoleExistsAsync(requestedRole))
            await _roleManager.CreateAsync(new IdentityRole(requestedRole));
        if (roles.Count > 0)
        {
            var removeResult = await _userManager.RemoveFromRolesAsync(target, roles);
            if (!removeResult.Succeeded)
                return BadRequest(new { message = "Mövcud rol silinmədi.", errors = removeResult.Errors.Select(x => x.Description) });
        }
        var addResult = await _userManager.AddToRoleAsync(target, requestedRole);
        if (!addResult.Succeeded)
            return BadRequest(new { message = "Yeni rol verilmədi.", errors = addResult.Errors.Select(x => x.Description) });

        return Ok(new { message = "İstifadəçi rolu dəyişdirildi.", email = target.Email, role = requestedRole });
    }

    [HttpPut("users/status")]
    public async Task<IActionResult> SetUserStatus(SetUserStatusDto dto)
    {
        var target = await _userManager.FindByEmailAsync(dto.Email.Trim());
        if (target is null) return NotFound(new { message = "İstifadəçi tapılmadı." });
        if (target.Id == User.FindFirstValue(ClaimTypes.NameIdentifier) && !dto.IsActive)
            return BadRequest(new { message = "Öz hesabınızı deaktiv edə bilməzsiniz." });

        if (!dto.IsActive && await _userManager.IsInRoleAsync(target, "Admin"))
        {
            var admins = await _userManager.GetUsersInRoleAsync("Admin");
            if (admins.Count(x => x.IsActive) <= 1)
                return BadRequest(new { message = "Son aktiv Admin hesabını deaktiv etmək olmaz." });
        }

        target.IsActive = dto.IsActive;
        var result = await _userManager.UpdateAsync(target);
        if (!result.Succeeded) return BadRequest(new { errors = result.Errors.Select(x => x.Description) });
        return Ok(new { message = dto.IsActive ? "Hesab aktiv edildi." : "Hesab deaktiv edildi." });
    }

    [HttpPost("workouts")]
    public async Task<IActionResult> CreateWorkout(CreateWorkoutDto dto)
    {
        var validation = ValidateDifficulty(dto.Difficulty);
        if (validation is not null) return BadRequest(new { message = validation });

        var category = await GetOrCreateCategoryAsync(dto.CategoryName);
        var slug = await GetUniqueSlugAsync(dto.Name, null);
        var workout = new Workout
        {
            Name = dto.Name.Trim(),
            Slug = slug,
            Description = dto.Description.Trim(),
            MuscleGroup = dto.MuscleGroup.Trim(),
            Difficulty = NormalizeDifficulty(dto.Difficulty),
            CategoryId = category.Id,
            ImageUrl = dto.ImageUrl,
            VideoUrl = dto.VideoUrl,
            PreviewSeconds = dto.PreviewSeconds,
            DurationMinutes = dto.DurationMinutes,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        _db.Workouts.Add(workout);
        await _db.SaveChangesAsync();
        await _db.Entry(workout).Reference(x => x.Category).LoadAsync();
        return CreatedAtAction(nameof(GetAdminWorkout), new { slug = workout.Slug }, WorkoutMapper.ToDto(workout));
    }

    [HttpGet("workouts")]
    public async Task<IActionResult> GetAdminWorkouts()
    {
        var workouts = await _db.Workouts.AsNoTracking().Include(x => x.Category)
            .OrderBy(x => x.Name).ToListAsync();
        return Ok(workouts.Select(x => new { workout = WorkoutMapper.ToDto(x), x.IsActive, x.CreatedAt, x.UpdatedAt }));
    }

    [HttpGet("workouts/{slug}")]
    public async Task<IActionResult> GetAdminWorkout(string slug)
    {
        var workout = await _db.Workouts.AsNoTracking().Include(x => x.Category)
            .FirstOrDefaultAsync(x => x.Slug == slug);
        if (workout is null) return NotFound(new { message = "Məşq tapılmadı." });
        return Ok(new { workout = WorkoutMapper.ToDto(workout), workout.IsActive, workout.CreatedAt, workout.UpdatedAt });
    }

    [HttpPut("workouts/{slug}")]
    public async Task<IActionResult> UpdateWorkout(string slug, UpdateWorkoutDto dto)
    {
        var workout = await _db.Workouts.Include(x => x.Category).FirstOrDefaultAsync(x => x.Slug == slug);
        if (workout is null) return NotFound(new { message = "Məşq tapılmadı." });
        var validation = ValidateDifficulty(dto.Difficulty);
        if (validation is not null) return BadRequest(new { message = validation });

        var category = await GetOrCreateCategoryAsync(dto.CategoryName);
        workout.Name = dto.Name.Trim();
        workout.Slug = await GetUniqueSlugAsync(dto.Name, workout.Id);
        workout.Description = dto.Description.Trim();
        workout.MuscleGroup = dto.MuscleGroup.Trim();
        workout.Difficulty = NormalizeDifficulty(dto.Difficulty);
        workout.CategoryId = category.Id;
        workout.Category = category;
        workout.ImageUrl = dto.ImageUrl;
        workout.VideoUrl = dto.VideoUrl;
        workout.PreviewSeconds = dto.PreviewSeconds;
        workout.DurationMinutes = dto.DurationMinutes;
        workout.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await _db.Entry(workout).Reference(x => x.Category).LoadAsync();
        return Ok(WorkoutMapper.ToDto(workout));
    }

    [HttpDelete("workouts/{slug}")]
    public async Task<IActionResult> DeleteWorkout(string slug)
    {
        var workout = await _db.Workouts.FirstOrDefaultAsync(x => x.Slug == slug);
        if (workout is null) return NotFound(new { message = "Məşq tapılmadı." });
        // Soft delete keeps existing user history valid.
        workout.IsActive = false;
        workout.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Məşq deaktiv edildi və istifadəçi siyahısından çıxarıldı." });
    }

    [HttpPost("upload-image")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(10_000_000)]
    public async Task<IActionResult> UploadWorkoutImage(IFormFile file)
    {
        if (file is null || file.Length == 0) return BadRequest(new { message = "Şəkil faylı seçin." });
        if (!file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase)) return BadRequest(new { message = "Yalnız şəkil faylı yüklənə bilər." });
        if (!_cloudinaryService.IsConfigured) return BadRequest(new { message = "Cloudinary parametrlərini appsettings.json-da doldurun." });
        using var stream = file.OpenReadStream();
        var url = await _cloudinaryService.UploadImageAsync(stream, file.FileName, "fitness/workouts/images");
        return Ok(new { imageUrl = url });
    }

    [HttpPost("upload-video")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(100_000_000)]
    public async Task<IActionResult> UploadWorkoutVideo(IFormFile file)
    {
        if (file is null || file.Length == 0) return BadRequest(new { message = "Video faylı seçin." });
        if (!file.ContentType.StartsWith("video/", StringComparison.OrdinalIgnoreCase)) return BadRequest(new { message = "Yalnız video faylı yüklənə bilər." });
        if (!_cloudinaryService.IsConfigured) return BadRequest(new { message = "Cloudinary parametrlərini appsettings.json-da doldurun." });
        using var stream = file.OpenReadStream();
        var url = await _cloudinaryService.UploadVideoAsync(stream, file.FileName, "fitness/workouts/videos");
        return Ok(new { videoUrl = url, previewSeconds = 8 });
    }

    async Task<Category> GetOrCreateCategoryAsync(string categoryName)
    {
        var name = categoryName.Trim();
        var slug = SlugHelper.GenerateSlug(name);
        var category = await _db.Categories.FirstOrDefaultAsync(x => x.Slug == slug);
        if (category is not null) return category;
        category = new Category { Name = name, Slug = slug };
        _db.Categories.Add(category);
        await _db.SaveChangesAsync();
        return category;
    }

    async Task<string> GetUniqueSlugAsync(string name, int? exceptId)
    {
        var baseSlug = SlugHelper.GenerateSlug(name);
        var slug = baseSlug;
        var suffix = 2;
        while (await _db.Workouts.AnyAsync(x => x.Slug == slug && (!exceptId.HasValue || x.Id != exceptId.Value)))
        {
            slug = $"{baseSlug}-{suffix}";
            suffix++;
        }
        return slug;
    }

    static string? ValidateDifficulty(string value)
    {
        if (new[] { "Beginner", "Intermediate", "Advanced" }.Contains(value.Trim(), StringComparer.OrdinalIgnoreCase))
            return null;
        return "Difficulty Beginner, Intermediate və ya Advanced olmalıdır.";
    }

    static string NormalizeDifficulty(string value)
    {
        return value.Trim().ToLowerInvariant() switch
        {
            "beginner" => "Beginner",
            "intermediate" => "Intermediate",
            _ => "Advanced"
        };
    }
}
