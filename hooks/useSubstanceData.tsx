/**
 * React Hooks for Substance Data Fetching
 * 
 * Custom hooks for fetching substance education data from the API.
 * Includes loading states, error handling, and caching.
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  MedicineInfo,
  BannedSubstance,
  LegalSupplement,
  AffiliateProduct,
  DrugInteraction,
  SearchResult,
  SubstanceAPIResponse,
  SubstanceListResponse,
  SubstanceSearchParams,
} from '@/types';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface UseDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseListResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasNextPage: boolean;
  };
  refetch: () => void;
  loadMore: () => void;
}

// ═══════════════════════════════════════════════════════════════════
// MEDICINE HOOK
// ═══════════════════════════════════════════════════════════════════

/**
 * Hook to fetch medicine information by name
 */
export function useMedicine(name: string | undefined): UseDataResult<MedicineInfo> {
  const [data, setData] = useState<MedicineInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!name) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/substances/medicine/${encodeURIComponent(name)}`);
      const result: SubstanceAPIResponse<MedicineInfo> = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to fetch medicine data');
        setData(null);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [name]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ═══════════════════════════════════════════════════════════════════
// BANNED SUBSTANCE HOOK
// ═══════════════════════════════════════════════════════════════════

/**
 * Hook to fetch banned substance information by slug
 */
export function useBannedSubstance(slug: string | undefined): UseDataResult<BannedSubstance> {
  const [data, setData] = useState<BannedSubstance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!slug) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/substances/banned/${encodeURIComponent(slug)}`);
      const result: SubstanceAPIResponse<BannedSubstance> = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to fetch substance data');
        setData(null);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ═══════════════════════════════════════════════════════════════════
// SUPPLEMENT HOOK
// ═══════════════════════════════════════════════════════════════════

/**
 * Hook to fetch legal supplement information by slug
 */
export function useSupplement(slug: string | undefined): UseDataResult<LegalSupplement> {
  const [data, setData] = useState<LegalSupplement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!slug) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/substances/supplement/${encodeURIComponent(slug)}`);
      const result: SubstanceAPIResponse<LegalSupplement> = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to fetch supplement data');
        setData(null);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ═══════════════════════════════════════════════════════════════════
// AFFILIATE PRODUCTS HOOK
// ═══════════════════════════════════════════════════════════════════

/**
 * Hook to fetch affiliate products for a supplement
 */
export function useAffiliateProducts(supplementSlug: string | undefined): UseDataResult<AffiliateProduct[]> {
  const [data, setData] = useState<AffiliateProduct[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!supplementSlug) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/substances/affiliate/${encodeURIComponent(supplementSlug)}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data || []);
      } else {
        setError(result.error || 'Failed to fetch affiliate products');
        setData(null);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [supplementSlug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ═══════════════════════════════════════════════════════════════════
// DRUG INTERACTIONS HOOK
// ═══════════════════════════════════════════════════════════════════

/**
 * Hook to check drug interactions between two substances
 */
export function useDrugInteractions(
  drugA: string | undefined,
  drugB: string | undefined
): UseDataResult<DrugInteraction[]> {
  const [data, setData] = useState<DrugInteraction[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!drugA || !drugB) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ drugA, drugB });
      const response = await fetch(`/api/substances/interactions?${params}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data || []);
      } else {
        setError(result.error || 'Failed to check interactions');
        setData(null);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [drugA, drugB]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ═══════════════════════════════════════════════════════════════════
// SEARCH HOOK
// ═══════════════════════════════════════════════════════════════════

/**
 * Hook for searching substances
 */
export function useSubstanceSearch(params: SubstanceSearchParams): UseListResult<SearchResult> {
  const [data, setData] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    hasNextPage: false,
  });

  const fetchData = useCallback(async (append: boolean = false) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.query) queryParams.set('q', params.query);
      if (params.type) queryParams.set('type', params.type.join(','));
      queryParams.set('page', String(append ? pagination.page + 1 : params.page || 1));
      queryParams.set('pageSize', String(params.pageSize || 20));

      const response = await fetch(`/api/substances/search?${queryParams}`);
      const result: SubstanceListResponse<SearchResult> = await response.json();

      if (result.success) {
        if (append) {
          setData(prev => [...prev, ...result.data]);
        } else {
          setData(result.data);
        }
        setPagination(result.pagination);
      } else {
        setError(result.error || 'Search failed');
        if (!append) {
          setData([]);
        }
      }
    } catch (err) {
      setError('Network error. Please try again.');
      if (!append) {
        setData([]);
      }
    } finally {
      setLoading(false);
    }
  }, [params.query, params.type, params.page, params.pageSize, pagination.page]);

  useEffect(() => {
    fetchData(false);
  }, [params.query, params.type, params.pageSize]);

  const loadMore = useCallback(() => {
    if (pagination.hasNextPage && !loading) {
      fetchData(true);
    }
  }, [pagination.hasNextPage, loading, fetchData]);

  return {
    data,
    loading,
    error,
    pagination,
    refetch: () => fetchData(false),
    loadMore,
  };
}

// ═══════════════════════════════════════════════════════════════════
// LEGAL ALTERNATIVES HOOK
// ═══════════════════════════════════════════════════════════════════

/**
 * Hook to fetch legal alternatives for a banned substance
 */
export function useLegalAlternatives(bannedSlug: string | undefined): UseDataResult<LegalSupplement[]> {
  const [data, setData] = useState<LegalSupplement[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!bannedSlug) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First get the banned substance to get its alternatives
      const bannedResponse = await fetch(`/api/substances/banned/${encodeURIComponent(bannedSlug)}`);
      const bannedResult: SubstanceAPIResponse<BannedSubstance> = await bannedResponse.json();

      if (!bannedResult.success || !bannedResult.data) {
        setError('Substance not found');
        setData(null);
        return;
      }

      // Fetch each alternative
      const alternatives: LegalSupplement[] = [];
      for (const altSlug of bannedResult.data.legalAlternatives) {
        try {
          const altResponse = await fetch(`/api/substances/supplement/${encodeURIComponent(altSlug)}`);
          const altResult: SubstanceAPIResponse<LegalSupplement> = await altResponse.json();
          if (altResult.success && altResult.data) {
            alternatives.push(altResult.data);
          }
        } catch {
          // Skip failed alternatives
        }
      }

      setData(alternatives);
    } catch (err) {
      setError('Network error. Please try again.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [bannedSlug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ═══════════════════════════════════════════════════════════════════
// UTILITY HOOKS
// ═══════════════════════════════════════════════════════════════════

/**
 * Hook to track affiliate link clicks
 */
export function useAffiliateClickTracking() {
  const trackClick = useCallback(async (product: AffiliateProduct) => {
    try {
      // Fire and forget - don't block the user
      fetch('/api/substances/affiliate/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          affiliateNetwork: product.affiliateNetwork,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {
        // Silently fail - tracking should not block user
      });

      // Open affiliate link
      window.open(product.affiliateUrl, '_blank', 'noopener,noreferrer');
    } catch {
      // Still open the link even if tracking fails
      window.open(product.affiliateUrl, '_blank', 'noopener,noreferrer');
    }
  }, []);

  return { trackClick };
}
