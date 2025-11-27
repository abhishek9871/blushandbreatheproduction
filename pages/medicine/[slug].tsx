/**
 * Medicine/Drug Information Page
 * 
 * Dynamic page for displaying pharmaceutical drug information from OpenFDA/RxNorm.
 * Uses ISR (Incremental Static Regeneration) for optimal SEO and performance.
 * 
 * Route: /medicine/[slug]
 * Example: /medicine/modafinil, /medicine/acetaminophen
 */

import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { GetStaticPaths, GetStaticProps } from 'next';
import {
  LegalDisclaimerBanner,
  DrugInteractionTable,
} from '@/components';
import { LoadingSpinner } from '@/components';
import { useDrugInteractions } from '@/hooks';
import type { MedicineInfo, DrugInteraction } from '@/types';

interface MedicinePageProps {
  medicine: MedicineInfo | null;
  error?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function MedicinePage({ medicine, error }: MedicinePageProps) {
  // Fetch interactions client-side if RxCUI is available
  const { data: interactions, loading: interactionsLoading } = useDrugInteractions(
    medicine?.genericName || medicine?.brandName,
    undefined // Second drug - not provided for single drug lookup
  );

  if (error || !medicine) {
    return (
      <>
        <Head>
          <title>Medicine Not Found | Blush & Breathe</title>
          <meta name="robots" content="noindex" />
        </Head>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-6xl text-gray-400 mb-4">
              search_off
            </span>
            <h1 className="text-2xl font-bold text-text-light dark:text-text-dark mb-2">
              Medicine Not Found
            </h1>
            <p className="text-text-subtle-light dark:text-text-subtle-dark mb-4">
              {error || 'The medicine you are looking for could not be found in our database.'}
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

  const displayName = medicine.brandName || medicine.genericName;

  return (
    <>
      <Head>
        <title>{medicine.metaTitle}</title>
        <meta name="description" content={medicine.metaDescription} />
        <meta name="keywords" content={medicine.keywords.join(', ')} />
        <link rel="canonical" href={`https://blushandbreath.com/medicine/${medicine.slug}`} />
        
        {/* Open Graph */}
        <meta property="og:title" content={medicine.metaTitle} />
        <meta property="og:description" content={medicine.metaDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://blushandbreath.com/medicine/${medicine.slug}`} />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={medicine.metaTitle} />
        <meta name="twitter:description" content={medicine.metaDescription} />
      </Head>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Legal Disclaimers */}
        <LegalDisclaimerBanner pageType="medicine" className="mb-6" />

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-text-subtle-light dark:text-text-subtle-dark mb-6">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link href="/health" className="hover:text-primary">Health</Link>
          <span>/</span>
          <span className="text-text-light dark:text-text-dark">Medicines</span>
          <span>/</span>
          <span className="text-text-light dark:text-text-dark">{displayName}</span>
        </nav>

        {/* Main Content */}
        <article>
          {/* Header */}
          <header className="mb-8">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-text-light dark:text-text-dark mb-2">
                  {displayName}
                </h1>
                {medicine.genericName && medicine.brandName && (
                  <p className="text-text-subtle-light dark:text-text-subtle-dark">
                    Generic: {medicine.genericName}
                  </p>
                )}
                {medicine.alternativeNames.length > 2 && (
                  <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark mt-1">
                    Also known as: {medicine.alternativeNames.slice(2, 5).join(', ')}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  medicine.marketStatus === 'prescription' 
                    ? 'bg-blue-500 text-white' 
                    : medicine.marketStatus === 'otc'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-500 text-white'
                }`}>
                  {medicine.marketStatus === 'prescription' ? 'Rx' : 'OTC'}
                </span>
                {medicine.scheduleClass && (
                  <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded text-xs">
                    Schedule {medicine.scheduleClass}
                  </span>
                )}
              </div>
            </div>

            {/* Source badges */}
            <div className="flex gap-2">
              {medicine.sources.openFDA && (
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-xs flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">verified</span>
                  OpenFDA
                </span>
              )}
              {medicine.sources.rxNorm && (
                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded text-xs flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">verified</span>
                  RxNorm
                </span>
              )}
            </div>
          </header>

          {/* Quick Info Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-card-dark rounded-lg p-4 border border-border-light dark:border-border-dark text-center">
              <span className="material-symbols-outlined text-2xl text-blue-500 mb-1">medication</span>
              <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark">Class</p>
              <p className="font-semibold text-text-light dark:text-text-dark text-sm">
                {medicine.drugClass?.[0] || 'N/A'}
              </p>
            </div>
            <div className="bg-white dark:bg-card-dark rounded-lg p-4 border border-border-light dark:border-border-dark text-center">
              <span className="material-symbols-outlined text-2xl text-green-500 mb-1">local_pharmacy</span>
              <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark">Form</p>
              <p className="font-semibold text-text-light dark:text-text-dark text-sm">
                {medicine.dosageForms?.[0] || 'N/A'}
              </p>
            </div>
            <div className="bg-white dark:bg-card-dark rounded-lg p-4 border border-border-light dark:border-border-dark text-center">
              <span className="material-symbols-outlined text-2xl text-purple-500 mb-1">science</span>
              <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark">Route</p>
              <p className="font-semibold text-text-light dark:text-text-dark text-sm capitalize">
                {medicine.routesOfAdministration?.[0] || 'N/A'}
              </p>
            </div>
            <div className="bg-white dark:bg-card-dark rounded-lg p-4 border border-border-light dark:border-border-dark text-center">
              <span className="material-symbols-outlined text-2xl text-orange-500 mb-1">business</span>
              <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark">Manufacturer</p>
              <p className="font-semibold text-text-light dark:text-text-dark text-sm truncate">
                {medicine.manufacturer?.name || 'N/A'}
              </p>
            </div>
          </div>

          {/* Active Ingredients */}
          {medicine.activeIngredients && medicine.activeIngredients.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-text-light dark:text-text-dark mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-500">science</span>
                Active Ingredients
              </h2>
              <div className="bg-white dark:bg-card-dark rounded-lg border border-border-light dark:border-border-dark overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-text-light dark:text-text-dark">Ingredient</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-text-light dark:text-text-dark">Strength</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medicine.activeIngredients.map((ing, i) => (
                      <tr key={i} className="border-t border-border-light dark:border-border-dark">
                        <td className="px-4 py-2 text-sm text-text-subtle-light dark:text-text-subtle-dark">{ing.name}</td>
                        <td className="px-4 py-2 text-sm text-text-subtle-light dark:text-text-subtle-dark">
                          {ing.strength} {ing.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Indications & Usage */}
          {medicine.label?.indicationsAndUsage && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-text-light dark:text-text-dark mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-green-500">healing</span>
                Indications & Usage
              </h2>
              <div className="bg-white dark:bg-card-dark rounded-lg p-4 border border-border-light dark:border-border-dark">
                <p className="text-text-subtle-light dark:text-text-subtle-dark whitespace-pre-line">
                  {medicine.label.indicationsAndUsage}
                </p>
              </div>
            </section>
          )}

          {/* Dosage & Administration */}
          {medicine.label?.dosageAndAdministration && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-text-light dark:text-text-dark mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-500">schedule</span>
                Dosage & Administration
              </h2>
              <div className="bg-white dark:bg-card-dark rounded-lg p-4 border border-border-light dark:border-border-dark">
                <p className="text-text-subtle-light dark:text-text-subtle-dark whitespace-pre-line">
                  {medicine.label.dosageAndAdministration}
                </p>
              </div>
            </section>
          )}

          {/* Warnings */}
          {medicine.label?.warnings && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-text-light dark:text-text-dark mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-orange-500">warning</span>
                Warnings
              </h2>
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                <p className="text-orange-800 dark:text-orange-300 whitespace-pre-line">
                  {medicine.label.warnings}
                </p>
              </div>
            </section>
          )}

          {/* Adverse Reactions */}
          {medicine.label?.adverseReactions && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-text-light dark:text-text-dark mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-red-500">report</span>
                Adverse Reactions
              </h2>
              <div className="bg-white dark:bg-card-dark rounded-lg p-4 border border-border-light dark:border-border-dark">
                <p className="text-text-subtle-light dark:text-text-subtle-dark whitespace-pre-line">
                  {medicine.label.adverseReactions}
                </p>
              </div>
            </section>
          )}

          {/* Contraindications */}
          {medicine.label?.contraindications && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-text-light dark:text-text-dark mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-red-500">block</span>
                Contraindications
              </h2>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                <p className="text-red-800 dark:text-red-300 whitespace-pre-line">
                  {medicine.label.contraindications}
                </p>
              </div>
            </section>
          )}

          {/* Drug Interactions */}
          {medicine.label?.drugInteractions && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-text-light dark:text-text-dark mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-500">compare_arrows</span>
                Drug Interactions
              </h2>
              <div className="bg-white dark:bg-card-dark rounded-lg p-4 border border-border-light dark:border-border-dark">
                <p className="text-text-subtle-light dark:text-text-subtle-dark whitespace-pre-line">
                  {medicine.label.drugInteractions}
                </p>
              </div>
            </section>
          )}

          {/* NDC Codes */}
          {medicine.ndcCodes && medicine.ndcCodes.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-text-light dark:text-text-dark mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-gray-500">qr_code_2</span>
                NDC Codes
              </h2>
              <div className="flex flex-wrap gap-2">
                {medicine.ndcCodes.slice(0, 10).map((ndc) => (
                  <span
                    key={ndc}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-xs font-mono"
                  >
                    {ndc}
                  </span>
                ))}
                {medicine.ndcCodes.length > 10 && (
                  <span className="px-2 py-1 text-gray-500 text-xs">
                    +{medicine.ndcCodes.length - 10} more
                  </span>
                )}
              </div>
            </section>
          )}

          {/* Data Source Info */}
          <section className="mb-8">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <h4 className="font-semibold text-text-light dark:text-text-dark mb-2">Data Sources</h4>
              <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark">
                This information is sourced from the FDA&apos;s public drug database (OpenFDA) and 
                the National Library of Medicine&apos;s RxNorm API. Data was last updated on{' '}
                {new Date(medicine.lastUpdated).toLocaleDateString()}.
              </p>
              {medicine.rxcui && (
                <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark mt-2">
                  RxNorm CUI: {medicine.rxcui}
                </p>
              )}
            </div>
          </section>
        </article>

        {/* Bottom Disclaimers */}
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

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps<MedicinePageProps> = async ({ params }) => {
  const slug = params?.slug as string;

  if (!slug) {
    return {
      props: { medicine: null, error: 'Invalid slug' },
      revalidate: 60,
    };
  }

  try {
    // Convert slug to drug name (replace hyphens with spaces)
    const drugName = slug.replace(/-/g, ' ');
    
    const response = await fetch(`${API_BASE_URL}/api/medicine/${encodeURIComponent(drugName)}`);
    const result = await response.json();

    if (!result.success || !result.data) {
      return {
        props: { medicine: null, error: 'Medicine not found in FDA database' },
        revalidate: 60,
      };
    }

    return {
      props: {
        medicine: result.data,
      },
      revalidate: 86400, // Revalidate daily (medicine data changes less frequently)
    };
  } catch (error) {
    console.error('Failed to fetch medicine:', error);
    return {
      props: { medicine: null, error: 'Failed to load medicine data' },
      revalidate: 60,
    };
  }
};
