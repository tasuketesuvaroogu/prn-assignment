using ECommerce.Api.Models;
using ECommerce.Api.Models.Payments;
using ECommerce.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Stripe;
using Stripe.Checkout;

namespace ECommerce.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PaymentsController : ControllerBase
{
    private readonly OrderService _orderService;
    private readonly StripeSettings _stripeSettings;
    private readonly ILogger<PaymentsController> _logger;

    public PaymentsController(OrderService orderService, StripeSettings stripeSettings, ILogger<PaymentsController> logger)
    {
        _orderService = orderService;
        _stripeSettings = stripeSettings;
        _logger = logger;
    }

    [HttpPost("stripe/checkout-session")]
    public async Task<ActionResult<object>> CreateStripeCheckoutSession([FromBody] CreateCheckoutSessionRequest request)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        if (string.IsNullOrWhiteSpace(_stripeSettings.SecretKey))
        {
            return StatusCode(501, new { message = "Stripe secret key is not configured" });
        }

        try
        {
            StripeConfiguration.ApiKey = _stripeSettings.SecretKey;

            var order = await _orderService.GetOrderByIdAsync(request.OrderId, GetUserId());
            if (order == null)
            {
                return NotFound(new { message = "Order not found" });
            }

            var successUrl = !string.IsNullOrWhiteSpace(request.SuccessUrl)
                ? request.SuccessUrl
                : string.IsNullOrWhiteSpace(_stripeSettings.SuccessUrl)
                    ? string.Empty
                    : _stripeSettings.SuccessUrl;

            var cancelUrl = !string.IsNullOrWhiteSpace(request.CancelUrl)
                ? request.CancelUrl
                : string.IsNullOrWhiteSpace(_stripeSettings.CancelUrl)
                    ? string.Empty
                    : _stripeSettings.CancelUrl;

            if (string.IsNullOrWhiteSpace(successUrl) || string.IsNullOrWhiteSpace(cancelUrl))
            {
                return BadRequest(new { message = "Success and cancel URLs must be configured" });
            }

            successUrl = AppendQuery(successUrl, $"orderId={order.Id}");
            cancelUrl = AppendQuery(cancelUrl, $"orderId={order.Id}");

            var options = new SessionCreateOptions
            {
                PaymentMethodTypes = new List<string> { "card" },
                Mode = "payment",
                SuccessUrl = successUrl,
                CancelUrl = cancelUrl,
                ClientReferenceId = order.Id,
                LineItems = order.Items.Select(item =>
                {
                    var images = ResolveStripeImages(item.Image);
                    if (images == null && !string.IsNullOrWhiteSpace(item.Image))
                    {
                        _logger.LogWarning(
                            "Skipping image for order item {OrderId}:{ProductId} because it isn't a valid HTTP(S) URL under 2048 characters.",
                            order.Id,
                            item.ProductId
                        );
                    }

                    return new SessionLineItemOptions
                    {
                        Quantity = item.Quantity,
                        PriceData = new SessionLineItemPriceDataOptions
                        {
                            Currency = "usd",
                            UnitAmountDecimal = decimal.Round(item.Price * 100m, 0),
                            ProductData = new SessionLineItemPriceDataProductDataOptions
                            {
                                Name = item.Name,
                                Images = images
                            }
                        }
                    };
                }).ToList(),
            };

            var service = new SessionService();
            var session = await service.CreateAsync(options);
            await _orderService.AttachCheckoutSessionAsync(order.Id!, session.Id);

            return Ok(new
            {
                checkoutUrl = session.Url,
                sessionId = session.Id,
                publishableKey = _stripeSettings.PublishableKey
            });
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe error creating checkout session");
            return StatusCode(502, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating checkout session");
            return StatusCode(500, new { message = "Failed to create checkout session" });
        }
    }

    private string GetUserId()
    {
        return User?.Claims?.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException("User not authenticated");
    }

    private static string AppendQuery(string url, string query)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return url;
        }

        return url.Contains('?') ? $"{url}&{query}" : $"{url}?{query}";
    }

    private static List<string>? ResolveStripeImages(string? imageUrl)
    {
        if (string.IsNullOrWhiteSpace(imageUrl))
        {
            return null;
        }

        var trimmed = imageUrl.Trim();
        if (trimmed.Length > 2048)
        {
            return null;
        }

        if (!Uri.TryCreate(trimmed, UriKind.Absolute, out var uri))
        {
            return null;
        }

        if (!string.Equals(uri.Scheme, Uri.UriSchemeHttp, StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(uri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        return new List<string> { uri.ToString() };
    }
}
