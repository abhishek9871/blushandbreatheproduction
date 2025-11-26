'use client';

import React from 'react';
import { useTheme } from '@/hooks/useTheme';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-11 w-11 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <span className="material-symbols-outlined text-xl text-gray-700 dark:text-gray-300 transition-transform duration-300 transform rotate-0 scale-100 group-hover:rotate-12">
        {theme === 'light' ? 'dark_mode' : 'light_mode'}
      </span>
    </button>
  );
};

export default ThemeToggle;
