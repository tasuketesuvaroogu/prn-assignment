using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.ComponentModel.DataAnnotations;

namespace ECommerce.Api.Models;

public class Product
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [Required]
    [BsonElement("name")]
    public string Name { get; set; } = string.Empty;

    [Required]
    [BsonElement("description")]
    public string Description { get; set; } = string.Empty;

    [Required]
    [BsonElement("price")]
    public decimal Price { get; set; }

    [BsonElement("image")]
    public string? Image { get; set; }

    [Required]
    [BsonElement("category")]
    public string Category { get; set; } = string.Empty;

    [Required]
    [BsonElement("sizes")]
    public List<string> Sizes { get; set; } = new();

    [Required]
    [BsonElement("colors")]
    public List<string> Colors { get; set; } = new();

    [Required]
    [BsonElement("stock")]
    public int Stock { get; set; } = 0;

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
