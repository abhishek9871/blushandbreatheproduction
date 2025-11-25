'use client';

import React, { useState, useEffect } from 'react';
import { useUserProfile, type Recommendation } from '@/hooks/useUserProfile';
import type { NutritionInfo } from '@/types';
import ProfileSetup from './ProfileSetup';

interface PersonalizedRecommendationsProps { availableFoods: NutritionInfo[]; currentSelections?: NutritionInfo[]; }

const PersonalizedRecommendations: React.FC<PersonalizedRecommendationsProps> = ({ availableFoods, currentSelections = [] }) => {
  const { profile, getRecommendations, isProfileComplete, resetProfile } = useUserProfile();
  const [showSetup, setShowSetup] = useState(!profile.isSetup);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [expandedRec, setExpandedRec] = useState<string | null>(null);

  useEffect(() => {
    if (isProfileComplete && availableFoods.length > 0) {
      setRecommendations(getRecommendations(availableFoods, currentSelections));
    }
  }, [isProfileComplete, availableFoods, currentSelections, getRecommendations]);

  if (showSetup) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-accent">person_add</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Personalize Your Experience</h2>
          <p className="text-text-subtle-light mb-8">Tell us about your goals for tailored recommendations</p>
        </div>
        <ProfileSetup onComplete={() => setShowSetup(false)} />
      </div>
    );
  }

  if (!isProfileComplete) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 flex items-center justify-center">
          <span className="material-symbols-outlined text-3xl text-orange-600">warning</span>
        </div>
        <h3 className="text-xl font-semibold mb-2">Incomplete Profile</h3>
        <button onClick={() => setShowSetup(true)} className="px-6 py-3 bg-accent text-white rounded-lg">Complete Setup</button>
      </div>
    );
  }

  const getIcon = (type: string) => type === 'smart_swap' ? 'swap_horiz' : type === 'fill_gap' ? 'add_circle' : type === 'goal_booster' ? 'trending_up' : 'lightbulb';
  const getColor = (type: string) => type === 'smart_swap' ? 'text-blue-600' : type === 'goal_booster' ? 'text-accent' : 'text-green-600';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold mb-1">Your Personalized Recommendations</h2>
          <p className="text-text-subtle-light">Goal: <span className="font-medium capitalize">{profile.primaryGoal?.replace('_', ' ')}</span> | Activity: <span className="font-medium capitalize">{profile.activityLevel}</span></p>
        </div>
        <button onClick={() => { resetProfile(); setShowSetup(true); }} className="text-sm text-text-subtle-light hover:text-accent flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">settings</span>Update Profile
        </button>
      </div>

      {recommendations.length > 0 ? (
        <div className="space-y-4">
          {recommendations.map(rec => (
            <div key={rec.id} className="bg-white dark:bg-background-dark rounded-xl border p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <span className={`material-symbols-outlined text-xl ${getColor(rec.type)}`}>{getIcon(rec.type)}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{rec.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs ${rec.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{rec.priority}</span>
                  </div>
                  <p className="text-text-subtle-light mb-3">{rec.description}</p>
                  {rec.food && (
                    <div className="flex items-center gap-4 p-3 bg-accent/5 rounded-lg mb-3">
                      <img src={rec.food.imageUrl} alt={rec.food.name} className="w-12 h-12 rounded-lg object-cover" />
                      <div>
                        <h4 className="font-medium">{rec.food.name}</h4>
                        <div className="text-sm text-text-subtle-light">P: {rec.food.nutrients.protein}g | C: {rec.food.nutrients.carbs}g | F: {rec.food.nutrients.fats}g</div>
                      </div>
                    </div>
                  )}
                  <button onClick={() => setExpandedRec(expandedRec === rec.id ? null : rec.id)} className="text-sm text-accent hover:underline flex items-center gap-1">
                    <span>Why?</span><span className="material-symbols-outlined text-sm">{expandedRec === rec.id ? 'expand_less' : 'expand_more'}</span>
                  </button>
                  {expandedRec === rec.id && <div className="mt-3 p-3 bg-background-light dark:bg-background-dark rounded-lg text-sm text-text-subtle-light">{rec.reasoning}</div>}
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
          <h3 className="text-xl font-semibold mb-2">Looking for Perfect Matches</h3>
          <p className="text-text-subtle-light">Try exploring more foods to get recommendations.</p>
        </div>
      )}
    </div>
  );
};

export default PersonalizedRecommendations;
