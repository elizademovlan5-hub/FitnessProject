using System.ComponentModel.DataAnnotations;

namespace FitnessProject.Application.DTOs.Admin;

public class SetUserStatusDto
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}
