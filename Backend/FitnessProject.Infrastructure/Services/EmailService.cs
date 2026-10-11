using System.Net;
using System.Net.Mail;
using FitnessProject.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FitnessProject.Infrastructure.Services;

public class EmailService : IEmailService
{
    readonly IConfiguration _configuration;
    readonly IHostEnvironment _environment;
    readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration configuration, IHostEnvironment environment, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _environment = environment;
        _logger = logger;
    }

    public async Task<bool> SendOtpAsync(string email, string code)
    {
        var host = _configuration["Email:Smtp:Host"];
        var username = _configuration["Email:Smtp:Username"];
        var password = _configuration["Email:Smtp:Password"];
        var fromEmail = _configuration["Email:Smtp:FromEmail"];

        if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(username) ||
            string.IsNullOrWhiteSpace(password) || string.IsNullOrWhiteSpace(fromEmail))
        {
            if (_environment.IsDevelopment())
            {
                _logger.LogWarning("SMTP qurulmayıb. YALNIZ DEVELOPMENT üçün {Email} ünvanının OTP kodu: {Code}", email, code);
                return false;
            }

            throw new InvalidOperationException("Email OTP göndərmək üçün Email:Smtp parametrlərini qurun.");
        }

        var port = int.TryParse(_configuration["Email:Smtp:Port"], out var parsedPort) ? parsedPort : 587;
        var enableSsl = !bool.TryParse(_configuration["Email:Smtp:EnableSsl"], out var ssl) || ssl;
        var fromName = _configuration["Email:Smtp:FromName"] ?? "FitnessProject";

        using var message = new MailMessage
        {
            From = new MailAddress(fromEmail, fromName),
            Subject = "FitnessProject email təsdiqi",
            IsBodyHtml = true,
            Body = $"<p>Salam!</p><p>Email təsdiq kodunuz: <strong>{code}</strong></p><p>Kod 10 dəqiqə ərzində etibarlıdır.</p>"
        };
        message.To.Add(email);

        using var client = new SmtpClient(host, port)
        {
            EnableSsl = enableSsl,
            Credentials = new NetworkCredential(username, password)
        };

        await client.SendMailAsync(message);
        return true;
    }
}
