/**
 * Banned Substance Detail Page
 * 
 * Dynamic page for displaying information about banned/restricted substances.
 * Uses ISR (Incremental Static Regeneration) for optimal SEO and performance.
 * 
 * Route: /banned/[slug]
 * Example: /banned/dmaa, /banned/phenibut
 */

import React, { useEffect, Suspense } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { GetStaticPaths, GetStaticProps } from 'next';
import {
  BannedSubstanceWarning,
  SafetyWarningAlert,
  SubstanceCard,
  AffiliateProductList,
  MetaHead,
  SchemaMarkup,
  VerdictBanner,
  SafeSwapBox,
  TableOfContents,
  IngredientsTable,
} from '@/components';
import { LoadingSpinner } from '@/components';

// Dynamic imports for heavy components - improves initial page load
const RelatedArticles = dynamic(() => import('@/components/articles/RelatedArticles').then(mod => mod.RelatedArticles), {
  loading: () => <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-64 rounded-xl" />,
  ssr: false // Wikipedia content doesn't need SSR for SEO (schema already has the data)
});

const FAQAccordion = dynamic(() => import('@/components/FAQ/FAQAccordion').then(mod => mod.FAQAccordion), {
  loading: () => <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-32 rounded-xl" />,
});

const RelatedPagesSection = dynamic(() => import('@/components/articles/RelatedPagesSection').then(mod => mod.RelatedPagesSection), {
  loading: () => <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-24 rounded-xl" />,
});
import { useLegalAlternatives, useAffiliateProducts } from '@/hooks';
import { trackPageView, trackWarningViewed } from '@/lib/analytics';
import { getAffiliateProductsForSupplement, getBannedSubstanceBySlug, getBannedSubstanceSlugs, getSubstanceArticles } from '@/lib/data';
import type { BannedSubstance, LegalSupplement, AffiliateProduct, SubstanceArticles } from '@/types';

// Age gate removed - was blocking Google from seeing content

