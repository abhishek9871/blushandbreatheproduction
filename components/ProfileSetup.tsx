'use client';

import React, { useState } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';

interface ProfileSetupProps { onComplete: () => void; }

const ProfileSetup: React.FC<ProfileSetupProps> = ({ onComplete }) => {
  const { profile, updateProfile } = useUserProfile();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    primaryGoal: (profile.primaryGoal as string) || '',
    activityLevel: (profile.activityLevel as string) || '',
    dietaryRestrictions: profile.dietaryRestrictions || [],
    preferredMealTypes: profile.preferredMealTypes || [],
  });

  const totalSteps = 4;
  const goals = [
    { id: 'weight_loss', label: 'Weight Loss', icon: 'trending_down', description: 'Reduce body weight' },
    { id: 'muscle_gain', label: 'Muscle Gain', icon: 'fitness_center', description: 'Build lean muscle' },
    { id: 'maintenance', label: 'Maintenance', icon: 'balance', description: 'Maintain current weight' },
    { id: 'health', label: 'General Health', icon: 'health_and_safety', description: 'Improve wellness' },
  ];
  const activityLevels = [
    { id: 'sedentary', label: 'Sedentary', icon: 'chair', description: 'Minimal activity' },
    { id: 'light', label: 'Light', icon: 'directions_walk', description: '1-3 days/week' },
    { id: 'moderate', label: 'Moderate', icon: 'directions_run', description: '3-5 days/week' },
    { id: 'active', label: 'Very Active', icon: 'sports_gymnastics', description: '6-7 days/week' },
  ];
  const dietaryOptions = [
    { id: 'vegetarian', label: 'Vegetarian', icon: 'eco' },
    { id: 'vegan', label: 'Vegan', icon: 'grass' },
    { id: 'gluten_free', label: 'Gluten-Free', icon: 'no_meals' },
    { id: 'low_carb', label: 'Low Carb', icon: 'remove_circle_outline' },
  ];
  const mealTypes = [
    { id: 'breakfast', label: 'Breakfast', icon: 'wb_sunny' },
    { id: 'lunch', label: 'Lunch', icon: 'lunch_dining' },
    { id: 'dinner', label: 'Dinner', icon: 'dinner_dining' },
    { id: 'snacks', label: 'Snacks', icon: 'cookie' },
  ];

  const handleSelect = (field: string, value: string, multi = false) => {
    if (multi) {
      const curr = formData[field as keyof typeof formData] as string[];
      const newVal = curr.includes(value) ? curr.filter(i => i !== value) : [...curr, value];
      setFormData(p => ({ ...p, [field]: newVal }));
    } else {
      setFormData(p => ({ ...p, [field]: value as typeof formData[keyof typeof formData] }));
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
    else { updateProfile({ ...formData, isSetup: true } as any); onComplete(); }
  };

  const canProceed = () => {
    if (currentStep === 1) return formData.primaryGoal !== '';
    if (currentStep === 2) return formData.activityLevel !== '';
    return true;
  };

  const renderStep = () => {
    const renderOptions = (items: {id: string; label: string; icon: string; description?: string}[], field: string, multi = false, selected: string | string[]) => (
      <div className={`grid ${multi ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2'} gap-3`}>
        {items.map(item => {
          const isSelected = multi ? (selected as string[]).includes(item.id) : selected === item.id;
          return (
            <button key={item.id} onClick={() => handleSelect(field, item.id, multi)} className={`p-4 rounded-xl border-2 text-left transition-all ${isSelected ? 'border-accent bg-accent/10' : 'border-border-light dark:border-border-dark hover:border-accent/50'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isSelected ? 'bg-accent text-white' : 'bg-accent/10 text-accent'}`}>
                  <span className="material-symbols-outlined">{item.icon}</span>
                </div>
                <div><h3 className="font-semibold">{item.label}</h3>{item.description && <p className="text-sm text-text-subtle-light">{item.description}</p>}</div>
              </div>
            </button>
          );
        })}
      </div>
    );

    const titles = ['What\'s Your Primary Goal?', 'How Active Are You?', 'Any Dietary Preferences?', 'What Meals Interest You?'];
    const data = [
      { items: goals, field: 'primaryGoal', multi: false, selected: formData.primaryGoal },
      { items: activityLevels, field: 'activityLevel', multi: false, selected: formData.activityLevel },
      { items: dietaryOptions, field: 'dietaryRestrictions', multi: true, selected: formData.dietaryRestrictions },
      { items: mealTypes, field: 'preferredMealTypes', multi: true, selected: formData.preferredMealTypes },
    ];
    const step = data[currentStep - 1];
    
    return (
      <div className="space-y-6">
        <div className="text-center"><h2 className="text-2xl font-bold mb-2">{titles[currentStep - 1]}</h2></div>
        {renderOptions(step.items, step.field, step.multi, step.selected)}
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between mb-2 text-sm"><span>Step {currentStep}/{totalSteps}</span><span>{Math.round((currentStep/totalSteps)*100)}%</span></div>
        <div className="w-full bg-border-light dark:bg-border-dark rounded-full h-2"><div className="bg-accent h-2 rounded-full transition-all" style={{width: `${(currentStep/totalSteps)*100}%`}}/></div>
      </div>
      <div className="mb-8">{renderStep()}</div>
      <div className="flex justify-between">
        <button onClick={() => currentStep > 1 && setCurrentStep(currentStep - 1)} disabled={currentStep === 1} className={`px-6 py-3 rounded-lg ${currentStep === 1 ? 'bg-gray-100 text-gray-400' : 'border hover:bg-accent/10'}`}>Previous</button>
        <button onClick={handleNext} disabled={!canProceed()} className={`px-6 py-3 rounded-lg ${canProceed() ? 'bg-accent text-white' : 'bg-gray-300 text-gray-500'}`}>{currentStep === totalSteps ? 'Complete' : 'Next'}</button>
      </div>
    </div>
  );
};

export default ProfileSetup;
