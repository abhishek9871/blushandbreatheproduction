/**
 * RiskCalculator Component
 * 
 * Interactive DMAA Import Risk Calculator for India.
 * Calculates seizure probability and potential penalties based on
 * port, value, declaration type, courier, and quantity.
 * 
 * Implements SoftwareApplication schema for SEO.
 */

import React, { useState, useCallback } from 'react';
import type { CalculatorConfig } from '@/types';

interface RiskCalculatorProps {
  config: CalculatorConfig;
  onCalculate?: (result: CalculatorResult) => void;
  substanceName?: string;
}

interface CalculatorResult {
  riskPercentage: number;
  riskLevel: 'low' | 'moderate' | 'high' | 'extreme';
  penaltyMin: number;
  penaltyMax: number;
  breakdown: {
    portRisk: number;
    valueRisk: number;
    declarationRisk: number;
    courierRisk: number;
    quantityBonus: number;
  };
  recommendations: string[];
}

export default function RiskCalculator({
  config,
  onCalculate,
  substanceName = 'DMAA',
}: RiskCalculatorProps) {
  const [port, setPort] = useState('');
  const [orderValue, setOrderValue] = useState('');
  const [declaration, setDeclaration] = useState('');
  const [courier, setCourier] = useState('');
  const [quantity, setQuantity] = useState('');
  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const calculateRisk = useCallback(() => {
    if (!port || !orderValue || !declaration || !courier || !quantity) {
      return;
    }

    setIsCalculating(true);

    // Simulate calculation delay for UX
    setTimeout(() => {
      const value = parseFloat(orderValue);
      const qty = parseFloat(quantity);

      // Get risk values
      const portData = config.ports.find(p => p.code === port);
      const portRisk = portData?.seizureRate || 30;

      // Find value tier
      const valueTier = config.valueTiers.find(
        t => value >= t.minValue && value < t.maxValue
      );
      const valueRisk = valueTier?.seizureRate || 40;

      const declarationData = config.declarations.find(d => d.type === declaration);
      const declarationRisk = declarationData?.seizureRate || 35;

      const courierData = config.couriers.find(c => c.name === courier);
      const courierRisk = courierData?.seizureRate || 35;

      const quantityBonus = qty > config.quantityThreshold ? config.quantityRiskBonus : 0;

      // Calculate weighted risk
      const totalRisk = Math.min(100,
        (portRisk * 0.25) +
        (valueRisk * 0.25) +
        (declarationRisk * 0.20) +
        (courierRisk * 0.15) +
        (quantityBonus * 0.15)
      );

      // Determine risk level
      let riskLevel: CalculatorResult['riskLevel'];
      if (totalRisk < 25) riskLevel = 'low';
      else if (totalRisk < 45) riskLevel = 'moderate';
      else if (totalRisk < 65) riskLevel = 'high';
      else riskLevel = 'extreme';

      // Calculate penalties
      const basePenalty = value;
      const penaltyMin = Math.round(basePenalty * 1.0 + (qty > 100 ? 50000 : 0));
      const penaltyMax = Math.round(basePenalty * 2.0 + (qty > 100 ? 100000 : 10000));

      // Generate recommendations
      const recommendations: string[] = [];
      if (totalRisk > 40) {
        recommendations.push('Consider legal alternatives with zero customs risk');
      }
      if (portRisk > 40) {
        recommendations.push(`${portData?.name} has high seizure rates - Delhi may be safer`);
      }
      if (qty > 100) {
        recommendations.push('Orders over 100g are flagged as commercial quantity');
      }
      if (value > 20000) {
        recommendations.push('High-value orders trigger mandatory inspection');
      }
      recommendations.push('Legal pre-workouts offer COD and 1-3 day delivery');

      const calculatedResult: CalculatorResult = {
        riskPercentage: Math.round(totalRisk),
        riskLevel,
        penaltyMin,
        penaltyMax,
        breakdown: {
          portRisk,
          valueRisk,
          declarationRisk,
          courierRisk,
          quantityBonus,
        },
        recommendations,
      };

      setResult(calculatedResult);
      setIsCalculating(false);
      
      if (onCalculate) {
        onCalculate(calculatedResult);
      }
    }, 500);
  }, [port, orderValue, declaration, courier, quantity, config, onCalculate]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-success-green';
      case 'moderate': return 'text-warning-amber';
      case 'high': return 'text-orange-500';
      case 'extreme': return 'text-alert-red';
      default: return 'text-gray-500';
    }
  };

  const getRiskBgColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-success-green-light dark:bg-success-green-dark/30';
      case 'moderate': return 'bg-warning-amber-light dark:bg-warning-amber-dark/30';
      case 'high': return 'bg-orange-100 dark:bg-orange-900/30';
      case 'extreme': return 'bg-alert-red-light dark:bg-alert-red-dark/30';
      default: return 'bg-gray-100 dark:bg-gray-800';
    }
  };

  return (
    <div className="my-6 p-6 bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark">
      <h3 className="text-lg font-bold text-text-light dark:text-text-dark mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">calculate</span>
        {substanceName} Import Risk Calculator - India
      </h3>

      <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark mb-4">
        Calculate your customs seizure risk and potential penalties before ordering.
      </p>

      {/* Calculator Form */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Port Selection */}
        <div>
          <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
            Port of Entry
          </label>
          <select
            value={port}
            onChange={(e) => setPort(e.target.value)}
            className="w-full p-3 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-lg text-text-light dark:text-text-dark focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="">Select Port...</option>
            {config.ports.map(p => (
              <option key={p.code} value={p.code}>
                {p.name} ({p.seizureRate}% seizure rate)
              </option>
            ))}
          </select>
        </div>

        {/* Order Value */}
        <div>
          <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
            Order Value (₹)
          </label>
          <input
            type="number"
            value={orderValue}
            onChange={(e) => setOrderValue(e.target.value)}
            placeholder="e.g., 15000"
            className="w-full p-3 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-lg text-text-light dark:text-text-dark focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        {/* Declaration Type */}
        <div>
          <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
            Declared Contents
          </label>
          <select
            value={declaration}
            onChange={(e) => setDeclaration(e.target.value)}
            className="w-full p-3 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-lg text-text-light dark:text-text-dark focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="">Select Declaration...</option>
            {config.declarations.map(d => (
              <option key={d.type} value={d.type}>
                {d.type}
              </option>
            ))}
          </select>
        </div>

        {/* Courier */}
        <div>
          <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
            Shipping Method
          </label>
          <select
            value={courier}
            onChange={(e) => setCourier(e.target.value)}
            className="w-full p-3 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-lg text-text-light dark:text-text-dark focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="">Select Courier...</option>
            {config.couriers.map(c => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Quantity */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
            Quantity (grams)
          </label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="e.g., 100"
            className="w-full p-3 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-lg text-text-light dark:text-text-dark focus:ring-2 focus:ring-primary focus:border-primary"
          />
          {parseFloat(quantity) > 100 && (
            <p className="text-xs text-alert-red mt-1">
              ⚠️ Orders over 100g are flagged as commercial quantity
            </p>
          )}
        </div>
      </div>

      {/* Calculate Button */}
      <button
        onClick={calculateRisk}
        disabled={!port || !orderValue || !declaration || !courier || !quantity || isCalculating}
        className="mt-4 w-full py-3 px-4 bg-primary hover:bg-primary-darker text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isCalculating ? (
          <>
            <span className="animate-spin material-symbols-outlined">progress_activity</span>
            Calculating...
          </>
        ) : (
          <>
            <span className="material-symbols-outlined">calculate</span>
            Calculate Risk
          </>
        )}
      </button>

      {/* Results */}
      {result && (
        <div className={`mt-6 p-4 rounded-xl ${getRiskBgColor(result.riskLevel)}`}>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold text-text-light dark:text-text-dark">
              Risk Assessment
            </h4>
            <span className={`text-2xl font-bold ${getRiskColor(result.riskLevel)}`}>
              {result.riskPercentage}% {result.riskLevel.toUpperCase()}
            </span>
          </div>

          {/* Risk Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            <div className="p-2 bg-white/50 dark:bg-gray-800/50 rounded text-center">
              <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark">Port</p>
              <p className="font-bold text-text-light dark:text-text-dark">{result.breakdown.portRisk}%</p>
            </div>
            <div className="p-2 bg-white/50 dark:bg-gray-800/50 rounded text-center">
              <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark">Value</p>
              <p className="font-bold text-text-light dark:text-text-dark">{result.breakdown.valueRisk}%</p>
            </div>
            <div className="p-2 bg-white/50 dark:bg-gray-800/50 rounded text-center">
              <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark">Declaration</p>
              <p className="font-bold text-text-light dark:text-text-dark">{result.breakdown.declarationRisk}%</p>
            </div>
            <div className="p-2 bg-white/50 dark:bg-gray-800/50 rounded text-center">
              <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark">Courier</p>
              <p className="font-bold text-text-light dark:text-text-dark">{result.breakdown.courierRisk}%</p>
            </div>
          </div>

          {/* Penalty Estimate */}
          <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg mb-4">
            <p className="text-sm font-medium text-text-light dark:text-text-dark">
              <span className="material-symbols-outlined text-alert-red align-middle mr-1">payments</span>
              Estimated Penalty if Caught:
            </p>
            <p className="text-xl font-bold text-alert-red">
              ₹{result.penaltyMin.toLocaleString('en-IN')} - ₹{result.penaltyMax.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark">
              (includes product seizure + customs fine)
            </p>
          </div>

          {/* Recommendations */}
          <div>
            <p className="text-sm font-medium text-text-light dark:text-text-dark mb-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-success-green">tips_and_updates</span>
              Recommendations
            </p>
            <ul className="space-y-1">
              {result.recommendations.map((rec, i) => (
                <li key={i} className="text-sm text-text-subtle-light dark:text-text-subtle-dark flex items-start gap-2">
                  <span className="text-success-green">→</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <a
            href="#legal-alternatives"
            className="mt-4 block text-center py-3 px-4 bg-success-green hover:bg-success-green-dark text-white font-bold rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined align-middle mr-1">verified_user</span>
            View Legal Alternatives with COD
          </a>
        </div>
      )}
    </div>
  );
}
