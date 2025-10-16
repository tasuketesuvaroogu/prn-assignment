// Centralised API utilities for interacting with the backend services

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
	createdAt?: string;
	updatedAt?: string;
}

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

export interface AuthResponse {
	token: string;
	email: string;
	userId: string;
	role: string;
	expiresAt: string;
}

export interface UserProfile {
	userId: string;
	email: string;
	role: string;
	createdAt: string;
}

export interface CartItem {
	itemId: string;
	productId: string;
	name: string;
	price: number;
	quantity: number;
	size?: string | null;
	color?: string | null;
	image?: string | null;
	subtotal?: number;
}

export interface CartSummary {
	items: CartItem[];
	total: number;
	updatedAt: string;
}

export interface OrderItem {
	productId: string;
	name: string;
	price: number;
	quantity: number;
	size?: string | null;
	color?: string | null;
	image?: string | null;
	subtotal?: number;
}

export interface Order {
	id: string;
	userId: string;
	items: OrderItem[];
	totalAmount: number;
	status: 'pending' | 'paid' | 'cancelled';
	createdAt: string;
	updatedAt: string;
	paymentReference?: string | null;
	checkoutSessionId?: string | null;
}

export interface CheckoutResponse {
	order: Order;
	message: string;
}

export interface CheckoutSessionResponse {
	checkoutUrl: string;
	sessionId: string;
	publishableKey?: string;
}

export interface ConfirmPaymentResponse {
	order: Order;
	message: string;
}

export interface ApiError {
	message?: string;
	errors?: Record<string, string[]>;
}

declare global {
	interface Window {
		__ENV__?: {
			VITE_API_URL?: string;
		};
	}
}

function getApiUrl(): string {
	if (typeof window !== 'undefined' && window.__ENV__?.VITE_API_URL) {
		return window.__ENV__.VITE_API_URL;
	}
	return (import.meta as any).env?.VITE_API_URL || 'http://localhost:6124/api';
}

const API_BASE_URL = getApiUrl();
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
	authToken = token;
}

function buildUrl(path: string): string {
	if (path.startsWith('http')) {
		return path;
	}
	return `${API_BASE_URL}${path}`;
}

async function request<T>(
	path: string,
	options: RequestInit = {},
	requiresAuth: boolean = false
): Promise<T> {
	const headers = new Headers(options.headers ?? {});
	const method = (options.method ?? 'GET').toUpperCase();
	const isFormData = options.body instanceof FormData;

	if (requiresAuth) {
		if (!authToken) {
			throw new Error('Authentication required');
		}
		headers.set('Authorization', `Bearer ${authToken}`);
	} else if (authToken && !headers.has('Authorization')) {
		headers.set('Authorization', `Bearer ${authToken}`);
	}

	if (!isFormData && method !== 'GET' && method !== 'HEAD' && !headers.has('Content-Type')) {
		headers.set('Content-Type', 'application/json');
	}

	const response = await fetch(buildUrl(path), {
		...options,
		headers,
	});

	if (!response.ok) {
		let errorMessage = `Request failed with status ${response.status}`;
		try {
			const errorBody = await response.json();
			if (errorBody?.message) {
				errorMessage = errorBody.message;
			}
		} catch {
			// ignore parse errors
		}
		throw new Error(errorMessage);
	}

	if (response.status === 204) {
		return undefined as T;
	}

	const contentType = response.headers.get('content-type') ?? '';
	if (contentType.includes('application/json')) {
		return (await response.json()) as T;
	}

	const text = await response.text();
	return text as unknown as T;
}

function enhanceProduct(apiProduct: ApiProduct): Product {
	return {
		...apiProduct,
		createdAt: apiProduct.createdAt ?? new Date().toISOString(),
	};
}

// Authentication ------------------------------------------------------------
export async function registerUser(email: string, password: string, confirmPassword: string): Promise<AuthResponse> {
	const body = JSON.stringify({ email, password, confirmPassword });
	return request<AuthResponse>('/auth/register', {
		method: 'POST',
		body,
	});
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
	const body = JSON.stringify({ email, password });
	return request<AuthResponse>('/auth/login', {
		method: 'POST',
		body,
	});
}

export async function getCurrentUser(): Promise<UserProfile> {
	return request<UserProfile>('/auth/me', {}, true);
}

