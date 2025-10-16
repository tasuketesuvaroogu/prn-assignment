using MongoDB.Bson.Serialization.Attributes;

namespace ECommerce.Api.Models;

public class OrderItem
{
    [BsonElement("productId")]
    public string ProductId { get; set; } = string.Empty;

    [BsonElement("name")]
    public string Name { get; set; } = string.Empty;

    [BsonElement("price")]
    public decimal Price { get; set; }

    [BsonElement("quantity")]
    public int Quantity { get; set; }

    [BsonElement("size")]
    public string? Size { get; set; }

    [BsonElement("color")]
    public string? Color { get; set; }

    [BsonElement("image")]
    public string? Image { get; set; }

    [BsonIgnore]
    public decimal Subtotal => Price * Quantity;
}
