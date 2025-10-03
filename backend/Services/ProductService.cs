using ECommerce.Api.Models;
using MongoDB.Driver;

namespace ECommerce.Api.Services;

public class ProductService
{
    private readonly IMongoCollection<Product> _products;

    public ProductService(DatabaseSettings settings)
    {
        var client = new MongoClient(settings.ConnectionString);
        var database = client.GetDatabase(settings.DatabaseName);
        _products = database.GetCollection<Product>(settings.ProductsCollectionName);
    }

    public async Task<List<Product>> GetAllAsync(int page = 1, int pageSize = 10, string? search = null)
    {
        var filter = Builders<Product>.Filter.Empty;
        
        if (!string.IsNullOrEmpty(search))
        {
            var searchFilter = Builders<Product>.Filter.Or(
                Builders<Product>.Filter.Regex("name", new MongoDB.Bson.BsonRegularExpression(search, "i")),
                Builders<Product>.Filter.Regex("description", new MongoDB.Bson.BsonRegularExpression(search, "i"))
            );
            filter = searchFilter;
        }

        return await _products.Find(filter)
            .Skip((page - 1) * pageSize)
            .Limit(pageSize)
            .ToListAsync();
    }

    public async Task<long> GetCountAsync(string? search = null)
    {
        var filter = Builders<Product>.Filter.Empty;
        
        if (!string.IsNullOrEmpty(search))
        {
            var searchFilter = Builders<Product>.Filter.Or(
                Builders<Product>.Filter.Regex("name", new MongoDB.Bson.BsonRegularExpression(search, "i")),
                Builders<Product>.Filter.Regex("description", new MongoDB.Bson.BsonRegularExpression(search, "i"))
            );
            filter = searchFilter;
        }

        return await _products.CountDocumentsAsync(filter);
    }

    public async Task<Product?> GetByIdAsync(string id)
    {
        return await _products.Find(p => p.Id == id).FirstOrDefaultAsync();
    }

    public async Task<Product> CreateAsync(Product product)
    {
        product.CreatedAt = DateTime.UtcNow;
        product.UpdatedAt = DateTime.UtcNow;
        await _products.InsertOneAsync(product);
        return product;
    }

    public async Task<bool> UpdateAsync(string id, Product product)
    {
        product.UpdatedAt = DateTime.UtcNow;
        var result = await _products.ReplaceOneAsync(p => p.Id == id, product);
        return result.ModifiedCount > 0;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var result = await _products.DeleteOneAsync(p => p.Id == id);
        return result.DeletedCount > 0;
    }
}
