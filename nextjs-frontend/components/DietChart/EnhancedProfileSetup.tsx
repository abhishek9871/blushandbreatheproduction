'use client';

import React, { useState } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';

interface EnhancedProfileSetupProps {
  onComplete: (formData: any) => void;
  isCalculating: boolean;
}

const EnhancedProfileSetup: React.FC<EnhancedProfileSetupProps> = ({ onComplete, isCalculating }) => {
  const { profile, updateProfile } = useUserProfile();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const [formData, setFormData] = useState({
    // Physical metrics
    weight: profile.weight || '',
    height: profile.height || '',
    age: profile.age || '',
    gender: profile.gender || '',
    targetWeight: profile.targetWeight || '',
    
    // Goals & Activity
    primaryGoal: profile.primaryGoal || '',
    activityLevel: profile.activityLevel || '',
    
    // Preferences
    dietaryRestrictions: profile.dietaryRestrictions || [],
    allergies: profile.allergies || [],
    cuisinePreferences: profile.cuisinePreferences || [],
    mealsPerDay: profile.mealsPerDay || 4,
    cookingTime: profile.cookingTime || 'moderate',
    healthConditions: profile.healthConditions || []
  });

  const goals = [
    { id: 'weight_loss', label: 'Lose Weight', icon: 'trending_down', description: 'Healthy weight loss (-0.5 kg/week)' },
    { id: 'aggressive_weight_loss', label: 'Fast Weight Loss', icon: 'speed', description: 'Aggressive loss (-0.75 kg/week)' },
    { id: 'muscle_gain', label: 'Build Muscle', icon: 'fitness_center', description: 'Lean muscle gain (+0.25 kg/week)' },
    { id: 'bulk', label: 'Bulk Up', icon: 'trending_up', description: 'Maximum muscle (+0.5 kg/week)' },
    { id: 'maintenance', label: 'Maintain Weight', icon: 'balance', description: 'Keep current weight' },
    { id: 'health', label: 'General Health', icon: 'health_and_safety', description: 'Optimize overall wellness' }
  ];

  const activityLevels = [
    { id: 'sedentary', label: 'Sedentary', icon: 'chair', description: 'Desk job, minimal exercise' },
    { id: 'light', label: 'Lightly Active', icon: 'directions_walk', description: '1-3 days/week exercise' },
    { id: 'moderate', label: 'Moderately Active', icon: 'directions_run', description: '3-5 days/week exercise' },
    { id: 'active', label: 'Very Active', icon: 'sports_martial_arts', description: '6-7 days/week exercise' },
    { id: 'very_active', label: 'Extremely Active', icon: 'sports_gymnastics', description: 'Athlete/Physical job' }
  ];

  const dietaryOptions = [
    { id: 'vegetarian', label: 'Vegetarian', icon: 'eco' },
    { id: 'vegan', label: 'Vegan', icon: 'grass' },
    { id: 'eggetarian', label: 'Eggetarian', icon: 'egg' },
    { id: 'non_vegetarian', label: 'Non-Vegetarian', icon: 'restaurant' },
    { id: 'pescatarian', label: 'Pescatarian', icon: 'set_meal' },
    { id: 'gluten_free', label: 'Gluten-Free', icon: 'no_meals' },
    { id: 'dairy_free', label: 'Dairy-Free', icon: 'block' },
    { id: 'low_carb', label: 'Low Carb', icon: 'remove_circle_outline' },
    { id: 'keto', label: 'Ketogenic', icon: 'local_fire_department' }
  ];

  const allergyOptions = [
    { id: 'nuts', label: 'Nuts' },
    { id: 'peanuts', label: 'Peanuts' },
    { id: 'shellfish', label: 'Shellfish' },
    { id: 'fish', label: 'Fish' },
    { id: 'eggs', label: 'Eggs' },
    { id: 'milk', label: 'Milk/Dairy' },
    { id: 'soy', label: 'Soy' },
    { id: 'wheat', label: 'Wheat' },
    { id: 'sesame', label: 'Sesame' }
  ];

  const cuisineOptions = [
    { id: 'indian', label: 'Indian' },
    { id: 'south_indian', label: 'South Indian' },
    { id: 'north_indian', label: 'North Indian' },
    { id: 'mediterranean', label: 'Mediterranean' },
    { id: 'asian', label: 'Asian' },
    { id: 'western', label: 'Western' },
    { id: 'mexican', label: 'Mexican' },
    { id: 'middle_eastern', label: 'Middle Eastern' }
  ];

  const healthConditionOptions = [
    { id: 'diabetes', label: 'Diabetes' },
    { id: 'hypertension', label: 'Hypertension' },
    { id: 'high_cholesterol', label: 'High Cholesterol' },
    { id: 'pcos', label: 'PCOS' },
    { id: 'thyroid', label: 'Thyroid Issues' },
    { id: 'ibs', label: 'IBS' }
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMultiSelect = (field: string, value: string) => {
    const current = formData[field as keyof typeof formData] as string[];
    const newValues = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    setFormData(prev => ({ ...prev, [field]: newValues }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.weight && formData.height && formData.age && formData.gender;
      case 2:
        return formData.primaryGoal && formData.activityLevel;
      case 3:
        return true; // Optional
      case 4:
        return true; // Optional
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // Prepare profile data
      const profileData = {
        ...formData,
        weight: Number(formData.weight),
        height: Number(formData.height),
        age: Number(formData.age),
        targetWeight: formData.targetWeight ? Number(formData.targetWeight) : undefined,
        isSetup: true
      };
      // Save profile
      updateProfile(profileData as any);
      // Pass data to parent for immediate use
      onComplete(profileData);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-accent">monitoring</span>
              </div>
              <h2 className="text-2xl font-bold text-text-light dark:text-text-dark">Your Body Metrics</h2>
              <p className="text-text-subtle-light dark:text-text-subtle-dark">We need this to calculate your personalized nutrition targets</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-text-light dark:text-text-dark">Weight (kg) *</label>
                <input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  placeholder="e.g., 70"
                  min="20"
                  max="300"
                  className="w-full px-4 py-3 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-background-dark focus:ring-2 focus:ring-accent focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-text-light dark:text-text-dark">Height (cm) *</label>
                <input
                  type="number"
                  value={formData.height}
                  onChange={(e) => handleInputChange('height', e.target.value)}
                  placeholder="e.g., 170"
                  min="100"
                  max="250"
                  className="w-full px-4 py-3 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-background-dark focus:ring-2 focus:ring-accent focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-text-light dark:text-text-dark">Age (years) *</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  placeholder="e.g., 25"
                  min="13"
                  max="100"
                  className="w-full px-4 py-3 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-background-dark focus:ring-2 focus:ring-accent focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-text-light dark:text-text-dark">Gender *</label>
                <div className="flex space-x-3">
                  {['male', 'female'].map((g) => (
                    <button
                      key={g}
                      onClick={() => handleInputChange('gender', g)}
                      className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all capitalize ${
                        formData.gender === g
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-border-light dark:border-border-dark hover:border-accent/50 text-text-light dark:text-text-dark'
                      }`}
                    >
                      <span className="material-symbols-outlined mr-2 align-middle">
                        {g === 'male' ? 'male' : 'female'}
                      </span>
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2 text-text-light dark:text-text-dark">Target Weight (kg) - Optional</label>
                <input
                  type="number"
                  value={formData.targetWeight}
                  onChange={(e) => handleInputChange('targetWeight', e.target.value)}
                  placeholder="Your goal weight (optional)"
                  min="20"
                  max="300"
                  className="w-full px-4 py-3 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-background-dark focus:ring-2 focus:ring-accent focus:border-transparent"
                />
                <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark mt-1">
                  We'll estimate how long it will take to reach your goal
                </p>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-accent">flag</span>
              </div>
              <h2 className="text-2xl font-bold text-text-light dark:text-text-dark">Your Goal & Activity</h2>
              <p className="text-text-subtle-light dark:text-text-subtle-dark">This determines your calorie and macro targets</p>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-3 text-text-light dark:text-text-dark">Primary Goal *</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {goals.map((goal) => (
                    <button
                      key={goal.id}
                      onClick={() => handleInputChange('primaryGoal', goal.id)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        formData.primaryGoal === goal.id
                          ? 'border-accent bg-accent/10 shadow-lg'
                          : 'border-border-light dark:border-border-dark hover:border-accent/50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          formData.primaryGoal === goal.id ? 'bg-accent text-white' : 'bg-accent/10 text-accent'
                        }`}>
                          <span className="material-symbols-outlined">{goal.icon}</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-text-light dark:text-text-dark">{goal.label}</h4>
                          <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark">{goal.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3 text-text-light dark:text-text-dark">Activity Level *</h3>
                <div className="space-y-2">
                  {activityLevels.map((level) => (
                    <button
                      key={level.id}
                      onClick={() => handleInputChange('activityLevel', level.id)}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                        formData.activityLevel === level.id
                          ? 'border-accent bg-accent/10 shadow-lg'
                          : 'border-border-light dark:border-border-dark hover:border-accent/50'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          formData.activityLevel === level.id ? 'bg-accent text-white' : 'bg-accent/10 text-accent'
                        }`}>
                          <span className="material-symbols-outlined">{level.icon}</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-text-light dark:text-text-dark">{level.label}</h4>
                          <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark">{level.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-accent">restaurant</span>
              </div>
              <h2 className="text-2xl font-bold text-text-light dark:text-text-dark">Dietary Preferences</h2>
              <p className="text-text-subtle-light dark:text-text-subtle-dark">Help us create meals you'll enjoy (optional)</p>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-3 text-text-light dark:text-text-dark">Diet Type</h3>
                <div className="flex flex-wrap gap-2">
                  {dietaryOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleMultiSelect('dietaryRestrictions', option.id)}
                      className={`px-4 py-2 rounded-full border-2 transition-all flex items-center space-x-2 ${
                        (formData.dietaryRestrictions as string[]).includes(option.id)
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-border-light dark:border-border-dark hover:border-accent/50 text-text-light dark:text-text-dark'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">{option.icon}</span>
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3 text-text-light dark:text-text-dark">Allergies</h3>
                <div className="flex flex-wrap gap-2">
                  {allergyOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleMultiSelect('allergies', option.id)}
                      className={`px-4 py-2 rounded-full border-2 transition-all ${
                        (formData.allergies as string[]).includes(option.id)
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                          : 'border-border-light dark:border-border-dark hover:border-red-300 text-text-light dark:text-text-dark'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3 text-text-light dark:text-text-dark">Cuisine Preferences</h3>
                <div className="flex flex-wrap gap-2">
                  {cuisineOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleMultiSelect('cuisinePreferences', option.id)}
                      className={`px-4 py-2 rounded-full border-2 transition-all ${
                        (formData.cuisinePreferences as string[]).includes(option.id)
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-border-light dark:border-border-dark hover:border-accent/50 text-text-light dark:text-text-dark'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-accent">tune</span>
              </div>
              <h2 className="text-2xl font-bold text-text-light dark:text-text-dark">Final Preferences</h2>
              <p className="text-text-subtle-light dark:text-text-subtle-dark">Fine-tune your meal plan (optional)</p>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-3 text-text-light dark:text-text-dark">Meals Per Day</h3>
                <div className="grid grid-cols-4 gap-2 sm:gap-3">
                  {[3, 4, 5, 6].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleInputChange('mealsPerDay', num)}
                      className={`py-2 sm:py-4 rounded-xl border-2 transition-all ${
                        formData.mealsPerDay === num
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-border-light dark:border-border-dark hover:border-accent/50 text-text-light dark:text-text-dark'
                      }`}
                    >
                      <div className="text-xl sm:text-2xl font-bold text-text-light dark:text-text-dark">{num}</div>
                      <div className="text-[10px] sm:text-xs text-text-subtle-light dark:text-text-subtle-dark">
                        {num === 3 ? '3 main meals' : `${num} meals`}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3 text-text-light dark:text-text-dark">Cooking Time</h3>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {[
                    { id: 'minimal', label: 'Quick', desc: '<15 min', icon: 'bolt' },
                    { id: 'moderate', label: 'Moderate', desc: '15-30 min', icon: 'schedule' },
                    { id: 'flexible', label: 'Flexible', desc: 'Any duration', icon: 'timer' }
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleInputChange('cookingTime', option.id)}
                      className={`p-2 sm:p-4 rounded-xl border-2 transition-all text-center ${
                        formData.cookingTime === option.id
                          ? 'border-accent bg-accent/10'
                          : 'border-border-light dark:border-border-dark hover:border-accent/50 text-text-light dark:text-text-dark'
                      }`}
                    >
                      <span className={`material-symbols-outlined text-xl sm:text-2xl mb-1 ${
                        formData.cookingTime === option.id ? 'text-accent' : ''
                      }`}>{option.icon}</span>
                      <div className="font-medium text-xs sm:text-base text-text-light dark:text-text-dark">{option.label}</div>
                      <div className="text-[10px] sm:text-xs text-text-subtle-light dark:text-text-subtle-dark">{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3 text-text-light dark:text-text-dark">Health Conditions (if any)</h3>
                <div className="flex flex-wrap gap-2">
                  {healthConditionOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleMultiSelect('healthConditions', option.id)}
                      className={`px-4 py-2 rounded-full border-2 transition-all ${
                        (formData.healthConditions as string[]).includes(option.id)
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                          : 'border-border-light dark:border-border-dark hover:border-amber-300 text-text-light dark:text-text-dark'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark mt-2">
                  Note: This is for general guidance. Always consult your doctor for medical advice.
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-card-dark rounded-xl p-6 shadow-sm border border-border-light dark:border-border-dark">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-text-light dark:text-text-dark">Step {currentStep} of {totalSteps}</span>
          <span className="text-sm text-text-subtle-light dark:text-text-subtle-dark">
            {Math.round((currentStep / totalSteps) * 100)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-accent h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="mb-6">
        {renderStep()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t border-border-light dark:border-border-dark gap-3">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 1}
          className={`px-4 md:px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-1 md:space-x-2 ${
            currentStep === 1
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
              : 'bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark border border-border-light dark:border-border-dark hover:bg-accent/10'
          }`}
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          <span>Previous</span>
        </button>

        <button
          onClick={handleNext}
          disabled={!canProceed() || isCalculating}
          className={`px-4 md:px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-1 md:space-x-2 ${
            canProceed() && !isCalculating
              ? 'bg-accent text-white hover:opacity-90'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isCalculating ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span className="hidden sm:inline">Calculating...</span>
            </>
          ) : (
            <>
              <span className="hidden sm:inline">{currentStep === totalSteps ? 'Calculate My Targets' : 'Next'}</span>
              <span className="sm:hidden">{currentStep === totalSteps ? 'Calculate' : 'Next'}</span>
              <span className="material-symbols-outlined text-sm">
                {currentStep === totalSteps ? 'calculate' : 'arrow_forward'}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default EnhancedProfileSetup;
