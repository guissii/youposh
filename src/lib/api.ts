import { MOCK_PRODUCTS, MOCK_CATEGORIES, MOCK_ORDERS, MOCK_PROMO_CODES, MOCK_DASHBOARD_STATS } from './mockData';

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

console.log(`[API] Base URL configured: ${API_BASE}`);

// Helper to simulate network delay for mock data
const mockDelay = () => new Promise(resolve => setTimeout(resolve, 800));

async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            headers: { 'Content-Type': 'application/json' },
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
    } catch (error) {
        console.error(`[API] Fetch error for ${endpoint}:`, error);
        console.warn(`[API] Switching to MOCK DATA for ${endpoint} due to error.`);
        
        // ─── MOCK DATA FALLBACK ───
        await mockDelay();
        
        if (endpoint.includes('/products')) {
            // Basic filtering for mock products
            let result = [...MOCK_PRODUCTS];
            if (endpoint.includes('badge=promo')) result = result.filter(p => p.originalPrice && p.originalPrice > p.price);
            else if (endpoint.includes('sort=popular')) result = result.sort((a, b) => b.salesCount - a.salesCount);
            else if (endpoint.includes('sort=newest')) result = result.filter(p => p.isNew);
            else if (endpoint.includes('/')) {
                // Fetch single product
                const id = Number(endpoint.split('/').pop());
                const product = MOCK_PRODUCTS.find(p => p.id === id);
                if (product) return product as unknown as T;
            }
            return result as unknown as T;
        }
        
        if (endpoint.includes('/categories')) return MOCK_CATEGORIES as unknown as T;
        if (endpoint.includes('/dashboard/stats')) return MOCK_DASHBOARD_STATS as unknown as T;
        if (endpoint.includes('/dashboard/recent-orders')) return MOCK_ORDERS as unknown as T;
        if (endpoint.includes('/dashboard/top-products')) return MOCK_PRODUCTS.slice(0, 5) as unknown as T;
        if (endpoint.includes('/orders')) return MOCK_ORDERS as unknown as T;
        
        if (endpoint.includes('/promo-codes/validate')) {
             // Mock validation
             const body = options?.body ? JSON.parse(options.body as string) : {};
             const code = MOCK_PROMO_CODES.find(c => c.code === body.code && c.isActive);
             if (code) return { discount: code.discountValue, discountType: code.discountType, message: "Code appliqué !" } as unknown as T;
             throw new Error("Code promo invalide (Mock)");
        }
        
        if (endpoint.includes('/promo-codes')) return MOCK_PROMO_CODES as unknown as T;

        if (endpoint.includes('/settings/store')) return { activeGlobalCoupon: 'WELCOME10' } as unknown as T;

        // If no mock handler matches, rethrow the original error
        throw error;
    }
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
