
import React from 'react';
import type { Product } from '../types';
import BookmarkButton from './BookmarkButton';

const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return (
        <div className="flex items-center gap-0.5">
            {[...Array(fullStars)].map((_, i) => <span key={`full-${i}`} className="material-symbols-outlined !text-base text-yellow-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>)}
            {halfStar && <span className="material-symbols-outlined !text-base text-yellow-500">star_half</span>}
            {[...Array(emptyStars)].map((_, i) => <span key={`empty-${i}`} className="material-symbols-outlined !text-base text-gray-300">star</span>)}
        </div>
    );
};

const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
    return (
        <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border-light dark:border-border-dark shadow-sm hover:shadow-lg transition-shadow duration-300">
             <div className="absolute top-2 right-2 z-10">
                <BookmarkButton itemId={product.id} className="bg-white/70 dark:bg-black/70 hover:bg-white dark:hover:bg-black text-text-subtle-light dark:text-text-subtle-dark hover:text-secondary" />
            </div>
            <div className="aspect-square w-full overflow-hidden bg-gray-100">
                <img alt={product.name} className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300" src={product.imageUrl} />
            </div>
            <div className="flex flex-1 flex-col p-4">
                <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark">{product.brand}</p>
                <h3 className="font-semibold mt-1">{product.name}</h3>
                <div className="flex items-center mt-2 gap-0.5">
                    <StarRating rating={product.rating} />
                    <span className="text-xs text-text-subtle-light dark:text-text-subtle-dark ml-1">({product.reviews.toLocaleString()})</span>
                </div>
                <p className="text-lg font-bold mt-auto pt-2">${product.price.toFixed(2)}</p>
            </div>
        </div>
    );
};


export default ProductCard;
