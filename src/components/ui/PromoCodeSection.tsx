import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowLeft, Sparkles } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';

const PromoCodeSection = () => {
  const { promoCode, promoStatus, promoMessage, applyPromoCode, removePromoCode } = useStore();
  const [inputCode, setInputCode] = useState('');
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (promoCode) setInputCode(promoCode);
  }, [promoCode]);

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
      className="relative w-full py-12 px-4 sm:px-6 lg:px-8 overflow-hidden" 
      dir="rtl"
      style={{
        background: 'linear-gradient(135deg, #FFF8F0 0%, #F5EDE3 100%)'
      }}
    >
      {/* Background Subtle Zellige Pattern (SVG) */}
      <div className="absolute inset-0 opacity-[0.08] pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <pattern id="zellige" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M20 0L40 20L20 40L0 20Z" fill="none" stroke="#1E3A8A" strokeWidth="1"/>
            <circle cx="20" cy="20" r="5" fill="#D4AF37"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#zellige)" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto">
        <motion.div
          className="relative bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl overflow-hidden"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            transformStyle: "preserve-3d",
            boxShadow: "0 20px 50px -12px rgba(0, 0, 0, 0.1)"
          }}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          whileHover={{ 
            scale: 1.02,
            rotateX: 2,
            rotateY: -2,
            boxShadow: "0 30px 60px -12px rgba(241, 90, 41, 0.15)"
          }}
        >
          {/* Glass Reflection */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/40 via-transparent to-transparent pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center justify-between p-8 md:p-12 gap-8 relative z-10">
            
            {/* 3D Icon Container */}
            <motion.div 
              className="relative w-24 h-24 md:w-32 md:h-32 flex-shrink-0"
              animate={{ 
                y: [0, -10, 0],
                rotateY: [0, 15, 0]
              }}
              transition={{ 
                duration: 6, 
                repeat: Infinity,
                ease: "easeInOut" 
              }}
            >
              <div className="absolute inset-0 bg-deco-gold/20 rounded-full blur-2xl" />
              <div className="relative w-full h-full bg-gradient-to-br from-deco-orange to-deco-mint rounded-2xl shadow-lg flex items-center justify-center border border-white/20">
                <span className="text-5xl md:text-6xl drop-shadow-md filter grayscale-0">🎁</span>
                {isHovered && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-deco-gold opacity-50"
                    animate={{ scale: [1, 1.2], opacity: [0.5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </div>
            </motion.div>

            {/* Text Content */}
            <div className="flex-1 text-center md:text-right font-arabic">
              <motion.h2 
                className="text-3xl md:text-4xl font-bold text-deco-blue mb-3 leading-tight"
                style={{ textShadow: "0 2px 4px rgba(0,0,0,0.05)" }}
              >
                استمتع بعرض حصري يوفر لك فلوسك !
              </motion.h2>
              <p className="text-lg text-gray-600 mb-1 leading-relaxed font-medium">
                أدخل كود الترويج وخذ خصم فوري يصل إلى 50%
              </p>
              <p className="text-sm text-deco-orange font-semibold tracking-wide font-sans opacity-80">
                OFFRE LIMITÉE — Profitez-en maintenant
              </p>
            </div>

            {/* Input & Button Area */}
            <div className="w-full md:w-auto min-w-[300px] flex flex-col gap-4">
              <form onSubmit={handleSubmit} className="relative group">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    placeholder="أدخل كود الترويج هنا"
                    className="w-full h-14 pl-4 pr-6 rounded-xl border-2 border-deco-orange/30 bg-white/80 backdrop-blur-sm text-right text-lg font-arabic text-deco-blue placeholder:text-gray-400 focus:outline-none focus:border-deco-mint focus:ring-4 focus:ring-deco-mint/10 transition-all duration-300 shadow-inner"
                    style={{ direction: 'rtl' }}
                  />
                  <div className="absolute left-2 top-1/2 -translate-y-1/2">
                    <Sparkles className="w-5 h-5 text-deco-gold animate-pulse" />
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={promoStatus === 'loading'}
                  className="mt-3 w-full h-12 bg-deco-orange text-white font-bold font-arabic text-lg rounded-xl shadow-lg shadow-deco-orange/30 flex items-center justify-center gap-2 overflow-hidden relative"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    تطبيق
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    >
                      {promoStatus === 'loading' ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <ArrowLeft className="w-5 h-5" />
                      )}
                    </motion.div>
                  </span>
                  
                  {/* Shimmer Effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    initial={{ x: "100%" }}
                    whileHover={{ x: "-100%" }}
                    transition={{ duration: 0.6 }}
                  />
                </motion.button>
              </form>

              {/* Status Messages */}
              <AnimatePresence mode="wait">
                {promoMessage && (
                  <motion.div
                    key="message"
                    initial={{ opacity: 0, y: -10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`p-3 rounded-lg flex items-center gap-3 text-sm font-bold font-arabic shadow-sm ${
                      promoStatus === 'error' 
                        ? 'bg-red-50 text-red-600 border border-red-100' 
                        : 'bg-green-50 text-green-700 border border-green-100'
                    }`}
                  >
                    {promoStatus !== 'error' && (
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white shrink-0">
                        <Check className="w-4 h-4" />
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
                  className="text-xs text-red-400 hover:text-red-600 font-medium underline transition-colors text-center"
                >
                  حذف الكود (Retirer)
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PromoCodeSection;