interface BannedSubstancePageProps {
  substance: BannedSubstance | null;
  articles: SubstanceArticles | null;
  error?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function BannedSubstancePage({ substance, articles, error }: BannedSubstancePageProps) {
  // Fetch legal alternatives client-side for freshness
  const { data: alternatives, loading: altLoading } = useLegalAlternatives(substance?.slug);

  if (error || !substance) {
    return (
      <>
        <Head>
          <title>Substance Not Found | Blush & Breathe</title>
          <meta name="robots" content="noindex" />
        </Head>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-6xl text-gray-400 mb-4">
              search_off
            </span>
            <h1 className="text-2xl font-bold text-text-light dark:text-text-dark mb-2">
              Substance Not Found
            </h1>
            <p className="text-text-subtle-light dark:text-text-subtle-dark mb-4">
              {error || 'The substance you are looking for does not exist or has been removed.'}
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

  // Track page view and warning on mount
  useEffect(() => {
    if (substance) {
      trackPageView({
        pageType: 'banned',
        pageTitle: substance.metaTitle,
        pagePath: `/banned/${substance.slug}`,
        substanceName: substance.name,
        substanceCategory: substance.category,
      });
      trackWarningViewed(substance.name, 'banned', 'high');
    }
  }, [substance]);

  return (
    <>
      {/* Dynamic SEO Metadata */}
      <MetaHead
        pageType="banned"
        bannedSubstance={substance}
      />
      
      {/* Schema.org Structured Data with Citations for E-E-A-T SEO */}
      <SchemaMarkup
        type="MedicalWebPage"
        bannedSubstance={substance}
        citations={articles?.pubmed}
        pageUrl={`https://www.blushandbreath.com/banned/${substance.slug}`}
        pageTitle={substance.metaTitle}
        pageDescription={substance.metaDescription}
        datePublished={substance.createdAt}
        dateModified={substance.updatedAt}
      />

      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {/* Breadcrumb */}
        <nav className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-text-subtle-light dark:text-text-subtle-dark mb-4 sm:mb-6">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link href="/health" className="hover:text-primary">Health</Link>
          <span>/</span>
          <span className="text-text-light dark:text-text-dark">Banned Substances</span>
          <span>/</span>
          <span className="text-text-light dark:text-text-dark">{substance.name}</span>
        </nav>

        {/* VERDICT BANNER - Clear status at top */}
        <VerdictBanner
          type="banned"
          substanceName={substance.name}
          legalStatus={substance.legalStatus}
          bannedBy={substance.bannedBy}
          primaryRisk={substance.healthRisks[0]?.description || 'Serious health risks documented'}
          className="mb-8"
        />

        {/* Main Content */}
        <article>
          {/* Header */}
          <header className="mb-6 sm:mb-8">
            <div className="flex items-start justify-between gap-2 sm:gap-4 mb-2 sm:mb-3">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold medical-heading text-text-light dark:text-text-dark leading-tight">
                {substance.name}
              </h1>
              <span className="flex-shrink-0 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-alert-red text-white rounded-full text-xs sm:text-sm font-bold shadow-md">
                {(substance as any).isProduct ? 'PRODUCT' : substance.category.toUpperCase()}
              </span>
            </div>
            {substance.alternativeNames.length > 0 && (
              <p className="text-xs sm:text-sm text-text-subtle-light dark:text-text-subtle-dark leading-relaxed">
                <span className="font-medium">Also known as:</span> {substance.alternativeNames.join(', ')}
              </p>
            )}
            
            {/* Product Brand Badge */}
            {(substance as any).isProduct && (substance as any).productBrand && (
              <div className="flex items-center gap-2 mt-2">
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-text-subtle-light dark:text-text-subtle-dark">
                  Brand: <strong>{(substance as any).productBrand}</strong>
                </span>
              </div>
            )}
          </header>

          {/* Table of Contents - Pillar Pages Only */}
          {(substance as any).isPillarPage && (substance as any).pillarSections && (
            <div className="mb-8">
              <TableOfContents
                items={(substance as any).pillarSections.map((s: any) => ({ id: s.id, title: s.title }))}
                className=""
              />
            </div>
          )}

          {/* Product Ingredients Table */}
          {(substance as any).isProduct && (substance as any).ingredients && (
            <IngredientsTable
              ingredients={(substance as any).ingredients}
              productName={substance.name}
              className="mb-8"
            />
          )}

          {/* Counterfeit Warnings - Product Pages */}
          {(substance as any).counterfeitWarnings && (substance as any).counterfeitWarnings.length > 0 && (
            <section className="mb-8">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-xl p-5">
                <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined">warning</span>
                  How to Spot Counterfeit {substance.name}
                </h2>
                <ul className="space-y-2">
                  {(substance as any).counterfeitWarnings.map((warning: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-yellow-700 dark:text-yellow-300">
                      <span className="material-symbols-outlined text-sm mt-0.5">report_problem</span>
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* Authorized Retailers - Product Pages */}
          {(substance as any).authorizedRetailers && (substance as any).authorizedRetailers.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-text-light dark:text-text-dark mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-green-500">verified</span>
                Authorized Retailers
              </h2>
              <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark mb-3">
                Only purchase from official authorized retailers to avoid counterfeits:
              </p>
              <div className="flex flex-wrap gap-2">
                {(substance as any).authorizedRetailers.map((retailer: string, i: number) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg text-sm border border-green-200 dark:border-green-800"
                  >
                    {retailer}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Description */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text-light dark:text-text-dark mb-3">
              What is {substance.name}?
            </h2>
            <p className="text-text-subtle-light dark:text-text-subtle-dark leading-relaxed">
              {substance.description}
            </p>
          </section>

          {/* Why Banned */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text-light dark:text-text-dark mb-3">
              Why is {substance.name} Banned?
            </h2>
            <p className="text-text-subtle-light dark:text-text-subtle-dark leading-relaxed mb-4">
              {substance.whyBanned}
            </p>
            <div className="flex flex-wrap gap-2">
              {substance.bannedBy.map((org) => (
                <span
                  key={org}
                  className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full text-sm"
                >
                  Banned by {org}
                </span>
              ))}
            </div>
          </section>

          {/* Health Risks */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text-light dark:text-text-dark mb-3">
              Health Risks & Side Effects
            </h2>
            
            {/* Risk Level Warning */}
            <SafetyWarningAlert
              severity="danger"
              title="Health Risk Level"
              message={`This substance has a ${substance.overdoseRisk} risk of overdose and ${substance.addictionPotential} addiction potential.`}
              riskLevel={substance.overdoseRisk}
              className="mb-4"
            />

            {/* Side Effects List */}
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="bg-white dark:bg-card-dark rounded-lg p-4 border border-border-light dark:border-border-dark">
                <h4 className="font-semibold text-text-light dark:text-text-dark mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-orange-500">warning</span>
                  Common Side Effects
                </h4>
                <ul className="space-y-1.5">
                  {substance.sideEffects.slice(0, 6).map((effect, i) => (
                    <li key={i} className="text-sm text-text-subtle-light dark:text-text-subtle-dark flex items-start gap-2">
                      <span className="material-symbols-outlined text-base text-orange-400 flex-shrink-0" style={{ fontSize: '16px' }}>arrow_right</span>
                      {effect}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white dark:bg-card-dark rounded-lg p-4 border border-border-light dark:border-border-dark">
                <h4 className="font-semibold text-text-light dark:text-text-dark mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-500">block</span>
                  Contraindications
                </h4>
                <ul className="space-y-1.5">
                  {substance.contraindications.slice(0, 6).map((contra, i) => (
                    <li key={i} className="text-sm text-text-subtle-light dark:text-text-subtle-dark flex items-start gap-2">
                      <span className="material-symbols-outlined text-base text-red-400 flex-shrink-0" style={{ fontSize: '16px' }}>arrow_right</span>
                      {contra}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Mechanism of Action */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text-light dark:text-text-dark mb-3">
              How Does {substance.name} Work?
            </h2>
            <p className="text-text-subtle-light dark:text-text-subtle-dark leading-relaxed">
              {substance.mechanism}
            </p>
          </section>

          {/* History */}
          {substance.history && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-text-light dark:text-text-dark mb-3">
                History
              </h2>
              <p className="text-text-subtle-light dark:text-text-subtle-dark leading-relaxed">
                {substance.history}
              </p>
            </section>
          )}

          {/* Safe Swap Section - Prominent CTA */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold medical-heading text-text-light dark:text-text-dark mb-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-3xl text-success-green">verified_user</span>
              Safe Legal Alternatives
            </h2>
            <p className="text-lg text-text-subtle-light dark:text-text-subtle-dark mb-6 medical-body">
              Don&apos;t risk your health with {substance.name}. Here are proven, legal alternatives 
              that provide similar benefits safely:
            </p>

            {altLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : alternatives && alternatives.length > 0 ? (
              <div className="space-y-6">
                {/* Featured Alternative with SafeSwapBox */}
                <SafeSwapBox
                  bannedSubstance={substance}
                  alternative={alternatives[0]}
                  topProduct={getAffiliateProductsForSupplement(alternatives[0].slug)[0]}
                  position={0}
                />
                
                {/* Additional Alternatives */}
                {alternatives.length > 1 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-4">
                      More Safe Alternatives
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {alternatives.slice(1).map((alt, index) => (
                        <SubstanceCard
                          key={alt.slug}
                          type="supplement"
                          substance={alt}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <span className="material-symbols-outlined text-4xl text-gray-400 mb-2">search</span>
                <p className="text-text-subtle-light dark:text-text-subtle-dark">
                  No alternatives available at this time. Check back soon.
                </p>
              </div>
            )}
          </section>

          {/* Pillar Page Sections - Detailed Content */}
          {(substance as any).isPillarPage && (substance as any).pillarSections && (
            <div className="pillar-sections mb-8 clear-both">
              {(substance as any).pillarSections.map((section: any) => (
                <section 
                  key={section.id} 
                  id={section.id}
                  className="mb-10 scroll-mt-20"
                >
                  <h2 className="text-2xl font-bold text-text-light dark:text-text-dark mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">article</span>
                    {section.title}
                  </h2>
                  <div 
                    className="pillar-content prose prose-lg dark:prose-invert max-w-none text-text-subtle-light dark:text-text-subtle-dark
                      prose-headings:text-text-light dark:prose-headings:text-text-dark
                      prose-strong:text-text-light dark:prose-strong:text-text-dark
                      prose-ul:list-disc prose-ol:list-decimal"
                    dangerouslySetInnerHTML={{ __html: section.content }}
                  />
                </section>
              ))}
            </div>
          )}

          {/* FAQ Accordion */}
          {(substance as any).faqs && (substance as any).faqs.length > 0 && (
            <FAQAccordion 
              faqs={(substance as any).faqs} 
              className="mb-8"
            />
          )}

          {/* Related Pages - Internal Linking */}
          {(substance as any).relatedPages && (substance as any).relatedPages.length > 0 && (
            <RelatedPagesSection
              relatedPages={(substance as any).relatedPages}
              currentPageTitle={substance.name}
              className="mb-8"
            />
          )}

          {/* Related Articles - Wikipedia, PubMed, Images */}
          {articles && (
            <section className="mb-8">
              <RelatedArticles
                articles={articles}
                substanceType="banned"
              />
            </section>
          )}

          {/* Sticky Mobile CTA */}
          {alternatives && alternatives.length > 0 && (
            <div className="sticky-cta md:hidden">
              <Link
                href={`/supplement/${alternatives[0].slug}`}
                className="cta-button cta-button-success w-full"
              >
                <span className="material-symbols-outlined">swap_horiz</span>
                Try Safe Alternative: {alternatives[0].name}
              </Link>
            </div>
          )}
        </article>
        
        {/* Mobile CTA Spacer */}
        <div className="sticky-cta-spacer md:hidden" />
      </main>
    </>
  );
}

/**
 * Generate static paths for all banned substances
 */
export const getStaticPaths: GetStaticPaths = async () => {
  // Get all banned substance slugs from local data
  const slugs = getBannedSubstanceSlugs();
  
  return {
    paths: slugs.map((slug) => ({ params: { slug } })),
    fallback: 'blocking', // New pages generated on-demand
  };
};

/**
 * Fetch substance data from local JSON at build time
 */
export const getStaticProps: GetStaticProps<BannedSubstancePageProps> = async ({ params }) => {
  const slug = params?.slug as string;

  if (!slug) {
    return {
      props: { substance: null, articles: null, error: 'Invalid slug' },
      revalidate: 60,
    };
  }

  try {
    // Get substance directly from local JSON data
    const substance = getBannedSubstanceBySlug(slug);

    if (!substance) {
      return {
        props: { substance: null, articles: null, error: 'Substance not found' },
        revalidate: 60,
      };
    }

    // Get related articles (Wikipedia, PubMed, images)
    const articles = getSubstanceArticles(slug) || null;

    return {
      props: {
        substance,
        articles,
      },
      revalidate: 3600, // Revalidate every hour
    };
  } catch (error) {
    console.error('Failed to fetch banned substance:', error);
    return {
      props: { substance: null, articles: null, error: 'Failed to load substance data' },
      revalidate: 60,
    };
  }
};
