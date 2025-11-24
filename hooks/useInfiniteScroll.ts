import { useRef, useCallback, useEffect } from 'react';

interface UseInfiniteScrollOptions {
    loading: boolean;
    hasMore: boolean;
    onLoadMore: () => void;
    rootMargin?: string;
}

export const useInfiniteScroll = ({
    loading,
    hasMore,
    onLoadMore,
    rootMargin = '200px',
}: UseInfiniteScrollOptions) => {
    const observer = useRef<IntersectionObserver | null>(null);
    const loadingRef = useRef(false);

    // Reset loadingRef when key dependencies change (e.g., category change)
    useEffect(() => {
        loadingRef.current = false;
    }, [hasMore, onLoadMore]);

    const lastElementRef = useCallback(
        (node: HTMLElement | null) => {
            if (loading) return;

            // Always reset loadingRef when callback is recreated
            loadingRef.current = false;

            if (observer.current) observer.current.disconnect();

            observer.current = new IntersectionObserver(
                (entries) => {
                    if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
                        loadingRef.current = true;
                        onLoadMore();
                        // Reset loading ref after a delay to prevent rapid consecutive calls
                        setTimeout(() => {
                            loadingRef.current = false;
                        }, 1000);
                    }
                },
                { rootMargin }
            );

            if (node) observer.current.observe(node);
        },
        [loading, hasMore, onLoadMore, rootMargin]
    );

    useEffect(() => {
        // Cleanup observer on unmount
        return () => {
            if (observer.current) {
                observer.current.disconnect();
            }
        };
    }, []);

    return lastElementRef;
};
