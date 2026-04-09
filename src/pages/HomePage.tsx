import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ChevronLeft, ChevronRight,
  Flame, TrendingUp, Sparkles,
  ShoppingCart, RefreshCcw, ShieldCheck, HeadphonesIcon
} from 'lucide-react';
import { fetchProducts } from '@/lib/api';
import ProductCard from '@/components/ui/ProductCard';
import WhatsAppButton from '@/components/ui/WhatsAppButton';
import PromoCodeSection from '@/components/ui/PromoCodeSection';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useHeroSettings } from '@/data/heroSettings';
import { useStoreSettings } from '@/data/storeSettings';



const HOME_MAX_PRODUCTS = 12;

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const heroSettings = useHeroSettings();
  const storeSettings = useStoreSettings();
  const [isHeroVideoReady, setIsHeroVideoReady] = useState(false);
  const [isDiscoverCtaHovered, setIsDiscoverCtaHovered] = useState(false);
  const [hoveredDiscoverTag, setHoveredDiscoverTag] = useState(-1);

  const flashRef = useScrollReveal();
  const bestsellersRef = useScrollReveal();
  const exclusivesRef = useScrollReveal();
  const discoverRef = useScrollReveal();

  // Use React Query for data fetching
  // Fetch up to 12 items for each to give us a good pool of distinct items
  const { data: featuredRaw = [], isFetching: featuredLoading, isError: featuredError } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => fetchProducts('badge=featured&limit=12'),
  });

  const { data: popularRaw = [], isFetching: popularLoading, isError: popularError } = useQuery({
    queryKey: ['products', 'popular'],
    queryFn: () => fetchProducts('badge=bestseller&limit=12'),
  });

  const { data: latestRaw = [], isFetching: newLoading, isError: newError } = useQuery({
    queryKey: ['products', 'newest'],
    queryFn: () => fetchProducts('badge=new&limit=12'),
  });

  const { data: randomFillRaw = [], isFetching: randomFillLoading } = useQuery({
    queryKey: ['products', 'random-fill'],
    queryFn: () => fetchProducts('limit=30'),
    enabled: storeSettings?.randomFillEmptySections === true || storeSettings?.autoFillHomeSections !== false,
  });

  const isAnyLoading = featuredLoading || popularLoading || newLoading || randomFillLoading;
  
  const getVisible = (arr: any[]) => arr.filter((p: any) => p?.isVisible !== false);
  let promoProducts = getVisible(featuredRaw).slice(0, 4);
  let bestsellers = getVisible(popularRaw).slice(0, 4);
  let newArrivals = getVisible(latestRaw).slice(0, 4);

  const autoFillEnabled = storeSettings?.autoFillHomeSections !== false;
  const randomFillEnabled = storeSettings?.randomFillEmptySections === true;

  if (autoFillEnabled || randomFillEnabled) {
      // Si randomFill est forcé ou s'il manque des produits avec tags, on inclut le catalogue global
      let candidates = randomFillEnabled 
          ? [...getVisible(randomFillRaw)]
          : [...getVisible(popularRaw), ...getVisible(latestRaw), ...getVisible(randomFillRaw)];
          
      // Dédupliquer les candidats par id
      candidates = candidates.filter((v, i, a) => a.findIndex((t: any) => (t.id === v.id)) === i);

      // Mélanger aléatoirement pour éviter que les sections affichent les mêmes substituts
      const shuffled = [...candidates].sort(() => Math.random() - 0.5);
      
      const fillSlots = (base: any[], globalUsed: Set<number>) => {
          if (base.length >= 4) return base;
          
          const result = [...base];
          for (const item of shuffled) {
              if (result.length >= 4) break;
              // On ajoute seulement si l'item n'est pas déjà dans la base, ni déjà utilisé comme substitut ailleurs
              if (!base.find(b => b.id === item.id) && !globalUsed.has(item.id)) {
                  result.push(item);
                  globalUsed.add(item.id);
              }
          }
          return result;
      };

      // On enregistre d'abord tous les vrais produits affichés pour ne pas les dupliquer
      const globalUsedIdList = new Set<number>();
      promoProducts.forEach(p => globalUsedIdList.add(p.id));
      bestsellers.forEach(p => globalUsedIdList.add(p.id));
      newArrivals.forEach(p => globalUsedIdList.add(p.id));

      promoProducts = fillSlots(promoProducts, globalUsedIdList);
      bestsellers = fillSlots(bestsellers, globalUsedIdList);
      newArrivals = fillSlots(newArrivals, globalUsedIdList);
  }
  const isHeroVideoEnabled = heroSettings.videoEnabled !== false;

  useEffect(() => {
    setIsHeroVideoReady(false);
  }, [heroSettings.videoUrl, isHeroVideoEnabled]);

  const error = (popularError || newError || featuredError) ? "Impossible de charger les produits. Veuillez vérifier votre connexion." : null;
  const isAr = i18n.language === 'ar';
  const heroTitleText = t('heroTitle').replace('YOUPOSH ', '');
  const heroSubtitleText = t('heroSubtitle');
  const heroCtaText = isAr ? 'شوف العرض دابا' : "Voir l'offre";
  const discoverTitle = isAr
    ? 'لم تشاهد بعد أفضل عروضنا'
    : "Vous n'avez pas encore vu nos meilleures offres";
  const discoverSubtitle = isAr
    ? 'اكتشف منتجات بأسعار جذابة، توصيل سريع، والدفع عند الاستلام.'
    : 'Découvrez des produits qui convertissent le plus chez nos clients: prix attractifs, livraison rapide et paiement à la réception.';
  const discoverTags = isAr
    ? ['الأكثر رواجًا', 'مخزون محدود', 'دفع آمن']
    : ['Tendance du moment', 'Stock limité', 'Paiement sécurisé'];
  const discoverCta = isAr ? 'استكشف المتجر' : 'Explorer la boutique';

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--yp-gray-100)] flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="text-center bg-white p-8 rounded-2xl shadow-sm max-w-md w-full">
            <h2 className="text-xl font-bold text-red-600 mb-2">Oups !</h2>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-xl font-medium"
            >
              Réessayer
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--yp-gray-100)]">
      <Header />

      <main className="pb-20">
        {/* ══════════════════════════════════════════════
            HERO — Compact Mobile-First
            ══════════════════════════════════════════════ */}
        <section className="relative h-[62vh] sm:h-[600px] max-h-[800px] min-h-[420px] flex items-center justify-center overflow-hidden">

          {/* Hero Video Background */}
          <div
            className="absolute inset-0 w-full h-full overflow-hidden"
            style={{ background: 'linear-gradient(145deg, #04153A 0%, #0A2D73 45%, #1D4ED8 100%)' }}
          >
            <div
              className={`absolute inset-0 transition-opacity duration-700 ${isHeroVideoEnabled && isHeroVideoReady ? 'opacity-0' : 'opacity-100'}`}
              style={{ background: 'radial-gradient(circle at 20% 20%, #3B82F6 0%, transparent 40%), radial-gradient(circle at 80% 10%, #1E40AF 0%, transparent 35%), linear-gradient(145deg, #04153A 0%, #0A2D73 45%, #1D4ED8 100%)' }}
            />
            {isHeroVideoEnabled ? (
              <video
                autoPlay={heroSettings.videoAutoplay !== false}
                loop={heroSettings.videoLoop !== false}
                muted={heroSettings.videoMuted !== false}
                playsInline
                onCanPlay={() => setIsHeroVideoReady(true)}
                onLoadedData={() => setIsHeroVideoReady(true)}
                className={`w-full h-full object-cover transition-opacity duration-700 ${isHeroVideoReady ? 'opacity-80' : 'opacity-0'}`}
              >
                <source src={heroSettings.videoUrl || "/videos/hero video.mp4"} type="video/mp4" />
              </video>
            ) : heroSettings.videoPosterUrl ? (
              <img
                src={heroSettings.videoPosterUrl}
                alt="Hero Background"
                className="w-full h-full object-cover opacity-60"
              />
            ) : null}
            {Number(heroSettings.overlayOpacity ?? 0) > 0 && (
              <div
                className="absolute inset-0 bg-black"
                style={{ opacity: Math.max(0, Math.min(100, Number(heroSettings.overlayOpacity ?? 0))) / 100 }}
              />
            )}
          </div>

          {/* Content Container */}
          <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-8 text-center flex flex-col items-center" dir={isAr ? 'rtl' : 'ltr'}>
            <style>{`
              @keyframes ypHeroShimmer {
                0% { background-position: 0% 50%; opacity: 0.35; }
                35% { opacity: 0.9; }
                100% { background-position: 220% 50%; opacity: 0.35; }
              }
              @keyframes ypHeroFloat {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-6px); }
              }
              .yp-hero-shimmer {
                background-image: linear-gradient(90deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.95) 18%, rgba(253,187,45,0.95) 50%, rgba(255,255,255,0.95) 82%, rgba(255,255,255,0.25) 100%);
                background-size: 220% 100%;
                animation: ypHeroShimmer 3.4s linear infinite;
              }
            `}</style>

            <motion.div
              initial={{ opacity: 0, y: 16, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-[420px] sm:max-w-3xl rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md px-5 py-6 sm:px-10 sm:py-12 shadow-[0_18px_50px_rgba(0,0,0,0.35)] relative overflow-hidden"
              style={{ animation: 'ypHeroFloat 5.2s ease-in-out infinite' }}
            >
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -bottom-28 -right-24 w-72 h-72 rounded-full bg-[var(--yp-red)]/20 blur-3xl" />
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.05, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="mb-3 sm:mb-5"
              >
                <motion.span
                  animate={{ boxShadow: ['0 0 0 rgba(0,0,0,0)', '0 0 26px rgba(225,29,72,0.55)', '0 0 0 rgba(0,0,0,0)'] }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] sm:text-sm font-extrabold bg-gradient-to-r from-[var(--yp-red)] to-orange-500 text-white shadow-lg"
                >
                  PROMO
                </motion.span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
                animate={{
                  opacity: 1,
                  y: 0,
                  filter: ['drop-shadow(0 6px 18px rgba(59,130,246,0.0))', 'drop-shadow(0 6px 18px rgba(253,187,45,0.32))', 'drop-shadow(0 6px 18px rgba(59,130,246,0.0))'],
                }}
                transition={{
                  opacity: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
                  y: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
                  filter: { duration: 3.6, repeat: Infinity, ease: 'easeInOut', delay: 0.7 },
                }}
                className={`text-3xl sm:text-5xl font-black text-white leading-[1.15] mb-3 sm:mb-5 ${isAr ? 'font-arabic' : 'font-heading'}`}
              >
                <span className="relative inline-block">
                  <span className="absolute inset-0 text-transparent bg-clip-text yp-hero-shimmer" aria-hidden="true">
                    {heroTitleText}
                  </span>
                  <span className="relative">{heroTitleText}</span>
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ delay: 0.15, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                className={`text-sm sm:text-xl text-white/90 font-medium leading-relaxed max-w-[26rem] sm:max-w-2xl mx-auto mb-6 sm:mb-10 drop-shadow-md ${isAr ? 'font-arabic' : ''}`}
              >
                {heroSubtitleText}
              </motion.p>

              <motion.button
                onClick={() => navigate(heroSettings.primaryCtaLink)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="relative bg-white text-[var(--yp-blue)] px-7 py-3 sm:px-10 sm:py-4 rounded-full font-extrabold text-sm sm:text-lg shadow-[0_16px_36px_rgba(0,0,0,0.25)] hover:bg-blue-50 transition-all overflow-hidden"
              >
                <span className="absolute inset-y-0 left-[-45%] w-[40%] rotate-12 pointer-events-none yp-hero-shimmer" style={{ animation: 'ypHeroShimmer 2.6s linear infinite' }} />
                <span className="relative">{heroCtaText}</span>
              </motion.button>
            </motion.div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            BANDEAU DE CONFIANCE (Responsive Carousel/Grid)
            ══════════════════════════════════════════════ */}
        <section className="bg-white py-4 sm:py-6 border-b border-[var(--yp-gray-200)] overflow-hidden">
          <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8">
            <div className="flex sm:grid sm:grid-cols-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-4 sm:px-0 gap-4">
              {[
                { title: "Shop Facilement", desc: "Trouvez tout en un clic.", icon: ShoppingCart },
                { title: "Garantie Confiance", desc: "Retour et remboursement faciles.", icon: RefreshCcw },
                { title: "Paiement Sécurisé", desc: "À la livraison ou en ligne.", icon: ShieldCheck },
                { title: "Support Client", desc: "À votre écoute 7j/7.", icon: HeadphonesIcon }
              ].map((item, i) => (
                <div key={i} className="snap-center shrink-0 w-[85vw] sm:w-auto max-w-[300px] sm:max-w-none flex items-center gap-3 bg-[var(--yp-gray-50)] p-3 sm:p-4 rounded-xl border border-[var(--yp-gray-200)]">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <item.icon className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--yp-blue)]" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-[13px] sm:text-[15px] font-bold text-[var(--yp-dark)] leading-tight">{item.title}</h4>
                    <p className="text-[11px] sm:text-[13px] text-[var(--yp-gray-600)] leading-snug mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            PROMO CODE ENTRY — 3D Moroccan Style
            ══════════════════════════════════════════════ */}
        {storeSettings.promoSectionEnabled !== false && <PromoCodeSection />}

        {/* ══════════════════════════════════════════════
            FLASH SALES — Red Gradient 3D Premium Card
            ══════════════════════════════════════════════ */}
        <section className="py-4 sm:py-8" ref={flashRef}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 reveal">
            <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-[var(--yp-red)] to-[#991B1B] shadow-2xl shadow-[var(--yp-red)]/20 border border-white/10 relative">
              {/* Decorative background elements for 3D effect */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>

              <div className="p-4 sm:p-8 relative z-10">

                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 mb-6 ${isAr ? 'sm:flex-row-reverse' : ''}`} dir={isAr ? 'rtl' : 'ltr'}>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 shrink-0 bg-white rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
                      <Flame className="w-5 h-5 sm:w-7 sm:h-7 text-[var(--yp-red)] fill-[var(--yp-red)]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex rounded-full h-1.5 w-1.5 bg-white animate-pulse" />
                        <span className="text-[10px] sm:text-xs font-bold tracking-widest text-white/90">
                          {isAr ? 'استافد دابا من أحسن العروض' : 'Offres limitées • Stock qui part vite'}
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-3xl font-extrabold font-heading text-white leading-tight tracking-tight drop-shadow-sm">
                        Vente Flash
                      </h2>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/shop?filter=promo')}
                    className="group w-full sm:w-auto text-xs sm:text-sm font-bold flex justify-center items-center gap-2 bg-white text-[var(--yp-red)] hover:bg-white/90 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl shadow-lg transition-all duration-300 active:scale-95"
                  >
                    {isAr ? 'شوف جميع العروض' : 'Voir toutes les offres'}
                    {isAr ? (
                      <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    ) : (
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    )}
                  </button>
                </div>

                <div className="mt-2 sm:mt-4">
                  {isAnyLoading ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  ) : promoProducts.length === 0 ? (
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 text-center">
                      <p className="text-base font-semibold text-white">Aucune offre flash pour le moment</p>
                      <p className="text-sm text-white/70 mt-1">Revenez bientôt, de nouvelles promos arrivent.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                      {promoProducts.slice(0, HOME_MAX_PRODUCTS).map(product => (
                        <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                          <ProductCard product={product} variant="compact" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            BESTSELLERS
            ══════════════════════════════════════════════ */}
        <section className="py-8 sm:py-12 bg-gradient-to-b from-white to-[var(--yp-bg-secondary)]" ref={bestsellersRef}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 reveal">
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[var(--yp-blue-50)] rounded-lg sm:rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--yp-blue)]" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold text-[var(--yp-dark)] tracking-tight font-heading">{t('bestsellers')}</h2>
                  <p className="text-[var(--yp-gray-600)] text-xs sm:text-base mt-0.5">{t('bestsellerDesc') || 'Les plus vendus ce mois'}</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/shop?sort=popular')}
                className="flex items-center gap-1 text-sm font-semibold text-[var(--yp-blue)] hover:text-[#1e3a8a] transition-colors"
              >
                <span>{t('seeAll')}</span>
                {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
            {isAnyLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--yp-blue)]"></div>
              </div>
            ) : bestsellers.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 reveal-stagger" ref={(el) => {
                  if (el) {
                    const observer = new IntersectionObserver((entries) => {
                      entries.forEach(entry => {
                        if (entry.isIntersecting) {
                          entry.target.classList.add('active');
                        }
                      });
                    }, { threshold: 0.1 });
                    observer.observe(el);
                  }
                }}>
                  {bestsellers.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </>
            ) : (
              <p className="text-center text-[var(--yp-gray-500)] py-8">{t('noProducts') || "Aucun produit trouvé."}</p>
            )}
          </div>
        </section>

        {/* Section supprimée pour page épurée */}

        {/* Sections produits supprimées pour page épurée */}


        {/* ══════════════════════════════════════════════
            DEUX CATÉGORIES PRINCIPALES - Section Premium
            ══════════════════════════════════════════════ */}

        {/* Section 1: Exclusivités YOUPOSH */}
        <section className="py-8 sm:py-12 bg-[var(--yp-bg-secondary)] border-t border-gray-100 reveal" ref={exclusivesRef}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[var(--yp-blue)] to-[var(--yp-blue-dark)] rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-base sm:text-2xl font-extrabold bg-gradient-to-r from-[var(--yp-dark)] to-[var(--yp-blue)] bg-clip-text text-transparent">
                    Exclusivités YOUPOSH
                  </h2>
                  <p className="text-sm text-[var(--yp-gray-600)]">Des pièces uniques disponibles nulle part ailleurs</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/shop?filter=exclusive')}
                className="flex items-center gap-1 text-sm font-semibold text-[var(--yp-blue)] hover:text-[#1e3a8a] transition-colors"
              >
                <span>{t('seeAll')}</span>
                {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>

            {isAnyLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--yp-blue)]"></div>
              </div>
            ) : newArrivals.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 reveal-stagger" ref={(el) => {
                  if (el) {
                    const observer = new IntersectionObserver((entries) => {
                      entries.forEach(entry => {
                        if (entry.isIntersecting) {
                          entry.target.classList.add('active');
                        }
                      });
                    }, { threshold: 0.1 });
                    observer.observe(el);
                  }
                }}>
                  {newArrivals.map(product => (
                    <ProductCard key={product.id} product={product} variant="compact" />
                  ))}
                </div>
              </>
            ) : (
              <p className="text-center text-[var(--yp-gray-500)] py-8">{t('noProducts') || "Aucun produit trouvé."}</p>
            )}
          </div>
        </section>

        {/* Sections supprimées pour une page épurée */}

        {/* ══════════════════════════════════════════════
            DISCOVER MORE — Bottom CTA
            ══════════════════════════════════════════════ */}
        <section className="py-6 sm:py-12 reveal" ref={discoverRef}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="border-t border-[var(--yp-gray-300)]" />
            <div className="pt-6 sm:pt-10 pb-2">
              <style>{`
                @keyframes ypDiscoverGradient {
                  0% { background-position: 0% 50%; }
                  50% { background-position: 100% 50%; }
                  100% { background-position: 0% 50%; }
                }
                @keyframes ypDiscoverShimmer {
                  0% { transform: translateX(-130%); }
                  100% { transform: translateX(130%); }
                }
                @keyframes ypDiscoverTwinkle {
                  0%, 100% { opacity: 0.35; transform: scale(0.9) rotate(0deg); }
                  50% { opacity: 1; transform: scale(1.08) rotate(8deg); }
                }
              `}</style>
              <div className="w-full max-w-[380px] sm:max-w-none">
                <div
                  className="relative overflow-hidden rounded-2xl border border-white/20 px-4 sm:px-8 py-5 sm:py-7 shadow-[0_18px_40px_rgba(26,42,108,0.45)]"
                  style={{
                    background: 'linear-gradient(120deg, #1a2a6c 0%, #1f3fa5 35%, #b21f1f 68%, #fdbb2d 100%)',
                    backgroundSize: '220% 220%',
                    animation: 'ypDiscoverGradient 10s ease infinite'
                  }}
                >
                  <div
                    className="pointer-events-none absolute inset-y-0 left-[-40%] w-[42%]"
                    style={{
                      background: 'linear-gradient(100deg, transparent 0%, rgba(255,255,255,0.26) 45%, transparent 100%)',
                      animation: 'ypDiscoverShimmer 3.2s linear infinite'
                    }}
                  />
                  <svg
                    viewBox="0 0 24 24"
                    className="pointer-events-none absolute right-4 top-4 h-6 w-6 text-[#fdbb2d]"
                    fill="currentColor"
                    style={{ animation: 'ypDiscoverTwinkle 1.8s ease-in-out infinite' }}
                  >
                    <path d="M12 1.8l2.2 5.5 5.8.5-4.4 3.8 1.4 5.7L12 14.2 7 17.3l1.4-5.7L4 7.8l5.8-.5L12 1.8z" />
                  </svg>
                  <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5" dir={isAr ? 'rtl' : 'ltr'}>
                    <div>
                      <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.28em] text-white/90">
                        YOUPOSH COLLECTION
                      </p>
                      <div className="mt-1 h-[2px] w-20 bg-gradient-to-r from-[#fdbb2d] via-white/80 to-transparent" />
                      <h2
                        className="font-extrabold text-white leading-[1.2] mt-3"
                        style={{ fontFamily: '"Playfair Display", serif', fontSize: '28px' }}
                      >
                        {discoverTitle}
                      </h2>
                      <p className="mt-2 leading-relaxed text-white/80" style={{ fontSize: '14px' }}>
                        {discoverSubtitle}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {discoverTags.map((tag, index) => (
                          <span
                            key={tag}
                            onMouseEnter={() => setHoveredDiscoverTag(index)}
                            onMouseLeave={() => setHoveredDiscoverTag(-1)}
                            className="rounded-full border border-white/30 px-3 py-1 text-xs sm:text-sm font-medium text-white backdrop-blur-sm transition-all duration-300"
                            style={{
                              background: 'rgba(255, 255, 255, 0.12)',
                              boxShadow: hoveredDiscoverTag === index
                                ? '0 0 0 1px rgba(253,187,45,0.45), 0 0 16px rgba(253,187,45,0.55)'
                                : '0 2px 8px rgba(0,0,0,0.18)'
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      onMouseEnter={() => setIsDiscoverCtaHovered(true)}
                      onMouseLeave={() => setIsDiscoverCtaHovered(false)}
                      onClick={() => navigate('/shop')}
                      className="bg-white text-[#1a2a6c] px-5 sm:px-6 py-3 rounded-full font-bold text-sm sm:text-base transition-all active:scale-[0.97] inline-flex items-center justify-center gap-2 shadow-[0_10px_22px_rgba(0,0,0,0.2)] hover:shadow-[0_14px_30px_rgba(0,0,0,0.28)] whitespace-nowrap"
                    >
                      {discoverCta}
                      <span
                        className="inline-block transition-transform duration-300"
                        style={{ transform: isDiscoverCtaHovered ? 'translateX(4px)' : 'translateX(0px)' }}
                      >
                        →
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Page épurée - Pas de sections supplémentaires */}
      </main>

      <Footer />
      <CartDrawer />
      <WhatsAppButton variant="floating" />
    </div>
  );
}
