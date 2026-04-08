using FluentAssertions;
using Loja.Application.Contracts.Products;
using Loja.Application.Services;
using Loja.Application.Validators.Products;
using Loja.Domain.Common;
using Loja.Domain.Entities;
using Loja.Domain.Repositories;
using Loja.Domain.ValueObjects;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace Loja.Tests.Application;

public sealed class ProductServiceTests
{
    [Fact]
    public async Task CreateAsync_ShouldThrowDomainException_WhenSkuAlreadyExists()
    {
        // Arrange
        var repositoryMock = new Mock<IProductRepository>();
        repositoryMock
            .Setup(repository => repository.ExistsBySkuAsync(
                It.IsAny<Sku>(),
                null,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var sut = CreateSut(repositoryMock);
        var request = new CreateProductRequest(
            Sku: "SKU-DUP-001",
            Name: "Wireless Headset",
            Category: "Electronics",
            Price: 299.90m,
            StockQuantity: 12);

        // Act
        Func<Task> act = async () => await sut.CreateAsync(request, CancellationToken.None);

        // Assert
        await act.Should()
            .ThrowAsync<DomainException>()
            .WithMessage("*SKU*");

        repositoryMock.Verify(
            repository => repository.AddAsync(It.IsAny<Product>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task UpdateAsync_ShouldThrowDomainException_WhenSkuAlreadyExistsForAnotherProduct()
    {
        // Arrange
        var repositoryMock = new Mock<IProductRepository>();
        var productId = Guid.NewGuid();
        var existingProduct = Product.Create("SKU-OLD-001", "Office Chair", "Office Supplies", 450m, 7);

        repositoryMock
            .Setup(repository => repository.GetByIdAsync(productId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingProduct);

        repositoryMock
            .Setup(repository => repository.ExistsBySkuAsync(
                It.IsAny<Sku>(),
                productId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var sut = CreateSut(repositoryMock);
        var request = new UpdateProductRequest(
            Sku: "SKU-OLD-001",
            Name: "Office Chair Pro",
            Category: "Office Supplies",
            Price: 499.90m,
            StockQuantity: 10);

        // Act
        Func<Task> act = async () => await sut.UpdateAsync(productId, request, CancellationToken.None);

        // Assert
        await act.Should()
            .ThrowAsync<DomainException>()
            .WithMessage("*SKU*");

        repositoryMock.Verify(
            repository => repository.UpdateAsync(It.IsAny<Product>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private static ProductService CreateSut(Mock<IProductRepository> repositoryMock)
    {
        var createValidator = new CreateProductRequestValidator();
        var updateValidator = new UpdateProductRequestValidator();
        var loggerMock = new Mock<ILogger<ProductService>>();

        return new ProductService(
            repositoryMock.Object,
            createValidator,
            updateValidator,
            loggerMock.Object);
    }
}