'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { 
  searchAll, 
  searchVideos, 
  searchHealthProducts, 
  searchBeautyProducts, 
  searchUSDAFoods 
} from '@/services/apiService';
import type { Article, Video, EbayProductSummary, NutritionInfo } from '@/types';
import VideoPlayer from './VideoPlayer';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Search categories configuration
const SEARCH_CATEGORIES = [
  { id: 'all', label: 'All', icon: 'apps', color: 'from-primary to-secondary' },
  { id: 'articles', label: 'Articles', icon: 'article', color: 'from-emerald-500 to-teal-500' },
  { id: 'videos', label: 'Videos', icon: 'play_circle', color: 'from-red-500 to-pink-500' },
  { id: 'health', label: 'Health Store', icon: 'local_pharmacy', color: 'from-blue-500 to-cyan-500' },
  { id: 'beauty', label: 'Beauty', icon: 'spa', color: 'from-pink-500 to-rose-500' },
  { id: 'nutrition', label: 'Nutrition', icon: 'restaurant', color: 'from-orange-500 to-amber-500' },
] as const;

type CategoryId = typeof SEARCH_CATEGORIES[number]['id'];

// Unified search result type
interface SearchResult {
  id: string;
  type: 'article' | 'video' | 'health-product' | 'beauty-product' | 'nutrition';
  title: string;
  description?: string;
  imageUrl: string;
  meta?: {
    price?: number;
    duration?: string;
    category?: string;
    nutrients?: { protein: number; carbs: number; fats: number };
  };
  link: string;
  externalLink?: boolean;
  originalData?: Video;
  originalArticle?: Article;
}

