import React, { createContext, useContext, useState, ReactNode } from 'react';
import { NutritionInfo } from '../types';

interface ComparisonContextType {
  comparedFoods: NutritionInfo[];
  addToComparison: (food: NutritionInfo) => void;
  removeFromComparison: (foodId: string) => void;
  clearComparison: () => void;
  isInComparison: (foodId: string) => boolean;
  canAddMore: boolean;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

export const useComparison = () => {
  const context = useContext(ComparisonContext);
  if (!context) {
    throw new Error('useComparison must be used within a ComparisonProvider');
  }
  return context;
};

interface ComparisonProviderProps {
  children: ReactNode;
}

export const ComparisonProvider: React.FC<ComparisonProviderProps> = ({ children }) => {
  const [comparedFoods, setComparedFoods] = useState<NutritionInfo[]>([]);

  const addToComparison = (food: NutritionInfo) => {
    if (comparedFoods.length >= 3) return; // Max 3 foods
    if (comparedFoods.find(f => f.id === food.id)) return; // Avoid duplicates
    
    setComparedFoods([...comparedFoods, food]);
  };

  const removeFromComparison = (foodId: string) => {
    setComparedFoods(comparedFoods.filter(f => f.id !== foodId));
  };

  const clearComparison = () => {
    setComparedFoods([]);
  };

  const isInComparison = (foodId: string) => {
    return comparedFoods.some(f => f.id === foodId);
  };

  const canAddMore = comparedFoods.length < 3;

  const value: ComparisonContextType = {
    comparedFoods,
    addToComparison,
    removeFromComparison,
    clearComparison,
    isInComparison,
    canAddMore
  };

  return (
    <ComparisonContext.Provider value={value}>
      {children}
    </ComparisonContext.Provider>
  );
};
