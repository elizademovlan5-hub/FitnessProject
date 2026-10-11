namespace FitnessProject.Application.DTOs.WeeklyPlan;

public class PlannedWorkoutDto
{
    public string WorkoutSlug { get; set; } = string.Empty;
    public string WorkoutName { get; set; } = string.Empty;
    public string MuscleGroup { get; set; } = string.Empty;
    public string Difficulty { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string? VideoUrl { get; set; }
    public int PreviewSeconds { get; set; }
    public int DurationMinutes { get; set; }
    public int DayOfWeek { get; set; }
    public DateTime? CompletedAt { get; set; }
}
