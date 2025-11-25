
import React, { useState, Suspense, lazy } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import SearchModal from './components/SearchModal';
import PageWrapper from './components/PageWrapper';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy load pages to improve initial load performance
const HomePage = lazy(() => import('./pages/HomePage'));
const HealthPage = lazy(() => import('./pages/HealthPage'));
const BeautyPage = lazy(() => import('./pages/BeautyPageEbay'));
const BeautyProductDetailPage = lazy(() => import('./pages/BeautyProductDetailPage'));
const HealthStorePageEbay = lazy(() => import('./pages/HealthStorePageEbay'));
const HealthProductDetailPageEbay = lazy(() => import('./pages/HealthProductDetailPageEbay'));
const NutritionPage = lazy(() => import('./pages/NutritionPage'));
const VideosPage = lazy(() => import('./pages/VideosPage'));
const ArticlePage = lazy(() => import('./pages/ArticlePage'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const InfoPage = lazy(() => import('./pages/InfoPage'));
const BookmarksPage = lazy(() => import('./pages/BookmarksPage'));

const App: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <HashRouter>
      <div className="relative flex min-h-screen w-full flex-col">
        <Header
          onSearchClick={() => setIsSearchOpen(true)}
        />
        <ErrorBoundary>
          <main className="flex-1" id="main-content">
            <Suspense fallback={<div className="flex h-[50vh] items-center justify-center"><LoadingSpinner /></div>}>
              <Routes>
                <Route path="/" element={<PageWrapper><HomePage /></PageWrapper>} />
                <Route path="/health" element={<PageWrapper><HealthPage /></PageWrapper>} />
                <Route path="/beauty" element={<PageWrapper><BeautyPage /></PageWrapper>} />
                <Route path="/beauty/product/:itemId" element={<PageWrapper><BeautyProductDetailPage /></PageWrapper>} />
                <Route path="/health-store" element={<PageWrapper><HealthStorePageEbay /></PageWrapper>} />
                <Route path="/health-store/product/:itemId" element={<PageWrapper><HealthProductDetailPageEbay /></PageWrapper>} />
                <Route path="/nutrition" element={<PageWrapper><NutritionPage /></PageWrapper>} />
                <Route path="/videos" element={<PageWrapper><VideosPage /></PageWrapper>} />
                <Route path="/article/:id" element={<PageWrapper><ArticlePage /></PageWrapper>} />
                <Route path="/product/:id" element={<PageWrapper><ProductPage /></PageWrapper>} />
                <Route path="/bookmarks" element={<PageWrapper><BookmarksPage /></PageWrapper>} />
                <Route path="/info/:slug" element={<PageWrapper><InfoPage /></PageWrapper>} />
              </Routes>
            </Suspense>
          </main>
        </ErrorBoundary>
        <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        <Footer />
      </div>
    </HashRouter>
  );
};

export default App;
