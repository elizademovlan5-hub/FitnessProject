namespace FitnessProject.Application.Interfaces;

public interface ICloudinaryService
{
    bool IsConfigured { get; }
    Task<string> UploadImageAsync(Stream stream, string fileName, string folder);
    Task<string> UploadVideoAsync(Stream stream, string fileName, string folder);
}
