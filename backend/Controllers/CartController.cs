using System.Security.Claims;
using ECommerce.Api.Models.CartModels;
using ECommerce.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CartController : ControllerBase
{
    private readonly CartService _cartService;
    private readonly ILogger<CartController> _logger;

    public CartController(CartService cartService, ILogger<CartController> logger)
    {
        _cartService = cartService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<object>> GetCart()
    {
        try
        {
            var userId = GetUserId();
            var cart = await _cartService.GetOrCreateCartAsync(userId);
            return Ok(new
            {
                cart.Items,
                total = cart.Total,
                updatedAt = cart.UpdatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching cart");
            return StatusCode(500, new { message = "Failed to load cart" });
        }
    }

    [HttpPost("items")]
    public async Task<ActionResult<object>> AddItem([FromBody] AddCartItemRequest request)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            var userId = GetUserId();
            var cart = await _cartService.AddItemAsync(userId, request);
            return Ok(new
            {
                cart.Items,
                total = cart.Total
            });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Business rule violation when adding item to cart");
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding item to cart");
            return StatusCode(500, new { message = "Failed to add item to cart" });
        }
    }

    [HttpPut("items")]
    public async Task<ActionResult<object>> UpdateItem([FromBody] UpdateCartItemRequest request)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            var userId = GetUserId();
            var cart = await _cartService.UpdateItemQuantityAsync(userId, request);
            return Ok(new
            {
                cart.Items,
                total = cart.Total
            });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Business rule violation when updating cart item");
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating cart item");
            return StatusCode(500, new { message = "Failed to update cart item" });
        }
    }

    [HttpDelete("items/{itemId}")]
    public async Task<ActionResult<object>> RemoveItem(string itemId)
    {
        try
        {
            var userId = GetUserId();
            var cart = await _cartService.RemoveItemAsync(userId, itemId);
            return Ok(new
            {
                cart.Items,
                total = cart.Total
            });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Business rule violation when removing cart item");
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing cart item");
            return StatusCode(500, new { message = "Failed to remove cart item" });
        }
    }

    [HttpDelete]
    public async Task<ActionResult> ClearCart()
    {
        try
        {
            var userId = GetUserId();
            await _cartService.ClearCartAsync(userId);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing cart");
            return StatusCode(500, new { message = "Failed to clear cart" });
        }
    }

    private string GetUserId()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            throw new UnauthorizedAccessException("User identifier not found in token");
        }
        return userId;
    }
}
