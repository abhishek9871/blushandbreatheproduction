/**
 * MedicalCitationBadge Component
 * 
 * E-E-A-T trust signal showing medical sources and review status.
 * Displays citation count and authority sources for credibility.
 */

import React, { useState } from 'react';
import type { MedicalSource } from '@/types';

interface MedicalCitationBadgeProps {
  sources: MedicalSource[];
  modifiedDate: string;
}

export default function MedicalCitationBadge({
  sources,
  modifiedDate,
}: MedicalCitationBadgeProps) {
  const [showSources, setShowSources] = useState(false);

  // Group sources by type
  const fdaSources = sources.filter(s => s.sourceType === 'fda').length;
  const pubmedSources = sources.filter(s => s.sourceType === 'pubmed' || s.sourceType === 'case_report').length;
  const regulatorySources = sources.filter(s => s.sourceType === 'fssai' || s.sourceType === 'wada').length;

  return (
    <div className="mb-6">
      {/* Main Badge */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-medical-blue-light dark:bg-medical-blue-dark/30 rounded-xl border border-medical-blue/30">
        {/* Evidence Badge */}
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-medical-blue text-2xl">
            verified
          </span>
          <div>
            <p className="text-sm font-bold text-medical-blue dark:text-medical-blue">
              Evidence-Based Content
            </p>
            <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark">
              {sources.length} Medical Citations
            </p>
          </div>
        </div>

        {/* Source Breakdown */}
        <div className="flex flex-wrap gap-2 ml-auto">
          {fdaSources > 0 && (
            <span className="px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs font-medium text-medical-blue border border-medical-blue/30">
              {fdaSources} FDA
            </span>
          )}
          {pubmedSources > 0 && (
            <span className="px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs font-medium text-success-green border border-success-green/30">
              {pubmedSources} PubMed
            </span>
          )}
          {regulatorySources > 0 && (
            <span className="px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs font-medium text-warning-amber border border-warning-amber/30">
              {regulatorySources} Regulatory
            </span>
          )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setShowSources(!showSources)}
          className="flex items-center gap-1 text-xs text-medical-blue hover:underline"
        >
          <span className="material-symbols-outlined text-base">
            {showSources ? 'expand_less' : 'expand_more'}
          </span>
          {showSources ? 'Hide' : 'View'} Sources
        </button>
      </div>

      {/* Expanded Sources List - Redesigned for better UX */}
      {showSources && (
        <div className="mt-3 rounded-xl border border-border-light dark:border-border-dark overflow-hidden bg-white dark:bg-gray-900">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-medical-blue/10 to-transparent border-b border-border-light dark:border-border-dark">
            <h3 className="text-base font-bold text-text-light dark:text-text-dark flex items-center gap-2">
              <span className="material-symbols-outlined text-medical-blue">menu_book</span>
              Key Medical Sources
            </h3>
            <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark mt-0.5">
              Peer-reviewed research and regulatory documents
            </p>
          </div>

          {/* Sources Grid - Cards on desktop, stacked on mobile */}
          <div className="p-3 md:p-4 space-y-3 md:space-y-0 md:grid md:grid-cols-2 md:gap-3 lg:grid-cols-1 lg:gap-4">
            {sources.slice(0, 5).map((source) => (
              <div 
                key={source.id} 
                className="p-3 md:p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 hover:border-medical-blue/50 transition-colors"
              >
                {/* Source Type Badge & Title Row */}
                <div className="flex items-start gap-2 mb-2">
                  <span className={`shrink-0 px-2 py-1 rounded text-xs font-bold uppercase tracking-wide
                    ${source.sourceType === 'fda' ? 'bg-medical-blue text-white' : ''}
                    ${source.sourceType === 'pubmed' ? 'bg-success-green text-white' : ''}
                    ${source.sourceType === 'case_report' ? 'bg-purple-600 text-white' : ''}
                    ${source.sourceType === 'fssai' ? 'bg-warning-amber text-white' : ''}
                    ${source.sourceType === 'wada' ? 'bg-alert-red text-white' : ''}
                  `}>
                    {source.sourceType === 'case_report' ? 'CASE REPORT' : source.sourceType.toUpperCase()}
                  </span>
                </div>
                
                {/* Title */}
                <a 
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm md:text-base font-semibold text-text-light dark:text-text-dark hover:text-medical-blue transition-colors leading-snug"
                >
                  {source.title}
                </a>
                
                {/* Authority & Date */}
                <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark mt-1.5 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">apartment</span>
                  {source.authority}
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  {source.date}
                </p>
                
                {/* Key Quote */}
                <blockquote className="mt-3 pl-3 border-l-2 border-medical-blue/40 text-xs md:text-sm text-text-subtle-light dark:text-text-subtle-dark italic leading-relaxed">
                  &ldquo;{source.keyQuote}&rdquo;
                </blockquote>
              </div>
            ))}
          </div>
          
          {/* Footer - Review Date */}
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/30 border-t border-border-light dark:border-border-dark flex items-center justify-between">
            <div className="text-xs text-text-subtle-light dark:text-text-subtle-dark flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-success-green">verified</span>
              Content last reviewed: <span className="font-medium">{modifiedDate}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
