namespace Loja.Application.Contracts.Common;

public sealed record PagedResult<T>(
    IReadOnlyCollection<T> Items,
    int PageNumber,
    int PageSize,
    int TotalRecords,
    int TotalPages)
{
    public static PagedResult<T> Create(
        IReadOnlyCollection<T> items,
        int pageNumber,
        int pageSize,
        int totalRecords)
    {
        var totalPages = totalRecords == 0
            ? 0
            : (int)Math.Ceiling(totalRecords / (double)pageSize);

        return new PagedResult<T>(items, pageNumber, pageSize, totalRecords, totalPages);
    }
}
