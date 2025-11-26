'use client';

import Head from 'next/head';
import { useState, useEffect, useCallback } from 'react';
import type { GetStaticProps, InferGetStaticPropsType } from 'next';
import { getArticles } from '@/services/apiService';
import { ArticleCard, ErrorMessage } from '@/components';
import { ArticleCardSkeleton } from '@/components/skeletons';
import type { Article } from '@/types';

const CATEGORIES = ['All', 'Nutrition', 'Fitness', 'Mental Health', 'Skincare'];

interface HealthPageProps {
  initialArticles: Article[];
}

export const getStaticProps: GetStaticProps<HealthPageProps> = async () => {
  try {
    const { data: articles } = await getArticles(1, undefined, undefined);
    return {
      props: { initialArticles: articles || [] },
      revalidate: 3600,
    };
  } catch (error) {
    console.error('Failed to fetch health articles:', error);
    return {
      props: { initialArticles: [] },
      revalidate: 60,
    };
  }
};

export default function HealthPage({ initialArticles }: InferGetStaticPropsType<typeof getStaticProps>) {
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  // Client-side filtering
  const fetchArticles = useCallback(async (pageNum: number, category: string, query: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, hasMore: more } = await getArticles(pageNum, category === 'All' ? undefined : category, query || undefined);
      if (pageNum === 1) {
        setArticles(data);
      } else {
        setArticles(prev => [...prev, ...data]);
      }
      setHasMore(more);
    } catch {
      setError('Failed to load articles');
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchArticles(1, activeCategory, searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [activeCategory, searchQuery, fetchArticles]);

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchArticles(nextPage, activeCategory, searchQuery);
    }
  };

  return (
    <>
      <Head>
        <title>Health & Wellness Articles | Blush & Breathe</title>
        <meta name="description" content="Explore health and wellness articles covering nutrition, fitness, mental health, and skincare tips." />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 mt-8">
          {/* Header */}
          <div className="flex flex-wrap items-end justify-between gap-4 p-4">
            <div className="flex min-w-72 flex-col gap-2">
              <h1 className="text-4xl lg:text-5xl font-black tracking-[-0.033em] text-gray-900 dark:text-gray-100">Health & Wellness Articles</h1>
            </div>
          </div>

          {/* Search Bar */}
          <div className="px-4">
            <div className="relative max-w-2xl">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">search</span>
              <input
                type="text"
                placeholder="Search for specific topics... (e.g., 'vitamin D', 'yoga', 'sleep hygiene')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-full border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-primary transition-colors" aria-label="Clear search">
                  <span className="material-symbols-outlined">close</span>
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 px-1">
                Found {articles.length} article{articles.length !== 1 ? 's' : ''} matching &quot;{searchQuery}&quot;
              </p>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2 md:gap-3 p-3">
            {CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`flex h-11 shrink-0 cursor-pointer items-center justify-center gap-x-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                  activeCategory === category
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-primary/20 dark:hover:bg-primary/20'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {error && <ErrorMessage message={error} />}

          {/* Articles Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-4">
            {loading && articles.length === 0 ? (
              Array.from({ length: 8 }).map((_, i) => <ArticleCardSkeleton key={i} />)
            ) : (
              articles.map((article) => <ArticleCard key={article.id} article={article} />)
            )}
          </div>

          {/* Load More Button */}
          {hasMore && articles.length > 0 && (
            <div className="text-center pb-8">
              <button
                onClick={loadMore}
                disabled={loading}
                className="px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Load More Articles'}
              </button>
            </div>
          )}

          {/* End Message */}
          {!loading && !hasMore && articles.length > 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 pb-8">
              You&apos;ve reached the end! Check back later for more articles.
            </p>
          )}

          {/* No Results */}
          {!loading && articles.length === 0 && (searchQuery || activeCategory !== 'All') && (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-6xl text-gray-400 dark:text-gray-500 mb-4 block">search_off</span>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No articles found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Try adjusting your search or filter to find what you&apos;re looking for.</p>
              <button
                onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                className="px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-all"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
