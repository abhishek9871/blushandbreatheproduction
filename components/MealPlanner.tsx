'use client';

import React, { useState, useEffect } from 'react';
import type { NutritionInfo } from '@/types';

interface MealItem { food: NutritionInfo; quantity: number; servings: number; }
interface Meal { id: string; name: string; type: 'breakfast' | 'lunch' | 'dinner' | 'snack'; items: MealItem[]; totalNutrition: { calories: number; protein: number; carbs: number; fats: number }; }

const STORAGE_KEY = 'nutrition_meals';

const MealPlanner: React.FC = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [mounted, setMounted] = useState(false);

  const availableFoods: NutritionInfo[] = [
    { id: 'food-1', name: 'Chicken Breast', description: 'Lean protein', imageUrl: 'https://source.unsplash.com/400x300/?chicken', nutrients: { protein: 31, carbs: 0, fats: 3.6 } },
    { id: 'food-2', name: 'Brown Rice', description: 'Complex carbs', imageUrl: 'https://source.unsplash.com/400x300/?rice', nutrients: { protein: 2.7, carbs: 23, fats: 0.9 } },
    { id: 'food-3', name: 'Broccoli', description: 'Vitamins & fiber', imageUrl: 'https://source.unsplash.com/400x300/?broccoli', nutrients: { protein: 2.8, carbs: 7, fats: 0.4 } },
  ];

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setMeals(JSON.parse(saved));
    else {
      const defaults: Meal[] = [
        { id: 'breakfast-1', name: 'Breakfast', type: 'breakfast', items: [], totalNutrition: { calories: 0, protein: 0, carbs: 0, fats: 0 } },
        { id: 'lunch-1', name: 'Lunch', type: 'lunch', items: [], totalNutrition: { calories: 0, protein: 0, carbs: 0, fats: 0 } },
      ];
      setMeals(defaults);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    }
  }, []);

  const saveMeals = (m: Meal[]) => { setMeals(m); if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(m)); };
  const calcNutrition = (items: MealItem[]) => items.reduce((t, i) => { const m = (i.quantity / 100) * i.servings; return { calories: t.calories + (i.food.nutrients.protein * 4 + i.food.nutrients.carbs * 4 + i.food.nutrients.fats * 9) * m, protein: t.protein + i.food.nutrients.protein * m, carbs: t.carbs + i.food.nutrients.carbs * m, fats: t.fats + i.food.nutrients.fats * m }; }, { calories: 0, protein: 0, carbs: 0, fats: 0 });
  const addFood = (mealId: string, food: NutritionInfo) => { const u = meals.map(m => m.id === mealId ? { ...m, items: [...m.items, { food, quantity: 100, servings: 1 }], totalNutrition: calcNutrition([...m.items, { food, quantity: 100, servings: 1 }]) } : m); saveMeals(u); };
  const removeFood = (mealId: string, idx: number) => { const u = meals.map(m => m.id === mealId ? { ...m, items: m.items.filter((_, i) => i !== idx), totalNutrition: calcNutrition(m.items.filter((_, i) => i !== idx)) } : m); saveMeals(u); };
  const getMealIcon = (t: string) => t === 'breakfast' ? 'breakfast_dining' : t === 'lunch' ? 'lunch_dining' : t === 'dinner' ? 'dinner_dining' : 'restaurant';

  if (!mounted) return null;

  return (
    <div className="space-y-8">
      <div className="text-center"><h2 className="text-3xl font-bold text-text-light dark:text-text-dark mb-2">Meal Planner</h2></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-3">
          <div className="flex justify-between items-center"><h3 className="text-xl font-semibold">Your Meals</h3><button onClick={() => setIsCreating(true)} className="px-3 py-2 bg-accent text-white rounded-lg text-sm">+ New</button></div>
          {meals.map(m => (<div key={m.id} onClick={() => setSelectedMeal(m)} className={`p-4 rounded-xl border cursor-pointer ${selectedMeal?.id === m.id ? 'border-accent bg-accent/10' : 'border-border-light dark:border-border-dark'}`}><div className="flex items-center gap-2"><span className="material-symbols-outlined text-accent">{getMealIcon(m.type)}</span><span className="font-medium">{m.name}</span></div><div className="text-sm text-text-subtle-light">{m.items.length} foods • {Math.round(m.totalNutrition.calories)} cal</div></div>))}
        </div>
        <div className="lg:col-span-2">
          {selectedMeal ? (
            <div className="bg-white dark:bg-[#1C2C1F] rounded-xl p-6 border border-border-light dark:border-border-dark space-y-4">
              <h3 className="text-xl font-semibold">{selectedMeal.name}</h3>
              <div className="grid grid-cols-4 gap-2 p-3 bg-accent/10 rounded-lg text-center text-sm">
                <div><div className="font-bold text-accent">{Math.round(selectedMeal.totalNutrition.calories)}</div>Cal</div>
                <div><div className="font-bold text-primary">{Math.round(selectedMeal.totalNutrition.protein)}g</div>Protein</div>
                <div><div className="font-bold text-secondary">{Math.round(selectedMeal.totalNutrition.carbs)}g</div>Carbs</div>
                <div><div className="font-bold">{Math.round(selectedMeal.totalNutrition.fats)}g</div>Fats</div>
              </div>
              <div className="space-y-2">{selectedMeal.items.map((item, i) => (<div key={i} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"><img src={item.food.imageUrl} alt="" className="w-10 h-10 rounded object-cover" /><span className="flex-1">{item.food.name}</span><button onClick={() => removeFood(selectedMeal.id, i)} className="text-red-500 text-sm">Remove</button></div>))}</div>
              <h4 className="font-medium pt-4">Add Foods:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">{availableFoods.map(f => (<button key={f.id} onClick={() => addFood(selectedMeal.id, f)} className="flex items-center gap-2 p-2 border rounded-lg hover:bg-accent/10"><img src={f.imageUrl} alt="" className="w-8 h-8 rounded object-cover" /><span className="text-sm">{f.name}</span></button>))}</div>
            </div>
          ) : (<div className="text-center py-12 text-text-subtle-light">Select a meal to start planning</div>)}
        </div>
      </div>
      {isCreating && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-80"><h3 className="font-bold mb-4">New Meal</h3><input id="mname" className="w-full border rounded p-2 mb-2" placeholder="Name" /><select id="mtype" className="w-full border rounded p-2 mb-4"><option value="breakfast">Breakfast</option><option value="lunch">Lunch</option><option value="dinner">Dinner</option></select><div className="flex gap-2"><button onClick={() => setIsCreating(false)} className="flex-1 py-2 border rounded">Cancel</button><button onClick={() => { const n = (document.getElementById('mname') as HTMLInputElement).value; const t = (document.getElementById('mtype') as HTMLSelectElement).value as Meal['type']; if (n) { saveMeals([...meals, { id: `${t}-${Date.now()}`, name: n, type: t, items: [], totalNutrition: { calories: 0, protein: 0, carbs: 0, fats: 0 } }]); setIsCreating(false); } }} className="flex-1 py-2 bg-accent text-white rounded">Create</button></div></div></div>)}
    </div>
  );
};

export default MealPlanner;
