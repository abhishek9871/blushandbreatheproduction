/**
 * RelatedArticles Component
 * 
 * Displays Wikipedia overview and PubMed research articles
 * for banned substances and legal supplements.
 * 
 * Features:
 * - Fully responsive (mobile-first design)
 * - Dark/Light mode support
 * - SEO-optimized with proper semantic HTML
 * - Accessible with ARIA labels
 */

import React, { useState } from 'react';
import Image from 'next/image';
import type { SubstanceArticles, WikipediaArticle, PubMedArticle } from '@/types';

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
  const [isExpanded, setIsExpanded] = useState(false);
  
  const hasFullContent = article.fullContent && article.fullContent.length > 0;
  
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
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            <span>From Wikipedia, the free encyclopedia</span>
            {article.readingTime && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">schedule</span>
                  {article.readingTime} min read
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4 sm:p-5">
        {/* Title with Thumbnail */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
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
          
          {/* Title and Summary */}
          <div className="flex-1 min-w-0">
            <h4 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">
              {article.title}
            </h4>
            {/* Show summary when collapsed */}
            {!isExpanded && (
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                {article.extract}
              </p>
            )}
          </div>
        </div>
        
        {/* Full Article Content (when expanded) */}
        {isExpanded && hasFullContent && (
          <div 
            className="wikipedia-content prose prose-sm sm:prose-base dark:prose-invert max-w-none
              prose-headings:text-gray-900 dark:prose-headings:text-white
              prose-headings:font-semibold prose-headings:mt-6 prose-headings:mb-3
              prose-h2:text-lg prose-h3:text-base prose-h4:text-sm
              prose-p:text-gray-600 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-4
              prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
              prose-strong:text-gray-900 dark:prose-strong:text-white
              prose-ul:my-3 prose-ul:pl-5 prose-li:text-gray-600 dark:prose-li:text-gray-300
              prose-ol:my-3 prose-ol:pl-5
              prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic
              prose-img:rounded-lg prose-img:my-4"
            dangerouslySetInnerHTML={{ __html: article.fullContent as string }}
          />
        )}
        
        {/* Expand/Collapse Button */}
        {hasFullContent && (
          <div className="mt-4">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-base">
                {isExpanded ? 'expand_less' : 'expand_more'}
              </span>
              {isExpanded ? 'Show Less' : 'Read Full Article'}
            </button>
          </div>
        )}
        
        {/* External Link */}
        <div className={`${hasFullContent ? 'mt-4' : 'mt-4'} pt-4 border-t border-gray-200 dark:border-gray-700`}>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            View on Wikipedia
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
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function RelatedArticles({ articles, substanceType, className = '' }: RelatedArticlesProps) {
  const hasContent = articles.wikipedia !== null || articles.pubmed.length > 0;
  
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
      
      {/* Data Attribution */}
      <div className="text-xs text-gray-500 dark:text-gray-500 text-center py-2">
        <p>
          Data sourced from{' '}
          <a href="https://www.wikipedia.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700 dark:hover:text-gray-300">Wikipedia</a> and{' '}
          <a href="https://pubmed.ncbi.nlm.nih.gov" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700 dark:hover:text-gray-300">PubMed</a>
        </p>
      </div>
    </div>
  );
}

export default RelatedArticles;
