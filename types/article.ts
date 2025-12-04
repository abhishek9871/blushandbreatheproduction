/**
 * Article Types for Content Hub Cluster Pages
 * 
 * Used for long-form articles like "Banned Pre Workouts 2025"
 * and "DMAA Drug Testing Guide"
 */

import type { FAQItem, Citation, RelatedPage } from './substance';

export interface ArticleSection {
  id: string;
  title: string;
  content: string; // HTML content
  keywordTarget?: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  category: 'guide' | 'list' | 'comparison' | 'news' | 'research' | 'review' | 'avis';
  
  // Localization
  locale?: 'en' | 'fr' | 'nl' | 'de'; // Language/region code
  
  // Content
  introduction: string;
  sections: ArticleSection[];
  conclusion?: string;
  
  // SEO & Schema
  faqs?: FAQItem[];
  citations?: Citation[];
  relatedPages?: RelatedPage[];
  
  // Metadata
  author?: string;
  publishedDate: string;
  modifiedDate: string;
  readingTime?: number; // minutes
  wordCount?: number;
  
  // Feature flags
  isFeatured?: boolean;
}

export interface ArticlesData {
  articles: Article[];
}
