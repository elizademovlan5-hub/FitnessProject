using System.Security.Claims;
using FitnessProject.Application.DTOs.WeeklyPlan;
using FitnessProject.Application.Helpers;
using FitnessProject.Domain.Entities;
using FitnessProject.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitnessProject.API.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class WeeklyPlanController : ControllerBase
{
    readonly AppDbContext _db;

    public WeeklyPlanController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetWeeklyPlan([FromQuery] DateTime? weekStartDate)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var monday = WeekHelper.GetMonday(weekStartDate ?? DateTime.UtcNow);
        var plan = await _db.WeeklyPlans.AsNoTracking()
            .Include(x => x.PlannedWorkouts).ThenInclude(x => x.Workout).ThenInclude(x => x.Category)
            .FirstOrDefaultAsync(x => x.UserId == userId && x.WeekStartDate == monday);

        var items = plan is null ? new List<PlannedWorkoutDto>() : plan.PlannedWorkouts
            .OrderBy(x => x.DayOfWeek)
            .Select(ToDto)
            .ToList();
        return Ok(new { weekStartDate = monday, items });
    }

    [HttpPost("items")]
    public async Task<IActionResult> AddWorkout(AddPlannedWorkoutDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var workout = await _db.Workouts.Include(x => x.Category)
            .FirstOrDefaultAsync(x => x.Slug == dto.WorkoutSlug && x.IsActive);
        if (workout is null) return NotFound(new { message = "Məşq tapılmadı." });

        var monday = WeekHelper.GetMonday(dto.WeekStartDate ?? DateTime.UtcNow);
        var plan = await _db.WeeklyPlans.FirstOrDefaultAsync(x => x.UserId == userId && x.WeekStartDate == monday);
        if (plan is null)
        {
            plan = new WeeklyPlan { UserId = userId, WeekStartDate = monday, CreatedAt = DateTime.UtcNow };
            _db.WeeklyPlans.Add(plan);
            await _db.SaveChangesAsync();
        }

        var alreadyPlanned = await _db.PlannedWorkouts.AnyAsync(x => x.WeeklyPlanId == plan.Id && x.WorkoutId == workout.Id);
        if (alreadyPlanned)
        {
            return Conflict(new { message = "Bu məşq artıq həmin həftənin planındadır." });
        }

        var item = new PlannedWorkout
        {
            WeeklyPlanId = plan.Id,
            WorkoutId = workout.Id,
            DayOfWeek = dto.DayOfWeek,
            CreatedAt = DateTime.UtcNow
        };
        _db.PlannedWorkouts.Add(item);
        await _db.SaveChangesAsync();
        item.Workout = workout;
        return Ok(ToDto(item));
    }

    [HttpDelete("items/{workoutSlug}")]
    public async Task<IActionResult> RemoveWorkout(string workoutSlug, [FromQuery] DateTime? weekStartDate)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var monday = WeekHelper.GetMonday(weekStartDate ?? DateTime.UtcNow);
        var item = await _db.PlannedWorkouts
            .Include(x => x.WeeklyPlan)
            .Include(x => x.Workout)
            .FirstOrDefaultAsync(x => x.WeeklyPlan.UserId == userId &&
                                      x.WeeklyPlan.WeekStartDate == monday &&
                                      x.Workout.Slug == workoutSlug);
        if (item is null) return NotFound(new { message = "Plan element tapılmadı." });
        if (item.CompletedAt.HasValue) return BadRequest(new { message = "Tamamlanmış məşqi plandan silmək olmaz; tarixçə qorunur." });
        _db.PlannedWorkouts.Remove(item);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Məşq həftəlik plandan silindi." });
    }

    [HttpPost("items/{workoutSlug}/complete")]
    public async Task<IActionResult> CompleteWorkout(string workoutSlug, [FromQuery] DateTime? weekStartDate)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var monday = WeekHelper.GetMonday(weekStartDate ?? DateTime.UtcNow);
        var item = await _db.PlannedWorkouts
            .Include(x => x.WeeklyPlan)
            .Include(x => x.Workout)
            .FirstOrDefaultAsync(x => x.WeeklyPlan.UserId == userId &&
                                      x.WeeklyPlan.WeekStartDate == monday &&
                                      x.Workout.Slug == workoutSlug);
        if (item is null) return NotFound(new { message = "Plan elementi tapılmadı." });
        if (item.CompletedAt.HasValue) return Conflict(new { message = "Bu məşq artıq tamamlanıb." });

        var now = DateTime.UtcNow;
        item.CompletedAt = now;
        _db.CompletedWorkouts.Add(new CompletedWorkout
        {
            UserId = userId,
            WorkoutId = item.WorkoutId,
            CompletedAt = now,
            DurationMinutes = item.Workout.DurationMinutes
        });
        await _db.SaveChangesAsync();
        return Ok(new { message = "Məşq tamamlandı.", workoutSlug, completedAt = now, durationMinutes = item.Workout.DurationMinutes });
    }

    static PlannedWorkoutDto ToDto(PlannedWorkout item)
    {
        return new PlannedWorkoutDto
        {
            WorkoutSlug = item.Workout.Slug,
            WorkoutName = item.Workout.Name,
            MuscleGroup = item.Workout.MuscleGroup,
            Difficulty = item.Workout.Difficulty,
            ImageUrl = item.Workout.ImageUrl,
            VideoUrl = item.Workout.VideoUrl,
            PreviewSeconds = item.Workout.PreviewSeconds,
            DurationMinutes = item.Workout.DurationMinutes,
            DayOfWeek = item.DayOfWeek,
            CompletedAt = item.CompletedAt
        };
    }
}
