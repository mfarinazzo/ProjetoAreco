using FluentAssertions;
using Loja.Domain.Common;
using Loja.Domain.Entities;
using Xunit;

namespace Loja.Tests.Domain;

public sealed class ProductTests
{
    [Fact]
    public void Create_ShouldThrowDomainException_WhenStockIsNegative()
    {
        // Arrange
        const string sku = "SKU-NEG-STOCK";
        const string name = "Wireless Mouse";
        const string category = "Electronics";
        const decimal price = 120m;
        const int stockQuantity = -1;

        // Act
        Action act = () => Product.Create(sku, name, category, price, stockQuantity);

        // Assert
        act.Should()
            .Throw<DomainException>()
            .WithMessage("*estoque*negativo*");
    }

    [Fact]
    public void Update_ShouldThrowDomainException_WhenStockIsNegative()
    {
        // Arrange
        var product = Product.Create("SKU-UPD-STOCK", "Gaming Keyboard", "Electronics", 250m, 10);

        // Act
        Action act = () => product.Update("SKU-UPD-STOCK", "Gaming Keyboard", "Electronics", 250m, -5);

        // Assert
        act.Should()
            .Throw<DomainException>()
            .WithMessage("*estoque*negativo*");
    }

    [Fact]
    public void Create_ShouldThrowDomainException_WhenCategoryIsElectronicsAndPriceIsLowerThan50()
    {
        // Arrange
        const string sku = "SKU-ELEC-LOW";
        const string name = "Smart Sensor";
        const string category = "Electronics";
        const decimal price = 49.99m;
        const int stockQuantity = 15;

        // Act
        Action act = () => Product.Create(sku, name, category, price, stockQuantity);

        // Assert
        act.Should()
            .Throw<DomainException>()
            .WithMessage("*Electronics*preco minimo de 50.00*");
    }

    [Fact]
    public void Update_ShouldThrowDomainException_WhenCategoryIsElectronicsAndPriceIsLowerThan50()
    {
        // Arrange
        var product = Product.Create("SKU-UPD-ELEC", "Desk Lamp", "Home", 40m, 8);

        // Act
        Action act = () => product.Update("SKU-UPD-ELEC", "Desk Lamp", "Electronics", 49m, 8);

        // Assert
        act.Should()
            .Throw<DomainException>()
            .WithMessage("*Electronics*preco minimo de 50.00*");
    }

    [Fact]
    public void Create_ShouldNotThrow_WhenCategoryIsNotElectronicsAndPriceIsLowerThan50()
    {
        // Arrange
        const string sku = "SKU-APP-LOW";
        const string name = "Cotton T-Shirt";
        const string category = "Apparel";
        const decimal price = 19.90m;
        const int stockQuantity = 30;

        // Act
        Action act = () => Product.Create(sku, name, category, price, stockQuantity);

        // Assert
        act.Should().NotThrow();
    }
}