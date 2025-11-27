/**
 * Substance Data Service
 * 
 * Handles reading and serving data from our research JSON files:
 * - banned-substances.json
 * - legal-supplements.json
 * - affiliate-products.json
 * 
 * This service is used by the Cloudflare Worker to serve
 * cached substance data without external API calls.
 */

import type {
  BannedSubstance,
  LegalSupplement,
  AffiliateProduct,
  DrugInteraction,
  SubstanceSearchParams,
  SearchResult,
  SubstanceAPIResponse,
  SubstanceListResponse,
  StateRestriction,
  LegalDisclaimer,
} from '../../../types/substance';

export interface SubstanceDataServiceConfig {
  cache?: KVNamespace;
  cacheTtl?: number;
}

// KV key prefixes
const KV_PREFIXES = {
  BANNED: 'substance:banned:',
  SUPPLEMENT: 'substance:supplement:',
  AFFILIATE: 'substance:affiliate:',
  INTERACTION: 'substance:interaction:',
  DISCLAIMER: 'substance:disclaimer:',
  INDEX: 'substance:index:',
};

export class SubstanceDataService {
  private cache?: KVNamespace;
  private cacheTtl: number;

  constructor(config: SubstanceDataServiceConfig = {}) {
    this.cache = config.cache;
    this.cacheTtl = config.cacheTtl || 86400 * 7; // 7 days default for static data
  }

  // ═══════════════════════════════════════════════════════════════════
  // BANNED SUBSTANCES
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Get a banned substance by slug
   */
  async getBannedSubstance(slug: string): Promise<SubstanceAPIResponse<BannedSubstance>> {
    const cacheKey = `${KV_PREFIXES.BANNED}${slug}`;
    
    if (this.cache) {
      const cached = await this.cache.get(cacheKey, 'json');
      if (cached) {
        return {
          success: true,
          data: cached as BannedSubstance,
          cached: true,
          cachedAt: new Date().toISOString()
        };
      }
    }

    // If not in cache, return null (data needs to be imported first)
    return {
      success: false,
      data: null,
      error: 'Substance not found. Please ensure data has been imported.'
    };
  }

  /**
   * Get all banned substances
   */
  async getAllBannedSubstances(): Promise<SubstanceListResponse<BannedSubstance>> {
    const indexKey = `${KV_PREFIXES.INDEX}banned`;
    
    if (this.cache) {
      const index = await this.cache.get(indexKey, 'json') as string[] | null;
      if (index && Array.isArray(index)) {
        const substances: BannedSubstance[] = [];
        
        for (const slug of index) {
          const item = await this.cache.get(`${KV_PREFIXES.BANNED}${slug}`, 'json');
          if (item) {
            substances.push(item as BannedSubstance);
          }
        }

        return {
          success: true,
          data: substances,
          pagination: {
            page: 1,
            pageSize: substances.length,
            total: substances.length,
            hasNextPage: false
          }
        };
      }
    }

    return {
      success: true,
      data: [],
      pagination: {
        page: 1,
        pageSize: 0,
        total: 0,
        hasNextPage: false
      }
    };
  }

  /**
   * Import banned substances from JSON data
   */
  async importBannedSubstances(substances: BannedSubstance[]): Promise<{ imported: number; errors: string[] }> {
    const errors: string[] = [];
    let imported = 0;
    const slugs: string[] = [];

    if (!this.cache) {
      return { imported: 0, errors: ['Cache not available'] };
    }

    for (const substance of substances) {
      try {
        await this.cache.put(
          `${KV_PREFIXES.BANNED}${substance.slug}`,
          JSON.stringify(substance),
          { expirationTtl: this.cacheTtl }
        );
        slugs.push(substance.slug);
        imported++;
      } catch (error) {
        errors.push(`Failed to import ${substance.name}: ${error}`);
      }
    }

    // Update index
    await this.cache.put(
      `${KV_PREFIXES.INDEX}banned`,
      JSON.stringify(slugs),
      { expirationTtl: this.cacheTtl }
    );

    return { imported, errors };
  }

