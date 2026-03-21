import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Suspense, lazy } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './i18n';
import './App.css';

import { StoreProvider } from '@/contexts/StoreContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { GlobalCouponNotification } from '@/components/ui/GlobalCouponNotification';
import PremiumLoader from '@/components/ui/PremiumLoader';
import ScrollToTop from '@/components/ScrollToTop';
import Tracker from '@/components/Tracker';

import { ProtectedRoute } from '@/components/ProtectedRoute';

// Lazy load pages for better performance
const HomePage = lazy(() => import('@/pages/HomePage'));
const ShopPage = lazy(() => import('@/pages/ShopPage'));
const ProductPage = lazy(() => import('@/pages/ProductPage'));
const AdminPage = lazy(() => import('@/pages/AdminPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const FAQPage = lazy(() => import('@/pages/FAQPage'));
const ShippingPage = lazy(() => import('@/pages/ShippingPage'));

// Configure React Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Don't refetch when switching tabs
      staleTime: 5 * 60 * 1000, // Data is fresh for 5 minutes
      gcTime: 10 * 60 * 1000, // Keep data in cache for 10 minutes
      retry: 1, // Only retry once on failure
    },
  },
});

// Loading component
const PageLoader = () => <PremiumLoader />;

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <StoreProvider>
          <Router>
            <ScrollToTop />
            <Tracker />
            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  background: '#333',
                  color: '#fff',
                  borderRadius: '12px',
                },
              }}
            />
            <ErrorBoundary>
              <GlobalCouponNotification />
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/shop" element={<ShopPage />} />
                  <Route path="/category/:slug" element={<ShopPage />} />
                  <Route path="/search" element={<ShopPage />} />
                  <Route path="/promotions" element={<ShopPage />} />
                  <Route path="/bestsellers" element={<ShopPage />} />
                  <Route path="/new" element={<ShopPage />} />
                  <Route path="/product/:id" element={<ProductPage />} />
                  
                  {/* Admin Auth Routes */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<Navigate to="/login" replace />} />
                  <Route element={<ProtectedRoute />}>
                    <Route path="/admin" element={<AdminPage />} />
                  </Route>

                  {/* Fallback routes */}
                  <Route path="/wishlist" element={<HomePage />} />
                  <Route path="/track-order" element={<HomePage />} />
                  <Route path="/faq" element={<FAQPage />} />
                  <Route path="/delivery" element={<ShippingPage />} />
                  <Route path="/shipping" element={<ShippingPage />} />
                  <Route path="/returns" element={<HomePage />} />
                  <Route path="/about" element={<HomePage />} />
                  <Route path="/contact" element={<HomePage />} />
                  <Route path="/terms" element={<HomePage />} />
                  <Route path="/privacy" element={<HomePage />} />
                  
                  {/* Catch all - Redirect to Home */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </Router>
        </StoreProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
