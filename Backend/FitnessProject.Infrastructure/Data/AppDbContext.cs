using FitnessProject.Domain.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace FitnessProject.Infrastructure.Data;

public class AppDbContext : IdentityDbContext<ApplicationUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Workout> Workouts => Set<Workout>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<WeeklyPlan> WeeklyPlans => Set<WeeklyPlan>();
    public DbSet<PlannedWorkout> PlannedWorkouts => Set<PlannedWorkout>();
    public DbSet<CompletedWorkout> CompletedWorkouts => Set<CompletedWorkout>();
    public DbSet<MonthlyProgressPhoto> MonthlyProgressPhotos => Set<MonthlyProgressPhoto>();
    public DbSet<EmailVerification> EmailVerifications => Set<EmailVerification>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Workout>().HasIndex(x => x.Slug).IsUnique();
        builder.Entity<Workout>().Property(x => x.Name).HasMaxLength(120);
        builder.Entity<Workout>().Property(x => x.Slug).HasMaxLength(160);
        builder.Entity<Workout>().Property(x => x.MuscleGroup).HasMaxLength(60);
        builder.Entity<Workout>().Property(x => x.Difficulty).HasMaxLength(30);
        builder.Entity<Workout>()
            .HasOne(x => x.Category)
            .WithMany(x => x.Workouts)
            .HasForeignKey(x => x.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Category>().HasIndex(x => x.Slug).IsUnique();
        builder.Entity<Category>().Property(x => x.Name).HasMaxLength(80);
        builder.Entity<Category>().Property(x => x.Slug).HasMaxLength(100);

        builder.Entity<WeeklyPlan>().HasIndex(x => new { x.UserId, x.WeekStartDate }).IsUnique();
        builder.Entity<WeeklyPlan>()
            .HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<PlannedWorkout>()
            .HasOne(x => x.WeeklyPlan)
            .WithMany(x => x.PlannedWorkouts)
            .HasForeignKey(x => x.WeeklyPlanId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<PlannedWorkout>()
            .HasOne(x => x.Workout)
            .WithMany()
            .HasForeignKey(x => x.WorkoutId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.Entity<PlannedWorkout>().HasIndex(x => new { x.WeeklyPlanId, x.WorkoutId }).IsUnique();

        builder.Entity<CompletedWorkout>()
            .HasOne(x => x.User)
            .WithMany(x => x.CompletedWorkouts)
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<CompletedWorkout>()
            .HasOne(x => x.Workout)
            .WithMany()
            .HasForeignKey(x => x.WorkoutId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<MonthlyProgressPhoto>()
            .HasOne(x => x.User)
            .WithMany(x => x.MonthlyProgressPhotos)
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<MonthlyProgressPhoto>().HasIndex(x => new { x.UserId, x.PhotoMonth }).IsUnique();

        builder.Entity<EmailVerification>()
            .HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<EmailVerification>().HasIndex(x => new { x.UserId, x.IsUsed });
    }
}
