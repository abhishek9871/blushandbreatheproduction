/**
 * ConversionCTA Component
 * 
 * Conversion-focused call-to-action boxes for buy pages.
 * Multiple variants for different positions in the content.
 */

import React from 'react';

interface ConversionCTAProps {
  position: 'top' | 'middle' | 'bottom';
  title: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  variant?: 'default' | 'prominent' | 'final' | 'success';
}

export default function ConversionCTA({
  position,
  title,
  description,
  ctaText,
  ctaLink,
  variant = 'default',
}: ConversionCTAProps) {
  // Different styles based on position and variant
  const getContainerStyles = () => {
    if (variant === 'success') {
      return 'p-6 bg-gradient-to-r from-success-green to-primary rounded-xl shadow-lg';
    }
    if (variant === 'final') {
      return 'p-6 bg-gradient-to-r from-success-green to-primary rounded-xl shadow-lg';
    }
    if (variant === 'prominent') {
      return 'p-5 bg-gradient-to-r from-primary/10 to-success-green/10 dark:from-primary/20 dark:to-success-green/20 rounded-xl border-2 border-primary/30';
    }
    if (position === 'top') {
      return 'p-4 bg-success-green-light dark:bg-success-green-dark/20 rounded-lg border border-success-green/30';
    }
    return 'p-4 bg-card-light dark:bg-card-dark rounded-lg border border-border-light dark:border-border-dark';
  };

  const getTextColor = () => {
    if (variant === 'final' || variant === 'success') return 'text-white';
    return 'text-text-light dark:text-text-dark';
  };

  const getDescColor = () => {
    if (variant === 'final' || variant === 'success') return 'text-white/90';
    return 'text-text-subtle-light dark:text-text-subtle-dark';
  };

  const getButtonStyles = () => {
    if (variant === 'final' || variant === 'success') {
      return 'bg-white text-success-green hover:bg-gray-100 font-bold';
    }
    return 'bg-success-green hover:bg-success-green-dark text-white font-bold';
  };

  return (
    <div className={`my-6 ${getContainerStyles()}`}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <h3 className={`text-lg font-bold ${getTextColor()} flex items-center justify-center sm:justify-start gap-2`}>
            <span className="material-symbols-outlined">
              {variant === 'final' ? 'shield' : position === 'top' ? 'trending_up' : 'verified_user'}
            </span>
            {title}
          </h3>
          <p className={`text-sm ${getDescColor()} mt-1`}>
            {description}
          </p>
        </div>
        <a
          href={ctaLink}
          className={`inline-flex items-center gap-2 py-3 px-6 rounded-lg transition-colors whitespace-nowrap ${getButtonStyles()}`}
        >
          <span className="material-symbols-outlined">arrow_forward</span>
          {ctaText}
        </a>
      </div>

      {/* Trust badges for final CTA */}
      {variant === 'final' && (
        <div className="flex flex-wrap items-center justify-center gap-4 mt-4 pt-4 border-t border-white/20">
          <span className="flex items-center gap-1 text-white/80 text-sm">
            <span className="material-symbols-outlined text-base">local_shipping</span>
            COD Available
          </span>
          <span className="flex items-center gap-1 text-white/80 text-sm">
            <span className="material-symbols-outlined text-base">schedule</span>
            1-3 Day Delivery
          </span>
          <span className="flex items-center gap-1 text-white/80 text-sm">
            <span className="material-symbols-outlined text-base">verified</span>
            100% Legal
          </span>
          <span className="flex items-center gap-1 text-white/80 text-sm">
            <span className="material-symbols-outlined text-base">security</span>
            No Customs Risk
          </span>
        </div>
      )}
    </div>
  );
}
