'use client';

import React, { useState, useEffect } from 'react';

const ReadingProgressBar: React.FC = () => {
  const [width, setWidth] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const scrollListener = () => {
      if (typeof window === 'undefined') return;
      
      const totalHeight = document.body.scrollHeight - window.innerHeight;
      if (totalHeight <= 0) {
        setWidth(100);
        return;
      }
      const scrollPosition = window.scrollY;
      const progress = (scrollPosition / totalHeight) * 100;
      setWidth(progress);
    };

    window.addEventListener('scroll', scrollListener);
    return () => {
      window.removeEventListener('scroll', scrollListener);
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div className="fixed top-0 left-0 z-50 w-full h-1 bg-gray-200 dark:bg-gray-700">
      <div
        className="h-1 bg-primary transition-all duration-75 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
};

export default ReadingProgressBar;
