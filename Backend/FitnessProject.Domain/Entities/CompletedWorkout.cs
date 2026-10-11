namespace FitnessProject.Domain.Entities;

public class CompletedWorkout
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; } = null!;
    public int WorkoutId { get; set; }
    public Workout Workout { get; set; } = null!;
    public DateTime CompletedAt { get; set; } = DateTime.UtcNow;
    public int DurationMinutes { get; set; }
}
