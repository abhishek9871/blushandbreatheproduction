'use client';

import React, { useState } from 'react';
import type { NutritionInfo, TipCard } from '@/types';
import { useNutritionCart } from '@/hooks/useNutritionCart';
import BookmarkButton from './BookmarkButton';

const NutrientBar: React.FC<{ label: string; value: number; max: number; color: string }> = ({ label, value, max, color }) => {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs"><span className="font-medium">{label}</span><span className="text-text-subtle-light">{value}g</span></div>
      <div className="h-2 bg-border-light dark:bg-border-dark rounded-full overflow-hidden"><div className={`h-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} /></div>
    </div>
  );
};

interface NutritionCardProps { item: NutritionInfo | TipCard; onAddToMeal?: (food: NutritionInfo) => void; showAddToMeal?: boolean; showCartActions?: boolean; }

const NutritionInfoCard: React.FC<{ item: NutritionInfo } & Omit<NutritionCardProps, 'item'>> = ({ item, onAddToMeal, showAddToMeal, showCartActions }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedPortion, setSelectedPortion] = useState(100);
  let cartContext; try { cartContext = useNutritionCart(); } catch { cartContext = null; }

  const calcNutrition = (g: number) => ({
    protein: Math.round((item.nutrients.protein * g / 100) * 10) / 10,
    carbs: Math.round((item.nutrients.carbs * g / 100) * 10) / 10,
    fats: Math.round((item.nutrients.fats * g / 100) * 10) / 10,
    calories: Math.round((item.nutrients.protein * 4 + item.nutrients.carbs * 4 + item.nutrients.fats * 9) * g / 100)
  });
  const nutrition = calcNutrition(selectedPortion);

  return (
    <div className="bg-white dark:bg-[#1C2C1F] rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden border group">
      <div className="relative overflow-hidden">
        <div className="w-full h-48 bg-center bg-cover bg-no-repeat group-hover:scale-105 transition-transform duration-300" style={{ backgroundImage: `url(${item.imageUrl})` }} />
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <BookmarkButton item={{ ...item, contentType: 'Nutrition' }} className="bg-white/90 dark:bg-black/90 shadow-lg" />
          {showCartActions && cartContext && (
            <button onClick={() => cartContext.isInCart(item.id || item.name) ? null : cartContext.addItem(item, selectedPortion)} className={`p-2 rounded-full shadow-lg ${cartContext.isInCart(item.id || item.name) ? 'bg-green-600 text-white' : 'bg-accent text-white hover:bg-accent/90'}`}>
              <span className="material-symbols-outlined text-sm">{cartContext.isInCart(item.id || item.name) ? 'shopping_cart' : 'add_shopping_cart'}</span>
            </button>
          )}
        </div>
        <div className="absolute bottom-3 left-3 bg-black/70 text-white px-2 py-1 rounded-lg text-sm font-medium">{nutrition.calories} cal</div>
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-bold leading-tight">{item.name}</h3>
          <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">USDA</span>
        </div>
        <p className="text-text-subtle-light text-sm line-clamp-2 mb-4">{item.description}</p>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Portion Size</label>
          <select value={selectedPortion} onChange={e => setSelectedPortion(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm">
            <option value={50}>50g</option><option value={100}>100g</option><option value={150}>150g</option><option value={200}>200g</option>
          </select>
        </div>

        <div className="space-y-3 mb-4">
          <NutrientBar label="Protein" value={nutrition.protein} max={50} color="bg-primary" />
          <NutrientBar label="Carbs" value={nutrition.carbs} max={50} color="bg-secondary" />
          <NutrientBar label="Fats" value={nutrition.fats} max={30} color="bg-accent" />
        </div>

        <div className="flex gap-3">
          <button onClick={() => setIsExpanded(!isExpanded)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-background-light dark:bg-background-dark rounded-lg hover:bg-accent/10 text-sm font-medium">
            <span className="material-symbols-outlined text-sm">{isExpanded ? 'expand_less' : 'expand_more'}</span>{isExpanded ? 'Less' : 'More'}
          </button>
          {showCartActions && cartContext && (
            <button onClick={() => !cartContext.isInCart(item.id || item.name) && cartContext.addItem(item, selectedPortion)} className={`px-4 py-2 rounded-lg text-sm font-medium ${cartContext.isInCart(item.id || item.name) ? 'bg-green-600 text-white' : 'bg-accent text-white'}`}>
              {cartContext.isInCart(item.id || item.name) ? 'In Cart' : 'Add'}
            </button>
          )}
          {showAddToMeal && onAddToMeal && (<button onClick={() => onAddToMeal(item)} className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium">Add</button>)}
        </div>
      </div>
    </div>
  );
};

const NutritionTipCard: React.FC<{ item: TipCard }> = ({ item }) => {
  const [isRead, setIsRead] = useState(false);
  return (
    <div className="relative bg-gradient-to-br from-accent/5 to-secondary/5 rounded-xl p-6 border border-accent/20 group">
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"><BookmarkButton item={{ ...item, contentType: 'Nutrition' }} className="bg-white/50 dark:bg-black/50" /></div>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0"><span className="material-symbols-outlined text-accent text-2xl">{item.icon}</span></div>
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-2">{item.title}</h3>
          <p className="text-text-subtle-light leading-relaxed mb-4">{item.description}</p>
          <button onClick={() => setIsRead(!isRead)} className={`px-4 py-2 rounded-lg text-sm font-medium ${isRead ? 'bg-accent text-white' : 'bg-accent/10 text-accent'}`}>{isRead ? 'Read!' : 'Read Tip'}</button>
        </div>
      </div>
    </div>
  );
};

const NutritionCard: React.FC<NutritionCardProps> = (props) => {
  if ('type' in props.item && props.item.type === 'tip') return <NutritionTipCard item={props.item} />;
  return <NutritionInfoCard {...props} item={props.item as NutritionInfo} />;
};

export default NutritionCard;
