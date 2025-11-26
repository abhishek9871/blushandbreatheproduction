import React from 'react';
import Link from 'next/link';
import type { Product } from '@/types';
import BookmarkButton from './BookmarkButton';

const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5">
      {[...Array(fullStars)].map((_, i) => (
        <span key={`full-${i}`} className="material-symbols-outlined !text-base text-yellow-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
      ))}
      {halfStar && <span className="material-symbols-outlined !text-base text-yellow-500">star_half</span>}
      {[...Array(emptyStars)].map((_, i) => (
        <span key={`empty-${i}`} className="material-symbols-outlined !text-base text-gray-300">star</span>
      ))}
    </div>
  );
};

const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  return (
    <Link href={`/product/${encodeURIComponent(product.id)}`} className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-lg transition-shadow duration-300">
      <div className="absolute top-2 right-2 z-10">
        <BookmarkButton item={{ ...product, contentType: 'Product' }} className="bg-white/70 dark:bg-black/70 hover:bg-white dark:hover:bg-black text-gray-500 dark:text-gray-400 hover:text-secondary" />
      </div>
      <div className="aspect-square w-full overflow-hidden bg-gray-100">
        <img alt={product.name} className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300" src={product.imageUrl} />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">{product.brand}</p>
        <h3 className="font-semibold mt-1 text-gray-900 dark:text-gray-100">{product.name}</h3>
        <div className="flex items-center mt-2 gap-0.5">
          {product.rating !== null ? (
            <>
              <StarRating rating={product.rating} />
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">({product.reviews.toLocaleString()})</span>
            </>
          ) : (
            <span className="text-xs text-gray-500 dark:text-gray-400">No ratings yet</span>
          )}
        </div>
        {product.price !== null ? (
          <p className="text-lg font-bold mt-auto pt-2 text-gray-900 dark:text-gray-100">${product.price.toFixed(2)}</p>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-auto pt-2 italic">Price on request</p>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;
