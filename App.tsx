
import React, { useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import HealthPage from './pages/HealthPage';
import BeautyPage from './pages/BeautyPage';
import NutritionPage from './pages/NutritionPage';
import VideosPage from './pages/VideosPage';
import ErrorBoundary from './components/ErrorBoundary';
import SearchModal from './components/SearchModal';
import ArticlePage from './pages/ArticlePage';
import BookmarksPage from './pages/BookmarksPage';
import NewsletterModal from './components/NewsletterModal';
import PageWrapper from './components/PageWrapper';


const App: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNewsletterOpen, setIsNewsletterOpen] = useState(false);

  return (
    <HashRouter>
      <div className="relative flex min-h-screen w-full flex-col">
        <Header 
          onSearchClick={() => setIsSearchOpen(true)} 
        />
        <ErrorBoundary>
          <main className="flex-1" id="main-content">
            <Routes>
              <Route path="/" element={<PageWrapper><HomePage /></PageWrapper>} />
              <Route path="/health" element={<PageWrapper><HealthPage /></PageWrapper>} />
              <Route path="/beauty" element={<PageWrapper><BeautyPage /></PageWrapper>} />
              <Route path="/nutrition" element={<PageWrapper><NutritionPage /></PageWrapper>} />
              <Route path="/videos" element={<PageWrapper><VideosPage /></PageWrapper>} />
              <Route path="/article/:id" element={<PageWrapper><ArticlePage /></PageWrapper>} />
              <Route path="/bookmarks" element={<PageWrapper><BookmarksPage /></PageWrapper>} />
            </Routes>
          </main>
        </ErrorBoundary>
        <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        <NewsletterModal isOpen={isNewsletterOpen} onClose={() => setIsNewsletterOpen(false)} />
        <Footer onSubscribeClick={() => setIsNewsletterOpen(true)} />
      </div>
    </HashRouter>
  );
};

export default App;
