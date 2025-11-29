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
// NOTE: All verdict banners have LIGHT backgrounds even in dark mode,
// so text colors should NOT use dark: modifiers
const verdictConfig: Record<VerdictType, {
  icon: string;
  title: string;
  bgClass: string;
  borderClass: string;
  iconColor: string;
  titleColor: string;
  subtitleColor: string;
  riskColor: string;
}> = {
  banned: {
    icon: 'dangerous',
    title: 'BANNED',
    bgClass: 'verdict-banned',
    borderClass: 'border-alert-red',
    iconColor: 'text-red-600',
    titleColor: 'text-red-700',
    subtitleColor: 'text-gray-700',
    riskColor: 'text-red-700',
  },
  restricted: {
    icon: 'gpp_maybe',
    title: 'RESTRICTED',
    bgClass: 'verdict-caution',
    borderClass: 'border-warning-amber',
    iconColor: 'text-amber-600',
    titleColor: 'text-amber-700',
    subtitleColor: 'text-gray-700',
    riskColor: 'text-amber-700',
  },
  safe: {
    icon: 'verified_user',
    title: 'SAFE & LEGAL',
    bgClass: 'verdict-safe',
    borderClass: 'border-success-green',
    iconColor: 'text-green-600',
    titleColor: 'text-green-700',
    subtitleColor: 'text-gray-700',
    riskColor: 'text-green-700',
  },
  caution: {
    icon: 'warning',
    title: 'USE WITH CAUTION',
    bgClass: 'verdict-caution',
    borderClass: 'border-warning-amber',
    iconColor: 'text-amber-600',
    titleColor: 'text-amber-700',
    subtitleColor: 'text-gray-700',
    riskColor: 'text-amber-700',
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
    <div className={`${config.bgClass} p-4 md:p-6 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 md:gap-4">
        {/* Header Row - Icon, Title, Badge */}
        <div className="flex items-center gap-3">
          {/* Large Icon */}
          <div className={`flex-shrink-0 ${config.iconColor}`}>
            <span className="material-symbols-outlined text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
              {config.icon}
            </span>
          </div>

          {/* Title and Badge - Mobile */}
          <div className="flex items-center gap-2 sm:hidden">
            <h2 className={`text-xl font-bold tracking-tight leading-tight ${config.titleColor}`}>
              {config.title}
            </h2>
            {type === 'banned' && (
              <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded uppercase whitespace-nowrap">
                Do Not Use
              </span>
            )}
            {type === 'safe' && (
              <span className="px-2 py-0.5 bg-green-600 text-white text-[10px] font-bold rounded uppercase">
                Approved
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Verdict Title - Desktop */}
          <div className="hidden sm:flex flex-wrap items-center gap-2 md:gap-3 mb-1.5 md:mb-2">
            <h2 className={`text-xl md:text-2xl lg:text-3xl font-bold tracking-tight leading-tight ${config.titleColor}`}>
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
          <p className="text-lg sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 mb-1 leading-tight">
            {substanceName}
          </p>

          {/* Subtitle - Prohibited by... */}
          <p className={`text-xs sm:text-sm lg:text-base ${config.subtitleColor} leading-relaxed`}>
            {getSubtitle()}
          </p>

          {/* Primary Risk Warning (for banned) */}
          {primaryRisk && (type === 'banned' || type === 'restricted') && (
            <div className={`mt-2 md:mt-3 flex items-start gap-2 ${config.riskColor}`}>
              <span className="material-symbols-outlined text-base md:text-lg flex-shrink-0 mt-0.5">warning</span>
              <span className="font-medium text-xs sm:text-sm md:text-base leading-snug">{primaryRisk}</span>
            </div>
          )}

          {/* Safety Rating Pills (for safe) */}
          {type === 'safe' && safetyRating && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs sm:text-sm font-medium">
                <span className="material-symbols-outlined text-xs sm:text-sm">check_circle</span>
                Legal in all 50 states
              </span>
              <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm font-medium">
                <span className="material-symbols-outlined text-xs sm:text-sm">science</span>
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
