import React from 'react';

interface NutrientInfo {
  title: string;
  description: string;
  benefits: string[];
  dailyValue: string;
  deficiencySymptoms: string[];
  richFoodSources: string[];
  searchQuery: string;
}

interface NutrientEducationProps {
  nutrientInfo: NutrientInfo;
  onSearchFoods: (query: string) => void;
}

const NutrientEducation: React.FC<NutrientEducationProps> = ({ nutrientInfo, onSearchFoods }) => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 mb-6 border border-blue-200 dark:border-blue-800">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            {nutrientInfo.title}
          </h2>
          
          <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
            {nutrientInfo.description}
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-green-600">check_circle</span>
                Key Benefits
              </h3>
              <ul className="space-y-2">
                {nutrientInfo.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                    <span className="material-symbols-outlined text-green-500 text-sm mt-0.5">arrow_right</span>
                    <span className="text-sm">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-orange-600">warning</span>
                Deficiency Symptoms
              </h3>
              <ul className="space-y-2">
                {nutrientInfo.deficiencySymptoms.map((symptom, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                    <span className="material-symbols-outlined text-orange-500 text-sm mt-0.5">arrow_right</span>
                    <span className="text-sm">{symptom}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">restaurant</span>
                Rich Food Sources
              </h3>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Daily Value: <span className="font-medium">{nutrientInfo.dailyValue}</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {nutrientInfo.richFoodSources.map((food, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                >
                  {food}
                </span>
              ))}
            </div>

            <button
              onClick={() => onSearchFoods(nutrientInfo.searchQuery)}
              className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">search</span>
              Find {nutrientInfo.title} Rich Foods
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NutrientEducation;
