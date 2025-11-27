/**
 * FDADisclaimer Component
 * 
 * FDA-required disclaimer for dietary supplement pages.
 * MUST appear on every page that discusses supplements or health products.
 */

import React from 'react';

interface FDADisclaimerProps {
  variant?: 'inline' | 'banner' | 'footer' | 'compact';
  className?: string;
}

// Standard FDA disclaimer text
const FDA_DISCLAIMER_TEXT = 
  "These statements have not been evaluated by the Food and Drug Administration. " +
  "This product is not intended to diagnose, treat, cure, or prevent any disease.";

const FDA_EXTENDED_TEXT =
  "The information provided on this website is for educational purposes only. " +
  "Always consult with a qualified healthcare professional before starting any supplement regimen, " +
  "making dietary changes, or if you have any questions about a medical condition.";

export function FDADisclaimer({ variant = 'banner', className = '' }: FDADisclaimerProps) {
  // Compact version for near buy buttons
  if (variant === 'compact') {
    return (
      <p className={`text-xs text-gray-500 dark:text-gray-400 ${className}`}>
        *{FDA_DISCLAIMER_TEXT}
      </p>
    );
  }

  // Inline version for within content
  if (variant === 'inline') {
    return (
      <div className={`text-sm text-gray-600 dark:text-gray-400 italic border-l-2 border-purple-400 pl-3 my-4 ${className}`}>
        <span className="font-medium text-purple-600 dark:text-purple-400">FDA Notice: </span>
        {FDA_DISCLAIMER_TEXT}
      </div>
    );
  }

  // Footer version - smaller, less prominent
  if (variant === 'footer') {
    return (
      <div className={`text-xs text-gray-500 dark:text-gray-500 text-center py-2 ${className}`}>
        <span className="font-medium">FDA Disclaimer:</span> {FDA_DISCLAIMER_TEXT}
      </div>
    );
  }

  // Banner version - full prominent display
  return (
    <div className={`bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-purple-600 dark:text-purple-400 flex-shrink-0">
          verified
        </span>
        <div>
          <h4 className="font-semibold text-purple-800 dark:text-purple-300 text-sm mb-1">
            FDA Disclaimer
          </h4>
          <p className="text-purple-700 dark:text-purple-400 text-sm">
            {FDA_DISCLAIMER_TEXT}
          </p>
          <p className="text-purple-600 dark:text-purple-500 text-xs mt-2">
            {FDA_EXTENDED_TEXT}
          </p>
        </div>
      </div>
    </div>
  );
}

export default FDADisclaimer;
