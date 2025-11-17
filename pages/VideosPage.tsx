import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { getVideos } from '../services/apiService';
import VideoCard from '../components/VideoCard';
import ErrorMessage from '../components/ErrorMessage';
import VideoCardSkeleton from '../components/skeletons/VideoCardSkeleton';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

const CATEGORIES = ['All', 'Skincare', 'Makeup', 'Wellness', 'Nutrition'];

const VideosPage: React.FC = () => {
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const { data: videos, loading, error, loadingMore, hasMore, loadMore } = useApi(() => getVideos(1, selectedCategory), [selectedCategory]);
    
    const lastElementRef = useInfiniteScroll({
        loading: loadingMore,
        hasMore,
        onLoadMore: loadMore,
    });

    const handleCategoryChange = (category: string) => {
        setSelectedCategory(category);
    };

    return (
        <div className="container mx-auto flex flex-1 flex-col px-4 py-8 md:px-6 md:py-12">
            <div className="mb-8 flex flex-col items-center text-center md:mb-12">
                <h1 className="text-4xl font-black tracking-tighter md:text-5xl">Our Video Library</h1>
                <p className="mt-3 max-w-2xl text-base text-text-subtle-light dark:text-text-subtle-dark">Explore our collection of health and beauty video guides to help you look and feel your best.</p>
            </div>
            <div className="mb-10 flex flex-wrap items-center justify-center gap-3">
                {CATEGORIES.map((category) => (
                    <button
                        key={category}
                        onClick={() => handleCategoryChange(category)}
                        className={`flex h-11 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 text-sm font-medium transition-colors ${
                            selectedCategory === category
                                ? 'bg-primary/20 hover:bg-primary/30'
                                : 'bg-border-light dark:bg-border-dark hover:bg-primary/20'
                        }`}
                    >
                        {category}
                    </button>
                ))}
            </div>
            {error && <ErrorMessage message={error} />}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {loading
                    ? Array.from({ length: 8 }).map((_, i) => <VideoCardSkeleton key={i} />)
                    : videos.map((video, index) => {
                        if (index === videos.length - 1) {
                            return <div ref={lastElementRef} key={video.id}><VideoCard video={video} /></div>;
                        }
                        return <VideoCard key={video.id} video={video} />;
                    })
                }
                {loadingMore && Array.from({ length: 4 }).map((_, i) => <VideoCardSkeleton key={`loading-${i}`} />)}
            </div>
             {!loading && !hasMore && <p className="text-center text-text-subtle-light dark:text-text-subtle-dark pt-12">You've reached the end!</p>}
        </div>
    );
};

export default VideosPage;
