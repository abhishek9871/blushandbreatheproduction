import React, { useState, useEffect } from 'react';

interface DailyData {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  goalCalories: number;
  goalProtein: number;
  goalCarbs: number;
  goalFats: number;
}

interface WeeklyStats {
  averageCalories: number;
  averageProtein: number;
  averageCarbs: number;
  averageFats: number;
  daysTracked: number;
  goalsMet: number;
}

const STORAGE_KEY = 'nutrition_progress_history';

const ProgressDashboard: React.FC = () => {
  const [progressData, setProgressData] = useState<DailyData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('7d');
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({
    averageCalories: 0,
    averageProtein: 0,
    averageCarbs: 0,
    averageFats: 0,
    daysTracked: 0,
    goalsMet: 0
  });

  // Load progress data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setProgressData(parsed);
      calculateWeeklyStats(parsed);
    } else {
      // Generate sample data for demonstration
      const sampleData = generateSampleData();
      setProgressData(sampleData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleData));
      calculateWeeklyStats(sampleData);
    }
  }, []);

  // Calculate weekly statistics
  const calculateWeeklyStats = (data: DailyData[]) => {
    const last7Days = data.slice(-7);
    if (last7Days.length === 0) return;

    const stats = last7Days.reduce((acc, day) => ({
      totalCalories: acc.totalCalories + day.calories,
      totalProtein: acc.totalProtein + day.protein,
      totalCarbs: acc.totalCarbs + day.carbs,
      totalFats: acc.totalFats + day.fats,
      daysTracked: acc.daysTracked + 1,
      goalsMet: acc.goalsMet + (day.calories >= day.goalCalories ? 1 : 0)
    }), {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFats: 0,
      daysTracked: 0,
      goalsMet: 0
    });

    setWeeklyStats({
      averageCalories: Math.round(stats.totalCalories / stats.daysTracked),
      averageProtein: Math.round(stats.totalProtein / stats.daysTracked),
      averageCarbs: Math.round(stats.totalCarbs / stats.daysTracked),
      averageFats: Math.round(stats.totalFats / stats.daysTracked),
      daysTracked: stats.daysTracked,
      goalsMet: stats.goalsMet
    });
  };

  // Generate sample data for demonstration
  const generateSampleData = (): DailyData[] => {
    const data: DailyData[] = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      data.push({
        date: date.toISOString().split('T')[0],
        calories: Math.floor(Math.random() * 800) + 1200, // 1200-2000
        protein: Math.floor(Math.random() * 60) + 90, // 90-150g
        carbs: Math.floor(Math.random() * 100) + 150, // 150-250g
        fats: Math.floor(Math.random() * 30) + 40, // 40-70g
        goalCalories: 2000,
        goalProtein: 150,
        goalCarbs: 250,
        goalFats: 67
      });
    }

    return data;
  };

  // Get data for selected period
  const getPeriodData = () => {
    const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;
    return progressData.slice(-days);
  };

  // Simple bar chart component
  const BarChart: React.FC<{ data: DailyData[]; metric: keyof DailyData; color: string }> = ({ data, metric, color }) => {
    const maxValue = Math.max(...data.map(d => d[metric] as number));

    return (
      <div className="flex items-end gap-1 h-32">
        {data.map((day, index) => {
          const value = day[metric] as number;
          const percentage = (value / maxValue) * 100;
          const isToday = day.date === new Date().toISOString().split('T')[0];

          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-full rounded-t ${color} transition-all duration-300 hover:opacity-80`}
                style={{ height: `${percentage}%`, minHeight: '4px' }}
              />
              <div className={`text-xs ${isToday ? 'text-accent font-bold' : 'text-text-subtle-light dark:text-text-subtle-dark'}`}>
                {new Date(day.date).getDate()}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Achievement badge component
  const AchievementBadge: React.FC<{ title: string; description: string; earned: boolean }> = ({ title, description, earned }) => (
    <div className={`p-4 rounded-lg border-2 ${earned ? 'border-accent bg-accent/10' : 'border-border-light dark:border-border-dark bg-white dark:bg-[#1C2C1F] opacity-50'}`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${earned ? 'bg-accent text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'}`}>
          <span className="material-symbols-outlined text-lg">
            {earned ? 'check_circle' : 'radio_button_unchecked'}
          </span>
        </div>
        <div>
          <h4 className={`font-semibold ${earned ? 'text-text-light dark:text-text-dark' : 'text-text-subtle-light dark:text-text-subtle-dark'}`}>
            {title}
          </h4>
          <p className={`text-sm ${earned ? 'text-text-subtle-light dark:text-text-subtle-dark' : 'text-text-subtle-light dark:text-text-subtle-dark'}`}>
            {description}
          </p>
        </div>
      </div>
    </div>
  );

  const periodData = getPeriodData();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-text-light dark:text-text-dark mb-2">
          Progress Dashboard
        </h2>
        <p className="text-text-subtle-light dark:text-text-subtle-dark">
          Track your nutrition journey and celebrate your achievements
        </p>
      </div>

      {/* Period Selector */}
      <div className="flex justify-center">
        <div className="flex bg-background-light dark:bg-background-dark rounded-lg p-1 border border-border-light dark:border-border-dark">
          {[
            { key: '7d' as const, label: '7 Days' },
            { key: '30d' as const, label: '30 Days' },
            { key: '90d' as const, label: '90 Days' }
          ].map(period => (
            <button
              key={period.key}
              onClick={() => setSelectedPeriod(period.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedPeriod === period.key
                  ? 'bg-accent text-text-light'
                  : 'text-text-subtle-light dark:text-text-subtle-dark hover:text-text-light dark:hover:text-text-dark'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Weekly Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1C2C1F] rounded-xl p-6 shadow-sm border border-border-light dark:border-border-dark text-center">
          <div className="text-2xl font-bold text-primary mb-1">
            {weeklyStats.averageCalories}
          </div>
          <div className="text-sm text-text-subtle-light dark:text-text-subtle-dark">
            Avg Calories
          </div>
        </div>
        <div className="bg-white dark:bg-[#1C2C1F] rounded-xl p-6 shadow-sm border border-border-light dark:border-border-dark text-center">
          <div className="text-2xl font-bold text-secondary mb-1">
            {weeklyStats.averageProtein}g
          </div>
          <div className="text-sm text-text-subtle-light dark:text-text-subtle-dark">
            Avg Protein
          </div>
        </div>
        <div className="bg-white dark:bg-[#1C2C1F] rounded-xl p-6 shadow-sm border border-border-light dark:border-border-dark text-center">
          <div className="text-2xl font-bold text-accent mb-1">
            {weeklyStats.daysTracked}
          </div>
          <div className="text-sm text-text-subtle-light dark:text-text-subtle-dark">
            Days Tracked
          </div>
        </div>
        <div className="bg-white dark:bg-[#1C2C1F] rounded-xl p-6 shadow-sm border border-border-light dark:border-border-dark text-center">
          <div className="text-2xl font-bold text-primary mb-1">
            {weeklyStats.goalsMet}/{weeklyStats.daysTracked}
          </div>
          <div className="text-sm text-text-subtle-light dark:text-text-subtle-dark">
            Goals Met
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Calories Chart */}
        <div className="bg-white dark:bg-[#1C2C1F] rounded-xl p-6 shadow-sm border border-border-light dark:border-border-dark">
          <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-4">
            Daily Calories
          </h3>
          <BarChart data={periodData} metric="calories" color="bg-primary" />
          <div className="mt-4 flex justify-between text-sm text-text-subtle-light dark:text-text-subtle-dark">
            <span>Goal: {periodData[0]?.goalCalories || 2000} kcal</span>
            <span>Avg: {Math.round(periodData.reduce((sum, d) => sum + d.calories, 0) / periodData.length)} kcal</span>
          </div>
        </div>

        {/* Protein Chart */}
        <div className="bg-white dark:bg-[#1C2C1F] rounded-xl p-6 shadow-sm border border-border-light dark:border-border-dark">
          <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-4">
            Daily Protein
          </h3>
          <BarChart data={periodData} metric="protein" color="bg-secondary" />
          <div className="mt-4 flex justify-between text-sm text-text-subtle-light dark:text-text-subtle-dark">
            <span>Goal: {periodData[0]?.goalProtein || 150}g</span>
            <span>Avg: {Math.round(periodData.reduce((sum, d) => sum + d.protein, 0) / periodData.length)}g</span>
          </div>
        </div>

        {/* Carbs Chart */}
        <div className="bg-white dark:bg-[#1C2C1F] rounded-xl p-6 shadow-sm border border-border-light dark:border-border-dark">
          <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-4">
            Daily Carbohydrates
          </h3>
          <BarChart data={periodData} metric="carbs" color="bg-accent" />
          <div className="mt-4 flex justify-between text-sm text-text-subtle-light dark:text-text-subtle-dark">
            <span>Goal: {periodData[0]?.goalCarbs || 250}g</span>
            <span>Avg: {Math.round(periodData.reduce((sum, d) => sum + d.carbs, 0) / periodData.length)}g</span>
          </div>
        </div>

        {/* Fats Chart */}
        <div className="bg-white dark:bg-[#1C2C1F] rounded-xl p-6 shadow-sm border border-border-light dark:border-border-dark">
          <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-4">
            Daily Fats
          </h3>
          <BarChart data={periodData} metric="fats" color="bg-primary" />
          <div className="mt-4 flex justify-between text-sm text-text-subtle-light dark:text-text-subtle-dark">
            <span>Goal: {periodData[0]?.goalFats || 67}g</span>
            <span>Avg: {Math.round(periodData.reduce((sum, d) => sum + d.fats, 0) / periodData.length)}g</span>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-white dark:bg-[#1C2C1F] rounded-xl p-6 shadow-sm border border-border-light dark:border-border-dark">
        <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-6">
          Achievements 🏆
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AchievementBadge
            title="First Week"
            description="Tracked nutrition for 7 consecutive days"
            earned={weeklyStats.daysTracked >= 7}
          />
          <AchievementBadge
            title="Goal Crusher"
            description="Met your calorie goal 5 days this week"
            earned={weeklyStats.goalsMet >= 5}
          />
          <AchievementBadge
            title="Protein Champion"
            description="Averaged 150g+ protein per day this week"
            earned={weeklyStats.averageProtein >= 150}
          />
          <AchievementBadge
            title="Consistent Tracker"
            description="Logged nutrition data for 30 days"
            earned={progressData.length >= 30}
          />
        </div>
      </div>

      {/* Insights */}
      <div className="bg-gradient-to-r from-primary/10 via-secondary/5 to-accent/10 rounded-xl p-6 border border-border-light dark:border-border-dark">
        <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-4">
          Nutrition Insights 💡
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-text-light dark:text-text-dark mb-2">Weekly Trends</h4>
            <ul className="space-y-1 text-sm text-text-subtle-light dark:text-text-subtle-dark">
              <li>• Your protein intake has {weeklyStats.averageProtein > 140 ? 'been excellent' : 'room for improvement'}</li>
              <li>• {weeklyStats.goalsMet >= weeklyStats.daysTracked * 0.7 ? 'Great job meeting your goals!' : 'Keep pushing toward your targets'}</li>
              <li>• Average daily calories: {weeklyStats.averageCalories} kcal</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-text-light dark:text-text-dark mb-2">Recommendations</h4>
            <ul className="space-y-1 text-sm text-text-subtle-light dark:text-text-subtle-dark">
              <li>• {weeklyStats.averageProtein < 120 ? 'Try adding more protein sources like chicken, fish, or legumes' : 'Your protein intake looks balanced'}</li>
              <li>• {weeklyStats.averageCarbs > 300 ? 'Consider balancing carb intake with more vegetables' : 'Good carb distribution'}</li>
              <li>• Track consistently to see better long-term trends</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressDashboard;
