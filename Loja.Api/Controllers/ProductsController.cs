using Loja.Application.Contracts.Common;
using Loja.Application.Contracts.Products;
using Loja.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace Loja.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class ProductsController : ControllerBase
{
    private readonly IProductService _productService;

    public ProductsController(IProductService productService)
    {
        _productService = productService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<ProductItemResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<ProductItemResponse>>> GetProductsAsync(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? searchTerm = null,
        [FromQuery] string[]? categories = null,
        [FromQuery] string[]? statuses = null,
        [FromQuery] string sortBy = "id",
        [FromQuery] string sortDirection = "asc",
        CancellationToken cancellationToken = default)
    {
        var result = await _productService.GetPagedAsync(
            pageNumber,
            pageSize,
            searchTerm,
            categories,
            statuses,
            sortBy,
            sortDirection,
            cancellationToken);

        return Ok(result);
    }

    [HttpGet("dashboard-stats")]
    [ProducesResponseType(typeof(ProductDashboardStatsResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<ProductDashboardStatsResponse>> GetDashboardStatsAsync(
        CancellationToken cancellationToken = default)
    {
        var result = await _productService.GetDashboardStatsAsync(cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}", Name = "GetProductById")]
    [ProducesResponseType(typeof(ProductItemResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProductItemResponse>> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var product = await _productService.GetByIdAsync(id, cancellationToken);

        if (product is null)
        {
            return NotFound();
        }

        return Ok(product);
    }

    [HttpPost]
    [ProducesResponseType(typeof(ProductItemResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemResponse), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ProductItemResponse>> CreateAsync(
        [FromBody] CreateProductRequest request,
        CancellationToken cancellationToken = default)
    {
        var createdProduct = await _productService.CreateAsync(request, cancellationToken);

        return CreatedAtRoute(
            "GetProductById",
            new { id = createdProduct.Id },
            createdProduct);
    }

    [HttpPost("seed-demo")]
    [ProducesResponseType(typeof(SeedProductsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemResponse), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<SeedProductsResponse>> SeedDemoProductsAsync(
        [FromQuery] int count = 232,
        CancellationToken cancellationToken = default)
    {
        var normalizedCount = count <= 0 ? 232 : count;
        var createdCount = await _productService.SeedDemoProductsAsync(normalizedCount, cancellationToken);

        return Ok(new SeedProductsResponse(
            RequestedCount: normalizedCount,
            CreatedCount: createdCount));
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ProductItemResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ValidationProblemResponse), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ProductItemResponse>> UpdateAsync(
        Guid id,
        [FromBody] UpdateProductRequest request,
        CancellationToken cancellationToken = default)
    {
        var updatedProduct = await _productService.UpdateAsync(id, request, cancellationToken);

        if (updatedProduct is null)
        {
            return NotFound();
        }

        return Ok(updatedProduct);
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var deleted = await _productService.DeleteAsync(id, cancellationToken);

        if (!deleted)
        {
            return NotFound();
        }

        return NoContent();
    }
}
