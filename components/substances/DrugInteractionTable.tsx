/**
 * DrugInteractionTable Component
 * 
 * Displays drug interaction information in a clear, scannable table format.
 * Includes severity indicators and management recommendations.
 */

import React, { useState } from 'react';
import type { DrugInteraction, InteractionSeverity } from '@/types';

interface DrugInteractionTableProps {
  interactions: DrugInteraction[];
  drugName?: string;
  showSearch?: boolean;
  className?: string;
}

// Severity styling
const severityConfig: Record<InteractionSeverity, {
  bg: string;
  text: string;
  border: string;
  icon: string;
  label: string;
}> = {
  contraindicated: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-800 dark:text-red-300',
    border: 'border-red-300 dark:border-red-700',
    icon: 'block',
    label: 'Contraindicated',
  },
  major: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-800 dark:text-orange-300',
    border: 'border-orange-300 dark:border-orange-700',
    icon: 'warning',
    label: 'Major',
  },
  moderate: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-800 dark:text-yellow-300',
    border: 'border-yellow-300 dark:border-yellow-700',
    icon: 'info',
    label: 'Moderate',
  },
  minor: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-800 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-700',
    icon: 'help',
    label: 'Minor',
  },
};

// Severity sort order (most severe first)
const severityOrder: Record<InteractionSeverity, number> = {
  contraindicated: 0,
  major: 1,
  moderate: 2,
  minor: 3,
};

