import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Flame, TrendingUp, Percent, Sparkles,
} from 'lucide-react';
import { fetchProducts } from '@/lib/api';
import ProductCard from '@/components/ui/ProductCard';
import WhatsAppButton from '@/components/ui/WhatsAppButton';
import PromoCodeSection from '@/components/ui/PromoCodeSection';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { loadHeroSettings } from '@/data/heroSettings';



export default function HomePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isAr = i18n.language === 'ar';
  const heroSettings = loadHeroSettings();

  const flashRef = useScrollReveal();
  const bestsellersRef = useScrollReveal();
  const exclusivesRef = useScrollReveal();
  const discoverRef = useScrollReveal();

  const [promoProducts, setPromoProducts] = useState<any[]>([]);
  const [bestsellers, setBestsellers] = useState<any[]>([]);
  const [newArrivals, setNewArrivals] = useState<any[]>([]);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoadingError(null);
        // Fetch data in parallel
        const [promos, popular, latest] = await Promise.all([
          fetchProducts('badge=promo'),
          fetchProducts('sort=popular'),
          fetchProducts('sort=newest'),
        ]);

        // Filter and set state
        setPromoProducts(promos.filter((p: any) => p.isVisible !== false).slice(0, 6));
        setBestsellers(popular.filter((p: any) => p.isVisible !== false).slice(0, 4));
        setNewArrivals(latest.filter((p: any) => p.isVisible !== false).slice(0, 4));
      } catch (error) {
        console.error("Erreur chargement page accueil:", error);
        setLoadingError("Impossible de charger les produits. Vérifiez votre connexion ou réessayez plus tard.");
      }
    }
    loadData();
  }, []);

  if (loadingError) {
     return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--yp-gray-100)] p-4 text-center">
           <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                 <span className="text-2xl">⚠️</span>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Erreur de chargement</h2>
              <p className="text-gray-600 mb-6">{loadingError}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="bg-[var(--yp-blue)] text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity"
              >
                 Réessayer
              </button>
           </div>
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-[var(--yp-gray-100)]">
      <Header />

      <main className="pb-20">
        {/* ══════════════════════════════════════════════
            HERO — Full-bleed immersive video background
            ══════════════════════════════════════════════ */}
        <section className="relative min-h-[80dvh] sm:min-h-[70vh] lg:min-h-[80vh] flex items-center overflow-hidden bg-black">
          {/* Premium gradient background */}
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              background: 'linear-gradient(135deg, #0F172A 0%, #1e3a5f 40%, var(--yp-blue) 100%)',
            }}
          />

          {/* Content — superimposed over gradient */}
          <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-20 text-center">
            <div className="max-w-3xl mx-auto">
              {/* Slogan */}
              <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.28em] text-white/80 font-semibold mb-3 sm:mb-4">
                {isAr ? 'علامة مغربية رائدة' : 'YOUPOSH — MARQUE MAROCAINE'}
              </p>

              {/* Badge */}
              <span className="inline-flex items-center gap-2 sm:gap-2.5 bg-white/10 text-white px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-sm font-semibold border border-white/15 mb-4 sm:mb-6">
                <span className="inline-flex items-center justify-center w-[18px] h-[12px] rounded-sm overflow-hidden border border-white/25">
                  <svg viewBox="0 0 18 12" className="w-full h-full">
                    <rect x="0" y="0" width="18" height="12" fill="#c1272d" />
                    <path
                      d="M9 2.1 L10.4 6.1 L14.7 6.1 L11.2 8.5 L12.6 12.5 L9 10.1 L5.4 12.5 L6.8 8.5 L3.3 6.1 L7.6 6.1 Z"
                      fill="none"
                      stroke="#006233"
                      strokeWidth="1.1"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                {t('heroBadgeTitle')}
              </span>

              {/* Title */}
              <h1 className="text-[22px] sm:text-4xl lg:text-6xl font-extrabold text-white leading-[1.15] font-heading max-w-4xl mx-auto mb-3 sm:mb-5">
                {t('heroTitle')}
              </h1>

              {/* Subtitle */}
              <p className="text-xs sm:text-base lg:text-lg text-white/75 max-w-2xl mx-auto leading-relaxed mb-5 sm:mb-8 font-medium">
                {t('heroSubtitle')}
              </p>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2.5 sm:gap-3 px-4 sm:px-0">
                <button
                  onClick={() => navigate(heroSettings.primaryCtaLink)}
                  className="bg-white hover:bg-white/90 text-[var(--yp-dark)] px-5 sm:px-7 py-3 sm:py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 text-[13px] sm:text-sm transition-all active:scale-[0.97]"
                >
                  {heroSettings.primaryCtaText}
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate(heroSettings.secondaryCtaLink)}
                  className="bg-white/15 hover:bg-white/25 text-white px-5 sm:px-7 py-3 sm:py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 text-[13px] sm:text-sm transition-all border border-white/20"
                >
                  <Percent className="w-4 h-4" />
                  {heroSettings.secondaryCtaText}
                </button>
              </div>
            </div>
          </div>
        </section>


        {/* ══════════════════════════════════════════════
            PROMO CODE ENTRY — 3D Moroccan Style
            ══════════════════════════════════════════════ */}
        <PromoCodeSection />

        {/* ══════════════════════════════════════════════
            QUICK HIGHLIGHTS — 3 blocks: Promos / Nouveautés / Best-sellers
            ══════════════════════════════════════════════ */}
        <section className="py-4 sm:py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              {[
                {
                  title: t('promotions') || 'Promos',
                  desc: "Jusqu'à -40%",
                  icon: Percent,
                  color: 'var(--yp-red)',
                  bg: 'bg-[var(--yp-red-50)]',
                  border: 'border-[var(--yp-red)]/10',
                  link: '/shop?filter=promo'
                },
                {
                  title: t('newArrivals') || 'Nouveautés',
                  desc: 'Fraîchement ajoutés',
                  icon: Sparkles,
                  color: 'var(--yp-blue)',
                  bg: 'bg-[var(--yp-blue-50)]',
                  border: 'border-[var(--yp-blue)]/10',
                  link: '/shop?filter=new'
                },
                {
                  title: t('bestsellers') || 'Best-sellers',
                  desc: 'Les plus appréciés',
                  icon: TrendingUp,
                  color: 'var(--yp-dark)',
                  bg: 'bg-[var(--yp-gray-200)]',
                  border: 'border-[var(--yp-gray-300)]',
                  link: '/shop?sort=popular'
                },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={() => navigate(item.link)}
                  className={`${item.bg} border ${item.border} rounded-xl sm:rounded-2xl p-2.5 sm:p-6 text-left group hover:shadow-md transition-all`}
                >
                  <item.icon className="w-4 h-4 sm:w-6 sm:h-6 mb-1.5 sm:mb-3" style={{ color: item.color }} />
                  <h3 className="font-bold text-[var(--yp-dark)] text-[11px] sm:text-base font-heading leading-tight">{item.title}</h3>
                  <p className="text-[9px] sm:text-sm text-[var(--yp-gray-600)] mt-0.5 sm:mt-1 hidden sm:block">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </section>


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

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 mb-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 shrink-0 bg-white rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
                      <Flame className="w-5 h-5 sm:w-7 sm:h-7 text-[var(--yp-red)] fill-[var(--yp-red)]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex rounded-full h-1.5 w-1.5 bg-white animate-pulse" />
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/90">
                          Offre Limitée
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-3xl font-extrabold font-heading text-white leading-none tracking-tight drop-shadow-sm">
                        Ventes Flash
                      </h2>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/shop?filter=promo')}
                    className="group w-full sm:w-auto text-xs sm:text-sm font-bold flex justify-center items-center gap-2 bg-white text-[var(--yp-red)] hover:bg-white/90 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl shadow-lg transition-all duration-300 active:scale-95"
                  >
                    Voir Toutes les Offres
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>

                <div className="mt-2 sm:mt-4">
                  {promoProducts.length === 0 ? (
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 text-center">
                      <p className="text-base font-semibold text-white">Aucune offre flash pour le moment</p>
                      <p className="text-sm text-white/70 mt-1">Revenez bientôt, de nouvelles promos arrivent.</p>
                    </div>
                  ) : (
                    <>
                      {/* Mobile Horizontal Scroll */}
                      <div className="sm:hidden -mx-4 px-4 overflow-x-auto scrollbar-hide pb-4">
                        <div className="flex gap-3 snap-x snap-mandatory">
                          {promoProducts.map(product => (
                            <div key={product.id} className="snap-start shrink-0 w-[160px]">
                              <div className="bg-white rounded-2xl overflow-hidden shadow-lg h-full transform transition-transform hover:scale-[1.02]">
                                <ProductCard product={product} variant="compact" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Desktop Grid */}
                      <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                        {promoProducts.slice(0, 4).map(product => (
                          <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                            <ProductCard product={product} variant="compact" />
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            BESTSELLERS
            ══════════════════════════════════════════════ */}
        <section className="py-4 sm:py-6" ref={bestsellersRef}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 reveal">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
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
                className="text-sm text-[var(--yp-blue)] font-semibold flex items-center gap-1.5 hover:gap-2.5 transition-all"
              >
                {t('seeAll')}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-6">
              {bestsellers.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>

        {/* Section supprimée pour page épurée */}

        {/* Sections produits supprimées pour page épurée */}


        {/* ══════════════════════════════════════════════
            DEUX CATÉGORIES PRINCIPALES - Section Premium
            ══════════════════════════════════════════════ */}

        {/* Section 1: Exclusivités YOUPOSH */}
        <section className="py-5 sm:py-8 reveal" ref={exclusivesRef}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
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
                className="text-sm text-[var(--yp-blue)] font-semibold flex items-center gap-1.5 hover:gap-2.5 transition-all"
              >
                Voir tout
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Grille 2x2 pour mobile et desktop */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-6">
              {newArrivals.map(product => (
                <ProductCard key={product.id} product={product} variant="compact" />
              ))}
            </div>
          </div>
        </section>

        {/* Sections supprimées pour une page épurée */}

        {/* ══════════════════════════════════════════════
            DISCOVER MORE — Bottom CTA
            ══════════════════════════════════════════════ */}
        <section className="py-6 sm:py-12 reveal" ref={discoverRef}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="border-t border-[var(--yp-gray-300)]" />
            <div className="pt-6 sm:pt-10 pb-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-5">
              <div>
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-[var(--yp-blue)] mb-1">
                  YOUPOSH Collection
                </p>
                <h2 className="text-base sm:text-xl font-bold text-[var(--yp-dark)] leading-snug">
                  Vous n'avez pas encore tout vu
                </h2>
                <p className="text-sm text-[var(--yp-gray-600)] mt-1.5 max-w-md">
                  Découvrez le reste de notre collection et trouvez ce qu'il vous faut.
                </p>
              </div>
              <button
                onClick={() => navigate('/shop')}
                className="bg-[#202442] hover:bg-[#1A1D38] text-white pl-5 sm:pl-6 pr-4 sm:pr-5 py-2.5 sm:py-3 rounded-xl font-semibold text-[13px] sm:text-sm transition-all active:scale-[0.97] inline-flex items-center gap-2 sm:gap-2.5 shadow-sm whitespace-nowrap"
              >
                Explorer la boutique
                <ArrowRight className="w-4 h-4" />
              </button>
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
