/**
 * Buy Pages Data Access Functions
 * 
 * Provides access to buy page data for transactional pages
 * like /buy/dmaa-india
 */

import type { BuyPage, BuyPagesData } from '@/types';
import buyPagesData from './buy-pages.json';

/**
 * Get all buy pages
 */
export function getBuyPages(): BuyPage[] {
  return (buyPagesData as BuyPagesData).pages as BuyPage[];
}

/**
 * Get a specific buy page by slug
 */
export function getBuyPageBySlug(slug: string): BuyPage | undefined {
  return getBuyPages().find(p => p.slug === slug);
}

/**
 * Get all buy page slugs (for static path generation)
 */
export function getBuyPageSlugs(): string[] {
  return getBuyPages().map(p => p.slug);
}

/**
 * Get buy pages for a specific substance
 */
export function getBuyPagesForSubstance(substanceSlug: string): BuyPage[] {
  return getBuyPages().filter(p => p.substanceSlug === substanceSlug);
}
