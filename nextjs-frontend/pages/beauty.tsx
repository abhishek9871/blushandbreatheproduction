'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { searchBeautyProducts } from '@/services/apiService';
import { ErrorMessage, BookmarkButton } from '@/components';
import { ProductCardSkeleton } from '@/components/skeletons';
import type { EbaySearchParams, EbayProductSummary, EbaySearchResponse } from '@/types';
import { getHighQualityEbayImage } from '@/utils/productUtils';

export default function BeautyPage() {
  const router = useRouter();
  const { query, isReady } = router;

  const [products, setProducts] = useState<EbayProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 24, total: 0, hasNextPage: false });

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);

  // API category values
  const categories = ['all', 'skincare', 'makeup', 'fragrance', 'hair', 'nails'] as const;
  type BeautyCategory = typeof categories[number];

  // Display labels for categories
  const categoryLabels: Record<BeautyCategory, string> = {
    all: 'All',
    skincare: 'Skincare',
    makeup: 'Makeup',
    fragrance: 'Fragrance',
    hair: 'Hair Care',
    nails: 'Nails & Bath'
  };

  // Get filter values from URL
  const rawCategory = query.category as string;
  const category: BeautyCategory = (rawCategory && categories.includes(rawCategory as any))
    ? (rawCategory as BeautyCategory)
    : 'all';

  const sort = (query.sort as EbaySearchParams['sort']) || 'best';
  const minPrice = query.minPrice ? Number(query.minPrice) : undefined;
  const maxPrice = query.maxPrice ? Number(query.maxPrice) : undefined;
  const page = Number(query.page) || 1;
  const q = (query.q as string) || '';

  const sortOptions = ['best', 'priceAsc', 'priceDesc', 'newest'] as const;
  const priceRanges = [
    { label: 'All Prices', min: undefined, max: undefined },
    { label: 'Under $25', min: undefined, max: 25 },
    { label: '$25 - $50', min: 25, max: 50 },
    { label: '$50 - $100', min: 50, max: 100 },
    { label: 'Over $100', min: 100, max: undefined },
  ];

  const sortLabels: Record<typeof sortOptions[number], string> = {
    best: 'Best Match',
    priceAsc: 'Price: Low to High',
    priceDesc: 'Price: High to Low',
    newest: 'Newly Listed'
  };

  // Initialize searchQuery from URL when ready
  useEffect(() => {
    if (isReady && q) {
      setSearchQuery(q);
    }
  }, [isReady, q]);

  // Ref for detecting clicks outside the filter bar
  const filtersRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!filtersRef.current) return;
      if (!(event.target instanceof Node)) return;
      if (!filtersRef.current.contains(event.target)) {
        setShowPriceDropdown(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowPriceDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Fetch products when filters change
  useEffect(() => {
    if (!isReady) return;

    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const params: EbaySearchParams = {
          q,
          category,
          sort,
          minPrice,
          maxPrice,
          page,
          pageSize: 24
        };

        const response: EbaySearchResponse = await searchBeautyProducts(params);
        setProducts(response.items);
        setPagination(response.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load beauty products');
        console.error('Beauty search error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [isReady, q, category, sort, minPrice, maxPrice, page]);

  const updateSearchParam = (key: string, value: string | number | undefined) => {
    const newQuery = { ...query };

    if (value === undefined || value === '' || value === 'all') {
      delete newQuery[key];
    } else {
      newQuery[key] = String(value);
    }

    // Reset to page 1 when changing filters
    if (key !== 'page') {
      delete newQuery.page;
    }

    router.push({ pathname: router.pathname, query: newQuery }, undefined, { scroll: false });
  };

  // Pagination handler - scrolls to top after page change
  const handlePageChange = (newPage: number) => {
    const newQuery = { ...query };
    newQuery.page = String(newPage);
    router.push({ pathname: router.pathname, query: newQuery }, undefined, { scroll: false })
      .then(() => {
        // Scroll to top after navigation completes
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateSearchParam('q', searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    const newQuery = { ...query };
    delete newQuery.q;
    delete newQuery.page;
    router.push({ pathname: router.pathname, query: newQuery }, undefined, { scroll: false });
  };

  const handlePriceRangeSelect = (min: number | undefined, max: number | undefined) => {
    const newQuery = { ...query };

    if (min !== undefined) newQuery.minPrice = String(min);
    else delete newQuery.minPrice;

    if (max !== undefined) newQuery.maxPrice = String(max);
    else delete newQuery.maxPrice;

    delete newQuery.page;
    router.push({ pathname: router.pathname, query: newQuery }, undefined, { scroll: false });
    setShowPriceDropdown(false);
  };

  const currentPriceLabel = useMemo(() => {
    const range = priceRanges.find(r => r.min === minPrice && r.max === maxPrice);
    return range ? range.label : 'All Prices';
  }, [minPrice, maxPrice]);

  return (
    <>
      <Head>
        <title>Beauty Store | Blush & Breathe</title>
        <meta name="description" content="Discover the latest beauty products. Shop skincare, makeup, fragrance, and more from top brands." />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-wrap justify-between gap-3 p-4">
          <h1 className="text-4xl font-black leading-tight tracking-[-0.033em] min-w-72 text-gray-900 dark:text-gray-100">Explore Beauty</h1>
        </div>

        {/* Hero Banner */}
        <div className="px-4 py-3">
          <div className="bg-cover bg-center flex flex-col justify-end overflow-hidden rounded-xl min-h-[350px] shadow-lg" style={{ backgroundImage: 'linear-gradient(0deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0) 45%), url("https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200")' }}>
            <div className="flex p-8">
              <p className="text-white tracking-light text-4xl font-bold leading-tight max-w-lg">Glow Up: Discover Your Perfect Shade</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search beauty products..."
                className="w-full h-12 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 pr-10 text-gray-900 dark:text-gray-100"
              />
              {(searchQuery || q) && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Clear search"
                >
                  <span className="material-symbols-outlined text-gray-500 text-xl">close</span>
                </button>
              )}
            </div>
            <button
              type="submit"
              className="h-12 px-6 rounded-full bg-secondary text-white hover:bg-secondary/90 transition-colors font-medium"
            >
              Search
            </button>
          </form>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 px-4 py-4">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => updateSearchParam('category', cat)}
              className={`flex h-10 sm:h-11 shrink-0 cursor-pointer items-center justify-center gap-x-2 rounded-full px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-medium transition-colors ${category === cat ? 'bg-secondary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-secondary/20'}`}
            >
              {categoryLabels[cat]}
            </button>
          ))}
        </div>

        {/* Filters Row - Price & Sort */}
        <div ref={filtersRef} className="flex flex-wrap gap-3 px-4 pb-4">
          {/* Price Range Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowPriceDropdown(!showPriceDropdown)}
              className="flex h-10 sm:h-11 shrink-0 items-center justify-center gap-x-2 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <p className="text-sm font-medium leading-normal text-gray-700 dark:text-gray-300">Price: {currentPriceLabel}</p>
              <span className="material-symbols-outlined text-xl">{showPriceDropdown ? 'expand_less' : 'expand_more'}</span>
            </button>
            {showPriceDropdown && (
              <div className="absolute top-12 left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-40">
                {priceRanges.map((range, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePriceRangeSelect(range.min, range.max)}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300"
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort Button */}
          <button
            onClick={() => {
              const currentIndex = sortOptions.indexOf(sort);
              const nextSort = sortOptions[(currentIndex + 1) % sortOptions.length];
              updateSearchParam('sort', nextSort);
            }}
            className="flex h-10 sm:h-11 shrink-0 items-center justify-center gap-x-2 rounded-full bg-secondary/20 text-gray-700 dark:text-gray-300 border border-secondary/30 px-4 hover:bg-secondary/40 transition-colors"
          >
            <p className="text-sm font-medium leading-normal">Sort: {sortLabels[sort]}</p>
            <span className="material-symbols-outlined text-xl">swap_vert</span>
          </button>
        </div>

        {/* Error Message */}
        {error && <ErrorMessage message={error} />}

        {/* Products Grid */}
        <section className="py-8">
          <h2 className="text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-5 text-gray-900 dark:text-gray-100">
            {categoryLabels[category]} Products {pagination.total > 0 && `(${pagination.total.toLocaleString()} found)`}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
            ) : products.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">No beauty products found. Try adjusting your filters.</p>
              </div>
            ) : (
              products.map((product) => (
                <Link
                  key={product.id}
                  href={`/beauty/product/${encodeURIComponent(product.id)}`}
                  className="group flex flex-col overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5 dark:border dark:border-gray-700"
                >
                  <div className="relative">
                    <div className="absolute top-2 left-2 z-10">
                      <BookmarkButton item={{ ...product, contentType: 'BeautyProduct' }} className="bg-white/70 dark:bg-black/70 hover:bg-white dark:hover:bg-black text-gray-500 dark:text-gray-400 hover:text-secondary" />
                    </div>
                    <div className="absolute top-3 right-3 rounded bg-pink-100 px-2 py-1 text-xs font-semibold uppercase text-pink-600 dark:bg-pink-900/50 dark:text-pink-300">
                      FOR BEAUTY
                    </div>
                    <div className="aspect-square w-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                      <img
                        alt={product.title}
                        className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                        src={getHighQualityEbayImage(product.imageUrl)}
                      />
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-2">{product.title}</h3>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      {product.condition}
                    </p>
                    <div className="mt-auto flex items-baseline gap-2 pt-4">
                      <span className="text-xl font-bold text-gray-900 dark:text-white">
                        ${product.price.value.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <button className="mt-auto m-4 flex h-10 w-[calc(100%-2rem)] items-center justify-center rounded-md bg-secondary px-6 text-sm font-semibold text-white transition-colors hover:bg-secondary/90">
                    Shop Now
                  </button>
                </Link>
              ))
            )}
          </div>

          {/* Pagination */}
          {!loading && (pagination.total > 0 || page > 1) && (
            <div className="flex flex-col items-center gap-3 mt-8">
              <div className="flex justify-center items-center gap-2">
                {/* First Page Button */}
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={page <= 1}
                  className="p-2 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="First page"
                >
                  <span className="material-symbols-outlined text-xl">first_page</span>
                </button>
                {/* Previous Button */}
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="px-5 py-2 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                {/* Page Indicator */}
                <span className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Page {page}
                </span>
                {/* Next Button */}
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={!pagination.hasNextPage}
                  className="px-5 py-2 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
                {/* Skip Forward Button */}
                <button
                  onClick={() => handlePageChange(Math.min(page + 10, 200))}
                  disabled={!pagination.hasNextPage}
                  className="p-2 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Skip forward 10 pages"
                >
                  <span className="material-symbols-outlined text-xl">last_page</span>
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
