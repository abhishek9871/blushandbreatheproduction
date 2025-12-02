/**
 * EffectComparisonChart Component
 * 
 * Visual comparison of effects and side effects between
 * banned substances and legal alternatives. Uses bar charts for clarity.
 * Supports both DMAA and Clenbuterol pages dynamically.
 */

import React, { useState } from 'react';
import type { EffectComparison, SideEffectComparison } from '@/types';

interface SubstanceConfig {
  key: string;
  label: string;
  color: string;
  textColor: string;
}

interface EffectComparisonChartProps {
  effects: EffectComparison[];
  sideEffects: SideEffectComparison[];
  substanceType?: 'dmaa' | 'clenbuterol';
}

export default function EffectComparisonChart({ effects, sideEffects, substanceType }: EffectComparisonChartProps) {
  // Auto-detect substance type from effect data if not provided
  const detectedType = substanceType || (effects[0] && 'clenbuterol' in effects[0] ? 'clenbuterol' : 'dmaa');
  
  // Configure substances based on type
  const getSubstanceConfigs = (): SubstanceConfig[] => {
    if (detectedType === 'clenbuterol') {
      return [
        { key: 'clenbuterol', label: 'Clenbuterol', color: 'bg-alert-red', textColor: 'text-alert-red' },
        { key: 'natural', label: 'Natural Stack', color: 'bg-success-green', textColor: 'text-success-green' }
      ];
    }
    return [
      { key: 'dmaa', label: 'DMAA', color: 'bg-alert-red', textColor: 'text-alert-red' },
      { key: 'dmha', label: 'DMHA', color: 'bg-warning-amber', textColor: 'text-warning-amber' },
      { key: 'natural', label: 'Natural Stack', color: 'bg-success-green', textColor: 'text-success-green' }
    ];
  };

  const substances = getSubstanceConfigs();
  const [activeTab, setActiveTab] = useState<'effects' | 'sideEffects'>('effects');

  const getSeverityColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-alert-red';
      case 'moderate': return 'bg-warning-amber';
      case 'low': return 'bg-success-green/70';
      case 'none': return 'bg-success-green';
      default: return 'bg-gray-300';
    }
  };

  const getSeverityWidth = (level: string) => {
    switch (level) {
      case 'high': return 'w-full';
      case 'moderate': return 'w-2/3';
      case 'low': return 'w-1/3';
      case 'none': return 'w-1';
      default: return 'w-0';
    }
  };

  return (
    <div className="my-6 p-4 bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark">
      {/* Tab Selector */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('effects')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'effects'
              ? 'bg-primary text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-text-subtle-light dark:text-text-subtle-dark hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <span className="material-symbols-outlined text-base align-middle mr-1">trending_up</span>
          Effects Comparison
        </button>
        <button
          onClick={() => setActiveTab('sideEffects')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'sideEffects'
              ? 'bg-alert-red text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-text-subtle-light dark:text-text-subtle-dark hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <span className="material-symbols-outlined text-base align-middle mr-1">warning</span>
          Side Effects Risk
        </button>
      </div>

      {/* Effects Tab */}
      {activeTab === 'effects' && (
        <div className="space-y-4">
          <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark mb-4">
            Comparison of desired effects (1-10 scale, higher is better)
          </p>
          
          {effects.map((effect, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between text-sm font-medium text-text-light dark:text-text-dark">
                <span>{effect.effect}</span>
              </div>
              
              {/* Dynamic Substance Bars */}
              {substances.map((substance) => {
                const value = (effect as unknown as Record<string, number>)[substance.key] || 0;
                return (
                  <div key={substance.key} className="flex items-center gap-2">
                    <span className="w-24 text-xs text-text-subtle-light dark:text-text-subtle-dark">{substance.label}</span>
                    <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                      <div 
                        className={`h-full ${substance.color} transition-all duration-500`}
                        style={{ width: `${value * 10}%` }}
                      />
                    </div>
                    <span className={`w-8 text-xs text-right font-medium ${substance.textColor}`}>{value}</span>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Dynamic Legend */}
          <div className="flex flex-wrap gap-4 pt-4 border-t border-border-light dark:border-border-dark">
            {substances.map((substance) => (
              <div key={substance.key} className="flex items-center gap-2 text-xs">
                <span className={`w-3 h-3 ${substance.color} rounded`}></span>
                <span className="text-text-subtle-light dark:text-text-subtle-dark">
                  {substance.label} {substance.key === 'natural' ? '(Safest)' : substance.key === 'clenbuterol' || substance.key === 'dmaa' ? '(Banned)' : '(Legal Alternative)'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Side Effects Tab */}
      {activeTab === 'sideEffects' && (
        <div className="space-y-4">
          <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark mb-4">
            Side effect risk levels (lower is better)
          </p>
          
          {sideEffects.map((effect, index) => (
            <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded">
              <div className="font-medium text-text-light dark:text-text-dark mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-alert-red">warning</span>
                {effect.effect}
              </div>
              
              <div className={`grid gap-3 ${substances.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {/* Dynamic Side Effect Bars */}
                {substances.map((substance) => {
                  const level = (effect as unknown as Record<string, string>)[substance.key] || 'none';
                  return (
                    <div key={substance.key}>
                      <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark mb-1">{substance.label}</p>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                        <div className={`h-full ${getSeverityColor(level)} ${getSeverityWidth(level)}`} />
                      </div>
                      <p className={`text-xs mt-1 capitalize ${
                        level === 'high' ? 'text-alert-red' :
                        level === 'moderate' ? 'text-warning-amber' :
                        'text-success-green'
                      }`}>{level}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Summary */}
          <div className="p-3 bg-success-green-light dark:bg-success-green-dark/30 rounded border border-success-green/30">
            <p className="text-sm text-success-green font-medium flex items-center gap-2">
              <span className="material-symbols-outlined">check_circle</span>
              Natural alternatives have zero documented serious side effects
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
