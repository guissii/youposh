import { useState, useEffect } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { X, Gift } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

import { useStoreSettings } from '@/data/storeSettings';

export function GlobalCouponNotification() {
  const { applyPromoCode, promoCode, promoStatus, setIsCartOpen, isCartOpen } = useStore();
  const settings = useStoreSettings();
  const [isVisible, setIsVisible] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Only show on home page
    if (location.pathname !== '/') {
      setIsVisible(false);
      return;
    }

    // Check if global coupon is disabled in settings
    if (!settings.globalCouponEnabled) {
      setIsVisible(false);
      return;
    }

    // Check if dismissed permanently
    if (localStorage.getItem("couponDismissed") === "true") {
      return;
    }

    // Don't show if promo already applied
    if (promoCode && promoStatus === 'applied') {
      setIsVisible(false);
      return;
    }
    
    // Hide if cart is open
    if (isCartOpen) {
      setIsVisible(false);
      return;
    }

    // Small delay for better UX
    const timer = setTimeout(() => setIsVisible(true), 2000);
    return () => clearTimeout(timer);
  }, [promoCode, promoStatus, location.pathname, isCartOpen, settings.globalCouponEnabled]);

  const handleApply = async () => {
    const code = couponInput.trim();
    if (!code) {
      toast.error('أدخل كود الكوبون');
      return;
    }
    setIsApplying(true);
    try {
      await applyPromoCode(code);
      setIsCartOpen(true);
      setIsVisible(false);
      // Optional: Dismiss after successful application too? 
      // User flow says: Enter code -> Confirm -> Validation.
      // Doesn't explicitly say to dismiss on success, but usually yes.
      // We will rely on the useEffect check for promoStatus === 'applied' to hide it.
    } catch {
      // handled by applyPromoCode
    } finally {
      setIsApplying(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("couponDismissed", "true");
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ opacity: 0, y: 100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-28 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-[60] sm:max-w-[280px] w-auto mx-auto sm:mx-0"
        >
          <div className="bg-[#FF7A1A] text-white rounded-xl shadow-2xl overflow-hidden relative border border-white/20">
            {/* Close Button */}
            <button
              onClick={handleDismiss}
              className="absolute top-1.5 right-1.5 p-1.5 text-white bg-black/20 hover:bg-red-500 rounded-full transition-all z-20 shadow-sm"
              aria-label="Fermer"
            >
              <X className="w-4 h-4 font-bold" strokeWidth={3} />
            </button>

            <div className="p-3.5 flex flex-col items-center text-center">
              {/* Title & Icon */}
              <div className="flex items-center justify-center gap-1.5 mb-1.5">
                <div className="bg-white/20 p-1.5 rounded-full">
                  <Gift className="w-3.5 h-3.5 text-white" />
                </div>
                <h3 className="font-bold text-sm text-white font-heading" dir="rtl">
                  استفد دابا !
                </h3>
              </div>
              
              <p className="text-white/90 text-xs mb-3 font-medium" dir="rtl">
                عندك عرض خاص، استفد الآن بالكود
              </p>

              {/* Input & Action */}
              <div className="w-full flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={e => setCouponInput(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && handleApply()}
                  placeholder="Code..."
                  dir="ltr"
                  className="w-full bg-white text-gray-900 placeholder-gray-400 font-bold text-center px-2.5 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 transition-all shadow-inner text-sm"
                />
                
                <button
                  onClick={handleApply}
                  disabled={isApplying || !couponInput.trim()}
                  className="bg-black/20 hover:bg-black/30 text-white font-bold px-3 py-1.5 rounded-lg transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 disabled:opacity-70 disabled:cursor-not-allowed border border-white/10 text-sm whitespace-nowrap"
                >
                  {isApplying ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>تأكيد</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
