using ECommerce.Api.Models;
using MongoDB.Driver;

namespace ECommerce.Api.Services;

public class OrderService
{
    private readonly IMongoCollection<Order> _orders;

    public OrderService(DatabaseSettings settings)
    {
        var client = new MongoClient(settings.ConnectionString);
        var database = client.GetDatabase(settings.DatabaseName);
        _orders = database.GetCollection<Order>(settings.OrdersCollectionName);

        CreateIndexesAsync().GetAwaiter().GetResult();
    }

    private async Task CreateIndexesAsync()
    {
        var userIndex = Builders<Order>.IndexKeys.Ascending(o => o.UserId);
        await _orders.Indexes.CreateOneAsync(new CreateIndexModel<Order>(userIndex, new CreateIndexOptions { Name = "idx_orders_user" }));
    }

    public async Task<Order> CreateOrderAsync(string userId, Cart cart)
    {
        if (cart.Items.Count == 0)
        {
            throw new InvalidOperationException("Cart is empty");
        }

        var order = new Order
        {
            UserId = userId,
            Items = cart.Items.Select(item => new OrderItem
            {
                ProductId = item.ProductId,
                Name = item.Name,
                Price = item.Price,
                Quantity = item.Quantity,
                Size = item.Size,
                Color = item.Color,
                Image = item.Image
            }).ToList(),
            TotalAmount = cart.Items.Sum(i => i.Price * i.Quantity),
            Status = OrderStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _orders.InsertOneAsync(order);
        return order;
    }

    public async Task<List<Order>> GetOrdersForUserAsync(string userId)
    {
        return await _orders.Find(o => o.UserId == userId)
            .SortByDescending(o => o.CreatedAt)
            .ToListAsync();
    }

    public async Task<Order?> GetOrderByIdAsync(string orderId, string? userId = null)
    {
        var filter = Builders<Order>.Filter.Eq(o => o.Id, orderId);
        if (!string.IsNullOrWhiteSpace(userId))
        {
            filter &= Builders<Order>.Filter.Eq(o => o.UserId, userId);
        }

        return await _orders.Find(filter).FirstOrDefaultAsync();
    }

    public async Task<Order?> UpdateStatusAsync(string orderId, string status, string? paymentReference = null)
    {
        var update = Builders<Order>.Update
            .Set(o => o.Status, status)
            .Set(o => o.UpdatedAt, DateTime.UtcNow);

        if (!string.IsNullOrWhiteSpace(paymentReference))
        {
            update = update.Set(o => o.PaymentReference, paymentReference);
        }

        var filter = Builders<Order>.Filter.Eq(o => o.Id, orderId);
        var options = new FindOneAndUpdateOptions<Order, Order> { ReturnDocument = ReturnDocument.After };

        return await _orders.FindOneAndUpdateAsync(filter, update, options);
    }

    public async Task<Order?> AttachCheckoutSessionAsync(string orderId, string sessionId)
    {
        var update = Builders<Order>.Update
            .Set(o => o.CheckoutSessionId, sessionId)
            .Set(o => o.UpdatedAt, DateTime.UtcNow);

        var filter = Builders<Order>.Filter.Eq(o => o.Id, orderId);
        var options = new FindOneAndUpdateOptions<Order, Order> { ReturnDocument = ReturnDocument.After };

        return await _orders.FindOneAndUpdateAsync(filter, update, options);
    }
}
