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

    public async Task<List<Product>> GetAllAsync(
        int page = 1,
        int pageSize = 10,
        string? search = null,
        string? category = null,
        decimal? minPrice = null,
        decimal? maxPrice = null)
    {
        var filters = BuildFilters(search, category, minPrice, maxPrice);

        return await _products.Find(filters)
            .Skip((page - 1) * pageSize)
            .Limit(pageSize)
            .ToListAsync();
    }

    public async Task<long> GetCountAsync(
        string? search = null,
        string? category = null,
        decimal? minPrice = null,
        decimal? maxPrice = null)
    {
        var filters = BuildFilters(search, category, minPrice, maxPrice);

        return await _products.CountDocumentsAsync(filters);
    }

    private FilterDefinition<Product> BuildFilters(string? search, string? category, decimal? minPrice, decimal? maxPrice)
    {
        var filterBuilder = Builders<Product>.Filter;
        var filters = new List<FilterDefinition<Product>>();

        if (!string.IsNullOrEmpty(search))
        {
            var regex = new MongoDB.Bson.BsonRegularExpression(search, "i");
            filters.Add(filterBuilder.Or(
                filterBuilder.Regex(p => p.Name, regex),
                filterBuilder.Regex(p => p.Description, regex)));
        }

        if (!string.IsNullOrWhiteSpace(category))
        {
            filters.Add(filterBuilder.Eq(p => p.Category, category));
        }

        if (minPrice.HasValue)
        {
            filters.Add(filterBuilder.Gte(p => p.Price, minPrice.Value));
        }

        if (maxPrice.HasValue)
        {
            filters.Add(filterBuilder.Lte(p => p.Price, maxPrice.Value));
        }

        return filters.Count switch
        {
            0 => filterBuilder.Empty,
            1 => filters[0],
            _ => filterBuilder.And(filters)
        };
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
