/**
 * Substance Education API Routes
 * 
 * Handles all substance-related API endpoints:
 * - GET /api/medicine/:name - Medicine information from OpenFDA/RxNorm
 * - GET /api/banned/:slug - Banned substance information
 * - GET /api/supplement/:slug - Legal supplement information
 * - GET /api/affiliate/:ingredient - Affiliate product recommendations
 * - GET /api/interactions - Drug interaction checker
 * - GET /api/search - Search across all substances
 * - POST /api/admin/import - Import data (admin only)
 */

import { createOpenFDAService } from '../services/openFDAService';
import { createRxNormService } from '../services/rxNormService';
import { createSubstanceDataService } from '../services/substanceDataService';
import type {
  MedicineInfo,
  BannedSubstance,
  LegalSupplement,
  AffiliateProduct,
  SubstanceSearchParams,
} from '../../../types/substance';

// Extended Env interface for substance services
export interface SubstanceEnv {
  SUBSTANCE_CACHE?: KVNamespace;
  MEDICINE_CACHE?: KVNamespace;
  AFFILIATE_DATA?: KVNamespace;
  OPENFDA_API_KEY?: string;
  ADMIN_AUTH_TOKEN?: string;
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Helper: JSON Response
function jsonResponse(data: unknown, status: number = 200, cache: boolean = true): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...(cache ? { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' } : {}),
      ...corsHeaders,
    },
  });
}

// Helper: Error Response
function errorResponse(message: string, status: number = 400): Response {
  return jsonResponse({ success: false, error: message }, status, false);
}

/**
 * Handle substance-related routes
 */
