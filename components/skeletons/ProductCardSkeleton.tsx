import React from 'react';

const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border-light dark:border-border-dark">
      <div className="aspect-square w-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
      <div className="flex flex-1 flex-col p-4 space-y-3">
        <div className="h-4 w-1/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        <div className="h-6 w-1/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-auto pt-2"></div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton;
