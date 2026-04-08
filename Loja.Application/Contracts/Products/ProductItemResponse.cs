namespace Loja.Application.Contracts.Products;

public sealed record ProductItemResponse(
    Guid Id,
    string Sku,
    string Name,
    string Category,
    decimal Price,
    int StockQuantity);
