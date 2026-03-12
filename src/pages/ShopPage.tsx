import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Grid3X3, List, ChevronDown, X, SlidersHorizontal,
  ArrowUpDown, Flame, Percent, Sparkles, Star, Tag, Package
} from 'lucide-react';
import { fetchCategories, fetchProducts } from '@/lib/api';
import ProductCard from '@/components/ui/ProductCard';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import WhatsAppButton from '@/components/ui/WhatsAppButton';
import type { SortOption, FilterOption } from '@/types';

export default function ShopPage() {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const categoryParam = searchParams.get('category') || undefined;
  const searchQuery = searchParams.get('q') || '';
  const sortParam = (searchParams.get('sort') as SortOption) || 'popular';
  const filterParam = (searchParams.get('filter') as FilterOption) || 'all';
  const avParam = searchParams.get('av') || '';
  const selectedAvIds = avParam
    ? avParam.split(',').map(s => parseInt(s.trim())).filter(n => Number.isFinite(n))
    : [];

  const isAr = i18n.language === 'ar';
  const isPromoPage = filterParam === 'promo';
  const isNewPage = filterParam === 'new';
  const isBestsellerPage = filterParam === 'bestseller';

  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const selectedCategory = categoryParam ? categories.find(c => c.slug === categoryParam) : undefined;
  const categoryAttributes = Array.isArray(selectedCategory?.attributes) ? selectedCategory.attributes : [];

  // Load categories once
  useEffect(() => {
    fetchCategories().then(setCategories).catch(console.error);
  }, []);

  useEffect(() => {
    if (!categoryParam || categoryAttributes.length === 0) return;
    const allowed = new Set<number>();
    categoryAttributes.forEach((a: any) => (Array.isArray(a.values) ? a.values : []).forEach((v: any) => {
      const id = Number(v?.id);
      if (Number.isFinite(id)) allowed.add(id);
    }));
    const next = selectedAvIds.filter(id => allowed.has(id));
    if (next.length !== selectedAvIds.length) {
      updateParams({ av: next.length ? next.join(',') : undefined });
    }
  }, [categoryParam, categories.length]);

  // Fetch products based on URL params
  useEffect(() => {
    window.scrollTo(0, 0);
    const loadData = async () => {
      try {
        const queryParams = new URLSearchParams();
        if (categoryParam) queryParams.set('category', categoryParam);
        if (searchQuery) queryParams.set('search', searchQuery);
        if (sortParam) queryParams.set('sort', sortParam);
        if (filterParam && filterParam !== 'all') queryParams.set('badge', filterParam);
        if (selectedAvIds.length) queryParams.set('av', selectedAvIds.join(','));

        const data = await fetchProducts(queryParams.toString());
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load products', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [categoryParam, searchQuery, sortParam, filterParam, avParam]);

  const updateParams = (updates: Record<string, string | undefined>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    setSearchParams(newParams);
  };

  const toggleAttributeValue = (id: number) => {
    const set = new Set(selectedAvIds);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    const next = [...set];
    updateParams({ av: next.length ? next.join(',') : undefined });
  };

  const clearAttributeFilters = () => updateParams({ av: undefined });

  const getPageTitle = () => {
    if (searchQuery) return `${t('searchResults')}: "${searchQuery}"`;
    if (categoryParam) {
      const cat = categories.find(c => c.slug === categoryParam);
      return isAr ? cat?.nameAr : cat?.name;
    }
    if (isPromoPage) return t('promotionsTitle') || 'Produits en promotion';
    if (isNewPage) return t('newArrivals');
    if (isBestsellerPage) return t('bestsellers');
    return t('allProducts');
  };

  const getPageSubtitle = () => {
    if (isPromoPage) return t('promoSubtitle') || 'Découvrez nos meilleures offres du moment';
    if (isNewPage) return t('newSubtitle') || 'Les derniers produits ajoutés à notre catalogue';
    if (isBestsellerPage) return t('bestsellerSubtitle') || 'Les produits les plus appréciés par nos clients';
    if (searchQuery) return `${products.length} ${t('productsFound')}`;
    return `${products.length} ${t('productsFound')}`;
  };

  const sortOptions: { value: SortOption; label: string; icon: React.ElementType }[] = [
    { value: 'popular', label: t('mostPopular'), icon: Star },
    { value: 'newest', label: t('newest'), icon: Sparkles },
    { value: 'price-asc', label: t('priceLowToHigh'), icon: ArrowUpDown },
    { value: 'price-desc', label: t('priceHighToLow'), icon: ArrowUpDown },
    { value: 'promo', label: t('biggestDiscount'), icon: Percent },
  ];

  const filterOptions: { value: FilterOption; label: string; icon: React.ElementType }[] = [
    { value: 'all', label: t('allProducts'), icon: Grid3X3 },
    { value: 'promo', label: t('onSale'), icon: Percent },
    { value: 'new', label: t('newArrivals'), icon: Sparkles },
    { value: 'bestseller', label: t('bestsellers'), icon: Flame },
    { value: 'in-stock', label: t('inStock'), icon: Star },
  ];

  return (
    <div className="min-h-screen bg-[var(--yp-gray-100)]">
      <Header />

      <main className="pb-20">
        {/* ═══ Page Header ═══ */}
        <div className="bg-white border-b border-[var(--yp-gray-300)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  {isPromoPage && <Tag className="w-4 h-4 text-[var(--yp-red)]" />}
                  {isBestsellerPage && <Flame className="w-4 h-4 text-[var(--yp-blue)]" />}
                  {isNewPage && <Sparkles className="w-4 h-4 text-emerald-500" />}
                  <h1 className="text-lg sm:text-xl font-bold text-[var(--yp-dark)] font-heading">
                    {getPageTitle()}
                  </h1>
                </div>
                <p className="text-xs sm:text-sm text-[var(--yp-gray-600)]">
                  {getPageSubtitle()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ Controls Bar — sticky ═══ */}
        <div className="bg-white border-b border-[var(--yp-gray-300)] sticky top-[60px] sm:top-[72px] z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Category pills — horizontal scroll (Mobile & Desktop) */}
            <div className="py-3 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
              <div className="flex items-center gap-2.5 snap-x">
                <button
                  onClick={() => updateParams({ category: undefined })}
                  className={`flex-shrink-0 snap-start px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border shadow-sm ${!categoryParam
                    ? 'bg-[var(--yp-dark)] text-white border-[var(--yp-dark)]'
                    : 'bg-white text-[var(--yp-gray-700)] border-[var(--yp-gray-300)] hover:border-[var(--yp-blue)]'
                    }`}
                >
                  {t('all')}
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => updateParams({ category: cat.slug })}
                    className={`flex-shrink-0 snap-start px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border shadow-sm ${categoryParam === cat.slug
                      ? 'bg-[var(--yp-dark)] text-white border-[var(--yp-dark)]'
                      : 'bg-white text-[var(--yp-gray-700)] border-[var(--yp-gray-300)] hover:border-[var(--yp-blue)]'
                      }`}
                  >
                    {isAr ? cat.nameAr : cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Controls row (Sort & Filters) */}
            <div className="flex items-center justify-between gap-2 py-3 border-t border-[var(--yp-gray-100)]">
              {/* Filter Button (Mobile) */}
              <button
                onClick={() => setIsFilterOpen(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-[13px] font-bold text-[#1A1D38] bg-white shadow-sm hover:border-[var(--yp-blue)] transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4 text-[var(--yp-blue)]" />
                {t('filters')}
              </button>

              {/* Sort & View */}
              <div className="flex items-center gap-2">
                {/* Sort Dropdown */}
                <div className="relative group">
                  <button className="flex items-center gap-1.5 px-3 py-2 border border-[var(--yp-gray-300)] rounded-lg text-xs sm:text-sm font-medium text-[var(--yp-dark)] hover:border-[var(--yp-blue)] transition-colors">
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{t('sort')}</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-xl shadow-xl border border-[var(--yp-gray-300)] p-1.5 hidden group-hover:block z-20">
                    {sortOptions.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => updateParams({ sort: opt.value })}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${sortParam === opt.value
                          ? 'bg-[var(--yp-blue-50)] text-[var(--yp-blue)] font-medium'
                          : 'text-[var(--yp-gray-700)] hover:bg-[var(--yp-gray-200)]'
                          }`}
                      >
                        <opt.icon className="w-3.5 h-3.5" />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* View Mode — desktop only */}
                <div className="hidden sm:flex items-center border border-[var(--yp-gray-300)] rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-[var(--yp-dark)] text-white' : 'text-[var(--yp-gray-600)] hover:bg-[var(--yp-gray-200)]'}`}
                  >
                    <Grid3X3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-[var(--yp-dark)] text-white' : 'text-[var(--yp-gray-600)] hover:bg-[var(--yp-gray-200)]'}`}
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ Content area ═══ */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex gap-8">
            {/* ── Sidebar Filters (Desktop) — Premium style ── */}
            <aside className="hidden lg:block w-60 flex-shrink-0">
              <div className="bg-white rounded-2xl border border-[var(--yp-gray-300)] p-5 space-y-7 sticky top-[140px]">
                <div>
                  <h3 className="font-bold text-[var(--yp-dark)] text-sm mb-1 flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-[var(--yp-blue)]" />
                    {t('filters')}
                  </h3>
                </div>

                {/* Filter Options */}
                <div>
                  <p className="text-xs font-semibold text-[var(--yp-gray-500)] uppercase tracking-wider mb-3">{t('show')}</p>
                  <div className="space-y-1">
                    {filterOptions.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => updateParams({ filter: opt.value === 'all' ? undefined : opt.value })}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-left transition-all ${filterParam === opt.value || (opt.value === 'all' && !filterParam)
                          ? 'bg-[var(--yp-blue-50)] text-[var(--yp-blue)] font-medium'
                          : 'text-[var(--yp-gray-700)] hover:bg-[var(--yp-gray-200)]'
                          }`}
                      >
                        <opt.icon className="w-4 h-4" />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <p className="text-xs font-semibold text-[var(--yp-gray-500)] uppercase tracking-wider mb-3">{t('categories')}</p>
                  <div className="space-y-1">
                    <button
                      onClick={() => updateParams({ category: undefined })}
                      className={`w-full px-3 py-2.5 rounded-xl text-sm text-left transition-all ${!categoryParam
                        ? 'bg-[var(--yp-blue-50)] text-[var(--yp-blue)] font-medium'
                        : 'text-[var(--yp-gray-700)] hover:bg-[var(--yp-gray-200)]'
                        }`}
                    >
                      {t('all')}
                    </button>
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => updateParams({ category: cat.slug })}
                        className={`w-full px-3 py-2.5 rounded-xl text-sm text-left transition-all ${categoryParam === cat.slug
                          ? 'bg-[var(--yp-blue-50)] text-[var(--yp-blue)] font-medium'
                          : 'text-[var(--yp-gray-700)] hover:bg-[var(--yp-gray-200)]'
                          }`}
                      >
                        {isAr ? cat.nameAr : cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {categoryParam && categoryAttributes.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-[var(--yp-gray-500)] uppercase tracking-wider">Attributs</p>
                      {selectedAvIds.length > 0 && (
                        <button
                          onClick={clearAttributeFilters}
                          className="text-xs font-semibold text-[var(--yp-blue)] hover:underline"
                        >
                          Réinitialiser
                        </button>
                      )}
                    </div>
                    <div className="space-y-4">
                      {categoryAttributes.map((attr: any) => (
                        <div key={attr.id || attr.code || attr.name}>
                          <p className="text-sm font-semibold text-[var(--yp-dark)] mb-2">{isAr ? (attr.nameAr || attr.name) : (attr.name || attr.nameAr)}</p>
                          <div className="space-y-1">
                            {(Array.isArray(attr.values) ? attr.values : []).map((v: any) => (
                              <label key={v.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl hover:bg-[var(--yp-gray-200)] cursor-pointer">
                                <span className="flex items-center gap-2 text-sm text-[var(--yp-gray-700)]">
                                  <input
                                    type="checkbox"
                                    checked={selectedAvIds.includes(Number(v.id))}
                                    onChange={() => toggleAttributeValue(Number(v.id))}
                                    className="w-4 h-4 rounded border-gray-300 text-[var(--yp-blue)] focus:ring-[var(--yp-blue)]"
                                  />
                                  <span>{isAr ? (v.valueAr || v.value) : (v.value || v.valueAr)}</span>
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </aside>

            {/* ── Products Grid ── */}
            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="flex justify-center items-center py-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--yp-blue)]"></div>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-20 h-20 bg-[var(--yp-gray-200)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Package className="w-8 h-8 text-[var(--yp-gray-400)]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--yp-dark)] mb-2">{t('noProducts')}</h3>
                  <p className="text-sm text-[var(--yp-gray-600)]">{t('tryDifferentFilters')}</p>
                </div>
              ) : (
                <div className={`grid gap-3 sm:gap-4 lg:gap-6 ${viewMode === 'grid'
                  ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4'
                  : 'grid-cols-1'
                  }`}>
                  {products.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      variant={viewMode === 'list' ? 'horizontal' : 'default'}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <CartDrawer />
      <WhatsAppButton variant="floating" />

      {/* ═══ Mobile Filter Drawer — Premium bottom sheet ═══ */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsFilterOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85dvh] overflow-auto shadow-2xl animate-slide-up">
            {/* Handle */}
            <div className="sticky top-0 bg-white rounded-t-2xl z-10 pt-3 pb-2 px-5 border-b border-[var(--yp-gray-300)]">
              <div className="w-8 h-1 bg-[var(--yp-gray-400)] rounded-full mx-auto mb-2.5" />
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-lg text-[var(--yp-dark)] font-heading">{t('filters')}</h2>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="p-2 hover:bg-[var(--yp-gray-200)] rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-[var(--yp-gray-600)]" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {/* Categories */}
              <div>
                <p className="text-xs font-semibold text-[var(--yp-gray-500)] uppercase tracking-wider mb-3">{t('categories')}</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      updateParams({ category: undefined });
                      setIsFilterOpen(false);
                    }}
                    className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${!categoryParam
                      ? 'bg-[var(--yp-dark)] text-white'
                      : 'bg-[var(--yp-gray-200)] text-[var(--yp-gray-700)]'
                      }`}
                  >
                    {t('all')}
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        updateParams({ category: cat.slug });
                        setIsFilterOpen(false);
                      }}
                      className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${categoryParam === cat.slug
                        ? 'bg-[var(--yp-dark)] text-white'
                        : 'bg-[var(--yp-gray-200)] text-[var(--yp-gray-700)]'
                        }`}
                    >
                      {isAr ? cat.nameAr : cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filter Options */}
              <div>
                <p className="text-xs font-semibold text-[var(--yp-gray-500)] uppercase tracking-wider mb-3">{t('show')}</p>
                <div className="space-y-1.5">
                  {filterOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        updateParams({ filter: opt.value === 'all' ? undefined : opt.value });
                        setIsFilterOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${filterParam === opt.value || (opt.value === 'all' && !filterParam)
                        ? 'bg-[var(--yp-blue-50)] text-[var(--yp-blue)] font-medium'
                        : 'bg-[var(--yp-gray-200)] text-[var(--yp-gray-700)]'
                        }`}
                    >
                      <opt.icon className="w-4 h-4" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {categoryParam && categoryAttributes.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-[var(--yp-gray-500)] uppercase tracking-wider">Attributs</p>
                    {selectedAvIds.length > 0 && (
                      <button
                        onClick={clearAttributeFilters}
                        className="text-xs font-semibold text-[var(--yp-blue)] hover:underline"
                      >
                        Réinitialiser
                      </button>
                    )}
                  </div>
                  <div className="space-y-4">
                    {categoryAttributes.map((attr: any) => (
                      <div key={attr.id || attr.code || attr.name} className="bg-[var(--yp-gray-200)] rounded-2xl p-3">
                        <p className="text-sm font-semibold text-[var(--yp-dark)] mb-2">{isAr ? (attr.nameAr || attr.name) : (attr.name || attr.nameAr)}</p>
                        <div className="space-y-1">
                          {(Array.isArray(attr.values) ? attr.values : []).map((v: any) => (
                            <label key={v.id} className="flex items-center justify-between gap-3 px-2 py-2 rounded-xl hover:bg-white/60 cursor-pointer">
                              <span className="flex items-center gap-2 text-sm text-[var(--yp-gray-700)]">
                                <input
                                  type="checkbox"
                                  checked={selectedAvIds.includes(Number(v.id))}
                                  onChange={() => toggleAttributeValue(Number(v.id))}
                                  className="w-4 h-4 rounded border-gray-300 text-[var(--yp-blue)] focus:ring-[var(--yp-blue)]"
                                />
                                <span>{isAr ? (v.valueAr || v.value) : (v.value || v.valueAr)}</span>
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sort */}
              <div>
                <p className="text-xs font-semibold text-[var(--yp-gray-500)] uppercase tracking-wider mb-3">{t('sort')}</p>
                <div className="space-y-1.5">
                  {sortOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        updateParams({ sort: opt.value });
                        setIsFilterOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${sortParam === opt.value
                        ? 'bg-[var(--yp-blue-50)] text-[var(--yp-blue)] font-medium'
                        : 'bg-[var(--yp-gray-200)] text-[var(--yp-gray-700)]'
                        }`}
                    >
                      <opt.icon className="w-4 h-4" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
