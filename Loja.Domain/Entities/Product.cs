using Loja.Domain.Common;
using Loja.Domain.Constants;
using Loja.Domain.ValueObjects;

namespace Loja.Domain.Entities;

public sealed class Product
{
    public Guid Id { get; private set; }

    public Sku Sku { get; private set; }

    public string Name { get; private set; }

    public string Category { get; private set; }

    public decimal Price { get; private set; }

    public int StockQuantity { get; private set; }

    private Product(Guid id, Sku sku, string name, string category, decimal price, int stockQuantity)
    {
        Id = id;
        Sku = sku;
        Name = name;
        Category = category;
        Price = price;
        StockQuantity = stockQuantity;

        ValidateBusinessRules();
    }

    public static Product Create(string sku, string name, string category, decimal price, int stockQuantity)
    {
        return new Product(
            Guid.NewGuid(),
            Sku.Parse(sku),
            NormalizeName(name),
            NormalizeCategory(category),
            price,
            stockQuantity);
    }

    public void Update(string sku, string name, string category, decimal price, int stockQuantity)
    {
        Sku = Sku.Parse(sku);
        Name = NormalizeName(name);
        Category = NormalizeCategory(category);
        Price = price;
        StockQuantity = stockQuantity;

        ValidateBusinessRules();
    }

    private static string NormalizeName(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new DomainException("O nome do produto deve ser informado.");
        }

        var normalized = value.Trim();

        if (normalized.Length > 120)
        {
            throw new DomainException("O nome do produto deve ter no maximo 120 caracteres.");
        }

        return normalized;
    }

    private static string NormalizeCategory(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new DomainException("A categoria deve ser informada.");
        }

        var normalized = value.Trim().ToUpperInvariant();

        if (normalized.Length > 50)
        {
            throw new DomainException("A categoria deve ter no maximo 50 caracteres.");
        }

        return normalized;
    }

    private void ValidateBusinessRules()
    {
        if (StockQuantity < 0)
        {
            throw new DomainException("O estoque nao pode ser negativo.");
        }

        if (Price < 0)
        {
            throw new DomainException("O preco nao pode ser negativo.");
        }

        if (Category == ProductCategories.Electronic && Price < 50m)
        {
            throw new DomainException("Produtos da categoria ELETRONICO devem ter preco minimo de 50.00.");
        }
    }
}
