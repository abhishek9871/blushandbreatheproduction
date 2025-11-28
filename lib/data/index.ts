/**
 * Research Data Import Utilities
 * 
 * This module provides utilities to access and manage research data
 * from JSON files provided by the research coordinator.
 * 
 * Expected data files:
 * - banned-substances.json
 * - legal-supplements.json
 * - affiliate-products.json
 * - api-endpoints.json
 * - legal-requirements.json
 */

import type {
  BannedSubstance,
  LegalSupplement,
  AffiliateProduct,
  LegalDisclaimer,
  StateRestriction,
  SubstanceArticles,
  SubstanceArticlesData,
} from '@/types';

// Import placeholder data (to be replaced with actual data files)
import bannedSubstancesData from './banned-substances.json';
import legalSupplementsData from './legal-supplements.json';
import affiliateProductsData from './affiliate-products.json';
import substanceArticlesData from './substance-articles.json';

// ═══════════════════════════════════════════════════════════════════
// DATA ACCESS FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Get all banned substances from the research data
 */
export function getBannedSubstances(): BannedSubstance[] {
  return bannedSubstancesData.substances as BannedSubstance[];
}

/**
 * Get a specific banned substance by slug
 */
export function getBannedSubstanceBySlug(slug: string): BannedSubstance | undefined {
  return getBannedSubstances().find(s => s.slug === slug);
}

/**
 * Get all banned substance slugs (for static path generation)
 */
export function getBannedSubstanceSlugs(): string[] {
  return getBannedSubstances().map(s => s.slug);
}

/**
 * Get all legal supplements from the research data
 */
export function getLegalSupplements(): LegalSupplement[] {
  return legalSupplementsData.supplements as LegalSupplement[];
}

/**
 * Get a specific legal supplement by slug
 */
export function getLegalSupplementBySlug(slug: string): LegalSupplement | undefined {
  return getLegalSupplements().find(s => s.slug === slug);
}

/**
 * Get all legal supplement slugs (for static path generation)
 */
export function getLegalSupplementSlugs(): string[] {
  return getLegalSupplements().map(s => s.slug);
}

/**
 * Get legal alternatives for a banned substance
 */
export function getLegalAlternatives(bannedSlug: string): LegalSupplement[] {
  const banned = getBannedSubstanceBySlug(bannedSlug);
  if (!banned) return [];
  
  return banned.legalAlternatives
    .map(altSlug => getLegalSupplementBySlug(altSlug))
    .filter((s): s is LegalSupplement => s !== undefined);
}

/**
 * Get all affiliate products from the research data
 */
export function getAffiliateProducts(): AffiliateProduct[] {
  return affiliateProductsData.products as AffiliateProduct[];
}

/**
 * Get affiliate products for a specific supplement
 */
export function getAffiliateProductsForSupplement(supplementSlug: string): AffiliateProduct[] {
  return getAffiliateProducts().filter(p => 
    p.relatedSupplements.includes(supplementSlug)
  );
}

/**
 * Get affiliate products that replace a banned substance
 */
export function getAffiliateProductsForBanned(bannedSlug: string): AffiliateProduct[] {
  return getAffiliateProducts().filter(p => 
    p.replacementFor.includes(bannedSlug)
  );
}

// ═══════════════════════════════════════════════════════════════════
// SEARCH & FILTER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Search across all substances
 */
export function searchSubstances(query: string): {
  banned: BannedSubstance[];
  supplements: LegalSupplement[];
} {
  const q = query.toLowerCase();
  
  const banned = getBannedSubstances().filter(s => 
    s.name.toLowerCase().includes(q) ||
    s.alternativeNames.some(n => n.toLowerCase().includes(q)) ||
    s.description.toLowerCase().includes(q)
  );
  
  const supplements = getLegalSupplements().filter(s => 
    s.name.toLowerCase().includes(q) ||
    s.alternativeNames.some(n => n.toLowerCase().includes(q)) ||
    s.description.toLowerCase().includes(q)
  );
  
  return { banned, supplements };
}

/**
 * Get substances by category
 */
export function getSubstancesByCategory(category: string): {
  banned: BannedSubstance[];
  supplements: LegalSupplement[];
} {
  const banned = getBannedSubstances().filter(s => s.category === category);
  const supplements = getLegalSupplements().filter(s => s.category === category);
  return { banned, supplements };
}

// ═══════════════════════════════════════════════════════════════════
// VALIDATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Validate that all data is properly loaded
 */
export function validateDataIntegrity(): {
  isValid: boolean;
  errors: string[];
  stats: {
    bannedCount: number;
    supplementCount: number;
    productCount: number;
  };
} {
  const errors: string[] = [];
  
  const banned = getBannedSubstances();
  const supplements = getLegalSupplements();
  const products = getAffiliateProducts();
  
  // Check for empty data
  if (banned.length === 0) {
    errors.push('No banned substances loaded');
  }
  if (supplements.length === 0) {
    errors.push('No legal supplements loaded');
  }
  if (products.length === 0) {
    errors.push('No affiliate products loaded');
  }
  
  // Validate references
  for (const substance of banned) {
    for (const altSlug of substance.legalAlternatives) {
      if (!getLegalSupplementBySlug(altSlug)) {
        errors.push(`Banned substance "${substance.name}" references non-existent alternative: ${altSlug}`);
      }
    }
  }
  
  for (const supplement of supplements) {
    for (const bannedSlug of supplement.replacementFor) {
      if (!getBannedSubstanceBySlug(bannedSlug)) {
        errors.push(`Supplement "${supplement.name}" references non-existent banned substance: ${bannedSlug}`);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    stats: {
      bannedCount: banned.length,
      supplementCount: supplements.length,
      productCount: products.length,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════
// EXPORT FUNCTIONS (for API/Worker import)
// ═══════════════════════════════════════════════════════════════════

/**
 * Export all data for API import
 */
export function exportAllData() {
  return {
    banned: getBannedSubstances(),
    supplements: getLegalSupplements(),
    products: getAffiliateProducts(),
  };
}

// ═══════════════════════════════════════════════════════════════════
// ARTICLE DATA ACCESS FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Get article data for a specific substance by slug
 */
export function getSubstanceArticles(slug: string): SubstanceArticles | undefined {
  const data = substanceArticlesData as SubstanceArticlesData;
  return data.articles[slug];
}

/**
 * Get all substance articles
 */
export function getAllSubstanceArticles(): Record<string, SubstanceArticles> {
  const data = substanceArticlesData as SubstanceArticlesData;
  return data.articles;
}

/**
 * Get article metadata (version, generation date)
 */
export function getArticleDataMetadata(): { version: string; generatedAt: string } {
  const data = substanceArticlesData as SubstanceArticlesData;
  return {
    version: data.version,
    generatedAt: data.generatedAt,
  };
}
