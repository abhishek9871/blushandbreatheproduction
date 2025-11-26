'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { NutritionInfo, EnhancedUserProfile, DietPlan, NutritionTargets } from '@/types';

export interface UserProfile extends EnhancedUserProfile {
  // For backwards compatibility
  macroPreferences?: {
    protein: number;
    carbs: number;
    fats: number;
  };
}

export interface Recommendation {
  id: string;
  type: 'smart_swap' | 'fill_gap' | 'goal_booster' | 'meal_idea' | 'snack_smart';
  title: string;
  description: string;
  icon: string;
  food?: NutritionInfo;
  alternativeFood?: NutritionInfo;
  reasoning: string;
  priority: 'high' | 'medium' | 'low';
}

interface UserProfileContextType {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  resetProfile: () => void;
  getRecommendations: (availableFoods: NutritionInfo[], currentSelections?: NutritionInfo[]) => Recommendation[];
  isProfileComplete: boolean;
  isPhysicalDataComplete: boolean;
  calculateNutritionTargets: (overrideProfile?: Partial<UserProfile>) => Promise<NutritionTargets | null>;
  generateDietPlan: (duration?: 'day' | 'week') => Promise<DietPlan | null>;
  regenerateMeal: (dayIndex: number, mealType: string, currentMeal?: any) => Promise<any>;
  dietPlan: DietPlan | null;
  isGeneratingPlan: boolean;
  dietPlanError: string | null;
}

const defaultProfile: UserProfile = {
  isSetup: false,
  primaryGoal: '',
  dietaryRestrictions: [],
  activityLevel: '',
  preferredMealTypes: [],
  healthConditions: [],
  allergies: [],
  cuisinePreferences: [],
  mealsPerDay: 4,
  cookingTime: 'moderate',
  budget: 'moderate',
};

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
};

