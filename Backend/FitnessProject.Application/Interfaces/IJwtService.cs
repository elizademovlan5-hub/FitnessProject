using FitnessProject.Domain.Entities;

namespace FitnessProject.Application.Interfaces;

public interface IJwtService
{
    string CreateToken(ApplicationUser user, IEnumerable<string> roles);
}
