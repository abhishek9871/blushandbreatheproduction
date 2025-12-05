/**
 * Content Hub Guide Page
 * 
 * Dynamic page for displaying long-form guide articles (cluster pages).
 * Uses ISR (Incremental Static Regeneration) for optimal SEO and performance.
 * 
 * Route: /guide/[slug]
 * Example: /guide/banned-pre-workouts-2025, /guide/dmaa-drug-testing-guide
 */

import React, { useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { GetStaticPaths, GetStaticProps } from 'next';
import {
  SchemaMarkup,
  FAQAccordion,
  TableOfContents,
  RelatedPagesSection,
  processYouTubeEmbedsAlt,
} from '@/components';
import { getContentHubArticleBySlug, getContentHubArticleSlugs } from '@/lib/data';
import type { ContentHubArticle } from '@/types';

interface GuidePageProps {
  article: ContentHubArticle | null;
  error?: string;
  formattedDate?: string;
}

// French translations for localized pages
const frenchUI = {
  breadcrumb: {
    home: 'Accueil',
    health: 'Santé',
    guides: 'Guides',
  },
  article: {
    minRead: 'min de lecture',
    updated: 'Mis à jour le',
    summary: 'Résumé',
    references: 'Références & Sources',
    tableOfContents: 'Table des Matières',
  },
  cta: {
    title: '🎯 Prêt à Transformer Votre Silhouette ?',
    description: 'Rejoignez les 50 000+ Français qui ont découvert cette alternative naturelle à l\'Ozempic. Offre spéciale -50% disponible uniquement via le site officiel.',
    button: '👉 Découvrir GLP Lab (-50%)',
    badge: '🔥 OFFRE LIMITÉE',
  },
  footer: {
    explore: 'Explorer',
    healthArticles: 'Articles Santé',
    beautyTips: 'Conseils Beauté',
    dietPlans: 'Plans Nutritionnels IA',
    videos: 'Vidéos Bien-être',
    mediVault: 'Base Médicaments',
    medicineDb: 'Base de Données',
    searchMeds: 'Rechercher',
    interactions: 'Interactions',
    emergency: 'Urgences',
    aboutUs: 'À Propos',
    ourStory: 'Notre Histoire',
    contact: 'Contact',
    faq: 'FAQ',
    careers: 'Carrières',
    newsletter: 'Rejoignez Notre Newsletter',
    newsletterDesc: 'Recevez les dernières actualités santé et bien-être.',
    yourEmail: 'Votre email',
    subscribe: "S'abonner",
    rights: 'Tous droits réservés.',
    terms: 'Conditions d\'Utilisation',
    privacy: 'Politique de Confidentialité',
  },
  nav: {
    home: 'Accueil',
    health: 'Santé',
    healthStore: 'Boutique',
    mediVault: 'Médicaments',
    beauty: 'Beauté',
    nutrition: 'Nutrition',
    videos: 'Vidéos',
    bookmarks: 'Favoris',
  },
};

export default function GuidePage({ article, error, formattedDate }: GuidePageProps) {
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

  // Process article content to lazy-load YouTube embeds
  // This replaces <iframe> embeds with clickable thumbnail facades
  const processedIntroduction = useMemo(() => 
    processYouTubeEmbedsAlt(article.introduction), 
    [article.introduction]
  );
  
  const processedSections = useMemo(() => 
    article.sections.map(section => ({
      ...section,
      content: processYouTubeEmbedsAlt(section.content),
    })),
    [article.sections]
  );

  return (
    <>
      {/* SEO Metadata */}
      <Head>
        <title>{article.metaTitle}</title>
        <meta name="description" content={article.metaDescription} />
        <meta name="keywords" content={article.keywords.join(', ')} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`https://www.blushandbreath.com/guide/${article.slug}`} />
        {/* Language attribute for French pages */}
        {article.locale === 'fr' && <meta httpEquiv="content-language" content="fr" />}
        
        {/* Open Graph */}
        <meta property="og:title" content={article.metaTitle} />
        <meta property="og:description" content={article.metaDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://www.blushandbreath.com/guide/${article.slug}`} />
        <meta property="og:image" content="https://www.blushandbreath.com/images/og-guide.jpg" />
        <meta property="og:site_name" content="Blush & Breathe" />
        {article.locale === 'fr' && <meta property="og:locale" content="fr_FR" />}
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={article.metaTitle} />
        <meta name="twitter:description" content={article.metaDescription} />
        
        {/* Article metadata */}
        <meta property="article:published_time" content={article.publishedDate} />
        <meta property="article:modified_time" content={article.modifiedDate} />
        <meta property="article:section" content="Health" />
        <meta name="author" content="Blush & Breathe" />
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
          locale: article.locale, // Pass locale for proper language in schema
        }}
        pageUrl={`https://www.blushandbreath.com/guide/${article.slug}`}
        pageTitle={article.metaTitle}
        pageDescription={article.metaDescription}
        datePublished={article.publishedDate}
        dateModified={article.modifiedDate}
      />

      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {/* Breadcrumb */}
        <nav className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-text-subtle-light dark:text-text-subtle-dark mb-4 sm:mb-6">
          <Link href="/" className="hover:text-primary">
            {article.locale === 'fr' ? frenchUI.breadcrumb.home : 'Home'}
          </Link>
          <span>/</span>
          <Link href="/health" className="hover:text-primary">
            {article.locale === 'fr' ? frenchUI.breadcrumb.health : 'Health'}
          </Link>
          <span>/</span>
          <span className="text-text-light dark:text-text-dark">
            {article.locale === 'fr' ? frenchUI.breadcrumb.guides : 'Guides'}
          </span>
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
                    {article.readingTime} {article.locale === 'fr' ? frenchUI.article.minRead : 'min read'}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">calendar_today</span>
                    {article.locale === 'fr' ? frenchUI.article.updated : 'Updated'} {formattedDate}
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
            locale={article.locale}
          />

          {/* Introduction */}
          <section className="mb-8 sm:mb-10">
            <div 
              className="prose prose-lg dark:prose-invert max-w-none text-text-subtle-light dark:text-text-subtle-dark
                prose-headings:text-text-light dark:prose-headings:text-text-dark
                prose-strong:text-text-light dark:prose-strong:text-text-dark
                prose-a:text-primary"
              dangerouslySetInnerHTML={{ __html: processedIntroduction }}
            />
          </section>

          {/* Article Sections */}
          <div className="guide-sections">
            {processedSections.map((section) => (
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
                {article.locale === 'fr' ? frenchUI.article.references : 'References & Sources'}
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

          {/* Affiliate CTA Section - Compelling conversion-focused design */}
          {article.locale === 'fr' && (
            <section className="mb-8 p-6 sm:p-8 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/30 dark:via-emerald-900/20 dark:to-teal-900/20 rounded-2xl border-2 border-green-200 dark:border-green-700 shadow-lg relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-200/30 dark:bg-green-700/20 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-200/30 dark:bg-emerald-700/20 rounded-full translate-y-1/2 -translate-x-1/2" />
              
              <div className="relative z-10">
                {/* Limited offer badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full mb-4 animate-pulse">
                  <span>🔥</span>
                  <span>OFFRE LIMITÉE -50%</span>
                </div>
                
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  🎯 Prêt à Transformer Votre Silhouette ?
                </h3>
                
                <p className="text-gray-700 dark:text-gray-300 mb-4 text-base sm:text-lg">
                  Rejoignez les <strong className="text-green-600 dark:text-green-400">50 000+ Français</strong> qui ont découvert cette alternative naturelle à l&apos;Ozempic.
                </p>
                
                {/* Benefits list */}
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <span className="text-green-500">✓</span>
                    <span><strong>49€/mois</strong> au lieu de 300€ (Ozempic)</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <span className="text-green-500">✓</span>
                    <span>Livraison <strong>gratuite 48-72h</strong> depuis les Pays-Bas</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <span className="text-green-500">✓</span>
                    <span>Garantie <strong>satisfait ou remboursé 30 jours</strong></span>
                  </li>
                </ul>
                
                <a
                  href="https://tl-track.com/tracker/vDdk/?sub_id=glp_cluster_fr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
                >
                  <span>👉 Découvrir GLP Lab (-50%)</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </a>
                
                <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center sm:text-left">
                  ⚠️ Attention aux contrefaçons : commandez uniquement sur le site officiel
                </p>
              </div>
            </section>
          )}
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

    // Format date at build time to prevent hydration mismatch
    // Use French format for French locale articles
    const formattedDate = new Date(article.modifiedDate).toLocaleDateString(
      article.locale === 'fr' ? 'fr-FR' : 'en-US', 
      { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric',
        timeZone: 'UTC' // Use UTC to ensure consistent output
      }
    );

    return {
      props: {
        article,
        formattedDate,
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
