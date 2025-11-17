
import React, { useState } from 'react';
import type { Video } from '../types';

interface VideoPlayerProps {
    video: Video;
    onClose: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ video, onClose }) => {
    const [isLoading, setIsLoading] = useState(true);

    // Construct embedded YouTube URL from video ID
    const embedUrl = `https://www.youtube.com/embed/${video.id}?autoplay=1`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="relative h-full w-full max-h-[90vh] max-w-4xl flex flex-col">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
                    aria-label="Close video player"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>

                {/* Loading Spinner */}
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <div className="flex flex-col items-center gap-3">
                            <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white"></div>
                            <p className="text-white text-sm">Loading video...</p>
                        </div>
                    </div>
                )}

                {/* YouTube Embed */}
                <div className="flex-1 flex items-center justify-center bg-black">
                    <iframe
                        src={embedUrl}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        onLoad={() => setIsLoading(false)}
                        title={video.title}
                    />
                </div>

                {/* Video Info */}
                <div className="bg-black/40 p-4 text-white backdrop-blur-sm">
                    <h2 className="text-lg font-bold line-clamp-2">{video.title}</h2>
                    <p className="mt-2 text-sm text-gray-200 line-clamp-2">{video.description}</p>
                </div>
            </div>
        </div>
    );
};

export default VideoPlayer;
