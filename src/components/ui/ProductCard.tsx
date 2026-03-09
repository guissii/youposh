import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShoppingBag, ImageOff } from 'lucide-react';
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
            <img src={`${product.image}?v=wmki`} alt={name} className="w-full h-full object-cover" onError={() => setImgError(true)} />
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
                <span className="text-xs font-medium text-[var(--yp-gray-400)] line-through decoration-[var(--yp-red)]/40">{product.originalPrice} dh</span>
              )}
            </div>
            <button
              onClick={handleAddToCart}
              className="w-8 h-8 rounded-full bg-[var(--yp-dark)] text-white flex items-center justify-center hover:bg-[var(--yp-gray-800)] transition-colors flex-shrink-0"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
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
            <img src={`${product.image}?v=wmki`} alt={name} className="w-full h-full object-cover" onError={() => setImgError(true)} />
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
              <ShoppingBag className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════
  // ── Default variant — Clean Commercial Card
  // ══════════════════════════════════════════
  return (
    <div
      onClick={handleNavigate}
      className="bg-white rounded-3xl p-3 sm:p-4 shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-300 cursor-pointer group flex flex-col h-full"
    >
      {/* ── Badges (Top Row) ── */}
      <div className="flex items-center justify-between mb-3 md:mb-4 min-h-[24px]">
        {badge ? (
          <span className={`text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full ${badge === 'promo' ? 'bg-red-500 text-white' :
            badge === 'new' ? 'bg-emerald-500 text-white' :
              'bg-[var(--yp-blue)] text-white'
            }`}>
            {badge === 'promo' ? 'PROMO' : badge === 'new' ? 'NOUVEAU' : 'BEST'}
          </span>
        ) : <div />}

        {discount > 0 ? (
          <span className="bg-red-500 text-white text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full">
            -{discount}%
          </span>
        ) : <div />}
      </div>

      {/* ── Image ── */}
      <div className="flex justify-center mb-4 sm:mb-5 h-40 sm:h-48 md:h-56">
        <div className="relative w-full h-full flex items-center justify-center">
          {imgError ? <ImageFallback /> : (
            <img
              src={`${product.image}?v=wmki`}
              alt={name}
              className="max-w-full max-h-full object-contain group-hover:scale-[1.03] transition-transform duration-500"
              onError={() => setImgError(true)}
            />
          )}
        </div>
      </div>

      {/* ── Info ── */}
      <div className="flex flex-col flex-grow">
        <h3 className="text-sm sm:text-base lg:text-lg font-medium sm:font-semibold text-slate-900 leading-snug line-clamp-2 mb-2 transition-colors">
          {name}
        </h3>

        {/* Rating */}
        <div className="flex items-center text-xs sm:text-sm text-slate-700/80 mb-4 sm:mb-5">
          <span className="text-amber-400 tracking-wider">★★★★★</span>
          <span className="text-[10px] sm:text-xs text-slate-400 ml-1.5 font-medium">({product.salesCount || 24})</span>
        </div>

        {/* Bottom wrapper to push to bottom */}
        <div className="mt-auto pt-1">
          <div className="flex items-end justify-between gap-2">

            {/* Price Block */}
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
                <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 leading-none">
                  {product.price} dh
                </span>
                {product.originalPrice && (
                  <span className="text-xs sm:text-sm font-semibold text-slate-400 line-through decoration-slate-300 leading-none">
                    {product.originalPrice} dh
                  </span>
                )}
              </div>
            </div>

            {/* Cart Button */}
            <button
              onClick={handleAddToCart}
              className="w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 rounded-full bg-slate-900 hover:bg-[var(--yp-blue)] text-white flex items-center justify-center transition-all active:scale-95 shadow-md flex-shrink-0"
              aria-label="Ajouter au panier"
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 lg:w-[22px] lg:h-[22px]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