// Products -----------------------------------------------------------------
export async function getProducts(
	page: number = 1,
	limit: number = 12,
	search?: string,
	category?: string,
	minPrice?: number,
	maxPrice?: number
): Promise<{ products: Product[]; total: number; totalPages: number; page: number }> {
	const params = new URLSearchParams({
		page: page.toString(),
		pageSize: limit.toString(),
	});
	if (search) params.set('search', search);
	if (category && category !== 'All') params.set('category', category);
	if (minPrice !== undefined) params.set('minPrice', String(minPrice));
	if (maxPrice !== undefined) params.set('maxPrice', String(maxPrice));

	const data = await request<{ products: ApiProduct[]; pagination?: { total: number; totalPages: number; page: number } }>(
		`/products?${params.toString()}`
	);

	const products = (data.products ?? []).map(enhanceProduct);
	const total = data.pagination?.total ?? products.length;
	const totalPages = data.pagination?.totalPages ?? Math.ceil(total / limit);
	const currentPage = data.pagination?.page ?? page;

	return { products, total, totalPages, page: currentPage };
}

export async function getProductById(id: string): Promise<Product> {
	const product = await request<ApiProduct>(`/products/${id}`);
	return enhanceProduct(product);
}

export async function createProduct(data: ProductFormData): Promise<Product> {
	const body = JSON.stringify(data);
	const product = await request<ApiProduct>(
		'/products',
		{
			method: 'POST',
			body,
		},
		true
	);
	return enhanceProduct(product);
}

export async function updateProduct(id: string, data: ProductFormData): Promise<Product> {
	const body = JSON.stringify(data);
	const product = await request<ApiProduct>(
		`/products/${id}`,
		{
			method: 'PUT',
			body,
		},
		true
	);
	return enhanceProduct(product);
}

export async function deleteProduct(id: string): Promise<void> {
	await request<void>(
		`/products/${id}`,
		{
			method: 'DELETE',
		},
		true
	);
}

export async function uploadImage(file: File): Promise<{ url: string }> {
	const formData = new FormData();
	formData.append('file', file);

	return request<{ url: string }>(
		'/upload',
		{
			method: 'POST',
			body: formData,
		},
		true
	);
}

// Cart ---------------------------------------------------------------------
export async function getCart(): Promise<CartSummary> {
	return request<CartSummary>('/cart', {}, true);
}

export async function addItemToCart(payload: {
	productId: string;
	quantity?: number;
	size?: string;
	color?: string;
}): Promise<CartSummary> {
	const body = JSON.stringify({
		productId: payload.productId,
		quantity: payload.quantity ?? 1,
		size: payload.size,
		color: payload.color,
	});

	const response = await request<{ items: CartItem[]; total: number }>(
		'/cart/items',
		{
			method: 'POST',
			body,
		},
		true
	);

	return {
		items: response.items,
		total: response.total,
		updatedAt: new Date().toISOString(),
	};
}

export async function updateCartItem(itemId: string, quantity: number): Promise<CartSummary> {
	const body = JSON.stringify({ itemId, quantity });
	const response = await request<{ items: CartItem[]; total: number }>(
		'/cart/items',
		{
			method: 'PUT',
			body,
		},
		true
	);

	return {
		items: response.items,
		total: response.total,
		updatedAt: new Date().toISOString(),
	};
}

export async function removeCartItem(itemId: string): Promise<CartSummary> {
	const response = await request<{ items: CartItem[]; total: number }>(
		`/cart/items/${itemId}`,
		{
			method: 'DELETE',
		},
		true
	);

	return {
		items: response.items,
		total: response.total,
		updatedAt: new Date().toISOString(),
	};
}

export async function clearCart(): Promise<void> {
	await request<void>(
		'/cart',
		{
			method: 'DELETE',
		},
		true
	);
}

// Orders -------------------------------------------------------------------
export async function checkoutOrder(requestBody: { shippingAddress?: string; notes?: string }): Promise<CheckoutResponse> {
	const body = JSON.stringify(requestBody ?? {});
	return request<CheckoutResponse>(
		'/orders/checkout',
		{
			method: 'POST',
			body,
		},
		true
	);
}

export async function getOrders(): Promise<Order[]> {
	return request<Order[]>('/orders', {}, true);
}

export async function getOrderById(orderId: string): Promise<Order> {
	return request<Order>(`/orders/${orderId}`, {}, true);
}

export async function confirmOrderPayment(orderId: string, paymentReference?: string): Promise<ConfirmPaymentResponse> {
	const body = JSON.stringify({ paymentReference });
	return request<ConfirmPaymentResponse>(
		`/orders/${orderId}/confirm`,
		{
			method: 'POST',
			body,
		},
		true
	);
}

export async function cancelOrder(orderId: string): Promise<ConfirmPaymentResponse> {
	return request<ConfirmPaymentResponse>(
		`/orders/${orderId}/cancel`,
		{
			method: 'POST',
		},
		true
	);
}

// Payments -----------------------------------------------------------------
export async function createCheckoutSession(orderId: string, successUrl?: string, cancelUrl?: string): Promise<CheckoutSessionResponse> {
	const body = JSON.stringify({ orderId, successUrl, cancelUrl });
	return request<CheckoutSessionResponse>(
		'/payments/stripe/checkout-session',
		{
			method: 'POST',
			body,
		},
		true
	);
}

