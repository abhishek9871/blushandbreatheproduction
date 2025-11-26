'use client';

import React, { useState, useEffect } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import EnhancedProfileSetup from './EnhancedProfileSetup';
import NutritionTargetsDisplay from './NutritionTargetsDisplay';
import WeeklyPlanView from './WeeklyPlanView';
import ShoppingList from './ShoppingList';

type DietChartStep = 'profile' | 'targets' | 'plan';

const DietChartGenerator: React.FC = () => {
  const { 
    profile, 
    isPhysicalDataComplete, 
    dietPlan, 
    isGeneratingPlan, 
    dietPlanError,
    generateDietPlan,
    calculateNutritionTargets
  } = useUserProfile();
  
  const [currentStep, setCurrentStep] = useState<DietChartStep>('profile');
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeTab, setActiveTab] = useState<'plan' | 'shopping'>('plan');

  // Determine initial step based on profile state
  useEffect(() => {
    if (dietPlan) {
      setCurrentStep('plan');
    } else if (profile.dailyCalorieTarget && profile.macroTargets) {
      setCurrentStep('targets');
    } else if (isPhysicalDataComplete && profile.primaryGoal && profile.activityLevel) {
      setCurrentStep('targets');
    }
  }, [profile, dietPlan, isPhysicalDataComplete]);

  const handleProfileComplete = async (formData: any) => {
    setIsCalculating(true);
    try {
      // Pass form data directly to avoid state timing issues
      const targets = await calculateNutritionTargets(formData);
      if (targets) {
        setCurrentStep('targets');
      }
    } finally {
      setIsCalculating(false);
    }
  };

  const handleGeneratePlan = async () => {
    const plan = await generateDietPlan('week');
    if (plan) {
      setCurrentStep('plan');
    }
  };

  const handleRegeneratePlan = async () => {
    await generateDietPlan('week');
  };

  const handleBackToProfile = () => {
    setCurrentStep('profile');
  };

  const handleBackToTargets = () => {
    setCurrentStep('targets');
  };

  // Step indicator
  const steps = [
    { id: 'profile', label: 'Your Profile', icon: 'person' },
    { id: 'targets', label: 'Nutrition Targets', icon: 'calculate' },
    { id: 'plan', label: 'Diet Plan', icon: 'restaurant_menu' }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="bg-white dark:bg-card-dark rounded-xl p-3 sm:p-4 shadow-sm border border-border-light dark:border-border-dark">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div 
                className={`flex items-center space-x-1 sm:space-x-2 cursor-pointer transition-colors ${
                  index <= currentStepIndex 
                    ? 'text-accent' 
                    : 'text-text-subtle-light dark:text-text-subtle-dark'
                }`}
                onClick={() => {
                  if (index < currentStepIndex) {
                    setCurrentStep(step.id as DietChartStep);
                  }
                }}
              >
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 ${
                  index < currentStepIndex 
                    ? 'bg-accent text-white' 
                    : index === currentStepIndex 
                    ? 'bg-accent/20 text-accent border-2 border-accent'
                    : 'bg-gray-100 dark:bg-gray-800'
                }`}>
                  {index < currentStepIndex ? (
                    <span className="material-symbols-outlined text-base sm:text-lg">check</span>
                  ) : (
                    <span className="material-symbols-outlined text-base sm:text-lg">{step.icon}</span>
                  )}
                </div>
                <span className="hidden sm:inline font-medium">{step.label}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-2 sm:mx-4 rounded ${
                  index < currentStepIndex ? 'bg-accent' : 'bg-gray-200 dark:bg-gray-700'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {currentStep === 'profile' && (
          <EnhancedProfileSetup 
            onComplete={handleProfileComplete} 
            isCalculating={isCalculating}
          />
        )}

        {currentStep === 'targets' && (
          <NutritionTargetsDisplay 
            onGeneratePlan={handleGeneratePlan}
            onBack={handleBackToProfile}
            isGenerating={isGeneratingPlan}
            error={dietPlanError}
          />
        )}

        {currentStep === 'plan' && dietPlan && (
          <div className="space-y-4">
            {/* Tabs */}
            <div className="flex space-x-2 border-b border-border-light dark:border-border-dark">
              <button
                onClick={() => setActiveTab('plan')}
                className={`px-4 py-2 font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === 'plan'
                    ? 'border-accent text-accent'
                    : 'border-transparent text-text-subtle-light dark:text-text-subtle-dark hover:text-accent'
                }`}
              >
                <span className="material-symbols-outlined text-sm mr-1 align-middle">calendar_month</span>
                Weekly Plan
              </button>
              <button
                onClick={() => setActiveTab('shopping')}
                className={`px-4 py-2 font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === 'shopping'
                    ? 'border-accent text-accent'
                    : 'border-transparent text-text-subtle-light dark:text-text-subtle-dark hover:text-accent'
                }`}
              >
                <span className="material-symbols-outlined text-sm mr-1 align-middle">shopping_cart</span>
                Shopping List
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'plan' && (
              <WeeklyPlanView 
                dietPlan={dietPlan} 
                onRegenerate={handleRegeneratePlan}
                onBack={handleBackToTargets}
                isRegenerating={isGeneratingPlan}
              />
            )}

            {activeTab === 'shopping' && (
              <ShoppingList shoppingList={dietPlan.shoppingList} />
            )}
          </div>
        )}

        {currentStep === 'plan' && !dietPlan && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-orange-600 dark:text-orange-400">error</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">No Diet Plan Found</h3>
            <p className="text-text-subtle-light dark:text-text-subtle-dark mb-4">
              {dietPlanError || 'Something went wrong. Please try generating a new plan.'}
            </p>
            <button
              onClick={handleBackToTargets}
              className="px-6 py-3 bg-accent text-white rounded-lg hover:opacity-90"
            >
              Go Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DietChartGenerator;
