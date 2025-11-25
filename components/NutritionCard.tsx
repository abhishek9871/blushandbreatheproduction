import React, { useState } from 'react';
import type { NutritionInfo, TipCard } from '../types';
import { useComparison } from '../hooks/useComparison';
import { useNutritionCart } from '../hooks/useNutritionCart';
import BookmarkButton from './BookmarkButton';

const NutrientBar: React.FC<{ label: string; value: number; max: number; color: string }> = ({ label, value, max, color }) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="font-medium text-text-light dark:text-text-dark">{label}</span>
        <span className="text-text-subtle-light dark:text-text-subtle-dark">{value}g</span>
      </div>
      <div className="h-2 bg-border-light dark:bg-border-dark rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

interface NutritionCardProps {
  item: NutritionInfo | TipCard;
  onAddToMeal?: (food: NutritionInfo) => void;
  showAddToMeal?: boolean;
  showCompareButton?: boolean;
  showCartActions?: boolean;
}

const NutritionInfoCard: React.FC<{ item: NutritionInfo } & Omit<NutritionCardProps, 'item'>> = ({
  item,
  onAddToMeal,
  showAddToMeal,
  showCompareButton,
  showCartActions
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedPortion, setSelectedPortion] = useState(100);
  
  // Use comparison context if available
  let comparisonContext;
  try {
    comparisonContext = useComparison();
  } catch {
    // Not within ComparisonProvider, that's okay
    comparisonContext = null;
  }

  // Use cart context if available
  let cartContext;
  try {
    cartContext = useNutritionCart();
  } catch {
    // Not within NutritionCartProvider, that's okay
    cartContext = null;
  }

  // Calculate nutrition for selected portion
  const calculateNutrition = (grams: number) => ({
    protein: Math.round((item.nutrients.protein * grams / 100) * 10) / 10,
    carbs: Math.round((item.nutrients.carbs * grams / 100) * 10) / 10,
    fats: Math.round((item.nutrients.fats * grams / 100) * 10) / 10,
    calories: Math.round((item.nutrients.protein * 4 + item.nutrients.carbs * 4 + item.nutrients.fats * 9) * grams / 100)
  });

  const nutrition = calculateNutrition(selectedPortion);

  // Health benefits based on nutrients
  const getHealthBenefits = () => {
    const benefits = [];
    if (item.nutrients.protein > 10) benefits.push('High-quality protein for muscle repair');
    if (item.nutrients.carbs > 15) benefits.push('Sustained energy from complex carbs');
    if (item.nutrients.fats > 10) benefits.push('Healthy fats for hormone balance');
    if (item.nutrients.protein > 5 && item.nutrients.carbs > 10) benefits.push('Balanced macronutrients');

    // Food-specific benefits
    const foodName = item.name.toLowerCase();
    if (foodName.includes('salmon') || foodName.includes('fish')) benefits.push('Rich in omega-3 fatty acids');
    if (foodName.includes('berry') || foodName.includes('kale')) benefits.push('Antioxidant powerhouse');
    if (foodName.includes('yogurt') || foodName.includes('kefir')) benefits.push('Probiotics for gut health');

    return benefits;
  };

  return (
    <div className="bg-white dark:bg-[#1C2C1F] rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-border-light dark:border-border-dark group">
      {/* Image Section */}
      <div className="relative overflow-hidden">
        <div
          className="w-full h-48 bg-center bg-cover bg-no-repeat group-hover:scale-105 transition-transform duration-300"
          style={{ backgroundImage: `url(${item.imageUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Quick Actions */}
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <BookmarkButton item={{ ...item, contentType: 'Nutrition' }} className="bg-white/90 dark:bg-black/90 text-text-subtle-light dark:text-text-subtle-dark hover:text-primary dark:hover:text-primary shadow-lg" />
          {showCartActions && cartContext && (
            <button
              onClick={() => cartContext.isInCart(item.id || item.name) 
                ? cartContext.removeItem(item.id || item.name)
                : cartContext.addItem(item, selectedPortion)
              }
              className={`p-2 rounded-full transition-colors shadow-lg ${
                cartContext.isInCart(item.id || item.name)
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-accent text-white hover:bg-accent/90'
              }`}
              title={
                cartContext.isInCart(item.id || item.name)
                  ? 'Remove from cart'
                  : 'Add to cart'
              }
            >
              <span className="material-symbols-outlined text-sm">
                {cartContext.isInCart(item.id || item.name) ? 'shopping_cart' : 'add_shopping_cart'}
              </span>
            </button>
          )}
          {showCompareButton && comparisonContext && (
            <button
              onClick={() => comparisonContext.addToComparison(item)}
              disabled={!comparisonContext.canAddMore || comparisonContext.isInComparisonStrict(item)}
              className={`p-2 rounded-full transition-colors shadow-lg ${
                comparisonContext.isInComparisonStrict(item)
                  ? 'bg-accent text-white'
                  : comparisonContext.canAddMore
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-400 text-gray-600 cursor-not-allowed'
              }`}
              title={
                comparisonContext.isInComparisonStrict(item)
                  ? 'Already in comparison'
                  : comparisonContext.canAddMore
                  ? 'Add to comparison'
                  : 'Comparison full (max 3)'
              }
            >
              <span className="material-symbols-outlined text-sm">compare_arrows</span>
            </button>
          )}
          {showAddToMeal && onAddToMeal && (
            <button
              onClick={() => onAddToMeal(item)}
              className="p-2 bg-accent text-white rounded-full hover:bg-accent/90 transition-colors shadow-lg"
              title="Add to meal"
            >
              <span className="material-symbols-outlined text-sm">add</span>
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 bg-white/90 dark:bg-black/90 text-text-light dark:text-text-dark rounded-full hover:bg-accent/10 transition-colors shadow-lg"
            title="View details"
          >
            <span className="material-symbols-outlined text-sm">
              {isExpanded ? 'expand_less' : 'expand_more'}
            </span>
          </button>
        </div>

        {/* Calories Badge */}
        <div className="absolute bottom-3 left-3 bg-black/70 text-white px-2 py-1 rounded-lg text-sm font-medium">
          {nutrition.calories} cal
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-bold text-text-light dark:text-text-dark leading-tight">
            {item.name}
          </h3>
          <div className="flex gap-1">
            <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">
              USDA
            </span>
          </div>
        </div>

        <p className="text-text-subtle-light dark:text-text-subtle-dark text-sm leading-relaxed mb-4 line-clamp-2">
          {item.description}
        </p>

        {/* Portion Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">
            Portion Size
          </label>
          <select
            value={selectedPortion}
            onChange={(e) => setSelectedPortion(Number(e.target.value))}
            className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm focus:border-accent focus:ring-2 focus:ring-accent/20"
          >
            <option value={50}>50g (small serving)</option>
            <option value={100}>100g (standard serving)</option>
            <option value={150}>150g (large serving)</option>
            <option value={200}>200g (extra large)</option>
          </select>
        </div>

        {/* Nutrition Bars */}
        <div className="space-y-3 mb-4">
          <NutrientBar label="Protein" value={nutrition.protein} max={50} color="bg-primary" />
          <NutrientBar label="Carbohydrates" value={nutrition.carbs} max={50} color="bg-secondary" />
          <NutrientBar label="Fats" value={nutrition.fats} max={30} color="bg-accent" />
        </div>

        {/* Health Benefits */}
        {isExpanded && (
          <div className="mb-4 p-3 bg-accent/10 rounded-lg">
            <h4 className="font-semibold text-text-light dark:text-text-dark mb-2 text-sm">
              Health Benefits
            </h4>
            <ul className="space-y-1">
              {getHealthBenefits().map((benefit, index) => (
                <li key={index} className="text-sm text-text-subtle-light dark:text-text-subtle-dark flex items-start gap-2">
                  <span className="material-symbols-outlined text-accent text-sm mt-0.5">check_circle</span>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark rounded-lg hover:bg-accent/10 transition-colors text-sm font-medium"
          >
            <span className="material-symbols-outlined text-sm">
              {isExpanded ? 'expand_less' : 'expand_more'}
            </span>
            {isExpanded ? 'Show Less' : 'Learn More'}
          </button>

          {showCartActions && cartContext && (
            <button
              onClick={() => cartContext.isInCart(item.id || item.name) 
                ? cartContext.removeItem(item.id || item.name)
                : cartContext.addItem(item, selectedPortion)
              }
              className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 ${
                cartContext.isInCart(item.id || item.name)
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-accent text-text-light hover:opacity-90'
              }`}
            >
              <span className="material-symbols-outlined text-sm">
                {cartContext.isInCart(item.id || item.name) ? 'shopping_cart' : 'add_shopping_cart'}
              </span>
              {cartContext.isInCart(item.id || item.name) ? 'In Cart' : 'Add to Cart'}
            </button>
          )}

          {showCompareButton && comparisonContext && (
            <button
              onClick={() => comparisonContext.addToComparison(item)}
              disabled={!comparisonContext.canAddMore || comparisonContext.isInComparisonStrict(item)}
              className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 ${
                comparisonContext.isInComparisonStrict(item)
                  ? 'bg-accent/20 text-accent cursor-default'
                  : comparisonContext.canAddMore
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
              }`}
            >
              <span className="material-symbols-outlined text-sm">compare_arrows</span>
              {comparisonContext.isInComparisonStrict(item) ? 'Added' : 'Compare'}
            </button>
          )}

          {showAddToMeal && onAddToMeal && (
            <button
              onClick={() => onAddToMeal(item)}
              className="px-4 py-2 bg-accent text-text-light rounded-lg hover:opacity-90 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const NutritionTipCard: React.FC<{ item: TipCard }> = ({ item }) => {
  const [isRead, setIsRead] = useState(false);

  return (
    <div className="relative bg-gradient-to-br from-accent/5 to-secondary/5 dark:from-accent/10 dark:to-secondary/10 rounded-xl p-6 border border-accent/20 dark:border-accent/30 group">
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <BookmarkButton item={{ ...item, contentType: 'Nutrition' }} className="bg-white/50 dark:bg-black/50 hover:bg-white dark:hover:bg-black text-text-subtle-light dark:text-text-subtle-dark hover:text-primary dark:hover:text-primary" />
      </div>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-accent text-2xl">{item.icon}</span>
        </div>

        <div className="flex-1">
          <h3 className="text-xl font-bold text-text-light dark:text-text-dark mb-2">
            {item.title}
          </h3>
          <p className="text-text-subtle-light dark:text-text-subtle-dark leading-relaxed mb-4">
            {item.description}
          </p>

          <button
            onClick={() => setIsRead(!isRead)}
            className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 ${
              isRead
                ? 'bg-accent text-text-light'
                : 'bg-accent/10 text-accent hover:bg-accent/20'
            }`}
          >
            <span className="material-symbols-outlined text-sm">
              {isRead ? 'check_circle' : 'lightbulb'}
            </span>
            {isRead ? 'Read!' : 'Read Tip'}
          </button>

          {isRead && (
            <div className="mt-4 p-3 bg-accent/10 rounded-lg">
              <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark">
                💡 <strong>Pro Tip:</strong> Small consistent changes in your nutrition habits lead to big results over time.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const NutritionCard: React.FC<NutritionCardProps> = (props) => {
  if ('type' in props.item && props.item.type === 'tip') {
    return <NutritionTipCard item={props.item} />;
  }
  return <NutritionInfoCard {...props} />;
};

export default NutritionCard;
