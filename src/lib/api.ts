const API_BASE = 'http://localhost:5000/api';

async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });
    if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `API error ${res.status}`);
    }
    return res.json();
}

// ─── Dashboard ─────────────────────────────────────────────────
export interface DashboardStats {
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    processingOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalProducts: number;
    totalCustomers: number;
}

export const fetchDashboardStats = () => apiFetch<DashboardStats>('/dashboard/stats');
export const fetchRecentOrders = () => apiFetch<any[]>('/dashboard/recent-orders');
export const fetchTopProducts = () => apiFetch<any[]>('/dashboard/top-products');

// ─── Products ──────────────────────────────────────────────────
export const fetchProducts = (params?: string) =>
    apiFetch<any[]>(`/products${params ? `?${params}` : ''}`);
export const fetchProduct = (id: number) => apiFetch<any>(`/products/${id}`);
export const createProduct = (data: any) =>
    apiFetch<any>('/products', { method: 'POST', body: JSON.stringify(data) });
export const updateProduct = (id: number, data: any) =>
    apiFetch<any>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteProduct = (id: number) =>
    apiFetch<any>(`/products/${id}`, { method: 'DELETE' });

// ─── Orders ────────────────────────────────────────────────────
export const fetchOrders = (params?: string) =>
    apiFetch<any[]>(`/orders${params ? `?${params}` : ''}`);
export const fetchOrder = (id: string) => apiFetch<any>(`/orders/${id}`);
export const createOrder = (data: any) =>
    apiFetch<any>('/orders', { method: 'POST', body: JSON.stringify(data) });
export const updateOrderStatus = (id: string, status: string) =>
    apiFetch<any>(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
export const deleteOrder = (id: string) =>
    apiFetch<any>(`/orders/${id}`, { method: 'DELETE' });

// ─── Categories ────────────────────────────────────────────────
export const fetchCategories = () => apiFetch<any[]>('/categories');
export const createCategory = (data: any) =>
    apiFetch<any>('/categories', { method: 'POST', body: JSON.stringify(data) });
export const updateCategory = (id: number, data: any) =>
    apiFetch<any>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteCategory = (id: number) =>
    apiFetch<any>(`/categories/${id}`, { method: 'DELETE' });

// ─── Customers ─────────────────────────────────────────────────
export const fetchCustomers = (params?: string) =>
    apiFetch<any[]>(`/customers${params ? `?${params}` : ''}`);
export const fetchCustomer = (id: number) => apiFetch<any>(`/customers/${id}`);
export const deleteCustomer = (id: number) =>
    apiFetch<any>(`/customers/${id}`, { method: 'DELETE' });

// ─── Promo Codes ───────────────────────────────────────────────
export const fetchPromoCodes = () => apiFetch<any[]>('/promo-codes');
export const createPromoCode = (data: any) =>
    apiFetch<any>('/promo-codes', { method: 'POST', body: JSON.stringify(data) });
export const updatePromoCode = (id: number, data: any) =>
    apiFetch<any>(`/promo-codes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deletePromoCode = (id: number) =>
    apiFetch<any>(`/promo-codes/${id}`, { method: 'DELETE' });
export const validatePromoCode = (code: string, orderTotal: number) =>
    apiFetch<any>('/promo-codes/validate', { method: 'POST', body: JSON.stringify({ code, orderTotal }) });
