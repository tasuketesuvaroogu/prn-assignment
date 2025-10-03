using ECommerce.Api.Models;
using ECommerce.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly ProductService _productService;
    private readonly ILogger<ProductsController> _logger;

    public ProductsController(ProductService productService, ILogger<ProductsController> logger)
    {
        _productService = productService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<object>> GetProducts(
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null)
    {
        try
        {
            var products = await _productService.GetAllAsync(page, pageSize, search);
            var total = await _productService.GetCountAsync(search);
            
            return Ok(new
            {
                products,
                pagination = new
                {
                    page,
                    pageSize,
                    total,
                    totalPages = (int)Math.Ceiling(total / (double)pageSize)
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching products");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Product>> GetProduct(string id)
    {
        try
        {
            var product = await _productService.GetByIdAsync(id);
            
            if (product == null)
            {
                return NotFound(new { message = "Product not found" });
            }

            return Ok(product);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching product {Id}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost]
    public async Task<ActionResult<Product>> CreateProduct([FromBody] Product product)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var createdProduct = await _productService.CreateAsync(product);
            return CreatedAtAction(nameof(GetProduct), new { id = createdProduct.Id }, createdProduct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating product");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> UpdateProduct(string id, [FromBody] Product product)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existingProduct = await _productService.GetByIdAsync(id);
            if (existingProduct == null)
            {
                return NotFound(new { message = "Product not found" });
            }

            product.Id = id;
            product.CreatedAt = existingProduct.CreatedAt;
            
            var updated = await _productService.UpdateAsync(id, product);
            
            if (!updated)
            {
                return NotFound(new { message = "Product not found" });
            }

            return Ok(product);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating product {Id}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteProduct(string id)
    {
        try
        {
            var deleted = await _productService.DeleteAsync(id);
            
            if (!deleted)
            {
                return NotFound(new { message = "Product not found" });
            }

            return Ok(new { message = "Product deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting product {Id}", id);
            return StatusCode(500, "Internal server error");
        }
    }
}
