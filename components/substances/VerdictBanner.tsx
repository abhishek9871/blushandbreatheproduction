/**
 * VerdictBanner Component
 * 
 * Displays a clear, prominent verdict at the top of substance pages.
 * Shows BANNED/DANGEROUS for restricted substances and SAFE/LEGAL for supplements.
 */

import React from 'react';
import type { LegalStatus, RiskLevel } from '@/types';

type VerdictType = 'banned' | 'restricted' | 'safe' | 'caution';

interface VerdictBannerProps {
  type: VerdictType;
  substanceName: string;
  // For banned substances
  legalStatus?: LegalStatus;
  bannedBy?: string[];
  primaryRisk?: string;
  // For supplements
  safetyRating?: RiskLevel;
  fdaStatus?: string;
  className?: string;
}

// Verdict configurations
const verdictConfig: Record<VerdictType, {
  icon: string;
  title: string;
  bgClass: string;
  borderClass: string;
  iconColor: string;
  titleColor: string;
}> = {
  banned: {
    icon: 'dangerous',
    title: 'BANNED',
    bgClass: 'verdict-banned',
    borderClass: 'border-alert-red',
    iconColor: 'text-red-600',
    titleColor: 'text-red-700 dark:text-red-400',
  },
  restricted: {
    icon: 'gpp_maybe',
    title: 'RESTRICTED',
    bgClass: 'verdict-caution',
    borderClass: 'border-warning-amber',
    iconColor: 'text-amber-600',
    titleColor: 'text-amber-700 dark:text-amber-400',
  },
  safe: {
    icon: 'verified_user',
    title: 'SAFE & LEGAL',
    bgClass: 'verdict-safe',
    borderClass: 'border-success-green',
    iconColor: 'text-green-600',
    titleColor: 'text-green-700 dark:text-green-400',
  },
  caution: {
    icon: 'warning',
    title: 'USE WITH CAUTION',
    bgClass: 'verdict-caution',
    borderClass: 'border-warning-amber',
    iconColor: 'text-amber-600',
    titleColor: 'text-amber-700 dark:text-amber-400',
  },
};

export function VerdictBanner({
  type,
  substanceName,
  legalStatus,
  bannedBy,
  primaryRisk,
  safetyRating,
  fdaStatus,
  className = '',
}: VerdictBannerProps) {
  const config = verdictConfig[type];

  // Generate subtitle based on type
  const getSubtitle = (): string => {
    if (type === 'banned' || type === 'restricted') {
      if (bannedBy && bannedBy.length > 0) {
        return `Prohibited by ${bannedBy.join(', ')}`;
      }
      return 'This substance is not legal for sale or consumption';
    }
    if (type === 'safe') {
      const parts: string[] = [];
      if (fdaStatus) parts.push(`FDA: ${fdaStatus.toUpperCase()}`);
      if (safetyRating) parts.push(`Safety: ${safetyRating}`);
      return parts.length > 0 ? parts.join(' • ') : 'Legal dietary supplement';
    }
    return 'Review safety information before use';
  };

  return (
    <div className={`${config.bgClass} p-5 md:p-6 ${className}`}>
      <div className="flex items-start gap-4">
        {/* Large Icon */}
        <div className={`flex-shrink-0 ${config.iconColor}`}>
          <span className="material-symbols-outlined text-4xl md:text-5xl">
            {config.icon}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Verdict Title */}
          <div className="flex items-center gap-3 mb-2">
            <h2 className={`text-2xl md:text-3xl font-bold tracking-tight ${config.titleColor}`}>
              {config.title}
            </h2>
            {type === 'banned' && (
              <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded uppercase">
                Do Not Use
              </span>
            )}
            {type === 'safe' && (
              <span className="px-2 py-1 bg-green-600 text-white text-xs font-bold rounded uppercase">
                Approved
              </span>
            )}
          </div>

          {/* Substance Name */}
          <p className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-200 mb-1">
            {substanceName}
          </p>

          {/* Subtitle */}
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
            {getSubtitle()}
          </p>

          {/* Primary Risk Warning (for banned) */}
          {primaryRisk && (type === 'banned' || type === 'restricted') && (
            <div className="mt-3 flex items-center gap-2 text-red-700 dark:text-red-400">
              <span className="material-symbols-outlined text-lg">warning</span>
              <span className="font-medium">{primaryRisk}</span>
            </div>
          )}

          {/* Safety Rating Pills (for safe) */}
          {type === 'safe' && safetyRating && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm font-medium">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Legal in all 50 states
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium">
                <span className="material-symbols-outlined text-sm">science</span>
                Research-backed
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VerdictBanner;
