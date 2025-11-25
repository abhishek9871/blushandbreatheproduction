'use client';

import React, { useState, ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import SearchModal from './SearchModal';
import ErrorBoundary from './ErrorBoundary';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-gray-50 dark:bg-gray-900">
      <Header onSearchClick={() => setIsSearchOpen(true)} />
      <ErrorBoundary>
        <main className="flex-1" id="main-content">
          {children}
        </main>
      </ErrorBoundary>
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <Footer />
    </div>
  );
};

export default Layout;
