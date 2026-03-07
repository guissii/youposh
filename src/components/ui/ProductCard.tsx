import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, ImageOff } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import type { Product } from '@/types';
import { computeBadge } from '@/lib/productLogic';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
  variant?: 'default' | 'compact' | 'horizontal';
}

export default function ProductCard({ product, variant = 'default' }: ProductCardProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { addToCart } = useStore();
  const isAr = i18n.language === 'ar';
  const [imgError, setImgError] = useState(false);

  const badge = computeBadge(product);
  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  const name = isAr ? product.nameAr : product.name;
  const handleNavigate = () => navigate(`/product/${product.id}`);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
  };

  const ImageFallback = () => (
    <div className="w-full h-full bg-[var(--yp-gray-200)] flex items-center justify-center">
      <ImageOff className="w-8 h-8 text-[var(--yp-gray-400)]" />
    </div>
  );

  // ── Horizontal variant ──
  if (variant === 'horizontal') {
    return (
      <div
        onClick={handleNavigate}
        className="flex gap-3 bg-white rounded-2xl p-2.5 border border-[var(--yp-gray-300)] hover:shadow-card-hover transition-all duration-300 cursor-pointer group"
      >
        <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-[#f8f8f8]">
          {imgError ? <ImageFallback /> : (
            <img src={product.image} alt={name} className="w-full h-full object-cover" onError={() => setImgError(true)} />
          )}
          {discount > 0 && (
            <span className="absolute top-1 right-1 bg-[var(--yp-red)] text-white text-[9px] px-1.5 py-0.5 rounded-md font-bold">
              -{discount}%
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <h3 className="font-medium text-sm text-[var(--yp-dark)] line-clamp-2 leading-snug">{name}</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-[var(--yp-dark)]">{product.price} dh</span>
              {product.originalPrice && (
                <span className="text-[11px] text-[var(--yp-gray-500)] line-through">{product.originalPrice} dh</span>
              )}
            </div>
            <button
              onClick={handleAddToCart}
              className="w-8 h-8 rounded-full bg-[var(--yp-dark)] text-white flex items-center justify-center hover:bg-[var(--yp-gray-800)] transition-colors flex-shrink-0"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Compact variant ──
  if (variant === 'compact') {
    return (
      <div
        onClick={handleNavigate}
        className="bg-white rounded-2xl overflow-hidden border border-[var(--yp-gray-300)] hover:shadow-card-hover transition-all duration-300 cursor-pointer group"
      >
        <div className="relative aspect-square bg-[#f8f8f8]">
          {imgError ? <ImageFallback /> : (
            <img src={product.image} alt={name} className="w-full h-full object-cover" onError={() => setImgError(true)} />
          )}
          {badge && (
            <span className={`absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-md font-bold ${badge === 'promo' ? 'bg-[var(--yp-red)] text-white' :
              badge === 'new' ? 'bg-emerald-500 text-white' : 'bg-[var(--yp-blue)] text-white'}`}>
              {badge === 'promo' ? t('promo') : badge === 'new' ? t('new') : t('bestseller')}
            </span>
          )}
          {discount > 0 && (
            <span className="absolute top-2 right-2 bg-[var(--yp-red)] text-white text-[10px] px-1.5 py-0.5 rounded-md font-bold">
              -{discount}%
            </span>
          )}
        </div>
        <div className="p-2.5">
          <h3 className="font-medium text-xs text-[var(--yp-dark)] line-clamp-1">{name}</h3>
          <div className="flex items-center justify-between mt-1.5">
            <span className="font-bold text-sm text-[var(--yp-dark)]">{product.price} dh</span>
            <button
              onClick={handleAddToCart}
              className="w-7 h-7 rounded-full bg-[var(--yp-dark)] text-white flex items-center justify-center hover:bg-[var(--yp-gray-800)] transition-colors"
            >
              <ShoppingCart className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════
  // ── Default variant — Clean Commercial Card
  // Image → Badge → Title → Price → Cart
  // ══════════════════════════════════════════
  return (
    <div
      onClick={handleNavigate}
      className="bg-white rounded-2xl overflow-hidden border border-[var(--yp-gray-200)] hover:shadow-lg transition-all duration-300 cursor-pointer group"
    >
      {/* ── Image ── */}
      <div className="relative aspect-square bg-[#f8f8f8] overflow-hidden">
        {imgError ? <ImageFallback /> : (
          <img
            src={product.image}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
            onError={() => setImgError(true)}
          />
        )}

        {/* Badge promo — top left */}
        {badge && (
          <span className={`absolute top-2.5 left-2.5 text-[10px] sm:text-xs px-2.5 py-1 rounded-lg font-bold shadow-sm ${badge === 'promo' ? 'bg-[var(--yp-red)] text-white' :
            badge === 'new' ? 'bg-emerald-500 text-white' :
              'bg-[var(--yp-blue)] text-white'
            }`}>
            {badge === 'promo' ? 'PROMO' : badge === 'new' ? 'NOUVEAU' : 'BEST'}
          </span>
        )}

        {/* Discount % — top right */}
        {discount > 0 && (
          <span className="absolute top-2.5 right-2.5 bg-[var(--yp-red)] text-white text-[10px] sm:text-xs px-2 py-0.5 rounded-lg font-bold shadow-sm">
            -{discount}%
          </span>
        )}
      </div>

      {/* ── Info ── */}
      <div className="p-3 sm:p-3.5">
        {/* Name — max 2 lines */}
        <h3 className="font-medium text-[13px] sm:text-sm text-[var(--yp-dark)] leading-snug line-clamp-2 min-h-[36px]">
          {name}
        </h3>

        {/* Best-seller stars */}
        {(product.isBestSeller || product.salesCount >= 10) && (
          <div className="flex mt-1">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="text-[11px] sm:text-xs text-[var(--yp-dark)]">★</span>
            ))}
          </div>
        )}

        {/* Price row + cart button */}
        <div className="flex items-end justify-between mt-2">
          <div>
            <span className="text-base sm:text-lg font-bold text-[var(--yp-dark)] block leading-none">
              {product.price} dh
            </span>
            {product.originalPrice && (
              <span className="text-[11px] text-[var(--yp-gray-500)] line-through mt-0.5 block">
                {product.originalPrice} dh
              </span>
            )}
          </div>

          {/* Round cart button — bottom right */}
          <button
            onClick={handleAddToCart}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[var(--yp-dark)] hover:bg-[var(--yp-gray-800)] text-white flex items-center justify-center transition-all active:scale-90 shadow-md flex-shrink-0"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
