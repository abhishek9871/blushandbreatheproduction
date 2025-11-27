/**
 * AffiliateProductCTA Component
 * 
 * Displays affiliate product recommendations with FTC-compliant disclosure.
 * Used on supplement pages to show recommended products.
 */

import React from 'react';
import Image from 'next/image';
import { useAffiliateClickTracking } from '@/hooks';
import type { AffiliateProduct } from '@/types';

interface AffiliateProductCTAProps {
  product: AffiliateProduct;
  variant?: 'card' | 'inline' | 'featured';
  showDisclosure?: boolean;
  className?: string;
}

// Network display names and colors
const networkInfo: Record<string, { name: string; color: string }> = {
  transparent_labs: { name: 'Transparent Labs', color: 'bg-teal-500' },
  nootropics_depot: { name: 'Nootropics Depot', color: 'bg-purple-500' },
  amazon: { name: 'Amazon', color: 'bg-orange-500' },
  iherb: { name: 'iHerb', color: 'bg-green-500' },
  bodybuilding_com: { name: 'Bodybuilding.com', color: 'bg-red-500' },
  direct: { name: 'Direct', color: 'bg-blue-500' },
};

export const AffiliateProductCTA: React.FC<AffiliateProductCTAProps> = ({
  product,
  variant = 'card',
  showDisclosure = true,
  className = '',
}) => {
  const { trackClick } = useAffiliateClickTracking();

  const handleClick = () => {
    trackClick(product);
  };

  const networkData = networkInfo[product.affiliateNetwork] || { name: 'Shop', color: 'bg-gray-500' };

  // Calculate discount percentage if original price exists
  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  // Card variant (default)
  if (variant === 'card') {
    return (
      <div className={`medical-card overflow-hidden group ${className}`}>
        {/* Product Image */}
        <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, 300px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600">
                inventory_2
              </span>
            </div>
          )}
          
          {/* Discount badge */}
          {discountPercent && discountPercent > 0 && (
            <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
              -{discountPercent}% OFF
            </div>
          )}

          {/* Network badge */}
          <div className={`absolute top-3 right-3 ${networkData.color} text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-md`}>
            {networkData.name}
          </div>
        </div>

        {/* Product Info */}
        <div className="p-5">
          <h4 className="font-bold text-lg text-text-light dark:text-text-dark line-clamp-2 mb-1">
            {product.name}
          </h4>
          <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark mb-3">
            by <span className="font-medium">{product.brand}</span>
          </p>

          {/* Rating */}
          {product.rating > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`material-symbols-outlined text-base ${
                      star <= product.rating ? 'text-yellow-400' : 'text-gray-200 dark:text-gray-600'
                    }`}
                  >
                    star
                  </span>
                ))}
              </div>
              <span className="text-sm text-text-subtle-light dark:text-text-subtle-dark font-medium">
                {product.rating.toFixed(1)} ({product.reviewCount.toLocaleString()})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-2xl font-bold text-success-green">
              ${product.price.toFixed(2)}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-text-subtle-light dark:text-text-subtle-dark line-through">
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* Servings info */}
          <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-base">pill</span>
            {product.servings} servings • {product.dosagePerServing}/serving
          </p>

          {/* Third party tested badge */}
          {product.thirdPartyTested && (
            <div className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400 mb-4 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-full w-fit">
              <span className="material-symbols-outlined text-base">verified</span>
              <span className="font-medium">Third-Party Tested</span>
            </div>
          )}

          {/* CTA Button */}
          <button
            onClick={handleClick}
            className="w-full cta-button cta-button-primary group-hover:scale-[1.02] transition-transform"
          >
            <span className="material-symbols-outlined">shopping_cart</span>
            <span>Buy on {networkData.name}</span>
            <span className="material-symbols-outlined text-sm">open_in_new</span>
          </button>

          {/* Affiliate disclosure */}
          {showDisclosure && (
            <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark mt-3 text-center flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-xs">info</span>
              Affiliate link - we may earn a commission
            </p>
          )}
        </div>
      </div>
    );
  }

  // Inline variant (horizontal layout)
  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-4 p-3 bg-white dark:bg-card-dark rounded-lg border border-border-light dark:border-border-dark ${className}`}>
        {/* Thumbnail */}
        <div className="relative w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded flex-shrink-0">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-contain p-1"
              sizes="64px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="material-symbols-outlined text-gray-400">inventory_2</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h5 className="font-medium text-sm text-text-light dark:text-text-dark truncate">
            {product.name}
          </h5>
          <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark">
            {product.brand} • {product.servings} servings
          </p>
        </div>

        {/* Price & CTA */}
        <div className="flex items-center gap-3">
          <span className="font-bold text-text-light dark:text-text-dark">
            {product.currency}{product.price.toFixed(2)}
          </span>
          <button
            onClick={handleClick}
            className="bg-primary hover:bg-primary-darker text-white text-sm font-medium py-1.5 px-3 rounded transition-colors"
          >
            Buy
          </button>
        </div>
      </div>
    );
  }

  // Featured variant (larger, more prominent)
  if (variant === 'featured') {
    return (
      <div className={`bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-6 border-2 border-primary/20 ${className}`}>
        <div className="flex flex-col md:flex-row gap-6">
          {/* Image */}
          <div className="relative w-full md:w-48 aspect-square bg-white dark:bg-card-dark rounded-xl">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-contain p-4"
                sizes="(max-width: 768px) 100vw, 200px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-5xl text-gray-400">
                  inventory_2
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className={`${networkData.color} text-white text-xs font-medium px-2 py-1 rounded`}>
                Recommended
              </span>
              {product.thirdPartyTested && (
                <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                  <span className="material-symbols-outlined text-sm">verified</span>
                  Tested
                </span>
              )}
            </div>

            <h3 className="text-xl font-bold text-text-light dark:text-text-dark mb-1">
              {product.name}
            </h3>
            <p className="text-text-subtle-light dark:text-text-subtle-dark mb-3">
              {product.brand}
            </p>

            <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark mb-4">
              {product.description.substring(0, 150)}...
            </p>

            <div className="flex items-end justify-between">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-text-light dark:text-text-dark">
                    {product.currency}{product.price.toFixed(2)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm text-text-subtle-light line-through">
                      {product.currency}{product.originalPrice.toFixed(2)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark">
                  {product.servings} servings • {product.dosagePerServing}/serving
                </p>
              </div>

              <button
                onClick={handleClick}
                className="bg-primary hover:bg-primary-darker text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center gap-2"
              >
                <span>Shop Now</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>

            {showDisclosure && (
              <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark mt-4">
                <span className="material-symbols-outlined text-xs align-middle">info</span>
                {' '}This is an affiliate link. We may earn a commission at no extra cost to you.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// List of multiple products
export const AffiliateProductList: React.FC<{
  products: AffiliateProduct[];
  variant?: 'card' | 'inline';
  className?: string;
}> = ({ products, variant = 'card', className = '' }) => {
  if (products.length === 0) return null;

  return (
    <div className={className}>
      {/* Section header with disclosure */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-light dark:text-text-dark">
          Recommended Products
        </h3>
        <span className="text-xs text-text-subtle-light dark:text-text-subtle-dark flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">info</span>
          Affiliate links
        </span>
      </div>

      {/* Products grid */}
      <div className={variant === 'card' 
        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
        : 'space-y-3'
      }>
        {products.map((product) => (
          <AffiliateProductCTA
            key={product.id}
            product={product}
            variant={variant}
            showDisclosure={false}
          />
        ))}
      </div>
    </div>
  );
};

export default AffiliateProductCTA;
