/**
 * Related Pages Section Component
 * 
 * Renders internal linking section for pillar/cluster pages
 * Displays related content based on relatedPages data
 */

import React from 'react';
import Link from 'next/link';

interface RelatedPage {
  slug: string;
  title: string;
  type: 'banned' | 'supplement' | 'article' | 'comparison';
  relationship: 'cluster' | 'pillar' | 'related';
}

interface RelatedPagesSectionProps {
  relatedPages: RelatedPage[];
  currentPageTitle: string;
  className?: string;
}

const TYPE_CONFIG = {
  banned: {
    icon: 'block',
    color: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    basePath: '/banned',
  },
  supplement: {
    icon: 'verified_user',
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    basePath: '/supplement',
  },
  article: {
    icon: 'article',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    basePath: '/guide',
  },
  comparison: {
    icon: 'compare_arrows',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
    basePath: '/compare',
  },
};

const RELATIONSHIP_LABELS = {
  pillar: 'Main Guide',
  cluster: 'Related Topic',
  related: 'See Also',
};

export function RelatedPagesSection({ relatedPages, currentPageTitle, className = '' }: RelatedPagesSectionProps) {
  if (!relatedPages || relatedPages.length === 0) return null;

  // Group by relationship type
  const pillarPages = relatedPages.filter(p => p.relationship === 'pillar');
  const clusterPages = relatedPages.filter(p => p.relationship === 'cluster');
  const relatedOnly = relatedPages.filter(p => p.relationship === 'related');

  return (
    <section className={`related-pages-section ${className}`}>
      <h2 className="text-xl font-semibold text-text-light dark:text-text-dark mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">hub</span>
        Related Content
      </h2>
      
      <p className="text-text-subtle-light dark:text-text-subtle-dark mb-6">
        Explore more topics related to {currentPageTitle}:
      </p>

      {/* Pillar page link - prominent if exists */}
      {pillarPages.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-text-subtle-light dark:text-text-subtle-dark uppercase tracking-wide mb-3">
            Complete Guide
          </h3>
          {pillarPages.map((page) => {
            const config = TYPE_CONFIG[page.type];
            return (
              <Link
                key={page.slug}
                href={`${config.basePath}/${page.slug}`}
                className={`block p-4 rounded-xl border-2 ${config.borderColor} ${config.bgColor} hover:shadow-md transition-all group`}
              >
                <div className="flex items-center gap-3">
                  <span className={`material-symbols-outlined text-2xl ${config.color}`}>
                    {config.icon}
                  </span>
                  <div>
                    <span className="font-semibold text-text-light dark:text-text-dark group-hover:text-primary transition-colors">
                      {page.title}
                    </span>
                    <span className="block text-xs text-text-subtle-light dark:text-text-subtle-dark mt-0.5">
                      {RELATIONSHIP_LABELS[page.relationship]}
                    </span>
                  </div>
                  <span className="material-symbols-outlined ml-auto text-gray-400 group-hover:text-primary transition-colors">
                    arrow_forward
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Cluster pages - grid layout */}
      {clusterPages.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-text-subtle-light dark:text-text-subtle-dark uppercase tracking-wide mb-3">
            Related Topics
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {clusterPages.map((page) => {
              const config = TYPE_CONFIG[page.type];
              return (
                <Link
                  key={page.slug}
                  href={`${config.basePath}/${page.slug}`}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${config.borderColor} bg-white dark:bg-card-dark hover:${config.bgColor} transition-colors group`}
                >
                  <span className={`material-symbols-outlined ${config.color}`}>
                    {config.icon}
                  </span>
                  <span className="text-sm font-medium text-text-light dark:text-text-dark group-hover:text-primary transition-colors flex-1">
                    {page.title}
                  </span>
                  <span className="material-symbols-outlined text-sm text-gray-400">
                    chevron_right
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Other related pages */}
      {relatedOnly.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-subtle-light dark:text-text-subtle-dark uppercase tracking-wide mb-3">
            See Also
          </h3>
          <ul className="space-y-2">
            {relatedOnly.map((page) => {
              const config = TYPE_CONFIG[page.type];
              return (
                <li key={page.slug}>
                  <Link
                    href={`${config.basePath}/${page.slug}`}
                    className="flex items-center gap-2 text-text-subtle-light dark:text-text-subtle-dark hover:text-primary transition-colors"
                  >
                    <span className={`material-symbols-outlined text-sm ${config.color}`}>
                      {config.icon}
                    </span>
                    <span className="text-sm">{page.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}

export default RelatedPagesSection;
