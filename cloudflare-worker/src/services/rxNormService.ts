/**
 * RxNorm API Service
 * 
 * Fetches drug naming and relationship data from the NIH RxNorm API.
 * Documentation: https://lhncbc.nlm.nih.gov/RxNav/APIs/RxNormAPIs.html
 * 
 * RxNorm provides:
 * - Standardized drug names
 * - Drug synonyms
 * - Drug relationships (ingredients, brand names, etc.)
 * - RxCUI (RxNorm Concept Unique Identifier)
 * 
 * No API key required. Rate limiting applies.
 */

import type { RxNormResponse, DrugInteraction, InteractionSeverity } from '../../../types/substance';

const RXNORM_BASE_URL = 'https://rxnav.nlm.nih.gov/REST';

export interface RxNormServiceConfig {
  cache?: KVNamespace;
  cacheTtl?: number; // seconds
}

export interface RxNormDrugInfo {
  rxcui: string;
  name: string;
  synonyms: string[];
  tty: string; // Term Type (SCD, SBD, IN, BN, etc.)
  ingredients: string[];
  brandNames: string[];
  doseForms: string[];
  strengths: string[];
}

export interface RxNormInteraction {
  drugA: string;
  drugB: string;
  severity: string;
  description: string;
  source: string;
}

export class RxNormService {
  private cache?: KVNamespace;
  private cacheTtl: number;

  constructor(config: RxNormServiceConfig = {}) {
    this.cache = config.cache;
    this.cacheTtl = config.cacheTtl || 86400; // 24 hours default
  }

  /**
   * Search for drugs by name and get RxCUI
   */
  async searchByName(drugName: string): Promise<RxNormDrugInfo | null> {
    const cacheKey = `rxnorm:name:${drugName.toLowerCase()}`;
    
    if (this.cache) {
      const cached = await this.cache.get(cacheKey, 'json');
      if (cached) {
        return cached as RxNormDrugInfo;
      }
    }

    try {
      // First, find the RxCUI for the drug name
      const rxcui = await this.getRxCUI(drugName);
      if (!rxcui) {
        return null;
      }

      // Get full drug information
      const drugInfo = await this.getDrugInfoByRxCUI(rxcui);
      
      if (this.cache && drugInfo) {
        await this.cache.put(cacheKey, JSON.stringify(drugInfo), {
          expirationTtl: this.cacheTtl
        });
      }

      return drugInfo;
    } catch (error) {
      console.error('RxNorm searchByName error:', error);
      return null;
    }
  }

