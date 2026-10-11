using System.ComponentModel.DataAnnotations;

namespace FitnessProject.Application.DTOs.Admin;

public class SetUserRoleDto
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Role { get; set; } = "User";
}
