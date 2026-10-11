using System.ComponentModel.DataAnnotations;

namespace FitnessProject.Application.DTOs.Auth;

public class VerifyOtpDto
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required, RegularExpression(@"^\d{6}$", ErrorMessage = "OTP 6 rəqəm olmalıdır.")]
    public string Code { get; set; } = string.Empty;
}
