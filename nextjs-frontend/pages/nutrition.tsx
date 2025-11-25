'use client';

import Head from 'next/head';
import { useState, useEffect, useCallback, useMemo } from 'react';
import type { GetStaticProps, InferGetStaticPropsType } from 'next';
import { getNutritionData, searchUSDAFoods, getNutrientInfo } from '@/services/apiService';
import {
  NutritionCard, NutritionHero, NutritionSearch, NutrientEducation,
  DailyGoals, MealPlanner, ProgressDashboard, FoodComparison,
  PersonalizedRecommendations, CartStatusBadge, MiniCart,
  LoadingSpinner, ErrorMessage, ToastProvider
} from '@/components';
import { ComparisonProvider, NutritionCartProvider, UserProfileProvider } from '@/hooks';
import type { NutritionInfo, TipCard } from '@/types';

type TabType = 'foods' | 'goals' | 'meals' | 'progress' | 'compare' | 'recommendations';

interface NutritionPageProps {
  initialNutritionData: (NutritionInfo | TipCard)[];
}

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
  const [activeTab, setActiveTab] = useState<TabType>('foods');
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
          const foodResult = await searchUSDAFoods(nutrientData.searchQuery, page, 20);
          setSearchResults(foodResult.data);
          setTotalHits(foodResult.totalHits);
          setHasMore(foodResult.hasMore);
          setCurrentPage(foodResult.currentPage);
          return;
        }
      }
      const result = await searchUSDAFoods(query, page, 20);
      if (page === 1) {
        setNutrientInfo(null);
        setIsNutrientSearch(false);
        setSearchResults(result.data);
      } else {
        setSearchResults(prev => [...prev, ...result.data]);
      }
      setTotalHits(result.totalHits);
      setHasMore(result.hasMore);
      setCurrentPage(result.currentPage);
    } catch (error) {
      setSearchError('Failed to search foods. Please try again.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [isNutrientQuery]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) performSearch(searchQuery, 1);
      else { setSearchResults([]); setTotalHits(0); setHasMore(false); setNutrientInfo(null); setIsNutrientSearch(false); }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);

  const loadMore = useCallback(() => { if (hasMore && !isSearching) performSearch(searchQuery, currentPage + 1); }, [hasMore, isSearching, searchQuery, currentPage, performSearch]);

  const displayData = useMemo(() => searchQuery.trim() ? searchResults : (nutritionData || []), [searchQuery, searchResults, nutritionData]);
  const isLoading = useMemo(() => searchQuery.trim() ? isSearching : false, [searchQuery, isSearching]);
  const displayError = useMemo(() => searchQuery.trim() ? searchError : null, [searchQuery, searchError]);

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
    { id: 'foods' as TabType, label: 'Foods & Tips', icon: 'restaurant' },
    { id: 'recommendations' as TabType, label: 'For You', icon: 'auto_awesome' },
    { id: 'compare' as TabType, label: 'Compare', icon: 'compare_arrows' },
    { id: 'goals' as TabType, label: 'Daily Goals', icon: 'flag' },
    { id: 'meals' as TabType, label: 'Meal Planner', icon: 'lunch_dining' },
    { id: 'progress' as TabType, label: 'Progress', icon: 'trending_up' }
  ];

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 py-6 md:py-10">
      <NutritionHero />

      <div className="mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:w-auto">
          <NutritionSearch value={searchQuery} onChange={setSearchQuery} onClear={() => setSearchQuery('')} />
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
            {nutrientInfo && <NutrientEducation nutrientInfo={nutrientInfo} onSearchFoods={(q) => setSearchQuery(q)} />}
            {searchQuery.trim() && totalHits > 0 && (
              <div className="mb-4 text-sm text-gray-600 flex items-center justify-between">
                <span>Found {totalHits.toLocaleString()} foods matching &quot;{searchQuery}&quot;{isNutrientSearch && ' rich in this nutrient'}</span>
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
                {hasMore && searchQuery.trim() && (
                  <div className="mt-8 text-center">
                    <button onClick={loadMore} disabled={isSearching} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                      {isSearching ? 'Loading...' : `Load More (${totalHits - displayData.length} remaining)`}
                    </button>
                  </div>
                )}
              </>
            )}
            {!isLoading && !displayError && displayData.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">{searchQuery.trim() ? `No foods found matching "${searchQuery}"` : 'No nutrition items available.'}</p>
              </div>
            )}
          </div>
        )}
        {activeTab === 'recommendations' && <PersonalizedRecommendations availableFoods={foodItems} />}
        {activeTab === 'compare' && <FoodComparison availableFoods={foodItems} />}
        {activeTab === 'goals' && <DailyGoals />}
        {activeTab === 'meals' && <MealPlanner />}
        {activeTab === 'progress' && <ProgressDashboard />}
      </div>

      <MiniCart isOpen={isMiniCartOpen} onClose={() => setIsMiniCartOpen(false)} onNavigateToGoals={() => setActiveTab('goals')} onNavigateToMeals={() => setActiveTab('meals')} />
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
        <ComparisonProvider>
          <NutritionCartProvider>
            <ToastProvider>
              <NutritionPageContent initialNutritionData={initialNutritionData} />
            </ToastProvider>
          </NutritionCartProvider>
        </ComparisonProvider>
      </UserProfileProvider>
    </>
  );
}
