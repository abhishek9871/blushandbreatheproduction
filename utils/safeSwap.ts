/**
 * Safe Swap Algorithm
 * 
 * This utility provides intelligent recommendations for legal alternatives
 * to banned substances, based on use case matching and safety profiles.
 */

import {
  getBannedSubstanceBySlug,
  getLegalSupplementBySlug,
  getLegalSupplements,
  getAffiliateProductsForSupplement,
} from '@/lib/data';
import type { BannedSubstance, LegalSupplement, AffiliateProduct } from '@/types';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface SafeSwapRecommendation {
  supplement: LegalSupplement;
  matchScore: number; // 0-100
  matchReasons: string[];
  topProducts: AffiliateProduct[];
}

export interface SafeSwapResult {
  bannedSubstance: BannedSubstance;
  recommendations: SafeSwapRecommendation[];
  disclaimer: string;
}

// ═══════════════════════════════════════════════════════════════════
// USE CASE MAPPINGS
// ═══════════════════════════════════════════════════════════════════

// Map banned substance categories to supplement benefits
const USE_CASE_MAPPINGS: Record<string, string[]> = {
  // Stimulant alternatives
  stimulant: [
    'energy',
    'alertness',
    'focus',
    'performance',
    'metabolism',
  ],
  // SARM alternatives
  sarm: [
    'muscle',
    'strength',
    'power',
    'recovery',
    'mass',
  ],
  // Prohormone alternatives
  prohormone: [
    'muscle',
    'strength',
    'testosterone',
    'recovery',
    'mass',
  ],
  // Nootropic alternatives
  nootropic: [
    'focus',
    'relaxation',
    'anxiety',
    'cognitive',
    'memory',
    'sleep',
  ],
  // Other
  other: [
    'relaxation',
    'stress',
    'mood',
    'energy',
  ],
};

// ═══════════════════════════════════════════════════════════════════
// SCORING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Calculate how well a supplement matches a banned substance's use case
 */
function calculateMatchScore(
  banned: BannedSubstance,
  supplement: LegalSupplement
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // 1. Direct replacement bonus (explicitly listed as alternative)
  if (banned.legalAlternatives.includes(supplement.slug)) {
    score += 40;
    reasons.push('Recommended alternative');
  }

  // 2. Category-based matching
  const targetUseCases = USE_CASE_MAPPINGS[banned.category] || USE_CASE_MAPPINGS.other;
  const supplementBenefits = supplement.benefits.map(b => b.toLowerCase());

  let useCaseMatches = 0;
  for (const useCase of targetUseCases) {
    if (supplementBenefits.some(b => b.includes(useCase))) {
      useCaseMatches++;
    }
  }
  
  if (useCaseMatches > 0) {
    const useCaseScore = Math.min(30, useCaseMatches * 10);
    score += useCaseScore;
    reasons.push(`Matches ${useCaseMatches} use case(s)`);
  }

  // 3. Safety rating bonus
  if (supplement.safetyRating === 'low') {
    score += 15;
    reasons.push('Excellent safety profile');
  } else if (supplement.safetyRating === 'moderate') {
    score += 10;
    reasons.push('Good safety profile');
  }

  // 4. Scientific evidence bonus
  const hasStrongEvidence = supplement.scientificEvidence?.some(
    e => e.evidenceLevel === 'strong'
  );
  if (hasStrongEvidence) {
    score += 10;
    reasons.push('Strong scientific backing');
  }

  // 5. FDA GRAS status bonus
  if (supplement.fdaStatus === 'gras') {
    score += 5;
    reasons.push('FDA GRAS status');
  }

  // 6. Quality certifications bonus
  if (supplement.qualityCertifications && supplement.qualityCertifications.length > 0) {
    score += 5;
    reasons.push('Third-party certified');
  }

  return { score: Math.min(100, score), reasons };
}

/**
 * Sort products by quality/value criteria
 */
function sortProducts(products: AffiliateProduct[]): AffiliateProduct[] {
  return [...products].sort((a, b) => {
    // Prioritize third-party tested
    if (a.thirdPartyTested && !b.thirdPartyTested) return -1;
    if (!a.thirdPartyTested && b.thirdPartyTested) return 1;
    
    // Then by rating
    if (a.rating !== b.rating) return b.rating - a.rating;
    
    // Then by review count
    return b.reviewCount - a.reviewCount;
  });
}

// ═══════════════════════════════════════════════════════════════════
// MAIN FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Get safe alternative recommendations for a banned substance
 */
