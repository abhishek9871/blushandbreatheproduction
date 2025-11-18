import React, { useState, useEffect } from 'react';
import { NutritionInfo } from '../types';
import { useComparison } from '../hooks/useComparison';

interface FoodComparisonProps {
  availableFoods: NutritionInfo[];
}

const FoodComparison: React.FC<FoodComparisonProps> = ({ availableFoods }) => {
  const { 
    comparedFoods: selectedFoods, 
    addToComparison: addFoodToComparison, 
    removeFromComparison: removeFoodFromComparison, 
    clearComparison,
    isInComparison,
    canAddMore
  } = useComparison();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFoods, setFilteredFoods] = useState<NutritionInfo[]>([]);

  // Filter available foods based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredFoods(availableFoods.slice(0, 10)); // Show first 10 by default
      return;
    }

    const filtered = availableFoods.filter(food =>
      food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      food.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredFoods(filtered.slice(0, 10));
  }, [searchQuery, availableFoods]);

  const getBestValue = (nutrient: 'protein' | 'carbs' | 'fats') => {
    if (selectedFoods.length === 0) return null;
    
    // For protein, higher is better. For carbs/fats, depends on context
    // For simplicity, we'll highlight the highest protein and lowest carbs/fats
    if (nutrient === 'protein') {
      return Math.max(...selectedFoods.map(f => f.nutrients[nutrient]));
    } else {
      return Math.min(...selectedFoods.map(f => f.nutrients[nutrient]));
    }
  };

  const isHighlighted = (food: NutritionInfo, nutrient: 'protein' | 'carbs' | 'fats') => {
    const bestValue = getBestValue(nutrient);
    return bestValue !== null && food.nutrients[nutrient] === bestValue;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-text-light dark:text-text-dark mb-2">
          Food Comparison
        </h2>
        <p className="text-text-subtle-light dark:text-text-subtle-dark">
          Compare nutritional values of up to 3 foods side by side
        </p>
      </div>

      {/* Add Foods Section */}
      <div className="bg-white dark:bg-background-dark rounded-xl p-6 shadow-sm border border-border-light dark:border-border-dark">
        <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-4">
          Add Foods to Compare ({selectedFoods.length}/3)
        </h3>
        
        {/* Search */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-text-subtle-light dark:text-text-subtle-dark">
              search
            </span>
          </div>
          <input
            type="text"
            placeholder="Search foods to add..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-border-light dark:border-border-dark rounded-lg focus:ring-2 focus:ring-accent focus:border-accent bg-white dark:bg-background-dark text-text-light dark:text-text-dark"
          />
        </div>

        {/* Available Foods Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-48 overflow-y-auto">
          {filteredFoods.map((food) => (
            <button
              key={food.id}
              onClick={() => addFoodToComparison(food)}
              disabled={!canAddMore || isInComparison(food.id)}
              className={`p-3 text-left rounded-lg border transition-colors ${
                isInComparison(food.id)
                  ? 'bg-accent/10 border-accent text-accent cursor-default'
                  : !canAddMore
                  ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-white dark:bg-background-dark border-border-light dark:border-border-dark hover:border-accent hover:bg-accent/5 cursor-pointer'
              }`}
            >
              <div className="font-medium text-sm truncate">{food.name}</div>
              <div className="text-xs text-text-subtle-light dark:text-text-subtle-dark mt-1">
                {food.nutrients.protein}g protein, {food.nutrients.carbs}g carbs
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      {selectedFoods.length > 0 && (
        <div className="bg-white dark:bg-background-dark rounded-xl p-6 shadow-sm border border-border-light dark:border-border-dark">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-text-light dark:text-text-dark">
              Nutritional Comparison
            </h3>
            <button
              onClick={clearComparison}
              className="px-3 py-1 text-sm text-text-subtle-light dark:text-text-subtle-dark hover:text-red-600 transition-colors"
            >
              Clear All
            </button>
          </div>

          {/* Responsive Comparison */}
          <div className="overflow-x-auto">
            <div className="min-w-full">
              {/* Desktop/Tablet View */}
              <div className="hidden md:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-light dark:border-border-dark">
                      <th className="text-left py-3 px-4 font-medium text-text-subtle-light dark:text-text-subtle-dark">
                        Nutrient
                      </th>
                      {selectedFoods.map((food) => (
                        <th key={food.id} className="text-center py-3 px-4">
                          <div className="flex flex-col items-center">
                            <img
                              src={food.imageUrl}
                              alt={food.name}
                              className="w-12 h-12 rounded-lg object-cover mb-2"
                            />
                            <div className="font-medium text-sm text-text-light dark:text-text-dark truncate max-w-24">
                              {food.name}
                            </div>
                            <button
                              onClick={() => removeFoodFromComparison(food.id)}
                              className="mt-1 text-xs text-red-500 hover:text-red-700 transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border-light dark:border-border-dark">
                      <td className="py-3 px-4 font-medium text-text-light dark:text-text-dark">
                        Protein (g)
                      </td>
                      {selectedFoods.map((food) => (
                        <td key={food.id} className="text-center py-3 px-4">
                          <span className={`font-semibold ${
                            isHighlighted(food, 'protein')
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-text-light dark:text-text-dark'
                          }`}>
                            {food.nutrients.protein}
                            {isHighlighted(food, 'protein') && (
                              <span className="ml-1 text-green-600 dark:text-green-400">✓</span>
                            )}
                          </span>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-border-light dark:border-border-dark">
                      <td className="py-3 px-4 font-medium text-text-light dark:text-text-dark">
                        Carbs (g)
                      </td>
                      {selectedFoods.map((food) => (
                        <td key={food.id} className="text-center py-3 px-4">
                          <span className={`font-semibold ${
                            isHighlighted(food, 'carbs')
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-text-light dark:text-text-dark'
                          }`}>
                            {food.nutrients.carbs}
                            {isHighlighted(food, 'carbs') && (
                              <span className="ml-1 text-blue-600 dark:text-blue-400">✓</span>
                            )}
                          </span>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-medium text-text-light dark:text-text-dark">
                        Fats (g)
                      </td>
                      {selectedFoods.map((food) => (
                        <td key={food.id} className="text-center py-3 px-4">
                          <span className={`font-semibold ${
                            isHighlighted(food, 'fats')
                              ? 'text-orange-600 dark:text-orange-400'
                              : 'text-text-light dark:text-text-dark'
                          }`}>
                            {food.nutrients.fats}
                            {isHighlighted(food, 'fats') && (
                              <span className="ml-1 text-orange-600 dark:text-orange-400">✓</span>
                            )}
                          </span>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className="md:hidden space-y-4">
                {selectedFoods.map((food) => (
                  <div key={food.id} className="border border-border-light dark:border-border-dark rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <img
                          src={food.imageUrl}
                          alt={food.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <div>
                          <div className="font-medium text-text-light dark:text-text-dark">{food.name}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFoodFromComparison(food.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-xs text-text-subtle-light dark:text-text-subtle-dark">Protein</div>
                        <div className={`font-semibold ${
                          isHighlighted(food, 'protein') ? 'text-green-600 dark:text-green-400' : 'text-text-light dark:text-text-dark'
                        }`}>
                          {food.nutrients.protein}g
                          {isHighlighted(food, 'protein') && <span className="ml-1">✓</span>}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-text-subtle-light dark:text-text-subtle-dark">Carbs</div>
                        <div className={`font-semibold ${
                          isHighlighted(food, 'carbs') ? 'text-blue-600 dark:text-blue-400' : 'text-text-light dark:text-text-dark'
                        }`}>
                          {food.nutrients.carbs}g
                          {isHighlighted(food, 'carbs') && <span className="ml-1">✓</span>}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-text-subtle-light dark:text-text-subtle-dark">Fats</div>
                        <div className={`font-semibold ${
                          isHighlighted(food, 'fats') ? 'text-orange-600 dark:text-orange-400' : 'text-text-light dark:text-text-dark'
                        }`}>
                          {food.nutrients.fats}g
                          {isHighlighted(food, 'fats') && <span className="ml-1">✓</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="text-sm font-medium text-text-light dark:text-text-dark mb-2">
              Comparison Legend:
            </h4>
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center">
                <span className="text-green-600 dark:text-green-400 mr-1">✓</span>
                <span className="text-text-subtle-light dark:text-text-subtle-dark">Highest Protein</span>
              </div>
              <div className="flex items-center">
                <span className="text-blue-600 dark:text-blue-400 mr-1">✓</span>
                <span className="text-text-subtle-light dark:text-text-subtle-dark">Lowest Carbs</span>
              </div>
              <div className="flex items-center">
                <span className="text-orange-600 dark:text-orange-400 mr-1">✓</span>
                <span className="text-text-subtle-light dark:text-text-subtle-dark">Lowest Fats</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {selectedFoods.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-accent">compare_arrows</span>
          </div>
          <h3 className="text-xl font-semibold text-text-light dark:text-text-dark mb-2">
            Start Comparing Foods
          </h3>
          <p className="text-text-subtle-light dark:text-text-subtle-dark mb-4">
            Add foods from the search above to compare their nutritional values
          </p>
        </div>
      )}
    </div>
  );
};

export default FoodComparison;
