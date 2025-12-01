/**
 * EffectComparisonChart Component
 * 
 * Visual comparison of effects and side effects between
 * DMAA and legal alternatives. Uses bar charts for clarity.
 */

import React, { useState } from 'react';
import type { EffectComparison, SideEffectComparison } from '@/types';

interface EffectComparisonChartProps {
  effects: EffectComparison[];
  sideEffects: SideEffectComparison[];
}

export default function EffectComparisonChart({ effects, sideEffects }: EffectComparisonChartProps) {
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
              
              {/* DMAA Bar */}
              <div className="flex items-center gap-2">
                <span className="w-24 text-xs text-text-subtle-light dark:text-text-subtle-dark">DMAA</span>
                <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                  <div 
                    className="h-full bg-alert-red transition-all duration-500"
                    style={{ width: `${effect.dmaa * 10}%` }}
                  />
                </div>
                <span className="w-8 text-xs text-right font-medium text-alert-red">{effect.dmaa}</span>
              </div>

              {/* DMHA Bar */}
              <div className="flex items-center gap-2">
                <span className="w-24 text-xs text-text-subtle-light dark:text-text-subtle-dark">DMHA</span>
                <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                  <div 
                    className="h-full bg-warning-amber transition-all duration-500"
                    style={{ width: `${effect.dmha * 10}%` }}
                  />
                </div>
                <span className="w-8 text-xs text-right font-medium text-warning-amber">{effect.dmha}</span>
              </div>

              {/* Natural Stack Bar */}
              <div className="flex items-center gap-2">
                <span className="w-24 text-xs text-text-subtle-light dark:text-text-subtle-dark">Natural</span>
                <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                  <div 
                    className="h-full bg-success-green transition-all duration-500"
                    style={{ width: `${effect.natural * 10}%` }}
                  />
                </div>
                <span className="w-8 text-xs text-right font-medium text-success-green">{effect.natural}</span>
              </div>
            </div>
          ))}

          {/* Legend */}
          <div className="flex flex-wrap gap-4 pt-4 border-t border-border-light dark:border-border-dark">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-3 h-3 bg-alert-red rounded"></span>
              <span className="text-text-subtle-light dark:text-text-subtle-dark">DMAA (Banned)</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-3 h-3 bg-warning-amber rounded"></span>
              <span className="text-text-subtle-light dark:text-text-subtle-dark">DMHA (Legal Alternative)</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-3 h-3 bg-success-green rounded"></span>
              <span className="text-text-subtle-light dark:text-text-subtle-dark">Natural Stack (Safest)</span>
            </div>
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
              
              <div className="grid grid-cols-3 gap-3">
                {/* DMAA */}
                <div>
                  <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark mb-1">DMAA</p>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                    <div className={`h-full ${getSeverityColor(effect.dmaa)} ${getSeverityWidth(effect.dmaa)}`} />
                  </div>
                  <p className={`text-xs mt-1 capitalize ${
                    effect.dmaa === 'high' ? 'text-alert-red' :
                    effect.dmaa === 'moderate' ? 'text-warning-amber' :
                    'text-success-green'
                  }`}>{effect.dmaa}</p>
                </div>

                {/* DMHA */}
                <div>
                  <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark mb-1">DMHA</p>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                    <div className={`h-full ${getSeverityColor(effect.dmha)} ${getSeverityWidth(effect.dmha)}`} />
                  </div>
                  <p className={`text-xs mt-1 capitalize ${
                    effect.dmha === 'high' ? 'text-alert-red' :
                    effect.dmha === 'moderate' ? 'text-warning-amber' :
                    'text-success-green'
                  }`}>{effect.dmha}</p>
                </div>

                {/* Natural */}
                <div>
                  <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark mb-1">Natural</p>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                    <div className={`h-full ${getSeverityColor(effect.natural)} ${getSeverityWidth(effect.natural)}`} />
                  </div>
                  <p className={`text-xs mt-1 capitalize ${
                    effect.natural === 'high' ? 'text-alert-red' :
                    effect.natural === 'moderate' ? 'text-warning-amber' :
                    'text-success-green'
                  }`}>{effect.natural}</p>
                </div>
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
