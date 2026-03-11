import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowRight, Clock, TrendingUp } from 'lucide-react';
import { fetchProducts } from '@/lib/api';
import { getImageUrl } from '@/lib/utils';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const popularSearches = [
  'écouteurs bluetooth',
  'smartwatch',
  'powerbank',
  'support téléphone',
  'lampe led',
];

const recentSearches: string[] = [];

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.length >= 2) {
      const loadSearch = async () => {
        try {
          const data = await fetchProducts(`search=${encodeURIComponent(query)}`);
          setResults(data.slice(0, 8));
        } catch (error) {
          console.error("Search failed", error);
        }
      };
      loadSearch();
    } else {
      setResults([]);
    }
  }, [query]);

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      onClose();
      setQuery('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="absolute top-0 left-0 right-0 bg-white shadow-2xl">
        <div className="max-w-3xl mx-auto p-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#999]" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-12 pr-12 py-4 bg-gray-100 rounded-2xl text-lg focus:outline-none focus:ring-2 focus:ring-[var(--yp-blue)]"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full"
              >
                <X className="w-5 h-5 text-[#666]" />
              </button>
            )}
          </div>

          {/* Results or Suggestions */}
          <div className="mt-4 max-h-[70vh] overflow-y-auto">
            {query.length >= 2 ? (
              results.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-[#666] px-2">{t('searchResults')}</p>
                  {results.map(product => (
                    <button
                      key={product.id}
                      onClick={() => {
                        navigate(`/product/${product.id}`);
                        onClose();
                      }}
                      className="w-full flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors"
                    >
                      <img
                        src={getImageUrl(product.image)}
                        alt={i18n.language === 'ar' ? product.nameAr : product.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1 text-left">
                        <p className="font-medium text-[#333]">
                          {i18n.language === 'ar' ? product.nameAr : product.name}
                        </p>
                        <p className="text-[var(--yp-blue)] font-bold">{product.price} dh</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-[#999]" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-[#666]">{t('noResults')}</p>
                </div>
              )
            ) : (
              <div className="space-y-6">
                {/* Popular Searches */}
                <div>
                  <div className="flex items-center gap-2 text-[#666] mb-3">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-medium">{t('popularSearches')}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {popularSearches.map(term => (
                      <button
                        key={term}
                        onClick={() => handleSearch(term)}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition-colors"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-[#666] mb-3">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">{t('recentSearches')}</span>
                    </div>
                    <div className="space-y-1">
                      {recentSearches.map((term, i) => (
                        <button
                          key={i}
                          onClick={() => handleSearch(term)}
                          className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl text-left"
                        >
                          <span>{term}</span>
                          <ArrowRight className="w-4 h-4 text-[#999]" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
