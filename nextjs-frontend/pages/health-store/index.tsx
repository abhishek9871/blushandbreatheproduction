import React, { useState, useEffect, useMemo, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { searchHealthProducts } from '@/services/apiService';
import type { EbaySearchParams, EbayProductSummary, EbaySearchResponse } from '@/types';
import { ErrorMessage, BookmarkButton } from '@/components';
import ProductCardSkeleton from '@/components/skeletons/ProductCardSkeleton';
import { getHighQualityEbayImage } from '@/utils/productUtils';

const HealthStorePage: React.FC = () => {
    const router = useRouter();
    const { query, isReady } = router;

    const [products, setProducts] = useState<EbayProductSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState({ page: 1, pageSize: 24, total: 0, hasNextPage: false });

    // UI State
    const [searchQuery, setSearchQuery] = useState('');
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [showConditionDropdown, setShowConditionDropdown] = useState(false);
    const [showPriceDropdown, setShowPriceDropdown] = useState(false);

    const categories = ['all', 'vitamins', 'fitness', 'supplements', 'medical', 'wellness'] as const;
    type HealthCategory = typeof categories[number];

    // Get filter values from URL
    const rawCategory = query.category as EbaySearchParams['category'];
    const category: HealthCategory = (rawCategory && categories.includes(rawCategory as any)) 
        ? (rawCategory as HealthCategory) 
        : 'all';

    const sort = (query.sort as EbaySearchParams['sort']) || 'best';
    const condition = query.condition as EbaySearchParams['condition'];
    const minPrice = query.minPrice ? Number(query.minPrice) : undefined;
    const maxPrice = query.maxPrice ? Number(query.maxPrice) : undefined;
    const page = Number(query.page) || 1;
    const q = (query.q as string) || '';

    // Initialize searchQuery from URL when ready
    useEffect(() => {
        if (isReady && q) {
            setSearchQuery(q);
        }
    }, [isReady, q]);

    const categoryLabels: Record<HealthCategory, string> = {
        all: 'All Health',
        vitamins: 'Vitamins & Minerals',
        fitness: 'Fitness Equipment',
        supplements: 'Supplements',
        medical: 'Medical Supplies',
        wellness: 'Wellness & Remedies'
    };

    const sortOptions = ['best', 'priceAsc', 'priceDesc', 'newest'] as const;
    const conditions = ['new', 'used', 'refurbished'] as const;
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

    // Helper function to get benefit tag based on category
    const getBenefitTag = (cat: HealthCategory): string => {
        const benefitMap: Record<HealthCategory, string> = {
            all: 'FOR HEALTH',
            vitamins: 'FOR WELLNESS',
            fitness: 'FOR PERFORMANCE',
            supplements: 'FOR NUTRITION',
            medical: 'FOR HEALTH',
            wellness: 'FOR BALANCE'
        };
        return benefitMap[cat] || 'FOR HEALTH';
    };

    // Ref for detecting clicks outside the filter bar
    const filtersRef = useRef<HTMLDivElement | null>(null);

    // Close dropdowns when clicking outside the filter bar
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (!filtersRef.current) return;
            if (!(event.target instanceof Node)) return;
            if (!filtersRef.current.contains(event.target)) {
                setShowCategoryDropdown(false);
                setShowPriceDropdown(false);
                setShowConditionDropdown(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setShowCategoryDropdown(false);
                setShowPriceDropdown(false);
                setShowConditionDropdown(false);
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
                    condition,
                    minPrice,
                    maxPrice,
                    page,
                    pageSize: 24
                };

                const response: EbaySearchResponse = await searchHealthProducts(params);
                setProducts(response.items);
                setPagination(response.pagination);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load health products');
                console.error('Health search error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [isReady, q, category, sort, condition, minPrice, maxPrice, page]);

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

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        updateSearchParam('q', searchQuery);
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
                <title>Health Store | Blush & Breathe</title>
                <meta name="description" content="Shop certified supplements, fitness gear, and health essentials backed by science." />
            </Head>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Hero Section */}
                <section className="min-h-[300px] py-10 bg-gradient-to-b from-blue-50 to-background-light dark:from-gray-900 dark:to-background-dark mt-6 rounded-xl">
                    <div className="flex h-full flex-col items-center justify-center gap-6 px-4 md:px-8 text-center">
                        <div className="flex flex-col gap-3">
                            <p className="text-brand-text dark:text-white text-3xl md:text-5xl font-semibold leading-tight tracking-[-0.01em]">
                                Science-Backed Wellness Products
                            </p>
                            <p className="text-gray-600 dark:text-gray-400 text-base md:text-lg font-normal leading-normal">
                                Certified supplements, fitness gear, and health essentials.
                            </p>
                        </div>
                        <div className="w-full max-w-xl">
                            <form onSubmit={handleSearch} className="flex flex-col min-w-40 h-14 w-full">
                                <div className="flex w-full flex-1 items-stretch rounded-lg shadow-sm h-full dark:shadow-none">
                                    <div className="text-gray-500 flex border border-gray-200 bg-white items-center justify-center pl-4 rounded-l-lg border-r-0 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400">
                                        <span className="material-symbols-outlined">search</span>
                                    </div>
                                    <input
                                        className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-brand-text focus:outline-0 focus:ring-2 focus:ring-[#2C7A7B]/50 focus:border-[#2C7A7B] border border-gray-200 bg-white h-full placeholder:text-gray-500 px-4 rounded-l-none border-l-0 pl-2 text-base font-normal leading-normal dark:bg-gray-800 dark:border-gray-700 dark:placeholder:text-gray-400 dark:text-gray-200"
                                        placeholder="Search for vitamins, supplements, gear..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    <button
                                        type="submit"
                                        className="px-6 rounded-r-lg bg-[#2C7A7B] text-white hover:bg-[#2C7A7B]/90 transition-colors font-medium"
                                    >
                                        Search
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </section>

                {/* Trust Badge Strip */}
                <div className="relative md:sticky md:top-16 z-40 border-b border-gray-200/80 bg-background-light/80 dark:bg-background-dark/80 dark:border-gray-700 py-2.5 backdrop-blur-sm my-6 rounded-lg">
                    <div className="mx-auto max-w-7xl px-4 md:px-8">
                        <div className="gap-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 text-center">
                            <div className="flex flex-col items-center gap-1.5 py-1 text-center sm:flex-row sm:justify-center sm:gap-2">
                                <span className="material-symbols-outlined text-gray-500" style={{ fontSize: '18px' }}>verified</span>
                                <p className="text-gray-600 text-xs font-medium leading-normal dark:text-gray-400">FDA Registered</p>
                            </div>
                            <div className="flex flex-col items-center gap-1.5 py-1 text-center sm:flex-row sm:justify-center sm:gap-2">
                                <span className="material-symbols-outlined text-gray-500" style={{ fontSize: '18px' }}>workspace_premium</span>
                                <p className="text-gray-600 text-xs font-medium leading-normal dark:text-gray-400">GMP Certified</p>
                            </div>
                            <div className="flex flex-col items-center gap-1.5 py-1 text-center sm:flex-row sm:justify-center sm:gap-2">
                                <span className="material-symbols-outlined text-gray-500" style={{ fontSize: '18px' }}>science</span>
                                <p className="text-gray-600 text-xs font-medium leading-normal dark:text-gray-400">3rd Party Tested</p>
                            </div>
                            <div className="flex flex-col items-center gap-1.5 py-1 text-center sm:flex-row sm:justify-center sm:gap-2">
                                <span className="material-symbols-outlined text-gray-500" style={{ fontSize: '18px' }}>eco</span>
                                <p className="text-gray-600 text-xs font-medium leading-normal dark:text-gray-400">Organic</p>
                            </div>
                            <div className="flex flex-col items-center gap-1.5 py-1 text-center sm:flex-row sm:justify-center sm:gap-2">
                                <span className="material-symbols-outlined text-gray-500" style={{ fontSize: '18px' }}>grass</span>
                                <p className="text-gray-600 text-xs font-medium leading-normal dark:text-gray-400">Vegan</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div ref={filtersRef} className="flex flex-wrap gap-3 px-4 py-6">
                    {/* Category Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowCategoryDropdown(!showCategoryDropdown);
                                setShowPriceDropdown(false);
                                setShowConditionDropdown(false);
                            }}
                            className="flex h-11 shrink-0 items-center justify-center gap-x-2 rounded-full border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark px-4 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                        >
                            <p className="text-sm font-medium leading-normal">{categoryLabels[category]}</p>
                            <span className="material-symbols-outlined text-xl">{showCategoryDropdown ? 'expand_less' : 'expand_more'}</span>
                        </button>
                        {showCategoryDropdown && (
                            <div className="absolute top-12 left-0 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-lg shadow-lg z-10 min-w-56">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => { updateSearchParam('category', cat); setShowCategoryDropdown(false); }}
                                        className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                                    >
                                        {categoryLabels[cat]}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Price Range Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowPriceDropdown(!showPriceDropdown);
                                setShowCategoryDropdown(false);
                                setShowConditionDropdown(false);
                            }}
                            className="flex h-11 shrink-0 items-center justify-center gap-x-2 rounded-full border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark px-4 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                        >
                            <p className="text-sm font-medium leading-normal">Price: {currentPriceLabel}</p>
                            <span className="material-symbols-outlined text-xl">{showPriceDropdown ? 'expand_less' : 'expand_more'}</span>
                        </button>
                        {showPriceDropdown && (
                            <div className="absolute top-12 left-0 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-lg shadow-lg z-10 min-w-40">
                                {priceRanges.map((range, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handlePriceRangeSelect(range.min, range.max)}
                                        className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                                    >
                                        {range.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Condition Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowConditionDropdown(!showConditionDropdown);
                                setShowCategoryDropdown(false);
                                setShowPriceDropdown(false);
                            }}
                            className="flex h-11 shrink-0 items-center justify-center gap-x-2 rounded-full border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark px-4 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors capitalize"
                        >
                            <p className="text-sm font-medium leading-normal">Condition: {condition || 'All'}</p>
                            <span className="material-symbols-outlined text-xl">{showConditionDropdown ? 'expand_less' : 'expand_more'}</span>
                        </button>
                        {showConditionDropdown && (
                            <div className="absolute top-12 left-0 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-lg shadow-lg z-10 min-w-40">
                                <button
                                    onClick={() => { updateSearchParam('condition', undefined); setShowConditionDropdown(false); }}
                                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                                >
                                    All
                                </button>
                                {conditions.map(cond => (
                                    <button
                                        key={cond}
                                        onClick={() => { updateSearchParam('condition', cond); setShowConditionDropdown(false); }}
                                        className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm capitalize"
                                    >
                                        {cond}
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
                        className="flex h-11 shrink-0 items-center justify-center gap-x-2 rounded-full bg-[#2C7A7B]/20 text-text-light dark:text-text-dark border border-[#2C7A7B]/30 px-4 hover:bg-[#2C7A7B]/40 transition-colors"
                    >
                        <p className="text-sm font-medium leading-normal">Sort: {sortLabels[sort]}</p>
                        <span className="material-symbols-outlined text-xl">swap_vert</span>
                    </button>
                </div>

                {/* Products Grid */}
                <section className="py-8">
                    <h2 className="text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-5">
                        Health Products {pagination.total > 0 && `(${pagination.total.toLocaleString()} found)`}
                    </h2>

                    {error && <ErrorMessage message={error} />}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
                        {loading ? (
                            Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
                        ) : products.length === 0 ? (
                            <div className="col-span-full text-center py-12">
                                <p className="text-text-subtle-light dark:text-text-subtle-dark">No health products found. Try adjusting your filters.</p>
                            </div>
                        ) : (
                            products.map((product) => (
                                <Link
                                    key={product.id}
                                    href={`/health-store/product/${encodeURIComponent(product.id)}`}
                                    className="group flex flex-col overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5 dark:border dark:border-gray-700"
                                >
                                    <div className="relative">
                                        <div className="absolute top-2 right-2 z-10">
                                            <BookmarkButton item={{ ...product, contentType: 'HealthProduct' }} className="bg-white/70 dark:bg-black/70 hover:bg-white dark:hover:bg-black text-text-subtle-light dark:text-text-subtle-dark hover:text-secondary" />
                                        </div>
                                        <div className="aspect-square w-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                                            <img
                                                alt={product.title}
                                                className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                                                src={getHighQualityEbayImage(product.imageUrl)}
                                            />
                                        </div>
                                        {/* Benefit Tag */}
                                        <div className="absolute top-3 right-3 rounded bg-blue-100 px-2 py-1 text-xs font-semibold uppercase text-[#4299E1] dark:bg-blue-900/50 dark:text-blue-300">
                                            {getBenefitTag(category)}
                                        </div>
                                    </div>
                                    <div className="flex flex-1 flex-col p-4">
                                        <h3 className="text-base font-semibold text-brand-text dark:text-white">{product.title}</h3>
                                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                            {product.condition}
                                        </p>
                                        <div className="mt-auto flex items-baseline gap-2 pt-4">
                                            <span className="text-xl font-bold text-brand-text dark:text-white">
                                                ${product.price.value.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                    <button className="mt-auto m-4 flex h-10 w-[calc(100%-2rem)] items-center justify-center rounded-md bg-[#2C7A7B] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#2C7A7B]/90">
                                        Shop Now
                                    </button>
                                </Link>
                            ))
                        )}
                    </div>

                    {/* Pagination */}
                    {!loading && products.length > 0 && (
                        <div className="flex justify-center gap-4 mt-8">
                            <button
                                onClick={() => updateSearchParam('page', page - 1)}
                                disabled={page <= 1}
                                className="px-6 py-2 rounded-full border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>
                            <span className="flex items-center px-4 text-sm">
                                Page {page} of {Math.ceil(pagination.total / pagination.pageSize) || 1}
                            </span>
                            <button
                                onClick={() => updateSearchParam('page', page + 1)}
                                disabled={!pagination.hasNextPage}
                                className="px-6 py-2 rounded-full border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </section>
            </div>
        </>
    );
};

export default HealthStorePage;
