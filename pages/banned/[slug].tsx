/**
 * Banned Substance Detail Page
 * 
 * Dynamic page for displaying information about banned/restricted substances.
 * Uses ISR (Incremental Static Regeneration) for optimal SEO and performance.
 * 
 * Route: /banned/[slug]
 * Example: /banned/dmaa, /banned/phenibut
 */

import React, { useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { GetStaticPaths, GetStaticProps } from 'next';
import {
  LegalDisclaimerBanner,
  BannedSubstanceWarning,
  SafetyWarningAlert,
  SubstanceCard,
  AffiliateProductList,
  MetaHead,
  SchemaMarkup,
  AgeGate,
  VerdictBanner,
  SafeSwapBox,
} from '@/components';
import { LoadingSpinner } from '@/components';
import { useLegalAlternatives, useAffiliateProducts } from '@/hooks';
import { trackPageView, trackWarningViewed } from '@/lib/analytics';
import { getAffiliateProductsForSupplement } from '@/lib/data';
import type { BannedSubstance, LegalSupplement, AffiliateProduct } from '@/types';

// Substances that require age verification
const AGE_RESTRICTED_SUBSTANCES = ['kratom', 'phenibut'];

interface BannedSubstancePageProps {
  substance: BannedSubstance | null;
  error?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function BannedSubstancePage({ substance, error }: BannedSubstancePageProps) {
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

  // Check if age gate is required
  const requiresAgeGate = substance && AGE_RESTRICTED_SUBSTANCES.includes(substance.slug);

  return (
    <>
      {/* Dynamic SEO Metadata */}
      <MetaHead
        pageType="banned"
        bannedSubstance={substance}
      />
      
      {/* Schema.org Structured Data */}
      <SchemaMarkup
        type="MedicalWebPage"
        bannedSubstance={substance}
        pageUrl={`https://blushandbreathe.com/banned/${substance.slug}`}
        pageTitle={substance.metaTitle}
        pageDescription={substance.metaDescription}
        datePublished={substance.createdAt}
        dateModified={substance.updatedAt}
      />

      {/* Age Gate for restricted substances */}
      {requiresAgeGate && (
        <AgeGate
          minAge={18}
          substanceName={substance.name}
        />
      )}

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Legal Disclaimers - MUST be visible */}
        <LegalDisclaimerBanner pageType="banned" className="mb-6" />

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-text-subtle-light dark:text-text-subtle-dark mb-6">
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
          <header className="mb-8">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold medical-heading text-text-light dark:text-text-dark mb-2">
                  {substance.name}
                </h1>
                {substance.alternativeNames.length > 0 && (
                  <p className="text-text-subtle-light dark:text-text-subtle-dark">
                    Also known as: {substance.alternativeNames.join(', ')}
                  </p>
                )}
              </div>
              <span className="px-3 py-1.5 bg-alert-red text-white rounded-full text-sm font-bold shadow-md">
                {substance.category.toUpperCase()}
              </span>
            </div>
          </header>

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
                <ul className="space-y-1">
                  {substance.sideEffects.slice(0, 6).map((effect, i) => (
                    <li key={i} className="text-sm text-text-subtle-light dark:text-text-subtle-dark flex items-start gap-2">
                      <span className="material-symbols-outlined text-xs mt-1">arrow_right</span>
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
                <ul className="space-y-1">
                  {substance.contraindications.slice(0, 6).map((contra, i) => (
                    <li key={i} className="text-sm text-text-subtle-light dark:text-text-subtle-dark flex items-start gap-2">
                      <span className="material-symbols-outlined text-xs mt-1">arrow_right</span>
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

        {/* Bottom Disclaimer */}
        <LegalDisclaimerBanner
          type="medical"
          collapsible
          defaultExpanded={false}
          className="mt-8"
        />
      </main>
    </>
  );
}

/**
 * Generate static paths for ISR
 * Returns empty paths initially - pages generated on-demand
 */
export const getStaticPaths: GetStaticPaths = async () => {
  // For initial build, return empty paths
  // Pages will be generated on first request (fallback: 'blocking')
  return {
    paths: [],
    fallback: 'blocking',
  };
};

/**
 * Fetch substance data at build/request time
 */
export const getStaticProps: GetStaticProps<BannedSubstancePageProps> = async ({ params }) => {
  const slug = params?.slug as string;

  if (!slug) {
    return {
      props: { substance: null, error: 'Invalid slug' },
      revalidate: 60,
    };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/banned/${encodeURIComponent(slug)}`);
    const result = await response.json();

    if (!result.success || !result.data) {
      return {
        props: { substance: null, error: 'Substance not found' },
        revalidate: 60, // Try again in 1 minute
      };
    }

    return {
      props: {
        substance: result.data,
      },
      revalidate: 3600, // Revalidate every hour
    };
  } catch (error) {
    console.error('Failed to fetch banned substance:', error);
    return {
      props: { substance: null, error: 'Failed to load substance data' },
      revalidate: 60,
    };
  }
};
