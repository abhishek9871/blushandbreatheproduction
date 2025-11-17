import React, { useMemo, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { getProducts, getTutorials } from '../services/apiService';
import ProductCard from '../components/ProductCard';
import TutorialCard from '../components/TutorialCard';
import ErrorMessage from '../components/ErrorMessage';
import ProductCardSkeleton from '../components/skeletons/ProductCardSkeleton';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

const BeautyPage: React.FC = () => {
    const { data: products, loading: productsLoading, error: productsError, loadMore: loadMoreProducts, hasMore: hasMoreProducts, loadingMore: loadingMoreProducts } = useApi(getProducts as any);
    const { data: tutorials, loading: tutorialsLoading, error: tutorialsError } = useApi(getTutorials as any);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [selectedBrand, setSelectedBrand] = useState<string>('All');
    const [selectedPriceRange, setSelectedPriceRange] = useState<string>('All');
    const [sortBy, setSortBy] = useState<'Popularity' | 'Price: Low to High' | 'Price: High to Low' | 'Rating'>('Popularity');
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [showBrandDropdown, setShowBrandDropdown] = useState(false);
    const [showPriceDropdown, setShowPriceDropdown] = useState(false);

    const productCategories = useMemo(
        () => ['All', ...Array.from(new Set(products.map(product => product.category)))],
        [products]
    );

    const productBrands = useMemo(
        () => ['All', ...Array.from(new Set(products.map(product => product.brand)))],
        [products]
    );

    const priceRanges = ['All', 'Price on request', 'Under $25', '$25-$50', 'Over $50'];

    const filteredProducts = useMemo(() => {
        let filtered = products;
        if (selectedCategory !== 'All') {
            filtered = filtered.filter(product => product.category === selectedCategory);
        }
        if (selectedBrand !== 'All') {
            filtered = filtered.filter(product => product.brand === selectedBrand);
        }
        if (selectedPriceRange !== 'All') {
            if (selectedPriceRange === 'Price on request') {
                filtered = filtered.filter(product => product.price === null);
            } else if (selectedPriceRange === 'Under $25') {
                filtered = filtered.filter(product => product.price !== null && product.price < 25);
            } else if (selectedPriceRange === '$25-$50') {
                filtered = filtered.filter(product => product.price !== null && product.price >= 25 && product.price <= 50);
            } else if (selectedPriceRange === 'Over $50') {
                filtered = filtered.filter(product => product.price !== null && product.price > 50);
            }
        }
        return filtered;
    }, [products, selectedCategory, selectedBrand, selectedPriceRange]);

    const sortedProducts = useMemo(() => {
        const copy = [...filteredProducts];
        switch (sortBy) {
            case 'Price: Low to High':
                return copy.sort((a: any, b: any) => {
                    if (a.price === null && b.price === null) return 0;
                    if (a.price === null) return 1;
                    if (b.price === null) return -1;
                    return a.price - b.price;
                });
            case 'Price: High to Low':
                return copy.sort((a: any, b: any) => {
                    if (a.price === null && b.price === null) return 0;
                    if (a.price === null) return 1;
                    if (b.price === null) return -1;
                    return b.price - a.price;
                });
            case 'Rating':
                return copy.sort((a: any, b: any) => {
                    if (a.rating === null && b.rating === null) return 0;
                    if (a.rating === null) return 1;
                    if (b.rating === null) return -1;
                    return b.rating - a.rating;
                });
            case 'Popularity':
            default:
                return copy.sort((a: any, b: any) => (b.reviews ?? 0) - (a.reviews ?? 0));
        }
    }, [filteredProducts, sortBy]);

    const cycleSort = () => {
        const order: Array<typeof sortBy> = ['Popularity', 'Price: Low to High', 'Price: High to Low', 'Rating'];
        const idx = order.indexOf(sortBy);
        setSortBy(order[(idx + 1) % order.length]);
    };

    const lastProductRef = useInfiniteScroll({
        loading: loadingMoreProducts,
        hasMore: hasMoreProducts,
        onLoadMore: loadMoreProducts,
    });

    return (
        <>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex flex-wrap justify-between gap-3 p-4">
                    <h1 className="text-4xl font-black leading-tight tracking-[-0.033em] min-w-72">Explore Beauty</h1>
                </div>
                <div className="px-4 py-3">
                    <div className="bg-cover bg-center flex flex-col justify-end overflow-hidden rounded-xl min-h-[350px] shadow-lg" style={{ backgroundImage: 'linear-gradient(0deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0) 45%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuB3vWry0ADnDb4qb-nmzYUqtGd8cUKP3ivi6v-s6SESkAVC6jTvDK4nPjl8XFw_naL42QrA7vOLCKTW54XZ3vIZ6hg_d17PW6pgc7lb03yvRXXPAM4L8tBC4MF611rcGaGZas09_zRy5Fb6tqoI9mdvhsMhopeCdC-CDF7ehl-Pf8OqiRKKo-mBPGBCtejDXPgHMj1VFhQnKsqLTvCunTLYyRfQhtXC0QtBkziEownLbOw4yyVZoLhWdV-f4DvtCG66IgABFCziNF0")' }}>
                        <div className="flex p-8">
                            <p className="text-white tracking-light text-4xl font-bold leading-tight max-w-lg">Glow Up: Discover Your Perfect Shade</p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3 px-4 py-6 overflow-x-auto">
                    <div className="relative">
                        <button onClick={() => setShowCategoryDropdown(!showCategoryDropdown)} className="flex h-11 shrink-0 items-center justify-center gap-x-2 rounded-full border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark px-4 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                            <p className="text-sm font-medium leading-normal">Category: {selectedCategory}</p>
                            <span className="material-symbols-outlined text-xl">{showCategoryDropdown ? 'expand_less' : 'expand_more'}</span>
                        </button>
                        {showCategoryDropdown && (
                            <div className="absolute top-12 left-0 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-lg shadow-lg z-10 min-w-40">
                                {productCategories.map(category => (
                                    <button key={category} onClick={() => { setSelectedCategory(category); setShowCategoryDropdown(false); }} className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">{category}</button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="relative">
                        <button onClick={() => setShowBrandDropdown(!showBrandDropdown)} className="flex h-11 shrink-0 items-center justify-center gap-x-2 rounded-full border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark px-4 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                            <p className="text-sm font-medium leading-normal">Brand: {selectedBrand}</p>
                            <span className="material-symbols-outlined text-xl">{showBrandDropdown ? 'expand_less' : 'expand_more'}</span>
                        </button>
                        {showBrandDropdown && (
                            <div className="absolute top-12 left-0 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-lg shadow-lg z-10 min-w-40 max-h-60 overflow-y-auto">
                                {productBrands.map(brand => (
                                    <button key={brand} onClick={() => { setSelectedBrand(brand); setShowBrandDropdown(false); }} className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">{brand}</button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="relative">
                        <button onClick={() => setShowPriceDropdown(!showPriceDropdown)} className="flex h-11 shrink-0 items-center justify-center gap-x-2 rounded-full border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark px-4 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                            <p className="text-sm font-medium leading-normal">Price: {selectedPriceRange}</p>
                            <span className="material-symbols-outlined text-xl">{showPriceDropdown ? 'expand_less' : 'expand_more'}</span>
                        </button>
                        {showPriceDropdown && (
                            <div className="absolute top-12 left-0 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-lg shadow-lg z-10 min-w-40">
                                {priceRanges.map(range => (
                                    <button key={range} onClick={() => { setSelectedPriceRange(range); setShowPriceDropdown(false); }} className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">{range}</button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button onClick={cycleSort} className="flex h-11 shrink-0 items-center justify-center gap-x-2 rounded-full bg-secondary/20 text-text-light dark:text-text-dark border border-secondary/30 px-4 hover:bg-secondary/40 transition-colors" aria-label={`Change sort (current: ${sortBy})`}>
                        <p className="text-sm font-medium leading-normal">Sort By: {sortBy}</p>
                        <span className="material-symbols-outlined text-xl">swap_vert</span>
                    </button>
                </div>
                <div className="flex gap-2 px-4 pb-4 overflow-x-auto">
                    {productCategories.map(category => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`flex h-11 shrink-0 cursor-pointer items-center justify-center gap-x-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                                selectedCategory === category
                                    ? 'bg-secondary text-white'
                                    : 'bg-border-light dark:bg-border-dark text-text-subtle-light dark:text-text-subtle-dark hover:bg-secondary/20 dark:hover:bg-secondary/20'
                            }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
                <section className="py-8">
                    <h2 className="text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-5">Featured Products</h2>
                    {productsError && <ErrorMessage message={productsError} />}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
                        {productsLoading
                            ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
                            : sortedProducts.map((product, index) => {
                                if (index === sortedProducts.length - 1) {
                                    return (
                                        <div key={product.id} ref={lastProductRef}>
                                            <ProductCard product={product} />
                                        </div>
                                    );
                                }
                                return <ProductCard key={product.id} product={product} />;
                            })
                        }
                        {loadingMoreProducts && !productsLoading &&
                            Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={`loading-${i}`} />)
                        }
                    </div>
                </section>
                <section className="py-8">
                    <h2 className="text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-5">Latest Tips & Tutorials</h2>
                    {tutorialsError && <ErrorMessage message={tutorialsError} />}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
                        {tutorialsLoading
                            ? Array.from({ length: 3 }).map((_, i) => <ProductCardSkeleton key={i} />) // Re-using for similar layout
                            : tutorials.map(tutorial => <TutorialCard key={tutorial.id} tutorial={tutorial} />)
                        }
                    </div>
                </section>
            </div>
        </>
    );
};

export default BeautyPage;
