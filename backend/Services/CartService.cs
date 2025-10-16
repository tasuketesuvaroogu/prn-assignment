using ECommerce.Api.Models;
using ECommerce.Api.Models.CartModels;
using MongoDB.Driver;

namespace ECommerce.Api.Services;

public class CartService
{
    private readonly IMongoCollection<Cart> _carts;
    private readonly ProductService _productService;

    public CartService(DatabaseSettings settings, ProductService productService)
    {
        var client = new MongoClient(settings.ConnectionString);
        var database = client.GetDatabase(settings.DatabaseName);
        _carts = database.GetCollection<Cart>(settings.CartsCollectionName);
        _productService = productService;

        CreateIndexesAsync().GetAwaiter().GetResult();
    }

    private async Task CreateIndexesAsync()
    {
        var userIndex = Builders<Cart>.IndexKeys.Ascending(c => c.UserId);
        await _carts.Indexes.CreateOneAsync(new CreateIndexModel<Cart>(userIndex, new CreateIndexOptions { Unique = true, Name = "idx_cart_user" }));
    }

    public async Task<Cart> GetOrCreateCartAsync(string userId)
    {
        var cart = await _carts.Find(c => c.UserId == userId).FirstOrDefaultAsync();
        if (cart != null)
        {
            return cart;
        }

        cart = new Cart
        {
            UserId = userId,
            Items = new List<CartItem>(),
            UpdatedAt = DateTime.UtcNow
        };

        await _carts.InsertOneAsync(cart);
        return cart;
    }

    public async Task<Cart> AddItemAsync(string userId, AddCartItemRequest request)
    {
        var product = await _productService.GetByIdAsync(request.ProductId)
            ?? throw new InvalidOperationException("Product not found");

        if (product.Stock <= 0)
        {
            throw new InvalidOperationException("Product is out of stock");
        }

        if (request.Quantity > product.Stock)
        {
            throw new InvalidOperationException("Requested quantity exceeds available stock");
        }

        var cart = await GetOrCreateCartAsync(userId);
        var existingItem = cart.Items.FirstOrDefault(item =>
            item.ProductId == request.ProductId &&
            string.Equals(item.Size, request.Size, StringComparison.OrdinalIgnoreCase) &&
            string.Equals(item.Color, request.Color, StringComparison.OrdinalIgnoreCase));

        if (existingItem != null)
        {
            var newQuantity = existingItem.Quantity + request.Quantity;
            if (newQuantity > product.Stock)
            {
                throw new InvalidOperationException("Requested quantity exceeds available stock");
            }

            existingItem.Quantity = newQuantity;
            existingItem.Price = product.Price;
            existingItem.Name = product.Name;
            existingItem.Image = product.Image;
        }
        else
        {
            cart.Items.Add(new CartItem
            {
                ItemId = Guid.NewGuid().ToString(),
                ProductId = product.Id!,
                Name = product.Name,
                Price = product.Price,
                Quantity = request.Quantity,
                Size = request.Size,
                Color = request.Color,
                Image = product.Image
            });
        }

        cart.UpdatedAt = DateTime.UtcNow;
        await _carts.ReplaceOneAsync(c => c.Id == cart.Id, cart);
        return cart;
    }

    public async Task<Cart> UpdateItemQuantityAsync(string userId, UpdateCartItemRequest request)
    {
        var cart = await GetOrCreateCartAsync(userId);
        var item = cart.Items.FirstOrDefault(i => i.ItemId == request.ItemId);
        if (item == null)
        {
            throw new InvalidOperationException("Cart item not found");
        }

        var product = await _productService.GetByIdAsync(item.ProductId)
            ?? throw new InvalidOperationException("Product not found");

        if (request.Quantity > product.Stock)
        {
            throw new InvalidOperationException("Requested quantity exceeds available stock");
        }

        item.Quantity = request.Quantity;
        item.Price = product.Price;
        item.Name = product.Name;
        item.Image = product.Image;
        cart.UpdatedAt = DateTime.UtcNow;
        await _carts.ReplaceOneAsync(c => c.Id == cart.Id, cart);
        return cart;
    }

    public async Task<Cart> RemoveItemAsync(string userId, string itemId)
    {
        var cart = await GetOrCreateCartAsync(userId);
        var removedCount = cart.Items.RemoveAll(i => i.ItemId == itemId);
        if (removedCount == 0)
        {
            throw new InvalidOperationException("Cart item not found");
        }

        cart.UpdatedAt = DateTime.UtcNow;
        await _carts.ReplaceOneAsync(c => c.Id == cart.Id, cart);
        return cart;
    }

    public async Task ClearCartAsync(string userId)
    {
        var cart = await GetOrCreateCartAsync(userId);
        cart.Items.Clear();
        cart.UpdatedAt = DateTime.UtcNow;
        await _carts.ReplaceOneAsync(c => c.Id == cart.Id, cart);
    }
}
