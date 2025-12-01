/**
 * Table of Contents Component
 * 
 * Sticky navigation for pillar pages with anchor links
 * Highlights current section based on scroll position
 */

import React, { useState, useEffect } from 'react';

interface TOCItem {
  id: string;
  title: string;
}

interface TableOfContentsProps {
  items: TOCItem[];
  className?: string;
}

export function TableOfContents({ items, className = '' }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id || '');
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-20% 0% -35% 0%',
        threshold: 0,
      }
    );

    items.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [items]);

  if (!items || items.length === 0) return null;

  return (
    <nav 
      className={`toc-container relative bg-white dark:bg-card-dark border border-border-light dark:border-border-dark rounded-xl shadow-sm ${className}`}
      aria-label="Table of contents"
      style={{ position: 'relative' }}
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full min-h-[48px] px-4 py-3 flex items-center justify-between text-left cursor-pointer"
        aria-expanded={!isCollapsed}
      >
        <span className="font-semibold text-sm md:text-base text-text-light dark:text-text-dark flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg md:text-xl">toc</span>
          Table of Contents
        </span>
        <span className={`material-symbols-outlined transition-transform ${isCollapsed ? '' : 'rotate-180'}`}>
          expand_more
        </span>
      </button>
      
      <div className={`${isCollapsed ? 'hidden' : 'block'} max-h-[60vh] overflow-y-auto`}>
        <ul className="px-3 md:px-4 pb-4 space-y-0.5 md:space-y-1">
          {items.map((item, index) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.getElementById(item.id);
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                    setActiveId(item.id);
                    // Update URL without page jump
                    window.history.pushState(null, '', `#${item.id}`);
                  }
                }}
                className={`block py-2.5 md:py-2 px-3 text-sm rounded-lg transition-colors min-h-[44px] flex items-center ${
                  activeId === item.id
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-text-subtle-light dark:text-text-subtle-dark hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <span className="text-xs text-gray-400 mr-2">{index + 1}.</span>
                {item.title}
              </a>
            </li>
          ))}
          {/* Always add FAQs link */}
          <li>
            <a
              href="#faqs"
              onClick={(e) => {
                e.preventDefault();
                const element = document.getElementById('faqs');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                  setActiveId('faqs');
                  window.history.pushState(null, '', '#faqs');
                }
              }}
              className={`block py-2.5 md:py-2 px-3 text-sm rounded-lg transition-colors min-h-[44px] flex items-center ${
                activeId === 'faqs'
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-text-subtle-light dark:text-text-subtle-dark hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <span className="text-xs text-gray-400 mr-2">{items.length + 1}.</span>
              FAQs
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default TableOfContents;
