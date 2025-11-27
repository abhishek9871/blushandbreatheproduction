/**
 * OpenFDA API Service
 * 
 * Fetches drug/medicine data from the FDA's public API.
 * Documentation: https://open.fda.gov/apis/drug/
 * 
 * Rate Limits:
 * - Without API key: 40 requests/minute, 1000/day
 * - With API key: 240 requests/minute
 */

import type { MedicineInfo, OpenFDAResponse, OpenFDADrugResult, DrugLabel, ActiveIngredient } from '../../../types/substance';

// OpenFDA API endpoints
const OPENFDA_BASE_URL = 'https://api.fda.gov/drug';
const ENDPOINTS = {
  label: `${OPENFDA_BASE_URL}/label.json`,
  ndc: `${OPENFDA_BASE_URL}/ndc.json`,
  event: `${OPENFDA_BASE_URL}/event.json`,
};

export interface OpenFDAServiceConfig {
  apiKey?: string;
  cache?: KVNamespace;
  cacheTtl?: number; // seconds
}

export class OpenFDAService {
  private apiKey?: string;
  private cache?: KVNamespace;
  private cacheTtl: number;

  constructor(config: OpenFDAServiceConfig = {}) {
    this.apiKey = config.apiKey;
    this.cache = config.cache;
    this.cacheTtl = config.cacheTtl || 86400; // 24 hours default
  }

  /**
   * Search for drug label information by name
   */
  async searchByName(drugName: string): Promise<MedicineInfo | null> {
    const cacheKey = `openfda:name:${drugName.toLowerCase()}`;
    
    // Check cache first
    if (this.cache) {
      const cached = await this.cache.get(cacheKey, 'json');
      if (cached) {
        return cached as MedicineInfo;
      }
    }

    try {
      // Search in both brand_name and generic_name fields
      const searchQuery = encodeURIComponent(
        `openfda.brand_name:"${drugName}" OR openfda.generic_name:"${drugName}"`
      );
      
      const url = this.buildUrl(ENDPOINTS.label, { search: searchQuery, limit: '1' });
      const response = await this.fetchWithRetry(url);
      
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`OpenFDA API error: ${response.status}`);
      }

      const data: OpenFDAResponse = await response.json();
      
      if (!data.results || data.results.length === 0) {
        return null;
      }

      const result = this.transformToMedicineInfo(data.results[0], drugName);
      
      // Cache the result
      if (this.cache && result) {
        await this.cache.put(cacheKey, JSON.stringify(result), {
          expirationTtl: this.cacheTtl
        });
      }

