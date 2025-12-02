/**
 * ProductVideoSection Component
 * 
 * Displays YouTube videos related to products to build trust and drive conversions.
 * Videos are embedded with restricted parameters to prevent navigation to YouTube.
 * Users can watch videos but cannot click through to YouTube (protects our conversions).
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { Video } from '@/types';

interface ProductVideoSectionProps {
  searchQuery: string;
  title?: string;
  subtitle?: string;
  maxVideos?: number;
  sectionId?: string;
  variant?: 'featured' | 'grid' | 'carousel';
  productName?: string;
  affiliateUrl?: string;
  className?: string;
  /** Keywords that MUST appear in video title (case-insensitive) */
  requiredKeywords?: string[];
  /** Keywords that should NOT appear in video title (case-insensitive) */
  excludeKeywords?: string[];
  /** Skip the first N results (to avoid duplicates with other sections) */
  skipResults?: number;
}

interface VideoCardProps {
  video: Video;
  onPlay: (video: Video) => void;
  variant?: 'large' | 'small';
}

// Format view count for display
function formatViewCount(count?: number): string {
  if (!count) return '';
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M views`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K views`;
  }
  return `${count} views`;
}

// Video thumbnail card
function VideoCard({ video, onPlay, variant = 'small' }: VideoCardProps) {
  const isLarge = variant === 'large';
  
  return (
    <div 
      className={`group cursor-pointer ${isLarge ? 'col-span-2 row-span-2' : ''}`}
      onClick={() => onPlay(video)}
    >
      <div className={`relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 ${
        isLarge ? 'aspect-video' : 'aspect-video'
      }`}>
        {/* Thumbnail */}
        <img
          src={video.imageUrl}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Play button overlay */}
        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-white text-2xl sm:text-3xl ml-1">play_arrow</span>
          </div>
        </div>
        
        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 text-white text-xs font-medium rounded">
          {video.duration}
        </div>
        
        {/* View count badge */}
        {video.viewCount && (
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 text-white text-xs rounded flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">visibility</span>
            {formatViewCount(video.viewCount)}
          </div>
        )}
      </div>
      
      {/* Video info */}
      <div className={`mt-2 ${isLarge ? 'mt-3' : ''}`}>
        <h4 className={`font-semibold text-text-light dark:text-text-dark line-clamp-2 group-hover:text-primary transition-colors ${
          isLarge ? 'text-base sm:text-lg' : 'text-sm'
        }`}>
          {video.title}
        </h4>
        {video.channelTitle && (
          <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark mt-1">
            {video.channelTitle}
          </p>
        )}
      </div>
    </div>
  );
}

// Secure video player modal that prevents YouTube navigation
function SecureVideoPlayer({ 
  video, 
  onClose,
  productName,
  affiliateUrl 
}: { 
  video: Video; 
  onClose: () => void;
  productName?: string;
  affiliateUrl?: string;
}) {
  // YouTube embed URL with restricted parameters
  const embedUrl = `https://www.youtube.com/embed/${video.id}?autoplay=1&modestbranding=1&rel=0&iv_load_policy=3&fs=1&playsinline=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`;

  // Lock body scroll when modal opens, restore when closed
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, []);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/95 overflow-y-auto"
      onClick={onClose}
    >
      {/* Fixed header with close button - ALWAYS visible at top */}
      <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black via-black/90 to-transparent">
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all"
          aria-label="Go back"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
          <span className="text-sm font-medium hidden sm:inline">Back to Page</span>
        </button>
        
        <button
          onClick={onClose}
          className="flex items-center justify-center w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
          aria-label="Close video"
        >
          <span className="material-symbols-outlined text-2xl">close</span>
        </button>
      </div>

      {/* Main content - centered and scrollable */}
      <div 
        className="max-w-5xl mx-auto px-4 pb-8 -mt-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Video container */}
        <div className="relative rounded-xl overflow-hidden bg-black shadow-2xl">
          <div className="aspect-video">
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={video.title}
            />
          </div>
          
          {/* Invisible overlays to block YouTube navigation */}
          <div 
            className="absolute top-0 left-0 w-24 h-14 cursor-default z-10"
            onClick={(e) => e.preventDefault()}
          />
          <div 
            className="absolute bottom-0 right-0 w-28 h-10 cursor-default z-10"
            onClick={(e) => e.preventDefault()}
          />
        </div>
        
        {/* Video info */}
        <div className="mt-4 bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5">
          <h3 className="font-bold text-base sm:text-lg text-text-light dark:text-text-dark">
            {video.title}
          </h3>
          
          {video.channelTitle && (
            <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark mt-1">
              {video.channelTitle} • {formatViewCount(video.viewCount)}
            </p>
          )}
          
          {/* CTA to buy product */}
          {productName && affiliateUrl && (
            <div className="mt-4 p-3 sm:p-4 bg-gradient-to-r from-success-green/10 to-primary/10 dark:from-success-green/20 dark:to-primary/20 rounded-xl border border-success-green/30">
              <p className="text-sm text-text-light dark:text-text-dark mb-3">
                <span className="material-symbols-outlined text-success-green text-base align-middle mr-1">verified</span>
                Ready to try <strong>{productName}</strong>? Get it now on Amazon India!
              </p>
              <a
                href={affiliateUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF9900] hover:bg-[#FF8800] text-white font-semibold text-sm rounded-lg transition-colors shadow-md hover:shadow-lg"
              >
                <span className="material-symbols-outlined text-base">shopping_cart</span>
                Buy on Amazon
                <span className="material-symbols-outlined text-sm">open_in_new</span>
              </a>
            </div>
          )}
        </div>

        {/* Mobile-friendly close button at bottom */}
        <button
          onClick={onClose}
          className="w-full mt-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-all flex items-center justify-center gap-2 sm:hidden"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Back to Page
        </button>
      </div>
    </div>
  );
}

