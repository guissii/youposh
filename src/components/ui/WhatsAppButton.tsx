import { useState, useEffect } from 'react';
import { MessageCircle, X, ShoppingCart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Product, CartItem } from '@/types';
import { useStore } from '@/contexts/StoreContext';

interface WhatsAppButtonProps {
  product?: Product;
  cart?: CartItem[];
  variant?: 'primary' | 'floating' | 'small';
  className?: string;
  customMessage?: string;
}

interface OrderInfo {
  customerName: string;
  phone: string;
  city: string;
  address?: string;
  note?: string;
}

import { useStoreSettings } from '@/data/storeSettings';

// Remove the hardcoded const WHATSAPP_NUMBER
// since we will get it directly from settings now.

export function generateWhatsAppMessage(product: Product, variant?: string): string {
  const variantText = variant ? `\nVariante: ${variant}` : '';
  return `Bonjour,

Je veux commander :

Produit: ${product.name}
Prix: ${product.price} dh${variantText}

Nom: 
Ville: 
Adresse:`;
}

/**
 * Generate a complete WhatsApp order message including customer info.
 * Used by the multi-step checkout on the product page.
 */
export function generateOrderWhatsAppMessage(
  product: Product,
  quantity: number,
  selectedVariant: string | undefined,
  customer: OrderInfo,
  deliveryFee: number = 50,
  promo?: { code: string; discount: number }
): string {
  const variantLine = selectedVariant ? `\nVariante: ${selectedVariant}` : '';
  const noteLine = customer.note ? `\nRemarque: ${customer.note}` : '';
  const subtotal = product.price * quantity;
  const promoDiscount = promo && typeof promo.discount === 'number' ? Math.max(0, Math.min(subtotal, promo.discount)) : 0;
  const subtotalAfterPromo = Math.max(0, subtotal - promoDiscount);
  const grandTotal = subtotalAfterPromo + deliveryFee;
  const promoLines = promo && promoDiscount > 0
    ? `🎟️ Code promo (${promo.code}): -${promoDiscount} dh\n💵 Sous-total après promo: ${subtotalAfterPromo} dh\n`
    : '';

  return `Bonjour, je souhaite commander ce produit :

📦 Produit: ${product.name}${variantLine}
🔢 Quantité: ${quantity}
💰 Prix unitaire: ${product.price} dh
💵 Sous-total: ${subtotal} dh
${promoLines}🚚 Livraison: ${deliveryFee} dh
💰 Total: ${grandTotal} dh

👤 Mes informations :
Nom: ${customer.customerName}
Téléphone: ${customer.phone}
Ville: ${customer.city}${customer.address ? `\nAdresse: ${customer.address}` : ''}${noteLine}

Merci !`;
}

export function generateCartWhatsAppMessage(items: CartItem[]): string {
  const itemsList = items.map(item =>
    `- ${item.product.name} x${item.quantity} = ${item.product.price * item.quantity} dh`
  ).join('\n');

  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return `Bonjour,

Je veux commander :

${itemsList}

Total: ${total} dh

Nom: 
Ville: 
Adresse:`;
}

export default function WhatsAppButton({
  product,
  cart,
  variant = 'primary',
  className = '',
  customMessage
}: WhatsAppButtonProps) {
  const { t } = useTranslation();
  const { phone } = useStoreSettings();
  const { cartCount, setIsCartOpen } = useStore();
  const [isAnimating, setIsAnimating] = useState(false);

  // Trigger animation when cart count changes
  useEffect(() => {
    if (cartCount > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [cartCount]);

  const handleClick = () => {
    if (variant === 'floating') {
      setIsCartOpen(true);
      return;
    }

    let message = '';

    if (customMessage) {
      message = customMessage;
    } else if (product) {
      message = generateWhatsAppMessage(product);
    } else if (cart && cart.length > 0) {
      message = generateCartWhatsAppMessage(cart);
    } else {
      message = 'Bonjour, je suis intéressé par vos produits.';
    }

    const cleanPhone = phone.replace(/[^\d]/g, '');
    const finalPhone = cleanPhone || '212600000000';
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${finalPhone}?text=${encodedMessage}`, '_blank');
  };

  const baseStyles = 'flex items-center justify-center gap-2 font-semibold transition-all duration-300';

  const variantStyles = {
    primary: 'btn-whatsapp shadow-lg hover:shadow-xl active:scale-95',
    floating: '', // handled below
    small: 'bg-[var(--yp-whatsapp)] hover:bg-[var(--yp-whatsapp-dark)] text-white px-4 py-2.5 rounded-xl text-sm shadow-md'
  };

  // ═══ FLOATING VARIANT — Replaced with Sticky Cart Button ═══
  if (variant === 'floating') {
    return (
      <button
        onClick={handleClick}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-3 bg-[#00A884] hover:bg-[#008f6f] text-white pl-2 pr-5 py-2 rounded-full shadow-2xl hover:shadow-[0_8px_30px_rgba(0,168,132,0.4)] active:scale-95 transition-all duration-300 group animate-scale-in"
        aria-label="Ouvrir le panier"
      >
        <div className="relative">
          <div className="bg-white text-[#00A884] w-10 h-10 rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
            <ShoppingCart className={`w-5 h-5 ${isAnimating ? 'animate-bounce' : ''}`} />
          </div>
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-[#00A884] shadow-sm animate-scale-in">
              {cartCount}
            </span>
          )}
        </div>
        <div className="flex flex-col items-start leading-none">
          <span className="text-[13px] font-bold uppercase tracking-wide">Panier</span>
          <span className="text-[10px] opacity-90 font-medium">Livraison gratuite</span>
        </div>
      </button>
    );
  }

  // ═══ Non-floating variants (primary, small) ═══
  return (
    <button
      onClick={handleClick}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      aria-label="Contacter sur WhatsApp"
    >
      <MessageCircle className="w-5 h-5" />
      <span>{product ? t('orderNow') : t('orderViaWhatsApp')}</span>
    </button>
  );
}
