import { useState, useEffect, useCallback } from 'react';

type Fetcher<T> = (page: number) => Promise<{ data: T[]; hasMore: boolean }>;

export function useApi<T>(fetcher: Fetcher<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadData = useCallback(async (currentPage: number) => {
    if (currentPage === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);
    try {
      const result = await fetcher(currentPage);
      setItems(prev => currentPage === 1 ? result.data : [...prev, ...result.data]);
      setHasMore(result.hasMore);
    } catch (err) {
      setError('Failed to fetch data.');
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [fetcher]);

  useEffect(() => {
    loadData(1);
  }, [loadData]);
  
  const loadMore = () => {
    if (hasMore && !loadingMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadData(nextPage);
    }
  };

  const refetch = () => {
    setPage(1);
    setItems([]);
    loadData(1);
  }

  return { data: items, loading, loadingMore, error, refetch, loadMore, hasMore };
}
