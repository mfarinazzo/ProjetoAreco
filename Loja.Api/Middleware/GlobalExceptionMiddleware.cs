using FluentValidation;
using Loja.Application.Contracts.Common;
using Loja.Domain.Common;
using Microsoft.AspNetCore.Mvc;

namespace Loja.Api.Middleware;

public sealed class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(
        RequestDelegate next,
        ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception exception) when (!context.Response.HasStarted)
        {
            await HandleExceptionAsync(context, exception);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        switch (exception)
        {
            case ValidationException validationException:
                _logger.LogWarning(
                    validationException,
                    "Validation failed for request {Method} {Path}. TraceId: {TraceId}",
                    context.Request.Method,
                    context.Request.Path,
                    context.TraceIdentifier);

                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                await context.Response.WriteAsJsonAsync(BuildValidationProblemResponse(context, validationException));
                return;

            case DomainException domainException:
                _logger.LogWarning(
                    domainException,
                    "Business rule violation for request {Method} {Path}. TraceId: {TraceId}",
                    context.Request.Method,
                    context.Request.Path,
                    context.TraceIdentifier);

                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                await context.Response.WriteAsJsonAsync(BuildBusinessProblemDetails(context, domainException.Message));
                return;

            default:
                _logger.LogError(
                    exception,
                    "Unhandled exception for request {Method} {Path}. TraceId: {TraceId}",
                    context.Request.Method,
                    context.Request.Path,
                    context.TraceIdentifier);

                context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                await context.Response.WriteAsJsonAsync(BuildServerErrorProblemDetails(context));
                return;
        }
    }

    private static ValidationProblemResponse BuildValidationProblemResponse(
        HttpContext context,
        ValidationException exception)
    {
        var errors = exception.Errors
            .GroupBy(error => error.PropertyName)
            .ToDictionary(
                group => group.Key,
                group => group.Select(error => error.ErrorMessage).ToArray());

        return new ValidationProblemResponse(
            Type: "https://datatracker.ietf.org/doc/html/rfc7231#section-6.5.1",
            Title: "One or more validation errors occurred.",
            Status: StatusCodes.Status400BadRequest,
            Detail: "See the Errors property for more details.",
            TraceId: context.TraceIdentifier,
            Errors: errors);
    }

    private static ProblemDetails BuildBusinessProblemDetails(HttpContext context, string detail)
    {
        return new ProblemDetails
        {
            Type = "https://datatracker.ietf.org/doc/html/rfc7231#section-6.5.1",
            Title = "Business rule validation failed.",
            Status = StatusCodes.Status400BadRequest,
            Detail = detail,
            Extensions =
            {
                ["traceId"] = context.TraceIdentifier,
            },
        };
    }

    private static ProblemDetails BuildServerErrorProblemDetails(HttpContext context)
    {
        return new ProblemDetails
        {
            Type = "https://datatracker.ietf.org/doc/html/rfc7231#section-6.6.1",
            Title = "An unexpected server error occurred.",
            Status = StatusCodes.Status500InternalServerError,
            Detail = "Try again later or contact support if the issue persists.",
            Extensions =
            {
                ["traceId"] = context.TraceIdentifier,
            },
        };
    }
}
