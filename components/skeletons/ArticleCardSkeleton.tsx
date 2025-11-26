import React from 'react';

const ArticleCardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col gap-4">
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-xl aspect-video animate-pulse"></div>
      <div className="flex flex-col gap-2">
        <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        <div className="h-5 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        <div className="h-3 w-full mt-1 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        <div className="h-3 w-24 mt-2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
    </div>
  );
};

export default ArticleCardSkeleton;