// Popular searches for empty state
const POPULAR_SEARCHES = [
  { query: 'skincare routine', icon: 'face' },
  { query: 'vitamins', icon: 'medication' },
  { query: 'yoga', icon: 'self_improvement' },
  { query: 'healthy recipes', icon: 'restaurant' },
  { query: 'makeup tutorial', icon: 'brush' },
  { query: 'protein', icon: 'fitness_center' },
];

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<Video | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Transform API results to unified format
  const transformResults = useCallback((
    articles: Article[] = [],
    videos: Video[] = [],
    healthProducts: EbayProductSummary[] = [],
    beautyProducts: EbayProductSummary[] = [],
    nutritionItems: NutritionInfo[] = []
  ): SearchResult[] => {
    const transformed: SearchResult[] = [];

    articles.forEach(item => {
      transformed.push({
        id: item.id,
        type: 'article',
        title: item.title,
        description: item.description,
        imageUrl: item.imageUrl,
        meta: { category: item.category },
        link: `/article/${encodeURIComponent(item.id)}`,
        // Store full article data for direct navigation
        originalArticle: item,
      });
    });

    videos.forEach(item => {
      transformed.push({
        id: item.id,
        type: 'video',
        title: item.title,
        description: item.description,
        imageUrl: item.imageUrl,
        meta: { duration: item.duration },
        link: '#',
        originalData: item,
      });
    });

    healthProducts.forEach(item => {
      transformed.push({
        id: item.id,
        type: 'health-product',
        title: item.title,
        imageUrl: item.imageUrl,
        meta: { price: item.price.value },
        link: `/health-store?q=${encodeURIComponent(item.title)}`,
        externalLink: false,
      });
    });

    beautyProducts.forEach(item => {
      transformed.push({
        id: item.id,
        type: 'beauty-product',
        title: item.title,
        imageUrl: item.imageUrl,
        meta: { price: item.price.value },
        link: `/beauty?q=${encodeURIComponent(item.title)}`,
        externalLink: false,
      });
    });

    nutritionItems.forEach(item => {
      transformed.push({
        id: item.id,
        type: 'nutrition',
        title: item.name,
        description: item.description,
        imageUrl: item.imageUrl,
        meta: { nutrients: item.nutrients },
        link: `/nutrition?search=${encodeURIComponent(item.name)}`,
      });
    });

    return transformed;
  }, []);

  // Perform search across all or specific categories
  const performSearch = useCallback(async (searchQuery: string, category: CategoryId) => {
    if (searchQuery.length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      let articles: Article[] = [];
      let videos: Video[] = [];
      let healthProducts: EbayProductSummary[] = [];
      let beautyProducts: EbayProductSummary[] = [];
      let nutritionItems: NutritionInfo[] = [];

      const searchPromises: Promise<void>[] = [];

      // Fetch based on category
      if (category === 'all' || category === 'articles') {
        searchPromises.push(
          searchAll(searchQuery, { type: 'Article', sort: 'Relevance' })
            .then(res => { articles = res; })
            .catch(() => { articles = []; })
        );
      }

      if (category === 'all' || category === 'videos') {
        searchPromises.push(
          searchVideos(searchQuery, 'all')
            .then(res => { videos = res.videos.slice(0, category === 'all' ? 4 : 12); })
            .catch(() => { videos = []; })
        );
      }

      if (category === 'all' || category === 'health') {
        searchPromises.push(
          searchHealthProducts({ q: searchQuery, pageSize: category === 'all' ? 4 : 12 })
            .then(res => { healthProducts = res.items; })
            .catch(() => { healthProducts = []; })
        );
      }

      if (category === 'all' || category === 'beauty') {
        searchPromises.push(
          searchBeautyProducts({ q: searchQuery, pageSize: category === 'all' ? 4 : 12 })
            .then(res => { beautyProducts = res.items; })
            .catch(() => { beautyProducts = []; })
        );
      }

      if (category === 'all' || category === 'nutrition') {
        searchPromises.push(
          searchUSDAFoods(searchQuery, 1, category === 'all' ? 4 : 12)
            .then(res => { nutritionItems = res.data; })
            .catch(() => { nutritionItems = []; })
        );
      }

      await Promise.all(searchPromises);

      const transformed = transformResults(articles, videos, healthProducts, beautyProducts, nutritionItems);
      setResults(transformed);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [transformResults]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      performSearch(query, activeCategory);
    }, 400);
    return () => clearTimeout(handler);
  }, [query, activeCategory, performSearch]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setSearched(false);
      setActiveCategory('all');
    } else {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'video' && result.originalData) {
      setPlayingVideo(result.originalData);
      onClose(); // Close modal when video plays
    } else if (result.type === 'article' && result.originalArticle) {
      // Store article data in sessionStorage for the article page to use
      try {
        sessionStorage.setItem('pendingArticle', JSON.stringify(result.originalArticle));
      } catch (e) {
        console.error('Failed to store article in sessionStorage:', e);
      }
      onClose();
    } else if (!result.externalLink) {
      onClose();
    }
  };

  const handlePopularSearch = (searchTerm: string) => {
    setQuery(searchTerm);
  };

  // Filter results by category for display
  const getFilteredResults = () => {
    if (activeCategory === 'all') return results;
    const typeMap: Record<CategoryId, SearchResult['type'][]> = {
      all: [],
      articles: ['article'],
      videos: ['video'],
      health: ['health-product'],
      beauty: ['beauty-product'],
      nutrition: ['nutrition'],
    };
    return results.filter(r => typeMap[activeCategory]?.includes(r.type));
  };

  // Group results by type for "All" view
  const groupedResults = () => {
    const groups: Record<string, SearchResult[]> = {};
    results.forEach(result => {
      if (!groups[result.type]) groups[result.type] = [];
      groups[result.type].push(result);
    });
    return groups;
  };

  const filteredResults = getFilteredResults();
  const grouped = activeCategory === 'all' ? groupedResults() : null;

  return (
    <>
      {/* Video Player - renders independently of modal state */}
      {playingVideo && (
        <VideoPlayer video={playingVideo} onClose={() => setPlayingVideo(null)} />
      )}

      {/* Search Modal */}
      {isOpen && (
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-start justify-center pt-[5vh] sm:pt-[10vh] px-3 sm:px-4" 
        onClick={onClose}
      >
        <div 
          className="bg-white dark:bg-gray-900 w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[80vh] overflow-hidden border border-gray-200 dark:border-gray-700" 
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Header */}
          <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary/5 to-secondary/5 dark:from-primary/10 dark:to-secondary/10">
            <div className="flex items-center gap-2 sm:gap-3 bg-white dark:bg-gray-800 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 shadow-sm border border-gray-200 dark:border-gray-700">
              <span className="material-symbols-outlined text-xl sm:text-2xl text-primary">search</span>
              <input
                ref={inputRef}
                type="text"
                placeholder="Search articles, videos, products..."
                className="flex-1 bg-transparent focus:outline-none text-base sm:text-lg text-gray-900 dark:text-gray-100 placeholder-gray-400"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button 
                  onClick={() => setQuery('')}
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg text-gray-400">close</span>
                </button>
              )}
              <button 
                onClick={onClose} 
                className="p-1.5 sm:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ml-1"
                aria-label="Close search"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Category Pills */}
            <div className="flex gap-1.5 sm:gap-2 mt-3 overflow-x-auto scrollbar-hide pb-1">
              {SEARCH_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                    activeCategory === cat.id
                      ? `bg-gradient-to-r ${cat.color} text-white shadow-md`
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="material-symbols-outlined text-base sm:text-lg">{cat.icon}</span>
                  <span className="hidden sm:inline">{cat.label}</span>
                  <span className="sm:hidden">{cat.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Results Area */}
          <div className="flex-1 overflow-y-auto">
            {/* Loading State */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-12 sm:py-16">
                <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">Searching across the site...</p>
              </div>
            )}

            {/* Empty State - Popular Searches */}
            {!loading && !searched && query.length < 2 && (
              <div className="p-4 sm:p-6">
                <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 sm:mb-4">
                  Popular Searches
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {POPULAR_SEARCHES.map(item => (
                    <button
                      key={item.query}
                      onClick={() => handlePopularSearch(item.query)}
                      className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left group"
                    >
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <span className="material-symbols-outlined text-lg sm:text-xl text-primary">{item.icon}</span>
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{item.query}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {!loading && searched && filteredResults.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-3xl sm:text-4xl text-gray-400">search_off</span>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">No results found</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
                  We couldn&apos;t find anything for &quot;{query}&quot;. Try a different search term or category.
                </p>
              </div>
            )}

            {/* Results - Grouped View (All category) */}
            {!loading && searched && activeCategory === 'all' && grouped && Object.keys(grouped).length > 0 && (
              <div className="p-3 sm:p-4 space-y-6">
                {Object.entries(grouped).map(([type, items]) => (
                  <ResultSection 
                    key={type} 
                    type={type as SearchResult['type']} 
                    items={items} 
                    onResultClick={handleResultClick}
                    onClose={onClose}
                  />
                ))}
              </div>
            )}

            {/* Results - Single Category View */}
            {!loading && searched && activeCategory !== 'all' && filteredResults.length > 0 && (
              <div className="p-3 sm:p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredResults.map(result => (
                    <ResultCard 
                      key={result.id} 
                      result={result} 
                      onClick={() => handleResultClick(result)}
                      onClose={onClose}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-2 sm:p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px]">ESC</kbd>
                <span className="hidden sm:inline">to close</span>
              </span>
              {searched && filteredResults.length > 0 && (
                <span>{filteredResults.length} results found</span>
              )}
            </div>
          </div>
        </div>
      </div>
      )}
    </>
  );
};

// Result Section Component for grouped view
function ResultSection({ 
  type, 
  items, 
  onResultClick,
  onClose 
}: { 
  type: SearchResult['type']; 
  items: SearchResult[]; 
  onResultClick: (result: SearchResult) => void;
  onClose: () => void;
}) {
  const config = {
    'article': { title: 'Articles', icon: 'article', color: 'text-emerald-500' },
    'video': { title: 'Videos', icon: 'play_circle', color: 'text-red-500' },
    'health-product': { title: 'Health Store', icon: 'local_pharmacy', color: 'text-blue-500' },
    'beauty-product': { title: 'Beauty Products', icon: 'spa', color: 'text-pink-500' },
    'nutrition': { title: 'Nutrition', icon: 'restaurant', color: 'text-orange-500' },
  }[type];

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className={`material-symbols-outlined ${config.color}`}>{config.icon}</span>
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">{config.title}</h3>
        <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{items.length}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        {items.slice(0, 4).map(result => (
          <ResultCard 
            key={result.id} 
            result={result} 
            onClick={() => onResultClick(result)} 
            onClose={onClose}
          />
        ))}
      </div>
    </div>
  );
}

