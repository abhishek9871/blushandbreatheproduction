/**
 * LegalDisclaimerBanner Component
 * 
 * Displays FTC/FDA-compliant legal disclaimers.
 * Required on all substance education pages for legal compliance.
 */

import React, { useState } from 'react';
import type { LegalDisclaimer } from '@/types';

type DisclaimerType = 'ftc' | 'fda' | 'medical' | 'affiliate' | 'general';
type PageType = 'banned' | 'supplement' | 'medicine' | 'comparison' | 'all';

interface LegalDisclaimerBannerProps {
  type?: DisclaimerType;
  pageType?: PageType;
  disclaimers?: LegalDisclaimer[];
  collapsible?: boolean;
  defaultExpanded?: boolean;
  className?: string;
}

// Default disclaimers for different contexts
const DEFAULT_DISCLAIMERS: Record<DisclaimerType, LegalDisclaimer> = {
  affiliate: {
    id: 'ftc-affiliate',
    type: 'affiliate',
    title: 'Affiliate Disclosure',
    content: 'This page contains affiliate links. We may earn a commission if you make a purchase through these links, at no additional cost to you. This helps support our free educational content.',
    required: true,
    displayOn: ['supplement', 'comparison', 'all'],
  },
  fda: {
    id: 'fda-supplement',
    type: 'fda',
    title: 'FDA Disclaimer',
    content: 'These statements have not been evaluated by the Food and Drug Administration. These products are not intended to diagnose, treat, cure, or prevent any disease.',
    required: true,
    displayOn: ['supplement', 'all'],
  },
  medical: {
    id: 'medical-general',
    type: 'medical',
    title: 'Medical Disclaimer',
    content: 'The information provided on this website is for educational purposes only and is not intended as medical advice. Always consult with a qualified healthcare provider before starting any supplement regimen, making changes to your health routine, or if you have any questions about a medical condition.',
    required: true,
    displayOn: ['banned', 'supplement', 'medicine', 'comparison', 'all'],
  },
  general: {
    id: 'banned-warning',
    type: 'general',
    title: 'Important Notice',
    content: 'The substances described on this page may be illegal, restricted, or banned in various jurisdictions. This information is provided for educational and harm-reduction purposes only. We do not encourage, promote, or condone the use of any illegal substances.',
    required: true,
    displayOn: ['banned'],
  },
  ftc: {
    id: 'ftc-disclosure',
    type: 'ftc',
    title: 'FTC Disclosure',
    content: 'In accordance with FTC guidelines, we disclose that some links on this page are affiliate links. Our recommendations are based on research and user reviews, not financial incentives.',
    required: true,
    displayOn: ['supplement', 'comparison', 'all'],
  },
};

// Icon mapping for different disclaimer types
const disclaimerIcons: Record<DisclaimerType, string> = {
  affiliate: 'payments',
  fda: 'verified',
  medical: 'medical_information',
  general: 'warning',
  ftc: 'info',
};

// Color mapping for different disclaimer types
const disclaimerColors: Record<DisclaimerType, string> = {
  affiliate: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
  fda: 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800',
  medical: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800',
  general: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
  ftc: 'bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700',
};

const disclaimerTextColors: Record<DisclaimerType, string> = {
  affiliate: 'text-blue-800 dark:text-blue-300',
  fda: 'text-purple-800 dark:text-purple-300',
  medical: 'text-amber-800 dark:text-amber-300',
  general: 'text-red-800 dark:text-red-300',
  ftc: 'text-gray-800 dark:text-gray-300',
};

export const LegalDisclaimerBanner: React.FC<LegalDisclaimerBannerProps> = ({
  type,
  pageType,
  disclaimers,
  collapsible = false,
  defaultExpanded = true,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Determine which disclaimers to show
  const getDisclaimersToShow = (): LegalDisclaimer[] => {
    if (disclaimers && disclaimers.length > 0) {
      return disclaimers;
    }

    if (type) {
      return [DEFAULT_DISCLAIMERS[type]];
    }

    if (pageType) {
      return Object.values(DEFAULT_DISCLAIMERS).filter(
        (d) => d.displayOn.includes(pageType) || d.displayOn.includes('all')
      );
    }

    return [DEFAULT_DISCLAIMERS.medical];
  };

  const disclaimersToShow = getDisclaimersToShow();

  if (disclaimersToShow.length === 0) {
    return null;
  }

  // Single disclaimer display
  if (disclaimersToShow.length === 1) {
    const disclaimer = disclaimersToShow[0];
    const bgColor = disclaimerColors[disclaimer.type];
    const textColor = disclaimerTextColors[disclaimer.type];
    const icon = disclaimerIcons[disclaimer.type];

    return (
      <div className={`rounded-lg border p-4 ${bgColor} ${className}`}>
        <div className="flex items-start gap-3">
          <span className={`material-symbols-outlined text-xl ${textColor}`}>
            {icon}
          </span>
          <div className="flex-1">
            <h4 className={`font-semibold text-sm ${textColor}`}>
              {disclaimer.title}
            </h4>
            <p className={`text-sm mt-1 ${textColor} opacity-90`}>
              {disclaimer.content}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Multiple disclaimers with collapsible option
  return (
    <div className={`rounded-lg border bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <button
        onClick={() => collapsible && setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between p-4 ${collapsible ? 'cursor-pointer' : 'cursor-default'}`}
        disabled={!collapsible}
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-gray-600 dark:text-gray-400">
            gavel
          </span>
          <h4 className="font-semibold text-gray-800 dark:text-gray-200">
            Legal Disclaimers
          </h4>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            ({disclaimersToShow.length} notices)
          </span>
        </div>
        {collapsible && (
          <span className="material-symbols-outlined text-gray-500 dark:text-gray-400 transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            expand_more
          </span>
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {disclaimersToShow.map((disclaimer) => {
            const bgColor = disclaimerColors[disclaimer.type];
            const textColor = disclaimerTextColors[disclaimer.type];
            const icon = disclaimerIcons[disclaimer.type];

            return (
              <div key={disclaimer.id} className={`rounded-lg border p-3 ${bgColor}`}>
                <div className="flex items-start gap-2">
                  <span className={`material-symbols-outlined text-lg ${textColor}`}>
                    {icon}
                  </span>
                  <div className="flex-1">
                    <h5 className={`font-medium text-sm ${textColor}`}>
                      {disclaimer.title}
                    </h5>
                    <p className={`text-xs mt-1 ${textColor} opacity-90`}>
                      {disclaimer.content}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LegalDisclaimerBanner;