interface UserProfileProviderProps {
  children: ReactNode;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://jyotilalchandani-backend.sparshrajput088.workers.dev';

export const UserProfileProvider: React.FC<UserProfileProviderProps> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [mounted, setMounted] = useState(false);
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [dietPlanError, setDietPlanError] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem('nutrition_user_profile_v2');
      if (stored) {
        const parsed = JSON.parse(stored);
        setProfile({ ...defaultProfile, ...parsed });
      }
      // Also load cached diet plan
      const storedPlan = localStorage.getItem('nutrition_diet_plan');
      if (storedPlan) {
        const parsedPlan = JSON.parse(storedPlan);
        // Check if plan is still valid
        if (parsedPlan.validUntil && new Date(parsedPlan.validUntil) > new Date()) {
          setDietPlan(parsedPlan);
        }
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  }, []);

  // Save to localStorage whenever profile changes
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem('nutrition_user_profile_v2', JSON.stringify(profile));
    } catch (error) {
      console.error('Failed to save user profile:', error);
    }
  }, [profile, mounted]);

  // Save diet plan to localStorage
  useEffect(() => {
    if (!mounted || !dietPlan) return;
    try {
      localStorage.setItem('nutrition_diet_plan', JSON.stringify(dietPlan));
    } catch (error) {
      console.error('Failed to save diet plan:', error);
    }
  }, [dietPlan, mounted]);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile(prev => ({
      ...prev,
      ...updates,
      setupDate: updates.isSetup ? new Date().toISOString() : prev.setupDate
    }));
  };

  const resetProfile = () => {
    setProfile(defaultProfile);
    setDietPlan(null);
    setDietPlanError(null);
    try {
      localStorage.removeItem('nutrition_user_profile_v2');
      localStorage.removeItem('nutrition_diet_plan');
    } catch (error) {
      console.error('Failed to clear user profile:', error);
    }
  };

  const isProfileComplete = profile.isSetup && 
    profile.primaryGoal !== '' && 
    profile.activityLevel !== '';

  const isPhysicalDataComplete = !!(
    profile.weight && 
    profile.height && 
    profile.age && 
    profile.gender
  );

  // Calculate nutrition targets from API
  const calculateNutritionTargets = async (overrideProfile?: Partial<UserProfile>): Promise<NutritionTargets | null> => {
    // Merge override with current profile
    const mergedProfile = { ...profile, ...overrideProfile };
    
    const hasPhysicalData = !!(
      mergedProfile.weight && 
      mergedProfile.height && 
      mergedProfile.age && 
      mergedProfile.gender
    );
    
    if (!hasPhysicalData) {
      console.error('Physical data incomplete', { mergedProfile });
      return null;
    }

    try {
      const response = await fetch(`${API_BASE}/api/nutrition/calculate-targets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weight: mergedProfile.weight,
          height: mergedProfile.height,
          age: mergedProfile.age,
          gender: mergedProfile.gender,
          activityLevel: mergedProfile.activityLevel,
          primaryGoal: mergedProfile.primaryGoal,
          targetWeight: mergedProfile.targetWeight
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to calculate targets');
      }

      const targets: NutritionTargets = await response.json();
      
      // Update profile with calculated values
      updateProfile({
        bmr: targets.bmr,
        tdee: targets.tdee,
        dailyCalorieTarget: targets.dailyCalorieTarget,
        macroTargets: targets.macroTargets,
        macroPercentages: targets.macroPercentages,
        bmi: targets.bmi,
        bmiCategory: targets.bmiCategory,
        idealWeightRange: targets.idealWeightRange,
        weeklyWeightChange: targets.weeklyWeightChange,
        weeksToGoal: targets.weeksToGoal,
        hydrationGoal: targets.hydrationGoal,
        calculatedAt: targets.calculatedAt
      });

      return targets;
    } catch (error) {
      console.error('Error calculating nutrition targets:', error);
      return null;
    }
  };

  // Generate AI diet plan
  const generateDietPlan = async (duration: 'day' | 'week' = 'week'): Promise<DietPlan | null> => {
    if (!profile.dailyCalorieTarget || !profile.macroTargets) {
      setDietPlanError('Please calculate your nutrition targets first');
      return null;
    }

    setIsGeneratingPlan(true);
    setDietPlanError(null);

    try {
      // Use Vercel API route for AI generation (60s timeout vs Cloudflare's 10ms CPU limit)
      const response = await fetch('/api/nutrition/generate-diet-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userProfile: {
            weight: profile.weight,
            height: profile.height,
            age: profile.age,
            gender: profile.gender,
            activityLevel: profile.activityLevel,
            primaryGoal: profile.primaryGoal,
            dietaryRestrictions: profile.dietaryRestrictions,
            allergies: profile.allergies,
            cuisinePreferences: profile.cuisinePreferences,
            mealsPerDay: profile.mealsPerDay,
            cookingTime: profile.cookingTime,
            dailyCalorieTarget: profile.dailyCalorieTarget,
            macroTargets: profile.macroTargets
          },
          duration
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate diet plan');
      }

      const plan: DietPlan = await response.json();
      setDietPlan(plan);
      return plan;
    } catch (error: any) {
      console.error('Error generating diet plan:', error);
      setDietPlanError(error.message || 'Failed to generate diet plan');
      return null;
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // Regenerate a specific meal
  const regenerateMeal = async (dayIndex: number, mealType: string, currentMeal?: any): Promise<any> => {
    try {
      // Use Vercel API route for AI regeneration
      const response = await fetch('/api/nutrition/regenerate-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userProfile: {
            dailyCalorieTarget: profile.dailyCalorieTarget,
            macroTargets: profile.macroTargets,
            dietaryRestrictions: profile.dietaryRestrictions,
            allergies: profile.allergies,
            cuisinePreferences: profile.cuisinePreferences
          },
          dayIndex,
          mealType,
          currentMeal
        })
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate meal');
      }

      const result = await response.json();
      
      // Update the diet plan with the new meal
      if (dietPlan && result.meal) {
        const updatedPlan = { ...dietPlan };
        const dayPlan = updatedPlan.weeklyPlan[dayIndex];
        if (dayPlan) {
          const mealIndex = dayPlan.meals.findIndex(m => m.type === mealType);
          if (mealIndex >= 0) {
            dayPlan.meals[mealIndex] = result.meal;
            // Recalculate daily totals
            dayPlan.dailyTotals = {
              calories: dayPlan.meals.reduce((sum, m) => sum + m.totalCalories, 0),
              protein: dayPlan.meals.reduce((sum, m) => sum + m.macros.protein, 0),
              carbs: dayPlan.meals.reduce((sum, m) => sum + m.macros.carbs, 0),
              fats: dayPlan.meals.reduce((sum, m) => sum + m.macros.fats, 0)
            };
            setDietPlan(updatedPlan);
          }
        }
      }

      return result.meal;
    } catch (error) {
      console.error('Error regenerating meal:', error);
      return null;
    }
  };

  const getRecommendations = (availableFoods: NutritionInfo[], currentSelections: NutritionInfo[] = []): Recommendation[] => {
    if (!isProfileComplete || availableFoods.length === 0) {
      return [];
    }

    const recommendations: Recommendation[] = [];
    let recId = 1;

    if (profile.primaryGoal === 'weight_loss' || profile.primaryGoal === 'aggressive_weight_loss') {
      const highProteinFoods = availableFoods
        .filter(food => food.nutrients.protein > 15)
        .slice(0, 2);
      
      highProteinFoods.forEach(food => {
        recommendations.push({
          id: `rec-${recId++}`,
          type: 'goal_booster',
          title: `Boost Weight Loss with ${food.name}`,
          description: `High protein (${food.nutrients.protein}g) helps maintain muscle during weight loss`,
          icon: 'fitness_center',
          food,
          reasoning: 'High protein content supports lean muscle maintenance during caloric deficit',
          priority: 'high'
        });
      });
    }

    if (profile.primaryGoal === 'muscle_gain' || profile.primaryGoal === 'bulk') {
      const proteinRichFoods = availableFoods
        .filter(food => food.nutrients.protein > 20)
        .slice(0, 2);
      
      proteinRichFoods.forEach(food => {
        recommendations.push({
          id: `rec-${recId++}`,
          type: 'goal_booster',
          title: `Build Muscle with ${food.name}`,
          description: `Excellent protein source (${food.nutrients.protein}g) for muscle growth`,
          icon: 'fitness_center',
          food,
          reasoning: 'High protein content supports muscle protein synthesis',
          priority: 'high'
        });
      });
    }

    if (profile.primaryGoal === 'health' || profile.primaryGoal === 'maintenance') {
      const balancedFoods = availableFoods
        .filter(food => 
          food.nutrients.protein > 5 && 
          food.nutrients.carbs > 5 && 
          food.nutrients.fats > 2 &&
          food.nutrients.fats < 15
        )
        .slice(0, 2);
      
      balancedFoods.forEach(food => {
        recommendations.push({
          id: `rec-${recId++}`,
          type: 'goal_booster',
          title: `Nutritional Balance with ${food.name}`,
          description: 'Well-balanced macronutrients support overall health',
          icon: 'health_and_safety',
          food,
          reasoning: 'Balanced macronutrient profile supports optimal health',
          priority: 'high'
        });
      });
    }

    return recommendations.slice(0, 6);
  };

  const value: UserProfileContextType = {
    profile,
    updateProfile,
    resetProfile,
    getRecommendations,
    isProfileComplete,
    isPhysicalDataComplete,
    calculateNutritionTargets,
    generateDietPlan,
    regenerateMeal,
    dietPlan,
    isGeneratingPlan,
    dietPlanError
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
};
