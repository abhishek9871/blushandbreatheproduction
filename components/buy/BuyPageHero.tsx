/**
 * BuyPageHero Component
 * 
 * Hero section for buy pages with quick stats and trust signals.
 * Designed for maximum conversion with clear value proposition.
 */

import React from 'react';

interface QuickStats {
  legalStatus: string;
  seizureRisk: string;
  healthRisk: string;
  sportsBan: string;
}

interface BuyPageHeroProps {
  title: string;
  subtitle: string;
  quickStats: QuickStats;
  modifiedDate: string;
  readingTime: number;
}

export default function BuyPageHero({
  title,
  subtitle,
  quickStats,
  modifiedDate,
  readingTime,
}: BuyPageHeroProps) {
  return (
    <header className="mb-8">
      {/* H1 Title */}
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-text-light dark:text-text-dark mb-3 leading-tight">
        {title}
      </h1>

      {/* Subtitle */}
      <p className="text-lg text-text-subtle-light dark:text-text-subtle-dark mb-4">
        {subtitle}
      </p>

      {/* Meta Info Row */}
      <div className="flex flex-wrap items-center gap-3 text-sm text-text-subtle-light dark:text-text-subtle-dark mb-6">
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-base">update</span>
          Updated {modifiedDate}
        </span>
        <span className="hidden sm:inline">•</span>
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-base">schedule</span>
          {readingTime} min read
        </span>
        <span className="hidden sm:inline">•</span>
        <span className="flex items-center gap-1 text-medical-blue dark:text-medical-blue">
          <span className="material-symbols-outlined text-base">verified</span>
          Evidence-Based
        </span>
      </div>

      {/* Quick Stats Grid - Risk Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-gradient-to-br from-alert-red-light to-warning-amber-light dark:from-alert-red-dark/30 dark:to-warning-amber-dark/30 rounded-xl border border-alert-red/30 dark:border-alert-red/50">
        <div className="text-center p-3 bg-white/80 dark:bg-gray-800/80 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <span className="material-symbols-outlined text-alert-red text-lg">gavel</span>
            <span className="text-xs font-semibold text-text-subtle-light dark:text-text-subtle-dark uppercase">
              Legal
            </span>
          </div>
          <span className="text-sm font-bold text-alert-red">
            {quickStats.legalStatus}
          </span>
        </div>

        <div className="text-center p-3 bg-white/80 dark:bg-gray-800/80 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <span className="material-symbols-outlined text-warning-amber text-lg">local_shipping</span>
            <span className="text-xs font-semibold text-text-subtle-light dark:text-text-subtle-dark uppercase">
              Customs
            </span>
          </div>
          <span className="text-sm font-bold text-warning-amber">
            {quickStats.seizureRisk}
          </span>
        </div>

        <div className="text-center p-3 bg-white/80 dark:bg-gray-800/80 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <span className="material-symbols-outlined text-alert-red text-lg">favorite</span>
            <span className="text-xs font-semibold text-text-subtle-light dark:text-text-subtle-dark uppercase">
              Health
            </span>
          </div>
          <span className="text-sm font-bold text-alert-red">
            {quickStats.healthRisk}
          </span>
        </div>

        <div className="text-center p-3 bg-white/80 dark:bg-gray-800/80 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <span className="material-symbols-outlined text-alert-red text-lg">sports</span>
            <span className="text-xs font-semibold text-text-subtle-light dark:text-text-subtle-dark uppercase">
              Sports
            </span>
          </div>
          <span className="text-sm font-bold text-alert-red">
            {quickStats.sportsBan}
          </span>
        </div>
      </div>
    </header>
  );
}
