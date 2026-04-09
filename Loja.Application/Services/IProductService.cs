using Loja.Application.Contracts.Common;
using Loja.Application.Contracts.Products;

namespace Loja.Application.Services;

public interface IProductService
{
    Task<PagedResult<ProductItemResponse>> GetPagedAsync(
        int pageNumber,
        int pageSize,
        string? searchTerm = null,
        IReadOnlyCollection<string>? categories = null,
        IReadOnlyCollection<string>? statuses = null,
        string sortBy = "id",
        string sortDirection = "asc",
        CancellationToken cancellationToken = default);

    Task<ProductItemResponse?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<ProductDashboardStatsResponse> GetDashboardStatsAsync(CancellationToken cancellationToken = default);

    Task<int> SeedDemoProductsAsync(int count, CancellationToken cancellationToken = default);

    Task<ProductItemResponse> CreateAsync(
        CreateProductRequest request,
        CancellationToken cancellationToken = default);

    Task<ProductItemResponse?> UpdateAsync(
        Guid id,
        UpdateProductRequest request,
        CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
