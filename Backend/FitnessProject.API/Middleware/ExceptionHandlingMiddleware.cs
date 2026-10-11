namespace FitnessProject.API.Middleware;

public class ExceptionHandlingMiddleware
{
    readonly RequestDelegate _next;
    readonly ILogger<ExceptionHandlingMiddleware> _logger;
    readonly IWebHostEnvironment _environment;

    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger,
        IWebHostEnvironment environment)
    {
        _next = next;
        _logger = logger;
        _environment = environment;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "API request işlənərkən xəta baş verdi.");
            if (context.Response.HasStarted)
            {
                throw;
            }

            context.Response.Clear();
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/json";
            var message = _environment.IsDevelopment()
                ? exception.Message
                : "Server xətası baş verdi. Konfiqurasiyanı və server loglarını yoxlayın.";

            await context.Response.WriteAsJsonAsync(new { message });
        }
    }
}
