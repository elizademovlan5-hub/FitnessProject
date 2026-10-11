using FitnessProject.Domain.Entities;
using FitnessProject.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace FitnessProject.API.Seed;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(IServiceProvider services, IConfiguration configuration)
    {
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var db = services.GetRequiredService<AppDbContext>();

        foreach (var role in new[] { "User", "Admin" })
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                var result = await roleManager.CreateAsync(new IdentityRole(role));
                if (!result.Succeeded)
                {
                    throw new InvalidOperationException(string.Join("; ", result.Errors.Select(x => x.Description)));
                }
            }
        }

        var categories = new[] { "Strength", "Cardio", "Mobility" };
        foreach (var categoryName in categories)
        {
            var slug = FitnessProject.Application.Helpers.SlugHelper.GenerateSlug(categoryName);
            if (!await db.Categories.AnyAsync(x => x.Slug == slug))
            {
                db.Categories.Add(new Category { Name = categoryName, Slug = slug });
            }
        }
        await db.SaveChangesAsync();

        // Demo workouts are added once, so a new database is not empty on first run.
        var categoryLookup = await db.Categories
            .ToDictionaryAsync(x => x.Slug, x => x.Id);

        var sampleWorkouts = new (string Name, string Description, string MuscleGroup,
            string Difficulty, string CategorySlug, int DurationMinutes)[]
        {
            ("Push-up", "Əllər və ayaq ucları üzərində bədəni düz saxlayın. Sinəni yerə yaxınlaşdırıb yenidən yuxarı qalxın.", "Chest", "Beginner", "strength", 8),
            ("Bodyweight Squat", "Ayaqları çiyin enində açın. Ombanı arxaya verərək rahat dərinliyə enin və başlanğıc vəziyyətinə qayıdın.", "Legs", "Beginner", "strength", 10),
            ("Reverse Lunge", "Bir ayağı geriyə addımladın, hər iki dizinizi rahat şəkildə bükün və başlanğıc vəziyyətinə qayıdın. Tərəfləri növbələyin.", "Legs", "Beginner", "strength", 8),
            ("Glute Bridge", "Arxası üstə uzanın, dizləri bükün. Ombanı qaldırın, qısa saxlayın və nəzarətlə endirin.", "Glutes", "Beginner", "strength", 8),
            ("Plank", "Dirsəkləri çiyinlərin altına qoyun, bədəni düz saxlayın və rahat nəfəs alaraq mövqeni qoruyun.", "Core", "Beginner", "strength", 5),
            ("Pike Push-up", "Ombanı yuxarı qaldıraraq tərs V mövqeyi alın. Dirsəkləri büküb başınızı nəzarətlə aşağı endirin.", "Shoulders", "Intermediate", "strength", 6),
            ("Jumping Jacks", "Ayaqları yanlara açıb qolları yuxarı qaldırın, sonra başlanğıc vəziyyətinə qayıdın. Rahat temp seçin.", "Full Body", "Beginner", "cardio", 5),
            ("High Knees", "Yerində yüngül qaçış edin və dizləri növbə ilə qaldırın. Sürəti fiziki hazırlığınıza uyğunlaşdırın.", "Cardio", "Intermediate", "cardio", 5),
            ("Mountain Climbers", "Plank mövqeyindən dizləri növbə ilə sinəyə doğru gətirin. Ombanı mümkün qədər sabit saxlayın.", "Core", "Intermediate", "cardio", 6),
            ("March in Place", "Yerində addımlayın, qolları təbii şəkildə hərəkət etdirin. Bu, yüngül isinmə üçün uyğundur.", "Cardio", "Beginner", "cardio", 5),
            ("Cat-Cow Stretch", "Dörd ətraf üzərində dayanaraq nəfəs ritminə uyğun beli növbə ilə yumrulayın və yüngülcə aşağı əyin.", "Back", "Beginner", "mobility", 5),
            ("Hip Flexor Stretch", "Bir ayağı irəli, digərini arxaya qoyun. Bədəni dik saxlayıb ombanı azca irəli aparın və tərəfləri dəyişin.", "Hips", "Beginner", "mobility", 6)
        };

        foreach (var sample in sampleWorkouts)
        {
            var slug = FitnessProject.Application.Helpers.SlugHelper.GenerateSlug(sample.Name);
            if (await db.Workouts.AnyAsync(x => x.Slug == slug))
                continue;

            db.Workouts.Add(new Workout
            {
                Name = sample.Name,
                Slug = slug,
                Description = sample.Description,
                MuscleGroup = sample.MuscleGroup,
                Difficulty = sample.Difficulty,
                CategoryId = categoryLookup[sample.CategorySlug],
                PreviewSeconds = 8,
                DurationMinutes = sample.DurationMinutes,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });
        }

        await db.SaveChangesAsync();

        var adminEmail = configuration["Admin:Email"];
        var adminPassword = configuration["Admin:Password"];
        if (string.IsNullOrWhiteSpace(adminEmail) || string.IsNullOrWhiteSpace(adminPassword))
        {
            return;
        }

        var admin = await userManager.FindByEmailAsync(adminEmail);
        if (admin is null)
        {
            admin = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                FullName = configuration["Admin:FullName"] ?? "Fitness Administrator",
                EmailConfirmed = true,
                IsActive = true
            };
            var createResult = await userManager.CreateAsync(admin, adminPassword);
            if (!createResult.Succeeded)
            {
                throw new InvalidOperationException("Admin yaradıla bilmədi: " + string.Join("; ", createResult.Errors.Select(x => x.Description)));
            }
        }

        if (!await userManager.IsInRoleAsync(admin, "Admin"))
        {
            var roleResult = await userManager.AddToRoleAsync(admin, "Admin");
            if (!roleResult.Succeeded)
            {
                throw new InvalidOperationException("Admin rolu verilə bilmədi: " + string.Join("; ", roleResult.Errors.Select(x => x.Description)));
            }
        }
    }
}