export const DrugInteractionTable: React.FC<DrugInteractionTableProps> = ({
  interactions,
  drugName,
  showSearch = true,
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<InteractionSeverity | 'all'>('all');

  // Filter and sort interactions
  const filteredInteractions = interactions
    .filter((interaction) => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesDrugA = interaction.drugA.name.toLowerCase().includes(search);
        const matchesDrugB = interaction.drugB.name.toLowerCase().includes(search);
        const matchesDesc = interaction.description.toLowerCase().includes(search);
        if (!matchesDrugA && !matchesDrugB && !matchesDesc) return false;
      }
      
      // Severity filter
      if (filterSeverity !== 'all' && interaction.severity !== filterSeverity) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  // Count by severity
  const severityCounts = interactions.reduce((acc, interaction) => {
    acc[interaction.severity] = (acc[interaction.severity] || 0) + 1;
    return acc;
  }, {} as Record<InteractionSeverity, number>);

  if (interactions.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <span className="material-symbols-outlined text-4xl text-green-500 mb-2">
          check_circle
        </span>
        <p className="text-text-light dark:text-text-dark font-medium">
          No Known Interactions
        </p>
        <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark">
          {drugName ? `No drug interactions found for ${drugName}` : 'No interactions to display'}
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header with stats */}
      <div className="mb-4">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <h3 className="text-lg font-semibold text-text-light dark:text-text-dark">
            Drug Interactions
            {drugName && <span className="font-normal"> for {drugName}</span>}
          </h3>
          <span className="text-sm text-text-subtle-light dark:text-text-subtle-dark">
            ({interactions.length} found)
          </span>
        </div>

        {/* Severity summary badges */}
        <div className="flex flex-wrap gap-2">
          {(Object.keys(severityConfig) as InteractionSeverity[]).map((severity) => {
            const count = severityCounts[severity] || 0;
            if (count === 0) return null;
            const config = severityConfig[severity];
            return (
              <button
                key={severity}
                onClick={() => setFilterSeverity(filterSeverity === severity ? 'all' : severity)}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${
                  filterSeverity === severity 
                    ? `${config.bg} ${config.text} ring-2 ring-offset-1 ${config.border}` 
                    : `${config.bg} ${config.text} opacity-70 hover:opacity-100`
                }`}
              >
                <span className="material-symbols-outlined text-sm">{config.icon}</span>
                {config.label}: {count}
              </button>
            );
          })}
          {filterSeverity !== 'all' && (
            <button
              onClick={() => setFilterSeverity('all')}
              className="text-xs text-primary hover:underline"
            >
              Clear filter
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      {showSearch && interactions.length > 5 && (
        <div className="mb-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              search
            </span>
            <input
              type="text"
              placeholder="Search interactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-card-dark text-text-light dark:text-text-dark placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Interactions list */}
      <div className="space-y-3">
        {filteredInteractions.map((interaction) => {
          const config = severityConfig[interaction.severity];
          const isExpanded = expandedId === interaction.id;
          
          // Determine which drug to highlight (if drugName is provided)
          const otherDrug = drugName
            ? interaction.drugA.name.toLowerCase() === drugName.toLowerCase()
              ? interaction.drugB
              : interaction.drugA
            : null;

          return (
            <div
              key={interaction.id}
              className={`rounded-lg border ${config.border} overflow-hidden`}
            >
              {/* Header row */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : interaction.id)}
                className={`w-full flex items-center gap-3 p-3 ${config.bg} hover:opacity-90 transition-opacity`}
              >
                {/* Severity indicator */}
                <span className={`material-symbols-outlined ${config.text}`}>
                  {config.icon}
                </span>

                {/* Drug names */}
                <div className="flex-1 text-left">
                  {otherDrug ? (
                    <span className={`font-medium ${config.text}`}>
                      Interacts with: <strong>{otherDrug.name}</strong>
                    </span>
                  ) : (
                    <span className={`font-medium ${config.text}`}>
                      {interaction.drugA.name} + {interaction.drugB.name}
                    </span>
                  )}
                </div>

                {/* Severity badge */}
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${config.text} bg-white/50 dark:bg-black/20`}>
                  {config.label}
                </span>

                {/* Expand icon */}
                <span className={`material-symbols-outlined ${config.text} transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="p-4 bg-white dark:bg-card-dark border-t border-border-light dark:border-border-dark">
                  {/* Description */}
                  <div className="mb-4">
                    <h5 className="text-sm font-semibold text-text-light dark:text-text-dark mb-1">
                      Description
                    </h5>
                    <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark">
                      {interaction.description || 'No detailed description available.'}
                    </p>
                  </div>

                  {/* Mechanism */}
                  {interaction.mechanism && (
                    <div className="mb-4">
                      <h5 className="text-sm font-semibold text-text-light dark:text-text-dark mb-1">
                        Mechanism
                      </h5>
                      <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark">
                        {interaction.mechanism}
                      </p>
                    </div>
                  )}

                  {/* Clinical Effects */}
                  {interaction.clinicalEffects && interaction.clinicalEffects.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-sm font-semibold text-text-light dark:text-text-dark mb-1">
                        Clinical Effects
                      </h5>
                      <ul className="list-disc list-inside text-sm text-text-subtle-light dark:text-text-subtle-dark">
                        {interaction.clinicalEffects.map((effect, i) => (
                          <li key={i}>{effect}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Management */}
                  {interaction.management && (
                    <div className="mb-4">
                      <h5 className="text-sm font-semibold text-text-light dark:text-text-dark mb-1">
                        Management
                      </h5>
                      <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark">
                        {interaction.management}
                      </p>
                    </div>
                  )}

                  {/* Sources */}
                  {interaction.sources && interaction.sources.length > 0 && (
                    <div className="pt-3 border-t border-border-light dark:border-border-dark">
                      <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark">
                        <strong>Sources:</strong> {interaction.sources.join(', ')}
                      </p>
                      <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark mt-1">
                        <strong>Last verified:</strong> {new Date(interaction.lastVerified).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* No results message */}
      {filteredInteractions.length === 0 && (searchTerm || filterSeverity !== 'all') && (
        <div className="text-center py-6">
          <span className="material-symbols-outlined text-3xl text-gray-400 mb-2">
            search_off
          </span>
          <p className="text-text-subtle-light dark:text-text-subtle-dark">
            No interactions match your filters
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterSeverity('all');
            }}
            className="text-primary text-sm hover:underline mt-2"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark">
          <span className="material-symbols-outlined text-sm align-middle mr-1">info</span>
          Drug interaction data is sourced from RxNorm and other medical databases. 
          This information is for educational purposes only. Always consult your healthcare 
          provider or pharmacist for personalized advice about drug interactions.
        </p>
      </div>
    </div>
  );
};

export default DrugInteractionTable;
