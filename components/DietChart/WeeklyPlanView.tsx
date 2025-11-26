'use client';

import React, { useState } from 'react';
import type { DietPlan, Meal } from '@/types';
import { useUserProfile } from '@/hooks/useUserProfile';

interface WeeklyPlanViewProps {
  dietPlan: DietPlan;
  onRegenerate: () => void;
  onBack: () => void;
  isRegenerating: boolean;
}

const WeeklyPlanView: React.FC<WeeklyPlanViewProps> = ({
  dietPlan,
  onRegenerate,
  onBack,
  isRegenerating
}) => {
  const { regenerateMeal, profile } = useUserProfile();
  const [selectedDay, setSelectedDay] = useState(0);
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [regeneratingMeal, setRegeneratingMeal] = useState<string | null>(null);

  const getMealIcon = (type: string) => {
    switch (type) {
      case 'breakfast': return 'wb_sunny';
      case 'morning_snack': return 'coffee';
      case 'lunch': return 'lunch_dining';
      case 'evening_snack': return 'cookie';
      case 'dinner': return 'dinner_dining';
      default: return 'restaurant';
    }
  };

  const getMealColor = (type: string) => {
    switch (type) {
      case 'breakfast': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-600';
      case 'morning_snack': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600';
      case 'lunch': return 'bg-green-100 dark:bg-green-900/30 text-green-600';
      case 'evening_snack': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600';
      case 'dinner': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const handleRegenerateMeal = async (dayIndex: number, meal: Meal) => {
    const mealKey = `${dayIndex}-${meal.type}`;
    setRegeneratingMeal(mealKey);
    try {
      await regenerateMeal(dayIndex, meal.type, meal);
    } finally {
      setRegeneratingMeal(null);
    }
  };

  const currentDay = dietPlan.weeklyPlan[selectedDay];
  const calorieProgress = currentDay ? (currentDay.dailyTotals.calories / dietPlan.userTargets.dailyCalories) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-card-dark rounded-xl p-4 shadow-sm border border-border-light dark:border-border-dark">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center space-x-2">
              <span className="material-symbols-outlined text-accent">restaurant_menu</span>
              <span className="text-text-light dark:text-text-dark">Your Weekly Meal Plan</span>
              {dietPlan.fromCache && (
                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 px-2 py-1 rounded-full">
                  Cached
                </span>
              )}
            </h2>
            <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark">
              Generated on {new Date(dietPlan.generatedAt).toLocaleDateString()} • 
              Valid until {new Date(dietPlan.validUntil).toLocaleDateString()}
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onBack}
              className="px-4 py-2 rounded-lg border border-border-light dark:border-border-dark hover:bg-accent/10 flex items-center space-x-1 text-text-light dark:text-text-dark"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span className="hidden sm:inline">Back</span>
            </button>
            <button
              onClick={onRegenerate}
              disabled={isRegenerating}
              className={`px-4 py-2 rounded-lg flex items-center space-x-1 ${
                isRegenerating
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-500'
                  : 'bg-accent text-white hover:opacity-90'
              }`}
            >
              {isRegenerating ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <span className="material-symbols-outlined text-sm">refresh</span>
              )}
              <span className="hidden sm:inline">New Plan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Day Selector */}
      <div className="bg-white dark:bg-card-dark rounded-xl p-2 shadow-sm border border-border-light dark:border-border-dark">
        <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-1 sm:gap-2 -mx-1 px-1 pb-1">
          {dietPlan.weeklyPlan.map((day, index) => (
            <button
              key={day.day}
              onClick={() => setSelectedDay(index)}
              className={`flex-shrink-0 snap-start min-w-[70px] sm:min-w-[90px] flex-1 py-2 sm:py-3 px-2 sm:px-4 rounded-lg transition-all ${
                selectedDay === index
                  ? 'bg-accent text-white shadow-lg'
                  : 'hover:bg-accent/10 text-text-light dark:text-text-dark bg-gray-50 dark:bg-gray-800/50'
              }`}
            >
              <div className={`font-medium text-sm sm:text-base ${selectedDay === index ? '' : 'text-text-light dark:text-text-dark'}`}>{day.day.substring(0, 3)}</div>
              <div className={`text-[10px] sm:text-xs ${selectedDay === index ? 'opacity-80' : 'text-text-subtle-light dark:text-text-subtle-dark'}`}>
                {day.dailyTotals.calories}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Daily Summary */}
      {currentDay && (
        <div className="bg-white dark:bg-card-dark rounded-xl p-4 shadow-sm border border-border-light dark:border-border-dark">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-text-light dark:text-text-dark">{currentDay.day}'s Nutrition</h3>
            <div className={`text-sm font-medium ${
              calorieProgress > 105 ? 'text-red-500' : 
              calorieProgress < 95 ? 'text-yellow-500' : 'text-green-500'
            }`}>
              {currentDay.dailyTotals.calories} / {dietPlan.userTargets.dailyCalories} kcal
            </div>
          </div>
          
          {/* Calorie Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
            <div 
              className={`h-3 rounded-full transition-all ${
                calorieProgress > 105 ? 'bg-red-500' : 
                calorieProgress < 95 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(calorieProgress, 100)}%` }}
            />
          </div>

          {/* Macro Progress */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <div className="flex justify-between text-xs sm:text-sm mb-1">
                <span className="text-red-600 font-medium">Protein</span>
                <span className="text-text-light dark:text-text-dark">{currentDay.dailyTotals.protein}g / {dietPlan.userTargets.macros.protein}g</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full"
                  style={{ width: `${Math.min((currentDay.dailyTotals.protein / dietPlan.userTargets.macros.protein) * 100, 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs sm:text-sm mb-1">
                <span className="text-yellow-600 font-medium">Carbs</span>
                <span className="text-text-light dark:text-text-dark">{currentDay.dailyTotals.carbs}g / {dietPlan.userTargets.macros.carbs}g</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{ width: `${Math.min((currentDay.dailyTotals.carbs / dietPlan.userTargets.macros.carbs) * 100, 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs sm:text-sm mb-1">
                <span className="text-blue-600 font-medium">Fats</span>
                <span className="text-text-light dark:text-text-dark">{currentDay.dailyTotals.fats}g / {dietPlan.userTargets.macros.fats}g</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${Math.min((currentDay.dailyTotals.fats / dietPlan.userTargets.macros.fats) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Meals */}
      {currentDay && (
        <div className="space-y-4">
          {currentDay.meals.map((meal, mealIndex) => {
            const mealKey = `${selectedDay}-${meal.type}`;
            const isExpanded = expandedMeal === mealKey;
            const isRegenerating = regeneratingMeal === mealKey;

            return (
              <div
                key={mealKey}
                className="bg-white dark:bg-card-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark overflow-hidden"
              >
                {/* Meal Header */}
                <div 
                  className="p-3 sm:p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  onClick={() => setExpandedMeal(isExpanded ? null : mealKey)}
                >
                  {/* Mobile Layout */}
                  <div className="sm:hidden">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getMealColor(meal.type)}`}>
                          <span className="material-symbols-outlined text-xl">{getMealIcon(meal.type)}</span>
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-text-light dark:text-text-dark text-sm truncate">{meal.name}</h4>
                          <span className="text-xs text-text-subtle-light dark:text-text-subtle-dark">{meal.time}</span>
                        </div>
                      </div>
                      <span className={`material-symbols-outlined transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`}>
                        expand_more
                      </span>
                    </div>
                    <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark line-clamp-1 mb-2 ml-13">
                      {meal.description}
                    </p>
                    <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2">
                      <div className="font-bold text-accent text-sm">{meal.totalCalories} kcal</div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-red-600">P: {meal.macros.protein}g</span>
                        <span className="text-yellow-600">C: {meal.macros.carbs}g</span>
                        <span className="text-blue-600">F: {meal.macros.fats}g</span>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden sm:flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getMealColor(meal.type)}`}>
                        <span className="material-symbols-outlined">{getMealIcon(meal.type)}</span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-text-light dark:text-text-dark">{meal.name}</h4>
                          <span className="text-xs text-text-subtle-light dark:text-text-subtle-dark">
                            {meal.time}
                          </span>
                        </div>
                        <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark line-clamp-1">
                          {meal.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-bold text-accent">{meal.totalCalories} kcal</div>
                        <div className="text-xs text-text-subtle-light dark:text-text-subtle-dark">
                          P: {meal.macros.protein}g • C: {meal.macros.carbs}g • F: {meal.macros.fats}g
                        </div>
                      </div>
                      <span className={`material-symbols-outlined transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                        expand_more
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-border-light dark:border-border-dark p-3 sm:p-4 bg-gray-50 dark:bg-gray-800/30">
                    {/* Ingredients */}
                    <div className="mb-4">
                      <h5 className="font-medium mb-2 flex items-center space-x-1 text-text-light dark:text-text-dark text-sm sm:text-base">
                        <span className="material-symbols-outlined text-sm">list</span>
                        <span>Ingredients</span>
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {meal.ingredients.map((ing, i) => (
                          <div key={i} className="bg-white dark:bg-card-dark px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm">
                            <span className="font-medium text-text-light dark:text-text-dark">{ing.name}</span>
                            <span className="text-text-subtle-light dark:text-text-subtle-dark ml-1">
                              ({ing.quantity}{ing.unit})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Instructions */}
                    {meal.instructions && (
                      <div className="mb-4">
                        <h5 className="font-medium mb-2 flex items-center space-x-1 text-text-light dark:text-text-dark text-sm sm:text-base">
                          <span className="material-symbols-outlined text-sm">menu_book</span>
                          <span>Instructions</span>
                        </h5>
                        <p className="text-xs sm:text-sm text-text-subtle-light dark:text-text-subtle-dark bg-white dark:bg-card-dark p-2 sm:p-3 rounded-lg">
                          {meal.instructions}
                        </p>
                      </div>
                    )}

                    {/* Prep Time & Alternatives */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center space-x-3 sm:space-x-4 text-xs sm:text-sm">
                        <span className="flex items-center space-x-1 text-text-subtle-light dark:text-text-subtle-dark">
                          <span className="material-symbols-outlined text-sm">schedule</span>
                          <span>{meal.prepTime} min</span>
                        </span>
                        {meal.alternatives.length > 0 && (
                          <span className="text-text-subtle-light dark:text-text-subtle-dark truncate">
                            Alt: {meal.alternatives.slice(0, 2).join(', ')}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRegenerateMeal(selectedDay, meal);
                        }}
                        disabled={isRegenerating}
                        className={`px-3 py-2 sm:py-1.5 rounded-lg text-sm flex items-center justify-center space-x-1 w-full sm:w-auto ${
                          isRegenerating
                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                            : 'bg-accent/10 text-accent hover:bg-accent/20'
                        }`}
                      >
                        {isRegenerating ? (
                          <span className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                          <span className="material-symbols-outlined text-sm">refresh</span>
                        )}
                        <span>Swap Meal</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Meal Prep Tips */}
      {dietPlan.mealPrepTips && dietPlan.mealPrepTips.length > 0 && (
        <div className="bg-accent/5 rounded-xl p-4 border border-accent/20">
          <h3 className="font-semibold mb-3 flex items-center space-x-2 text-text-light dark:text-text-dark">
            <span className="material-symbols-outlined text-accent">tips_and_updates</span>
            <span>Meal Prep Tips</span>
          </h3>
          <ul className="space-y-2">
            {dietPlan.mealPrepTips.map((tip, i) => (
              <li key={i} className="flex items-start space-x-2 text-sm">
                <span className="material-symbols-outlined text-accent text-sm mt-0.5">check_circle</span>
                <span className="text-text-light dark:text-text-dark">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Weekly Notes */}
      {dietPlan.weeklyNotes && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
          <h3 className="font-semibold mb-2 flex items-center space-x-2 text-text-light dark:text-text-dark">
            <span className="material-symbols-outlined text-blue-600">info</span>
            <span>Weekly Notes</span>
          </h3>
          <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark">{dietPlan.weeklyNotes}</p>
        </div>
      )}
    </div>
  );
};

export default WeeklyPlanView;
