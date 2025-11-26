'use client';

import React from 'react';

const NutritionHero: React.FC = () => {
  const currentHour = new Date().getHours();
  const getGreeting = () => {
    if (currentHour < 12) return 'Good morning';
    if (currentHour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getMotivationalMessage = () => {
    const messages = [
      "Fuel your body with the nutrients it deserves",
      "Every healthy choice is a step toward wellness",
      "Knowledge is power - understand your nutrition",
      "Small changes, big results in your health journey"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  return (
    <div className="mb-8">
      <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 rounded-2xl p-6 md:p-8 border border-border-light dark:border-border-dark">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-text-light dark:text-text-dark leading-tight tracking-[-0.033em] mb-3">
              {getGreeting()}! 🌱
            </h1>
            <p className="text-lg md:text-xl text-text-subtle-light dark:text-text-subtle-dark leading-relaxed max-w-2xl">
              {getMotivationalMessage()}
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <div className="flex items-center gap-2 px-3 py-2 bg-white/50 dark:bg-[#1C2C1F]/50 rounded-lg border border-border-light dark:border-border-dark">
                <span className="material-symbols-outlined text-primary text-lg">restaurant</span>
                <span className="text-sm font-medium text-text-light dark:text-text-dark">USDA Nutrition Data</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-white/50 dark:bg-[#1C2C1F]/50 rounded-lg border border-border-light dark:border-border-dark">
                <span className="material-symbols-outlined text-secondary text-lg">auto_awesome</span>
                <span className="text-sm font-medium text-text-light dark:text-text-dark">AI Diet Plans</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-white/50 dark:bg-[#1C2C1F]/50 rounded-lg border border-border-light dark:border-border-dark">
                <span className="material-symbols-outlined text-accent text-lg">person</span>
                <span className="text-sm font-medium text-text-light dark:text-text-dark">Personalized</span>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0">
            <div className="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-primary via-secondary to-accent rounded-full flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-5xl md:text-6xl text-white">nutrition</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-border-light dark:border-border-dark">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary mb-1">300K+</div>
            <div className="text-sm text-text-subtle-light dark:text-text-subtle-dark">USDA Foods</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-secondary mb-1">Real</div>
            <div className="text-sm text-text-subtle-light dark:text-text-subtle-dark">Nutrition Data</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-accent mb-1">Free</div>
            <div className="text-sm text-text-subtle-light dark:text-text-subtle-dark">Access</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary mb-1">24/7</div>
            <div className="text-sm text-text-subtle-light dark:text-text-subtle-dark">Available</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NutritionHero;
