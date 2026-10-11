using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using FitnessProject.Application.Interfaces;
using Microsoft.Extensions.Configuration;

namespace FitnessProject.Infrastructure.Services;

public class CloudinaryService : ICloudinaryService
{
    readonly Cloudinary? _cloudinary;
    public bool IsConfigured { get; }

    public CloudinaryService(IConfiguration configuration)
    {
        var cloudName = configuration["Cloudinary:CloudName"];
        var apiKey = configuration["Cloudinary:ApiKey"];
        var apiSecret = configuration["Cloudinary:ApiSecret"];
        IsConfigured = !string.IsNullOrWhiteSpace(cloudName) &&
                       !string.IsNullOrWhiteSpace(apiKey) &&
                       !string.IsNullOrWhiteSpace(apiSecret);

        if (IsConfigured)
        {
            _cloudinary = new Cloudinary(new Account(cloudName, apiKey, apiSecret));
        }
    }

    public async Task<string> UploadImageAsync(Stream stream, string fileName, string folder)
    {
        if (_cloudinary is null)
        {
            throw new InvalidOperationException("Cloudinary parametrləri appsettings.json faylında qurulmayıb.");
        }

        var result = await _cloudinary.UploadAsync(new ImageUploadParams
        {
            File = new FileDescription(fileName, stream),
            Folder = folder,
            Transformation = new Transformation().Width(1200).Crop("limit")
        });

        if (result.Error is not null || result.SecureUrl is null)
        {
            throw new InvalidOperationException(result.Error?.Message ?? "Şəkil Cloudinary-yə yüklənmədi.");
        }

        return result.SecureUrl.ToString();
    }

    public async Task<string> UploadVideoAsync(Stream stream, string fileName, string folder)
    {
        if (_cloudinary is null)
        {
            throw new InvalidOperationException("Cloudinary parametrləri appsettings.json faylında qurulmayıb.");
        }

        var result = await _cloudinary.UploadAsync(new VideoUploadParams
        {
            File = new FileDescription(fileName, stream),
            Folder = folder
        });

        if (result.Error is not null || result.SecureUrl is null)
        {
            throw new InvalidOperationException(result.Error?.Message ?? "Video Cloudinary-yə yüklənmədi.");
        }

        return result.SecureUrl.ToString();
    }
}
