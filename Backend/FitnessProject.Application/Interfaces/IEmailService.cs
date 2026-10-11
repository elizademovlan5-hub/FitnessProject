namespace FitnessProject.Application.Interfaces;

public interface IEmailService
{
    // Returns false only when Development mode falls back to a Swagger-visible test OTP.
    Task<bool> SendOtpAsync(string email, string code);
}
