/**
 * SafeSwapBox Component
 * 
 * Prominent CTA box showing safe alternatives to banned substances.
 * Includes "Why We Recommend" dynamic text explaining the recommendation.
 */

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { LegalSupplement, AffiliateProduct, BannedSubstance } from '@/types';
import { trackSafeSwapClick, trackAffiliateClick } from '@/lib/analytics';

interface SafeSwapBoxProps {
  bannedSubstance: BannedSubstance;
  alternative: LegalSupplement;
  topProduct?: AffiliateProduct;
  position?: number;
  className?: string;
}

// Generate dynamic "Why We Recommend" text
function generateRecommendationReason(
  banned: BannedSubstance,
  alternative: LegalSupplement
): string {
  // Find shared use cases
  const bannedCategory = banned.category.toLowerCase();
  const altBenefits = alternative.benefits.slice(0, 2).join(' and ');
  
  // Category-specific recommendations
  const categoryReasons: Record<string, string> = {
    stimulant: `provides clean energy and focus without the cardiovascular risks`,
    sarm: `supports muscle growth through natural pathways without hormonal disruption`,
    prohormone: `enhances performance safely without affecting your endocrine system`,
    nootropic: `improves cognitive function without the risk of dependency`,
    peptide: `offers similar benefits through proven, legal mechanisms`,
    other: `provides comparable effects with a well-established safety profile`,
  };

  const reason = categoryReasons[bannedCategory] || categoryReasons.other;
  
  return `We recommend ${alternative.name} because it ${reason}. Benefits include ${altBenefits}.`;
}

export function SafeSwapBox({
  bannedSubstance,
  alternative,
  topProduct,
  position = 0,
  className = '',
}: SafeSwapBoxProps) {
  const recommendationReason = generateRecommendationReason(bannedSubstance, alternative);

  const handleSwapClick = () => {
    trackSafeSwapClick(bannedSubstance.slug, alternative.slug, position);
  };

  const handleProductClick = () => {
    if (topProduct) {
      trackAffiliateClick(
        topProduct.id,
        topProduct.name,
        topProduct.brand,
        topProduct.price,
        alternative.slug
      );
      window.open(topProduct.affiliateUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className={`safe-swap-box ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-white text-xl md:text-2xl">swap_horiz</span>
        </div>
        <div>
          <h3 className="text-base md:text-lg lg:text-xl font-bold text-green-800 dark:text-green-300 leading-tight">
            Safe Legal Alternative
          </h3>
          <p className="text-xs md:text-sm text-green-700 dark:text-green-400">
            Try this instead of {bannedSubstance.name}
          </p>
        </div>
      </div>

      {/* Alternative Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md mb-4">
        <div className="flex items-start gap-4">
          {/* Icon/Image placeholder */}
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-lg bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-2xl md:text-3xl text-green-600 dark:text-green-400">
              medication
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white leading-tight">
                {alternative.name}
              </h4>
              <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-semibold rounded">
                LEGAL
              </span>
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 capitalize">
              {alternative.category.replace('_', ' ')} • Safety: {alternative.safetyRating}
            </p>

            {/* Benefits Pills */}
            <div className="flex flex-wrap gap-1 md:gap-1.5 mb-2 md:mb-3">
              {alternative.benefits.slice(0, 3).map((benefit, i) => (
                <span
                  key={i}
                  className="px-1.5 md:px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-[10px] md:text-xs rounded-full"
                >
                  {benefit}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Why We Recommend */}
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-blue-500 text-base md:text-lg flex-shrink-0 mt-0.5">
              lightbulb
            </span>
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Why We Recommend This
              </p>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                {recommendationReason}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Learn More Button */}
        <Link
          href={`/supplement/${alternative.slug}`}
          onClick={handleSwapClick}
          className="flex-1 cta-button min-h-[44px] text-sm md:text-base bg-white dark:bg-gray-800 text-gray-800 dark:text-white border-2 border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"
        >
          <span className="material-symbols-outlined text-green-600">info</span>
          Learn More
        </Link>

        {/* Buy Now Button (if product available) */}
        {topProduct && (
          <button
            onClick={handleProductClick}
            className="flex-1 cta-button cta-button-success min-h-[44px] text-sm md:text-base"
          >
            <span className="material-symbols-outlined">shopping_cart</span>
            Buy {topProduct.brand} - ${topProduct.price.toFixed(2)}
          </button>
        )}
      </div>

      {/* Comparison Link */}
      <div className="mt-4 text-center">
        <Link
          href={`/compare/${bannedSubstance.slug}-vs-${alternative.slug}`}
          className="text-sm text-green-700 dark:text-green-400 hover:underline inline-flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">compare_arrows</span>
          See full comparison: {bannedSubstance.name} vs {alternative.name}
        </Link>
      </div>

      {/* Affiliate Disclosure */}
      <p className="mt-3 text-xs text-gray-500 dark:text-gray-500 text-center">
        <span className="material-symbols-outlined text-xs align-middle">info</span>
        {' '}Affiliate link - we may earn a commission at no extra cost to you
      </p>
    </div>
  );
}

/**
 * SafeSwapList - Shows multiple alternatives
 */
interface SafeSwapListProps {
  bannedSubstance: BannedSubstance;
  alternatives: LegalSupplement[];
  products?: Map<string, AffiliateProduct>;
  className?: string;
}

export function SafeSwapList({
  bannedSubstance,
  alternatives,
  products,
  className = '',
}: SafeSwapListProps) {
  if (alternatives.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-green-500">verified_user</span>
        Safe Legal Alternatives
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Instead of risking your health with {bannedSubstance.name}, try these proven, legal alternatives:
      </p>
      
      <div className="space-y-4">
        {alternatives.slice(0, 3).map((alt, index) => (
          <SafeSwapBox
            key={alt.slug}
            bannedSubstance={bannedSubstance}
            alternative={alt}
            topProduct={products?.get(alt.slug)}
            position={index}
          />
        ))}
      </div>
    </div>
  );
}

export default SafeSwapBox;
