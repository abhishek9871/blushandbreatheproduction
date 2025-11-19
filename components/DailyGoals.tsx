import React, { useState, useEffect } from 'react';
import type { NutritionInfo } from '../types';
import { useNutritionCart } from '../hooks/useNutritionCart';
import { useToast } from './Toast';

interface DailyGoals {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

interface DailyProgress {
  consumed: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  loggedFoods: NutritionInfo[];
}

const STORAGE_KEY = 'nutrition_daily_goals';
const PROGRESS_KEY = 'nutrition_daily_progress';

const DailyGoals: React.FC = () => {
  const [goals, setGoals] = useState<DailyGoals>({
    calories: 2000,
    protein: 150,
    carbs: 250,
    fats: 67
  });

  const [progress, setProgress] = useState<DailyProgress>({
    consumed: { calories: 0, protein: 0, carbs: 0, fats: 0 },
    loggedFoods: []
  });

  const [isEditing, setIsEditing] = useState(false);
  const [tempGoals, setTempGoals] = useState<DailyGoals>(goals);

  // Use cart context if available
  let cartContext;
  try {
    cartContext = useNutritionCart();
  } catch {
    // Not within NutritionCartProvider, that's okay
    cartContext = null;
  }

  // Use toast context for notifications
  const { showToast } = useToast();

  // Load data from localStorage on mount
  useEffect(() => {
    const savedGoals = localStorage.getItem(STORAGE_KEY);
    const savedProgress = localStorage.getItem(PROGRESS_KEY);

    if (savedGoals) {
      const parsed = JSON.parse(savedGoals);
      setGoals(parsed);
      setTempGoals(parsed);
    }

    if (savedProgress) {
      const parsed = JSON.parse(savedProgress);
      setProgress(parsed);
    }
  }, []);

  // Save goals to localStorage
  const saveGoals = () => {
    setGoals(tempGoals);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tempGoals));
    setIsEditing(false);
  };

  // Reset daily progress
  const resetProgress = () => {
    const newProgress = {
      consumed: { calories: 0, protein: 0, carbs: 0, fats: 0 },
      loggedFoods: []
    };
    setProgress(newProgress);
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(newProgress));
  };

  // Quick Add from Cart functionality
  const quickAddFromCart = (cartItem: any) => {
    const multiplier = cartItem.portionSize / 100;
    const nutritionToAdd = {
      calories: Math.round((cartItem.calories || 0) * multiplier),
      protein: cartItem.nutrients.protein * multiplier,
      carbs: cartItem.nutrients.carbs * multiplier,
      fats: cartItem.nutrients.fats * multiplier,
    };

    const newProgress = {
      consumed: {
        calories: progress.consumed.calories + nutritionToAdd.calories,
        protein: progress.consumed.protein + nutritionToAdd.protein,
        carbs: progress.consumed.carbs + nutritionToAdd.carbs,
        fats: progress.consumed.fats + nutritionToAdd.fats,
      },
      loggedFoods: [
        ...progress.loggedFoods,
        {
          ...cartItem,
          loggedAt: new Date(),
          portionSize: cartItem.portionSize,
        }
      ]
    };

    setProgress(newProgress);
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(newProgress));

    // Show success toast notification
    showToast(`Added ${cartItem.name} (${cartItem.portionSize}g) to today's progress`, 'success');
  };

  // Check if a cart item is already logged today
  const isAlreadyLoggedToday = (cartItem: any) => {
    return progress.loggedFoods.some(loggedItem => 
      (loggedItem.id === cartItem.id) || (loggedItem.name === cartItem.name)
    );
  };

  // Calculate progress percentages
  const getProgressPercentage = (consumed: number, goal: number) => {
    return Math.min((consumed / goal) * 100, 100);
  };

  // Progress ring component
  const ProgressRing: React.FC<{ percentage: number; color: string; label: string; current: number; target: number }> = ({
    percentage, color, label, current, target
  }) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="flex flex-col items-center">
        <div className="relative w-24 h-24 mb-2">
          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-border-light dark:text-border-dark"
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={`var(--color-${color})`}
              strokeWidth="8"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000"
              style={{ '--color-primary': '#2DD4BF', '--color-secondary': '#F472B6', '--color-accent': '#FBBF24' } as React.CSSProperties}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-text-light dark:text-text-dark">
              {Math.round(percentage)}%
            </span>
          </div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-text-light dark:text-text-dark capitalize">{label}</div>
          <div className="text-sm text-text-subtle-light dark:text-text-subtle-dark">
            {current} / {target}g
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-text-light dark:text-text-dark mb-2">
          Daily Nutrition Goals
        </h2>
        <p className="text-text-subtle-light dark:text-text-subtle-dark">
          Set and track your daily nutrition targets
        </p>
      </div>

      {/* Goals Settings */}
      <div className="bg-white dark:bg-[#1C2C1F] rounded-xl p-6 shadow-sm border border-border-light dark:border-border-dark">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-text-light dark:text-text-dark">
            Your Goals
          </h3>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 bg-accent text-text-light rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">
              {isEditing ? 'close' : 'edit'}
            </span>
            {isEditing ? 'Cancel' : 'Edit Goals'}
          </button>
        </div>

        {isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Object.entries(tempGoals).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <label className="block text-sm font-medium text-text-light dark:text-text-dark capitalize">
                  {key} {key === 'calories' ? '(kcal)' : '(g)'}
                </label>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => setTempGoals(prev => ({
                    ...prev,
                    [key]: parseInt(e.target.value) || 0
                  }))}
                  className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg focus:border-accent focus:ring-2 focus:ring-accent/20"
                  min="0"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Object.entries(goals).map(([key, value]) => (
              <div key={key} className="text-center p-4 bg-accent/10 rounded-lg">
                <div className="text-2xl font-bold text-accent mb-1">{value}</div>
                <div className="text-sm text-text-subtle-light dark:text-text-subtle-dark capitalize">
                  {key} {key === 'calories' ? '(kcal)' : '(g)'}
                </div>
              </div>
            ))}
          </div>
        )}

        {isEditing && (
          <div className="flex justify-end">
            <button
              onClick={saveGoals}
              className="px-6 py-2 bg-accent text-text-light rounded-lg hover:opacity-90 transition-opacity font-medium"
            >
              Save Goals
            </button>
          </div>
        )}
      </div>

      {/* Progress Tracking */}
      <div className="bg-white dark:bg-[#1C2C1F] rounded-xl p-6 shadow-sm border border-border-light dark:border-border-dark">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-text-light dark:text-text-dark">
            Today's Progress
          </h3>
          <button
            onClick={resetProgress}
            className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            Reset Day
          </button>
        </div>

        {/* Progress Rings */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <ProgressRing
            percentage={getProgressPercentage(progress.consumed.calories, goals.calories)}
            color="primary"
            label="Calories"
            current={progress.consumed.calories}
            target={goals.calories}
          />
          <ProgressRing
            percentage={getProgressPercentage(progress.consumed.protein, goals.protein)}
            color="secondary"
            label="Protein"
            current={progress.consumed.protein}
            target={goals.protein}
          />
          <ProgressRing
            percentage={getProgressPercentage(progress.consumed.carbs, goals.carbs)}
            color="accent"
            label="Carbs"
            current={progress.consumed.carbs}
            target={goals.carbs}
          />
          <ProgressRing
            percentage={getProgressPercentage(progress.consumed.fats, goals.fats)}
            color="primary"
            label="Fats"
            current={progress.consumed.fats}
            target={goals.fats}
          />
        </div>

        {/* Achievement Messages */}
        <div className="text-center">
          {progress.consumed.calories >= goals.calories * 0.9 && progress.consumed.calories < goals.calories ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-lg">
              <span className="material-symbols-outlined">local_fire_department</span>
              Almost there! You're so close to your calorie goal!
            </div>
          ) : progress.consumed.calories >= goals.calories ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-lg">
              <span className="material-symbols-outlined">celebration</span>
              Congratulations! You've reached your calorie goal!
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-lg">
              <span className="material-symbols-outlined">flag</span>
              Keep going! You're making great progress toward your goals.
            </div>
          )}
        </div>
      </div>

      {/* Quick Add from Cart */}
      {cartContext && cartContext.state.items.length > 0 && (
        <div className="bg-white dark:bg-[#1C2C1F] rounded-xl p-6 shadow-sm border border-border-light dark:border-border-dark">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-light dark:text-text-dark">
              Quick Add from Cart
            </h3>
            <span className="text-sm text-text-subtle-light dark:text-text-subtle-dark">
              {cartContext.state.items.length} items available
            </span>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto">
            {cartContext.state.items.map((cartItem) => {
              const isAlreadyLogged = isAlreadyLoggedToday(cartItem);
              const multiplier = cartItem.portionSize / 100;
              const calories = Math.round((cartItem.calories || 0) * multiplier);
              
              return (
                <div
                  key={cartItem.id || cartItem.name}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    isAlreadyLogged 
                      ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-60'
                      : 'bg-accent/5 border-accent/20 hover:bg-accent/10 transition-colors'
                  }`}
                >
                  <img
                    src={cartItem.imageUrl}
                    alt={cartItem.name}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-text-light dark:text-text-dark truncate">
                      {cartItem.name}
                    </h4>
                    <div className="text-sm text-text-subtle-light dark:text-text-subtle-dark">
                      {cartItem.portionSize}g • {calories} cal
                      {cartItem.mealType && (
                        <span className="ml-2 px-2 py-0.5 bg-accent/20 text-accent rounded-full text-xs">
                          {cartItem.mealType}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isAlreadyLogged ? (
                      <span className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                        ✓ Logged
                      </span>
                    ) : (
                      <button
                        onClick={() => quickAddFromCart(cartItem)}
                        className="px-3 py-1 bg-accent text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">add</span>
                        Add
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {cartContext.state.items.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border-light dark:border-border-dark">
              <div className="flex items-center justify-between text-sm text-text-subtle-light dark:text-text-subtle-dark mb-3">
                <span>Cart Totals:</span>
                <span>
                  {Math.round(cartContext.state.totalCalories)} cal • 
                  {Math.round(cartContext.state.totalProtein)}g protein
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // Add all unlogged cart items to today's progress
                    cartContext.state.items.forEach(item => {
                      if (!isAlreadyLoggedToday(item)) {
                        quickAddFromCart(item);
                      }
                    });
                  }}
                  className="flex-1 px-3 py-2 bg-accent text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
                >
                  Add All Unlogged
                </button>
                <button
                  onClick={() => {
                    // Navigate to cart (this would be handled by parent component)
                    console.log('Navigate to cart');
                  }}
                  className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-text-light dark:text-text-dark rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  Edit Cart
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-primary/10 via-secondary/5 to-accent/10 rounded-xl p-6 border border-border-light dark:border-border-dark">
        <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-4 text-center">
          Quick Actions
        </h3>
        <div className="flex flex-wrap justify-center gap-3">
          <button className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">add</span>
            Log Food
          </button>
          <button className="px-4 py-2 bg-secondary text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">restaurant</span>
            Plan Meal
          </button>
          <button className="px-4 py-2 bg-accent text-text-light rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">analytics</span>
            View Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailyGoals;
