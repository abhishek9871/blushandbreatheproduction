/**
 * SupplierWarningCard Component
 * 
 * Displays supplier warnings with scam alerts, GST verification,
 * and risk assessment. Designed to redirect users to legal alternatives.
 */

import React from 'react';
import type { SupplierWarning } from '@/types';

interface SupplierWarningCardProps {
  supplier: SupplierWarning;
}

export default function SupplierWarningCard({ supplier }: SupplierWarningCardProps) {
  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-success-green/20 text-success-green border-success-green/30';
      case 'moderate': return 'bg-warning-amber/20 text-warning-amber border-warning-amber/30';
      case 'high': return 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30';
      case 'extreme': return 'bg-alert-red/20 text-alert-red border-alert-red/30';
      default: return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  const getGSTBadge = (status: string) => {
    switch (status) {
      case 'verified': return { icon: 'verified', text: 'GST Verified', color: 'text-success-green' };
      case 'invalid': return { icon: 'error', text: 'Invalid GST', color: 'text-alert-red' };
      case 'pending': return { icon: 'pending', text: 'GST Pending', color: 'text-warning-amber' };
      default: return { icon: 'help', text: 'Unknown', color: 'text-gray-500' };
    }
  };

  const gstBadge = getGSTBadge(supplier.gstStatus);

  return (
    <div className={`p-4 rounded-xl border-l-4 ${
      supplier.riskLevel === 'extreme' ? 'border-l-alert-red bg-alert-red-light dark:bg-alert-red-dark/20' :
      supplier.riskLevel === 'high' ? 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/20' :
      'border-l-warning-amber bg-warning-amber-light dark:bg-warning-amber-dark/20'
    }`}>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div>
          <h4 className="font-bold text-text-light dark:text-text-dark flex items-center gap-2">
            <span className="material-symbols-outlined text-alert-red">warning</span>
            {supplier.name}
          </h4>
          <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark">
            {supplier.location}
          </p>
        </div>
        <span className={`px-2 py-1 text-xs font-bold uppercase rounded border ${getRiskBadgeColor(supplier.riskLevel)}`}>
          {supplier.riskLevel} RISK
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
        <div className="p-2 bg-white/60 dark:bg-gray-800/60 rounded text-center">
          <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark">Price/kg</p>
          <p className="font-bold text-text-light dark:text-text-dark">₹{supplier.pricePerKg.toLocaleString('en-IN')}</p>
        </div>
        <div className="p-2 bg-white/60 dark:bg-gray-800/60 rounded text-center">
          <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark">MOQ</p>
          <p className="font-bold text-text-light dark:text-text-dark">{supplier.moq}</p>
        </div>
        <div className="p-2 bg-white/60 dark:bg-gray-800/60 rounded text-center">
          <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark">Trust Score</p>
          <p className={`font-bold ${supplier.trustScore < 3 ? 'text-alert-red' : supplier.trustScore < 6 ? 'text-warning-amber' : 'text-success-green'}`}>
            {supplier.trustScore}/10
          </p>
        </div>
        <div className="p-2 bg-white/60 dark:bg-gray-800/60 rounded text-center">
          <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark">Scam Reports</p>
          <p className={`font-bold ${supplier.scamReports > 5 ? 'text-alert-red' : 'text-warning-amber'}`}>
            {supplier.scamReports}+
          </p>
        </div>
      </div>

      {/* GST Verification */}
      <div className="flex items-center gap-2 mb-3 p-2 bg-white/60 dark:bg-gray-800/60 rounded">
        <span className={`material-symbols-outlined ${gstBadge.color}`}>{gstBadge.icon}</span>
        <span className={`text-sm font-medium ${gstBadge.color}`}>{gstBadge.text}</span>
        {supplier.gstNumber && (
          <span className="text-xs text-text-subtle-light dark:text-text-subtle-dark ml-auto font-mono">
            {supplier.gstNumber}
          </span>
        )}
      </div>

      {/* Red Flags */}
      {supplier.redFlags.length > 0 && (
        <div className="mb-3">
          <p className="text-sm font-medium text-alert-red mb-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-base">flag</span>
            Red Flags
          </p>
          <ul className="space-y-1">
            {supplier.redFlags.map((flag, i) => (
              <li key={i} className="text-sm text-text-subtle-light dark:text-text-subtle-dark flex items-start gap-2">
                <span className="text-alert-red">✗</span>
                {flag}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Testimonial Quote if available */}
      {supplier.testimonialQuote && (
        <div className="p-3 bg-white/80 dark:bg-gray-800/80 rounded border-l-2 border-alert-red mb-3">
          <p className="text-sm italic text-text-subtle-light dark:text-text-subtle-dark">
            &ldquo;{supplier.testimonialQuote}&rdquo;
          </p>
          {supplier.caseNumber && (
            <p className="text-xs text-gray-400 mt-1">
              Case #{supplier.caseNumber}
            </p>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-2">
        <strong>Disclaimer:</strong> Based on publicly available consumer complaints and court records. 
        We do not independently verify allegations but report documented cases.
      </p>

      {/* CTA */}
      <a
        href="#legal-alternatives"
        className="mt-3 flex items-center justify-center gap-2 py-2 px-4 bg-success-green hover:bg-success-green-dark text-white text-sm font-bold rounded transition-colors"
      >
        <span className="material-symbols-outlined text-base">verified_user</span>
        View Safe Alternatives Instead
      </a>
    </div>
  );
}
