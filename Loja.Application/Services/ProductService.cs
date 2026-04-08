using FluentValidation;
using Loja.Application.Contracts.Common;
using Loja.Application.Contracts.Products;
using Loja.Domain.Common;
using Loja.Domain.Constants;
using Loja.Domain.Entities;
using Loja.Domain.Repositories;
using Loja.Domain.ValueObjects;
using Microsoft.Extensions.Logging;

namespace Loja.Application.Services;

public sealed class ProductService : IProductService
{
    private const int DefaultPageNumber = 1;
    private const int DefaultPageSize = 10;
    private const int MaxPageSize = 100;
    private const int MaxSeedProducts = 1000;

    private readonly IProductRepository _productRepository;
    private readonly IValidator<CreateProductRequest> _createValidator;
    private readonly IValidator<UpdateProductRequest> _updateValidator;
    private readonly ILogger<ProductService> _logger;

    public ProductService(
        IProductRepository productRepository,
        IValidator<CreateProductRequest> createValidator,
        IValidator<UpdateProductRequest> updateValidator,
        ILogger<ProductService> logger)
    {
        _productRepository = productRepository;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
        _logger = logger;
    }

    public async Task<PagedResult<ProductItemResponse>> GetPagedAsync(
        int pageNumber,
        int pageSize,
        string? searchTerm = null,
        IReadOnlyCollection<string>? categories = null,
        IReadOnlyCollection<string>? statuses = null,
        string sortBy = "id",
        string sortDirection = "asc",
        CancellationToken cancellationToken = default)
    {
        var normalizedPageNumber = pageNumber <= 0 ? DefaultPageNumber : pageNumber;
        var normalizedPageSize = pageSize <= 0
            ? DefaultPageSize
            : Math.Min(pageSize, MaxPageSize);

        var normalizedSearchTerm = string.IsNullOrWhiteSpace(searchTerm)
            ? null
            : searchTerm.Trim();

        var normalizedCategories = categories?
            .Where(category => !string.IsNullOrWhiteSpace(category))
            .Select(category => category.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        var normalizedStatuses = statuses?
            .Where(status => !string.IsNullOrWhiteSpace(status))
            .Select(status => status.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        var normalizedSortBy = string.IsNullOrWhiteSpace(sortBy)
            ? "id"
            : sortBy.Trim();

        var normalizedSortDirection = string.Equals(sortDirection, "desc", StringComparison.OrdinalIgnoreCase)
            ? "desc"
            : "asc";

        var pagedProducts = await _productRepository.GetPagedAsync(
            normalizedPageNumber,
            normalizedPageSize,
            normalizedSearchTerm,
            normalizedCategories,
            normalizedStatuses,
            normalizedSortBy,
            normalizedSortDirection,
            cancellationToken);

        var items = pagedProducts.Items
            .Select(MapToResponse)
            .ToArray();

        return PagedResult<ProductItemResponse>.Create(
            items,
            normalizedPageNumber,
            normalizedPageSize,
            pagedProducts.TotalRecords);
    }

    public async Task<ProductItemResponse?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var product = await _productRepository.GetByIdAsync(id, cancellationToken);
        return product is null ? null : MapToResponse(product);
    }

    public async Task<ProductDashboardStatsResponse> GetDashboardStatsAsync(CancellationToken cancellationToken = default)
    {
        var snapshot = await _productRepository.GetDashboardSnapshotAsync(cancellationToken);

        var categoryItems = snapshot.CategoryStock
            .Select(item => new ProductCategoryStockResponse(item.Category, item.StockQuantity))
            .ToArray();

        return new ProductDashboardStatsResponse(
            snapshot.TotalProducts,
            snapshot.TotalInventoryValue,
            categoryItems);
    }

    public async Task<int> SeedDemoProductsAsync(int count, CancellationToken cancellationToken = default)
    {
        if (count <= 0)
        {
            throw new DomainException("A quantidade para carga ficticia deve ser maior que zero.");
        }

        if (count > MaxSeedProducts)
        {
            throw new DomainException($"A carga ficticia permite no maximo {MaxSeedProducts} produtos por execucao.");
        }

        var hasDemoSeedData = await _productRepository.HasDemoSeedDataAsync(cancellationToken);

        if (hasDemoSeedData)
        {
            throw new DomainException("A carga ficticia de produtos ja foi executada neste banco.");
        }

        var categories = new[]
        {
            ProductCategories.Electronics,
            ProductCategories.Apparel,
            ProductCategories.OfficeSupplies,
            ProductCategories.Home,
        };

        var batchCode = Guid.NewGuid().ToString("N")[..8].ToUpperInvariant();
        var products = new List<Product>(capacity: count);

        for (var index = 1; index <= count; index++)
        {
            var category = categories[(index - 1) % categories.Length];
            var price = category == ProductCategories.Electronics
                ? 50m + (index % 450) + 0.99m
                : 10m + (index % 300) + 0.49m;

            var product = Product.Create(
                sku: $"DEMO-{batchCode}-{index:0000}",
                name: $"Demo Product {index:000}",
                category: category,
                price: price,
                stockQuantity: 5 + (index % 200));

            products.Add(product);
        }

        await _productRepository.AddRangeAsync(products, cancellationToken);

        _logger.LogInformation(
            "Seeded {ProductsCount} demo products. BatchCode: {BatchCode}",
            count,
            batchCode);

        return count;
    }

    public async Task<ProductItemResponse> CreateAsync(
        CreateProductRequest request,
        CancellationToken cancellationToken = default)
    {
        await _createValidator.ValidateAndThrowAsync(request, cancellationToken);

        var sku = Sku.Parse(request.Sku);
        var skuAlreadyExists = await _productRepository.ExistsBySkuAsync(sku, cancellationToken: cancellationToken);

        if (skuAlreadyExists)
        {
            _logger.LogWarning(
                "Product creation rejected because SKU {Sku} already exists.",
                sku.Value);

            throw new DomainException("Ja existe um produto cadastrado com este SKU.");
        }

        var product = Product.Create(
            request.Sku,
            request.Name,
            request.Category,
            request.Price,
            request.StockQuantity);

        await _productRepository.AddAsync(product, cancellationToken);

        _logger.LogInformation(
            "Product created. ProductId: {ProductId}, SKU: {Sku}, Category: {Category}, Price: {Price}, StockQuantity: {StockQuantity}.",
            product.Id,
            product.Sku.Value,
            product.Category,
            product.Price,
            product.StockQuantity);

        return MapToResponse(product);
    }

    public async Task<ProductItemResponse?> UpdateAsync(
        Guid id,
        UpdateProductRequest request,
        CancellationToken cancellationToken = default)
    {
        await _updateValidator.ValidateAndThrowAsync(request, cancellationToken);

        var existingProduct = await _productRepository.GetByIdAsync(id, cancellationToken);

        if (existingProduct is null)
        {
            _logger.LogWarning(
                "Product update ignored because ProductId {ProductId} was not found.",
                id);

            return null;
        }

        var sku = Sku.Parse(request.Sku);
        var skuAlreadyExists = await _productRepository.ExistsBySkuAsync(
            sku,
            id,
            cancellationToken);

        if (skuAlreadyExists)
        {
            _logger.LogWarning(
                "Product update rejected because SKU {Sku} already exists for another product. ProductId: {ProductId}",
                sku.Value,
                id);

            throw new DomainException("Ja existe um produto cadastrado com este SKU.");
        }

        existingProduct.Update(
            request.Sku,
            request.Name,
            request.Category,
            request.Price,
            request.StockQuantity);

        await _productRepository.UpdateAsync(existingProduct, cancellationToken);

        _logger.LogInformation(
            "Product updated. ProductId: {ProductId}, SKU: {Sku}, Category: {Category}, Price: {Price}, StockQuantity: {StockQuantity}.",
            existingProduct.Id,
            existingProduct.Sku.Value,
            existingProduct.Category,
            existingProduct.Price,
            existingProduct.StockQuantity);

        return MapToResponse(existingProduct);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var existingProduct = await _productRepository.GetByIdAsync(id, cancellationToken);

        if (existingProduct is null)
        {
            _logger.LogWarning(
                "Product deletion ignored because ProductId {ProductId} was not found.",
                id);

            return false;
        }

        await _productRepository.DeleteAsync(existingProduct, cancellationToken);

        _logger.LogInformation(
            "Product deleted. ProductId: {ProductId}, SKU: {Sku}.",
            existingProduct.Id,
            existingProduct.Sku.Value);

        return true;
    }

    private static ProductItemResponse MapToResponse(Product product)
    {
        // The API never leaks domain entities. DTO mapping preserves contract stability for the frontend.
        return new ProductItemResponse(
            product.Id,
            product.Sku.Value,
            product.Name,
            product.Category,
            product.Price,
            product.StockQuantity);
    }
}
