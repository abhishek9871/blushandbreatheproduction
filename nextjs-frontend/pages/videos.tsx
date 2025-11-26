'use client';

import Head from 'next/head';
import { useState, useEffect, useCallback, useRef } from 'react';
import { getShorts, getLongVideos, searchVideos } from '@/services/apiService';
import { VideoCard, ErrorMessage } from '@/components';
import { VideoCardSkeleton } from '@/components/skeletons';
import type { Video } from '@/types';

const CATEGORIES = ['All', 'Skincare', 'Makeup', 'Wellness', 'Nutrition', 'Haircare', 'Fitness'];

export default function VideosPage() {
  // State for shorts
  const [shorts, setShorts] = useState<Video[]>([]);
  const [shortsLoading, setShortsLoading] = useState(true);
  const [shortsPageToken, setShortsPageToken] = useState<string | null>(null);
  const [shortsHasMore, setShortsHasMore] = useState(true);

  // State for long videos
  const [longVideos, setLongVideos] = useState<Video[]>([]);
  const [longLoading, setLongLoading] = useState(true);
  const [longPageToken, setLongPageToken] = useState<string | null>(null);
  const [longHasMore, setLongHasMore] = useState(true);

  // State for search
  const [searchQuery, setSearchQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Video[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchPageToken, setSearchPageToken] = useState<string | null>(null);
  const [searchHasMore, setSearchHasMore] = useState(false);

  // General state
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [error, setError] = useState<string | null>(null);

  // Refs for infinite scroll
  const longVideosEndRef = useRef<HTMLDivElement>(null);
  const searchResultsEndRef = useRef<HTMLDivElement>(null);
  const shortsContainerRef = useRef<HTMLDivElement>(null);

  // Fetch shorts
  const fetchShorts = useCallback(async (category: string, pageToken?: string) => {
    setShortsLoading(true);
    try {
      const result = await getShorts(category, pageToken);
      if (pageToken) {
        setShorts(prev => [...prev, ...result.videos]);
      } else {
        setShorts(result.videos);
      }
      setShortsPageToken(result.nextPageToken);
      setShortsHasMore(result.hasMore);
    } catch (err) {
      console.error('Failed to fetch shorts:', err);
    } finally {
      setShortsLoading(false);
    }
  }, []);

  // Fetch long videos
  const fetchLongVideos = useCallback(async (category: string, pageToken?: string) => {
    setLongLoading(true);
    try {
      const result = await getLongVideos(category, pageToken);
      if (pageToken) {
        setLongVideos(prev => [...prev, ...result.videos]);
      } else {
        setLongVideos(result.videos);
      }
      setLongPageToken(result.nextPageToken);
      setLongHasMore(result.hasMore);
    } catch (err) {
      console.error('Failed to fetch long videos:', err);
      setError('Failed to load videos. Please try again.');
    } finally {
      setLongLoading(false);
    }
  }, []);

  // Fetch search results
  const fetchSearchResults = useCallback(async (query: string, pageToken?: string) => {
    if (!query.trim()) return;
    setSearchLoading(true);
    try {
      const result = await searchVideos(query, 'all', pageToken);
      if (pageToken) {
        setSearchResults(prev => [...prev, ...result.videos]);
      } else {
        setSearchResults(result.videos);
      }
      setSearchPageToken(result.nextPageToken);
      setSearchHasMore(result.hasMore);
    } catch (err) {
      console.error('Failed to search videos:', err);
      setError('Search failed. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Initial load and category change
  useEffect(() => {
    if (!submittedQuery) {
      fetchShorts(selectedCategory);
      fetchLongVideos(selectedCategory);
    }
  }, [selectedCategory, submittedQuery, fetchShorts, fetchLongVideos]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSubmittedQuery(searchQuery.trim());
      setSearchResults([]);
      setSearchPageToken(null);
      fetchSearchResults(searchQuery.trim());
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setSubmittedQuery('');
    setSearchResults([]);
    setSearchPageToken(null);
    setSearchHasMore(false);
  };

  // Infinite scroll observer for long videos
  useEffect(() => {
    if (!longVideosEndRef.current || submittedQuery) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && longHasMore && !longLoading && longPageToken) {
          fetchLongVideos(selectedCategory, longPageToken);
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(longVideosEndRef.current);
    return () => observer.disconnect();
  }, [longHasMore, longLoading, longPageToken, selectedCategory, fetchLongVideos, submittedQuery]);

  // Infinite scroll observer for search results
  useEffect(() => {
    if (!searchResultsEndRef.current || !submittedQuery) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && searchHasMore && !searchLoading && searchPageToken) {
          fetchSearchResults(submittedQuery, searchPageToken);
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(searchResultsEndRef.current);
    return () => observer.disconnect();
  }, [searchHasMore, searchLoading, searchPageToken, submittedQuery, fetchSearchResults]);

  // Scroll shorts horizontally
  const scrollShorts = (direction: 'left' | 'right') => {
    if (shortsContainerRef.current) {
      const scrollAmount = 300;
      shortsContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Load more shorts
  const loadMoreShorts = () => {
    if (shortsHasMore && !shortsLoading && shortsPageToken) {
      fetchShorts(selectedCategory, shortsPageToken);
    }
  };

  return (
    <>
      <Head>
        <title>Videos | Blush & Breathe</title>
        <meta name="description" content="Watch health, beauty, nutrition, and wellness videos. From quick tips to in-depth tutorials." />
      </Head>

      <div className="min-h-screen">
        {/* Hero Section */}
        <div className="bg-gradient-to-b from-accent/10 to-transparent py-12 md:py-16">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center text-center">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-text-light dark:text-text-dark">
                Video Library
              </h1>
              <p className="mt-4 max-w-2xl text-lg text-text-subtle-light dark:text-text-subtle-dark">
                Discover top-rated health, beauty, and wellness videos from expert creators
              </p>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="mt-8 w-full max-w-2xl">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-subtle-light dark:text-text-subtle-dark">
                      search
                    </span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search videos (e.g., skincare routine, healthy recipes...)"
                      className="w-full pl-12 pr-12 py-4 text-lg bg-white dark:bg-[#1C2C1F] border-2 border-border-light dark:border-border-dark rounded-xl shadow-sm focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all placeholder:text-text-subtle-light dark:placeholder:text-text-subtle-dark"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={clearSearch}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                      >
                        <span className="material-symbols-outlined text-text-subtle-light dark:text-text-subtle-dark">
                          close
                        </span>
                      </button>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={!searchQuery.trim() || searchLoading}
                    className="px-6 py-4 bg-accent hover:bg-accent/90 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-xl shadow-sm transition-all flex items-center gap-2"
                  >
                    {searchLoading ? (
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span className="material-symbols-outlined">search</span>
                    )}
                    <span className="hidden sm:inline">Search</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 md:px-6 py-8">
          {/* Category Filter */}
          {!submittedQuery && (
            <div className="mb-10 flex flex-wrap items-center justify-center gap-3">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`flex h-11 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 text-sm font-medium transition-all ${
                    selectedCategory === category
                      ? 'bg-accent text-white shadow-md'
                      : 'bg-border-light dark:bg-border-dark text-text-light dark:text-text-dark hover:bg-accent/20'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          )}

          {error && <ErrorMessage message={error} />}

          {/* Search Results */}
          {submittedQuery && (
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-accent text-2xl">search</span>
                  <h2 className="text-2xl font-bold text-text-light dark:text-text-dark">
                    Results for &quot;{submittedQuery}&quot;
                  </h2>
                </div>
                <button
                  onClick={clearSearch}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/10 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                  Clear Search
                </button>
              </div>

              {searchLoading && searchResults.length === 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <VideoCardSkeleton key={i} />
                  ))}
                </div>
              ) : searchResults.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {searchResults.map((video) => (
                      <VideoCard key={video.id} video={video} />
                    ))}
                  </div>
                  <div ref={searchResultsEndRef} className="h-10" />
                  {searchLoading && (
                    <div className="flex justify-center py-8">
                      <span className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-6xl text-text-subtle-light dark:text-text-subtle-dark mb-4">
                    search_off
                  </span>
                  <p className="text-lg text-text-subtle-light dark:text-text-subtle-dark">
                    No videos found for &quot;{submittedQuery}&quot;
                  </p>
                  <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark mt-2">
                    Try different keywords or browse categories
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Main Content (when not searching) */}
          {!submittedQuery && (
            <>
              {/* Shorts Section */}
              <section className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <span className="p-2 bg-red-600 rounded-lg">
                      <span className="material-symbols-outlined text-white">play_arrow</span>
                    </span>
                    <h2 className="text-2xl font-bold text-text-light dark:text-text-dark">
                      Shorts
                    </h2>
                    <span className="text-sm text-text-subtle-light dark:text-text-subtle-dark">
                      Quick tips under 60 seconds
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => scrollShorts('left')}
                      className="p-2 rounded-full bg-border-light dark:bg-border-dark hover:bg-accent/20 transition-colors"
                    >
                      <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <button
                      onClick={() => scrollShorts('right')}
                      className="p-2 rounded-full bg-border-light dark:bg-border-dark hover:bg-accent/20 transition-colors"
                    >
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <div
                    ref={shortsContainerRef}
                    className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {shortsLoading && shorts.length === 0 ? (
                      Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex-shrink-0 w-40 sm:w-48">
                          <div className="aspect-[9/16] rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
                        </div>
                      ))
                    ) : (
                      <>
                        {shorts.map((video) => (
                          <VideoCard key={video.id} video={video} variant="short" />
                        ))}
                        {shortsHasMore && (
                          <button
                            onClick={loadMoreShorts}
                            disabled={shortsLoading}
                            className="flex-shrink-0 w-40 sm:w-48 flex items-center justify-center aspect-[9/16] rounded-xl bg-border-light dark:bg-border-dark hover:bg-accent/20 transition-colors"
                          >
                            {shortsLoading ? (
                              <span className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <div className="text-center">
                                <span className="material-symbols-outlined text-4xl text-accent">add_circle</span>
                                <p className="mt-2 text-sm font-medium text-text-light dark:text-text-dark">Load More</p>
                              </div>
                            )}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </section>

              {/* Long Videos Section */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <span className="p-2 bg-accent rounded-lg">
                    <span className="material-symbols-outlined text-white">smart_display</span>
                  </span>
                  <h2 className="text-2xl font-bold text-text-light dark:text-text-dark">
                    Full Videos
                  </h2>
                  <span className="text-sm text-text-subtle-light dark:text-text-subtle-dark">
                    In-depth tutorials and guides
                  </span>
                </div>

                {longLoading && longVideos.length === 0 ? (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <VideoCardSkeleton key={i} />
                    ))}
                  </div>
                ) : longVideos.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {longVideos.map((video) => (
                        <VideoCard key={video.id} video={video} />
                      ))}
                    </div>
                    <div ref={longVideosEndRef} className="h-10" />
                    {longLoading && (
                      <div className="flex justify-center py-8">
                        <span className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    {!longHasMore && longVideos.length > 0 && (
                      <p className="text-center text-text-subtle-light dark:text-text-subtle-dark pt-12 pb-8">
                        You&apos;ve reached the end! 🎉
                      </p>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <span className="material-symbols-outlined text-6xl text-text-subtle-light dark:text-text-subtle-dark mb-4">
                      video_library
                    </span>
                    <p className="text-lg text-text-subtle-light dark:text-text-subtle-dark">
                      No videos found for this category
                    </p>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </>
  );
}
