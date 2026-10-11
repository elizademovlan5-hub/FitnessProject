using FitnessProject.Application.Helpers;
using FitnessProject.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitnessProject.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WorkoutsController : ControllerBase
{
    readonly AppDbContext _db;

    public WorkoutsController(AppDbContext db)
    {
        _db = db;
    }

    // Example query URL: /api/Workouts?search=push&muscleGroup=Chest&difficulty=Beginner&category=strength&page=1&pageSize=12
    [HttpGet]
    public async Task<IActionResult> GetWorkouts(
        [FromQuery] string? search,
        [FromQuery] string? muscleGroup,
        [FromQuery] string? difficulty,
        [FromQuery] string? category,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);
        var query = _db.Workouts.AsNoTracking()
            .Include(x => x.Category)
            .Where(x => x.IsActive);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(x => x.Name.Contains(term) || x.Description.Contains(term));
        }
        if (!string.IsNullOrWhiteSpace(muscleGroup))
        {
            query = query.Where(x => x.MuscleGroup == muscleGroup.Trim());
        }
        if (!string.IsNullOrWhiteSpace(difficulty))
        {
            query = query.Where(x => x.Difficulty == difficulty.Trim());
        }
        if (!string.IsNullOrWhiteSpace(category))
        {
            var categoryValue = category.Trim();
            query = query.Where(x => x.Category.Slug == categoryValue || x.Category.Name == categoryValue);
        }

        var totalCount = await query.CountAsync();
        var items = await query.OrderBy(x => x.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new
        {
            page,
            pageSize,
            totalCount,
            totalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
            items = items.Select(WorkoutMapper.ToDto)
        });
    }

    [HttpGet("{slug}")]
    public async Task<IActionResult> GetWorkoutBySlug(string slug)
    {
        var workout = await _db.Workouts.AsNoTracking()
            .Include(x => x.Category)
            .FirstOrDefaultAsync(x => x.Slug == slug && x.IsActive);
        if (workout is null) return NotFound(new { message = "Məşq tapılmadı." });
        return Ok(WorkoutMapper.ToDto(workout));
    }
}
