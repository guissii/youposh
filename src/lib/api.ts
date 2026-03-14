const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    
    // Check for admin token first, then fallback to standard token
    const token = localStorage.getItem('yp_admin_token') || localStorage.getItem('token');
    if (token) {
        (headers as any)['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
            ...headers,
            ...options?.headers,
        },
        ...options,
    });
    if (!res.ok) {
        // Try to parse JSON error first
        let errorMessage = `API error ${res.status}`;
        try {
            const errorData = await res.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
            // If JSON parsing fails, use status text
            errorMessage = res.statusText || errorMessage;
        }
        throw new Error(errorMessage);
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
export const deleteProductImage = (productId: number, imageId: string) =>
    apiFetch<any>(`/products/${productId}/images/${imageId}`, { method: 'DELETE' });

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
export const syncOrderToSheets = (id: string) =>
    apiFetch<any>(`/orders/${id}/sync`, { method: 'POST' });

// ─── Categories ────────────────────────────────────────────────
export const fetchCategories = () => apiFetch<any[]>('/categories');
export const createCategory = (data: any) =>
    apiFetch<any>('/categories', { method: 'POST', body: JSON.stringify(data) });
export const updateCategory = (id: number, data: any) =>
    apiFetch<any>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteCategory = (id: number) =>
    apiFetch<any>(`/categories/${id}`, { method: 'DELETE' });

// ─── Attribute Library ─────────────────────────────────────────
export const fetchAttributeLibrary = () => apiFetch<any[]>('/attribute-library');
export const createAttributeLibraryItem = (data: any) =>
    apiFetch<any>('/attribute-library', { method: 'POST', body: JSON.stringify(data) });
export const uploadCategoryImage = async (file: File, watermarkOpacity?: number, watermarkSize?: number) => {
    const formData = new FormData();
    formData.append('image', file);
    if (watermarkOpacity && watermarkOpacity > 0) {
        formData.append('watermarkOpacity', String(watermarkOpacity));
        formData.append('watermarkSize', String(watermarkSize || 30));
    }
    const res = await fetch(`${API_BASE}/upload/category`, {
        method: 'POST',
        body: formData,
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Failed to upload image');
    }
    return res.json();
};

export const uploadProductImage = async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${API_BASE}/upload/product`, {
        method: 'POST',
        body: formData,
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Failed to upload product image');
    }
    return res.json();
};

// ─── Promo Codes ───────────────────────────────────────────────
export const fetchPromoCodes = () => apiFetch<any[]>('/promo-codes');
export const createPromoCode = (data: any) =>
    apiFetch<any>('/promo-codes', { method: 'POST', body: JSON.stringify(data) });
export const updatePromoCode = (id: number, data: any) =>
    apiFetch<any>(`/promo-codes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deletePromoCode = (id: number) =>
    apiFetch<any>(`/promo-codes/${id}`, { method: 'DELETE' });
export const validatePromoCode = (code: string, orderTotal?: number) =>
    apiFetch<any>(
        '/promo-codes/validate',
        {
            method: 'POST',
            body: JSON.stringify(typeof orderTotal === 'number' ? { code, orderTotal } : { code }),
        }
    );

// ─── Settings ──────────────────────────────────────────────────
export const fetchStoreSettingsAPI = () => apiFetch<any>('/settings/store');
export const updateStoreSettingsAPI = (data: any) =>
    apiFetch<any>('/settings/store', { method: 'POST', body: JSON.stringify(data) });

export const fetchHeroSettingsAPI = () => apiFetch<any>('/settings/hero');
export const updateHeroSettingsAPI = (data: any) =>
    apiFetch<any>('/settings/hero', { method: 'POST', body: JSON.stringify(data) });

// ─── Watermark helpers ─────────────────────────────────────────
export const setWatermarkStatusAPI = async (enabled: boolean) => {
    try {
        return await apiFetch<any>('/settings/watermark/status', {
            method: 'PATCH',
            body: JSON.stringify({ isEnabled: enabled }),
        });
    } catch {
        return apiFetch<any>('/settings/store', {
            method: 'POST',
            body: JSON.stringify({ watermarkEnabled: enabled }),
        });
    }
};

// ─── Auth ──────────────────────────────────────────────────────
export const login = async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Login failed');
    }
    return res.json();
};

export const register = async (data: any) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Registration failed');
    }
    return res.json();
};

export const getMe = async (token: string) => {
    const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Invalid token');
    return res.json();
};
