import React, { useState, useCallback } from 'react';
import ArticleCard from '../components/ArticleCard';
import { useApi } from '../hooks/useApi';
import { getArticles } from '../services/apiService';
import ErrorMessage from '../components/ErrorMessage';
import ArticleCardSkeleton from '../components/skeletons/ArticleCardSkeleton';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

const CATEGORIES = ['All', 'Nutrition', 'Fitness', 'Mental Health', 'Skincare'];

const HealthPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Debounce search query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 800);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Create a wrapper function that passes the category and query to getArticles
  const fetchArticlesWithCategory = useCallback((page: number) => getArticles(page, activeCategory, debouncedSearchQuery), [activeCategory, debouncedSearchQuery]);

  // Use activeCategory and debouncedSearchQuery as dependency to refetch when they change
  const { data: articles, loading, loadingMore, error, loadMore, hasMore, refetch } = useApi(
    fetchArticlesWithCategory,
    [activeCategory, debouncedSearchQuery]
  );

  const lastElementRef = useInfiniteScroll({
    loading: loadingMore,
    hasMore,
    onLoadMore: loadMore,
  });

  // No client-side filtering needed as API handles it
  const displayArticles = articles;
  const hasSearchOrFilter = searchQuery.trim() !== '' || activeCategory !== 'All';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 mt-8">
            {/* Header */}
            <div className="flex flex-wrap items-end justify-between gap-4 p-4">
                <div className="flex min-w-72 flex-col gap-2">
                    <h1 className="text-4xl lg:text-5xl font-black tracking-[-0.033em]">Health & Wellness Articles</h1>

                </div>
            </div>

            {/* Search Bar */}
            <div className="px-4">
                <div className="relative max-w-2xl">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-subtle-light dark:text-text-subtle-dark">
                        search
                    </span>
                    <input
                        type="text"
                        placeholder="Search for specific topics... (e.g., 'vitamin D', 'yoga', 'sleep hygiene')"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-full border-2 border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:border-primary focus:outline-none transition-colors"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-subtle-light dark:text-text-subtle-dark hover:text-primary transition-colors"
                            aria-label="Clear search"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    )}
                </div>
                {searchQuery && (
                    <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark mt-2 px-1">
                        Found {displayArticles.length} article{displayArticles.length !== 1 ? 's' : ''} matching "{searchQuery}"
                    </p>
                )}
            </div>

            {/* Category Filter Pills - using flex-wrap instead of overflow-x-auto */}
            <div className="flex flex-wrap gap-2 md:gap-3 p-3">
                {CATEGORIES.map(category => (
                    <button 
                        key={category}
                        onClick={() => setActiveCategory(category)}
                        className={`flex h-11 shrink-0 cursor-pointer items-center justify-center gap-x-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                            activeCategory === category
                            ? 'bg-primary text-white'
                            : 'bg-border-light dark:bg-border-dark text-text-subtle-light dark:text-text-subtle-dark hover:bg-primary/20 dark:hover:bg-primary/20'
                        }`}
                    >
                        {category}
                    </button>
                ))}
            </div>

            {error && <ErrorMessage message={error} />}
            
            {/* Articles Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-4">
                {loading 
                    ? Array.from({ length: 8 }).map((_, i) => <ArticleCardSkeleton key={i} />)
                    : displayArticles.map((article) => (
                        <ArticleCard key={article.id} article={article} />
                    ))
                }
                {loadingMore && Array.from({ length: 4 }).map((_, i) => (
                    <ArticleCardSkeleton key={`loading-${i}`} />
                ))}
                
                {/* Infinite scroll sentinel - shows when there are more articles to load */}
                {!loading && !loadingMore && hasMore && displayArticles.length > 0 && (
                    <div
                        key={`sentinel-${activeCategory}`}
                        ref={lastElementRef}
                        style={{ height: '20px', width: '100%', gridColumn: '1 / -1' }}
                    />
                )}
            </div>

            {/* End message when all articles loaded */}
            {!loading && !hasMore && displayArticles.length > 0 && (
                <p className="text-center text-text-subtle-light dark:text-text-subtle-dark pb-8">
                    You've reached the end! Check back later for more articles.
                </p>
            )}

            {/* No results message */}
            {!loading && displayArticles.length === 0 && hasSearchOrFilter && (
                <div className="text-center py-12">
                    <span className="material-symbols-outlined text-6xl text-text-subtle-light dark:text-text-subtle-dark mb-4 block">
                        search_off
                    </span>
                    <h3 className="text-xl font-semibold text-text-light dark:text-text-dark mb-2">
                        No articles found
                    </h3>
                    <p className="text-text-subtle-light dark:text-text-subtle-dark mb-4">
                        Try adjusting your search or filter to find what you're looking for.
                    </p>
                    <button
                        onClick={() => {
                            setSearchQuery('');
                            setActiveCategory('All');
                        }}
                        className="px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-all"
                    >
                        Clear Filters
                    </button>
                </div>
            )}
        </div>
    </div>
  );
};

export default HealthPage;