      return result;
    } catch (error) {
      console.error('OpenFDA searchByName error:', error);
      return null;
    }
  }

  /**
   * Search by NDC (National Drug Code)
   */
  async searchByNDC(ndcCode: string): Promise<MedicineInfo | null> {
    const cacheKey = `openfda:ndc:${ndcCode}`;
    
    if (this.cache) {
      const cached = await this.cache.get(cacheKey, 'json');
      if (cached) {
        return cached as MedicineInfo;
      }
    }

    try {
      const searchQuery = encodeURIComponent(`openfda.product_ndc:"${ndcCode}"`);
      const url = this.buildUrl(ENDPOINTS.label, { search: searchQuery, limit: '1' });
      const response = await this.fetchWithRetry(url);
      
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`OpenFDA API error: ${response.status}`);
      }

      const data: OpenFDAResponse = await response.json();
      
      if (!data.results || data.results.length === 0) {
        return null;
      }

      const result = this.transformToMedicineInfo(data.results[0], ndcCode);
      
      if (this.cache && result) {
        await this.cache.put(cacheKey, JSON.stringify(result), {
          expirationTtl: this.cacheTtl
        });
      }

      return result;
    } catch (error) {
      console.error('OpenFDA searchByNDC error:', error);
      return null;
    }
  }

  /**
   * Get adverse events for a drug
   */
  async getAdverseEvents(drugName: string, limit: number = 10): Promise<any[]> {
    try {
      const searchQuery = encodeURIComponent(`patient.drug.openfda.generic_name:"${drugName}"`);
      const url = this.buildUrl(ENDPOINTS.event, { search: searchQuery, limit: limit.toString() });
      const response = await this.fetchWithRetry(url);
      
      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('OpenFDA getAdverseEvents error:', error);
      return [];
    }
  }

  /**
   * Transform OpenFDA result to our MedicineInfo type
   */
  private transformToMedicineInfo(result: OpenFDADrugResult, searchTerm: string): MedicineInfo {
    const openfda = result.openfda || {};
    
    // Extract active ingredients
    const activeIngredients: ActiveIngredient[] = [];
    if (result.active_ingredient) {
      const ingredients = Array.isArray(result.active_ingredient) 
        ? result.active_ingredient 
        : [result.active_ingredient];
      
      for (const ing of ingredients) {
        // Parse ingredient string like "ACETAMINOPHEN 500 mg"
        const match = ing.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*(.+)$/);
        if (match) {
          activeIngredients.push({
            name: match[1].trim(),
            strength: match[2],
            unit: match[3].trim()
          });
        } else {
          activeIngredients.push({
            name: ing,
            strength: '',
            unit: ''
          });
        }
      }
    }

    // Build drug label object
    const label: DrugLabel = {
      indicationsAndUsage: this.extractText(result.indications_and_usage),
      dosageAndAdministration: this.extractText(result.dosage_and_administration),
      warnings: this.extractText(result.warnings),
      adverseReactions: this.extractText(result.adverse_reactions),
      drugInteractions: this.extractText(result.drug_interactions),
      contraindications: this.extractText(result.contraindications),
      overdosage: this.extractText(result.overdosage),
      clinicalPharmacology: this.extractText(result.clinical_pharmacology),
    };

    // Create slug from generic name or brand name
    const primaryName = openfda.generic_name?.[0] || openfda.brand_name?.[0] || searchTerm;
    const slug = this.createSlug(primaryName);

    return {
      id: `openfda-${openfda.product_ndc?.[0] || slug}`,
      slug,
      
      brandName: openfda.brand_name?.[0] || '',
      genericName: openfda.generic_name?.[0] || '',
      alternativeNames: [
        ...(openfda.brand_name || []),
        ...(openfda.generic_name || [])
      ].filter((v, i, a) => a.indexOf(v) === i), // Remove duplicates
      
      drugClass: openfda.pharm_class_epc || [],
      pharmacologicClass: openfda.pharm_class_epc || [],
      
      activeIngredients,
      inactiveIngredients: result.inactive_ingredient,
      
      dosageForms: result.dosage_form || [],
      routesOfAdministration: openfda.route || [],
      
      manufacturer: {
        name: openfda.manufacturer_name?.[0] || 'Unknown',
      },
      ndcCodes: openfda.product_ndc || [],
      
      label,
      
      pillImages: [], // Will be populated from DailyMed
      
      fdaApplicationNumber: undefined,
      approvalDate: undefined,
      marketStatus: 'prescription', // Default, can be refined
      
      rxcui: openfda.rxcui?.[0],
      rxnormSynonyms: [],
      
      metaTitle: `${primaryName} - Drug Information, Side Effects & Dosage`,
      metaDescription: `Learn about ${primaryName}: uses, dosage, side effects, warnings, and drug interactions. Comprehensive medication guide.`,
      keywords: [
        primaryName.toLowerCase(),
        ...(openfda.brand_name || []).map(n => n.toLowerCase()),
        ...(openfda.generic_name || []).map(n => n.toLowerCase()),
        'drug information',
        'medication guide',
        'side effects'
      ],
      
      sources: {
        openFDA: true,
        rxNorm: false,
        dailyMed: false
      },
      
      lastUpdated: new Date().toISOString(),
      fetchedAt: new Date().toISOString()
    };
  }

  /**
   * Extract text from array or return empty string
   */
  private extractText(field: string[] | undefined): string {
    if (!field || field.length === 0) return '';
    return field.join('\n\n');
  }

  /**
   * Create URL-friendly slug
   */
  private createSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Build URL with query parameters
   */
  private buildUrl(baseUrl: string, params: Record<string, string>): string {
    const url = new URL(baseUrl);
    
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    
    // Add API key if available
    if (this.apiKey) {
      url.searchParams.set('api_key', this.apiKey);
    }
    
    return url.toString();
  }

  /**
   * Fetch with retry logic for rate limiting
   */
  private async fetchWithRetry(url: string, retries: number = 3): Promise<Response> {
    for (let i = 0; i < retries; i++) {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SubstanceEducation/1.0'
        }
      });

      // If rate limited, wait and retry
      if (response.status === 429) {
        const waitTime = Math.pow(2, i) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      return response;
    }

    throw new Error('Max retries exceeded');
  }
}

// Export singleton factory
export function createOpenFDAService(config: OpenFDAServiceConfig = {}): OpenFDAService {
  return new OpenFDAService(config);
}
