using System.ComponentModel.DataAnnotations;

namespace FitnessProject.Application.DTOs.Auth;

public class ResendOtpDto
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;
}
