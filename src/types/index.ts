export interface ProductVariant {
  name: string;
  nameAr: string;
  options: string[];
}

export interface Product {
  id: number;
  name: string;
  nameAr: string;
  price: number;
  originalPrice?: number;
  image: string;
  images: string[];
  badge?: 'new' | 'promo' | 'bestseller';
  rating: number;
  reviews: number;
  category: string;
  description: string;
  descriptionAr: string;
  inStock: boolean;
  sku: string;
  tags: string[];
  variants: ProductVariant[];
  features: string[];

  // ── Visibility & Status ──
  status: 'draft' | 'published' | 'archived';
  isVisible: boolean;

  // ── Marketing flags (manual override by admin) ──
  isNew: boolean;
  isPopular: boolean;
  isBestSeller: boolean;
  isFeatured: boolean;

  // ── Performance counters ──
  salesCount: number;
  viewsCount: number;
  cartAddCount: number;

  // ── Dates & ordering ──
  publishedAt: string | null;
  sortOrder: number;
}

export interface Category {
  id: number;
  name: string;
  nameAr: string;
  icon: string;
  image: string;
  slug: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  variant?: string;
}

export interface WishlistItem {
  product: Product;
  addedAt: Date;
}

export interface Order {
  id: string;
  items: CartItem[];
  customerName: string;
  phone: string;
  city: string;
  address: string;
  notes?: string;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: Date;
  whatsappMessage?: string;
}

export type SortOption = 'popular' | 'newest' | 'price-asc' | 'price-desc' | 'promo';
export type FilterOption = 'all' | 'promo' | 'new' | 'bestseller' | 'in-stock';
