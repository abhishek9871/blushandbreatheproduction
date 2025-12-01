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

      {/* Expanded Sources List */}
      {showSources && (
        <div className="mt-2 p-4 bg-card-light dark:bg-card-dark rounded-lg border border-border-light dark:border-border-dark">
          <h3 className="text-sm font-bold text-text-light dark:text-text-dark mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-medical-blue">menu_book</span>
            Key Medical Sources
          </h3>
          <ul className="space-y-3">
            {sources.slice(0, 5).map((source, index) => (
              <li key={source.id} className="text-sm">
                <div className="flex items-start gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium 
                    ${source.sourceType === 'fda' ? 'bg-medical-blue-light text-medical-blue' : ''}
                    ${source.sourceType === 'pubmed' || source.sourceType === 'case_report' ? 'bg-success-green-light text-success-green' : ''}
                    ${source.sourceType === 'fssai' ? 'bg-warning-amber-light text-warning-amber' : ''}
                    ${source.sourceType === 'wada' ? 'bg-alert-red-light text-alert-red' : ''}
                  `}>
                    {source.sourceType.toUpperCase()}
                  </span>
                  <div className="flex-1">
                    <a 
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-text-light dark:text-text-dark font-medium hover:text-primary"
                    >
                      {source.title}
                    </a>
                    <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark mt-0.5">
                      {source.authority} • {source.date}
                    </p>
                    <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark mt-1 italic">
                      &ldquo;{source.keyQuote}&rdquo;
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          
          {/* Review Date */}
          <div className="mt-4 pt-3 border-t border-border-light dark:border-border-dark text-xs text-text-subtle-light dark:text-text-subtle-dark">
            <span className="material-symbols-outlined text-base align-middle mr-1">update</span>
            Content last reviewed: {modifiedDate}
          </div>
        </div>
      )}
    </div>
  );
}
