namespace Loja.Application.Contracts.Products;

public sealed record ProductDashboardStatsResponse(
    int TotalProducts,
    decimal TotalInventoryValue,
    IReadOnlyCollection<ProductCategoryStockResponse> Categories,
    int LowStockProducts);

public sealed record ProductCategoryStockResponse(
    string Category,
    int StockQuantity);
