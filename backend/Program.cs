using ECommerce.Api.Models;
using ECommerce.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Configure Database Settings
var databaseSettings = new DatabaseSettings
{
    ConnectionString = builder.Configuration.GetValue<string>("DatabaseSettings:ConnectionString") ?? "mongodb://localhost:27017",
    DatabaseName = builder.Configuration.GetValue<string>("DatabaseSettings:DatabaseName") ?? "ECommerceDb",
    ProductsCollectionName = builder.Configuration.GetValue<string>("DatabaseSettings:ProductsCollectionName") ?? "Products"
};

// Add services to the container
builder.Services.AddSingleton(databaseSettings);
builder.Services.AddSingleton<ProductService>();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        });
});

var app = builder.Build();


app.UseSwagger();
app.UseSwaggerUI();


app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();

app.Run();
