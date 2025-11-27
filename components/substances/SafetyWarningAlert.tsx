/**
 * SafetyWarningAlert Component
 * 
 * Displays prominent safety warnings for substances.
 * Used for state restrictions, health warnings, and critical safety info.
 */

import React from 'react';
import type { RiskLevel, LegalStatus, StateRestriction } from '@/types';

type AlertSeverity = 'info' | 'warning' | 'danger' | 'critical';

interface SafetyWarningAlertProps {
  severity: AlertSeverity;
  title: string;
  message: string;
  details?: string[];
  stateRestrictions?: StateRestriction[];
  legalStatus?: LegalStatus;
  riskLevel?: RiskLevel;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

// Severity color mappings
const severityStyles: Record<AlertSeverity, {
  bg: string;
  border: string;
  icon: string;
  iconColor: string;
  titleColor: string;
  textColor: string;
}> = {
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-300 dark:border-blue-700',
    icon: 'info',
    iconColor: 'text-blue-500 dark:text-blue-400',
    titleColor: 'text-blue-800 dark:text-blue-300',
    textColor: 'text-blue-700 dark:text-blue-400',
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-300 dark:border-yellow-700',
    icon: 'warning',
    iconColor: 'text-yellow-500 dark:text-yellow-400',
    titleColor: 'text-yellow-800 dark:text-yellow-300',
    textColor: 'text-yellow-700 dark:text-yellow-400',
  },
  danger: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-300 dark:border-orange-700',
    icon: 'dangerous',
    iconColor: 'text-orange-500 dark:text-orange-400',
    titleColor: 'text-orange-800 dark:text-orange-300',
    textColor: 'text-orange-700 dark:text-orange-400',
  },
  critical: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-300 dark:border-red-700',
    icon: 'error',
    iconColor: 'text-red-500 dark:text-red-400',
    titleColor: 'text-red-800 dark:text-red-300',
    textColor: 'text-red-700 dark:text-red-400',
  },
};

// Legal status to severity mapping
const legalStatusSeverity: Record<LegalStatus, AlertSeverity> = {
  banned_worldwide: 'critical',
  banned_usa: 'critical',
  controlled_substance: 'danger',
  prescription_only: 'warning',
  fda_warning: 'danger',
  state_restricted: 'warning',
  legal_unregulated: 'info',
};

// Risk level to severity mapping
const riskLevelSeverity: Record<RiskLevel, AlertSeverity> = {
  severe: 'critical',
  high: 'danger',
  moderate: 'warning',
  low: 'info',
  unknown: 'info',
};

export const SafetyWarningAlert: React.FC<SafetyWarningAlertProps> = ({
  severity,
  title,
  message,
  details,
  stateRestrictions,
  legalStatus,
  riskLevel,
  dismissible = false,
  onDismiss,
  className = '',
}) => {
  // Determine severity from props if not explicitly set
  let effectiveSeverity = severity;
  if (legalStatus && !severity) {
    effectiveSeverity = legalStatusSeverity[legalStatus];
  } else if (riskLevel && !severity) {
    effectiveSeverity = riskLevelSeverity[riskLevel];
  }

  const styles = severityStyles[effectiveSeverity];

  return (
    <div
      className={`rounded-lg border-2 p-4 ${styles.bg} ${styles.border} ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <span className={`material-symbols-outlined text-2xl ${styles.iconColor} flex-shrink-0`}>
          {styles.icon}
        </span>

        {/* Content */}
        <div className="flex-1">
          {/* Title */}
          <h4 className={`font-bold text-lg ${styles.titleColor}`}>
            {title}
          </h4>

          {/* Main message */}
          <p className={`mt-1 ${styles.textColor}`}>
            {message}
          </p>

          {/* Additional details */}
          {details && details.length > 0 && (
            <ul className={`mt-3 space-y-1 ${styles.textColor}`}>
              {details.map((detail, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-sm mt-0.5">
                    arrow_right
                  </span>
                  <span className="text-sm">{detail}</span>
                </li>
              ))}
            </ul>
          )}

          {/* State restrictions */}
          {stateRestrictions && stateRestrictions.length > 0 && (
            <div className="mt-4">
              <h5 className={`font-semibold text-sm ${styles.titleColor} mb-2`}>
                State-Specific Restrictions:
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {stateRestrictions.map((restriction) => (
                  <div
                    key={restriction.stateCode}
                    className={`text-xs p-2 rounded ${styles.bg} border ${styles.border}`}
                  >
                    <span className="font-semibold">{restriction.state}:</span>{' '}
                    <span className="capitalize">{restriction.restrictionType.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legal status badge */}
          {legalStatus && (
            <div className="mt-3">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${styles.bg} ${styles.border} ${styles.textColor}`}>
                <span className="material-symbols-outlined text-sm">gavel</span>
                {legalStatus.replace(/_/g, ' ').toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Dismiss button */}
        {dismissible && onDismiss && (
          <button
            onClick={onDismiss}
            className={`${styles.textColor} hover:opacity-70 transition-opacity`}
            aria-label="Dismiss"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        )}
      </div>
    </div>
  );
};

// Pre-configured warning for banned substances
export const BannedSubstanceWarning: React.FC<{
  substanceName: string;
  legalStatus: LegalStatus;
  className?: string;
}> = ({ substanceName, legalStatus, className }) => (
  <SafetyWarningAlert
    severity={legalStatusSeverity[legalStatus]}
    title={`⚠️ ${substanceName} is a Banned/Restricted Substance`}
    message="Possession, sale, or use of this substance may be illegal in your jurisdiction. This information is provided for educational and harm-reduction purposes only."
    legalStatus={legalStatus}
    details={[
      'Do not attempt to purchase or use this substance',
      'Consult local laws regarding this substance',
      'See our legal alternatives section below',
    ]}
    className={className}
  />
);

// Pre-configured warning for health risks
export const HealthRiskWarning: React.FC<{
  riskLevel: RiskLevel;
  risks: string[];
  className?: string;
}> = ({ riskLevel, risks, className }) => (
  <SafetyWarningAlert
    severity={riskLevelSeverity[riskLevel]}
    title="Health Risk Warning"
    message={`This substance has been classified as having ${riskLevel} health risks.`}
    riskLevel={riskLevel}
    details={risks}
    className={className}
  />
);

export default SafetyWarningAlert;
