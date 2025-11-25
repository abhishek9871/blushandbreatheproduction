'use client';

import Head from 'next/head';
import { useState, useMemo } from 'react';
import type { GetStaticProps, InferGetStaticPropsType } from 'next';
import { searchBeautyProducts } from '@/services/apiService';
import { ProductCard } from '@/components';
import { ProductCardSkeleton } from '@/components/skeletons';
import type { EbayProductSummary } from '@/types';

interface BeautyPageProps {
  initialProducts: EbayProductSummary[];
}

export const getStaticProps: GetStaticProps<BeautyPageProps> = async () => {
  try {
    const result = await searchBeautyProducts({ pageSize: 20 });
    return {
      props: { initialProducts: result.items || [] },
      revalidate: 3600,
    };
  } catch (error) {
    console.error('Failed to fetch beauty products:', error);
    return {
      props: { initialProducts: [] },
      revalidate: 60,
    };
  }
};

export default function BeautyPage({ initialProducts }: InferGetStaticPropsType<typeof getStaticProps>) {
  const [products] = useState<EbayProductSummary[]>(initialProducts);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'Popularity' | 'Price: Low to High' | 'Price: High to Low'>('Popularity');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);

  const categories = ['All', 'Skincare', 'Makeup', 'Fragrance', 'Hair Care', 'Bath & Body'];
  const priceRanges = ['All', 'Under $25', '$25-$50', '$50-$100', 'Over $100'];

  const getPrice = (p: EbayProductSummary): number => {
    return p.price?.value || 0;
  };

  const filteredProducts = useMemo(() => {
    let filtered = [...products];
    if (selectedPriceRange !== 'All') {
      filtered = filtered.filter(p => {
        const price = getPrice(p);
        if (selectedPriceRange === 'Under $25') return price < 25;
        if (selectedPriceRange === '$25-$50') return price >= 25 && price <= 50;
        if (selectedPriceRange === '$50-$100') return price >= 50 && price <= 100;
        if (selectedPriceRange === 'Over $100') return price > 100;
        return true;
      });
    }
    // Sort
    if (sortBy === 'Price: Low to High') {
      filtered.sort((a, b) => getPrice(a) - getPrice(b));
    } else if (sortBy === 'Price: High to Low') {
      filtered.sort((a, b) => getPrice(b) - getPrice(a));
    }
    return filtered;
  }, [products, selectedPriceRange, sortBy]);

  const cycleSort = () => {
    const order: typeof sortBy[] = ['Popularity', 'Price: Low to High', 'Price: High to Low'];
    setSortBy(order[(order.indexOf(sortBy) + 1) % order.length]);
  };

  // Map eBay product to internal Product type
  const mapToProduct = (p: EbayProductSummary) => ({
    id: p.id,
    name: p.title,
    description: p.title,
    price: p.price?.value || 0,
    imageUrl: p.imageUrl || '',
    category: 'Beauty',
    brand: 'Unknown',
    rating: 4.5,
    reviews: 0,
  });

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

        {/* Filters */}
        <div className="flex flex-wrap gap-3 px-4 py-6">
          <div className="relative">
            <button onClick={() => setShowCategoryDropdown(!showCategoryDropdown)} className="flex h-11 shrink-0 items-center justify-center gap-x-2 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <p className="text-sm font-medium leading-normal text-gray-700 dark:text-gray-300">Category: {selectedCategory}</p>
              <span className="material-symbols-outlined text-xl">{showCategoryDropdown ? 'expand_less' : 'expand_more'}</span>
            </button>
            {showCategoryDropdown && (
              <div className="absolute top-12 left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-40">
                {categories.map(cat => (
                  <button key={cat} onClick={() => { setSelectedCategory(cat); setShowCategoryDropdown(false); }} className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300">{cat}</button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button onClick={() => setShowPriceDropdown(!showPriceDropdown)} className="flex h-11 shrink-0 items-center justify-center gap-x-2 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <p className="text-sm font-medium leading-normal text-gray-700 dark:text-gray-300">Price: {selectedPriceRange}</p>
              <span className="material-symbols-outlined text-xl">{showPriceDropdown ? 'expand_less' : 'expand_more'}</span>
            </button>
            {showPriceDropdown && (
              <div className="absolute top-12 left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-40">
                {priceRanges.map(range => (
                  <button key={range} onClick={() => { setSelectedPriceRange(range); setShowPriceDropdown(false); }} className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300">{range}</button>
                ))}
              </div>
            )}
          </div>

          <button onClick={cycleSort} className="flex h-11 shrink-0 items-center justify-center gap-x-2 rounded-full bg-secondary/20 text-gray-700 dark:text-gray-300 border border-secondary/30 px-4 hover:bg-secondary/40 transition-colors">
            <p className="text-sm font-medium leading-normal">Sort: {sortBy}</p>
            <span className="material-symbols-outlined text-xl">swap_vert</span>
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 px-4 pb-4">
          {categories.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`flex h-11 shrink-0 cursor-pointer items-center justify-center gap-x-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${selectedCategory === cat ? 'bg-secondary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-secondary/20'}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <section className="py-8">
          <h2 className="text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-5 text-gray-900 dark:text-gray-100">Featured Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
            {filteredProducts.length > 0 ? (
              filteredProducts.map(product => <ProductCard key={product.id} product={mapToProduct(product)} />)
            ) : (
              Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
            )}
          </div>
        </section>
      </div>
    </>
  );
}
