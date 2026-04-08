namespace Loja.Application.Contracts.Common;

public sealed record ValidationProblemResponse(
    string Type,
    string Title,
    int Status,
    string Detail,
    string? TraceId,
    IReadOnlyDictionary<string, string[]> Errors);
