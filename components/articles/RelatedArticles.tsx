/**
 * RelatedArticles Component
 * 
 * Displays Wikipedia overview, PubMed research articles, and Wikimedia Commons images
 * for banned substances and legal supplements.
 * 
 * Features:
 * - Fully responsive (mobile-first design)
 * - Dark/Light mode support
 * - SEO-optimized with proper semantic HTML
 * - Accessible with ARIA labels
 */

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { SubstanceArticles, WikipediaArticle, PubMedArticle, WikimediaImage } from '@/types';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface RelatedArticlesProps {
  articles: SubstanceArticles;
  substanceType: 'banned' | 'supplement';
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════
// WIKIPEDIA SECTION
// ═══════════════════════════════════════════════════════════════════

interface WikipediaSectionProps {
  article: WikipediaArticle;
  substanceName: string;
}

function WikipediaSection({ article, substanceName }: WikipediaSectionProps) {
  const [imageError, setImageError] = useState(false);
  
  return (
    <section 
      className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
      aria-labelledby="wikipedia-heading"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30">
          <span className="material-symbols-outlined text-lg sm:text-xl text-blue-600 dark:text-blue-400">
            menu_book
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 id="wikipedia-heading" className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
            Overview
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            From Wikipedia, the free encyclopedia
          </p>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Thumbnail */}
          {article.thumbnail && !imageError && (
            <div className="flex-shrink-0 mx-auto sm:mx-0">
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                <Image
                  src={article.thumbnail.source}
                  alt={`${substanceName} illustration`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 128px, 160px"
                  onError={() => setImageError(true)}
                  unoptimized // External URLs from Wikipedia
                />
              </div>
            </div>
          )}
          
          {/* Extract */}
          <div className="flex-1 min-w-0">
            <h4 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">
              {article.title}
            </h4>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-5 sm:line-clamp-4">
              {article.extract}
            </p>
          </div>
        </div>
        
        {/* Read More Link */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            Read full article on Wikipedia
            <span className="material-symbols-outlined text-base">open_in_new</span>
          </a>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PUBMED SECTION
// ═══════════════════════════════════════════════════════════════════

interface PubMedSectionProps {
  articles: PubMedArticle[];
  substanceType: 'banned' | 'supplement';
}

function PubMedSection({ articles, substanceType }: PubMedSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  if (articles.length === 0) return null;
  
  const headerColor = substanceType === 'banned' 
    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
    : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
  
  return (
    <section 
      className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
      aria-labelledby="pubmed-heading"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className={`flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg ${headerColor.split(' ').slice(0, 2).join(' ')}`}>
          <span className={`material-symbols-outlined text-lg sm:text-xl ${headerColor.split(' ').slice(2).join(' ')}`}>
            science
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 id="pubmed-heading" className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
            Scientific Research
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            From PubMed • {articles.length} peer-reviewed {articles.length === 1 ? 'study' : 'studies'}
          </p>
        </div>
      </div>
      
      {/* Articles List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {articles.map((article) => {
          const isExpanded = expandedId === article.pmid;
          
          return (
            <article key={article.pmid} className="p-4 sm:p-5">
              {/* Title & Meta */}
              <div className="mb-2">
                <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white leading-snug mb-1">
                  {article.title}
                </h4>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {article.journal}
                  </span>
                  <span>•</span>
                  <span>{article.year}</span>
                  {article.authors.length > 0 && (
                    <>
                      <span>•</span>
                      <span className="truncate max-w-[200px]">
                        {article.authors.slice(0, 2).join(', ')}
                        {article.authors.length > 2 && ' et al.'}
                      </span>
                    </>
                  )}
                </div>
              </div>
              
              {/* Abstract (Expandable) */}
              {article.abstract && (
                <div className="mt-3">
                  <p className={`text-sm text-gray-600 dark:text-gray-300 leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`}>
                    {article.abstract}
                  </p>
                  {article.abstract.length > 200 && (
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : article.pmid)}
                      className="mt-2 text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                      {isExpanded ? 'Show less' : 'Read full abstract'}
                    </button>
                  )}
                </div>
              )}
              
              {/* Link to PubMed */}
              <div className="mt-3 flex items-center gap-3">
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  <span>View on PubMed</span>
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                </a>
                {article.doi && (
                  <a
                    href={`https://doi.org/${article.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    <span>DOI</span>
                    <span className="material-symbols-outlined text-sm">link</span>
                  </a>
                )}
              </div>
            </article>
          );
        })}
      </div>
      
      {/* Footer - Search More */}
      <div className="px-4 py-3 sm:px-5 sm:py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
        <a
          href={`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(articles[0]?.title?.split(' ').slice(0, 3).join(' ') || '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          <span className="material-symbols-outlined text-base">search</span>
          Search more research on PubMed
        </a>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// IMAGE GALLERY SECTION
// ═══════════════════════════════════════════════════════════════════

interface ImageGallerySectionProps {
  images: WikimediaImage[];
  substanceName: string;
}

function ImageGallerySection({ images, substanceName }: ImageGallerySectionProps) {
  const [selectedImage, setSelectedImage] = useState<WikimediaImage | null>(null);
  
  if (images.length === 0) return null;
  
  return (
    <section 
      className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
      aria-labelledby="images-heading"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30">
          <span className="material-symbols-outlined text-lg sm:text-xl text-purple-600 dark:text-purple-400">
            photo_library
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 id="images-heading" className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
            Related Images
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            From Wikimedia Commons
          </p>
        </div>
      </div>
      
      {/* Image Grid */}
      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(image)}
              className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors group"
              aria-label={`View ${image.title}`}
            >
              <Image
                src={image.thumbUrl}
                alt={image.description || `${substanceName} image ${index + 1}`}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-200"
                sizes="(max-width: 640px) 100px, 150px"
                unoptimized // External URLs from Wikimedia
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <span className="material-symbols-outlined text-white opacity-0 group-hover:opacity-100 transition-opacity text-2xl drop-shadow-lg">
                  zoom_in
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Lightbox Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <div 
            className="relative max-w-3xl w-full bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-3 right-3 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
              aria-label="Close image"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            
            {/* Image */}
            <div className="relative aspect-video bg-gray-100 dark:bg-gray-800">
              <Image
                src={selectedImage.url}
                alt={selectedImage.description || substanceName}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 800px"
                unoptimized
              />
            </div>
            
            {/* Info */}
            <div className="p-4 sm:p-5 border-t border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base mb-1">
                {selectedImage.title}
              </h4>
              {selectedImage.description && (
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {selectedImage.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-500">
                {selectedImage.artist && (
                  <span>By: {selectedImage.artist}</span>
                )}
                {selectedImage.license && (
                  <span>License: {selectedImage.license}</span>
                )}
              </div>
              <a
                href={selectedImage.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                View original on Wikimedia Commons
                <span className="material-symbols-outlined text-sm">open_in_new</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function RelatedArticles({ articles, substanceType, className = '' }: RelatedArticlesProps) {
  const hasContent = articles.wikipedia !== null || articles.pubmed.length > 0 || articles.images.length > 0;
  
  if (!hasContent) {
    return null;
  }
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-2xl text-blue-600 dark:text-blue-400">
          library_books
        </span>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Learn More
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Research articles and educational resources
          </p>
        </div>
      </div>
      
      {/* Wikipedia Overview */}
      {articles.wikipedia && (
        <WikipediaSection 
          article={articles.wikipedia} 
          substanceName={articles.substanceName} 
        />
      )}
      
      {/* PubMed Research */}
      {articles.pubmed.length > 0 && (
        <PubMedSection 
          articles={articles.pubmed} 
          substanceType={substanceType}
        />
      )}
      
      {/* Image Gallery */}
      {articles.images.length > 0 && (
        <ImageGallerySection 
          images={articles.images} 
          substanceName={articles.substanceName}
        />
      )}
      
      {/* Data Attribution */}
      <div className="text-xs text-gray-500 dark:text-gray-500 text-center py-2">
        <p>
          Data sourced from{' '}
          <a href="https://www.wikipedia.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700 dark:hover:text-gray-300">Wikipedia</a>,{' '}
          <a href="https://pubmed.ncbi.nlm.nih.gov" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700 dark:hover:text-gray-300">PubMed</a>, and{' '}
          <a href="https://commons.wikimedia.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700 dark:hover:text-gray-300">Wikimedia Commons</a>
        </p>
      </div>
    </div>
  );
}

export default RelatedArticles;
