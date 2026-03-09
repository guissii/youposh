import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ImageOff } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { useTranslation } from 'react-i18next';
import type { Product } from '@/types';
import { computeBadge } from '@/lib/productLogic';

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
  const { i18n } = useTranslation();
  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist } = useStore();

  const isAr = i18n.language === 'ar';
  const [imgError, setImgError] = useState(false);
  const [activeThumb, setActiveThumb] = useState(0);
  const isFavorite = isInWishlist(product.id);

  const badge = computeBadge(product);
  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  const name = isAr && product.nameAr ? product.nameAr : product.name;
  const brandName = product.brand || 'YouPosh';

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
    <div className="w-full h-full flex items-center justify-center bg-[#2a2a3d]">
      <ImageOff className="w-8 h-8 text-gray-500" />
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
              src={product.image}
              alt={name}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <p className="text-xs text-gray-400 mb-1">{brandName}</p>
            <h3 className="text-sm font-semibold text-[#111] line-clamp-2">
              {name}
            </h3>
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-sm font-bold text-[#111]">
              {product.price} dh
            </span>
            <button
              onClick={handleAddToCart}
              className="px-3 py-2 rounded-full bg-[#111] text-white text-xs font-semibold"
            >
              Add to Cart
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
        className="bg-white rounded-[24px] border border-gray-200 overflow-hidden cursor-pointer"
      >
        <div className="relative aspect-square bg-[#F6F6F6]">
          {imgError ? (
            <ImageFallback />
          ) : (
            <img
              src={product.image}
              alt={name}
              className="w-full h-full object-contain p-4"
              onError={() => setImgError(true)}
            />
          )}
        </div>

        <div className="p-3">
          <p className="text-xs text-[#65A88B] mb-1">{brandName}</p>
          <h3 className="text-sm font-semibold text-[#111] line-clamp-2">
            {name}
          </h3>
          <p className="mt-2 text-base font-bold text-[#111]">
            {product.price} dh
          </p>
        </div>
      </div>
    );
  }

  // ── Default variant — Nike-style card ──
  return (
    <div
      onClick={handleNavigate}
      className="product-card w-full max-w-[320px] bg-white rounded-[16px] overflow-hidden border border-[#E8E8E8] shadow-[0_2px_12px_rgba(0,0,0,0.06)] cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)]"
    >
      {/* ── Image area ── */}
      <div className="relative bg-[#1e1e2f] h-[200px] sm:h-[220px] flex items-center justify-center overflow-hidden">
        {/* Badge */}
        {(badge || discount > 0) && (
          <span className="absolute top-3 left-3 z-10 inline-flex items-center rounded-md px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide bg-[#F5841F] text-white shadow-md">
            {badge === 'promo'
              ? `${discount}% OFF`
              : badge === 'new'
                ? 'New'
                : badge === 'bestseller'
                  ? 'Best Seller'
                  : `${discount}% OFF`}
          </span>
        )}

        {/* Main image */}
        {imgError ? (
          <ImageFallback />
        ) : (
          <img
            src={activeImage}
            alt={name}
            className="max-w-[80%] max-h-[80%] object-contain drop-shadow-[0_4px_20px_rgba(0,0,0,0.35)] transition-transform duration-500 hover:scale-105"
            onError={() => setImgError(true)}
          />
        )}
      </div>

      {/* ── Thumbnails row ── */}
      {allImages.length > 1 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-white border-b border-[#F0F0F0]">
          {visibleThumbs.map((img, i) => (
            <button
              key={i}
              onClick={(e) => handleThumbClick(e, i)}
              className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all duration-200 flex-shrink-0 ${activeThumb === i
                ? 'border-[#F5841F] shadow-sm'
                : 'border-[#E8E8E8] hover:border-gray-400'
                }`}
            >
              <img
                src={img}
                alt={`${name} ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
          {extraCount > 0 && (
            <span className="text-[13px] font-semibold text-[#F5841F] ml-1">
              +{extraCount}
            </span>
          )}
        </div>
      )}

      {/* ── Product info ── */}
      <div className="px-4 pt-3 pb-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#888]">
          {typeof product.category === 'string' ? product.category : (product.category as any)?.name || brandName}
        </p>

        <h3 className="mt-1 text-[15px] sm:text-[16px] font-bold leading-tight text-[#1a1a1a] line-clamp-2">
          {name}
        </h3>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-[18px] font-extrabold text-[#1a1a1a]">
            {product.price} dh
          </span>
          {product.originalPrice && (
            <span className="text-[13px] text-[#aaa] line-through">
              {product.originalPrice} dh
            </span>
          )}
        </div>
      </div>

      {/* ── Bottom actions ── */}
      <div className="px-4 pb-4 pt-1 flex items-stretch gap-2">
        <button
          onClick={handleAddToCart}
          className="flex-1 h-[44px] rounded-xl bg-[#1C1C2E] text-white text-[13px] font-bold uppercase tracking-[0.06em] transition-all duration-200 hover:bg-[#2a2a40] active:scale-[0.98]"
        >
          Add to Cart
        </button>
        <button
          onClick={handleWishlistToggle}
          className={`w-[44px] h-[44px] rounded-xl flex items-center justify-center transition-all duration-200 border-2 ${isFavorite
            ? 'bg-[#FFF3E8] border-[#F5841F]'
            : 'bg-white border-[#E8E8E8] hover:border-[#F5841F]'
            }`}
          aria-label={isFavorite ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            className={`w-5 h-5 transition-colors duration-200 ${isFavorite ? 'text-[#F5841F] fill-[#F5841F]' : 'text-[#F5841F]'
              }`}
          />
        </button>
      </div>
    </div>
  );
}