  /**
   * Get RxCUI from drug name
   */
  async getRxCUI(drugName: string): Promise<string | null> {
    try {
      const url = `${RXNORM_BASE_URL}/rxcui.json?name=${encodeURIComponent(drugName)}`;
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) return null;

      const data = await response.json();
      const idGroup = data.idGroup;
      
      if (idGroup && idGroup.rxnormId && idGroup.rxnormId.length > 0) {
        return idGroup.rxnormId[0];
      }

      // Try approximate match if exact match fails
      return this.getApproximateRxCUI(drugName);
    } catch (error) {
      console.error('RxNorm getRxCUI error:', error);
      return null;
    }
  }

  /**
   * Get approximate match for drug name
   */
  private async getApproximateRxCUI(drugName: string): Promise<string | null> {
    try {
      const url = `${RXNORM_BASE_URL}/approximateTerm.json?term=${encodeURIComponent(drugName)}&maxEntries=1`;
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) return null;

      const data = await response.json();
      const candidates = data.approximateGroup?.candidate;
      
      if (candidates && candidates.length > 0) {
        return candidates[0].rxcui;
      }

      return null;
    } catch (error) {
      console.error('RxNorm getApproximateRxCUI error:', error);
      return null;
    }
  }

  /**
   * Get comprehensive drug info by RxCUI
   */
  async getDrugInfoByRxCUI(rxcui: string): Promise<RxNormDrugInfo | null> {
    try {
      // Get basic properties
      const propsUrl = `${RXNORM_BASE_URL}/rxcui/${rxcui}/properties.json`;
      const propsResponse = await fetch(propsUrl, {
        headers: { 'Accept': 'application/json' }
      });

      if (!propsResponse.ok) return null;

      const propsData = await propsResponse.json();
      const props = propsData.properties;

      if (!props) return null;

      // Get related concepts (ingredients, brand names, etc.)
      const relatedUrl = `${RXNORM_BASE_URL}/rxcui/${rxcui}/related.json?tty=IN+BN+SBD+SCD`;
      const relatedResponse = await fetch(relatedUrl, {
        headers: { 'Accept': 'application/json' }
      });

      let ingredients: string[] = [];
      let brandNames: string[] = [];
      let doseForms: string[] = [];
      let strengths: string[] = [];

      if (relatedResponse.ok) {
        const relatedData = await relatedResponse.json();
        const conceptGroups = relatedData.relatedGroup?.conceptGroup || [];

        for (const group of conceptGroups) {
          const concepts = group.conceptProperties || [];
          
          switch (group.tty) {
            case 'IN': // Ingredient
              ingredients = concepts.map((c: any) => c.name);
              break;
            case 'BN': // Brand Name
              brandNames = concepts.map((c: any) => c.name);
              break;
            case 'DF': // Dose Form
              doseForms = concepts.map((c: any) => c.name);
              break;
          }
        }
      }

      // Get all synonyms
      const synonyms = await this.getSynonyms(rxcui);

      return {
        rxcui,
        name: props.name,
        synonyms,
        tty: props.tty,
        ingredients,
        brandNames,
        doseForms,
        strengths
      };
    } catch (error) {
      console.error('RxNorm getDrugInfoByRxCUI error:', error);
      return null;
    }
  }

  /**
   * Get all synonyms for a drug
   */
  async getSynonyms(rxcui: string): Promise<string[]> {
    try {
      const url = `${RXNORM_BASE_URL}/rxcui/${rxcui}/allProperties.json?prop=NAMES`;
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) return [];

      const data = await response.json();
      const propConcepts = data.propConceptGroup?.propConcept || [];
      
      return propConcepts.map((p: any) => p.propValue).filter(Boolean);
    } catch (error) {
      console.error('RxNorm getSynonyms error:', error);
      return [];
    }
  }

  /**
   * Get drug interactions from RxNorm Interaction API
   */
  async getInteractions(rxcui: string): Promise<DrugInteraction[]> {
    const cacheKey = `rxnorm:interactions:${rxcui}`;
    
    if (this.cache) {
      const cached = await this.cache.get(cacheKey, 'json');
      if (cached) {
        return cached as DrugInteraction[];
      }
    }

    try {
      const url = `${RXNORM_BASE_URL}/interaction/interaction.json?rxcui=${rxcui}`;
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) return [];

      const data = await response.json();
      const interactionGroups = data.interactionTypeGroup || [];
      
      const interactions: DrugInteraction[] = [];

      for (const group of interactionGroups) {
        const interactionTypes = group.interactionType || [];
        
        for (const type of interactionTypes) {
          const pairs = type.interactionPair || [];
          
          for (const pair of pairs) {
            const concepts = pair.interactionConcept || [];
            if (concepts.length < 2) continue;

            const severity = this.mapSeverity(pair.severity);
            
            interactions.push({
              id: `rxnorm-${concepts[0].minConceptItem.rxcui}-${concepts[1].minConceptItem.rxcui}`,
              drugA: {
                name: concepts[0].minConceptItem.name,
                slug: this.createSlug(concepts[0].minConceptItem.name),
                type: 'medicine'
              },
              drugB: {
                name: concepts[1].minConceptItem.name,
                slug: this.createSlug(concepts[1].minConceptItem.name),
                type: 'medicine'
              },
              severity,
              description: pair.description || '',
              mechanism: '',
              clinicalEffects: [],
              management: '',
              documentation: 'good',
              sources: [group.sourceName || 'RxNorm'],
              lastVerified: new Date().toISOString()
            });
          }
        }
      }

      if (this.cache && interactions.length > 0) {
        await this.cache.put(cacheKey, JSON.stringify(interactions), {
          expirationTtl: this.cacheTtl
        });
      }

      return interactions;
    } catch (error) {
      console.error('RxNorm getInteractions error:', error);
      return [];
    }
  }

  /**
   * Check interaction between two drugs by name
   */
  async checkInteraction(drugA: string, drugB: string): Promise<DrugInteraction[]> {
    try {
      // Get RxCUIs for both drugs
      const rxcuiA = await this.getRxCUI(drugA);
      const rxcuiB = await this.getRxCUI(drugB);

      if (!rxcuiA || !rxcuiB) {
        return [];
      }

      const url = `${RXNORM_BASE_URL}/interaction/list.json?rxcuis=${rxcuiA}+${rxcuiB}`;
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) return [];

      const data = await response.json();
      const fullInteractionTypeGroup = data.fullInteractionTypeGroup || [];
      
      const interactions: DrugInteraction[] = [];

      for (const group of fullInteractionTypeGroup) {
        const interactionTypes = group.fullInteractionType || [];
        
        for (const type of interactionTypes) {
          const pairs = type.interactionPair || [];
          
          for (const pair of pairs) {
            interactions.push({
              id: `rxnorm-${rxcuiA}-${rxcuiB}`,
              drugA: {
                name: drugA,
                slug: this.createSlug(drugA),
                type: 'medicine'
              },
              drugB: {
                name: drugB,
                slug: this.createSlug(drugB),
                type: 'medicine'
              },
              severity: this.mapSeverity(pair.severity),
              description: pair.description || '',
              mechanism: '',
              clinicalEffects: [],
              management: '',
              documentation: 'good',
              sources: [group.sourceName || 'RxNorm'],
              lastVerified: new Date().toISOString()
            });
          }
        }
      }

      return interactions;
    } catch (error) {
      console.error('RxNorm checkInteraction error:', error);
      return [];
    }
  }

  /**
   * Get spelling suggestions for drug name
   */
  async getSpellingSuggestions(term: string): Promise<string[]> {
    try {
      const url = `${RXNORM_BASE_URL}/spellingsuggestions.json?name=${encodeURIComponent(term)}`;
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) return [];

      const data = await response.json();
      return data.suggestionGroup?.suggestionList?.suggestion || [];
    } catch (error) {
      console.error('RxNorm getSpellingSuggestions error:', error);
      return [];
    }
  }

  /**
   * Map RxNorm severity to our severity type
   */
  private mapSeverity(rxnormSeverity?: string): InteractionSeverity {
    if (!rxnormSeverity) return 'moderate';
    
    const lower = rxnormSeverity.toLowerCase();
    if (lower.includes('high') || lower.includes('severe') || lower.includes('major')) {
      return 'major';
    }
    if (lower.includes('contraindicated')) {
      return 'contraindicated';
    }
    if (lower.includes('low') || lower.includes('minor')) {
      return 'minor';
    }
    return 'moderate';
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
}

// Export singleton factory
export function createRxNormService(config: RxNormServiceConfig = {}): RxNormService {
  return new RxNormService(config);
}
