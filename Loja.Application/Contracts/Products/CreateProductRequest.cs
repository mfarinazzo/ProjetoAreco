namespace Loja.Application.Contracts.Products;

public sealed record CreateProductRequest(
    string Sku,
    string Name,
    string Category,
    decimal Price,
    int StockQuantity);
