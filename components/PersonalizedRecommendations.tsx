import React, { useState, useEffect } from 'react';
import { useUserProfile, Recommendation } from '../hooks/useUserProfile';
import { useComparison } from '../hooks/useComparison';
import { NutritionInfo } from '../types';
import ProfileSetup from './ProfileSetup';

interface PersonalizedRecommendationsProps {
  availableFoods: NutritionInfo[];
  currentSelections?: NutritionInfo[];
}

const PersonalizedRecommendations: React.FC<PersonalizedRecommendationsProps> = ({
  availableFoods,
  currentSelections = []
}) => {
  const { profile, getRecommendations, isProfileComplete, resetProfile } = useUserProfile();
  const [showSetup, setShowSetup] = useState(!profile.isSetup);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [expandedRec, setExpandedRec] = useState<string | null>(null);

  // Use comparison context if available for "Add to Compare" functionality
  let comparisonContext;
  try {
    comparisonContext = useComparison();
  } catch {
    // Not within ComparisonProvider, that's okay
    comparisonContext = null;
  }

  // Update recommendations when data changes
  useEffect(() => {
    if (isProfileComplete && availableFoods.length > 0) {
      const newRecommendations = getRecommendations(availableFoods, currentSelections);
      setRecommendations(newRecommendations);
    }
  }, [isProfileComplete, availableFoods, currentSelections, getRecommendations]);

  const handleSetupComplete = () => {
    setShowSetup(false);
  };

  const handleResetProfile = () => {
    resetProfile();
    setShowSetup(true);
    setRecommendations([]);
  };

  const getRecommendationIcon = (type: Recommendation['type']) => {
    switch (type) {
      case 'smart_swap': return 'swap_horiz';
      case 'fill_gap': return 'add_circle';
      case 'goal_booster': return 'trending_up';
      case 'meal_idea': return 'restaurant_menu';
      case 'snack_smart': return 'cookie';
      default: return 'lightbulb';
    }
  };

  const getRecommendationColor = (type: Recommendation['type']) => {
    switch (type) {
      case 'smart_swap': return 'text-blue-600 dark:text-blue-400';
      case 'fill_gap': return 'text-green-600 dark:text-green-400';
      case 'goal_booster': return 'text-accent';
      case 'meal_idea': return 'text-purple-600 dark:text-purple-400';
      case 'snack_smart': return 'text-orange-600 dark:text-orange-400';
      default: return 'text-accent';
    }
  };

  const getPriorityBadgeColor = (priority: Recommendation['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'low': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      default: return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200';
    }
  };

  if (showSetup) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-accent">person_add</span>
          </div>
          <h2 className="text-2xl font-bold text-text-light dark:text-text-dark mb-2">
            Personalize Your Experience
          </h2>
          <p className="text-text-subtle-light dark:text-text-subtle-dark mb-8">
            Tell us about your goals and preferences to get tailored nutrition recommendations
          </p>
        </div>
        <ProfileSetup onComplete={handleSetupComplete} />
      </div>
    );
  }

  if (!isProfileComplete) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
          <span className="material-symbols-outlined text-3xl text-orange-600 dark:text-orange-400">warning</span>
        </div>
        <h3 className="text-xl font-semibold text-text-light dark:text-text-dark mb-2">
          Incomplete Profile
        </h3>
        <p className="text-text-subtle-light dark:text-text-subtle-dark mb-4">
          Complete your profile setup to receive personalized recommendations
        </p>
        <button
          onClick={() => setShowSetup(true)}
          className="px-6 py-3 bg-accent text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          Complete Setup
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-text-light dark:text-text-dark mb-2">
            Your Personalized Recommendations
          </h2>
          <p className="text-text-subtle-light dark:text-text-subtle-dark">
            Based on your goal: <span className="font-medium capitalize">{profile.primaryGoal?.replace('_', ' ')}</span> | 
            Activity: <span className="font-medium capitalize">{profile.activityLevel}</span>
          </p>
        </div>
        <button
          onClick={handleResetProfile}
          className="px-4 py-2 text-sm text-text-subtle-light dark:text-text-subtle-dark hover:text-accent transition-colors flex items-center space-x-1"
        >
          <span className="material-symbols-outlined text-sm">settings</span>
          <span>Update Profile</span>
        </button>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 ? (
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="bg-white dark:bg-background-dark rounded-xl border border-border-light dark:border-border-dark p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0`}>
                    <span className={`material-symbols-outlined text-xl ${getRecommendationColor(rec.type)}`}>
                      {getRecommendationIcon(rec.type)}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-text-light dark:text-text-dark">
                        {rec.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadgeColor(rec.priority)}`}>
                        {rec.priority}
                      </span>
                    </div>
                    
                    <p className="text-text-subtle-light dark:text-text-subtle-dark mb-3">
                      {rec.description}
                    </p>

                    {/* Food Information */}
                    {rec.food && (
                      <div className="flex items-center space-x-4 p-3 bg-accent/5 rounded-lg mb-3">
                        <img
                          src={rec.food.imageUrl}
                          alt={rec.food.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-text-light dark:text-text-dark">
                            {rec.food.name}
                          </h4>
                          <div className="text-sm text-text-subtle-light dark:text-text-subtle-dark">
                            Protein: {rec.food.nutrients.protein}g | 
                            Carbs: {rec.food.nutrients.carbs}g | 
                            Fats: {rec.food.nutrients.fats}g
                          </div>
                        </div>
                        {comparisonContext && (
                          <button
                            onClick={() => comparisonContext.addToComparison(rec.food!)}
                            disabled={!comparisonContext.canAddMore || comparisonContext.isInComparison(rec.food.id)}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                              comparisonContext.isInComparison(rec.food.id)
                                ? 'bg-accent/20 text-accent'
                                : comparisonContext.canAddMore
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            {comparisonContext.isInComparison(rec.food.id) ? 'Added' : 'Compare'}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Expandable reasoning */}
                    <button
                      onClick={() => setExpandedRec(expandedRec === rec.id ? null : rec.id)}
                      className="text-sm text-accent hover:underline flex items-center space-x-1"
                    >
                      <span>Why this recommendation?</span>
                      <span className="material-symbols-outlined text-sm">
                        {expandedRec === rec.id ? 'expand_less' : 'expand_more'}
                      </span>
                    </button>

                    {expandedRec === rec.id && (
                      <div className="mt-3 p-3 bg-background-light dark:bg-background-dark rounded-lg">
                        <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark">
                          {rec.reasoning}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-accent">auto_awesome</span>
          </div>
          <h3 className="text-xl font-semibold text-text-light dark:text-text-dark mb-2">
            Looking for Perfect Matches
          </h3>
          <p className="text-text-subtle-light dark:text-text-subtle-dark">
            We're analyzing the available foods to find the best recommendations for your goals. 
            Try exploring more foods or check back after adding some items to your meal plan.
          </p>
        </div>
      )}

      {/* Profile Summary */}
      <div className="bg-accent/5 rounded-xl p-6 mt-8">
        <h3 className="font-semibold text-text-light dark:text-text-dark mb-4">Your Profile Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-text-light dark:text-text-dark">Primary Goal:</span>
            <span className="ml-2 text-text-subtle-light dark:text-text-subtle-dark capitalize">
              {profile.primaryGoal?.replace('_', ' ')}
            </span>
          </div>
          <div>
            <span className="font-medium text-text-light dark:text-text-dark">Activity Level:</span>
            <span className="ml-2 text-text-subtle-light dark:text-text-subtle-dark capitalize">
              {profile.activityLevel}
            </span>
          </div>
          {profile.dietaryRestrictions.length > 0 && (
            <div>
              <span className="font-medium text-text-light dark:text-text-dark">Dietary Preferences:</span>
              <span className="ml-2 text-text-subtle-light dark:text-text-subtle-dark">
                {profile.dietaryRestrictions.map(r => r.replace('_', ' ')).join(', ')}
              </span>
            </div>
          )}
          {profile.preferredMealTypes.length > 0 && (
            <div>
              <span className="font-medium text-text-light dark:text-text-dark">Meal Interests:</span>
              <span className="ml-2 text-text-subtle-light dark:text-text-subtle-dark">
                {profile.preferredMealTypes.map(m => m.replace('_', ' ')).join(', ')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonalizedRecommendations;
