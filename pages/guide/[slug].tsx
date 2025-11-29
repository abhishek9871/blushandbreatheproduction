/**
 * Content Hub Guide Page
 * 
 * Dynamic page for displaying long-form guide articles (cluster pages).
 * Uses ISR (Incremental Static Regeneration) for optimal SEO and performance.
 * 
 * Route: /guide/[slug]
 * Example: /guide/banned-pre-workouts-2025, /guide/dmaa-drug-testing-guide
 */

import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { GetStaticPaths, GetStaticProps } from 'next';
import {
  SchemaMarkup,
  FAQAccordion,
  TableOfContents,
  RelatedPagesSection,
} from '@/components';
import { getContentHubArticleBySlug, getContentHubArticleSlugs } from '@/lib/data';
import type { ContentHubArticle } from '@/types';

interface GuidePageProps {
  article: ContentHubArticle | null;
  error?: string;
}

export default function GuidePage({ article, error }: GuidePageProps) {
  if (error || !article) {
    return (
      <>
        <Head>
          <title>Guide Not Found | Blush & Breathe</title>
          <meta name="robots" content="noindex" />
        </Head>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-6xl text-gray-400 mb-4">
              article
            </span>
            <h1 className="text-2xl font-bold text-text-light dark:text-text-dark mb-2">
              Guide Not Found
            </h1>
            <p className="text-text-subtle-light dark:text-text-subtle-dark mb-4">
              {error || 'The guide you are looking for does not exist.'}
            </p>
            <Link
              href="/health"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              Back to Health
            </Link>
          </div>
        </div>
      </>
    );
  }

  // Build TOC items from sections
  const tocItems = article.sections.map(s => ({ id: s.id, title: s.title }));

  return (
    <>
      {/* SEO Metadata */}
      <Head>
        <title>{article.metaTitle}</title>
        <meta name="description" content={article.metaDescription} />
        <meta name="keywords" content={article.keywords.join(', ')} />
        <link rel="canonical" href={`https://blushandbreathe.com/guide/${article.slug}`} />
        
        {/* Open Graph */}
        <meta property="og:title" content={article.metaTitle} />
        <meta property="og:description" content={article.metaDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://blushandbreathe.com/guide/${article.slug}`} />
        
        {/* Article metadata */}
        <meta property="article:published_time" content={article.publishedDate} />
        <meta property="article:modified_time" content={article.modifiedDate} />
      </Head>
      
      {/* Schema.org Structured Data */}
      <SchemaMarkup
        type="Article"
        article={{
          title: article.title,
          slug: article.slug,
          category: article.category,
          introduction: article.introduction,
          sections: article.sections,
          conclusion: article.conclusion,
          keywords: article.keywords,
          faqs: article.faqs,
          citations: article.citations,
          readingTime: article.readingTime,
        }}
        pageUrl={`https://blushandbreathe.com/guide/${article.slug}`}
        pageTitle={article.metaTitle}
        pageDescription={article.metaDescription}
        datePublished={article.publishedDate}
        dateModified={article.modifiedDate}
      />

      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {/* Breadcrumb */}
        <nav className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-text-subtle-light dark:text-text-subtle-dark mb-4 sm:mb-6">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link href="/health" className="hover:text-primary">Health</Link>
          <span>/</span>
          <span className="text-text-light dark:text-text-dark">Guides</span>
          <span>/</span>
          <span className="text-text-light dark:text-text-dark truncate max-w-[120px] sm:max-w-[200px]">{article.title}</span>
        </nav>

        <article>
          {/* Header */}
          <header className="mb-6 sm:mb-8">
            <div className="flex items-start justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-text-light dark:text-text-dark mb-2 sm:mb-3">
                  {article.title}
                </h1>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-text-subtle-light dark:text-text-subtle-dark">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    {article.readingTime} min read
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">calendar_today</span>
                    Updated {new Date(article.modifiedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
              <span className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
                {article.category.toUpperCase()}
              </span>
            </div>
          </header>

          {/* Table of Contents */}
          <TableOfContents
            items={tocItems}
            className="mb-8"
          />

          {/* Introduction */}
          <section className="mb-8 sm:mb-10">
            <div 
              className="prose prose-lg dark:prose-invert max-w-none text-text-subtle-light dark:text-text-subtle-dark
                prose-headings:text-text-light dark:prose-headings:text-text-dark
                prose-strong:text-text-light dark:prose-strong:text-text-dark
                prose-a:text-primary"
              dangerouslySetInnerHTML={{ __html: article.introduction }}
            />
          </section>

          {/* Article Sections */}
          <div className="guide-sections">
            {article.sections.map((section) => (
              <section 
                key={section.id} 
                id={section.id}
                className="mb-10 scroll-mt-20"
              >
                <h2 className="text-xl sm:text-2xl font-bold text-text-light dark:text-text-dark mb-3 sm:mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">article</span>
                  {section.title}
                </h2>
                <div 
                  className="pillar-content prose prose-lg dark:prose-invert max-w-none text-text-subtle-light dark:text-text-subtle-dark
                    prose-headings:text-text-light dark:prose-headings:text-text-dark
                    prose-strong:text-text-light dark:prose-strong:text-text-dark
                    prose-ul:list-disc prose-ol:list-decimal
                    prose-a:text-primary"
                  dangerouslySetInnerHTML={{ __html: section.content }}
                />
              </section>
            ))}
          </div>

          {/* Conclusion */}
          {article.conclusion && (
            <section className="mb-10 p-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <h2 className="text-xl font-bold text-text-light dark:text-text-dark mb-3">
                Summary
              </h2>
              <div 
                className="prose dark:prose-invert max-w-none text-text-subtle-light dark:text-text-subtle-dark"
                dangerouslySetInnerHTML={{ __html: article.conclusion }}
              />
            </section>
          )}

          {/* FAQ Accordion */}
          {article.faqs && article.faqs.length > 0 && (
            <FAQAccordion 
              faqs={article.faqs} 
              className="mb-8"
            />
          )}

          {/* Related Pages - Internal Linking */}
          {article.relatedPages && article.relatedPages.length > 0 && (
            <RelatedPagesSection
              relatedPages={article.relatedPages}
              currentPageTitle={article.title}
              className="mb-8"
            />
          )}

          {/* Citations */}
          {article.citations && article.citations.length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-text-light dark:text-text-dark mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">menu_book</span>
                References & Sources
              </h2>
              <ul className="space-y-2">
                {article.citations.map((citation, index) => (
                  <li key={index} className="text-sm text-text-subtle-light dark:text-text-subtle-dark">
                    <span className="text-gray-400 mr-2">[{index + 1}]</span>
                    <a 
                      href={citation.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-primary hover:underline"
                    >
                      {citation.title}
                    </a>
                    <span className="text-gray-400 ml-1">
                      ({citation.source}{citation.year ? `, ${citation.year}` : ''})
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* CTA Section */}
          <section className="mb-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20">
            <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-2">
              Looking for Safe Alternatives?
            </h3>
            <p className="text-text-subtle-light dark:text-text-subtle-dark mb-4">
              Explore our complete guide to legal, FDA-compliant pre-workout ingredients and supplements.
            </p>
            <Link
              href="/health"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <span className="material-symbols-outlined">verified_user</span>
              View Safe Supplements
            </Link>
          </section>
        </article>
      </main>
    </>
  );
}

/**
 * Generate static paths for all content hub guides
 */
export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = getContentHubArticleSlugs();
  
  return {
    paths: slugs.map((slug) => ({ params: { slug } })),
    fallback: 'blocking',
  };
};

/**
 * Fetch guide data at build time
 */
export const getStaticProps: GetStaticProps<GuidePageProps> = async ({ params }) => {
  const slug = params?.slug as string;

  if (!slug) {
    return {
      props: { article: null, error: 'Invalid slug' },
      revalidate: 60,
    };
  }

  try {
    const article = getContentHubArticleBySlug(slug);

    if (!article) {
      return {
        props: { article: null, error: 'Guide not found' },
        revalidate: 60,
      };
    }

    return {
      props: {
        article,
      },
      revalidate: 3600, // Revalidate every hour
    };
  } catch (error) {
    console.error('Failed to fetch guide:', error);
    return {
      props: { article: null, error: 'Failed to load guide data' },
      revalidate: 60,
    };
  }
};
