using System.ComponentModel.DataAnnotations;

namespace FitnessProject.Application.DTOs.Profile;

public class UpdateProfileDto
{
    [Required, StringLength(100, MinimumLength = 2)]
    public string FullName { get; set; } = string.Empty;

    [Range(100, 250)]
    public double? HeightCm { get; set; }

    [Range(25, 350)]
    public double? WeightKg { get; set; }

    [StringLength(300)]
    public string? FitnessGoal { get; set; }
}
