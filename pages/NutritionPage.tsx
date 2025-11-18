
import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { getNutritionData } from '../services/apiService';
import NutritionCard from '../components/NutritionCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import NutritionSearch from '../components/NutritionSearch';
import DailyGoals from '../components/DailyGoals';
import MealPlanner from '../components/MealPlanner';
import ProgressDashboard from '../components/ProgressDashboard';
import NutritionHero from '../components/NutritionHero';
import FoodComparison from '../components/FoodComparison';
import PersonalizedRecommendations from '../components/PersonalizedRecommendations';
import { ComparisonProvider } from '../hooks/useComparison';
import { UserProfileProvider } from '../hooks/useUserProfile';

type TabType = 'foods' | 'goals' | 'meals' | 'progress' | 'compare' | 'recommendations';

const NutritionPageContent: React.FC = () => {
  const { data: nutritionData, loading, error, refetch } = useApi(getNutritionData as any);
  const [activeTab, setActiveTab] = useState<TabType>('foods');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState(nutritionData || []);

  // Filter data based on search query
  useEffect(() => {
    if (!nutritionData) return;

    if (!searchQuery.trim()) {
      setFilteredData(nutritionData);
      return;
    }

    const filtered = nutritionData.filter(item => {
      const searchTerm = searchQuery.toLowerCase();
      if ('type' in item && item.type === 'tip') {
        return item.title.toLowerCase().includes(searchTerm) ||
               item.description.toLowerCase().includes(searchTerm);
      } else {
        return item.name.toLowerCase().includes(searchTerm) ||
               item.description.toLowerCase().includes(searchTerm);
      }
    });
    setFilteredData(filtered);
  }, [nutritionData, searchQuery]);

  const tabs = [
    { id: 'foods' as TabType, label: 'Foods & Tips', icon: 'restaurant' },
    { id: 'recommendations' as TabType, label: 'For You', icon: 'auto_awesome' },
    { id: 'compare' as TabType, label: 'Compare', icon: 'compare_arrows' },
    { id: 'goals' as TabType, label: 'Daily Goals', icon: 'flag' },
    { id: 'meals' as TabType, label: 'Meal Planner', icon: 'lunch_dining' },
    { id: 'progress' as TabType, label: 'Progress', icon: 'trending_up' }
  ];

  // Get food items only (filter out tips) for comparison and recommendations
  const foodItems = nutritionData ? nutritionData.filter(item => !('type' in item)) : [];

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 py-6 md:py-10">
      {/* Hero Section */}
      <NutritionHero />

      {/* Search Bar - Always visible */}
      <div className="mb-8">
        <NutritionSearch
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery('')}
        />
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2 border-b border-border-light dark:border-border-dark">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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
            {loading && <LoadingSpinner />}
            {error && <ErrorMessage message={error} />}
            {filteredData && filteredData.length > 0 && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 @container">
                {filteredData.map(item => (
                  <NutritionCard key={item.id} item={item} showCompareButton={true} />
                ))}
              </div>
            )}
            {filteredData && filteredData.length === 0 && searchQuery && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl text-accent">search_off</span>
                </div>
                <h3 className="text-xl font-semibold text-text-light dark:text-text-dark mb-2">
                  No results found
                </h3>
                <p className="text-text-subtle-light dark:text-text-subtle-dark mb-4">
                  Try searching for different foods or browse all items
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 bg-accent text-text-light rounded-lg hover:opacity-90 transition-opacity"
                >
                  Clear search
                </button>
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
    </main>
  );
};

const NutritionPage: React.FC = () => {
  return (
    <UserProfileProvider>
      <ComparisonProvider>
        <NutritionPageContent />
      </ComparisonProvider>
    </UserProfileProvider>
  );
};

export default NutritionPage;
