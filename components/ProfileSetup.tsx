import React, { useState } from 'react';
import { useUserProfile } from '../hooks/useUserProfile';

interface ProfileSetupProps {
  onComplete: () => void;
}

const ProfileSetup: React.FC<ProfileSetupProps> = ({ onComplete }) => {
  const { profile, updateProfile } = useUserProfile();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    primaryGoal: profile.primaryGoal || '',
    activityLevel: profile.activityLevel || '',
    dietaryRestrictions: profile.dietaryRestrictions || [],
    preferredMealTypes: profile.preferredMealTypes || [],
  });

  const totalSteps = 4;

  const goals = [
    { id: 'weight_loss', label: 'Weight Loss', icon: 'trending_down', description: 'Reduce body weight and body fat' },
    { id: 'muscle_gain', label: 'Muscle Gain', icon: 'fitness_center', description: 'Build lean muscle mass' },
    { id: 'maintenance', label: 'Maintenance', icon: 'balance', description: 'Maintain current weight and health' },
    { id: 'health', label: 'General Health', icon: 'health_and_safety', description: 'Improve overall wellness' },
  ];

  const activityLevels = [
    { id: 'sedentary', label: 'Sedentary', icon: 'chair', description: 'Minimal physical activity' },
    { id: 'light', label: 'Light Activity', icon: 'directions_walk', description: 'Light exercise 1-3 days/week' },
    { id: 'moderate', label: 'Moderate Activity', icon: 'directions_run', description: 'Moderate exercise 3-5 days/week' },
    { id: 'active', label: 'Very Active', icon: 'sports_gymnastics', description: 'Heavy exercise 6-7 days/week' },
  ];

  const dietaryOptions = [
    { id: 'vegetarian', label: 'Vegetarian', icon: 'eco' },
    { id: 'vegan', label: 'Vegan', icon: 'grass' },
    { id: 'gluten_free', label: 'Gluten-Free', icon: 'no_meals' },
    { id: 'dairy_free', label: 'Dairy-Free', icon: 'block' },
    { id: 'low_carb', label: 'Low Carb', icon: 'remove_circle_outline' },
    { id: 'keto', label: 'Ketogenic', icon: 'local_fire_department' },
  ];

  const mealTypes = [
    { id: 'breakfast', label: 'Breakfast', icon: 'wb_sunny' },
    { id: 'lunch', label: 'Lunch', icon: 'lunch_dining' },
    { id: 'dinner', label: 'Dinner', icon: 'dinner_dining' },
    { id: 'snacks', label: 'Snacks', icon: 'cookie' },
    { id: 'pre_workout', label: 'Pre-Workout', icon: 'fitness_center' },
    { id: 'post_workout', label: 'Post-Workout', icon: 'sports_gymnastics' },
  ];

  const handleSelectionChange = (field: string, value: any, isMultiple = false) => {
    if (isMultiple) {
      const currentValues = formData[field as keyof typeof formData] as string[];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(item => item !== value)
        : [...currentValues, value];
      setFormData(prev => ({ ...prev, [field]: newValues }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete setup
      updateProfile({
        ...formData,
        isSetup: true,
        setupDate: new Date().toISOString()
      });
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return formData.primaryGoal !== '';
      case 2: return formData.activityLevel !== '';
      case 3: return true; // Dietary restrictions are optional
      case 4: return true; // Preferred meals are optional
      default: return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-text-light dark:text-text-dark mb-2">
                What's Your Primary Goal?
              </h2>
              <p className="text-text-subtle-light dark:text-text-subtle-dark">
                This helps us personalize your nutrition recommendations
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {goals.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => handleSelectionChange('primaryGoal', goal.id)}
                  className={`p-6 rounded-xl border-2 transition-all text-left ${
                    formData.primaryGoal === goal.id
                      ? 'border-accent bg-accent/10 shadow-lg'
                      : 'border-border-light dark:border-border-dark hover:border-accent/50 hover:bg-accent/5'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      formData.primaryGoal === goal.id 
                        ? 'bg-accent text-white' 
                        : 'bg-accent/10 text-accent'
                    }`}>
                      <span className="material-symbols-outlined text-xl">{goal.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-light dark:text-text-dark">{goal.label}</h3>
                      <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark">{goal.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-text-light dark:text-text-dark mb-2">
                How Active Are You?
              </h2>
              <p className="text-text-subtle-light dark:text-text-subtle-dark">
                Your activity level affects your nutritional needs
              </p>
            </div>
            <div className="space-y-3">
              {activityLevels.map((level) => (
                <button
                  key={level.id}
                  onClick={() => handleSelectionChange('activityLevel', level.id)}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    formData.activityLevel === level.id
                      ? 'border-accent bg-accent/10 shadow-lg'
                      : 'border-border-light dark:border-border-dark hover:border-accent/50 hover:bg-accent/5'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      formData.activityLevel === level.id 
                        ? 'bg-accent text-white' 
                        : 'bg-accent/10 text-accent'
                    }`}>
                      <span className="material-symbols-outlined text-lg">{level.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-light dark:text-text-dark">{level.label}</h3>
                      <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark">{level.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-text-light dark:text-text-dark mb-2">
                Any Dietary Preferences?
              </h2>
              <p className="text-text-subtle-light dark:text-text-subtle-dark">
                Select any that apply (optional)
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {dietaryOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleSelectionChange('dietaryRestrictions', option.id, true)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.dietaryRestrictions.includes(option.id)
                      ? 'border-accent bg-accent/10 shadow-lg'
                      : 'border-border-light dark:border-border-dark hover:border-accent/50 hover:bg-accent/5'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      formData.dietaryRestrictions.includes(option.id)
                        ? 'bg-accent text-white' 
                        : 'bg-accent/10 text-accent'
                    }`}>
                      <span className="material-symbols-outlined text-sm">{option.icon}</span>
                    </div>
                    <span className="text-sm font-medium text-text-light dark:text-text-dark text-center">
                      {option.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-text-light dark:text-text-dark mb-2">
                What Meals Interest You Most?
              </h2>
              <p className="text-text-subtle-light dark:text-text-subtle-dark">
                Help us focus our recommendations (optional)
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {mealTypes.map((meal) => (
                <button
                  key={meal.id}
                  onClick={() => handleSelectionChange('preferredMealTypes', meal.id, true)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.preferredMealTypes.includes(meal.id)
                      ? 'border-accent bg-accent/10 shadow-lg'
                      : 'border-border-light dark:border-border-dark hover:border-accent/50 hover:bg-accent/5'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      formData.preferredMealTypes.includes(meal.id)
                        ? 'bg-accent text-white' 
                        : 'bg-accent/10 text-accent'
                    }`}>
                      <span className="material-symbols-outlined text-sm">{meal.icon}</span>
                    </div>
                    <span className="text-sm font-medium text-text-light dark:text-text-dark text-center">
                      {meal.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-text-light dark:text-text-dark">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-sm text-text-subtle-light dark:text-text-subtle-dark">
            {Math.round((currentStep / totalSteps) * 100)}% Complete
          </span>
        </div>
        <div className="w-full bg-border-light dark:bg-border-dark rounded-full h-2">
          <div 
            className="bg-accent h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="mb-8">
        {renderStep()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 1}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            currentStep === 1
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
              : 'bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark border border-border-light dark:border-border-dark hover:bg-accent/10'
          }`}
        >
          Previous
        </button>

        <button
          onClick={handleNext}
          disabled={!canProceed()}
          className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
            canProceed()
              ? 'bg-accent text-white hover:opacity-90'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
          }`}
        >
          <span>{currentStep === totalSteps ? 'Complete Setup' : 'Next'}</span>
          {currentStep < totalSteps && (
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default ProfileSetup;
