
import React from 'react';
import { useApi } from '../hooks/useApi';
// Fix: Corrected the import path from the empty mockApiService to the actual apiService.
import { getNutritionData } from '../services/apiService';
import NutritionCard from '../components/NutritionCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const NutritionPage: React.FC = () => {
  const { data: nutritionData, loading, error } = useApi(getNutritionData as any);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <div className="flex flex-wrap justify-between gap-3 pb-8">
        <h1 className="text-text-light dark:text-text-dark text-4xl md:text-5xl font-black leading-tight tracking-[-0.033em] min-w-72">Nutrition Guide</h1>
      </div>
      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}
      {nutritionData && (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 @container">
          {nutritionData.map(item => <NutritionCard key={item.id} item={item} />)}
        </div>
      )}
    </main>
  );
};

export default NutritionPage;
