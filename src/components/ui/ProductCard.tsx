import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ImageOff } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { useTranslation } from 'react-i18next';
import type { Product } from '@/types';
import { computeBadge } from '@/lib/productLogic';
import { getImageUrl } from '@/lib/utils';
import { useStoreSettings } from '@/data/storeSettings';

interface ProductCardProps {
  product: Product;
  variant?: 'default' | 'compact' | 'horizontal';
}

const MAX_THUMBS = 3;

export default function ProductCard({
  product,
  variant = 'default',
}: ProductCardProps) {
  const navigate = useNavigate();
  const { i18n, t } = useTranslation();
  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist } = useStore();

  const isAr = i18n.language === 'ar';
  const [imgError, setImgError] = useState(false);
  const [activeThumb, setActiveThumb] = useState(0);
  const settings = useStoreSettings();
  const isFavorite = isInWishlist(product.id);

  const badge = computeBadge(product);
  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  const name = isAr && product.nameAr ? product.nameAr : product.name;
  const brandName = product.brand || 'YOUPOSH';
  const isOutOfStock = product.inStock === false || (typeof (product as any).stock === 'number' && Number((product as any).stock) <= 0);

  // All images: main + extras
  const allImages = [product.image, ...(product.images || [])].filter(Boolean);
  const visibleThumbs = allImages.slice(0, MAX_THUMBS);
  const extraCount = allImages.length - MAX_THUMBS;
  const activeImage = allImages[activeThumb] || product.image;

  const handleNavigate = () => {
    navigate(`/product/${product.id}`);
  };

  const handleWishlistToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (isFavorite) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    addToCart(product, 1);
  };

  const handleThumbClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setActiveThumb(index);
  };

  const ImageFallback = () => (
    <div className="w-full h-full flex items-center justify-center bg-[#F0F0F0]">
      <ImageOff className="w-8 h-8 text-gray-400" />
    </div>
  );

  // ── Horizontal variant ──
  if (variant === 'horizontal') {
    return (
      <div
        onClick={handleNavigate}
        className="flex gap-3 bg-white rounded-2xl p-3 border border-gray-200 cursor-pointer"
      >
        <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-[#F5F5F5]">
          {imgError ? (
            <ImageFallback />
          ) : (
            <img
              src={getImageUrl(product.image)}
              alt={name}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider">{brandName}</p>
            <h3 className="text-sm font-bold text-[#111] line-clamp-2 leading-snug">
              {name}
            </h3>
          </div>
          <div className="flex items-center justify-between mt-3 gap-2">
            <span className="text-base font-extrabold text-[#111]">
              {product.price} dh
            </span>
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wide transition-colors ${isOutOfStock ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-[var(--yp-blue)] text-white hover:bg-[var(--yp-blue-dark)]'}`}
            >
              {isOutOfStock ? (t('outOfStock') || 'Rupture') : (t('addToCart') || 'Ajouter')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Compact variant (Flash Sales) ──
  if (variant === 'compact') {
    const compactOutLabel = isAr ? (t('outOfStock') || 'غير متوفر') : 'Indisponible';
    return (
      <div
        onClick={handleNavigate}
        className="product-card group w-full bg-white rounded-[16px] overflow-hidden border border-[#E8E8E8] shadow-[0_2px_12px_rgba(0,0,0,0.06)] cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)] flex flex-col"
      >
        {/* Image area */}
        <div className="relative bg-[#F5F5F5] aspect-[4/5] w-full overflow-hidden shrink-0">
          {/* Badge */}
          {(badge || discount > 0) && (
            <span className={`absolute top-2.5 left-2.5 z-10 inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide shadow-sm border border-black/5 bg-white/90 ${badge === 'new'
              ? 'text-[var(--yp-blue)]'
              : badge === 'bestseller'
                ? 'text-[var(--yp-dark)]'
                : 'text-[var(--yp-red)]'
              }`}>
              {badge === 'promo'
                ? `${discount}% OFF`
                : badge === 'new'
                  ? 'New'
                  : badge === 'bestseller'
                    ? 'Best Seller'
                    : `${discount}% OFF`}
            </span>
          )}

          {isOutOfStock && (
            <span className="absolute top-2.5 right-2.5 z-10 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold bg-white/90 text-[var(--yp-gray-700)] border border-black/5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--yp-gray-400)]" />
              {compactOutLabel}
            </span>
          )}

          {imgError || !activeImage ? (
            <ImageFallback />
          ) : (
            <img
              src={getImageUrl(activeImage)}
              alt={name}
              className={`w-full h-full object-cover transition-transform duration-500 hover:scale-105 ${isOutOfStock ? 'grayscale' : ''}`}
              style={{
                objectPosition: `${product.cardFocalX ?? 50}% ${product.cardFocalY ?? 50}%`,
                transform: `scale(${product.cardZoom ?? 1})`,
              }}
              onError={() => setImgError(true)}
            />
          )}

          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/20 z-[5]" />
          )}
        </div>

        {/* Product info */}
        <div className="px-3 pt-3 pb-2 flex-1 flex flex-col">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#888] mb-1">
            {typeof product.category === 'string' ? product.category : (product.category as any)?.name || brandName}
          </p>
          <h3 className="text-sm sm:text-[15px] font-bold leading-snug text-[#1a1a1a] line-clamp-2 mb-2">
            {name}
          </h3>
          <div className="mt-auto flex items-baseline gap-2 flex-wrap">
            <span className="text-base sm:text-lg font-extrabold text-[#1a1a1a]">
              {product.price} dh
            </span>
            {product.originalPrice && (
              <span className="text-xs text-[#aaa] line-through">
                {product.originalPrice} dh
              </span>
            )}
          </div>
        </div>

        {/* Bottom actions */}
        <div className="px-3 pb-3 pt-1 flex items-stretch gap-2">
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`flex-1 h-9 rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wide transition-all duration-200 active:scale-[0.98] ${isOutOfStock ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-[var(--yp-blue)] text-white hover:bg-[var(--yp-blue-dark)]'}`}
          >
            {isOutOfStock ? compactOutLabel : (t('addToCart') || 'Ajouter')}
          </button>
          <button
            onClick={handleWishlistToggle}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 border-2 ${isFavorite
              ? 'bg-red-50 border-[#D92C2C]'
              : 'bg-white border-[#E8E8E8] hover:border-[#D92C2C]'
              }`}
            aria-label={isFavorite ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart
              className={`w-4 h-4 transition-colors duration-200 ${isFavorite ? 'text-[#D92C2C] fill-[#D92C2C]' : 'text-[#D92C2C]'
                }`}
            />
          </button>
        </div>
      </div>
    );
  }

  // ── Default variant — Nike-style card ──
  return (
    <div
      onClick={handleNavigate}
      className="product-card group w-full bg-white rounded-[16px] overflow-hidden border border-[#E8E8E8] shadow-[0_2px_12px_rgba(0,0,0,0.06)] cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)] flex flex-col"
    >
      {/* ── Image area ── */}
      <div className="relative bg-[#F5F5F5] aspect-[4/5] w-full flex items-center justify-center overflow-hidden shrink-0">
        {/* Badge */}
        {(badge || discount > 0) && (
          <span className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 inline-flex items-center rounded-md px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wide bg-[#D92C2C] text-white shadow-md">
            {badge === 'promo'
              ? `${discount}% OFF`
              : badge === 'new'
                ? 'New'
                : badge === 'bestseller'
                  ? 'Best Seller'
                  : `${discount}% OFF`}
          </span>
        )}

        {isOutOfStock && (
          <span className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 inline-flex items-center rounded-md px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wide bg-[#DC2626] text-white shadow-md">
            {t('outOfStock') || 'Rupture de stock'}
          </span>
        )}

        {/* Details CTA - Desktop only */}
        <div className="hidden lg:flex absolute inset-0 z-20 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-white/95 backdrop-blur-sm text-[#111] px-5 py-2.5 rounded-full font-bold text-[12px] uppercase tracking-wider shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
            Voir détails
          </div>
        </div>

        {/* CSS Watermark Layer */}
        {settings.watermarkEnabled && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-[15]">
            <img
              src="/images/finalwatermak.png"
              alt="Watermark"
              className="absolute select-none pointer-events-none drop-shadow-md filter drop-shadow-[0_2px_4px_rgba(255,255,255,0.8)]"
              style={{
                width: `${settings.watermarkSize}%`,
                height: 'auto',
                opacity: settings.watermarkOpacity / 100,
                left: `${settings.watermarkPosX}%`,
                top: `${settings.watermarkPosY}%`,
                transform: 'translate(-50%, -50%)',
                mixBlendMode: 'multiply'
              }}
            />
          </div>
        )}

        {/* Main image */}
        {imgError || !activeImage ? (
          <ImageFallback />
        ) : (
          <img
            src={getImageUrl(activeImage)}
            alt={name}
            className={`w-full h-full object-cover transition-transform duration-500 hover:scale-105 ${isOutOfStock ? 'grayscale' : ''}`}
            style={{
              objectPosition: `${product.cardFocalX ?? 50}% ${product.cardFocalY ?? 50}%`,
              transform: `scale(${product.cardZoom ?? 1})`,
            }}
            onError={() => setImgError(true)}
          />
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/20 z-[16]" />
        )}
      </div>

      {/* ── Thumbnails row ── */}
      {allImages.length > 1 && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border-b border-[#F0F0F0]">
          {visibleThumbs.map((img, i) => (
            <button
              key={i}
              onClick={(e) => handleThumbClick(e, i)}
              className={`w-8 h-8 rounded-md overflow-hidden border-2 transition-all duration-200 flex-shrink-0 ${activeThumb === i
                ? 'border-[#202442] shadow-sm'
                : 'border-[#E8E8E8] hover:border-gray-400'
                }`}
            >
              <img
                src={getImageUrl(img)}
                alt={`${name} ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
          {extraCount > 0 && (
            <span className="text-[13px] font-semibold text-[#202442] ml-1">
              +{extraCount}
            </span>
          )}
        </div>
      )}

      {/* ── Product info ── */}
      <div className="px-3 pt-3 pb-2 flex-1 flex flex-col">
        <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#888] mb-1">
          {typeof product.category === 'string' ? product.category : (product.category as any)?.name || brandName}
        </p>

        <h3 className="text-sm sm:text-[15px] font-bold leading-snug text-[#1a1a1a] line-clamp-2 mb-2">
          {name}
        </h3>

        <div className="mt-auto flex items-baseline gap-2 flex-wrap">
          <span className="text-base sm:text-lg font-extrabold text-[#1a1a1a]">
            {product.price} dh
          </span>
          {product.originalPrice && (
            <span className="text-xs text-[#aaa] line-through">
              {product.originalPrice} dh
            </span>
          )}
        </div>
      </div>

      {/* ── Bottom actions ── */}
      <div className="px-3 pb-3 pt-1 flex items-stretch gap-2">
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className={`flex-1 h-9 rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wide transition-all duration-200 active:scale-[0.98] ${isOutOfStock ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-[var(--yp-blue)] text-white hover:bg-[var(--yp-blue-dark)]'}`}
        >
          {isOutOfStock ? (t('outOfStock') || 'Rupture') : (t('addToCart') || 'Ajouter')}
        </button>
        <button
          onClick={handleWishlistToggle}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 border-2 ${isFavorite
            ? 'bg-red-50 border-[#D92C2C]'
            : 'bg-white border-[#E8E8E8] hover:border-[#D92C2C]'
            }`}
          aria-label={isFavorite ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            className={`w-5 h-5 transition-colors duration-200 ${isFavorite ? 'text-[#D92C2C] fill-[#D92C2C]' : 'text-[#D92C2C]'
              }`}
          />
        </button>
      </div>
    </div>
  );
}
