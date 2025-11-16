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

    const lastElementRef = useCallback(
        (node: HTMLElement | null) => {
            if (loading) return;

            if (observer.current) observer.current.disconnect();

            observer.current = new IntersectionObserver(
                (entries) => {
                    if (entries[0].isIntersecting && hasMore) {
                        onLoadMore();
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
