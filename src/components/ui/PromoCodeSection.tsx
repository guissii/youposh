import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';

const PromoCodeSection = () => {
  const { promoCode, promoStatus, promoMessage, applyPromoCode, removePromoCode } = useStore();
  const [inputCode, setInputCode] = useState('');
  const rotatingMessages = ['توصيل سريع 24-48h', 'الدفع عند الاستلام', 'جودة مضمونة'];
  const [rotatingIndex, setRotatingIndex] = useState(0);

  useEffect(() => {
    if (promoCode) setInputCode(promoCode);
  }, [promoCode]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRotatingIndex((prev) => (prev + 1) % rotatingMessages.length);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [rotatingMessages.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    applyPromoCode(inputCode);
  };

  const handleRemove = () => {
    removePromoCode();
    setInputCode('');
  };

  // Particles animation for success
  const ConfettiParticles = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-deco-gold"
          initial={{ 
            x: "50%", 
            y: "50%", 
            opacity: 1, 
            scale: 0 
          }}
          animate={{ 
            x: `${50 + (Math.random() - 0.5) * 100}%`, 
            y: `${50 + (Math.random() - 0.5) * 100}%`, 
            opacity: 0, 
            scale: 1 
          }}
          transition={{ 
            duration: 0.8, 
            ease: "easeOut",
            repeat: Infinity,
            repeatDelay: 2
          }}
        />
      ))}
    </div>
  );

  return (
    <section 
      className="relative w-full py-16 px-4 sm:px-6 lg:px-8 overflow-hidden" 
      dir="rtl"
      style={{
        background: 'linear-gradient(135deg, #102450 0%, #0d1b3e 100%)'
      }}
    >
      {/* Background Subtle Gradient & Glow */}
      <div className="absolute inset-0 opacity-[0.4] pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#2563eb] rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#1d4ed8] rounded-full blur-[100px]"></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10 flex flex-col items-center text-center">
        {/* Badge PROMO */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="bg-[#e11d48] text-white text-xs font-bold px-4 py-1.5 rounded-full mb-6 tracking-widest shadow-[0_0_15px_rgba(225,29,72,0.5)]"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          PROMO LIMITÉE
        </motion.div>

        <motion.h2 
          className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight font-arabic"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ textShadow: "0 0 16px rgba(255,255,255,0.18), 0 2px 10px rgba(0,0,0,0.35)", fontFamily: "'Cairo', 'Tajawal', sans-serif" }}
        >
          عروض قوية بثمن مناسب وضمان مضمون
        </motion.h2>
        
        <motion.p 
          className="text-base sm:text-lg text-white/80 mb-5 max-w-2xl font-arabic leading-loose"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
          style={{ fontFamily: "'Cairo', 'Tajawal', sans-serif" }}
        >
          منتجات عملية وعصرية، التوصيل سريع والدفع عند الاستلام فكل مدن المغرب
        </motion.p>
        <div className="h-7 mb-5">
          <AnimatePresence mode="wait">
            <motion.p
              key={rotatingMessages[rotatingIndex]}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
              className="text-sm sm:text-base text-[#00d9d5] font-semibold"
              style={{ fontFamily: "'Cairo', 'Tajawal', sans-serif" }}
            >
              {rotatingMessages[rotatingIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Input & Action Area */}
        <motion.div 
          className="w-full max-w-md flex flex-col gap-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          {!(promoCode && promoStatus === 'applied') && (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder="أدخل كود الترويج..."
                  className="w-full h-12 sm:h-14 px-5 rounded-full bg-white/10 border border-white/20 text-center text-lg font-arabic text-white placeholder:text-white/50 focus:outline-none focus:border-white/50 focus:bg-white/20 transition-all shadow-inner"
                  style={{ direction: 'rtl' }}
                />
              </div>

              <motion.button
                type="submit"
                disabled={promoStatus === 'loading'}
                className="h-12 sm:h-14 px-8 bg-white text-[#1e3a8a] font-semibold text-lg rounded-full shadow-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors shrink-0"
                whileHover={{ y: -2, boxShadow: '0 12px 26px rgba(37,99,235,0.35)' }}
                whileTap={{ scale: 0.98 }}
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                {promoStatus === 'loading' ? (
                  <div className="w-5 h-5 border-2 border-[#1e3a8a] border-t-transparent rounded-full animate-spin" />
                ) : (
                  "شوف العرض دابا / Voir l’offre"
                )}
              </motion.button>
            </form>
          )}

          {/* Status Messages */}
          <AnimatePresence mode="wait">
            {promoMessage && (
              <motion.div
                key="message"
                initial={{ opacity: 0, y: -10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, height: 0 }}
                className={`p-3 rounded-xl flex items-center justify-center gap-3 text-sm font-bold font-arabic shadow-md mx-auto w-full ${
                  promoStatus === 'error' 
                    ? 'bg-red-500/20 text-red-200 border border-red-500/30' 
                    : 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30'
                }`}
              >
                {promoStatus !== 'error' && (
                  <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                )}
                <span>{promoMessage}</span>
                {promoStatus !== 'error' && <ConfettiParticles />}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Remove Button if applied */}
          {promoCode && promoStatus !== 'idle' && promoStatus !== 'error' && (
            <button 
              onClick={handleRemove}
              className="text-sm text-white/60 hover:text-white font-medium underline transition-colors text-center mt-2"
            >
              حذف الكود (Retirer)
            </button>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default PromoCodeSection;
