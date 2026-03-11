export interface ProductVariantOption {
  value: string;
  stock?: number;
}

export interface ProductVariant {
  name: string;
  nameAr: string;
  options: Array<string | ProductVariantOption>;
}

export interface CategoryAttributeValue {
  id: number;
  value: string;
  valueAr: string;
  sortOrder: number;
}

export interface CategoryAttribute {
  id: number;
  code: string;
  name: string;
  nameAr: string;
  isMulti: boolean;
  sortOrder: number;
  values: CategoryAttributeValue[];
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
  brand?: string;
  description: string;
  descriptionAr: string;
  inStock: boolean;
  stock?: number;
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

  // ── Card crop settings ──
  cardZoom: number;
  cardFocalX: number;
  cardFocalY: number;
}

export interface Category {
  id: number;
  name: string;
  nameAr: string;
  icon: string;
  image: string;
  slug: string;
  attributes?: CategoryAttribute[];
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
  promoCode?: string;
  discount?: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: Date;
  whatsappMessage?: string;
}

export type SortOption = 'popular' | 'newest' | 'price-asc' | 'price-desc' | 'promo' | 'bestsellers';
export type FilterOption = 'all' | 'promo' | 'new' | 'bestseller' | 'in-stock';
