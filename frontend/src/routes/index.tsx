import { component$, useSignal, $ } from "@builder.io/qwik";
import { routeLoader$, useNavigate } from "@builder.io/qwik-city";
import { productApi } from "~/services/productService";
import type { Product } from "~/types/product";

export const useProducts = routeLoader$(async ({ query }) => {
  const page = parseInt(query.get("page") || "1");
  const search = query.get("search") || "";
  
  try {
    return await productApi.getAll(page, 12, search);
  } catch (error) {
    return { products: [], pagination: { page: 1, pageSize: 12, total: 0, totalPages: 0 } };
  }
});

export default component$(() => {
  const productsData = useProducts();
  const searchQuery = useSignal("");
  const nav = useNavigate();

  const handleSearch = $(async () => {
    const params = new URLSearchParams();
    if (searchQuery.value) {
      params.set("search", searchQuery.value);
    }
    await nav(`/?${params.toString()}`);
  });

  const handlePageChange = $(async (page: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set("page", page.toString());
    await nav(`/?${params.toString()}`);
  });

  return (
    <div class="container">
      <h2 style={{ marginBottom: "24px", fontSize: "28px", color: "#2c3e50" }}>
        Our Products
      </h2>

      <div class="search-box">
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery.value}
          onInput$={(e) => (searchQuery.value = (e.target as HTMLInputElement).value)}
          onKeyPress$={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
        />
      </div>

      {productsData.value.products.length === 0 ? (
        <div class="loading">
          <p>No products found. <a href="/products/new">Add your first product</a></p>
        </div>
      ) : (
        <>
          <div class="products-grid">
            {productsData.value.products.map((product: Product) => (
              <a 
                key={product.id} 
                href={`/products/${product.id}`}
                class="product-card"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    class="product-image"
                  />
                ) : (
                  <div 
                    class="product-image" 
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      backgroundColor: "#e0e0e0",
                      color: "#999"
                    }}
                  >
                    No Image
                  </div>
                )}
                <div class="product-info">
                  <h3 class="product-name">{product.name}</h3>
                  <p class="product-description">{product.description}</p>
                  <p class="product-price">${product.price.toFixed(2)}</p>
                </div>
              </a>
            ))}
          </div>

          {productsData.value.pagination.totalPages > 1 && (
            <div class="pagination">
              <button
                onClick$={() => handlePageChange(productsData.value.pagination.page - 1)}
                disabled={productsData.value.pagination.page === 1}
              >
                Previous
              </button>
              <span>
                Page {productsData.value.pagination.page} of {productsData.value.pagination.totalPages}
              </span>
              <button
                onClick$={() => handlePageChange(productsData.value.pagination.page + 1)}
                disabled={productsData.value.pagination.page >= productsData.value.pagination.totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
});
