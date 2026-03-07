import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Product, CartItem } from '@/types';

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
  note?: string;
}

const WHATSAPP_NUMBER = '212600000000'; // Remplacez par votre numéro

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
  deliveryFee: number = 50
): string {
  const variantLine = selectedVariant ? `\nVariante: ${selectedVariant}` : '';
  const noteLine = customer.note ? `\nRemarque: ${customer.note}` : '';
  const subtotal = product.price * quantity;
  const grandTotal = subtotal + deliveryFee;

  return `Bonjour, je souhaite commander ce produit :

📦 Produit: ${product.name}${variantLine}
🔢 Quantité: ${quantity}
💰 Prix unitaire: ${product.price} dh
💵 Sous-total: ${subtotal} dh
🚚 Livraison: ${deliveryFee} dh
💰 Total: ${grandTotal} dh

👤 Mes informations :
Nom: ${customer.customerName}
Téléphone: ${customer.phone}
Ville: ${customer.city}${noteLine}

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
  const [isMinimized, setIsMinimized] = useState(false);

  const handleClick = () => {
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

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`, '_blank');
  };

  const baseStyles = 'flex items-center justify-center gap-2 font-semibold transition-all duration-300';

  const variantStyles = {
    primary: 'btn-whatsapp shadow-lg hover:shadow-xl active:scale-95',
    floating: '', // handled below
    small: 'bg-[var(--yp-whatsapp)] hover:bg-[var(--yp-whatsapp-dark)] text-white px-4 py-2.5 rounded-xl text-sm shadow-md'
  };

  // ═══ FLOATING VARIANT — Smart dismiss/minimize ═══
  if (variant === 'floating') {
    // Minimized state — small discreet icon
    if (isMinimized) {
      return (
        <button
          onClick={() => setIsMinimized(false)}
          className="fixed bottom-6 right-6 z-50 w-10 h-10 bg-[var(--yp-whatsapp)] hover:bg-[var(--yp-whatsapp-dark)] text-white rounded-full shadow-md hover:shadow-lg hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center animate-scale-in"
          aria-label="Ouvrir WhatsApp"
          title={t('needHelp') || 'Besoin d\'aide ?'}
        >
          <MessageCircle className="w-4 h-4" />
        </button>
      );
    }

    // Full state — large button with dismiss X
    return (
      <div className="fixed bottom-6 right-6 z-50 animate-scale-in">
        {/* Dismiss X button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsMinimized(true);
          }}
          className="absolute -top-2 -right-2 z-10 w-6 h-6 bg-[var(--yp-gray-800)] hover:bg-[var(--yp-dark)] text-white rounded-full flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110"
          aria-label="Réduire WhatsApp"
        >
          <X className="w-3 h-3" />
        </button>

        {/* Main WhatsApp button */}
        <button
          onClick={handleClick}
          className="bg-[var(--yp-whatsapp)] hover:bg-[var(--yp-whatsapp-dark)] text-white w-14 h-14 rounded-full shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center animate-whatsapp-pulse"
          aria-label="Contacter sur WhatsApp"
          title={t('needHelp') || 'Besoin d\'aide ?'}
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      </div>
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
      {variant !== 'floating' && (
        <span>{product ? t('orderNow') : t('orderViaWhatsApp')}</span>
      )}
    </button>
  );
}
