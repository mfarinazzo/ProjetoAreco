using Loja.Domain.Entities;
using Loja.Domain.Repositories;
using Loja.Domain.ValueObjects;
using Loja.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Loja.Infrastructure.Repositories;

public sealed class ProductRepository : IProductRepository
{
    private readonly LojaDbContext _dbContext;

    public ProductRepository(LojaDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<PagedProductsResult> GetPagedAsync(
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Products
            .AsNoTracking()
            .OrderBy(product => product.Name);

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
