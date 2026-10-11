namespace FitnessProject.Application.Helpers;

public static class WeekHelper
{
    public static DateTime GetMonday(DateTime date)
    {
        var day = (int)date.DayOfWeek;
        var daysSinceMonday = (day + 6) % 7;
        return date.Date.AddDays(-daysSinceMonday);
    }
}
