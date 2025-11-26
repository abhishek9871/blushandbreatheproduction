'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_LINKS } from '@/constants';
import ThemeToggle from './ThemeToggle';

interface HeaderProps {
  onSearchClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSearchClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const baseLinkClasses = "text-sm font-medium transition-colors px-3 py-2 rounded-md";
  const inactiveLinkClasses = "hover:text-primary";
  const activeLinkClasses = "text-primary font-bold";

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    // Exact match or path followed by / (to avoid /health matching /health-store)
    return pathname === path || pathname?.startsWith(path + '/');
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-3xl">spa</span>
            <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">HealthBeauty Hub</span>
          </Link>
          <nav className="hidden md:flex flex-1 justify-center items-center gap-1 lg:gap-6">
            {NAV_LINKS.map(link => (
              <Link
                key={link.name}
                href={link.path}
                className={`${baseLinkClasses} text-gray-700 dark:text-gray-300 ${isActive(link.path) ? activeLinkClasses : inactiveLinkClasses}`}
              >
                {link.name}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <button 
              onClick={onSearchClick}
              className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-11 w-11 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Open search"
            >
              <span className="material-symbols-outlined text-xl">search</span>
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-11 w-11 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Open menu"
            >
              <span className="material-symbols-outlined text-xl">{isMenuOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden">
          <nav className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {NAV_LINKS.map(link => (
              <Link
                key={link.name}
                href={link.path}
                onClick={() => setIsMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive(link.path) 
                    ? 'text-primary bg-primary/10 dark:bg-gray-800' 
                    : 'text-gray-700 dark:text-gray-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
