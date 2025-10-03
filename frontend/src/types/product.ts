export interface Product {
  id?: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ProductsResponse {
  products: Product[];
  pagination: PaginationInfo;
}
