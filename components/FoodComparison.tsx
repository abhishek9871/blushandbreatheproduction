'use client';

import React, { useState, useEffect } from 'react';
import type { NutritionInfo } from '@/types';

interface FoodComparisonProps { availableFoods: NutritionInfo[]; }

const FoodComparison: React.FC<FoodComparisonProps> = ({ availableFoods }) => {
  const [selectedFoods, setSelectedFoods] = useState<NutritionInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFoods, setFilteredFoods] = useState<NutritionInfo[]>([]);

  useEffect(() => {
    if (!searchQuery.trim()) { setFilteredFoods(availableFoods.slice(0, 20)); return; }
    const filtered = availableFoods.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 20);
    setFilteredFoods(filtered);
  }, [searchQuery, availableFoods]);

  const addFood = (food: NutritionInfo) => { if (selectedFoods.length < 3 && !selectedFoods.find(f => f.id === food.id)) setSelectedFoods([...selectedFoods, food]); };
  const removeFood = (id: string) => { setSelectedFoods(selectedFoods.filter(f => f.id !== id)); };
  const isSelected = (id: string) => selectedFoods.some(f => f.id === id);
  const getBest = (n: 'protein' | 'carbs' | 'fats') => selectedFoods.length === 0 ? null : n === 'protein' ? Math.max(...selectedFoods.map(f => f.nutrients[n])) : Math.min(...selectedFoods.map(f => f.nutrients[n]));
  const isHighlighted = (f: NutritionInfo, n: 'protein' | 'carbs' | 'fats') => getBest(n) !== null && f.nutrients[n] === getBest(n);

  return (
    <div className="space-y-6">
      <div className="text-center"><h2 className="text-2xl font-bold mb-2">Food Comparison</h2><p className="text-text-subtle-light">Compare up to 3 foods side by side</p></div>

      <div className="bg-white dark:bg-background-dark rounded-xl p-6 border">
        <h3 className="font-semibold mb-4">Add Foods ({selectedFoods.length}/3)</h3>
        <div className="relative mb-4">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-subtle-light">search</span>
          <input type="text" placeholder="Search foods..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto">
          {filteredFoods.map(f => (
            <button key={f.id} onClick={() => addFood(f)} disabled={selectedFoods.length >= 3 || isSelected(f.id)} className={`p-3 text-left rounded-lg border transition-colors ${isSelected(f.id) ? 'bg-accent/10 border-accent' : selectedFoods.length >= 3 ? 'bg-gray-50 opacity-50' : 'hover:border-accent'}`}>
              <div className="font-medium text-sm truncate">{f.name}</div>
              <div className="text-xs text-text-subtle-light">{f.nutrients.protein}g protein, {f.nutrients.carbs}g carbs</div>
            </button>
          ))}
        </div>
      </div>

      {selectedFoods.length > 0 && (
        <div className="bg-white dark:bg-background-dark rounded-xl p-6 border">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold">Nutritional Comparison</h3>
            <button onClick={() => setSelectedFoods([])} className="text-sm text-text-subtle-light hover:text-red-600">Clear All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b"><th className="text-left py-3 px-4">Nutrient</th>
                  {selectedFoods.map(f => (<th key={f.id} className="text-center py-3 px-4"><img src={f.imageUrl} alt={f.name} className="w-12 h-12 rounded-lg object-cover mx-auto mb-2" /><div className="font-medium text-sm truncate max-w-24">{f.name}</div><button onClick={() => removeFood(f.id)} className="text-xs text-red-500">Remove</button></th>))}
                </tr>
              </thead>
              <tbody>
                {(['protein', 'carbs', 'fats'] as const).map(n => (
                  <tr key={n} className="border-b">
                    <td className="py-3 px-4 font-medium capitalize">{n} (g)</td>
                    {selectedFoods.map(f => (<td key={f.id} className="text-center py-3 px-4"><span className={`font-semibold ${isHighlighted(f, n) ? (n === 'protein' ? 'text-green-600' : 'text-blue-600') : ''}`}>{f.nutrients[n]}{isHighlighted(f, n) && ' ✓'}</span></td>))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs flex flex-wrap gap-4">
            <span><span className="text-green-600">✓</span> Highest Protein</span>
            <span><span className="text-blue-600">✓</span> Lowest Carbs/Fats</span>
          </div>
        </div>
      )}

      {selectedFoods.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-accent">compare_arrows</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Start Comparing Foods</h3>
          <p className="text-text-subtle-light">Add foods from above to compare their nutritional values</p>
        </div>
      )}
    </div>
  );
};

export default FoodComparison;
