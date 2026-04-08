using Loja.Domain.Entities;
using Loja.Domain.ValueObjects;

namespace Loja.Domain.Repositories;

public interface IProductRepository
{
    Task<bool> ExistsBySkuAsync(Sku sku, Guid? ignoreProductId = null, CancellationToken cancellationToken = default);

    Task AddAsync(Product product, CancellationToken cancellationToken = default);
}
