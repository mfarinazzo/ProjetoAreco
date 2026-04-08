using Loja.Domain.Entities;
using Loja.Domain.Repositories;
using Loja.Domain.ValueObjects;
using Loja.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Loja.Infrastructure.Repositories;

public sealed class ProductRepository : IProductRepository
{
    private const int LowStockThreshold = 10;

    private readonly LojaDbContext _dbContext;

    public ProductRepository(LojaDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<PagedProductsResult> GetPagedAsync(
        int pageNumber,
        int pageSize,
        string? searchTerm = null,
        IReadOnlyCollection<string>? categories = null,
        IReadOnlyCollection<string>? statuses = null,
        string sortBy = "id",
        string sortDirection = "asc",
        CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Products.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var normalizedSearchTerm = searchTerm.Trim();
            query = query.Where(product =>
                EF.Functions.Like(EF.Property<string>(product, nameof(Product.Sku)), $"%{normalizedSearchTerm}%") ||
                EF.Functions.Like(product.Name, $"%{normalizedSearchTerm}%") ||
                EF.Functions.Like(product.Category, $"%{normalizedSearchTerm}%"));
        }

        if (categories is { Count: > 0 })
        {
            var normalizedCategories = categories
                .Where(category => !string.IsNullOrWhiteSpace(category))
                .Select(category => category.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray();

            if (normalizedCategories.Length > 0)
            {
                query = query.Where(product => normalizedCategories.Contains(product.Category));
            }
        }

        if (statuses is { Count: > 0 })
        {
            var normalizedStatuses = statuses
                .Where(status => !string.IsNullOrWhiteSpace(status))
                .Select(status => status.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray();

            var containsLowStock = normalizedStatuses.Contains("lowStock", StringComparer.OrdinalIgnoreCase);
            var containsInStock = normalizedStatuses.Contains("inStock", StringComparer.OrdinalIgnoreCase);

            if (containsLowStock && !containsInStock)
            {
                query = query.Where(product => product.StockQuantity < LowStockThreshold);
            }
            else if (!containsLowStock && containsInStock)
            {
                query = query.Where(product => product.StockQuantity >= LowStockThreshold);
            }
        }

        var sortByNormalized = string.IsNullOrWhiteSpace(sortBy) ? "id" : sortBy.Trim();
        var sortDescending = string.Equals(sortDirection, "desc", StringComparison.OrdinalIgnoreCase);

        query = sortByNormalized.ToLowerInvariant() switch
        {
            "price" => sortDescending
                ? query.OrderByDescending(product => product.Price).ThenBy(product => product.Id)
                : query.OrderBy(product => product.Price).ThenBy(product => product.Id),
            "stockquantity" => sortDescending
                ? query.OrderByDescending(product => product.StockQuantity).ThenBy(product => product.Id)
                : query.OrderBy(product => product.StockQuantity).ThenBy(product => product.Id),
            _ => sortDescending
                ? query.OrderByDescending(product => product.Id)
                : query.OrderBy(product => product.Id),
        };

        var totalRecords = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedProductsResult(items, totalRecords);
    }

    public Task<Product?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return _dbContext.Products
            .AsNoTracking()
            .FirstOrDefaultAsync(product => product.Id == id, cancellationToken);
    }

    public async Task<ProductDashboardSnapshot> GetDashboardSnapshotAsync(CancellationToken cancellationToken = default)
    {
        var products = _dbContext.Products.AsNoTracking();

        var totalProducts = await products.CountAsync(cancellationToken);

        var totalInventoryValue = totalProducts == 0
            ? 0m
            : (await products
                .Select(product => new { product.Price, product.StockQuantity })
                .ToListAsync(cancellationToken))
                .Sum(item => item.Price * item.StockQuantity);

        var categoryStockRows = await products
            .GroupBy(product => product.Category)
            .Select(group => new
            {
                Category = group.Key,
                StockQuantity = group.Sum(product => product.StockQuantity),
            })
            .OrderByDescending(item => item.StockQuantity)
            .ToListAsync(cancellationToken);

        var categoryStock = categoryStockRows
            .Select(item => new CategoryStockSnapshot(item.Category, item.StockQuantity))
            .ToArray();

        return new ProductDashboardSnapshot(totalProducts, totalInventoryValue, categoryStock);
    }

    public Task<bool> HasDemoSeedDataAsync(CancellationToken cancellationToken = default)
    {
        return _dbContext.Products
            .AsNoTracking()
            .AnyAsync(
                product => EF.Property<string>(product, nameof(Product.Sku)).StartsWith("DEMO-"),
                cancellationToken);
    }

    public Task<bool> ExistsBySkuAsync(
        Sku sku,
        Guid? ignoreProductId = null,
        CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Products.AsNoTracking();

        if (ignoreProductId.HasValue)
        {
            query = query.Where(product => product.Id != ignoreProductId.Value);
        }

        // EF Core translates the value-converted SKU equality to a string comparison in SQL.
        return query.AnyAsync(product => product.Sku == sku, cancellationToken);
    }

    public async Task AddAsync(Product product, CancellationToken cancellationToken = default)
    {
        await _dbContext.Products.AddAsync(product, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task AddRangeAsync(IEnumerable<Product> products, CancellationToken cancellationToken = default)
    {
        await _dbContext.Products.AddRangeAsync(products, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(Product product, CancellationToken cancellationToken = default)
    {
        _dbContext.Products.Update(product);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Product product, CancellationToken cancellationToken = default)
    {
        _dbContext.Products.Remove(product);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
