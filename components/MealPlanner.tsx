import React, { useState, useEffect } from 'react';
import type { NutritionInfo } from '../types';

interface MealItem {
  food: NutritionInfo;
  quantity: number; // in grams
  servings: number;
}

interface Meal {
  id: string;
  name: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  items: MealItem[];
  totalNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
}

const STORAGE_KEY = 'nutrition_meals';

const MealPlanner: React.FC = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [availableFoods] = useState<NutritionInfo[]>([
    {
      id: 'food-1',
      name: 'Chicken Breast',
      description: 'Lean protein source',
      imageUrl: 'https://source.unsplash.com/400x300/?chicken',
      nutrients: { protein: 31, carbs: 0, fats: 3.6 }
    },
    {
      id: 'food-2',
      name: 'Brown Rice',
      description: 'Complex carbohydrates',
      imageUrl: 'https://source.unsplash.com/400x300/?rice',
      nutrients: { protein: 2.7, carbs: 23, fats: 0.9 }
    },
    {
      id: 'food-3',
      name: 'Broccoli',
      description: 'Rich in vitamins and fiber',
      imageUrl: 'https://source.unsplash.com/400x300/?broccoli',
      nutrients: { protein: 2.8, carbs: 7, fats: 0.4 }
    },
    {
      id: 'food-4',
      name: 'Avocado',
      description: 'Healthy fats and nutrients',
      imageUrl: 'https://source.unsplash.com/400x300/?avocado',
      nutrients: { protein: 2, carbs: 9, fats: 15 }
    }
  ]);

  // Load meals from localStorage
  useEffect(() => {
    const savedMeals = localStorage.getItem(STORAGE_KEY);
    if (savedMeals) {
      setMeals(JSON.parse(savedMeals));
    } else {
      // Create default meal templates
      const defaultMeals: Meal[] = [
        {
          id: 'breakfast-1',
          name: 'Protein-Packed Breakfast',
          type: 'breakfast',
          items: [],
          totalNutrition: { calories: 0, protein: 0, carbs: 0, fats: 0 }
        },
        {
          id: 'lunch-1',
          name: 'Balanced Lunch',
          type: 'lunch',
          items: [],
          totalNutrition: { calories: 0, protein: 0, carbs: 0, fats: 0 }
        },
        {
          id: 'dinner-1',
          name: 'Healthy Dinner',
          type: 'dinner',
          items: [],
          totalNutrition: { calories: 0, protein: 0, carbs: 0, fats: 0 }
        }
      ];
      setMeals(defaultMeals);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultMeals));
    }
  }, []);

  // Save meals to localStorage
  const saveMeals = (updatedMeals: Meal[]) => {
    setMeals(updatedMeals);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMeals));
  };

  // Calculate nutrition for a meal
  const calculateMealNutrition = (items: MealItem[]) => {
    return items.reduce((total, item) => {
      const multiplier = (item.quantity / 100) * item.servings;
      return {
        calories: total.calories + (item.food.nutrients.protein * 4 + item.food.nutrients.carbs * 4 + item.food.nutrients.fats * 9) * multiplier,
        protein: total.protein + item.food.nutrients.protein * multiplier,
        carbs: total.carbs + item.food.nutrients.carbs * multiplier,
        fats: total.fats + item.food.nutrients.fats * multiplier
      };
    }, { calories: 0, protein: 0, carbs: 0, fats: 0 });
  };

  // Add food to meal
  const addFoodToMeal = (mealId: string, food: NutritionInfo) => {
    const updatedMeals = meals.map(meal => {
      if (meal.id === mealId) {
        const newItem: MealItem = {
          food,
          quantity: 100,
          servings: 1
        };
        const updatedItems = [...meal.items, newItem];
        return {
          ...meal,
          items: updatedItems,
          totalNutrition: calculateMealNutrition(updatedItems)
        };
      }
      return meal;
    });
    saveMeals(updatedMeals);
  };

  // Update meal item
  const updateMealItem = (mealId: string, itemIndex: number, quantity: number, servings: number) => {
    const updatedMeals = meals.map(meal => {
      if (meal.id === mealId) {
        const updatedItems = meal.items.map((item, index) =>
          index === itemIndex ? { ...item, quantity, servings } : item
        );
        return {
          ...meal,
          items: updatedItems,
          totalNutrition: calculateMealNutrition(updatedItems)
        };
      }
      return meal;
    });
    saveMeals(updatedMeals);
  };

  // Remove food from meal
  const removeFoodFromMeal = (mealId: string, itemIndex: number) => {
    const updatedMeals = meals.map(meal => {
      if (meal.id === mealId) {
        const updatedItems = meal.items.filter((_, index) => index !== itemIndex);
        return {
          ...meal,
          items: updatedItems,
          totalNutrition: calculateMealNutrition(updatedItems)
        };
      }
      return meal;
    });
    saveMeals(updatedMeals);
  };

  // Create new meal
  const createNewMeal = (name: string, type: Meal['type']) => {
    const newMeal: Meal = {
      id: `${type}-${Date.now()}`,
      name,
      type,
      items: [],
      totalNutrition: { calories: 0, protein: 0, carbs: 0, fats: 0 }
    };
    const updatedMeals = [...meals, newMeal];
    saveMeals(updatedMeals);
    setSelectedMeal(newMeal);
    setIsCreating(false);
  };

  const getMealIcon = (type: Meal['type']) => {
    switch (type) {
      case 'breakfast': return 'breakfast_dining';
      case 'lunch': return 'lunch_dining';
      case 'dinner': return 'dinner_dining';
      case 'snack': return 'icecream';
      default: return 'restaurant';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-text-light dark:text-text-dark mb-2">
          Meal Planner
        </h2>
        <p className="text-text-subtle-light dark:text-text-subtle-dark">
          Build balanced meals and track your nutrition
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Meals List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-text-light dark:text-text-dark">
              Your Meals
            </h3>
            <button
              onClick={() => setIsCreating(true)}
              className="px-4 py-2 bg-accent text-text-light rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              New Meal
            </button>
          </div>

          <div className="space-y-3">
            {meals.map(meal => (
              <div
                key={meal.id}
                onClick={() => setSelectedMeal(meal)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedMeal?.id === meal.id
                    ? 'border-accent bg-accent/10'
                    : 'border-border-light dark:border-border-dark bg-white dark:bg-[#1C2C1F] hover:border-accent/50'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-symbols-outlined text-2xl text-accent">
                    {getMealIcon(meal.type)}
                  </span>
                  <div>
                    <h4 className="font-semibold text-text-light dark:text-text-dark">
                      {meal.name}
                    </h4>
                    <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark capitalize">
                      {meal.type}
                    </p>
                  </div>
                </div>
                <div className="text-sm text-text-subtle-light dark:text-text-subtle-dark">
                  {meal.items.length} foods • {Math.round(meal.totalNutrition.calories)} cal
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Meal Builder */}
        <div className="lg:col-span-2">
          {selectedMeal ? (
            <div className="space-y-6">
              <div className="bg-white dark:bg-[#1C2C1F] rounded-xl p-6 shadow-sm border border-border-light dark:border-border-dark">
                <div className="flex items-center gap-3 mb-4">
                  <span className="material-symbols-outlined text-3xl text-accent">
                    {getMealIcon(selectedMeal.type)}
                  </span>
                  <div>
                    <h3 className="text-xl font-semibold text-text-light dark:text-text-dark">
                      {selectedMeal.name}
                    </h3>
                    <p className="text-text-subtle-light dark:text-text-subtle-dark capitalize">
                      {selectedMeal.type} • {selectedMeal.items.length} items
                    </p>
                  </div>
                </div>

                {/* Nutrition Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-accent/10 rounded-lg">
                  <div className="text-center">
                    <div className="text-lg font-bold text-accent">
                      {Math.round(selectedMeal.totalNutrition.calories)}
                    </div>
                    <div className="text-sm text-text-subtle-light dark:text-text-subtle-dark">Calories</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary">
                      {Math.round(selectedMeal.totalNutrition.protein)}g
                    </div>
                    <div className="text-sm text-text-subtle-light dark:text-text-subtle-dark">Protein</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-secondary">
                      {Math.round(selectedMeal.totalNutrition.carbs)}g
                    </div>
                    <div className="text-sm text-text-subtle-light dark:text-text-subtle-dark">Carbs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-accent">
                      {Math.round(selectedMeal.totalNutrition.fats)}g
                    </div>
                    <div className="text-sm text-text-subtle-light dark:text-text-subtle-dark">Fats</div>
                  </div>
                </div>

                {/* Meal Items */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-text-light dark:text-text-dark">Foods in this meal:</h4>
                  {selectedMeal.items.length === 0 ? (
                    <p className="text-text-subtle-light dark:text-text-subtle-dark py-4 text-center">
                      No foods added yet. Add some foods below!
                    </p>
                  ) : (
                    selectedMeal.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 bg-background-light dark:bg-background-dark rounded-lg">
                        <img
                          src={item.food.imageUrl}
                          alt={item.food.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <h5 className="font-medium text-text-light dark:text-text-dark">
                            {item.food.name}
                          </h5>
                          <div className="flex gap-4 text-sm text-text-subtle-light dark:text-text-subtle-dark">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateMealItem(selectedMeal.id, index, parseInt(e.target.value) || 100, item.servings)}
                              className="w-16 px-2 py-1 border rounded text-xs"
                              placeholder="g"
                            />
                            <span>g ×</span>
                            <input
                              type="number"
                              value={item.servings}
                              onChange={(e) => updateMealItem(selectedMeal.id, index, item.quantity, parseFloat(e.target.value) || 1)}
                              className="w-16 px-2 py-1 border rounded text-xs"
                              step="0.5"
                            />
                            <span>servings</span>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFoodFromMeal(selectedMeal.id, index)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Add Foods Section */}
              <div className="bg-white dark:bg-[#1C2C1F] rounded-xl p-6 shadow-sm border border-border-light dark:border-border-dark">
                <h4 className="font-semibold text-text-light dark:text-text-dark mb-4">
                  Add Foods to {selectedMeal.name}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableFoods.map(food => (
                    <div key={food.id} className="flex items-center gap-3 p-3 border border-border-light dark:border-border-dark rounded-lg">
                      <img
                        src={food.imageUrl}
                        alt={food.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h5 className="font-medium text-text-light dark:text-text-dark">
                          {food.name}
                        </h5>
                        <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark">
                          {food.nutrients.protein}g protein, {food.nutrients.carbs}g carbs
                        </p>
                      </div>
                      <button
                        onClick={() => addFoodToMeal(selectedMeal.id, food)}
                        className="px-3 py-2 bg-accent text-text-light rounded-lg hover:opacity-90 transition-opacity text-sm"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-accent">restaurant</span>
              </div>
              <h3 className="text-xl font-semibold text-text-light dark:text-text-dark mb-2">
                Select a meal to start planning
              </h3>
              <p className="text-text-subtle-light dark:text-text-subtle-dark">
                Choose a meal from the list or create a new one to begin building your nutrition plan.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create New Meal Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1C2C1F] rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-text-light dark:text-text-dark mb-4">
              Create New Meal
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const name = formData.get('name') as string;
              const type = formData.get('type') as Meal['type'];
              if (name && type) {
                createNewMeal(name, type);
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                    Meal Name
                  </label>
                  <input
                    name="name"
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg focus:border-accent focus:ring-2 focus:ring-accent/20"
                    placeholder="e.g., Healthy Breakfast"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                    Meal Type
                  </label>
                  <select
                    name="type"
                    required
                    className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg focus:border-accent focus:ring-2 focus:ring-accent/20"
                  >
                    <option value="">Select type</option>
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Snack</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-text-subtle-light dark:text-text-subtle-dark hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-accent text-text-light rounded-lg hover:opacity-90 transition-opacity"
                >
                  Create Meal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealPlanner;
