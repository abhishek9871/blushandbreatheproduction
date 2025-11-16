import React from 'react';

const VideoCardSkeleton: React.FC = () => {
    return (
        <div className="flex flex-col overflow-hidden rounded-xl border border-border-light dark:border-border-dark/60 bg-background-light dark:bg-background-dark shadow-sm">
            <div className="relative">
                <div className="aspect-video w-full object-cover bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
            </div>
            <div className="flex flex-col p-4 space-y-2">
                <div className="h-5 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
        </div>
    );
};

export default VideoCardSkeleton;
