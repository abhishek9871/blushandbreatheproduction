'use client';

import React, { useState, useEffect } from 'react';
import type { NutritionInfo } from '@/types';
import { useNutritionCart } from '@/hooks/useNutritionCart';

interface DailyGoalsData { calories: number; protein: number; carbs: number; fats: number; }
interface DailyProgress { consumed: DailyGoalsData; loggedFoods: NutritionInfo[]; }

const STORAGE_KEY = 'nutrition_daily_goals';
const PROGRESS_KEY = 'nutrition_daily_progress';

const DailyGoals: React.FC = () => {
  const [goals, setGoals] = useState<DailyGoalsData>({ calories: 2000, protein: 150, carbs: 250, fats: 67 });
  const [progress, setProgress] = useState<DailyProgress>({ consumed: { calories: 0, protein: 0, carbs: 0, fats: 0 }, loggedFoods: [] });
  const [isEditing, setIsEditing] = useState(false);
  const [tempGoals, setTempGoals] = useState<DailyGoalsData>(goals);
  const [mounted, setMounted] = useState(false);

  let cartContext;
  try { cartContext = useNutritionCart(); } catch { cartContext = null; }

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;
    const sg = localStorage.getItem(STORAGE_KEY);
    const sp = localStorage.getItem(PROGRESS_KEY);
    if (sg) { const p = JSON.parse(sg); setGoals(p); setTempGoals(p); }
    if (sp) { setProgress(JSON.parse(sp)); }
  }, []);

  const saveGoals = () => { setGoals(tempGoals); if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(tempGoals)); setIsEditing(false); };
  const resetProgress = () => { const np = { consumed: { calories: 0, protein: 0, carbs: 0, fats: 0 }, loggedFoods: [] }; setProgress(np); if (typeof window !== 'undefined') localStorage.setItem(PROGRESS_KEY, JSON.stringify(np)); };
  const getProgressPct = (c: number, g: number) => Math.min((c / g) * 100, 100);

  const ProgressRing: React.FC<{ pct: number; color: string; label: string; current: number; target: number }> = ({ pct, color, label, current, target }) => {
    const r = 40, c = 2 * Math.PI * r, off = c - (pct / 100) * c;
    return (
      <div className="flex flex-col items-center">
        <div className="relative w-24 h-24 mb-2">
          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-border-light dark:text-border-dark" />
            <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8" strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" className="transition-all duration-1000" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center"><span className="text-lg font-bold">{Math.round(pct)}%</span></div>
        </div>
        <div className="text-center"><div className="font-semibold capitalize">{label}</div><div className="text-sm text-text-subtle-light">{current} / {target}g</div></div>
      </div>
    );
  };

  if (!mounted) return null;

  return (
    <div className="space-y-8">
      <div className="text-center"><h2 className="text-3xl font-bold mb-2">Daily Nutrition Goals</h2><p className="text-text-subtle-light">Set and track your daily nutrition targets</p></div>

      <div className="bg-white dark:bg-[#1C2C1F] rounded-xl p-6 border">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Your Goals</h3>
          <button onClick={() => setIsEditing(!isEditing)} className="px-4 py-2 bg-accent text-white rounded-lg">{isEditing ? 'Cancel' : 'Edit'}</button>
        </div>
        {isEditing ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {Object.entries(tempGoals).map(([k, v]) => (
              <div key={k}><label className="block text-sm font-medium capitalize mb-1">{k}</label><input type="number" value={v} onChange={e => setTempGoals(p => ({ ...p, [k]: parseInt(e.target.value) || 0 }))} className="w-full px-3 py-2 border rounded-lg" /></div>
            ))}
            <button onClick={saveGoals} className="col-span-full px-6 py-2 bg-accent text-white rounded-lg">Save Goals</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(goals).map(([k, v]) => (<div key={k} className="text-center p-4 bg-accent/10 rounded-lg"><div className="text-2xl font-bold text-accent">{v}</div><div className="text-sm text-text-subtle-light capitalize">{k}</div></div>))}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-[#1C2C1F] rounded-xl p-6 border">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Today&apos;s Progress</h3>
          <button onClick={resetProgress} className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg">Reset Day</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <ProgressRing pct={getProgressPct(progress.consumed.calories, goals.calories)} color="#2DD4BF" label="Calories" current={progress.consumed.calories} target={goals.calories} />
          <ProgressRing pct={getProgressPct(progress.consumed.protein, goals.protein)} color="#F472B6" label="Protein" current={progress.consumed.protein} target={goals.protein} />
          <ProgressRing pct={getProgressPct(progress.consumed.carbs, goals.carbs)} color="#FBBF24" label="Carbs" current={progress.consumed.carbs} target={goals.carbs} />
          <ProgressRing pct={getProgressPct(progress.consumed.fats, goals.fats)} color="#2DD4BF" label="Fats" current={progress.consumed.fats} target={goals.fats} />
        </div>
      </div>

      {cartContext && cartContext.state.items.length > 0 && (
        <div className="bg-white dark:bg-[#1C2C1F] rounded-xl p-6 border">
          <h3 className="text-lg font-semibold mb-4">Quick Add from Cart ({cartContext.state.items.length} items)</h3>
          <div className="text-sm text-text-subtle-light">Cart totals: {Math.round(cartContext.state.totalCalories)} cal • {Math.round(cartContext.state.totalProtein)}g protein</div>
        </div>
      )}
    </div>
  );
};

export default DailyGoals;
