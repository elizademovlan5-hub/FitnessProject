namespace FitnessProject.Domain.Entities;

public class PlannedWorkout
{
    public int Id { get; set; }
    public int WeeklyPlanId { get; set; }
    public WeeklyPlan WeeklyPlan { get; set; } = null!;
    public int WorkoutId { get; set; }
    public Workout Workout { get; set; } = null!;
    // DayOfWeek uses .NET numbering: Sunday=0 ... Saturday=6.
    public int DayOfWeek { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
}
