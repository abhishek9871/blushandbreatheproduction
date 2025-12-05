/**
 * YouTubeFacade - Lazy Loading YouTube Embed
 * 
 * PERFORMANCE OPTIMIZATION:
 * YouTube embeds load ~2MB of JavaScript on initial page load.
 * This facade shows a lightweight thumbnail placeholder and only
 * loads the actual iframe when the user clicks play.
 * 
 * Savings: ~2MB JS, ~1s main thread time, significant LCP improvement
 */

'use client';

import React, { useState, useCallback } from 'react';

interface YouTubeFacadeProps {
  videoId: string;
  title: string;
  className?: string;
}

export default function YouTubeFacade({ videoId, title, className = '' }: YouTubeFacadeProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  const handleClick = useCallback(() => {
    setIsLoaded(true);
  }, []);

  // Thumbnail URL - use maxresdefault for best quality, fallback to hqdefault
  const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  
  // Embed URL with autoplay (since user clicked to play)
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;

  if (isLoaded) {
    return (
      <div className={`aspect-video ${className}`}>
        <iframe
          src={embedUrl}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`aspect-video relative cursor-pointer group bg-black ${className}`}
      aria-label={`Lire la vidéo: ${title}`}
    >
      {/* Thumbnail */}
      <img
        src={thumbnailUrl}
        alt={title}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Dark overlay on hover */}
      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-200" />
      
      {/* YouTube Play Button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-12 sm:w-20 sm:h-14 bg-red-600 rounded-xl flex items-center justify-center shadow-lg group-hover:bg-red-700 group-hover:scale-110 transition-all duration-200">
          {/* Play triangle SVG */}
          <svg 
            viewBox="0 0 24 24" 
            className="w-7 h-7 sm:w-8 sm:h-8 text-white ml-1"
            fill="currentColor"
          >
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
      </div>
      
      {/* Video title (for accessibility and SEO) */}
      <span className="sr-only">{title}</span>
    </button>
  );
}

/**
 * Process HTML content and replace YouTube iframes with facade placeholders.
 * Returns modified HTML with data attributes for client-side hydration.
 */
export function processYouTubeEmbeds(htmlContent: string): string {
  // Match YouTube iframe embeds
  const iframeRegex = /<iframe[^>]*src=['"]https?:\/\/(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]+)[^'"]*['"][^>]*title=['"]([^'"]+)['"][^>]*><\/iframe>/gi;
  
  // Replace iframes with placeholder divs that will be hydrated client-side
  return htmlContent.replace(iframeRegex, (match, videoId, title) => {
    return `<div class="youtube-facade-placeholder aspect-video rounded-xl overflow-hidden shadow-xl" data-video-id="${videoId}" data-title="${title.replace(/"/g, '&quot;')}"></div>`;
  });
}

/**
 * Generate a YouTube facade HTML that shows thumbnail with play button.
 * This renders visible content directly in the HTML without needing JavaScript hydration.
 */
function generateFacadeHtml(videoId: string, title: string): string {
  const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  const escapedTitle = title.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  
  return `<div class="youtube-facade-placeholder aspect-video rounded-xl overflow-hidden shadow-2xl relative cursor-pointer group border-2 border-gray-200 dark:border-gray-700" data-video-id="${videoId}" data-title="${escapedTitle}" onclick="this.innerHTML='<iframe src=\\'https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1\\' class=\\'w-full h-full\\' frameborder=\\'0\\' allow=\\'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture\\' allowfullscreen title=\\'${escapedTitle}\\'></iframe>'">
    <img src="${thumbnailUrl}" alt="${escapedTitle}" loading="lazy" class="absolute inset-0 w-full h-full object-cover" />
    <div class="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors duration-200"></div>
    <div class="absolute inset-0 flex items-center justify-center">
      <div class="w-16 h-12 sm:w-20 sm:h-14 bg-red-600 rounded-xl flex items-center justify-center shadow-lg group-hover:bg-red-700 group-hover:scale-110 transition-all duration-200">
        <svg viewBox="0 0 24 24" class="w-7 h-7 sm:w-8 sm:h-8 text-white ml-1" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
      </div>
    </div>
  </div>`;
}

/**
 * Process HTML content and replace YouTube iframes with clickable facade thumbnails.
 * The facade shows a thumbnail with play button, and loads the iframe on click.
 */
export function processYouTubeEmbedsAlt(htmlContent: string): string {
  // First pattern: src before title
  let processed = htmlContent.replace(
    /<iframe[^>]*src=['"]https?:\/\/(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]+)[^'"]*['"][^>]*title=['"]([^'"]+)['"][^>]*(?:><\/iframe>|\/?>)/gi,
    (match, videoId, title) => {
      return generateFacadeHtml(videoId, title);
    }
  );
  
  // Second pattern: simpler - just find any YouTube embed iframe
  processed = processed.replace(
    /<iframe[^>]*src=['"]https?:\/\/(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]+)[^'"]*['"][^>]*><\/iframe>/gi,
    (match, videoId) => {
      // Extract title if present in the match
      const titleMatch = match.match(/title=['"]([^'"]+)['"]/i);
      const title = titleMatch ? titleMatch[1] : 'Video';
      return generateFacadeHtml(videoId, title);
    }
  );
  
  return processed;
}
