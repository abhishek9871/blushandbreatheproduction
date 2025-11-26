'use client';

import React from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';

interface NutritionTargetsDisplayProps {
  onGeneratePlan: () => void;
  onBack: () => void;
  isGenerating: boolean;
  error: string | null;
}

const NutritionTargetsDisplay: React.FC<NutritionTargetsDisplayProps> = ({
  onGeneratePlan,
  onBack,
  isGenerating,
  error
}) => {
  const { profile } = useUserProfile();

  const getBmiColor = (category: string) => {
    switch (category) {
      case 'Underweight': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
      case 'Normal': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'Overweight': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      case 'Obese': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getGoalIcon = (goal: string) => {
    switch (goal) {
      case 'weight_loss': return 'trending_down';
      case 'aggressive_weight_loss': return 'speed';
      case 'muscle_gain': return 'fitness_center';
      case 'bulk': return 'trending_up';
      case 'maintenance': return 'balance';
      case 'health': return 'health_and_safety';
      default: return 'flag';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-accent/10 to-accent/5 rounded-2xl p-6 text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-accent/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-accent">analytics</span>
        </div>
        <h2 className="text-2xl font-bold text-text-light dark:text-text-dark mb-2">
          Your Personalized Nutrition Blueprint
        </h2>
        <p className="text-text-subtle-light dark:text-text-subtle-dark">
          Based on your profile, here's your optimal nutrition plan
        </p>
      </div>

      {/* BMI Card */}
      <div className="bg-white dark:bg-card-dark rounded-xl p-6 shadow-sm border border-border-light dark:border-border-dark">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Body Mass Index (BMI)</h3>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getBmiColor(profile.bmiCategory || '')}`}>
            {profile.bmiCategory}
          </span>
        </div>
        <div className="flex items-end space-x-4">
          <div className="text-5xl font-bold text-accent">{profile.bmi}</div>
          <div className="text-text-subtle-light dark:text-text-subtle-dark pb-2">
            <p>Ideal weight range: {profile.idealWeightRange?.min} - {profile.idealWeightRange?.max} kg</p>
            <p>Current weight: {profile.weight} kg</p>
          </div>
        </div>
        {/* BMI Scale */}
        <div className="mt-4">
          <div className="flex h-3 rounded-full overflow-hidden">
            <div className="bg-blue-400 flex-1"></div>
            <div className="bg-green-400 flex-1"></div>
            <div className="bg-yellow-400 flex-1"></div>
            <div className="bg-red-400 flex-1"></div>
          </div>
          <div className="flex justify-between text-xs mt-1 text-text-subtle-light dark:text-text-subtle-dark">
            <span>Underweight</span>
            <span>Normal</span>
            <span>Overweight</span>
            <span>Obese</span>
          </div>
        </div>
      </div>

      {/* Calorie Targets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-card-dark rounded-xl p-6 shadow-sm border border-border-light dark:border-border-dark">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-600">local_fire_department</span>
            </div>
            <div>
              <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark">BMR</p>
              <p className="text-2xl font-bold">{profile.bmr} <span className="text-sm font-normal">kcal</span></p>
            </div>
          </div>
          <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark">
            Calories burned at complete rest
          </p>
        </div>

        <div className="bg-white dark:bg-card-dark rounded-xl p-6 shadow-sm border border-border-light dark:border-border-dark">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-orange-600">whatshot</span>
            </div>
            <div>
              <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark">TDEE</p>
              <p className="text-2xl font-bold">{profile.tdee} <span className="text-sm font-normal">kcal</span></p>
            </div>
          </div>
          <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark">
            Total daily energy expenditure
          </p>
        </div>

        <div className="bg-gradient-to-br from-accent to-accent/80 text-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <span className="material-symbols-outlined">{getGoalIcon(profile.primaryGoal || '')}</span>
            </div>
            <div>
              <p className="text-sm opacity-80">Daily Target</p>
              <p className="text-2xl font-bold">{profile.dailyCalorieTarget} <span className="text-sm font-normal">kcal</span></p>
            </div>
          </div>
          <p className="text-xs opacity-80">
            Optimized for {profile.primaryGoal?.replace(/_/g, ' ')}
          </p>
        </div>
      </div>

      {/* Macro Targets */}
      <div className="bg-white dark:bg-card-dark rounded-xl p-6 shadow-sm border border-border-light dark:border-border-dark">
        <h3 className="font-semibold text-lg mb-4">Daily Macro Targets</h3>
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="relative w-24 h-24 mx-auto mb-3">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="48" cy="48" r="42"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-gray-200 dark:text-gray-700"
                />
                <circle
                  cx="48" cy="48" r="42"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${(profile.macroPercentages?.protein || 0) * 2.64} 264`}
                  className="text-red-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">{profile.macroPercentages?.protein}%</span>
              </div>
            </div>
            <div className="font-semibold text-red-600">Protein</div>
            <div className="text-2xl font-bold">{profile.macroTargets?.protein}g</div>
          </div>

          <div className="text-center">
            <div className="relative w-24 h-24 mx-auto mb-3">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="48" cy="48" r="42"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-gray-200 dark:text-gray-700"
                />
                <circle
                  cx="48" cy="48" r="42"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${(profile.macroPercentages?.carbs || 0) * 2.64} 264`}
                  className="text-yellow-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">{profile.macroPercentages?.carbs}%</span>
              </div>
            </div>
            <div className="font-semibold text-yellow-600">Carbs</div>
            <div className="text-2xl font-bold">{profile.macroTargets?.carbs}g</div>
          </div>

          <div className="text-center">
            <div className="relative w-24 h-24 mx-auto mb-3">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="48" cy="48" r="42"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-gray-200 dark:text-gray-700"
                />
                <circle
                  cx="48" cy="48" r="42"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${(profile.macroPercentages?.fats || 0) * 2.64} 264`}
                  className="text-blue-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">{profile.macroPercentages?.fats}%</span>
              </div>
            </div>
            <div className="font-semibold text-blue-600">Fats</div>
            <div className="text-2xl font-bold">{profile.macroTargets?.fats}g</div>
          </div>
        </div>
      </div>

      {/* Progress Estimate */}
      {profile.weeksToGoal && profile.weeklyWeightChange && (
        <div className="bg-accent/5 rounded-xl p-6 border border-accent/20">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl text-accent">timeline</span>
            </div>
            <div>
              <h3 className="font-semibold text-lg">Goal Timeline</h3>
              <p className="text-text-subtle-light dark:text-text-subtle-dark">
                At {Math.abs(profile.weeklyWeightChange)} kg/week, you could reach your goal in approximately{' '}
                <span className="font-bold text-accent">{profile.weeksToGoal} weeks</span>
                {profile.weeksToGoal > 4 && ` (~${Math.round(profile.weeksToGoal / 4)} months)`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hydration */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 flex items-center space-x-4">
        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
          <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">water_drop</span>
        </div>
        <div>
          <p className="font-medium">Daily Hydration Goal</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {((profile.hydrationGoal || 0) / 1000).toFixed(1)}L
            <span className="text-sm font-normal text-text-subtle-light dark:text-text-subtle-dark ml-2">
              ({profile.hydrationGoal}ml)
            </span>
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl p-4 flex items-center space-x-3">
          <span className="material-symbols-outlined">error</span>
          <p>{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-lg font-medium border border-border-light dark:border-border-dark hover:bg-accent/10 flex items-center space-x-2"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          <span>Update Profile</span>
        </button>

        <button
          onClick={onGeneratePlan}
          disabled={isGenerating}
          className={`px-8 py-3 rounded-lg font-medium flex items-center space-x-2 ${
            isGenerating
              ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
              : 'bg-accent text-white hover:opacity-90'
          }`}
        >
          {isGenerating ? (
            <>
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>Generating Your Plan...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined">auto_awesome</span>
              <span>Generate AI Diet Plan</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default NutritionTargetsDisplay;
