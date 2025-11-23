import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { searchBeautyProducts } from '../services/apiService';
import type { EbaySearchParams, EbayProductSummary, EbaySearchResponse } from '../types';
import ErrorMessage from '../components/ErrorMessage';
import ProductCardSkeleton from '../components/skeletons/ProductCardSkeleton';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

const BeautyPageEbay: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState<EbayProductSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState({ page: 1, pageSize: 24, total: 0, hasNextPage: false });
    
    // UI State
    const [searchQuery, setSearchQuery] = useState('');
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [showConditionDropdown, setShowConditionDropdown] = useState(false);
    const [showPriceDropdown, setShowPriceDropdown] = useState(false);

    // Get filter values from URL
    const category = (searchParams.get('category') as EbaySearchParams['category']) || 'all';
    const sort = (searchParams.get('sort') as EbaySearchParams['sort']) || 'best';
    const condition = searchParams.get('condition') as EbaySearchParams['condition'];
    const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
    const q = searchParams.get('q') || '';

    const categories = ['all', 'makeup', 'skincare', 'hair', 'fragrance', 'nails'] as const;
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
                    page: 1,
                    pageSize: 24
                };

                const response: EbaySearchResponse = await searchBeautyProducts(params);
                setProducts(response.items);
                setPagination(response.pagination);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load products');
                console.error('Beauty search error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [q, category, sort, condition, minPrice, maxPrice]);

    // Load more products for infinite scroll
    const loadMoreProducts = useCallback(async () => {
        if (!pagination.hasNextPage || loadingMore) return;

        setLoadingMore(true);
        try {
            const params: EbaySearchParams = {
                q,
                category,
                sort,
                condition,
                minPrice,
                maxPrice,
                page: pagination.page + 1,
                pageSize: 24
            };

            const response: EbaySearchResponse = await searchBeautyProducts(params);
            setProducts(prev => [...prev, ...response.items]);
            setPagination(response.pagination);
        } catch (err) {
            console.error('Failed to load more products:', err);
        } finally {
            setLoadingMore(false);
        }
    }, [q, category, sort, condition, minPrice, maxPrice, pagination.hasNextPage, pagination.page, loadingMore]);

    // Infinite scroll hook
    const lastProductRef = useInfiniteScroll({
        loading: loadingMore,
        hasMore: pagination.hasNextPage,
        onLoadMore: loadMoreProducts,
    });

    const updateSearchParam = (key: string, value: string | number | undefined) => {
        const newParams = new URLSearchParams(searchParams);
        if (value === undefined || value === '' || value === 'all') {
            newParams.delete(key);
        } else {
            newParams.set(key, String(value));
        }
        setSearchParams(newParams);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        updateSearchParam('q', searchQuery);
    };

    const handlePriceRangeSelect = (min: number | undefined, max: number | undefined) => {
        const newParams = new URLSearchParams(searchParams);
        if (min !== undefined) {
            newParams.set('minPrice', String(min));
        } else {
            newParams.delete('minPrice');
        }
        if (max !== undefined) {
            newParams.set('maxPrice', String(max));
        } else {
            newParams.delete('maxPrice');
        }
        setSearchParams(newParams);
        setShowPriceDropdown(false);
    };

    const currentPriceLabel = useMemo(() => {
        const range = priceRanges.find(r => r.min === minPrice && r.max === maxPrice);
        return range ? range.label : 'All Prices';
    }, [minPrice, maxPrice]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex flex-wrap justify-between gap-3 p-4">
                <h1 className="text-4xl font-black leading-tight tracking-[-0.033em] min-w-72">Explore Beauty</h1>
            </div>

            {/* Hero Banner */}
            <div className="px-4 py-3">
                <div className="bg-cover bg-center flex flex-col justify-end overflow-hidden rounded-xl min-h-[350px] shadow-lg" 
                     style={{ backgroundImage: 'linear-gradient(0deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0) 45%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuB3vWry0ADnDb4qb-nmzYUqtGd8cUKP3ivi6v-s6SESkAVC6jTvDK4nPjl8XFw_naL42QrA7vOLCKTW54XZ3vIZ6hg_d17PW6pgc7lb03yvRXXPAM4L8tBC4MF611rcGaGZas09_zRy5Fb6tqoI9mdvhsMhopeCdC-CDF7ehl-Pf8OqiRKKo-mBPGBCtejDXPgHMj1VFhQnKsqLTvCunTLYyRfQhtXC0QtBkziEownLbOw4yyVZoLhWdV-f4DvtCG66IgABFCziNF0")' }}>
                    <div className="flex p-8">
                        <p className="text-white tracking-light text-4xl font-bold leading-tight max-w-lg">Discover Your Perfect Beauty Products</p>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="px-4 py-4">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search beauty products..."
                        className="flex-1 h-12 rounded-full border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark px-6 text-text-light dark:text-text-dark"
                    />
                    <button
                        type="submit"
                        className="h-12 px-6 rounded-full bg-secondary text-white hover:bg-secondary/90 transition-colors font-medium"
                    >
                        Search
                    </button>
                </form>
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
                        className="flex h-11 shrink-0 items-center justify-center gap-x-2 rounded-full border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark px-4 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors capitalize"
                    >
                        <p className="text-sm font-medium leading-normal">Category: {category}</p>
                        <span className="material-symbols-outlined text-xl">{showCategoryDropdown ? 'expand_less' : 'expand_more'}</span>
                    </button>
                    {showCategoryDropdown && (
                        <div className="absolute top-12 left-0 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-lg shadow-lg z-10 min-w-40">
                            {categories.map(cat => (
                                <button 
                                    key={cat} 
                                    onClick={() => { updateSearchParam('category', cat); setShowCategoryDropdown(false); }} 
                                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm capitalize"
                                >
                                    {cat}
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
                    className="flex h-11 shrink-0 items-center justify-center gap-x-2 rounded-full bg-secondary/20 text-text-light dark:text-text-dark border border-secondary/30 px-4 hover:bg-secondary/40 transition-colors"
                >
                    <p className="text-sm font-medium leading-normal">Sort: {sortLabels[sort]}</p>
                    <span className="material-symbols-outlined text-xl">swap_vert</span>
                </button>
            </div>

            {/* Products Grid */}
            <section className="py-8">
                <h2 className="text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-5">
                    Products {pagination.total > 0 && `(${pagination.total.toLocaleString()} found)`}
                </h2>
                
                {error && <ErrorMessage message={error} />}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
                    {loading ? (
                        Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
                    ) : products.length === 0 ? (
                        <div className="col-span-full text-center py-12">
                            <p className="text-text-subtle-light dark:text-text-subtle-dark">No products found. Try adjusting your filters.</p>
                        </div>
                    ) : (
                        <>
                            {products.map((product, index) => {
                                const isLastProduct = index === products.length - 1;
                                return (
                                    <Link 
                                        key={`${product.id}-${index}`}
                                        ref={isLastProduct ? lastProductRef : null}
                                        to={`/beauty/product/${encodeURIComponent(product.id)}`}
                                        className="group relative flex flex-col overflow-hidden rounded-xl border border-border-light dark:border-border-dark shadow-sm hover:shadow-lg transition-shadow duration-300"
                                    >
                                        <div className="aspect-square w-full overflow-hidden bg-gray-100">
                                            <img 
                                                alt={product.title} 
                                                className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300" 
                                                src={product.imageUrl || 'https://via.placeholder.com/400'} 
                                            />
                                        </div>
                                        <div className="flex flex-1 flex-col p-4">
                                            <h3 className="font-semibold mt-1">{product.title}</h3>
                                            <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark mt-2">
                                                {product.condition}
                                            </p>
                                            <p className="text-lg font-bold mt-auto pt-2">
                                                ${product.price.value.toFixed(2)}
                                            </p>
                                        </div>
                                    </Link>
                                );
                            })}
                            {loadingMore && Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={`loading-${i}`} />)}
                        </>
                    )}
                </div>
            </section>
        </div>
    );
};

export default BeautyPageEbay;
