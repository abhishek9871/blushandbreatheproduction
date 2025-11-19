import React, { useState } from 'react';
import { useNutritionCart } from '../hooks/useNutritionCart';
import type { CartItem } from '../hooks/useNutritionCart';

interface MiniCartProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToGoals?: () => void;
  onNavigateToMeals?: () => void;
}

const MiniCart: React.FC<MiniCartProps> = ({ isOpen, onClose, onNavigateToGoals, onNavigateToMeals }) => {
  const { state, removeItem, updatePortion, setMealType, clearCart, getItemsForMeal } = useNutritionCart();
  const [activeMealFilter, setActiveMealFilter] = useState<'all' | CartItem['mealType']>('all');

  const mealTypes: Array<'all' | CartItem['mealType']> = ['all', 'breakfast', 'lunch', 'dinner', 'snack'];
  
  const filteredItems = activeMealFilter === 'all' 
    ? state.items 
    : getItemsForMeal(activeMealFilter);

  const handlePortionChange = (itemId: string, newPortion: number) => {
    updatePortion(itemId, newPortion);
  };

  const handleMealTypeChange = (itemId: string, mealType: CartItem['mealType']) => {
    setMealType(itemId, mealType);
  };

  const handleRemoveItem = (itemId: string) => {
    removeItem(itemId);
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear all items from your cart?')) {
      clearCart();
    }
  };

  // Calculate filtered totals
  const filteredTotals = filteredItems.reduce((acc, item) => {
    const multiplier = item.portionSize / 100;
    return {
      calories: acc.calories + (item.calories || 0) * multiplier,
      protein: acc.protein + item.nutrients.protein * multiplier,
      carbs: acc.carbs + item.nutrients.carbs * multiplier,
      fats: acc.fats + item.nutrients.fats * multiplier,
    };
  }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Slide-in Panel */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-background-dark shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-light dark:border-border-dark">
          <div>
            <h2 className="text-2xl font-bold text-text-light dark:text-text-dark">My Foods</h2>
            <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark">
              {state.items.length} items • {Math.round(filteredTotals.calories)} calories
            </p>
          </div>
          <div className="flex items-center gap-2">
            {state.items.length > 0 && (
              <button
                onClick={handleClearCart}
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Clear cart"
              >
                <span className="material-symbols-outlined">delete</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Meal Type Filter */}
        {state.items.length > 0 && (
          <div className="p-4 border-b border-border-light dark:border-border-dark">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {mealTypes.map((mealType) => (
                <button
                  key={mealType}
                  onClick={() => setActiveMealFilter(mealType)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    activeMealFilter === mealType
                      ? 'bg-accent text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-text-subtle-light dark:text-text-subtle-dark hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {mealType === 'all' ? 'All Items' : mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                  {mealType !== 'all' && (
                    <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                      {getItemsForMeal(mealType).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-gray-400">shopping_cart</span>
              </div>
              <h3 className="text-xl font-semibold text-text-light dark:text-text-dark mb-2">
                {state.items.length === 0 ? 'Your cart is empty' : 'No items for this meal'}
              </h3>
              <p className="text-text-subtle-light dark:text-text-subtle-dark mb-4">
                {state.items.length === 0 
                  ? 'Start adding foods to build your meal plan'
                  : 'Try selecting a different meal type or add more items'
                }
              </p>
              {state.items.length === 0 && (
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-accent text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  Browse Foods
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <CartItemRow
                  key={item.id || item.name}
                  item={item}
                  onPortionChange={handlePortionChange}
                  onMealTypeChange={handleMealTypeChange}
                  onRemove={handleRemoveItem}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer with Totals and Actions */}
        {filteredItems.length > 0 && (
          <div className="border-t border-border-light dark:border-border-dark p-6 space-y-4">
            {/* Totals */}
            <div className="space-y-2">
              <h3 className="font-semibold text-text-light dark:text-text-dark mb-3">Nutrition Totals</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-subtle-light dark:text-text-subtle-dark">Calories</span>
                  <span className="font-medium text-text-light dark:text-text-dark">
                    {Math.round(filteredTotals.calories)} kcal
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-subtle-light dark:text-text-subtle-dark">Protein</span>
                  <span className="font-medium text-text-light dark:text-text-dark">
                    {Math.round(filteredTotals.protein)}g
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-subtle-light dark:text-text-subtle-dark">Carbs</span>
                  <span className="font-medium text-text-light dark:text-text-dark">
                    {Math.round(filteredTotals.carbs)}g
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-subtle-light dark:text-text-subtle-dark">Fats</span>
                  <span className="font-medium text-text-light dark:text-text-dark">
                    {Math.round(filteredTotals.fats)}g
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (onNavigateToMeals) {
                    onClose();
                    onNavigateToMeals();
                  }
                }}
                className="flex-1 px-4 py-3 bg-accent text-white rounded-lg hover:opacity-90 transition-opacity font-medium flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">restaurant_menu</span>
                Plan Meal
              </button>
              <button
                onClick={() => {
                  if (onNavigateToGoals) {
                    onClose();
                    onNavigateToGoals();
                  }
                }}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">flag</span>
                Track Today
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

interface CartItemRowProps {
  item: CartItem;
  onPortionChange: (itemId: string, portion: number) => void;
  onMealTypeChange: (itemId: string, mealType: CartItem['mealType']) => void;
  onRemove: (itemId: string) => void;
}

const CartItemRow: React.FC<CartItemRowProps> = ({
  item,
  onPortionChange,
  onMealTypeChange,
  onRemove,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const multiplier = item.portionSize / 100;
  const calories = Math.round((item.calories || 0) * multiplier);
  const protein = Math.round(item.nutrients.protein * multiplier * 10) / 10;
  const carbs = Math.round(item.nutrients.carbs * multiplier * 10) / 10;
  const fats = Math.round(item.nutrients.fats * multiplier * 10) / 10;

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start gap-3">
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-text-light dark:text-text-dark truncate">
            {item.name}
          </h4>
          <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark">
            {calories} calories • {item.portionSize}g
          </p>
        </div>
        <button
          onClick={() => onRemove(item.id || item.name)}
          className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
          title="Remove item"
        >
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        {/* Portion Size */}
        <div className="flex-1">
          <label className="block text-xs font-medium text-text-subtle-light dark:text-text-subtle-dark mb-1">
            Portion (g)
          </label>
          <input
            type="number"
            value={item.portionSize}
            onChange={(e) => onPortionChange(item.id || item.name, Math.max(1, parseInt(e.target.value) || 0))}
            className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-border-light dark:border-border-dark rounded focus:border-accent focus:ring-1 focus:ring-accent/20"
            min="1"
            max="1000"
            step="10"
          />
        </div>

        {/* Meal Type */}
        <div className="flex-1">
          <label className="block text-xs font-medium text-text-subtle-light dark:text-text-subtle-dark mb-1">
            Meal Type
          </label>
          <select
            value={item.mealType || ''}
            onChange={(e) => onMealTypeChange(item.id || item.name, e.target.value as CartItem['mealType'])}
            className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-border-light dark:border-border-dark rounded focus:border-accent focus:ring-1 focus:ring-accent/20"
          >
            <option value="">None</option>
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="snack">Snack</option>
          </select>
        </div>

        {/* Expand Button */}
        <div className="flex items-end">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-text-subtle-light dark:text-text-subtle-dark hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="Toggle details"
          >
            <span className="material-symbols-outlined text-sm">
              {isExpanded ? 'expand_less' : 'expand_more'}
            </span>
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="pt-2 border-t border-border-light dark:border-border-dark">
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="text-center">
              <div className="font-medium text-text-light dark:text-text-dark">Protein</div>
              <div className="text-text-subtle-light dark:text-text-subtle-dark">{protein}g</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-text-light dark:text-text-dark">Carbs</div>
              <div className="text-text-subtle-light dark:text-text-subtle-dark">{carbs}g</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-text-light dark:text-text-dark">Fats</div>
              <div className="text-text-subtle-light dark:text-text-subtle-dark">{fats}g</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-text-light dark:text-text-dark">Added</div>
              <div className="text-text-subtle-light dark:text-text-subtle-dark">
                {new Date(item.addedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MiniCart;
