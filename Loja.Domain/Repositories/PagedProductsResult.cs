using Loja.Domain.Entities;

namespace Loja.Domain.Repositories;

public sealed record PagedProductsResult(
    IReadOnlyCollection<Product> Items,
    int TotalRecords);
