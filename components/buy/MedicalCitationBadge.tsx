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
  // Open by default so users see sources immediately
  const [showSources, setShowSources] = useState(true);

  // Group sources by type for accurate counting
  const nihSources = sources.filter(s => s.sourceType === 'nih' || s.sourceType === 'government').length;
  const pubmedSources = sources.filter(s => s.sourceType === 'pubmed').length;
  const systematicReviews = sources.filter(s => s.sourceType === 'systematic_review').length;
  const clinicalStudies = sources.filter(s => s.sourceType === 'clinical').length;
  const reviews = sources.filter(s => s.sourceType === 'review').length;
  const newsSources = sources.filter(s => s.sourceType === 'news').length;
  const fdaSources = sources.filter(s => s.sourceType === 'fda' || s.sourceType === 'fssai').length;
  const caseReports = sources.filter(s => s.sourceType === 'case_report').length;
  const regulatorySources = sources.filter(s => s.sourceType === 'wada' || s.sourceType === 'regulatory' || s.sourceType === 'who').length;

  // Helper function to format source type for display (removes underscores)
  const formatSourceType = (sourceType: string): string => {
    const formatMap: Record<string, string> = {
      'case_report': 'Case Report',
      'systematic_review': 'Systematic Review',
      'nih': 'NIH',
      'fda': 'FDA',
      'fssai': 'FSSAI',
      'wada': 'WADA',
      'who': 'WHO',
      'pubmed': 'PubMed',
      'clinical': 'Clinical Study',
      'review': 'Review',
      'news': 'News',
      'regulatory': 'Regulatory',
      'government': 'Government',
    };
    return formatMap[sourceType] || sourceType.replace(/_/g, ' ').toUpperCase();
  };

  // Helper function to get badge color for each source type
  const getSourceBadgeColor = (sourceType: string): string => {
    const colorMap: Record<string, string> = {
      'fda': 'bg-medical-blue text-white',
      'fssai': 'bg-medical-blue text-white',
      'nih': 'bg-teal-600 text-white',
      'government': 'bg-teal-600 text-white',
      'pubmed': 'bg-success-green text-white',
      'systematic_review': 'bg-indigo-600 text-white',
      'clinical': 'bg-blue-600 text-white',
      'review': 'bg-cyan-600 text-white',
      'case_report': 'bg-purple-600 text-white',
      'wada': 'bg-alert-red text-white',
      'who': 'bg-sky-600 text-white',
      'regulatory': 'bg-warning-amber text-white',
      'news': 'bg-gray-600 text-white',
    };
    return colorMap[sourceType] || 'bg-gray-500 text-white';
  };

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

        {/* Source Breakdown - Shows accurate count per category */}
        <div className="flex flex-wrap gap-2 ml-auto">
          {nihSources > 0 && (
            <span className="px-2 py-1 bg-teal-600/10 dark:bg-teal-500/20 rounded text-xs font-medium text-teal-700 dark:text-teal-300 border border-teal-600/30 dark:border-teal-400/40">
              {nihSources} NIH
            </span>
          )}
          {pubmedSources > 0 && (
            <span className="px-2 py-1 bg-success-green/10 dark:bg-success-green/20 rounded text-xs font-medium text-success-green dark:text-green-300 border border-success-green/30 dark:border-green-400/40">
              {pubmedSources} PubMed
            </span>
          )}
          {systematicReviews > 0 && (
            <span className="px-2 py-1 bg-indigo-600/10 dark:bg-indigo-500/20 rounded text-xs font-medium text-indigo-700 dark:text-indigo-300 border border-indigo-600/30 dark:border-indigo-400/40">
              {systematicReviews} Systematic Review{systematicReviews > 1 ? 's' : ''}
            </span>
          )}
          {clinicalStudies > 0 && (
            <span className="px-2 py-1 bg-blue-600/10 dark:bg-blue-500/20 rounded text-xs font-medium text-blue-700 dark:text-blue-300 border border-blue-600/30 dark:border-blue-400/40">
              {clinicalStudies} Clinical{clinicalStudies > 1 ? ' Studies' : ' Study'}
            </span>
          )}
          {reviews > 0 && (
            <span className="px-2 py-1 bg-cyan-600/10 dark:bg-cyan-500/20 rounded text-xs font-medium text-cyan-700 dark:text-cyan-300 border border-cyan-600/30 dark:border-cyan-400/40">
              {reviews} Review{reviews > 1 ? 's' : ''}
            </span>
          )}
          {newsSources > 0 && (
            <span className="px-2 py-1 bg-gray-500/10 dark:bg-gray-500/20 rounded text-xs font-medium text-gray-700 dark:text-gray-300 border border-gray-400/30 dark:border-gray-500/40">
              {newsSources} News
            </span>
          )}
          {fdaSources > 0 && (
            <span className="px-2 py-1 bg-medical-blue/10 dark:bg-sky-500/20 rounded text-xs font-medium text-medical-blue dark:text-sky-300 border border-medical-blue/30 dark:border-sky-400/40">
              {fdaSources} FDA/FSSAI
            </span>
          )}
          {caseReports > 0 && (
            <span className="px-2 py-1 bg-purple-600/10 dark:bg-purple-500/20 rounded text-xs font-medium text-purple-700 dark:text-purple-300 border border-purple-600/30 dark:border-purple-400/40">
              {caseReports} Case Report{caseReports > 1 ? 's' : ''}
            </span>
          )}
          {regulatorySources > 0 && (
            <span className="px-2 py-1 bg-warning-amber/10 dark:bg-amber-500/20 rounded text-xs font-medium text-warning-amber dark:text-amber-300 border border-warning-amber/30 dark:border-amber-400/40">
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

          {/* Sources Grid - Cards on desktop, stacked on mobile - Full display for trust */}
          <div className="p-3 md:p-4 space-y-3">
            {sources.map((source) => (
              <div 
                key={source.id} 
                className="p-3 md:p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 hover:border-medical-blue/50 transition-colors"
              >
                {/* Source Type Badge & Title Row */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className={`shrink-0 px-2 py-1 rounded text-xs font-bold uppercase tracking-wide ${getSourceBadgeColor(source.sourceType)}`}>
                    {formatSourceType(source.sourceType)}
                  </span>
                  
                  {/* View Source Button */}
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                    View Source
                  </a>
                </div>
                
                {/* Title */}
                <h4 className="text-sm md:text-base font-semibold text-text-light dark:text-text-dark leading-snug">
                  {source.title}
                </h4>
                
                {/* Authority & Date */}
                <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark mt-1.5 flex items-center gap-1.5 flex-wrap">
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