// Individual Result Card
function ResultCard({ 
  result, 
  onClick,
  onClose 
}: { 
  result: SearchResult; 
  onClick: () => void;
  onClose: () => void;
}) {
  const typeStyles = {
    'article': 'bg-emerald-500',
    'video': 'bg-red-500',
    'health-product': 'bg-blue-500',
    'beauty-product': 'bg-pink-500',
    'nutrition': 'bg-orange-500',
  }[result.type];

  const typeLabels = {
    'article': 'Article',
    'video': 'Video',
    'health-product': 'Health',
    'beauty-product': 'Beauty',
    'nutrition': 'Nutrition',
  }[result.type];

  const content = (
    <div className="flex gap-3 p-2.5 sm:p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-primary/50 hover:shadow-md transition-all group cursor-pointer">
      {/* Image */}
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-700">
        <img 
          src={result.imageUrl} 
          alt={result.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
        />
        {result.type === 'video' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <span className="material-symbols-outlined text-white text-2xl">play_circle</span>
          </div>
        )}
        <span className={`absolute top-1 left-1 px-1.5 py-0.5 ${typeStyles} text-white text-[9px] sm:text-[10px] font-medium rounded`}>
          {typeLabels}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <h4 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2 group-hover:text-primary transition-colors">
          {result.title}
        </h4>
        {result.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
            {result.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1">
          {result.meta?.price && (
            <span className="text-sm font-bold text-primary">${result.meta.price.toFixed(2)}</span>
          )}
          {result.meta?.duration && (
            <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
              {result.meta.duration}
            </span>
          )}
          {result.meta?.category && (
            <span className="text-xs text-gray-400">{result.meta.category}</span>
          )}
          {result.meta?.nutrients && (
            <div className="flex gap-1 text-[10px]">
              <span className="text-blue-500">P:{result.meta.nutrients.protein}g</span>
              <span className="text-amber-500">C:{result.meta.nutrients.carbs}g</span>
            </div>
          )}
          {result.externalLink && (
            <span className="material-symbols-outlined text-xs text-gray-400">open_in_new</span>
          )}
        </div>
      </div>
    </div>
  );

  if (result.type === 'video') {
    return <div onClick={onClick}>{content}</div>;
  }

  if (result.externalLink) {
    return (
      <a href={result.link} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return (
    <Link href={result.link} onClick={onClose}>
      {content}
    </Link>
  );
}

export default SearchModal;
