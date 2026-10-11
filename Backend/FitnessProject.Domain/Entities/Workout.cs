namespace FitnessProject.Domain.Entities;

public class Workout
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string MuscleGroup { get; set; } = string.Empty;
    public string Difficulty { get; set; } = "Beginner";
    public string? ImageUrl { get; set; }
    public string? VideoUrl { get; set; }
    public int PreviewSeconds { get; set; } = 8;
    public int DurationMinutes { get; set; } = 10;
    public bool IsActive { get; set; } = true;
    public int CategoryId { get; set; }
    public Category Category { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
