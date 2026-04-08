namespace Loja.Domain.Repositories;

public sealed record ProductDashboardSnapshot(
    int TotalProducts,
    decimal TotalInventoryValue,
    IReadOnlyCollection<CategoryStockSnapshot> CategoryStock);

public sealed record CategoryStockSnapshot(
    string Category,
    int StockQuantity);
