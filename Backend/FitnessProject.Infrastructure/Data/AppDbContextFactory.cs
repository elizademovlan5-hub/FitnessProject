using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace FitnessProject.Infrastructure.Data;

// Lets Package Manager Console create migrations without running API startup code.
public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var currentDirectory = Directory.GetCurrentDirectory();
        var apiDirectory = Path.Combine(currentDirectory, "FitnessProject.API");

        if (!Directory.Exists(apiDirectory))
        {
            apiDirectory = Path.GetFullPath(Path.Combine(currentDirectory, "..", "FitnessProject.API"));
        }

        if (!File.Exists(Path.Combine(apiDirectory, "appsettings.json")))
        {
            apiDirectory = currentDirectory;
        }

        var configuration = new ConfigurationBuilder()
            .SetBasePath(apiDirectory)
            .AddJsonFile("appsettings.json", optional: false)
            .Build();

        var connectionString = configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException("DefaultConnection appsettings.json faylında tapılmadı.");
        }

        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        optionsBuilder.UseSqlServer(connectionString);
        return new AppDbContext(optionsBuilder.Options);
    }
}
