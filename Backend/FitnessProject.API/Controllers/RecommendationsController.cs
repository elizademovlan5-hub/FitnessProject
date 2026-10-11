using System.Security.Claims;
using FitnessProject.Application.Helpers;
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
public class RecommendationsController : ControllerBase
{
    readonly UserManager<ApplicationUser> _userManager;
    readonly AppDbContext _db;

    public RecommendationsController(UserManager<ApplicationUser> userManager, AppDbContext db)
    {
        _userManager = userManager;
        _db = db;
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMyRecommendations()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null) return NotFound(new { message = "Profil tapılmadı." });
        if (!user.HeightCm.HasValue || !user.WeightKg.HasValue)
        {
            return BadRequest(new { message = "Əvvəlcə profilinizdə boy və çəki məlumatlarını qeyd edin.", profileEndpoint = "/api/Profile/me" });
        }

        // Safe, general suggestions: measurements are not converted into a target weight or an intensity prescription.
        var goal = (user.FitnessGoal ?? "general fitness").Trim().ToLowerInvariant();
        var preferredCategory = goal.Contains("cardio") || goal.Contains("endurance") || goal.Contains("dözümlül")
            ? "cardio"
            : goal.Contains("mobility") || goal.Contains("flexibility") || goal.Contains("elastik")
                ? "mobility"
                : "strength";

        var preferred = await _db.Workouts.AsNoTracking()
            .Include(x => x.Category)
            .Where(x => x.IsActive && x.Difficulty == "Beginner" && x.Category.Slug == preferredCategory)
            .OrderBy(x => x.Name)
            .Take(6)
            .ToListAsync();

        var general = await _db.Workouts.AsNoTracking()
            .Include(x => x.Category)
            .Where(x => x.IsActive && x.Difficulty == "Beginner")
            .OrderBy(x => x.Name)
            .Take(9)
            .ToListAsync();

        var selected = preferred.Count > 0 ? preferred : general;
        var days = new[] { "Monday", "Wednesday", "Friday" };
        var sessions = selected.Select((workout, index) => new
        {
            day = days[index % days.Length],
            workout = WorkoutMapper.ToDto(workout)
        }).ToList();

        return Ok(new
        {
            message = "Bu ümumi başlanğıc proqramıdır. Bədən ölçüləri ideal çəki və ya məşqin təhlükəsiz intensivliyini təkbaşına müəyyən etmir.",
            profile = new { user.HeightCm, user.WeightKg, user.FitnessGoal },
            preferredCategory,
            sessions,
            reminder = "Hərəkətləri rahat tempdə edin, ağrı və ya narahatlıq olduqda dayanın və lazım gəlsə mütəxəssislə məsləhətləşin."
        });
    }
}
