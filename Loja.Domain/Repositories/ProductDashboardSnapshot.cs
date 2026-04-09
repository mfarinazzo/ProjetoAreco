namespace Loja.Domain.Repositories;

public sealed record ProductDashboardSnapshot(
    int TotalProducts,
    decimal TotalInventoryValue,
    IReadOnlyCollection<CategoryStockSnapshot> CategoryStock,
    int LowStockProducts);

public sealed record CategoryStockSnapshot(
    string Category,
    int StockQuantity);
