/**
 * Legal Supplement Detail Page
 * 
 * Dynamic page for displaying information about legal dietary supplements.
 * Uses ISR (Incremental Static Regeneration) for optimal SEO and performance.
 * 
 * Route: /supplement/[slug]
 * Example: /supplement/caffeine, /supplement/l-theanine
 */

import React, { useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { GetStaticPaths, GetStaticProps } from 'next';
import {
  LegalDisclaimerBanner,
  SafetyWarningAlert,
  AffiliateProductList,
  MetaHead,
  SchemaMarkup,
  FDADisclaimer,
  AffiliateDisclosure,
  VerdictBanner,
} from '@/components';
import { LoadingSpinner } from '@/components';
import { useAffiliateProducts } from '@/hooks';
import { trackPageView, trackAffiliateClick } from '@/lib/analytics';
import type { LegalSupplement, AffiliateProduct } from '@/types';

interface SupplementPageProps {
  supplement: LegalSupplement | null;
  error?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function SupplementPage({ supplement, error }: SupplementPageProps) {
  // Fetch affiliate products client-side for freshness
  const { data: products, loading: productsLoading } = useAffiliateProducts(supplement?.slug);

  if (error || !supplement) {
    return (
      <>
        <Head>
          <title>Supplement Not Found | Blush & Breathe</title>
          <meta name="robots" content="noindex" />
        </Head>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-6xl text-gray-400 mb-4">
              search_off
            </span>
            <h1 className="text-2xl font-bold text-text-light dark:text-text-dark mb-2">
              Supplement Not Found
            </h1>
            <p className="text-text-subtle-light dark:text-text-subtle-dark mb-4">
              {error || 'The supplement you are looking for does not exist.'}
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

  // Track page view on mount
  useEffect(() => {
    if (supplement) {
      trackPageView({
        pageType: 'supplement',
        pageTitle: supplement.metaTitle,
        pagePath: `/supplement/${supplement.slug}`,
        substanceName: supplement.name,
        substanceCategory: supplement.category,
      });
    }
  }, [supplement]);

  return (
    <>
      {/* Dynamic SEO Metadata */}
      <MetaHead
        pageType="supplement"
        supplement={supplement}
      />
      
      {/* Schema.org Structured Data */}
      <SchemaMarkup
        type="DietarySupplement"
        supplement={supplement}
        pageUrl={`https://blushandbreathe.com/supplement/${supplement.slug}`}
        pageTitle={supplement.metaTitle}
        pageDescription={supplement.metaDescription}
        datePublished={supplement.createdAt}
        dateModified={supplement.updatedAt}
      />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Legal Disclaimers */}
        <LegalDisclaimerBanner pageType="supplement" className="mb-6" />
        
        {/* Affiliate Disclosure - FTC Required */}
        <AffiliateDisclosure variant="inline" className="mb-6" />

        {/* VERDICT BANNER - Clear SAFE status */}
        <VerdictBanner
          type="safe"
          substanceName={supplement.name}
          safetyRating={supplement.safetyRating}
          fdaStatus={supplement.fdaStatus}
          className="mb-8"
        />

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-text-subtle-light dark:text-text-subtle-dark mb-6">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link href="/health" className="hover:text-primary">Health</Link>
          <span>/</span>
          <span className="text-text-light dark:text-text-dark">Supplements</span>
          <span>/</span>
          <span className="text-text-light dark:text-text-dark">{supplement.name}</span>
        </nav>

        {/* Main Content */}
        <article>
          {/* Header */}
          <header className="mb-8">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-text-light dark:text-text-dark mb-2">
                  {supplement.name}
                </h1>
                {supplement.alternativeNames.length > 0 && (
                  <p className="text-text-subtle-light dark:text-text-subtle-dark">
                    Also known as: {supplement.alternativeNames.join(', ')}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-semibold">
                  LEGAL
                </span>
                {supplement.qualityCertifications.length > 0 && (
                  <div className="flex gap-1">
                    {supplement.qualityCertifications.slice(0, 3).map((cert) => (
                      <span
                        key={cert}
                        className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-xs"
                      >
                        {cert}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Quick Info Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-card-dark rounded-lg p-4 border border-border-light dark:border-border-dark text-center">
              <span className="material-symbols-outlined text-2xl text-primary mb-1">category</span>
              <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark">Category</p>
              <p className="font-semibold text-text-light dark:text-text-dark capitalize">
                {supplement.category.replace('_', ' ')}
              </p>
            </div>
            <div className="bg-white dark:bg-card-dark rounded-lg p-4 border border-border-light dark:border-border-dark text-center">
              <span className="material-symbols-outlined text-2xl text-green-500 mb-1">verified_user</span>
              <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark">FDA Status</p>
              <p className="font-semibold text-text-light dark:text-text-dark uppercase">
                {supplement.fdaStatus}
              </p>
            </div>
            <div className="bg-white dark:bg-card-dark rounded-lg p-4 border border-border-light dark:border-border-dark text-center">
              <span className="material-symbols-outlined text-2xl text-yellow-500 mb-1">health_and_safety</span>
              <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark">Safety</p>
              <p className="font-semibold text-text-light dark:text-text-dark capitalize">
                {supplement.safetyRating}
              </p>
            </div>
            <div className="bg-white dark:bg-card-dark rounded-lg p-4 border border-border-light dark:border-border-dark text-center">
              <span className="material-symbols-outlined text-2xl text-blue-500 mb-1">medication</span>
              <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark">Forms</p>
              <p className="font-semibold text-text-light dark:text-text-dark">
                {supplement.forms.length} types
              </p>
            </div>
          </div>

          {/* Description */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text-light dark:text-text-dark mb-3">
              What is {supplement.name}?
            </h2>
            <p className="text-text-subtle-light dark:text-text-subtle-dark leading-relaxed">
              {supplement.description}
            </p>
          </section>

          {/* Benefits */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text-light dark:text-text-dark mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-green-500">thumb_up</span>
              Benefits
            </h2>
            <ul className="grid md:grid-cols-2 gap-2">
              {supplement.benefits.map((benefit, i) => (
                <li key={i} className="flex items-start gap-2 text-text-subtle-light dark:text-text-subtle-dark">
                  <span className="material-symbols-outlined text-green-500 text-sm mt-1">check</span>
                  {benefit}
                </li>
              ))}
            </ul>
          </section>

          {/* Mechanism */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text-light dark:text-text-dark mb-3">
              How Does {supplement.name} Work?
            </h2>
            <p className="text-text-subtle-light dark:text-text-subtle-dark leading-relaxed">
              {supplement.mechanism}
            </p>
          </section>

          {/* Dosage */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text-light dark:text-text-dark mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-500">scale</span>
              Dosage Guidelines
            </h2>
            <div className="bg-white dark:bg-card-dark rounded-lg p-4 border border-border-light dark:border-border-dark">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark mb-1">Recommended</p>
                  <p className="font-semibold text-text-light dark:text-text-dark">{supplement.dosage.recommended}</p>
                </div>
                <div>
                  <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark mb-1">Minimum</p>
                  <p className="font-semibold text-text-light dark:text-text-dark">{supplement.dosage.minimum}</p>
                </div>
                <div>
                  <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark mb-1">Maximum</p>
                  <p className="font-semibold text-text-light dark:text-text-dark">{supplement.dosage.maximum}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border-light dark:border-border-dark">
                <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark">
                  <strong>Timing:</strong> {supplement.dosage.timing}
                </p>
                <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark">
                  <strong>With food:</strong> {supplement.dosage.withFood ? 'Yes, recommended' : 'Can be taken on empty stomach'}
                </p>
                {supplement.dosage.notes && (
                  <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark mt-2">
                    <strong>Note:</strong> {supplement.dosage.notes}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Side Effects & Safety */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text-light dark:text-text-dark mb-3">
              Side Effects & Safety
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-card-dark rounded-lg p-4 border border-border-light dark:border-border-dark">
                <h4 className="font-semibold text-text-light dark:text-text-dark mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-yellow-500">warning</span>
                  Potential Side Effects
                </h4>
                <ul className="space-y-1">
                  {supplement.sideEffects.map((effect, i) => (
                    <li key={i} className="text-sm text-text-subtle-light dark:text-text-subtle-dark">
                      • {effect}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white dark:bg-card-dark rounded-lg p-4 border border-border-light dark:border-border-dark">
                <h4 className="font-semibold text-text-light dark:text-text-dark mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-500">do_not_disturb</span>
                  Contraindications
                </h4>
                <ul className="space-y-1">
                  {supplement.contraindications.map((contra, i) => (
                    <li key={i} className="text-sm text-text-subtle-light dark:text-text-subtle-dark">
                      • {contra}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Drug Interactions */}
          {supplement.drugInteractions.length > 0 && (
            <section className="mb-8">
              <SafetyWarningAlert
                severity="warning"
                title="Drug Interactions"
                message={`${supplement.name} may interact with certain medications.`}
                details={supplement.drugInteractions}
              />
            </section>
          )}

          {/* Scientific Evidence */}
          {supplement.scientificEvidence.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-text-light dark:text-text-dark mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-500">science</span>
                Scientific Evidence
              </h2>
              <div className="space-y-3">
                {supplement.scientificEvidence.map((evidence, i) => (
                  <div key={i} className="bg-white dark:bg-card-dark rounded-lg p-4 border border-border-light dark:border-border-dark">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-medium text-text-light dark:text-text-dark">
                        {evidence.claim}
                      </h4>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        evidence.evidenceLevel === 'strong' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                        evidence.evidenceLevel === 'moderate' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {evidence.evidenceLevel} evidence
                      </span>
                    </div>
                    <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark">
                      {evidence.summary}
                    </p>
                    <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark mt-2">
                      Based on {evidence.studies} studies
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Affiliate Products */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text-light dark:text-text-dark mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">shopping_bag</span>
              Where to Buy {supplement.name}
            </h2>
            
            {productsLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : products && products.length > 0 ? (
              <AffiliateProductList products={products} variant="card" />
            ) : (
              <div className="text-center py-6 bg-white dark:bg-card-dark rounded-lg border border-border-light dark:border-border-dark">
                <span className="material-symbols-outlined text-3xl text-gray-400 mb-2">inventory_2</span>
                <p className="text-text-subtle-light dark:text-text-subtle-dark">
                  No product recommendations available at this time.
                </p>
              </div>
            )}
          </section>

          {/* Replaces Banned Substances */}
          {supplement.replacementFor.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-text-light dark:text-text-dark mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-green-500">swap_horiz</span>
                Legal Alternative To
              </h2>
              <p className="text-text-subtle-light dark:text-text-subtle-dark mb-3">
                {supplement.name} is commonly used as a legal alternative to these restricted substances:
              </p>
              <div className="flex flex-wrap gap-2">
                {supplement.replacementFor.map((slug) => (
                  <Link
                    key={slug}
                    href={`/banned/${slug}`}
                    className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full text-sm hover:opacity-80 transition-opacity"
                  >
                    {slug.replace(/-/g, ' ')}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>

        {/* Bottom Disclaimers */}
        <LegalDisclaimerBanner
          pageType="supplement"
          collapsible
          defaultExpanded={false}
          className="mt-8"
        />
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps<SupplementPageProps> = async ({ params }) => {
  const slug = params?.slug as string;

  if (!slug) {
    return {
      props: { supplement: null, error: 'Invalid slug' },
      revalidate: 60,
    };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/supplement/${encodeURIComponent(slug)}`);
    const result = await response.json();

    if (!result.success || !result.data) {
      return {
        props: { supplement: null, error: 'Supplement not found' },
        revalidate: 60,
      };
    }

    return {
      props: {
        supplement: result.data,
      },
      revalidate: 3600,
    };
  } catch (error) {
    console.error('Failed to fetch supplement:', error);
    return {
      props: { supplement: null, error: 'Failed to load supplement data' },
      revalidate: 60,
    };
  }
};
