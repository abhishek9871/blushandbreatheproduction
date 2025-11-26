'use client';

import Head from 'next/head';
import { useState, useEffect, useCallback, useMemo } from 'react';
import type { GetStaticProps, InferGetStaticPropsType } from 'next';
import { getNutritionData, searchUSDAFoods, getNutrientInfo } from '@/services/apiService';
import {
  NutritionCard, NutritionHero, NutritionSearch, NutrientEducation,
  PersonalizedRecommendations, CartStatusBadge, MiniCart,
  LoadingSpinner, ErrorMessage, ToastProvider
} from '@/components';
import { NutritionCartProvider, UserProfileProvider } from '@/hooks';
import type { NutritionInfo, TipCard } from '@/types';

type TabType = 'foods' | 'recommendations';

interface NutritionPageProps {
  initialNutritionData: (NutritionInfo | TipCard)[];
}

/**
 * Normalize food name to identify duplicates
 * Removes portion sizes, weights, calorie counts, and common prefixes
 */
const normalizeFoodName = (name: string): string => {
  return name
    .toLowerCase()
    // Remove calorie info like "64 cal" at start or end
    .replace(/^\d+\s*(cal|kcal|calories?)\s*/i, '')
    .replace(/\s*\d+\s*(cal|kcal|calories?)\s*$/i, '')
    // Remove portion/weight info like "100g", "1 cup", "1 oz", "per 100g"
    .replace(/\s*per\s+\d+\s*g\b/gi, '')
    .replace(/\s*\d+\s*(g|grams?|oz|ounces?|cups?|tbsp|tsp|ml|lb|lbs?)\b/gi, '')
    // Remove parenthetical info like "(raw)", "(cooked)", "(1 medium)"
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    // Remove common prefixes
    .replace(/^(raw|cooked|fresh|frozen|canned|dried|organic)\s+/i, '')
    // Remove trailing descriptors
    .replace(/\s*,\s*(raw|cooked|fresh|frozen|boiled|steamed|fried|grilled|baked).*$/i, '')
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Deduplicate food search results
 * Keeps one representative item per unique normalized food name
 * Prefers items with 100g portion for consistency with portion size selector
 */
const deduplicateFoods = (foods: NutritionInfo[]): NutritionInfo[] => {
  const foodMap = new Map<string, NutritionInfo>();
  
  for (const food of foods) {
    const normalizedName = normalizeFoodName(food.name);
    
    // Skip if normalized name is too short (likely garbage data)
    if (normalizedName.length < 2) continue;
    
    const existing = foodMap.get(normalizedName);
    
    if (!existing) {
      // First occurrence of this food
      foodMap.set(normalizedName, food);
    } else {
      // Check if current item is better (prefer items with "100" in description or more complete data)
      const currentHas100g = food.description?.includes('100g') || food.description?.includes('100 g');
      const existingHas100g = existing.description?.includes('100g') || existing.description?.includes('100 g');
      
      // Prefer 100g portions, or items with longer descriptions (more complete data)
      if (currentHas100g && !existingHas100g) {
        foodMap.set(normalizedName, food);
      } else if (!currentHas100g && !existingHas100g && 
                 (food.description?.length || 0) > (existing.description?.length || 0)) {
        foodMap.set(normalizedName, food);
      }
    }
  }
  
  return Array.from(foodMap.values());
};

export const getStaticProps: GetStaticProps<NutritionPageProps> = async () => {
  try {
    const { data } = await getNutritionData(1);
    return {
      props: { initialNutritionData: data || [] },
      revalidate: 3600,
    };
  } catch {
    console.error('Failed to fetch nutrition data');
    return {
      props: { initialNutritionData: [] },
      revalidate: 60,
    };
  }
};

function NutritionPageContent({ initialNutritionData }: NutritionPageProps) {
  const [nutritionData] = useState(initialNutritionData);
  const [activeTab, setActiveTab] = useState<TabType>('recommendations');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NutritionInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalHits, setTotalHits] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [nutrientInfo, setNutrientInfo] = useState<{ name: string; searchQuery: string; benefits: string[]; dailyValue?: string; sources?: string[]; } | null>(null);
  const [isNutrientSearch, setIsNutrientSearch] = useState(false);
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);

  const isNutrientQuery = useCallback((query: string): boolean => {
    const nutrients = ['vitamin c', 'vitamin d', 'vitamin a', 'protein', 'carbohydrates', 'fat', 'fiber', 'iron', 'calcium', 'potassium', 'magnesium', 'zinc'];
    return nutrients.some(n => query.toLowerCase().includes(n));
  }, []);

  const performSearch = useCallback(async (query: string, page: number = 1) => {
    if (!query.trim()) {
      setSearchResults([]);
      setTotalHits(0);
      setHasMore(false);
      setNutrientInfo(null);
      setIsNutrientSearch(false);
      return;
    }
    setIsSearching(true);
    setSearchError(null);
    try {
      if (isNutrientQuery(query) && page === 1) {
        const nutrientData = await getNutrientInfo(query.toLowerCase());
        if (nutrientData) {
          setNutrientInfo(nutrientData);
          setIsNutrientSearch(true);
          // Fetch more results to compensate for deduplication, then deduplicate
          const foodResult = await searchUSDAFoods(nutrientData.searchQuery, page, 50);
          const deduplicated = deduplicateFoods(foodResult.data);
          setSearchResults(deduplicated);
          setTotalHits(deduplicated.length);
          setHasMore(foodResult.hasMore && deduplicated.length >= 10);
          setCurrentPage(foodResult.currentPage);
          return;
        }
      }
      // Fetch more results to compensate for deduplication, then deduplicate
      const result = await searchUSDAFoods(query, page, 50);
      if (page === 1) {
        setNutrientInfo(null);
        setIsNutrientSearch(false);
        const deduplicated = deduplicateFoods(result.data);
        setSearchResults(deduplicated);
        setTotalHits(deduplicated.length);
        setHasMore(result.hasMore && deduplicated.length >= 10);
      } else {
        // For pagination, deduplicate the combined results
        setSearchResults(prev => {
          const combined = [...prev, ...result.data];
          return deduplicateFoods(combined);
        });
        setHasMore(result.hasMore);
      }
      setCurrentPage(result.currentPage);
    } catch (error) {
      setSearchError('Failed to search foods. Please try again.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [isNutrientQuery]);

  // Track the submitted search query separately from the typed value
  const [submittedQuery, setSubmittedQuery] = useState('');

  // Handle explicit search (Enter key or Search button)
  const handleSearch = useCallback((query: string) => {
    setSubmittedQuery(query);
    if (query.trim()) {
      performSearch(query, 1);
    } else {
      setSearchResults([]);
      setTotalHits(0);
      setHasMore(false);
      setNutrientInfo(null);
      setIsNutrientSearch(false);
    }
  }, [performSearch]);

  // Clear search results when input is cleared
  const handleClear = useCallback(() => {
    setSearchQuery('');
    setSubmittedQuery('');
    setSearchResults([]);
    setTotalHits(0);
    setHasMore(false);
    setNutrientInfo(null);
    setIsNutrientSearch(false);
  }, []);

  const loadMore = useCallback(() => { if (hasMore && !isSearching) performSearch(submittedQuery, currentPage + 1); }, [hasMore, isSearching, submittedQuery, currentPage, performSearch]);

  const displayData = useMemo(() => submittedQuery.trim() ? searchResults : (nutritionData || []), [submittedQuery, searchResults, nutritionData]);
  const isLoading = useMemo(() => submittedQuery.trim() ? isSearching : false, [submittedQuery, isSearching]);
  const displayError = useMemo(() => submittedQuery.trim() ? searchError : null, [submittedQuery, searchError]);

  const handleAddToCart = (item: NutritionInfo | TipCard) => {
    // Add item to cart logic here
  };

  const foodItems = useMemo(() => {
    const allFoods: NutritionInfo[] = [];
    if (nutritionData) allFoods.push(...nutritionData.filter(item => !('type' in item)) as NutritionInfo[]);
    if (searchResults.length > 0) allFoods.push(...searchResults.filter(item => !('type' in item)));
    return [...new Map(allFoods.map(f => [f.id || f.name, f])).values()];
  }, [nutritionData, searchResults]);

  const tabs = [
    { id: 'recommendations' as TabType, label: 'AI Diet Planner', icon: 'auto_awesome' },
    { id: 'foods' as TabType, label: 'Foods & Tips', icon: 'restaurant' }
  ];

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 py-6 md:py-10">
      <NutritionHero />

      <div className="mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:w-auto">
          <NutritionSearch 
            value={searchQuery} 
            onChange={setSearchQuery} 
            onSearch={handleSearch}
            onClear={handleClear}
            isSearching={isSearching}
          />
        </div>
        <CartStatusBadge onOpenCart={() => setIsMiniCartOpen(true)} />
      </div>

      <div className="mb-8">
        <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === tab.id ? 'border-accent text-accent' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
              <span className="material-symbols-outlined text-lg">{tab.icon}</span>{tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-[600px]">
        {activeTab === 'foods' && (
          <div>
            {nutrientInfo && <NutrientEducation nutrientInfo={nutrientInfo} onSearchFoods={(q) => { setSearchQuery(q); handleSearch(q); }} />}
            {submittedQuery.trim() && totalHits > 0 && (
              <div className="mb-4 text-sm text-gray-600 dark:text-gray-400 flex items-center justify-between">
                <span>Found {totalHits.toLocaleString()} unique {totalHits === 1 ? 'food' : 'foods'} matching &quot;{submittedQuery}&quot;{isNutrientSearch && ' rich in this nutrient'}</span>
                {isLoading && <span className="text-blue-600 flex items-center gap-2"><span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>Searching...</span>}
              </div>
            )}
            {isLoading && displayData.length === 0 && <LoadingSpinner />}
            {displayError && <ErrorMessage message={displayError} />}
            {!displayError && displayData.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayData.map((item, i) => <NutritionCard key={`${(item as NutritionInfo).id || 'item'}-${i}`} item={item} showCartActions={activeTab === 'foods'} />)}
                </div>
                {hasMore && submittedQuery.trim() && (
                  <div className="mt-8 text-center">
                    <button onClick={loadMore} disabled={isSearching} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                      {isSearching ? 'Loading...' : 'Load More Foods'}
                    </button>
                  </div>
                )}
              </>
            )}
            {!isLoading && !displayError && displayData.length === 0 && submittedQuery.trim() && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No foods found matching &quot;{submittedQuery}&quot;</p>
              </div>
            )}
          </div>
        )}
        {activeTab === 'recommendations' && <PersonalizedRecommendations availableFoods={foodItems} />}
      </div>

      <MiniCart isOpen={isMiniCartOpen} onClose={() => setIsMiniCartOpen(false)} />
    </main>
  );
}

export default function NutritionPage({ initialNutritionData }: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <>
      <Head>
        <title>Nutrition Store | Blush & Breathe</title>
        <meta name="description" content="Explore nutrition data, plan meals, and track your daily nutrition goals with our comprehensive food database." />
      </Head>
      <UserProfileProvider>
        <NutritionCartProvider>
          <ToastProvider>
            <NutritionPageContent initialNutritionData={initialNutritionData} />
          </ToastProvider>
        </NutritionCartProvider>
      </UserProfileProvider>
    </>
  );
}
