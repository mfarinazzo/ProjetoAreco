namespace Loja.Application.Contracts.Products;

public sealed record UpdateProductRequest(
    string Sku,
    string Name,
    string Category,
    decimal Price,
    int StockQuantity);
