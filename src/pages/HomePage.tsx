import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Flame, TrendingUp, Percent, Sparkles,
  Ticket
} from 'lucide-react';
import { fetchProducts } from '@/lib/api';
import ProductCard from '@/components/ui/ProductCard';
import WhatsAppButton from '@/components/ui/WhatsAppButton';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { loadHeroSettings } from '@/data/heroSettings';

import { useStore } from '@/contexts/StoreContext';



export default function HomePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isAr = i18n.language === 'ar';
  const heroSettings = loadHeroSettings();

  const { promoCode, promoStatus, promoMessage, applyPromoCode, removePromoCode } = useStore();
  const [promoInput, setPromoInput] = useState(promoCode || '');

  useEffect(() => {
    setPromoInput(promoCode || '');
  }, [promoCode]);

  const flashRef = useScrollReveal();
  const bestsellersRef = useScrollReveal();
  const exclusivesRef = useScrollReveal();
  const discoverRef = useScrollReveal();

  const [promoProducts, setPromoProducts] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        // On effectue toutes les requêtes en parallèle vers l'API Backend
        const [promos] = await Promise.all([
          fetchProducts('badge=promo'),
        ]);

        // fallback filtering - Limiter à 6 produits maximum pour l'affichage
        setPromoProducts(promos.filter((p: any) => p.isVisible !== false && p.originalPrice > p.price).slice(0, 6));
      } catch (error) {
        console.error("Erreur chargement page accueil:", error);
      }
    }
    loadData();
  }, []);

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
              background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 30%, #2563eb 60%, #1e40af 100%)',
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
            PROMO CODE ENTRY — visible dès l’arrivée
            ══════════════════════════════════════════════ */}
        <section className="py-4 sm:py-7">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl bg-gradient-to-r from-[var(--yp-blue)] to-indigo-600 p-[1px] shadow-card">
              <div className="bg-white rounded-2xl p-3 sm:p-5 flex flex-col gap-3 sm:gap-4">
                <div className="flex items-start gap-2.5 sm:gap-3">
                  <div className="hidden sm:flex w-11 h-11 rounded-2xl bg-gradient-to-br from-[var(--yp-blue)] to-[var(--yp-blue-dark)] items-center justify-center flex-shrink-0 shadow-lg">
                    <Ticket className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm sm:text-base font-bold bg-gradient-to-r from-[var(--yp-dark)] to-[var(--yp-blue)] bg-clip-text text-transparent">
                      Profitez d'un avantage exclusif
                    </p>
                    <p className="text-xs sm:text-sm text-[var(--yp-gray-600)] leading-relaxed">
                      Saisissez votre code promo et bénéficiez d'une remise immédiate sur vos achats
                    </p>
                    {promoMessage && (
                      <p className={`text-xs sm:text-sm mt-1 ${promoStatus === 'error' ? 'text-red-500' : 'text-emerald-600'}`}>
                        {promoMessage}
                      </p>
                    )}
                  </div>
                </div>

                <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2 sm:items-center">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      placeholder="Saisissez votre code"
                      className="w-full sm:w-56 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[var(--yp-blue)] text-sm"
                    />
                    <button
                      onClick={() => applyPromoCode(promoInput)}
                      disabled={promoStatus === 'loading'}
                      className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap ${promoStatus === 'loading'
                        ? 'bg-gray-200 text-gray-400'
                        : 'bg-[var(--yp-blue)] text-white hover:opacity-95'
                        }`}
                    >
                      Appliquer
                    </button>
                  </div>

                  {promoCode && promoStatus !== 'idle' && (
                    <button
                      onClick={() => { removePromoCode(); setPromoInput(''); }}
                      className="text-xs font-semibold text-red-500 hover:underline text-left sm:text-right"
                    >
                      Supprimer le code
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

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
            FLASH SALES — Contained red card avec design 3D premium
            ══════════════════════════════════════════════ */}
        <section className="py-4 sm:py-6" ref={flashRef}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 reveal">
            <div className="rounded-2xl overflow-hidden border border-[var(--yp-gray-300)] bg-white">
              <div className="p-3 sm:p-6 lg:p-8">

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="w-9 h-9 sm:w-12 sm:h-12 shrink-0 bg-[var(--yp-red)] rounded-lg sm:rounded-xl flex items-center justify-center">
                      <Flame className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="inline-flex rounded-full h-1.5 w-1.5 bg-[var(--yp-red)]" />
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wide text-[var(--yp-red)]">
                          Offre Flash
                        </span>
                      </div>
                      <h2 className="text-[18px] sm:text-[28px] font-extrabold font-heading text-[var(--yp-dark)] leading-none tracking-tight">
                        Ventes Flash
                      </h2>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/shop?filter=promo')}
                    className="group w-full sm:w-auto text-[12px] sm:text-sm font-bold flex justify-center items-center gap-2 bg-[var(--yp-red-50)] text-[var(--yp-red)] hover:bg-[var(--yp-red)] hover:text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl transition-colors duration-300"
                  >
                    Voir Toutes les Offres
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>

                <div className="mt-4 sm:mt-6">
                  {promoProducts.length === 0 ? (
                    <div className="bg-white/60 rounded-2xl border border-[var(--yp-gray-300)] p-4 text-center">
                      <p className="text-sm font-semibold text-[var(--yp-dark)]">Aucune offre flash pour le moment</p>
                      <p className="text-xs text-[var(--yp-gray-600)] mt-1">Revenez bientôt, de nouvelles promos arrivent.</p>
                    </div>
                  ) : (
                    <>
                      <div className="sm:hidden -mx-4 px-4 overflow-x-auto scrollbar-hide">
                        <div className="flex gap-3 pb-1 snap-x snap-mandatory">
                          {promoProducts.map(product => (
                            <div key={product.id} className="snap-start shrink-0 w-[calc((100%-12px)/2)]">
                              <ProductCard product={product} variant="compact" />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                        {promoProducts.map(product => (
                          <ProductCard key={product.id} product={product} variant="compact" />
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
              {promoProducts.slice(0, 4).map(product => (
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
              {promoProducts.slice(0, 4).map(product => (
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