  // ═══════════════════════════════════════════════════════════════════
  // LEGAL SUPPLEMENTS
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Get a legal supplement by slug
   */
  async getLegalSupplement(slug: string): Promise<SubstanceAPIResponse<LegalSupplement>> {
    const cacheKey = `${KV_PREFIXES.SUPPLEMENT}${slug}`;
    
    if (this.cache) {
      const cached = await this.cache.get(cacheKey, 'json');
      if (cached) {
        return {
          success: true,
          data: cached as LegalSupplement,
          cached: true,
          cachedAt: new Date().toISOString()
        };
      }
    }

    return {
      success: false,
      data: null,
      error: 'Supplement not found. Please ensure data has been imported.'
    };
  }

  /**
   * Get all legal supplements
   */
  async getAllLegalSupplements(): Promise<SubstanceListResponse<LegalSupplement>> {
    const indexKey = `${KV_PREFIXES.INDEX}supplements`;
    
    if (this.cache) {
      const index = await this.cache.get(indexKey, 'json') as string[] | null;
      if (index && Array.isArray(index)) {
        const supplements: LegalSupplement[] = [];
        
        for (const slug of index) {
          const item = await this.cache.get(`${KV_PREFIXES.SUPPLEMENT}${slug}`, 'json');
          if (item) {
            supplements.push(item as LegalSupplement);
          }
        }

        return {
          success: true,
          data: supplements,
          pagination: {
            page: 1,
            pageSize: supplements.length,
            total: supplements.length,
            hasNextPage: false
          }
        };
      }
    }

    return {
      success: true,
      data: [],
      pagination: {
        page: 1,
        pageSize: 0,
        total: 0,
        hasNextPage: false
      }
    };
  }

  /**
   * Get legal alternatives for a banned substance
   */
  async getLegalAlternatives(bannedSlug: string): Promise<LegalSupplement[]> {
    const bannedResponse = await this.getBannedSubstance(bannedSlug);
    if (!bannedResponse.success || !bannedResponse.data) {
      return [];
    }

    const alternatives: LegalSupplement[] = [];
    for (const altSlug of bannedResponse.data.legalAlternatives) {
      const supplement = await this.getLegalSupplement(altSlug);
      if (supplement.success && supplement.data) {
        alternatives.push(supplement.data);
      }
    }

    return alternatives;
  }

  /**
   * Import legal supplements from JSON data
   */
  async importLegalSupplements(supplements: LegalSupplement[]): Promise<{ imported: number; errors: string[] }> {
    const errors: string[] = [];
    let imported = 0;
    const slugs: string[] = [];

    if (!this.cache) {
      return { imported: 0, errors: ['Cache not available'] };
    }

    for (const supplement of supplements) {
      try {
        await this.cache.put(
          `${KV_PREFIXES.SUPPLEMENT}${supplement.slug}`,
          JSON.stringify(supplement),
          { expirationTtl: this.cacheTtl }
        );
        slugs.push(supplement.slug);
        imported++;
      } catch (error) {
        errors.push(`Failed to import ${supplement.name}: ${error}`);
      }
    }

    // Update index
    await this.cache.put(
      `${KV_PREFIXES.INDEX}supplements`,
      JSON.stringify(slugs),
      { expirationTtl: this.cacheTtl }
    );

    return { imported, errors };
  }

  // ═══════════════════════════════════════════════════════════════════
  // AFFILIATE PRODUCTS
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Get affiliate products for a supplement
   */
  async getAffiliateProducts(supplementSlug: string): Promise<AffiliateProduct[]> {
    const cacheKey = `${KV_PREFIXES.AFFILIATE}${supplementSlug}`;
    
    if (this.cache) {
      const cached = await this.cache.get(cacheKey, 'json');
      if (cached) {
        return cached as AffiliateProduct[];
      }
    }

    return [];
  }

