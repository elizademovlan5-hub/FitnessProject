using System.Security.Claims;
using FitnessProject.Application.Helpers;
using FitnessProject.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitnessProject.API.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class StatisticsController : ControllerBase
{
    readonly AppDbContext _db;

    public StatisticsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("daily")]
    public async Task<IActionResult> GetDailyStatistics([FromQuery] DateTime? date)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var selectedDate = (date ?? DateTime.UtcNow).Date;
        var nextDate = selectedDate.AddDays(1);
        var monday = WeekHelper.GetMonday(selectedDate);
        var dayNumber = (int)selectedDate.DayOfWeek;

        var plan = await _db.WeeklyPlans.AsNoTracking()
            .Include(x => x.PlannedWorkouts).ThenInclude(x => x.Workout)
            .FirstOrDefaultAsync(x => x.UserId == userId && x.WeekStartDate == monday);
        var plannedToday = plan?.PlannedWorkouts.Where(x => x.DayOfWeek == dayNumber).ToList() ?? new();
        var completedToday = await _db.CompletedWorkouts.AsNoTracking()
            .Include(x => x.Workout)
            .Where(x => x.UserId == userId && x.CompletedAt >= selectedDate && x.CompletedAt < nextDate)
            .OrderByDescending(x => x.CompletedAt)
            .ToListAsync();

        var plannedCount = plannedToday.Count;
        var completedCount = completedToday.Count;
        var percentage = plannedCount == 0 ? (completedCount > 0 ? 100 : 0) :
            Math.Round(Math.Min(completedCount, plannedCount) * 100.0 / plannedCount, 1);

        return Ok(new
        {
            date = selectedDate,
            plannedCount,
            completedCount,
            totalMinutes = completedToday.Sum(x => x.DurationMinutes),
            completionPercentage = percentage,
            plannedWorkouts = plannedToday.Select(x => new { slug = x.Workout.Slug, name = x.Workout.Name, isCompleted = x.CompletedAt.HasValue }),
            completedWorkouts = completedToday.Select(x => new { slug = x.Workout.Slug, name = x.Workout.Name, x.CompletedAt, x.DurationMinutes })
        });
    }

    [HttpGet("weekly")]
    public async Task<IActionResult> GetWeeklyStatistics([FromQuery] DateTime? weekStartDate)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var monday = WeekHelper.GetMonday(weekStartDate ?? DateTime.UtcNow);
        var nextMonday = monday.AddDays(7);

        var plan = await _db.WeeklyPlans.AsNoTracking()
            .Include(x => x.PlannedWorkouts).ThenInclude(x => x.Workout)
            .FirstOrDefaultAsync(x => x.UserId == userId && x.WeekStartDate == monday);
        var plannedCount = plan?.PlannedWorkouts.Count ?? 0;
        var plannedCompletedCount = plan?.PlannedWorkouts.Count(x => x.CompletedAt.HasValue) ?? 0;
        var logs = await _db.CompletedWorkouts.AsNoTracking()
            .Include(x => x.Workout)
            .Where(x => x.UserId == userId && x.CompletedAt >= monday && x.CompletedAt < nextMonday)
            .ToListAsync();

        var percentage = plannedCount == 0 ? 0 : Math.Round(plannedCompletedCount * 100.0 / plannedCount, 1);
        var byMuscleGroup = logs.GroupBy(x => x.Workout.MuscleGroup)
            .Select(group => new { muscleGroup = group.Key, count = group.Count(), minutes = group.Sum(x => x.DurationMinutes) })
            .OrderByDescending(x => x.count)
            .ToList();

        return Ok(new
        {
            weekStartDate = monday,
            weekEndDate = nextMonday.AddDays(-1),
            plannedCount,
            plannedCompletedCount,
            completedSessionCount = logs.Count,
            totalMinutes = logs.Sum(x => x.DurationMinutes),
            completionPercentage = percentage,
            byMuscleGroup
        });
    }

    [HttpGet("history")]
    public async Task<IActionResult> GetHistory([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);
        var query = _db.CompletedWorkouts.AsNoTracking()
            .Include(x => x.Workout)
            .Where(x => x.UserId == userId);

        if (fromDate.HasValue)
            query = query.Where(x => x.CompletedAt >= fromDate.Value.Date);
        if (toDate.HasValue)
            query = query.Where(x => x.CompletedAt < toDate.Value.Date.AddDays(1));

        var totalCount = await query.CountAsync();
        var items = await query.OrderByDescending(x => x.CompletedAt)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(x => new
            {
                workoutSlug = x.Workout.Slug,
                workoutName = x.Workout.Name,
                x.Workout.MuscleGroup,
                x.CompletedAt,
                x.DurationMinutes
            }).ToListAsync();

        return Ok(new { page, pageSize, totalCount, totalPages = (int)Math.Ceiling(totalCount / (double)pageSize), items });
    }
}
