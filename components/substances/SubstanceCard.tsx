/**
 * SubstanceCard Component
 * 
 * Displays a card for banned substances, legal supplements, or medicines.
 * Used in search results and listing pages.
 */

import React from 'react';
import Link from 'next/link';
import type { BannedSubstance, LegalSupplement, MedicineInfo, RiskLevel } from '@/types';

type SubstanceType = 'banned' | 'supplement' | 'medicine';

interface SubstanceCardProps {
  type: SubstanceType;
  substance: BannedSubstance | LegalSupplement | MedicineInfo;
  showBadge?: boolean;
}

// Risk level color mapping
const riskColors: Record<RiskLevel, string> = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  moderate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  severe: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  unknown: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

// Type badge colors
const typeBadgeColors: Record<SubstanceType, string> = {
  banned: 'bg-red-500 text-white',
  supplement: 'bg-green-500 text-white',
  medicine: 'bg-blue-500 text-white',
};

const typeLabels: Record<SubstanceType, string> = {
  banned: 'Banned',
  supplement: 'Legal',
  medicine: 'Rx Info',
};

export const SubstanceCard: React.FC<SubstanceCardProps> = ({
  type,
  substance,
  showBadge = true,
}) => {
  // Determine the link based on type
  const getLink = (): string => {
    if (type === 'banned') {
      return `/banned/${(substance as BannedSubstance).slug}`;
    }
    if (type === 'supplement') {
      return `/supplement/${(substance as LegalSupplement).slug}`;
    }
    return `/medicine/${(substance as MedicineInfo).slug}`;
  };

  // Get the display name
  const getName = (): string => {
    if (type === 'medicine') {
      const med = substance as MedicineInfo;
      return med.brandName || med.genericName;
    }
    return (substance as BannedSubstance | LegalSupplement).name;
  };

  // Get the category/class
  const getCategory = (): string => {
    if (type === 'medicine') {
      const med = substance as MedicineInfo;
      return med.drugClass?.[0] || 'Pharmaceutical';
    }
    return (substance as BannedSubstance | LegalSupplement).category;
  };

  // Get the description (truncated)
  const getDescription = (): string => {
    if (type === 'medicine') {
      const med = substance as MedicineInfo;
      return med.label?.indicationsAndUsage?.substring(0, 150) + '...' || 'Medicine information available.';
    }
    const desc = (substance as BannedSubstance | LegalSupplement).description;
    return desc.length > 150 ? desc.substring(0, 150) + '...' : desc;
  };

  // Get safety/risk indicator
  const getRiskLevel = (): RiskLevel | null => {
    if (type === 'banned') {
      return (substance as BannedSubstance).overdoseRisk;
    }
    if (type === 'supplement') {
      return (substance as LegalSupplement).safetyRating;
    }
    return null;
  };

  const riskLevel = getRiskLevel();

  return (
    <Link href={getLink()} className="block group">
      <div className="medical-card p-4 md:p-5 relative overflow-hidden">
        {/* Type indicator stripe */}
        <div className={`absolute top-0 left-0 w-1 h-full ${
          type === 'banned' ? 'bg-alert-red' : 
          type === 'supplement' ? 'bg-success-green' : 
          'bg-medical-blue'
        }`} />
        
        {/* Header with badge */}
        <div className="flex items-start justify-between mb-3 pl-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base md:text-lg text-text-light dark:text-text-dark group-hover:text-primary transition-colors truncate">
              {getName()}
            </h3>
            <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark capitalize flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">
                {type === 'banned' ? 'block' : type === 'supplement' ? 'eco' : 'medication'}
              </span>
              {getCategory().replace('_', ' ')}
            </p>
          </div>
          
          {showBadge && (
            <span className={`ml-2 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${typeBadgeColors[type]}`}>
              {typeLabels[type]}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-xs md:text-sm text-text-subtle-light dark:text-text-subtle-dark mb-3 md:mb-4 line-clamp-2 pl-3 leading-relaxed">
          {getDescription()}
        </p>

        {/* Footer with risk level and arrow */}
        <div className="flex items-center justify-between pl-3">
          <div className="flex items-center gap-2">
            {riskLevel && (
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${riskColors[riskLevel]}`}>
                <span className="material-symbols-outlined text-xs">
                  {type === 'banned' ? 'warning' : 'shield'}
                </span>
                {type === 'banned' ? 'Risk: ' : 'Safety: '}
                {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}
              </span>
            )}
            
            {type === 'medicine' && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">verified</span>
                FDA Data
              </span>
            )}
          </div>

          <span className="flex items-center gap-1 text-primary font-medium text-sm md:opacity-0 md:group-hover:opacity-100 transition-all md:group-hover:translate-x-1">
            View
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </span>
        </div>
      </div>
    </Link>
  );
};

export default SubstanceCard;
