using Microsoft.AspNetCore.Identity;

namespace FitnessProject.Domain.Entities;

public class ApplicationUser : IdentityUser
{
    public string FullName { get; set; } = string.Empty;
    public string? ProfilePhotoUrl { get; set; }
    public double? HeightCm { get; set; }
    public double? WeightKg { get; set; }
    public string? FitnessGoal { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public List<CompletedWorkout> CompletedWorkouts { get; set; } = new();
    public List<MonthlyProgressPhoto> MonthlyProgressPhotos { get; set; } = new();
}
