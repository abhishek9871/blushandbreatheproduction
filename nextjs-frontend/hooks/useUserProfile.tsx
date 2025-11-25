'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { NutritionInfo } from '@/types';

export interface UserProfile {
  isSetup: boolean;
  primaryGoal: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'health' | '';
  dietaryRestrictions: string[];
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | '';
  preferredMealTypes: string[];
  dailyCalorieTarget?: number;
  macroPreferences?: {
    protein: number;
    carbs: number;
    fats: number;
  };
  setupDate?: string;
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
}

const defaultProfile: UserProfile = {
  isSetup: false,
  primaryGoal: '',
  dietaryRestrictions: [],
  activityLevel: '',
  preferredMealTypes: [],
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

export const UserProfileProvider: React.FC<UserProfileProviderProps> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem('nutrition_user_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        setProfile({ ...defaultProfile, ...parsed });
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  }, []);

  // Save to localStorage whenever profile changes
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem('nutrition_user_profile', JSON.stringify(profile));
    } catch (error) {
      console.error('Failed to save user profile:', error);
    }
  }, [profile, mounted]);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile(prev => ({
      ...prev,
      ...updates,
      setupDate: updates.isSetup ? new Date().toISOString() : prev.setupDate
    }));
  };

  const resetProfile = () => {
    setProfile(defaultProfile);
    try {
      localStorage.removeItem('nutrition_user_profile');
    } catch (error) {
      console.error('Failed to clear user profile:', error);
    }
  };

  const isProfileComplete = profile.isSetup && 
    profile.primaryGoal !== '' && 
    profile.activityLevel !== '';

  const getRecommendations = (availableFoods: NutritionInfo[], currentSelections: NutritionInfo[] = []): Recommendation[] => {
    if (!isProfileComplete || availableFoods.length === 0) {
      return [];
    }

    const recommendations: Recommendation[] = [];
    let recId = 1;

    if (profile.primaryGoal === 'weight_loss') {
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

    if (profile.primaryGoal === 'muscle_gain') {
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

    if (profile.primaryGoal === 'health') {
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
    isProfileComplete
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
};
