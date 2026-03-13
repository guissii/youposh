import { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowRight, Clock, TrendingUp, ShoppingBag, Trash2 } from 'lucide-react';
import { fetchProducts } from '@/lib/api';
import { getImageUrl } from '@/lib/utils';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const POPULAR_SEARCHES = [
  'écouteurs',
  'smartwatch',
  'iphone',
  'support',
  'chargeur',
  'gaming'
];

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load history from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('yp_search_history');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse search history');
      }
    }
  }, []);

  // Fetch ALL products once when modal opens to allow fast client-side filtering
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchProducts()
        .then(data => {
          if (Array.isArray(data)) setAllProducts(data);
        })
        .catch(console.error)
        .finally(() => setLoading(false));

      // Focus input
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Smart Search Logic
  const filteredResults = useMemo(() => {
    if (!query || query.length < 2) return [];

    const searchTerms = query.toLowerCase().split(' ').filter(Boolean);
    
    return allProducts.filter(product => {
      // Normalize text (remove accents, lowercase)
      const normalize = (str: string) => str ? str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
      
      const name = normalize(product.name || '');
      const nameAr = normalize(product.nameAr || '');
      const desc = normalize(product.description || '');
      const category = normalize(product.category || '');
      
      // Check if ALL search terms match at least one field
      return searchTerms.every(term => {
        const normalizedTerm = normalize(term);
        return name.includes(normalizedTerm) || 
               nameAr.includes(normalizedTerm) || 
               desc.includes(normalizedTerm) || 
               category.includes(normalizedTerm);
      });
    }).slice(0, 8); // Limit to 8 results for speed
  }, [query, allProducts]);

  const saveToHistory = (term: string) => {
    const newHistory = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
    setRecentSearches(newHistory);
    localStorage.setItem('yp_search_history', JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setRecentSearches([]);
    localStorage.removeItem('yp_search_history');
  };

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      saveToHistory(searchQuery.trim());
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      onClose();
      setQuery('');
    }
  };

  const handleProductClick = (product: any) => {
    saveToHistory(query || product.name);
    navigate(`/product/${product.id}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="absolute top-0 left-0 right-0 bg-white shadow-2xl animate-slide-down rounded-b-3xl overflow-hidden">
        <div className="max-w-3xl mx-auto w-full">
          
          {/* Header / Input Area */}
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <div className="relative flex items-center gap-3">
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[var(--yp-blue)] transition-colors" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
                  placeholder={t('searchPlaceholder') || "Rechercher un produit, une catégorie..."}
                  className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-transparent focus:bg-white focus:border-[var(--yp-blue)] focus:ring-4 focus:ring-[var(--yp-blue-50)] rounded-2xl text-lg transition-all duration-300 outline-none placeholder:text-gray-400"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                )}
              </div>
              
              <button 
                onClick={onClose}
                className="p-3 hover:bg-gray-100 rounded-xl text-gray-500 font-medium transition-colors hidden sm:block"
              >
                {t('close') || 'Fermer'}
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
            <div className="p-4 sm:p-6">
              
              {loading && !allProducts.length ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <div className="w-8 h-8 border-2 border-[var(--yp-blue)] border-t-transparent rounded-full animate-spin mb-3"></div>
                  <p className="text-sm">Chargement du catalogue...</p>
                </div>
              ) : query.length >= 2 ? (
                /* ─── RESULTS VIEW ─── */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                      {filteredResults.length} {t('productsFound') || 'Résultats'}
                    </p>
                  </div>

                  {filteredResults.length > 0 ? (
                    <div className="grid gap-3">
                      {filteredResults.map(product => {
                        const isOutOfStock = product.stock <= 0;
                        return (
                          <button
                            key={product.id}
                            onClick={() => handleProductClick(product)}
                            className="group flex items-center gap-4 p-3 bg-white hover:bg-gray-50 border border-gray-100 hover:border-[var(--yp-blue-light)] rounded-2xl transition-all duration-200 w-full text-left"
                          >
                            <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 border border-gray-100">
                              <LazyLoadImage
                                src={getImageUrl(product.image)}
                                alt={product.name}
                                effect="blur"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              {isOutOfStock && (
                                <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                                  <span className="text-[10px] font-bold bg-gray-900 text-white px-2 py-0.5 rounded-full">Épuisé</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0 py-1">
                              <h4 className="font-semibold text-gray-900 truncate group-hover:text-[var(--yp-blue)] transition-colors text-base sm:text-lg">
                                {i18n.language === 'ar' ? product.nameAr : product.name}
                              </h4>
                              <p className="text-sm text-gray-500 truncate mb-1">
                                {product.category}
                              </p>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-[var(--yp-blue)]">
                                  {product.price} DH
                                </span>
                                {product.oldPrice && (
                                  <span className="text-xs text-gray-400 line-through">
                                    {product.oldPrice} DH
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="p-2 text-gray-300 group-hover:text-[var(--yp-blue)] group-hover:translate-x-1 transition-all">
                              <ArrowRight className="w-5 h-5" />
                            </div>
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => handleSearch(query)}
                        className="w-full py-4 text-center text-[var(--yp-blue)] font-semibold hover:underline mt-2"
                      >
                        Voir tous les résultats pour "{query}"
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShoppingBag className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {t('noResults') || 'Aucun résultat trouvé'}
                      </h3>
                      <p className="text-gray-500 max-w-xs mx-auto">
                        Essayez des termes plus génériques ou vérifiez l'orthographe.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* ─── DEFAULT VIEW (Recent & Popular) ─── */
                <div className="grid sm:grid-cols-2 gap-8">
                  
                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-gray-500">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm font-semibold uppercase tracking-wider">{t('recentSearches') || 'Récents'}</span>
                        </div>
                        <button 
                          onClick={clearHistory}
                          className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          Effacer
                        </button>
                      </div>
                      <div className="space-y-1">
                        {recentSearches.map((term, i) => (
                          <button
                            key={i}
                            onClick={() => handleSearch(term)}
                            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl text-left text-gray-700 hover:text-[var(--yp-blue)] transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <Clock className="w-3.5 h-3.5 text-gray-400 group-hover:text-[var(--yp-blue)]" />
                              <span>{term}</span>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:-rotate-45 transition-transform" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Popular Searches */}
                  <div>
                    <div className="flex items-center gap-2 text-gray-500 mb-4">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm font-semibold uppercase tracking-wider">{t('popularSearches') || 'Tendances'}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {POPULAR_SEARCHES.map(term => (
                        <button
                          key={term}
                          onClick={() => handleSearch(term)}
                          className="px-4 py-2 bg-gray-100 hover:bg-[var(--yp-blue-50)] hover:text-[var(--yp-blue)] border border-transparent hover:border-[var(--yp-blue-100)] rounded-full text-sm transition-all duration-200"
                        >
                          🔥 {term}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
