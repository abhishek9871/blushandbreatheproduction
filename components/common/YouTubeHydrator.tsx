/**
 * YouTubeHydrator - Client-side component to hydrate YouTube facade placeholders
 * 
 * This component finds all YouTube placeholder divs in the DOM and replaces them
 * with the interactive YouTubeFacade component. This enables lazy-loading of
 * YouTube embeds without loading the heavy iframe JavaScript until user interaction.
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import YouTubeFacade from './YouTubeFacade';

interface VideoPlaceholder {
  element: HTMLElement;
  videoId: string;
  title: string;
}

interface YouTubeHydratorProps {
  containerRef: React.RefObject<HTMLElement | null>;
}

export default function YouTubeHydrator({ containerRef }: YouTubeHydratorProps) {
  const [placeholders, setPlaceholders] = useState<VideoPlaceholder[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Find all YouTube facade placeholders
    const elements = containerRef.current.querySelectorAll('.youtube-facade-placeholder');
    
    const found: VideoPlaceholder[] = [];
    elements.forEach((el) => {
      const videoId = el.getAttribute('data-video-id');
      const title = el.getAttribute('data-title');
      
      if (videoId && el instanceof HTMLElement) {
        found.push({
          element: el,
          videoId,
          title: title || 'Video',
        });
      }
    });

    setPlaceholders(found);
  }, [containerRef]);

  // Render YouTubeFacade into each placeholder using portals
  return (
    <>
      {placeholders.map((placeholder, index) => (
        createPortal(
          <YouTubeFacade
            key={`${placeholder.videoId}-${index}`}
            videoId={placeholder.videoId}
            title={placeholder.title}
            className="rounded-xl overflow-hidden shadow-xl"
          />,
          placeholder.element
        )
      ))}
    </>
  );
}
