import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { NutritionInfo } from '../types';

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
  const [profile, setProfile] = useState<UserProfile>(() => {
    // Load from localStorage on initialization
    try {
      const stored = localStorage.getItem('nutrition_user_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...defaultProfile, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
    return defaultProfile;
  });

  // Save to localStorage whenever profile changes
  useEffect(() => {
    try {
      localStorage.setItem('nutrition_user_profile', JSON.stringify(profile));
    } catch (error) {
      console.error('Failed to save user profile:', error);
    }
  }, [profile]);

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

  // Simple rule-based recommendation engine
  const getRecommendations = (availableFoods: NutritionInfo[], currentSelections: NutritionInfo[] = []): Recommendation[] => {
    if (!isProfileComplete || availableFoods.length === 0) {
      return [];
    }

    const recommendations: Recommendation[] = [];
    let recId = 1;

    // Goal-based recommendations
    if (profile.primaryGoal === 'weight_loss') {
      // Recommend high-protein, low-calorie foods
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

      // Smart swaps for weight loss
      const highCarbFoods = currentSelections.filter(food => food.nutrients.carbs > 25);
      if (highCarbFoods.length > 0) {
        const lowCarbAlternatives = availableFoods.filter(food => 
          food.nutrients.carbs < 15 && food.nutrients.protein > 10
        );
        
        if (lowCarbAlternatives.length > 0) {
          recommendations.push({
            id: `rec-${recId++}`,
            type: 'smart_swap',
            title: 'Smart Carb Swap',
            description: `Try ${lowCarbAlternatives[0].name} instead for fewer carbs`,
            icon: 'swap_horiz',
            food: lowCarbAlternatives[0],
            alternativeFood: highCarbFoods[0],
            reasoning: 'Lower carb alternatives can help with weight management',
            priority: 'medium'
          });
        }
      }
    }

    if (profile.primaryGoal === 'muscle_gain') {
      // Recommend high-protein foods
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

      // Recommend balanced carbs for energy
      const energyFoods = availableFoods
        .filter(food => food.nutrients.carbs > 20 && food.nutrients.carbs < 40)
        .slice(0, 1);
      
      if (energyFoods.length > 0) {
        recommendations.push({
          id: `rec-${recId++}`,
          type: 'meal_idea',
          title: 'Pre-Workout Energy',
          description: `${energyFoods[0].name} provides sustained energy for training`,
          icon: 'bolt',
          food: energyFoods[0],
          reasoning: 'Complex carbohydrates fuel intense workouts',
          priority: 'medium'
        });
      }
    }

    if (profile.primaryGoal === 'health') {
      // Recommend nutrient-dense foods
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

    // Activity level based recommendations
    if (profile.activityLevel === 'active') {
      const energyDenseFoods = availableFoods
        .filter(food => food.nutrients.carbs > 30)
        .slice(0, 1);
      
      if (energyDenseFoods.length > 0) {
        recommendations.push({
          id: `rec-${recId++}`,
          type: 'snack_smart',
          title: 'Active Lifestyle Fuel',
          description: `${energyDenseFoods[0].name} supports your active lifestyle`,
          icon: 'directions_run',
          food: energyDenseFoods[0],
          reasoning: 'Higher carbohydrate needs for active individuals',
          priority: 'medium'
        });
      }
    }

    // Dietary restriction filtering
    if (profile.dietaryRestrictions.includes('vegetarian')) {
      const plantBasedProteins = availableFoods
        .filter(food => 
          food.nutrients.protein > 10 &&
          !food.name.toLowerCase().includes('chicken') &&
          !food.name.toLowerCase().includes('beef') &&
          !food.name.toLowerCase().includes('fish')
        )
        .slice(0, 1);
      
      if (plantBasedProteins.length > 0) {
        recommendations.push({
          id: `rec-${recId++}`,
          type: 'fill_gap',
          title: 'Plant-Based Protein',
          description: `${plantBasedProteins[0].name} fits your vegetarian lifestyle`,
          icon: 'eco',
          food: plantBasedProteins[0],
          reasoning: 'Plant-based protein sources for vegetarian diet',
          priority: 'medium'
        });
      }
    }

    // Nutritional gap analysis
    if (currentSelections.length > 0) {
      const totalProtein = currentSelections.reduce((sum, food) => sum + food.nutrients.protein, 0);
      const avgProtein = totalProtein / currentSelections.length;
      
      if (avgProtein < 15) {
        const proteinRichOptions = availableFoods
          .filter(food => food.nutrients.protein > 20)
          .slice(0, 1);
        
        if (proteinRichOptions.length > 0) {
          recommendations.push({
            id: `rec-${recId++}`,
            type: 'fill_gap',
            title: 'Boost Your Protein',
            description: `Add ${proteinRichOptions[0].name} to increase your protein intake`,
            icon: 'add_circle',
            food: proteinRichOptions[0],
            reasoning: 'Current selections are low in protein',
            priority: 'high'
          });
        }
      }
    }

    // General healthy suggestions
    const fiberRichFoods = availableFoods
      .filter(food => food.nutrients.carbs > 15 && food.nutrients.fats < 10)
      .slice(0, 1);
    
    if (fiberRichFoods.length > 0 && recommendations.length < 5) {
      recommendations.push({
        id: `rec-${recId++}`,
        type: 'snack_smart',
        title: 'Smart Snacking',
        description: `${fiberRichFoods[0].name} makes a nutritious snack choice`,
        icon: 'lightbulb',
        food: fiberRichFoods[0],
        reasoning: 'High fiber content supports digestive health',
        priority: 'low'
      });
    }

    // Sort by priority and limit results
    return recommendations
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, 6); // Limit to 6 recommendations
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
