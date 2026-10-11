namespace FitnessProject.Domain.Entities;

public class MonthlyProgressPhoto
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; } = null!;
    public string PhotoUrl { get; set; } = string.Empty;
    // First day of the month; one photo per user per month.
    public DateTime PhotoMonth { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
}
