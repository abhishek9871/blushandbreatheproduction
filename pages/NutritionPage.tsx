
import React, { useState, useEffect, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { getNutritionData, searchUSDAFoods, getNutrientInfo } from '../services/apiService';
import NutritionCard from '../components/NutritionCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import NutritionSearch from '../components/NutritionSearch';
import NutrientEducation from '../components/NutrientEducation';
import DailyGoals from '../components/DailyGoals';
import MealPlanner from '../components/MealPlanner';
import ProgressDashboard from '../components/ProgressDashboard';
import NutritionHero from '../components/NutritionHero';
import FoodComparison from '../components/FoodComparison';
import PersonalizedRecommendations from '../components/PersonalizedRecommendations';
import CartStatusBadge from '../components/CartStatusBadge';
import MiniCart from '../components/MiniCart';
import { ToastProvider } from '../components/Toast';
import { ComparisonProvider } from '../hooks/useComparison';
import { UserProfileProvider } from '../hooks/useUserProfile';
import { NutritionCartProvider } from '../hooks/useNutritionCart';

type TabType = 'foods' | 'goals' | 'meals' | 'progress' | 'compare' | 'recommendations';

const NutritionPageContent: React.FC = () => {
  const { data: nutritionData, loading, error, refetch } = useApi(getNutritionData as any);
  const [activeTab, setActiveTab] = useState<TabType>('foods');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalHits, setTotalHits] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [nutrientInfo, setNutrientInfo] = useState<any | null>(null);
  const [isNutrientSearch, setIsNutrientSearch] = useState(false);
  const [previousQuery, setPreviousQuery] = useState(''); // Track previous query to prevent flicker
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);

  // Check if query is a nutrient search
  const isNutrientQuery = useCallback((query: string): boolean => {
    const nutrients = [
      'vitamin c', 'vitamin d', 'vitamin a', 'vitamin e', 'vitamin k',
      'protein', 'carbohydrates', 'fat', 'fiber', 'sugar',
      'iron', 'calcium', 'potassium', 'magnesium', 'zinc',
      'omega 3', 'antioxidants', 'folate', 'sodium'
    ];
    return nutrients.some(nutrient => query.toLowerCase().includes(nutrient));
  }, []);

  // Search USDA foods with debouncing
  const performSearch = useCallback(async (query: string, page: number = 1) => {
    if (!query.trim()) {
      // Batch state updates to prevent flickering
      setSearchResults([]);
      setTotalHits(0);
      setHasMore(false);
      setSearchError(null);
      setNutrientInfo(null);
      setIsNutrientSearch(false);
      setPreviousQuery('');
      return;
    }

    // Track previous query to prevent flicker
    if (page === 1 && query !== previousQuery) {
      setPreviousQuery(searchQuery);
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      // Check if this is a nutrient search
      if (isNutrientQuery(query) && page === 1) {
        const nutrientData = await getNutrientInfo(query.toLowerCase());
        if (nutrientData) {
          // Batch state updates for nutrient search
          setNutrientInfo(nutrientData);
          setIsNutrientSearch(true);
          
          // Also search for foods rich in this nutrient
          const foodResult = await searchUSDAFoods(nutrientData.searchQuery, page, 20);
          setSearchResults(foodResult.data);
          setTotalHits(foodResult.totalHits);
          setHasMore(foodResult.hasMore);
          setCurrentPage(foodResult.currentPage);
          setPreviousQuery(query);
          return;
        }
      }
      
      // Regular food search
      const result = await searchUSDAFoods(query, page, 20);
      
      // Batch state updates to prevent flickering
      if (page === 1) {
        setNutrientInfo(null);
        setIsNutrientSearch(false);
        setSearchResults(result.data);
        setPreviousQuery(query);
      } else {
        setSearchResults(prev => [...prev, ...result.data]);
      }
      setTotalHits(result.totalHits);
      setHasMore(result.hasMore);
      setCurrentPage(result.currentPage);
    } catch (error) {
      console.error('Search failed:', error);
      // Batch state updates for error case
      setSearchError('Failed to search foods. Please try again.');
      setSearchResults([]);
      setNutrientInfo(null);
      setIsNutrientSearch(false);
      setPreviousQuery(query);
    } finally {
      setIsSearching(false);
    }
  }, [isNutrientQuery, previousQuery, searchQuery]);

  // Debounced search with optimized state management
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch(searchQuery, 1);
      } else {
        // Clear all search-related states at once
        setSearchResults([]);
        setTotalHits(0);
        setHasMore(false);
        setSearchError(null);
        setNutrientInfo(null);
        setIsNutrientSearch(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);

  // Load more results
  const loadMore = useCallback(() => {
    if (hasMore && !isSearching) {
      performSearch(searchQuery, currentPage + 1);
    }
  }, [hasMore, isSearching, searchQuery, currentPage, performSearch]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setTotalHits(0);
    setHasMore(false);
    setSearchError(null);
    setNutrientInfo(null);
    setIsNutrientSearch(false);
    setPreviousQuery('');
  }, []);

  // Determine what data to show with optimized logic to prevent flickering
  const displayData = React.useMemo(() => {
    // If we're searching for a new query, show the previous results to prevent flicker
    if (isSearching && searchQuery !== previousQuery && searchResults.length > 0) {
      return searchResults;
    }
    return searchQuery.trim() ? searchResults : (nutritionData || []);
  }, [searchQuery, searchResults, nutritionData, isSearching, previousQuery]);
  
  const isLoading = React.useMemo(() => {
    return searchQuery.trim() ? isSearching : loading;
  }, [searchQuery, isSearching, loading]);
  
  const displayError = React.useMemo(() => {
    return searchQuery.trim() ? searchError : error;
  }, [searchQuery, searchError, error]);

  // Configure contextual cart actions based on active tab
  const showCartActions = React.useMemo(() => {
    return activeTab === 'foods' || activeTab === 'recommendations' || activeTab === 'meals';
  }, [activeTab]);

  // Navigation handlers for MiniCart
  const handleNavigateToGoals = () => {
    setActiveTab('goals');
  };

  const handleNavigateToMeals = () => {
    setActiveTab('meals');
  };

  const tabs = [
    { id: 'foods' as TabType, label: 'Foods & Tips', icon: 'restaurant' },
    { id: 'recommendations' as TabType, label: 'For You', icon: 'auto_awesome' },
    { id: 'compare' as TabType, label: 'Compare', icon: 'compare_arrows' },
    { id: 'goals' as TabType, label: 'Daily Goals', icon: 'flag' },
    { id: 'meals' as TabType, label: 'Meal Planner', icon: 'lunch_dining' },
    { id: 'progress' as TabType, label: 'Progress', icon: 'trending_up' }
  ];

  // Get food items only (filter out tips) for comparison and recommendations
  const foodItems = React.useMemo(() => {
    const allFoodItems = [];
    
    // Add static nutrition data foods
    if (nutritionData) {
      const staticFoods = nutritionData.filter(item => !('type' in item));
      allFoodItems.push(...staticFoods);
    }
    
    // Add search results (only food items, not tips)
    if (searchResults.length > 0) {
      const searchFoods = searchResults.filter(item => !('type' in item));
      allFoodItems.push(...searchFoods);
    }
    
    // Remove duplicates based on ID or name
    const uniqueFoods = allFoodItems.reduce((acc, food) => {
      const existingIndex = acc.findIndex(existing => 
        (existing.id && existing.id === food.id) || 
        existing.name === food.name
      );
      
      if (existingIndex === -1) {
        acc.push(food);
      }
      
      return acc;
    }, [] as any[]);
    
    return uniqueFoods;
  }, [nutritionData, searchResults]);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 py-6 md:py-10">
      {/* Hero Section */}
      <NutritionHero />

      {/* Search Bar and Cart Status - Always visible */}
      <div className="mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:w-auto">
          <NutritionSearch
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery('')}
          />
        </div>
        <CartStatusBadge onOpenCart={() => setIsMiniCartOpen(true)} />
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2 border-b border-border-light dark:border-border-dark">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              data-tab={tab.id}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-subtle-light dark:text-text-subtle-dark hover:text-text-light dark:hover:text-text-dark'
              }`}
            >
              <span className="material-symbols-outlined text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === 'foods' && (
          <div>
            {/* Nutrient Education Panel */}
            {nutrientInfo && (
              <NutrientEducation 
                nutrientInfo={nutrientInfo} 
                onSearchFoods={(query) => setSearchQuery(query)}
              />
            )}

            {/* Search results info */}
            {searchQuery.trim() && totalHits > 0 && (
              <div className="mb-4 text-sm text-gray-600 flex items-center justify-between">
                <span>
                  Found {totalHits.toLocaleString()} foods matching "{searchQuery}"
                  {totalHits > 20 && ` (showing first ${displayData.length})`}
                  {isNutrientSearch && ' rich in this nutrient'}
                </span>
                {isLoading && (
                  <span className="text-blue-600 flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                    Searching...
                  </span>
                )}
              </div>
            )}

            {/* Show loading spinner only when there are no previous results to prevent flicker */}
            {isLoading && displayData.length === 0 && <LoadingSpinner />}
            {displayError && <ErrorMessage message={displayError} onRetry={() => performSearch(searchQuery, 1)} />}
            
            {!displayError && displayData.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayData.map((item, index) => (
                    <NutritionCard 
                      key={`${item.id || item.fdcId || 'item'}-${index}-${searchQuery}`} 
                      item={item} 
                      showCompareButton={activeTab === 'foods' && !('type' in item && item.type === 'tip')}
                      showCartActions={showCartActions && !('type' in item && item.type === 'tip')}
                    />
                  ))}
                </div>
                
                {hasMore && searchQuery.trim() && (
                  <div className="mt-8 text-center">
                    <button
                      onClick={loadMore}
                      disabled={isSearching}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSearching ? 'Loading...' : `Load More (${totalHits - displayData.length} remaining)`}
                    </button>
                  </div>
                )}
              </>
            )}

            {!isLoading && !displayError && displayData.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  {searchQuery.trim() 
                    ? `No foods found matching "${searchQuery}" in the USDA database.`
                    : 'No nutrition items available.'}
                </p>
                <p className="text-gray-400 mt-2">
                  {searchQuery.trim()
                    ? 'Try different keywords like "apple", "chicken", "protein", or specific food names.'
                    : 'Check your connection or try refreshing the page.'}
                </p>
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

      {/* Mini Cart */}
      <MiniCart 
        isOpen={isMiniCartOpen} 
        onClose={() => setIsMiniCartOpen(false)}
        onNavigateToGoals={handleNavigateToGoals}
        onNavigateToMeals={handleNavigateToMeals}
      />
    </main>
  );
};

const NutritionPage: React.FC = () => {
  return (
    <UserProfileProvider>
      <ComparisonProvider>
        <NutritionCartProvider>
          <ToastProvider>
            <NutritionPageContent />
          </ToastProvider>
        </NutritionCartProvider>
      </ComparisonProvider>
    </UserProfileProvider>
  );
};

export default NutritionPage;
