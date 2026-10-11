namespace FitnessProject.Domain.Entities;

public class WeeklyPlan
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public DateTime WeekStartDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public List<PlannedWorkout> PlannedWorkouts { get; set; } = new();
}