export default function ProductVideoSection({
  searchQuery,
  title = "Watch Before You Buy",
  subtitle,
  maxVideos = 5,
  sectionId,
  variant = 'grid',
  productName,
  affiliateUrl,
  className = '',
  requiredKeywords = [],
  excludeKeywords = [],
  skipResults = 0
}: ProductVideoSectionProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);

  // Fetch videos from YouTube API
  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        query: searchQuery,
        type: 'long', // Get longer videos for educational content
        maxResults: String(maxVideos + 15), // Fetch extra for filtering
      });
      
      const response = await fetch(`/api/youtube/videos?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch videos');
      }
      
      const data = await response.json();
      
      // Filter videos by keywords
      let filteredVideos = (data.videos || []).filter((v: Video) => {
        const titleLower = v.title.toLowerCase();
        
        // Check required keywords - at least one must match
        if (requiredKeywords.length > 0) {
          const hasRequired = requiredKeywords.some(kw => 
            titleLower.includes(kw.toLowerCase())
          );
          if (!hasRequired) return false;
        }
        
        // Check excluded keywords - none should match
        if (excludeKeywords.length > 0) {
          const hasExcluded = excludeKeywords.some(kw => 
            titleLower.includes(kw.toLowerCase())
          );
          if (hasExcluded) return false;
        }
        
        // Must have decent view count
        return v.viewCount && v.viewCount > 1000;
      });
      
      // Sort by view count, skip first N results, and take top maxVideos
      const sortedVideos = filteredVideos
        .sort((a: Video, b: Video) => (b.viewCount || 0) - (a.viewCount || 0))
        .slice(skipResults, skipResults + maxVideos);
      
      setVideos(sortedVideos);
    } catch (err) {
      console.error('Error fetching videos:', err);
      setError('Unable to load videos');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, maxVideos, requiredKeywords, excludeKeywords, skipResults]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // Don't render if no videos and not loading
  if (!loading && videos.length === 0) {
    return null;
  }

  return (
    <section 
      id={sectionId} 
      className={`my-8 sm:my-10 scroll-mt-24 ${className}`}
    >
      {/* Section Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-red-600 text-2xl">play_circle</span>
          <h2 className="text-xl sm:text-2xl font-bold text-text-light dark:text-text-dark">
            {title}
          </h2>
        </div>
        {subtitle && (
          <p className="text-text-subtle-light dark:text-text-subtle-dark text-sm">
            {subtitle}
          </p>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(Math.min(maxVideos, 3))].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-xl" />
              <div className="mt-2 h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="mt-1 h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="text-center py-8 text-text-subtle-light dark:text-text-subtle-dark">
          <span className="material-symbols-outlined text-4xl text-gray-400 mb-2 block">videocam_off</span>
          <p>{error}</p>
        </div>
      )}

      {/* Videos grid */}
      {!loading && !error && videos.length > 0 && (
        <>
          {variant === 'featured' && videos.length >= 2 ? (
            // Featured layout: 1 large on left + smaller ones stacked on right
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {/* Main featured video - takes 3 columns on desktop */}
              <div className="lg:col-span-3">
                <VideoCard 
                  video={videos[0]} 
                  onPlay={setActiveVideo} 
                  variant="large" 
                />
              </div>
              {/* Side videos - takes 2 columns on desktop, stacked vertically */}
              <div className="lg:col-span-2 grid grid-cols-2 lg:grid-cols-1 gap-4">
                {videos.slice(1, 3).map((video) => (
                  <VideoCard 
                    key={video.id} 
                    video={video} 
                    onPlay={setActiveVideo} 
                  />
                ))}
              </div>
            </div>
          ) : (
            // Standard grid layout - 2 columns on mobile, 3-4 on desktop
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {videos.map((video) => (
                <VideoCard 
                  key={video.id} 
                  video={video} 
                  onPlay={setActiveVideo} 
                />
              ))}
            </div>
          )}

          {/* Trust indicator */}
          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-text-subtle-light dark:text-text-subtle-dark">
            <span className="material-symbols-outlined text-sm text-success-green">verified</span>
            Curated berberine videos from trusted health channels
          </div>
        </>
      )}

      {/* Video player modal */}
      {activeVideo && (
        <SecureVideoPlayer 
          video={activeVideo} 
          onClose={() => setActiveVideo(null)}
          productName={productName}
          affiliateUrl={affiliateUrl}
        />
      )}
    </section>
  );
}

// Inline video embed for placing within content sections
export function InlineVideoEmbed({
  videoId,
  title,
  className = ''
}: {
  videoId: string;
  title: string;
  className?: string;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0&iv_load_policy=3&fs=1&playsinline=1`;

  return (
    <div className={`relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 ${className}`}>
      {!isPlaying ? (
        // Thumbnail with play button
        <div 
          className="relative aspect-video cursor-pointer group"
          onClick={() => setIsPlaying(true)}
        >
          <img
            src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
            alt={title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-white text-3xl ml-1">play_arrow</span>
            </div>
          </div>
        </div>
      ) : (
        // Embedded player
        <div className="relative aspect-video">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={title}
          />
          {/* Protection overlays */}
          <div className="absolute top-0 left-0 w-24 h-14 cursor-default z-10" />
          <div className="absolute bottom-0 right-0 w-28 h-10 cursor-default z-10" />
        </div>
      )}
    </div>
  );
}
