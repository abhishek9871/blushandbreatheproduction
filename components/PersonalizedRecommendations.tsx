'use client';

import React from 'react';
import { DietChartGenerator } from './DietChart';

interface PersonalizedRecommendationsProps { 
  availableFoods?: any[]; 
  currentSelections?: any[]; 
}

const PersonalizedRecommendations: React.FC<PersonalizedRecommendationsProps> = () => {
  return <DietChartGenerator />;
};

export default PersonalizedRecommendations;
