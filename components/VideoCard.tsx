'use client';

import React, { useState } from 'react';
import type { Video } from '@/types';
import BookmarkButton from './BookmarkButton';
import VideoPlayer from './VideoPlayer';

interface VideoCardProps {
  video: Video;
  variant?: 'default' | 'short';
}

// Format view count to human readable (e.g., 1.2M, 45K)
const formatViewCount = (count?: number): string => {
  if (!count) return '';
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M views`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(0)}K views`;
  }
  return `${count} views`;
};

// Format relative time (e.g., "2 days ago")
const formatRelativeTime = (dateString?: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

const VideoCard: React.FC<VideoCardProps> = ({ video, variant = 'default' }) => {
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsPlayerOpen(true);
  };

  // Short variant for horizontal scrolling shorts
  if (variant === 'short') {
    return (
      <>
        <div 
          className="group relative flex-shrink-0 w-32 sm:w-40 md:w-48 cursor-pointer active:scale-[0.98] transition-transform"
        >
          <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-gray-900">
            {/* Bookmark button */}
            <div className="absolute top-1.5 left-1.5 md:top-2 md:left-2 z-20">
              <BookmarkButton 
                item={{ ...video, contentType: 'Video', isShort: true }} 
                className="bg-black/50 text-white/80 hover:bg-black/70 hover:text-white p-1.5 md:p-2 !text-sm md:!text-base" 
              />
            </div>
            <div onClick={handlePlayClick}>
              <img
                alt={video.title}
                className="absolute inset-0 w-full h-full object-cover"
                src={video.imageUrl}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              {/* Play button - always visible on mobile, hover on desktop */}
              <div className="absolute inset-0 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-white/30 backdrop-blur-sm">
                  <span className="material-symbols-outlined text-2xl md:text-3xl text-white">play_arrow</span>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-2 md:p-3">
                <h3 className="text-white font-semibold text-xs md:text-sm line-clamp-2 leading-tight">
                  {video.title}
                </h3>
                {video.viewCount && (
                  <p className="text-white/70 text-[10px] md:text-xs mt-0.5 md:mt-1">
                    {formatViewCount(video.viewCount)}
                  </p>
                )}
              </div>
              <span className="absolute top-1.5 right-1.5 md:top-2 md:right-2 bg-black/60 px-1 md:px-1.5 py-0.5 rounded text-[10px] md:text-xs font-medium text-white">
                {video.duration}
              </span>
            </div>
          </div>
        </div>
        {isPlayerOpen && <VideoPlayer video={video} onClose={() => setIsPlayerOpen(false)} />}
      </>
    );
  }

  // Default variant for grid layout
  return (
    <>
      <div className="group flex flex-col overflow-hidden rounded-xl border border-border-light dark:border-border-dark/60 bg-background-light dark:bg-background-dark shadow-sm transition-all md:hover:-translate-y-1 md:hover:shadow-lg active:scale-[0.99]">
        <div className="relative">
          <div className="absolute top-2 right-2 z-10">
            <BookmarkButton 
              item={{ ...video, contentType: 'Video' }} 
              className="bg-black/40 text-white/80 hover:bg-black/60 hover:text-white" 
            />
          </div>
          <button
            onClick={handlePlayClick}
            className="block w-full text-left cursor-pointer"
            aria-label={`Play video: ${video.title}`}
          >
            <div className="relative">
              <img
                alt={video.title}
                className="aspect-video w-full object-cover"
                src={video.imageUrl}
                loading="lazy"
              />
              {/* Play button - always visible on mobile, hover on desktop */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 md:bg-black/40 opacity-100 md:opacity-0 transition-opacity md:group-hover:opacity-100">
                <div className="flex h-12 w-12 md:h-16 md:w-16 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
                  <span className="material-symbols-outlined text-3xl md:text-5xl text-white">play_arrow</span>
                </div>
              </div>
              <span className="absolute bottom-2 right-2 rounded-md bg-black/60 px-1.5 md:px-2 py-0.5 md:py-1 text-[11px] md:text-xs font-medium text-white/90">
                {video.duration}
              </span>
              {video.isShort && (
                <span className="absolute top-2 left-2 rounded-md bg-red-600 px-1.5 md:px-2 py-0.5 md:py-1 text-[11px] md:text-xs font-medium text-white">
                  SHORT
                </span>
              )}
            </div>
          </button>
        </div>
        <button
          onClick={handlePlayClick}
          className="block flex-1 text-left cursor-pointer"
          aria-label={`Play video: ${video.title}`}
        >
          <div className="flex flex-col p-3 md:p-4">
            <h3 className="font-bold leading-snug line-clamp-2 text-sm md:text-base text-text-light dark:text-text-dark">
              {video.title}
            </h3>
            {video.channelTitle && (
              <p className="mt-0.5 md:mt-1 text-xs md:text-sm text-text-subtle-light dark:text-text-subtle-dark">
                {video.channelTitle}
              </p>
            )}
            <div className="mt-0.5 md:mt-1 flex items-center gap-1.5 md:gap-2 text-[11px] md:text-xs text-text-subtle-light dark:text-text-subtle-dark">
              {video.viewCount && (
                <span>{formatViewCount(video.viewCount)}</span>
              )}
              {video.viewCount && video.publishedAt && <span>•</span>}
              {video.publishedAt && (
                <span>{formatRelativeTime(video.publishedAt)}</span>
              )}
            </div>
          </div>
        </button>
      </div>

      {isPlayerOpen && <VideoPlayer video={video} onClose={() => setIsPlayerOpen(false)} />}
    </>
  );
};

export default VideoCard;
