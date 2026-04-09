namespace Loja.Application.Contracts.Products;

public sealed record SeedProductsResponse(
    int RequestedCount,
    int CreatedCount);
