using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FitnessProject.Application.Interfaces;
using FitnessProject.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace FitnessProject.Infrastructure.Services;

public class JwtService : IJwtService
{
    readonly IConfiguration _configuration;

    public JwtService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string CreateToken(ApplicationUser user, IEnumerable<string> roles)
    {
        var keyText = _configuration["Jwt:Key"];
        if (string.IsNullOrWhiteSpace(keyText) || Encoding.UTF8.GetByteCount(keyText) < 32)
        {
            throw new InvalidOperationException("Jwt:Key ən azı 32 bayt uzunluqda olmalıdır.");
        }

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Name, user.UserName ?? user.Email ?? user.Id),
            new(ClaimTypes.Email, user.Email ?? string.Empty)
        };

        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyText));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);
        var expiryMinutes = int.TryParse(_configuration["Jwt:ExpiryMinutes"], out var minutes) ? minutes : 60;

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
