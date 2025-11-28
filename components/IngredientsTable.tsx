/**
 * Ingredients Table Component
 * 
 * Renders product ingredients as a formatted table
 * Used for banned product pages (Dark Labs Crack Gold, etc.)
 */

import React from 'react';

interface Ingredient {
  name: string;
  amount: string;
  unit: string;
}

interface IngredientsTableProps {
  ingredients: Ingredient[];
  productName: string;
  className?: string;
}

// Known ingredient purposes for context
const INGREDIENT_PURPOSES: Record<string, string> = {
  'L-Citrulline': 'Pump & Blood Flow',
  'Citrulline Malate': 'Pump & Blood Flow',
  'Beta Alanine': 'Endurance & Tingles',
  'Beta-Alanine': 'Endurance & Tingles',
  'Agmatine Sulfate': 'Pump & Mood',
  'L-Tyrosine': 'Focus & Mood',
  'Alpha GPC 50%': 'Cognitive Enhancement',
  'Caffeine Anhydrous': 'Energy & Alertness',
  'Caffeine Citrate': 'Fast-Acting Energy',
  'Eria Jarensis Extract': 'Euphoria & Mood',
  'DMHA (Juglans Regia)': '⚠️ BANNED Stimulant',
  'DMHA': '⚠️ BANNED Stimulant',
  'DMAA': '⚠️ BANNED Stimulant',
  'Halostachine': 'Stimulant',
  'Alpha Yohimbine': 'Fat Loss & Stimulant',
  'Yohimbe Extract': 'Fat Loss & Stimulant',
  'Creatine Nitrate': 'Strength & Pump',
  'Arginine AKG': 'Blood Flow',
  'Beta-Phenylethylamine': 'Mood & Energy',
  'Choline Bitartrate': 'Cognitive Support',
  'Higenamine HCL': '⚠️ BANNED Stimulant',
  'Hordenine HCL': 'MAO Inhibitor',
  'N-Methyl L-Tyramine': 'Stimulant',
  'Niacin': 'Vasodilation (Flush)',
  'GABA': 'Relaxation',
};

export function IngredientsTable({ ingredients, productName, className = '' }: IngredientsTableProps) {
  if (!ingredients || ingredients.length === 0) return null;

  // Calculate total caffeine if present
  const caffeineIngredients = ingredients.filter(i => 
    i.name.toLowerCase().includes('caffeine')
  );
  const totalCaffeine = caffeineIngredients.reduce((sum, i) => sum + parseFloat(i.amount), 0);

  return (
    <section className={`ingredients-table ${className}`}>
      <h2 className="text-xl font-semibold text-text-light dark:text-text-dark mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-orange-500">science</span>
        {productName} Ingredient Panel
      </h2>
      
      {totalCaffeine > 0 && (
        <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
          <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
            ⚠️ Total Caffeine: <strong>{totalCaffeine}mg</strong> per serving
            {totalCaffeine >= 400 && ' — Exceeds FDA daily recommendation of 400mg'}
          </p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white dark:bg-card-dark rounded-lg overflow-hidden border border-border-light dark:border-border-dark">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800">
              <th className="text-left px-4 py-3 font-semibold text-text-light dark:text-text-dark border-b border-border-light dark:border-border-dark">
                Ingredient
              </th>
              <th className="text-right px-4 py-3 font-semibold text-text-light dark:text-text-dark border-b border-border-light dark:border-border-dark">
                Amount
              </th>
              <th className="text-left px-4 py-3 font-semibold text-text-light dark:text-text-dark border-b border-border-light dark:border-border-dark hidden sm:table-cell">
                Purpose
              </th>
            </tr>
          </thead>
          <tbody>
            {ingredients.map((ingredient, index) => {
              const isBanned = INGREDIENT_PURPOSES[ingredient.name]?.includes('BANNED');
              return (
                <tr 
                  key={index}
                  className={`${
                    isBanned 
                      ? 'bg-red-50 dark:bg-red-900/20' 
                      : index % 2 === 0 
                        ? 'bg-white dark:bg-card-dark' 
                        : 'bg-gray-50 dark:bg-gray-800/50'
                  }`}
                >
                  <td className={`px-4 py-3 text-text-light dark:text-text-dark ${isBanned ? 'font-semibold text-red-700 dark:text-red-400' : ''}`}>
                    {ingredient.name}
                  </td>
                  <td className="px-4 py-3 text-right text-text-subtle-light dark:text-text-subtle-dark font-mono">
                    {ingredient.amount}{ingredient.unit}
                  </td>
                  <td className="px-4 py-3 text-text-subtle-light dark:text-text-subtle-dark text-sm hidden sm:table-cell">
                    {INGREDIENT_PURPOSES[ingredient.name] || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default IngredientsTable;
