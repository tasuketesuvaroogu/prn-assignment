// API utility functions for backend communication

// Backend API Product structure (matches updated backend schema)
export interface ApiProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  category: string;
  sizes: string[];
  colors: string[];
  stock: number;
}

// Extended Product interface for frontend use (includes createdAt for UI)
export interface Product extends ApiProduct {
  createdAt: string;
}

export interface ProductFormData {
  name: string;
  description: string;
  price: number;
  image?: string;
  category: string;
  sizes: string[];
  colors: string[];
  stock: number;
}

// Extend Window interface for runtime config
declare global {
  interface Window {
    __ENV__?: {
      VITE_API_URL?: string;
    };
  }
}

// Get API URL from runtime config (injected by Docker) or build-time env
function getApiUrl(): string {
  // Try runtime config first (production Docker)
  if (typeof window !== 'undefined' && window.__ENV__?.VITE_API_URL) {
    return window.__ENV__.VITE_API_URL;
  }
  // Fallback to build-time env or localhost
  return (import.meta as any).env?.VITE_API_URL || 'http://localhost:6124/api';
}

// Base API URL - uses runtime config for production, build-time for dev
const API_BASE_URL = getApiUrl();

// Helper to convert API product to extended Product with UI fields
function enhanceProduct(apiProduct: ApiProduct): Product {
  return {
    ...apiProduct,
    createdAt: new Date().toISOString(),
  };
}

// Get all products with optional filters
export async function getProducts(
  page: number = 1,
  limit: number = 12,
  search?: string,
  category?: string,
  minPrice?: number,
  maxPrice?: number
): Promise<{ products: Product[]; total: number }> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  const response = await fetch(`${API_BASE_URL}/products?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }
  
  const data = await response.json();
  
  // Handle different response formats
  let apiProducts: ApiProduct[] = [];
  if (Array.isArray(data)) {
    apiProducts = data;
  } else if (data.products && Array.isArray(data.products)) {
    apiProducts = data.products;
  } else if (data.data && Array.isArray(data.data)) {
    apiProducts = data.data;
  } else {
    console.warn('Unexpected API response format:', data);
    throw new Error('Invalid response format from API');
  }
  
  // Convert API products to extended Product format
  let products = apiProducts.map(enhanceProduct);
  
  // Apply client-side filters for fields not supported by API
  if (search) {
    const searchLower = search.toLowerCase();
    products = products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower)
    );
  }
  
  if (category && category !== 'All') {
    products = products.filter((product) => product.category === category);
  }
  
  if (minPrice !== undefined) {
    products = products.filter((product) => product.price >= minPrice);
  }
  
  if (maxPrice !== undefined) {
    products = products.filter((product) => product.price <= maxPrice);
  }
  
  return {
    products,
    total: products.length,
  };
}

// Get single product by ID
export async function getProductById(id: string): Promise<Product> {
  const response = await fetch(`${API_BASE_URL}/products/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch product');
  }
  const apiProduct: ApiProduct = await response.json();
  return enhanceProduct(apiProduct);
}

// Create new product
export async function createProduct(data: ProductFormData): Promise<Product> {
  const response = await fetch(`${API_BASE_URL}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: data.name,
      description: data.description,
      price: data.price,
      image: data.image || '',
      category: data.category,
      sizes: data.sizes,
      colors: data.colors,
      stock: data.stock,
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create product');
  }
  
  const apiProduct: ApiProduct = await response.json();
  return enhanceProduct(apiProduct);
}

// Update existing product
export async function updateProduct(id: string, data: ProductFormData): Promise<Product> {
  const response = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: data.name,
      description: data.description,
      price: data.price,
      image: data.image || '',
      category: data.category,
      sizes: data.sizes,
      colors: data.colors,
      stock: data.stock,
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update product');
  }
  
  const apiProduct: ApiProduct = await response.json();
  return enhanceProduct(apiProduct);
}

// Delete product
export async function deleteProduct(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete product');
  }
}

// Upload image to backend
export async function uploadImage(file: File): Promise<{ path: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error('Failed to upload image');
  }
  
  return response.json();
}


