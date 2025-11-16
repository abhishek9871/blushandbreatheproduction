
import React from 'react';
import type { Video } from '../types';
import BookmarkButton from './BookmarkButton';

const VideoCard: React.FC<{ video: Video }> = ({ video }) => {
    return (
        <div className="group flex flex-col overflow-hidden rounded-xl border border-border-light dark:border-border-dark/60 bg-background-light dark:bg-background-dark shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
            <div className="relative">
                 <div className="absolute top-2 right-2 z-10">
                    <BookmarkButton itemId={video.id} className="bg-black/40 text-white/80 hover:bg-black/60 hover:text-white" />
                </div>
                <a href="#" className="block">
                    <div className="relative">
                        <img alt={video.title} className="aspect-video w-full object-cover" src={video.imageUrl} />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
                                <span className="material-symbols-outlined text-5xl text-white">play_arrow</span>
                            </div>
                        </div>
                        <span className="absolute bottom-2 right-2 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white/90">{video.duration}</span>
                    </div>
                </a>
             </div>
             <a href="#" className="block">
                <div className="flex flex-col p-4">
                    <h3 className="font-bold leading-snug">{video.title}</h3>
                    <p className="mt-1 text-sm text-text-subtle-light dark:text-text-subtle-dark">{video.description}</p>
                </div>
            </a>
        </div>
    );
};

export default VideoCard;
