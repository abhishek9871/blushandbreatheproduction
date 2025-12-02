/**
 * AffiliateProductShowcase Component
 * 
 * High-conversion product showcase for buy pages.
 * Optimized for maximum affiliate clicks with trust indicators.
 * Supports light/dark mode and mobile/desktop layouts.
 */

import React from 'react';
import Image from 'next/image';

export interface AffiliateProductData {
  id: string;
  name: string;
  brand: string;
  shortName?: string;
  description: string;
  price: number;
  originalPrice?: number;
  currency: string;
  affiliateUrl: string;
  imageUrl?: string;
  rating: number;
  reviewCount: number;
  badges: string[];
  isTopPick?: boolean;
  isBestValue?: boolean;
}

interface AffiliateProductShowcaseProps {
  products: AffiliateProductData[];
  sectionId?: string;
  title?: string;
  subtitle?: string;
}

export default function AffiliateProductShowcase({
  products,
  sectionId = "best-products",
  title = "Best Berberine Supplements in India",
  subtitle = "Amazon Prime • Cash on Delivery • Fast Shipping"
}: AffiliateProductShowcaseProps) {
  if (!products || products.length === 0) return null;

  const topPick = products.find(p => p.isTopPick) || products[0];
  const otherProducts = products.filter(p => p.id !== topPick.id);

  // Calculate discount percentage
  const getDiscount = (price: number, originalPrice?: number) => {
    if (!originalPrice) return 0;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  };

  return (
    <section id={sectionId} className="my-10 scroll-mt-24">
      {/* Section Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-success-green/10 dark:bg-success-green/20 rounded-full mb-3">
          <span className="material-symbols-outlined text-success-green text-lg">verified</span>
          <span className="text-sm font-semibold text-success-green">Editor&apos;s Choice 2025</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-text-light dark:text-text-dark mb-2">
          {title}
        </h2>
        <p className="text-text-subtle-light dark:text-text-subtle-dark flex items-center justify-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1">
            <span className="material-symbols-outlined text-primary text-base">local_shipping</span>
            {subtitle}
          </span>
        </p>
      </div>

      {/* Top Pick - Featured Card (Non-absolute badge to prevent cropping) */}
      <div className="mb-6">
        <div className="bg-gradient-to-br from-success-green/5 via-primary/5 to-success-green/10 dark:from-success-green/10 dark:via-primary/10 dark:to-success-green/20 rounded-2xl border-2 border-success-green/30 dark:border-success-green/40 overflow-hidden">
          {/* Top Pick Badge - Static position, not absolute */}
          <div className="bg-gradient-to-r from-success-green to-primary py-2.5 px-4">
            <div className="flex items-center justify-center gap-2 text-white">
              <span className="material-symbols-outlined text-yellow-300">star</span>
              <span className="font-bold text-sm uppercase tracking-wide">Top Pick - Best Overall</span>
              <span className="material-symbols-outlined text-yellow-300">star</span>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Product Image - Larger and more prominent */}
              <div className="flex-shrink-0 mx-auto md:mx-0">
                <div className="relative w-44 h-44 sm:w-52 sm:h-52 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                  {topPick.imageUrl ? (
                    <Image 
                      src={topPick.imageUrl} 
                      alt={topPick.name} 
                      fill
                      className="object-contain p-3"
                      sizes="(max-width: 640px) 176px, 208px"
                      unoptimized
                    />
                  ) : (
                    <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600">medication</span>
                  )}
                  {/* Discount badge on image */}
                  {topPick.originalPrice && getDiscount(topPick.price, topPick.originalPrice) > 0 && (
                    <div className="absolute top-2 left-2 bg-alert-red text-white text-xs font-bold px-2 py-1 rounded-full">
                      {getDiscount(topPick.price, topPick.originalPrice)}% OFF
                    </div>
                  )}
                </div>
              </div>

              {/* Product Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                  {topPick.badges.map((badge, i) => (
                    <span key={i} className="px-2 py-0.5 bg-primary/10 dark:bg-primary/20 text-primary text-xs font-medium rounded-full">
                      {badge}
                    </span>
                  ))}
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-text-light dark:text-text-dark mb-1">
                  {topPick.shortName || topPick.name}
                </h3>
                <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark mb-3">
                  by <span className="font-medium">{topPick.brand}</span>
                </p>

                {/* Rating */}
                <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`material-symbols-outlined text-lg ${
                          star <= Math.round(topPick.rating) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
                        }`}
                      >
                        star
                      </span>
                    ))}
                  </div>
                  <span className="text-sm font-medium text-text-subtle-light dark:text-text-subtle-dark">
                    {topPick.rating.toFixed(1)} ({topPick.reviewCount.toLocaleString()} reviews)
                  </span>
                </div>

                <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark mb-4 max-w-xl">
                  {topPick.description}
                </p>

                {/* Price & CTA */}
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="text-center sm:text-left">
                    <div className="flex items-baseline gap-2 justify-center sm:justify-start">
                      <span className="text-3xl font-bold text-success-green">
                        {topPick.currency}{topPick.price.toLocaleString()}
                      </span>
                      {topPick.originalPrice && (
                        <span className="text-lg text-text-subtle-light dark:text-text-subtle-dark line-through">
                          {topPick.currency}{topPick.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-success-green font-medium">
                      Free Delivery with Prime
                    </p>
                  </div>

                  <a
                    href={topPick.affiliateUrl}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#FF9900] to-[#FF6600] hover:from-[#FF8800] hover:to-[#FF5500] text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all"
                  >
                    <span className="material-symbols-outlined">shopping_cart</span>
                    Buy on Amazon
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                  </a>
                </div>

                {/* Trust Indicators */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-4 text-xs text-text-subtle-light dark:text-text-subtle-dark">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-success-green text-sm">verified</span>
                    Genuine Product
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-primary text-sm">payments</span>
                    Cash on Delivery
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-primary text-sm">autorenew</span>
                    Easy Returns
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Other Products Grid - Responsive 2x2 on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {otherProducts.map((product) => (
          <div
            key={product.id}
            className={`relative bg-white dark:bg-gray-800 rounded-xl border ${
              product.isBestValue 
                ? 'border-2 border-primary/50 dark:border-primary/60 shadow-md' 
                : 'border-border-light dark:border-border-dark'
            } overflow-hidden hover:shadow-lg transition-all`}
          >
            {/* Best Value Badge - Static position */}
            {product.isBestValue && (
              <div className="bg-primary py-1.5 px-2 text-center">
                <span className="text-white text-xs font-bold uppercase tracking-wide">Best Value</span>
              </div>
            )}

            <div className="p-3 sm:p-4">
              {/* Product Image with discount badge */}
              <div className="relative w-full h-24 sm:h-32 bg-gray-50 dark:bg-gray-700 rounded-lg mb-3 overflow-hidden">
                {product.imageUrl ? (
                  <Image 
                    src={product.imageUrl} 
                    alt={product.name} 
                    fill
                    className="object-contain p-2"
                    sizes="(max-width: 640px) 150px, 200px"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-500">medication</span>
                  </div>
                )}
                {/* Discount badge */}
                {product.originalPrice && getDiscount(product.price, product.originalPrice) > 0 && (
                  <div className="absolute top-1 left-1 bg-alert-red text-white text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded">
                    {getDiscount(product.price, product.originalPrice)}% OFF
                  </div>
                )}
              </div>

              {/* Badges - Hidden on very small screens */}
              <div className="hidden sm:flex flex-wrap gap-1 mb-2">
                {product.badges.slice(0, 2).map((badge, i) => (
                  <span key={i} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-text-subtle-light dark:text-text-subtle-dark text-xs rounded">
                    {badge}
                  </span>
                ))}
              </div>

              {/* Product Name */}
              <h4 className="font-semibold text-xs sm:text-sm text-text-light dark:text-text-dark mb-1 line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem]">
                {product.shortName || product.name}
              </h4>
              <p className="text-[10px] sm:text-xs text-text-subtle-light dark:text-text-subtle-dark mb-1.5 sm:mb-2">
                {product.brand}
              </p>

              {/* Rating - Compact on mobile */}
              <div className="flex items-center gap-1 mb-2 sm:mb-3">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`material-symbols-outlined text-xs sm:text-sm ${
                        star <= Math.round(product.rating) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
                      }`}
                    >
                      star
                    </span>
                  ))}
                </div>
                <span className="text-[10px] sm:text-xs text-text-subtle-light dark:text-text-subtle-dark">
                  ({product.reviewCount.toLocaleString()})
                </span>
              </div>

              {/* Price - Prominent display */}
              <div className="flex items-baseline gap-1 sm:gap-2 mb-2 sm:mb-3">
                <span className="text-lg sm:text-xl font-bold text-success-green">
                  {product.currency}{product.price.toLocaleString()}
                </span>
                {product.originalPrice && (
                  <span className="text-xs sm:text-sm text-text-subtle-light dark:text-text-subtle-dark line-through">
                    {product.currency}{product.originalPrice.toLocaleString()}
                  </span>
                )}
              </div>

              {/* CTA Button - Amazon branded */}
              <a
                href={product.affiliateUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="w-full inline-flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-[#FF9900] hover:bg-[#FF8800] text-white font-semibold text-xs sm:text-sm rounded-lg transition-colors shadow-sm hover:shadow"
              >
                <span className="material-symbols-outlined text-sm sm:text-base">shopping_cart</span>
                <span>Buy on Amazon</span>
              </a>

              {/* COD badge */}
              <p className="text-center text-[10px] sm:text-xs text-text-subtle-light dark:text-text-subtle-dark mt-1.5 sm:mt-2 flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-[10px] sm:text-xs text-success-green">check_circle</span>
                COD Available
              </p>
            </div>
          </div>
        ))}
      </div>

    </section>
  );
}
