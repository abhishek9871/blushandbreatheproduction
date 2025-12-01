/**
 * FeaturedProductShowcase Component
 * 
 * High-converting product showcase for promoted alternatives.
 * Uses official product images and compelling copy to drive conversions.
 */

import React, { useState } from 'react';
import Image from 'next/image';

export interface FeaturedProduct {
  id: string;
  name: string;
  brand: string;
  tagline: string;
  price: number;
  originalPrice?: number;
  servings: number;
  pricePerServing: number;
  rating: number;
  reviewCount: number;
  images: {
    main: string;
    gallery: string[];
    badges?: string[];
  };
  highlights: {
    icon: string;
    title: string;
    description: string;
  }[];
  ingredients: {
    name: string;
    amount: string;
    benefit: string;
  }[];
  benefits: string[];
  guarantees: string[];
  buyLink: string;
  amazonLink?: string;
  officialLink?: string;
}

interface FeaturedProductShowcaseProps {
  product: FeaturedProduct;
}

export default function FeaturedProductShowcase({ product }: FeaturedProductShowcaseProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const allImages = [product.images.main, ...product.images.gallery];
  
  const discount = product.originalPrice 
    ? Math.round((1 - product.price / product.originalPrice) * 100) 
    : 0;

  return (
    <section 
      id="featured-product" 
      className="my-8 scroll-mt-20"
    >
      {/* Section Header */}
      <div className="text-center mb-6">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-primary to-success-green text-white text-sm font-bold rounded-full mb-3">
          <span className="material-symbols-outlined text-lg">workspace_premium</span>
          #1 RECOMMENDED ALTERNATIVE
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold text-text-light dark:text-text-dark">
          {product.name}
        </h2>
        <p className="text-text-subtle-light dark:text-text-subtle-dark mt-1">
          {product.tagline}
        </p>
      </div>

      {/* Main Product Card */}
      <div className="bg-gradient-to-br from-card-light to-gray-50 dark:from-card-dark dark:to-gray-900 rounded-2xl border-2 border-primary/30 overflow-hidden shadow-xl">
        <div className="grid md:grid-cols-2 gap-0">
          
          {/* Image Gallery Section */}
          <div className="relative bg-white dark:bg-gray-900 p-4 sm:p-6">
            {/* Discount Badge */}
            {discount > 0 && (
              <div className="absolute top-4 left-4 z-10 bg-alert-red text-white px-3 py-1 rounded-full text-sm font-bold">
                {discount}% OFF
              </div>
            )}
            
            {/* Main Image */}
            <div className="relative aspect-square mb-4 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
              <Image
                src={allImages[selectedImage]}
                alt={product.name}
                fill
                className="object-contain p-4"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>
            
            {/* Thumbnail Gallery */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {allImages.slice(0, 5).map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === idx 
                      ? 'border-primary ring-2 ring-primary/30' 
                      : 'border-border-light dark:border-border-dark hover:border-primary/50'
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${product.name} view ${idx + 1}`}
                    fill
                    className="object-contain p-1"
                    sizes="64px"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info Section */}
          <div className="p-4 sm:p-6 flex flex-col">
            {/* Brand & Rating */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-primary">{product.brand}</span>
              <div className="flex items-center gap-1">
                <span className="text-warning-amber">★</span>
                <span className="font-bold text-text-light dark:text-text-dark">{product.rating}</span>
                <span className="text-sm text-text-subtle-light dark:text-text-subtle-dark">
                  ({product.reviewCount.toLocaleString('en-IN')} reviews)
                </span>
              </div>
            </div>

            {/* Price Section */}
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-3xl font-bold text-text-light dark:text-text-dark">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              {product.originalPrice && (
                <span className="text-lg text-text-subtle-light dark:text-text-subtle-dark line-through">
                  ₹{product.originalPrice.toLocaleString('en-IN')}
                </span>
              )}
              <span className="text-sm text-success-green font-medium">
                ₹{product.pricePerServing}/serving
              </span>
            </div>

            {/* Key Highlights */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {product.highlights.slice(0, 4).map((highlight, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-2 p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg"
                >
                  <span className="material-symbols-outlined text-primary text-xl">
                    {highlight.icon}
                  </span>
                  <div>
                    <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark">
                      {highlight.title}
                    </p>
                    <p className="text-sm font-semibold text-text-light dark:text-text-dark">
                      {highlight.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Benefits List */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-text-light dark:text-text-dark mb-2">
                Why Athletes Choose This:
              </h4>
              <ul className="space-y-1.5">
                {product.benefits.slice(0, 5).map((benefit, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-text-subtle-light dark:text-text-subtle-dark">
                    <span className="text-success-green mt-0.5">✓</span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {product.guarantees.map((guarantee, idx) => (
                <span 
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-success-green/10 text-success-green text-xs font-medium rounded"
                >
                  <span className="material-symbols-outlined text-sm">verified</span>
                  {guarantee}
                </span>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="mt-auto space-y-3">
              <a
                href={product.buyLink}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl"
              >
                <span className="material-symbols-outlined">shopping_cart</span>
                Buy Now on Amazon
                <span className="material-symbols-outlined text-sm">open_in_new</span>
              </a>
              
              {product.officialLink && (
                <a
                  href={product.officialLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark hover:border-primary text-text-light dark:text-text-dark font-medium rounded-xl transition-all"
                >
                  View on Official Website
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                </a>
              )}
              
              <p className="text-center text-xs text-text-subtle-light dark:text-text-subtle-dark">
                <span className="material-symbols-outlined text-sm align-middle">local_shipping</span>
                {' '}Free Delivery • COD Available • 1-3 Day Shipping
              </p>
            </div>
          </div>
        </div>

        {/* Ingredients Breakdown */}
        <div className="border-t border-border-light dark:border-border-dark p-4 sm:p-6 bg-gray-50/50 dark:bg-gray-800/30">
          <h4 className="text-lg font-bold text-text-light dark:text-text-dark mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">science</span>
            Scientifically-Dosed Ingredients (Full Transparency)
          </h4>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {product.ingredients.map((ingredient, idx) => (
              <div 
                key={idx}
                className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark"
              >
                <div className="flex items-baseline justify-between mb-1">
                  <span className="font-semibold text-text-light dark:text-text-dark text-sm">
                    {ingredient.name}
                  </span>
                  <span className="text-primary font-bold text-sm">
                    {ingredient.amount}
                  </span>
                </div>
                <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark">
                  {ingredient.benefit}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
