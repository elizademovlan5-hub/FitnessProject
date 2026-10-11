using System.ComponentModel.DataAnnotations;

namespace FitnessProject.Application.DTOs.WeeklyPlan;

public class AddPlannedWorkoutDto
{
    [Required]
    public string WorkoutSlug { get; set; } = string.Empty;

    [Range(0, 6)]
    public int DayOfWeek { get; set; }

    public DateTime? WeekStartDate { get; set; }
}
