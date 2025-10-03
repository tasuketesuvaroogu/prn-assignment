import { component$, useSignal, $ } from "@builder.io/qwik";
import { routeLoader$, useNavigate } from "@builder.io/qwik-city";
import { productApi } from "~/services/productService";

export const useProduct = routeLoader$(async ({ params }) => {
  try {
    return await productApi.getById(params.id);
  } catch (error) {
    return null;
  }
});

export default component$(() => {
  const product = useProduct();
  const nav = useNavigate();
  const isDeleting = useSignal(false);

  const handleDelete = $(async () => {
    if (!product.value?.id) return;
    
    if (confirm("Are you sure you want to delete this product?")) {
      isDeleting.value = true;
      try {
        await productApi.delete(product.value.id);
        await nav("/");
      } catch (error) {
        alert("Failed to delete product");
        isDeleting.value = false;
      }
    }
  });

  if (!product.value) {
    return (
      <div class="container">
        <div class="error">Product not found</div>
        <a href="/" class="btn btn-primary">Back to Products</a>
      </div>
    );
  }

  return (
    <div class="container">
      <div class="product-detail">
        <div class="product-detail-content">
          <div>
            {product.value.image ? (
              <img
                src={product.value.image}
                alt={product.value.name}
                class="product-detail-image"
              />
            ) : (
              <div 
                class="product-detail-image"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#e0e0e0",
                  color: "#999"
                }}
              >
                No Image Available
              </div>
            )}
          </div>
          <div class="product-detail-info">
            <h1>{product.value.name}</h1>
            <p class="product-detail-price">${product.value.price.toFixed(2)}</p>
            <p class="product-detail-description">{product.value.description}</p>
            
            <div class="btn-group">
              <a href={`/products/${product.value.id}/edit`} class="btn btn-primary">
                Edit Product
              </a>
              <button
                class="btn btn-danger"
                onClick$={handleDelete}
                disabled={isDeleting.value}
              >
                {isDeleting.value ? "Deleting..." : "Delete Product"}
              </button>
              <a href="/" class="btn btn-secondary">
                Back to Products
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