  /**
   * Get all affiliate products
   */
  async getAllAffiliateProducts(): Promise<AffiliateProduct[]> {
    const indexKey = `${KV_PREFIXES.INDEX}affiliates`;
    
    if (this.cache) {
      const index = await this.cache.get(indexKey, 'json') as string[] | null;
      if (index && Array.isArray(index)) {
        const products: AffiliateProduct[] = [];
        
        for (const id of index) {
          const item = await this.cache.get(`${KV_PREFIXES.AFFILIATE}product:${id}`, 'json');
          if (item) {
            products.push(item as AffiliateProduct);
          }
        }

        return products;
      }
    }

    return [];
  }

  /**
   * Import affiliate products from JSON data
   */
  async importAffiliateProducts(products: AffiliateProduct[]): Promise<{ imported: number; errors: string[] }> {
    const errors: string[] = [];
    let imported = 0;
    const ids: string[] = [];

    if (!this.cache) {
      return { imported: 0, errors: ['Cache not available'] };
    }

    // Group products by related supplement
    const productsBySupp: Record<string, AffiliateProduct[]> = {};

    for (const product of products) {
      try {
        // Store individual product
        await this.cache.put(
          `${KV_PREFIXES.AFFILIATE}product:${product.id}`,
          JSON.stringify(product),
          { expirationTtl: this.cacheTtl }
        );
        ids.push(product.id);
        imported++;

        // Group by supplement
        for (const suppSlug of product.relatedSupplements) {
          if (!productsBySupp[suppSlug]) {
            productsBySupp[suppSlug] = [];
          }
          productsBySupp[suppSlug].push(product);
        }
      } catch (error) {
        errors.push(`Failed to import product ${product.name}: ${error}`);
      }
    }

    // Store products grouped by supplement
    for (const [suppSlug, prods] of Object.entries(productsBySupp)) {
      await this.cache.put(
        `${KV_PREFIXES.AFFILIATE}${suppSlug}`,
        JSON.stringify(prods),
        { expirationTtl: this.cacheTtl }
      );
    }

    // Update index
    await this.cache.put(
      `${KV_PREFIXES.INDEX}affiliates`,
      JSON.stringify(ids),
      { expirationTtl: this.cacheTtl }
    );

    return { imported, errors };
  }

  // ═══════════════════════════════════════════════════════════════════
  // SEARCH
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Search across all substance types
   */
  async search(params: SubstanceSearchParams): Promise<SubstanceListResponse<SearchResult>> {
    const results: SearchResult[] = [];
    const query = (params.query || '').toLowerCase();

    // Search banned substances
    if (!params.type || params.type.includes('banned')) {
      const banned = await this.getAllBannedSubstances();
      for (const substance of banned.data) {
        if (this.matchesSearch(substance.name, substance.alternativeNames, substance.description, query)) {
          results.push({
            id: substance.id,
            slug: substance.slug,
            name: substance.name,
            type: 'banned',
            description: substance.description.substring(0, 200),
            category: substance.category,
            matchScore: this.calculateMatchScore(substance.name, query)
          });
        }
      }
    }

    // Search supplements
    if (!params.type || params.type.includes('supplement')) {
      const supplements = await this.getAllLegalSupplements();
      for (const supplement of supplements.data) {
        if (this.matchesSearch(supplement.name, supplement.alternativeNames, supplement.description, query)) {
          results.push({
            id: supplement.id,
            slug: supplement.slug,
            name: supplement.name,
            type: 'supplement',
            description: supplement.description.substring(0, 200),
            category: supplement.category,
            matchScore: this.calculateMatchScore(supplement.name, query)
          });
        }
      }
    }

    // Sort by match score
    results.sort((a, b) => b.matchScore - a.matchScore);

    // Apply pagination
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const start = (page - 1) * pageSize;
    const paginatedResults = results.slice(start, start + pageSize);

    return {
      success: true,
      data: paginatedResults,
      pagination: {
        page,
        pageSize,
        total: results.length,
        hasNextPage: start + pageSize < results.length
      }
    };
  }

