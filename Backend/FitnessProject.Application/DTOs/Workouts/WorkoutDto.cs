namespace FitnessProject.Application.DTOs.Workouts;

public class WorkoutDto
{
    public string Slug { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string MuscleGroup { get; set; } = string.Empty;
    public string Difficulty { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string? VideoUrl { get; set; }
    public int PreviewSeconds { get; set; }
    public int DurationMinutes { get; set; }
}
