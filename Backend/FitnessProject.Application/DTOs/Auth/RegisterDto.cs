using System.ComponentModel.DataAnnotations;

namespace FitnessProject.Application.DTOs.Auth;

public class RegisterDto
{
    [Required, StringLength(100, MinimumLength = 2)]
    public string FullName { get; set; } = string.Empty;

    [Required, EmailAddress, StringLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(8), StringLength(100)]
    public string Password { get; set; } = string.Empty;
}
