using System.Security.Claims;
using ECommerce.Api.Models;
using ECommerce.Api.Models.Orders;
using ECommerce.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly CartService _cartService;
    private readonly OrderService _orderService;
    private readonly ILogger<OrdersController> _logger;

    public OrdersController(CartService cartService, OrderService orderService, ILogger<OrdersController> logger)
    {
        _cartService = cartService;
        _orderService = orderService;
        _logger = logger;
    }

    [HttpPost("checkout")]
    public async Task<ActionResult<object>> Checkout([FromBody] PlaceOrderRequest request)
    {
        try
        {
            var userId = GetUserId();
            var cart = await _cartService.GetOrCreateCartAsync(userId);

            if (cart.Items.Count == 0)
            {
                return BadRequest(new { message = "Cart is empty" });
            }

            var order = await _orderService.CreateOrderAsync(userId, cart);
            await _cartService.ClearCartAsync(userId);

            return Ok(new
            {
                order,
                message = "Order created successfully"
            });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Business rule violation during checkout");
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating order");
            return StatusCode(500, new { message = "Failed to create order" });
        }
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetOrders()
    {
        try
        {
            var userId = GetUserId();
            var orders = await _orderService.GetOrdersForUserAsync(userId);
            return Ok(orders);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching orders");
            return StatusCode(500, new { message = "Failed to load orders" });
        }
    }

    [HttpGet("{orderId}")]
    public async Task<ActionResult<object>> GetOrderById(string orderId)
    {
        try
        {
            var userId = GetUserId();
            var order = await _orderService.GetOrderByIdAsync(orderId, userId);
            if (order == null)
            {
                return NotFound(new { message = "Order not found" });
            }

            return Ok(order);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching order {OrderId}", orderId);
            return StatusCode(500, new { message = "Failed to load order" });
        }
    }

    [HttpPost("{orderId}/confirm")]
    public async Task<ActionResult<object>> ConfirmPayment(string orderId, [FromBody] ConfirmOrderPaymentRequest request)
    {
        try
        {
            var userId = GetUserId();
            var existing = await _orderService.GetOrderByIdAsync(orderId, userId);
            if (existing == null)
            {
                return NotFound(new { message = "Order not found" });
            }

            var updated = await _orderService.UpdateStatusAsync(orderId, OrderStatus.Paid, request.PaymentReference);
            return Ok(new { order = updated, message = "Order marked as paid" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error confirming payment for order {OrderId}", orderId);
            return StatusCode(500, new { message = "Failed to confirm payment" });
        }
    }

    [HttpPost("{orderId}/cancel")]
    public async Task<ActionResult<object>> CancelOrder(string orderId)
    {
        try
        {
            var userId = GetUserId();
            var existing = await _orderService.GetOrderByIdAsync(orderId, userId);
            if (existing == null)
            {
                return NotFound(new { message = "Order not found" });
            }

            var updated = await _orderService.UpdateStatusAsync(orderId, OrderStatus.Cancelled);
            return Ok(new { order = updated, message = "Order cancelled" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cancelling order {OrderId}", orderId);
            return StatusCode(500, new { message = "Failed to cancel order" });
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