  /**
   * Check if item matches search query
   */
  private matchesSearch(name: string, altNames: string[], description: string, query: string): boolean {
    if (!query) return true;
    
    const searchIn = [name, ...altNames, description].join(' ').toLowerCase();
    return searchIn.includes(query);
  }

  /**
   * Calculate match score for ranking
   */
  private calculateMatchScore(name: string, query: string): number {
    if (!query) return 0;
    
    const nameLower = name.toLowerCase();
    const queryLower = query.toLowerCase();

    // Exact match
    if (nameLower === queryLower) return 100;
    
    // Starts with
    if (nameLower.startsWith(queryLower)) return 80;
    
    // Contains
    if (nameLower.includes(queryLower)) return 60;
    
    // Partial word match
    const words = nameLower.split(/\s+/);
    for (const word of words) {
      if (word.startsWith(queryLower)) return 40;
    }

    return 20;
  }

  // ═══════════════════════════════════════════════════════════════════
  // LEGAL DISCLAIMERS
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Get all legal disclaimers
   */
  async getDisclaimers(pageType?: string): Promise<LegalDisclaimer[]> {
    const cacheKey = `${KV_PREFIXES.DISCLAIMER}all`;
    
    if (this.cache) {
      const cached = await this.cache.get(cacheKey, 'json');
      if (cached) {
        const disclaimers = cached as LegalDisclaimer[];
        if (pageType) {
          return disclaimers.filter(d => 
            d.displayOn.includes(pageType as any) || d.displayOn.includes('all')
          );
        }
        return disclaimers;
      }
    }

    // Return default disclaimers if none in cache
    return this.getDefaultDisclaimers(pageType);
  }

  /**
   * Get default legal disclaimers
   */
  private getDefaultDisclaimers(pageType?: string): LegalDisclaimer[] {
    const defaults: LegalDisclaimer[] = [
      {
        id: 'ftc-affiliate',
        type: 'affiliate',
        title: 'Affiliate Disclosure',
        content: 'This page contains affiliate links. We may earn a commission if you make a purchase through these links, at no additional cost to you. This helps support our educational content.',
        required: true,
        displayOn: ['supplement', 'comparison', 'all']
      },
      {
        id: 'fda-supplement',
        type: 'fda',
        title: 'FDA Disclaimer',
        content: 'These statements have not been evaluated by the Food and Drug Administration. These products are not intended to diagnose, treat, cure, or prevent any disease.',
        required: true,
        displayOn: ['supplement', 'all']
      },
      {
        id: 'medical-general',
        type: 'medical',
        title: 'Medical Disclaimer',
        content: 'The information provided on this website is for educational purposes only and is not intended as medical advice. Always consult with a qualified healthcare provider before starting any supplement regimen or making changes to your health routine.',
        required: true,
        displayOn: ['banned', 'supplement', 'medicine', 'comparison', 'all']
      },
      {
        id: 'banned-warning',
        type: 'general',
        title: 'Legal Warning',
        content: 'The substances described on this page may be illegal, restricted, or banned in various jurisdictions. This information is provided for educational and harm-reduction purposes only. We do not encourage or promote the use of any illegal substances.',
        required: true,
        displayOn: ['banned']
      }
    ];

    if (pageType) {
      return defaults.filter(d => 
        d.displayOn.includes(pageType as any) || d.displayOn.includes('all')
      );
    }

    return defaults;
  }

  /**
   * Import legal disclaimers
   */
  async importDisclaimers(disclaimers: LegalDisclaimer[]): Promise<{ imported: number }> {
    if (!this.cache) {
      return { imported: 0 };
    }

    await this.cache.put(
      `${KV_PREFIXES.DISCLAIMER}all`,
      JSON.stringify(disclaimers),
      { expirationTtl: this.cacheTtl }
    );

    return { imported: disclaimers.length };
  }
}

// Export singleton factory
export function createSubstanceDataService(config: SubstanceDataServiceConfig = {}): SubstanceDataService {
  return new SubstanceDataService(config);
}
