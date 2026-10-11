using System.ComponentModel.DataAnnotations;

namespace FitnessProject.Application.DTOs.Workouts;

public class CreateWorkoutDto
{
    [Required, StringLength(120, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [Required, StringLength(2000, MinimumLength = 5)]
    public string Description { get; set; } = string.Empty;

    [Required, StringLength(60)]
    public string MuscleGroup { get; set; } = string.Empty;

    [Required, StringLength(30)]
    public string Difficulty { get; set; } = "Beginner";

    [Required, StringLength(80)]
    public string CategoryName { get; set; } = string.Empty;

    [Url]
    public string? ImageUrl { get; set; }

    [Url]
    public string? VideoUrl { get; set; }

    [Range(7, 8)]
    public int PreviewSeconds { get; set; } = 8;

    [Range(1, 240)]
    public int DurationMinutes { get; set; } = 10;
}
