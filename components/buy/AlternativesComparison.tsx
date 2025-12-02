/**
 * AlternativesComparison Component
 * 
 * Displays legal alternatives in a comparison table format.
 * Optimized for conversion with prominent CTAs and trust signals.
 */

import React from 'react';
import type { AlternativeProduct } from '@/types';

interface AlternativesComparisonProps {
  alternatives: AlternativeProduct[];
  substanceName?: string;
}

export default function AlternativesComparison({ alternatives, substanceName = 'DMAA' }: AlternativesComparisonProps) {
  // Sort by tier priority and whether it's a top pick
  const sortedAlternatives = [...alternatives].sort((a, b) => {
    if (a.isTopPick && !b.isTopPick) return -1;
    if (!a.isTopPick && b.isTopPick) return 1;
    return b.effectScore - a.effectScore;
  });

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case 'preworkout': return 'Pre-Workout';
      case 'ayurvedic': return 'Ayurvedic';
      case 'nootropic': return 'Nootropic';
      case 'sarms_alternative': return 'SARMs Alternative';
      default: return tier;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'preworkout': return 'bg-primary/20 text-primary';
      case 'ayurvedic': return 'bg-success-green/20 text-success-green';
      case 'nootropic': return 'bg-medical-blue/20 text-medical-blue';
      case 'sarms_alternative': return 'bg-warning-amber/20 text-warning-amber';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="my-6" id="legal-alternatives">
      {/* Top Pick Highlight */}
      {sortedAlternatives.filter(a => a.isTopPick).length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-text-light dark:text-text-dark mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-success-green">verified</span>
            Top Picks - Editor&apos;s Choice
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {sortedAlternatives.filter(a => a.isTopPick).map(product => (
              <div 
                key={product.id}
                id={product.isTopPick ? 'top-pick' : undefined}
                className="p-5 bg-gradient-to-br from-success-green-light to-primary/10 dark:from-success-green-dark/30 dark:to-primary/20 rounded-xl border-2 border-success-green/30"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded mb-2 ${getTierColor(product.tier)}`}>
                      {getTierLabel(product.tier)}
                    </span>
                    <h4 className="font-bold text-text-light dark:text-text-dark">{product.name}</h4>
                    <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark">{product.brand}</p>
                  </div>
                  <span className="px-2 py-1 bg-success-green text-white text-xs font-bold rounded">
                    TOP PICK
                  </span>
                </div>

                {/* Key Stats */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center p-2 bg-white/60 dark:bg-gray-800/60 rounded">
                    <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark">Price</p>
                    <p className="font-bold text-text-light dark:text-text-dark">₹{product.price.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="text-center p-2 bg-white/60 dark:bg-gray-800/60 rounded">
                    <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark">Effect</p>
                    <p className="font-bold text-success-green">{product.effectScore}/10</p>
                  </div>
                  <div className="text-center p-2 bg-white/60 dark:bg-gray-800/60 rounded">
                    <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark">Rating</p>
                    <p className="font-bold text-warning-amber">★ {product.rating}</p>
                  </div>
                </div>

                {/* Pros */}
                <ul className="space-y-1 mb-3">
                  {product.pros.slice(0, 3).map((pro, i) => (
                    <li key={i} className="text-sm text-text-subtle-light dark:text-text-subtle-dark flex items-center gap-2">
                      <span className="text-success-green">✓</span>
                      {pro}
                    </li>
                  ))}
                </ul>

                {/* Trust Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="flex items-center gap-1 text-xs text-success-green bg-success-green/10 px-2 py-1 rounded">
                    <span className="material-symbols-outlined text-sm">gavel</span>
                    100% Legal
                  </span>
                  {product.hasCOD && (
                    <span className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-1 rounded">
                      <span className="material-symbols-outlined text-sm">payments</span>
                      COD Available
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-xs text-medical-blue bg-medical-blue/10 px-2 py-1 rounded">
                    <span className="material-symbols-outlined text-sm">local_shipping</span>
                    {product.deliveryDays}
                  </span>
                </div>

                {/* CTA */}
                <a
                  href={product.whereToBuy[0] || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center py-3 px-4 bg-success-green hover:bg-success-green-dark text-white font-bold rounded-lg transition-colors"
                >
                  Buy Now {product.hasCOD ? 'with COD' : ''} →
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Alternatives Table */}
      <h3 className="text-lg font-bold text-text-light dark:text-text-dark mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">compare</span>
        All Legal Alternatives Comparison
      </h3>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800">
              <th className="p-3 text-left font-medium text-text-light dark:text-text-dark">Product</th>
              <th className="p-3 text-center font-medium text-text-light dark:text-text-dark">Type</th>
              <th className="p-3 text-center font-medium text-text-light dark:text-text-dark">Effect vs {substanceName}</th>
              <th className="p-3 text-center font-medium text-text-light dark:text-text-dark">Price</th>
              <th className="p-3 text-center font-medium text-text-light dark:text-text-dark">COD</th>
              <th className="p-3 text-center font-medium text-text-light dark:text-text-dark">Rating</th>
              <th className="p-3 text-center font-medium text-text-light dark:text-text-dark">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light dark:divide-border-dark">
            {sortedAlternatives.map(product => (
              <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    {product.isTopPick && (
                      <span className="material-symbols-outlined text-success-green text-base">verified</span>
                    )}
                    <div>
                      <p className="font-medium text-text-light dark:text-text-dark">{product.name}</p>
                      <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark">{product.brand}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-center">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded ${getTierColor(product.tier)}`}>
                    {getTierLabel(product.tier)}
                  </span>
                </td>
                <td className="p-3 text-center">
                  <span className={`font-bold ${product.effectScore >= 7 ? 'text-success-green' : product.effectScore >= 5 ? 'text-warning-amber' : 'text-gray-500'}`}>
                    {product.effectScore * 10}%
                  </span>
                </td>
                <td className="p-3 text-center font-medium text-text-light dark:text-text-dark">
                  ₹{product.price.toLocaleString('en-IN')}
                </td>
                <td className="p-3 text-center">
                  {product.hasCOD ? (
                    <span className="text-success-green">✓</span>
                  ) : (
                    <span className="text-gray-400">✗</span>
                  )}
                </td>
                <td className="p-3 text-center">
                  <span className="text-warning-amber">★ {product.rating}</span>
                </td>
                <td className="p-3 text-center">
                  <a
                    href={product.whereToBuy[0] || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary hover:bg-primary-darker text-white text-xs font-medium rounded transition-colors"
                  >
                    Buy
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {sortedAlternatives.filter(a => !a.isTopPick).map(product => (
          <div key={product.id} className="p-4 bg-card-light dark:bg-card-dark rounded-lg border border-border-light dark:border-border-dark">
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded mb-1 ${getTierColor(product.tier)}`}>
                  {getTierLabel(product.tier)}
                </span>
                <h4 className="font-medium text-text-light dark:text-text-dark">{product.name}</h4>
                <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark">{product.brand}</p>
              </div>
              <span className="text-lg font-bold text-text-light dark:text-text-dark">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-3 text-sm">
                <span className="text-success-green font-medium">{product.effectScore * 10}% effect</span>
                <span className="text-warning-amber">★ {product.rating}</span>
                {product.hasCOD && <span className="text-primary">COD ✓</span>}
              </div>
              <a
                href={product.whereToBuy[0] || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-primary text-white text-sm font-medium rounded"
              >
                Buy →
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
