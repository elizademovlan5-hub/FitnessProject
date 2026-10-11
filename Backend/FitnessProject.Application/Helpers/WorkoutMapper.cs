using FitnessProject.Application.DTOs.Workouts;
using FitnessProject.Domain.Entities;

namespace FitnessProject.Application.Helpers;

public static class WorkoutMapper
{
    public static WorkoutDto ToDto(Workout workout)
    {
        return new WorkoutDto
        {
            Slug = workout.Slug,
            Name = workout.Name,
            Description = workout.Description,
            MuscleGroup = workout.MuscleGroup,
            Difficulty = workout.Difficulty,
            CategoryName = workout.Category?.Name ?? string.Empty,
            ImageUrl = workout.ImageUrl,
            VideoUrl = workout.VideoUrl,
            PreviewSeconds = workout.PreviewSeconds,
            DurationMinutes = workout.DurationMinutes
        };
    }
}
