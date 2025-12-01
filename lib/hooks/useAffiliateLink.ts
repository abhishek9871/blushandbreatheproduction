/**
 * useAffiliateLink Hook
 * 
 * Centralized hook for generating affiliate links with UTM tracking.
 * Reads from affiliate-config.json and returns appropriate links
 * based on whether affiliate IDs are configured.
 */

import { useMemo } from 'react';
import affiliateConfig from '@/lib/data/affiliate-config.json';

interface AffiliateLinkResult {
  url: string;
  ctaText: string;
  isAffiliate: boolean;
  commission: string;
  hasCOD: boolean;
  price: number;
  rating?: number;
  inStock?: boolean;
}

interface AffiliateProduct {
  directUrl: string;
  affiliateUrl: string;
  price: number;
  currency: string;
  rating?: number;
  inStock?: boolean;
  name: string;
}

interface AffiliateProgram {
  status: string;
  affiliateId: string;
  baseUrl: string;
  commission: string;
  hasCOD: boolean;
  products: Record<string, AffiliateProduct>;
}

type ProgramKey = 'crazybulk_india' | 'healthkart' | 'kapiva' | 'upakarma' | 'amazon_india';

/**
 * Hook to get affiliate link for a specific product
 * 
 * @param program - The affiliate program key (e.g., 'crazybulk_india')
 * @param productSlug - The product slug within that program
 * @param utmContent - Optional UTM content parameter for tracking
 */
export function useAffiliateLink(
  program: ProgramKey,
  productSlug: string,
  utmContent?: string
): AffiliateLinkResult {
  return useMemo(() => {
    const config = affiliateConfig as {
      programs: Record<string, AffiliateProgram>;
      settings: {
        trackingParams: {
          utm_source: string;
          utm_medium: string;
          utm_campaign: string;
        };
        fallbackCTAText: string;
        affiliateCTAText: string;
      };
    };
    
    const programConfig = config.programs[program];
    
    if (!programConfig) {
      return {
        url: '#',
        ctaText: 'View Product',
        isAffiliate: false,
        commission: '0%',
        hasCOD: false,
        price: 0,
      };
    }

    const product = programConfig.products[productSlug];
    
    if (!product) {
      return {
        url: programConfig.baseUrl,
        ctaText: config.settings.fallbackCTAText,
        isAffiliate: false,
        commission: programConfig.commission,
        hasCOD: programConfig.hasCOD,
        price: 0,
      };
    }

    // Check if affiliate is configured (not PLACEHOLDER)
    const isAffiliateActive = 
      programConfig.affiliateId !== 'PLACEHOLDER' && 
      product.affiliateUrl !== 'PLACEHOLDER' &&
      programConfig.status === 'active';

    // Build URL with UTM parameters
    const baseUrl = isAffiliateActive ? product.affiliateUrl : product.directUrl;
    const utmParams = new URLSearchParams({
      ...config.settings.trackingParams,
      ...(utmContent ? { utm_content: utmContent } : {}),
    });

    const finalUrl = baseUrl.includes('?') 
      ? `${baseUrl}&${utmParams.toString()}`
      : `${baseUrl}?${utmParams.toString()}`;

    return {
      url: finalUrl,
      ctaText: isAffiliateActive 
        ? config.settings.affiliateCTAText 
        : config.settings.fallbackCTAText,
      isAffiliate: isAffiliateActive,
      commission: programConfig.commission,
      hasCOD: programConfig.hasCOD,
      price: product.price,
      rating: product.rating,
      inStock: product.inStock,
    };
  }, [program, productSlug, utmContent]);
}

/**
 * Get all products from a specific affiliate program
 */
export function useAffiliateProgramProducts(program: ProgramKey) {
  return useMemo(() => {
    const config = affiliateConfig as {
      programs: Record<string, AffiliateProgram>;
    };
    const programConfig = config.programs[program];
    
    if (!programConfig) return [];

    return Object.entries(programConfig.products).map(([slug, product]) => ({
      slug,
      ...product,
      hasCOD: programConfig.hasCOD,
      commission: programConfig.commission,
    }));
  }, [program]);
}

/**
 * Get affiliate disclosure text
 */
export function useAffiliateDisclosure(): string {
  return affiliateConfig.settings.disclosureText;
}
