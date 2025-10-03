import { config } from '~/config';
import type { Product, ProductsResponse } from '~/types/product';

export const productApi = {
  async getAll(page: number = 1, pageSize: number = 10, search?: string): Promise<ProductsResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });
    
    if (search) {
      params.append('search', search);
    }

    const response = await fetch(`${config.API_URL}/products?${params}`);
    if (!response.ok) throw new Error('Failed to fetch products');
    return response.json();
  },

  async getById(id: string): Promise<Product> {
    const response = await fetch(`${config.API_URL}/products/${id}`);
    if (!response.ok) throw new Error('Failed to fetch product');
    return response.json();
  },

  async create(product: Omit<Product, 'id'>): Promise<Product> {
    const response = await fetch(`${config.API_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(product),
    });
    if (!response.ok) throw new Error('Failed to create product');
    return response.json();
  },

  async update(id: string, product: Omit<Product, 'id'>): Promise<Product> {
    const response = await fetch(`${config.API_URL}/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(product),
    });
    if (!response.ok) throw new Error('Failed to update product');
    return response.json();
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${config.API_URL}/products/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete product');
  },

  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${config.API_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const txt = await response.text().catch(() => '');
      throw new Error(`Upload failed: ${response.status} ${response.statusText} ${txt}`);
    }

    // Try to parse JSON, but fall back to raw text
    let data: any = null;
    try {
      data = await response.json();
    } catch {
      const txt = await response.text().catch(() => '');
      throw new Error(`Upload returned non-JSON response: ${txt}`);
    }

    // Backend returns { url: "..." }
    if (!data || !data.url) throw new Error('Upload did not return a url');
    return data.url;
  },
};
