using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace FitnessProject.Application.Helpers;

public static class SlugHelper
{
    public static string GenerateSlug(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return "workout";
        }

        var text = value.Trim().ToLowerInvariant()
            .Replace("ə", "e").Replace("ı", "i").Replace("ş", "s")
            .Replace("ç", "c").Replace("ğ", "g").Replace("ö", "o")
            .Replace("ü", "u");

        var normalized = text.Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder();
        foreach (var character in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(character) != UnicodeCategory.NonSpacingMark)
            {
                builder.Append(character);
            }
        }

        var slug = Regex.Replace(builder.ToString(), "[^a-z0-9]+", "-").Trim('-');
        return string.IsNullOrWhiteSpace(slug) ? "workout" : slug;
    }
}
