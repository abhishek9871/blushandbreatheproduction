'use client';

import Head from 'next/head';
import { useState, useEffect, useCallback } from 'react';
import type { GetStaticProps, InferGetStaticPropsType } from 'next';
import { getVideos } from '@/services/apiService';
import { VideoCard, ErrorMessage } from '@/components';
import { VideoCardSkeleton } from '@/components/skeletons';
import type { Video } from '@/types';

const CATEGORIES = ['All', 'Skincare', 'Makeup', 'Wellness', 'Nutrition'];

interface VideosPageProps {
  initialVideos: Video[];
}

export const getStaticProps: GetStaticProps<VideosPageProps> = async () => {
  try {
    const { data: videos } = await getVideos(1, 'All');
    return {
      props: { initialVideos: videos || [] },
      revalidate: 3600,
    };
  } catch (error) {
    console.error('Failed to fetch videos:', error);
    return {
      props: { initialVideos: [] },
      revalidate: 60,
    };
  }
};

export default function VideosPage({ initialVideos }: InferGetStaticPropsType<typeof getStaticProps>) {
  const [videos, setVideos] = useState<Video[]>(initialVideos);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const fetchVideos = useCallback(async (pageNum: number, category: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, hasMore: more } = await getVideos(pageNum, category);
      if (pageNum === 1) {
        setVideos(data);
      } else {
        setVideos(prev => [...prev, ...data]);
      }
      setHasMore(more);
    } catch {
      setError('Failed to load videos');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch when category changes
  useEffect(() => {
    setPage(1);
    fetchVideos(1, selectedCategory);
  }, [selectedCategory, fetchVideos]);

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchVideos(nextPage, selectedCategory);
    }
  };

  return (
    <>
      <Head>
        <title>Wellness Videos | Blush & Breathe</title>
        <meta name="description" content="Watch health and beauty video guides covering skincare, makeup, wellness, and nutrition tips." />
      </Head>

      <div className="container mx-auto flex flex-1 flex-col px-4 py-8 md:px-6 md:py-12">
        <div className="mb-8 flex flex-col items-center text-center md:mb-12">
          <h1 className="text-4xl font-black tracking-tighter md:text-5xl">Our Video Library</h1>
          <p className="mt-3 max-w-2xl text-base text-text-subtle-light dark:text-text-subtle-dark">
            Explore our collection of health and beauty video guides to help you look and feel your best.
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-10 flex flex-wrap items-center justify-center gap-3">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
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

        {/* Videos Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading && videos.length === 0 ? (
            Array.from({ length: 8 }).map((_, i) => <VideoCardSkeleton key={i} />)
          ) : (
            videos.map((video) => <VideoCard key={video.id} video={video} />)
          )}
        </div>

        {/* Load More Button */}
        {hasMore && videos.length > 0 && (
          <div className="text-center mt-8">
            <button
              onClick={loadMore}
              disabled={loading}
              className="px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load More Videos'}
            </button>
          </div>
        )}

        {/* End Message */}
        {!loading && !hasMore && videos.length > 0 && (
          <p className="text-center text-text-subtle-light dark:text-text-subtle-dark pt-12">
            You&apos;ve reached the end!
          </p>
        )}
      </div>
    </>
  );
}
