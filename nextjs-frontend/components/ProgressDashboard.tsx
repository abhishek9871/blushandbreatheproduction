'use client';

import React, { useState, useEffect } from 'react';

interface DailyData { date: string; calories: number; protein: number; carbs: number; fats: number; goalCalories: number; goalProtein: number; goalCarbs: number; goalFats: number; }
interface WeeklyStats { averageCalories: number; averageProtein: number; averageCarbs: number; averageFats: number; daysTracked: number; goalsMet: number; }

const STORAGE_KEY = 'nutrition_progress_history';

const ProgressDashboard: React.FC = () => {
  const [progressData, setProgressData] = useState<DailyData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d'>('7d');
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({ averageCalories: 0, averageProtein: 0, averageCarbs: 0, averageFats: 0, daysTracked: 0, goalsMet: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) { const d = JSON.parse(saved); setProgressData(d); calcStats(d); }
    else {
      const sample = Array.from({length: 30}, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (29 - i));
        return { date: d.toISOString().split('T')[0], calories: Math.floor(Math.random() * 800) + 1200, protein: Math.floor(Math.random() * 60) + 90, carbs: Math.floor(Math.random() * 100) + 150, fats: Math.floor(Math.random() * 30) + 40, goalCalories: 2000, goalProtein: 150, goalCarbs: 250, goalFats: 67 };
      });
      setProgressData(sample); localStorage.setItem(STORAGE_KEY, JSON.stringify(sample)); calcStats(sample);
    }
  }, []);

  const calcStats = (data: DailyData[]) => {
    const last7 = data.slice(-7);
    if (last7.length === 0) return;
    const s = last7.reduce((a, d) => ({ tc: a.tc + d.calories, tp: a.tp + d.protein, tcarbs: a.tcarbs + d.carbs, tf: a.tf + d.fats, dt: a.dt + 1, gm: a.gm + (d.calories >= d.goalCalories ? 1 : 0) }), { tc: 0, tp: 0, tcarbs: 0, tf: 0, dt: 0, gm: 0 });
    setWeeklyStats({ averageCalories: Math.round(s.tc / s.dt), averageProtein: Math.round(s.tp / s.dt), averageCarbs: Math.round(s.tcarbs / s.dt), averageFats: Math.round(s.tf / s.dt), daysTracked: s.dt, goalsMet: s.gm });
  };

  const periodData = progressData.slice(selectedPeriod === '7d' ? -7 : -30);

  const BarChart: React.FC<{ data: DailyData[]; metric: keyof DailyData; color: string }> = ({ data, metric, color }) => {
    const max = Math.max(...data.map(d => d[metric] as number));
    return (
      <div className="flex items-end gap-1 h-32">
        {data.map((day, i) => {
          const v = day[metric] as number;
          const pct = (v / max) * 100;
          return (<div key={i} className="flex-1 flex flex-col items-center"><div className={`w-full rounded-t ${color}`} style={{ height: `${pct}%`, minHeight: '4px' }} /><div className="text-xs text-text-subtle-light">{new Date(day.date).getDate()}</div></div>);
        })}
      </div>
    );
  };

  if (!mounted) return null;

  return (
    <div className="space-y-8">
      <div className="text-center"><h2 className="text-3xl font-bold mb-2">Progress Dashboard</h2></div>
      <div className="flex justify-center gap-2">
        {['7d', '30d'].map(p => (<button key={p} onClick={() => setSelectedPeriod(p as '7d'|'30d')} className={`px-4 py-2 rounded-lg ${selectedPeriod === p ? 'bg-accent text-white' : 'bg-gray-100 dark:bg-gray-800'}`}>{p === '7d' ? '7 Days' : '30 Days'}</button>))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1C2C1F] rounded-xl p-4 text-center border"><div className="text-2xl font-bold text-primary">{weeklyStats.averageCalories}</div><div className="text-sm text-text-subtle-light">Avg Calories</div></div>
        <div className="bg-white dark:bg-[#1C2C1F] rounded-xl p-4 text-center border"><div className="text-2xl font-bold text-secondary">{weeklyStats.averageProtein}g</div><div className="text-sm text-text-subtle-light">Avg Protein</div></div>
        <div className="bg-white dark:bg-[#1C2C1F] rounded-xl p-4 text-center border"><div className="text-2xl font-bold text-accent">{weeklyStats.daysTracked}</div><div className="text-sm text-text-subtle-light">Days Tracked</div></div>
        <div className="bg-white dark:bg-[#1C2C1F] rounded-xl p-4 text-center border"><div className="text-2xl font-bold">{weeklyStats.goalsMet}/{weeklyStats.daysTracked}</div><div className="text-sm text-text-subtle-light">Goals Met</div></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#1C2C1F] rounded-xl p-6 border"><h3 className="font-semibold mb-4">Daily Calories</h3><BarChart data={periodData} metric="calories" color="bg-primary" /></div>
        <div className="bg-white dark:bg-[#1C2C1F] rounded-xl p-6 border"><h3 className="font-semibold mb-4">Daily Protein</h3><BarChart data={periodData} metric="protein" color="bg-secondary" /></div>
      </div>
    </div>
  );
};

export default ProgressDashboard;