export function getSafeAlternatives(bannedSlug: string): SafeSwapResult | null {
  const banned = getBannedSubstanceBySlug(bannedSlug);
  
  if (!banned) {
    return null;
  }

  // Get all potential alternatives
  const allSupplements = getLegalSupplements();
  
  // Score each supplement
  const scoredSupplements: SafeSwapRecommendation[] = allSupplements
    .map(supplement => {
      const { score, reasons } = calculateMatchScore(banned, supplement);
      const products = getAffiliateProductsForSupplement(supplement.slug);
      const topProducts = sortProducts(products).slice(0, 3);

      return {
        supplement,
        matchScore: score,
        matchReasons: reasons,
        topProducts,
      };
    })
    .filter(r => r.matchScore >= 25) // Only include decent matches
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5); // Top 5 recommendations

  return {
    bannedSubstance: banned,
    recommendations: scoredSupplements,
    disclaimer: getDisclaimer(),
  };
}

/**
 * Get a single best alternative for a banned substance
 */
export function getBestAlternative(bannedSlug: string): LegalSupplement | null {
  const result = getSafeAlternatives(bannedSlug);
  
  if (!result || result.recommendations.length === 0) {
    return null;
  }

  return result.recommendations[0].supplement;
}

/**
 * Get alternative products for replacing a banned substance
 */
export function getAlternativeProducts(bannedSlug: string): AffiliateProduct[] {
  const result = getSafeAlternatives(bannedSlug);
  
  if (!result) {
    return [];
  }

  // Collect all products from recommendations, deduplicated
  const productMap = new Map<string, AffiliateProduct>();
  
  for (const rec of result.recommendations) {
    for (const product of rec.topProducts) {
      if (!productMap.has(product.id)) {
        productMap.set(product.id, product);
      }
    }
  }

  return Array.from(productMap.values())
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 6);
}

/**
 * Check if a supplement is a valid replacement for a banned substance
 */
export function isValidReplacement(
  bannedSlug: string,
  supplementSlug: string
): boolean {
  const banned = getBannedSubstanceBySlug(bannedSlug);
  const supplement = getLegalSupplementBySlug(supplementSlug);

  if (!banned || !supplement) {
    return false;
  }

  // Check if it's in the explicit alternatives list
  if (banned.legalAlternatives.includes(supplementSlug)) {
    return true;
  }

  // Check if the supplement lists this banned substance in replacementFor
  if (supplement.replacementFor.includes(bannedSlug)) {
    return true;
  }

  // Check if there's a reasonable match score
  const { score } = calculateMatchScore(banned, supplement);
  return score >= 40;
}

/**
 * Get the legal disclaimer for safe swap recommendations
 */
function getDisclaimer(): string {
  return `DISCLAIMER: These recommendations are for educational purposes only and do not constitute medical advice. The alternatives suggested are legal dietary supplements that may provide similar benefits to banned substances, but individual results may vary. Always consult with a qualified healthcare provider before starting any new supplement regimen, especially if you have underlying health conditions or are taking medications. The safety and efficacy of dietary supplements are not evaluated by the FDA in the same manner as pharmaceutical drugs.`;
}

// ═══════════════════════════════════════════════════════════════════
// COMPARISON UTILITIES
// ═══════════════════════════════════════════════════════════════════

export interface SubstanceComparison {
  banned: BannedSubstance;
  alternative: LegalSupplement;
  comparison: {
    category: string;
    banned: string;
    alternative: string;
    advantage: 'banned' | 'alternative' | 'neutral';
  }[];
}

/**
 * Generate a comparison between a banned substance and its alternative
 */
export function compareSubstances(
  bannedSlug: string,
  alternativeSlug: string
): SubstanceComparison | null {
  const banned = getBannedSubstanceBySlug(bannedSlug);
  const alternative = getLegalSupplementBySlug(alternativeSlug);

  if (!banned || !alternative) {
    return null;
  }

  const comparison: SubstanceComparison['comparison'] = [
    {
      category: 'Legal Status',
      banned: banned.legalStatusDetails,
      alternative: `Legal - ${alternative.fdaStatus?.toUpperCase() || 'Available'}`,
      advantage: 'alternative',
    },
    {
      category: 'Safety Profile',
      banned: `${banned.overdoseRisk} overdose risk`,
      alternative: `${alternative.safetyRating} risk - Well-tolerated`,
      advantage: 'alternative',
    },
    {
      category: 'Addiction Potential',
      banned: `${banned.addictionPotential} addiction potential`,
      alternative: 'Non-addictive',
      advantage: 'alternative',
    },
    {
      category: 'Side Effects',
      banned: banned.sideEffects.slice(0, 3).join(', '),
      alternative: alternative.sideEffects.slice(0, 3).join(', ') || 'Minimal',
      advantage: 'alternative',
    },
    {
      category: 'Mechanism',
      banned: banned.mechanism.slice(0, 100) + '...',
      alternative: alternative.mechanism.slice(0, 100) + '...',
      advantage: 'neutral',
    },
    {
      category: 'Availability',
      banned: 'Illegal/Restricted',
      alternative: 'Widely available',
      advantage: 'alternative',
    },
  ];

  return { banned, alternative, comparison };
}
