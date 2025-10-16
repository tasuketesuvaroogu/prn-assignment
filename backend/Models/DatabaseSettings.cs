namespace ECommerce.Api.Models;

public class DatabaseSettings
{
    public string ConnectionString { get; set; } = string.Empty;
    public string DatabaseName { get; set; } = string.Empty;
    public string ProductsCollectionName { get; set; } = string.Empty;
    public string UsersCollectionName { get; set; } = string.Empty;
    public string CartsCollectionName { get; set; } = string.Empty;
    public string OrdersCollectionName { get; set; } = string.Empty;
}