export async function handleSubstanceRoutes(
  request: Request,
  env: SubstanceEnv,
  pathname: string
): Promise<Response | null> {
  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Initialize services
  const openFDAService = createOpenFDAService({
    apiKey: env.OPENFDA_API_KEY,
    cache: env.MEDICINE_CACHE,
  });

  const rxNormService = createRxNormService({
    cache: env.MEDICINE_CACHE,
  });

  const substanceService = createSubstanceDataService({
    cache: env.SUBSTANCE_CACHE,
  });

  const url = new URL(request.url);

  // ═══════════════════════════════════════════════════════════════════
  // MEDICINE ROUTES
  // ═══════════════════════════════════════════════════════════════════

  // GET /api/medicine/:name
  const medicineMatch = pathname.match(/^\/api\/medicine\/([^\/]+)$/);
  if (medicineMatch && request.method === 'GET') {
    const drugName = decodeURIComponent(medicineMatch[1]);
    
    try {
      // Try OpenFDA first
      let medicine = await openFDAService.searchByName(drugName);
      
      if (medicine) {
        // Enrich with RxNorm data
        const rxNormData = await rxNormService.searchByName(drugName);
        if (rxNormData) {
          medicine.rxcui = rxNormData.rxcui;
          medicine.rxnormSynonyms = rxNormData.synonyms;
          medicine.sources.rxNorm = true;
        }

        return jsonResponse({
          success: true,
          data: medicine,
          source: 'openfda',
        });
      }

      // Fallback to RxNorm only
      const rxNormOnly = await rxNormService.searchByName(drugName);
      if (rxNormOnly) {
        return jsonResponse({
          success: true,
          data: {
            slug: drugName.toLowerCase().replace(/\s+/g, '-'),
            genericName: rxNormOnly.name,
            brandName: rxNormOnly.brandNames[0] || '',
            rxcui: rxNormOnly.rxcui,
            rxnormSynonyms: rxNormOnly.synonyms,
            sources: { openFDA: false, rxNorm: true, dailyMed: false },
          },
          source: 'rxnorm',
        });
      }

      return errorResponse('Medicine not found', 404);
    } catch (error) {
      console.error('Medicine lookup error:', error);
      return errorResponse('Failed to fetch medicine data', 500);
    }
  }

  // GET /api/medicine/:name/interactions
  const interactionsMatch = pathname.match(/^\/api\/medicine\/([^\/]+)\/interactions$/);
  if (interactionsMatch && request.method === 'GET') {
    const drugName = decodeURIComponent(interactionsMatch[1]);
    
    try {
      const rxcui = await rxNormService.getRxCUI(drugName);
      if (!rxcui) {
        return errorResponse('Drug not found in RxNorm', 404);
      }

      const interactions = await rxNormService.getInteractions(rxcui);
      return jsonResponse({
        success: true,
        data: interactions,
        drug: drugName,
        rxcui,
      });
    } catch (error) {
      console.error('Interactions lookup error:', error);
      return errorResponse('Failed to fetch interactions', 500);
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // BANNED SUBSTANCE ROUTES
  // ═══════════════════════════════════════════════════════════════════

  // GET /api/banned - List all
  if (pathname === '/api/banned' && request.method === 'GET') {
    const result = await substanceService.getAllBannedSubstances();
    return jsonResponse(result);
  }

  // GET /api/banned/:slug
  const bannedMatch = pathname.match(/^\/api\/banned\/([^\/]+)$/);
  if (bannedMatch && request.method === 'GET') {
    const slug = decodeURIComponent(bannedMatch[1]);
    const result = await substanceService.getBannedSubstance(slug);
    
    if (!result.success) {
      return errorResponse(result.error || 'Not found', 404);
    }
    
    return jsonResponse(result);
  }

  // GET /api/banned/:slug/alternatives
  const altMatch = pathname.match(/^\/api\/banned\/([^\/]+)\/alternatives$/);
  if (altMatch && request.method === 'GET') {
    const slug = decodeURIComponent(altMatch[1]);
    const alternatives = await substanceService.getLegalAlternatives(slug);
    
    return jsonResponse({
      success: true,
      data: alternatives,
      bannedSubstance: slug,
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // SUPPLEMENT ROUTES
  // ═══════════════════════════════════════════════════════════════════

  // GET /api/supplement - List all
  if (pathname === '/api/supplement' && request.method === 'GET') {
    const result = await substanceService.getAllLegalSupplements();
    return jsonResponse(result);
  }

  // GET /api/supplement/:slug
  const suppMatch = pathname.match(/^\/api\/supplement\/([^\/]+)$/);
  if (suppMatch && request.method === 'GET') {
    const slug = decodeURIComponent(suppMatch[1]);
    const result = await substanceService.getLegalSupplement(slug);
    
    if (!result.success) {
      return errorResponse(result.error || 'Not found', 404);
    }
    
    return jsonResponse(result);
  }

  // ═══════════════════════════════════════════════════════════════════
  // AFFILIATE ROUTES
  // ═══════════════════════════════════════════════════════════════════

  // GET /api/affiliate/:ingredient
  const affiliateMatch = pathname.match(/^\/api\/affiliate\/([^\/]+)$/);
  if (affiliateMatch && request.method === 'GET') {
    const ingredient = decodeURIComponent(affiliateMatch[1]);
    const products = await substanceService.getAffiliateProducts(ingredient);
    
    return jsonResponse({
      success: true,
      data: products,
      ingredient,
    });
  }

  // GET /api/affiliate - List all products
  if (pathname === '/api/affiliate' && request.method === 'GET') {
    const products = await substanceService.getAllAffiliateProducts();
    return jsonResponse({
      success: true,
      data: products,
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // SEARCH & UTILITY ROUTES
  // ═══════════════════════════════════════════════════════════════════

  // GET /api/substances/search
  if (pathname === '/api/substances/search' && request.method === 'GET') {
    const params: SubstanceSearchParams = {
      query: url.searchParams.get('q') || undefined,
      type: url.searchParams.get('type')?.split(',') as any,
      page: parseInt(url.searchParams.get('page') || '1'),
      pageSize: parseInt(url.searchParams.get('pageSize') || '20'),
    };

    const result = await substanceService.search(params);
    return jsonResponse(result);
  }

  // GET /api/interactions/check
  if (pathname === '/api/interactions/check' && request.method === 'GET') {
    const drugA = url.searchParams.get('drugA');
    const drugB = url.searchParams.get('drugB');

    if (!drugA || !drugB) {
      return errorResponse('Both drugA and drugB parameters required', 400);
    }

    const interactions = await rxNormService.checkInteraction(drugA, drugB);
    return jsonResponse({
      success: true,
      data: interactions,
      drugs: [drugA, drugB],
    });
  }

  // GET /api/disclaimers
  if (pathname === '/api/disclaimers' && request.method === 'GET') {
    const pageType = url.searchParams.get('type') || undefined;
    const disclaimers = await substanceService.getDisclaimers(pageType);
    
    return jsonResponse({
      success: true,
      data: disclaimers,
    });
  }

  // GET /api/spelling-suggestions
  if (pathname === '/api/spelling-suggestions' && request.method === 'GET') {
    const term = url.searchParams.get('term');
    if (!term) {
      return errorResponse('term parameter required', 400);
    }

    const suggestions = await rxNormService.getSpellingSuggestions(term);
    return jsonResponse({
      success: true,
      data: suggestions,
      term,
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // ADMIN ROUTES (Protected)
  // ═══════════════════════════════════════════════════════════════════

  // POST /api/admin/import/banned
  if (pathname === '/api/admin/import/banned' && request.method === 'POST') {
    // Verify auth
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || authHeader !== `Bearer ${env.ADMIN_AUTH_TOKEN}`) {
      return errorResponse('Unauthorized', 401);
    }

    try {
      const body = await request.json() as { substances: BannedSubstance[] };
      const result = await substanceService.importBannedSubstances(body.substances);
      
      return jsonResponse({
        success: true,
        imported: result.imported,
        errors: result.errors,
      }, 200, false);
    } catch (error) {
      return errorResponse('Invalid JSON body', 400);
    }
  }

  // POST /api/admin/import/supplements
  if (pathname === '/api/admin/import/supplements' && request.method === 'POST') {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || authHeader !== `Bearer ${env.ADMIN_AUTH_TOKEN}`) {
      return errorResponse('Unauthorized', 401);
    }

    try {
      const body = await request.json() as { supplements: LegalSupplement[] };
      const result = await substanceService.importLegalSupplements(body.supplements);
      
      return jsonResponse({
        success: true,
        imported: result.imported,
        errors: result.errors,
      }, 200, false);
    } catch (error) {
      return errorResponse('Invalid JSON body', 400);
    }
  }

  // POST /api/admin/import/affiliates
  if (pathname === '/api/admin/import/affiliates' && request.method === 'POST') {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || authHeader !== `Bearer ${env.ADMIN_AUTH_TOKEN}`) {
      return errorResponse('Unauthorized', 401);
    }

    try {
      const body = await request.json() as { products: AffiliateProduct[] };
      const result = await substanceService.importAffiliateProducts(body.products);
      
      return jsonResponse({
        success: true,
        imported: result.imported,
        errors: result.errors,
      }, 200, false);
    } catch (error) {
      return errorResponse('Invalid JSON body', 400);
    }
  }

  // No match found
  return null;
}

/**
 * Export route patterns for documentation
 */
export const SUBSTANCE_ROUTES = {
  medicine: {
    get: '/api/medicine/:name',
    interactions: '/api/medicine/:name/interactions',
  },
  banned: {
    list: '/api/banned',
    get: '/api/banned/:slug',
    alternatives: '/api/banned/:slug/alternatives',
  },
  supplement: {
    list: '/api/supplement',
    get: '/api/supplement/:slug',
  },
  affiliate: {
    list: '/api/affiliate',
    get: '/api/affiliate/:ingredient',
  },
  search: '/api/substances/search',
  interactions: '/api/interactions/check',
  disclaimers: '/api/disclaimers',
  suggestions: '/api/spelling-suggestions',
  admin: {
    importBanned: '/api/admin/import/banned',
    importSupplements: '/api/admin/import/supplements',
    importAffiliates: '/api/admin/import/affiliates',
  },
};
