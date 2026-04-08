namespace Loja.Application.Contracts.Products;

public sealed record ProductDashboardStatsResponse(
    int TotalProducts,
    decimal TotalInventoryValue,
    IReadOnlyCollection<ProductCategoryStockResponse> Categories);

public sealed record ProductCategoryStockResponse(
    string Category,
    int StockQuantity);
