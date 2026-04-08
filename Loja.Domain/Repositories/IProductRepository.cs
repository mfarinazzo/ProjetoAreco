using Loja.Domain.Entities;
using Loja.Domain.ValueObjects;

namespace Loja.Domain.Repositories;

public interface IProductRepository
{
    Task<PagedProductsResult> GetPagedAsync(
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<Product?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<ProductDashboardSnapshot> GetDashboardSnapshotAsync(CancellationToken cancellationToken = default);

    Task<bool> ExistsBySkuAsync(Sku sku, Guid? ignoreProductId = null, CancellationToken cancellationToken = default);

    Task AddAsync(Product product, CancellationToken cancellationToken = default);

    Task UpdateAsync(Product product, CancellationToken cancellationToken = default);

    Task DeleteAsync(Product product, CancellationToken cancellationToken = default);
}
