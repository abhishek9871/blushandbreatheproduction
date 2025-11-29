/**
 * Medicine/Drug Information Page
 * 
 * Dynamic page for displaying pharmaceutical drug information from OpenFDA/RxNorm.
 * Uses ISR (Incremental Static Regeneration) for optimal SEO and performance.
 * 
 * Route: /medicine/[slug]
 * Example: /medicine/modafinil, /medicine/acetaminophen
 */

import React, { useState } from 'react';
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
  formattedLastUpdated?: string;
}

// FAQ data generator based on medicine info
const generateFAQs = (medicine: MedicineInfo) => {
  const displayName = medicine.brandName || medicine.genericName;
  return [
    {
      question: `What is ${displayName} used for?`,
      answer: medicine.label?.indicationsAndUsage 
        ? `${displayName} is ${medicine.label.indicationsAndUsage.substring(0, 300)}...`
        : `${displayName} is a medication in the ${medicine.drugClass?.[0] || 'pharmaceutical'} class. Please consult your healthcare provider for specific uses.`
    },
    {
      question: `Is ${displayName} safe?`,
      answer: `${displayName} is FDA-approved when used as directed. Like all medications, it may have side effects. Always follow your healthcare provider's instructions and report any adverse reactions.`
    },
    {
      question: `Can I buy ${displayName} without a prescription?`,
      answer: medicine.marketStatus === 'otc' 
        ? `${displayName} is available over-the-counter (OTC) and does not require a prescription in the United States.`
        : `${displayName} requires a valid prescription from a licensed healthcare provider in the United States.`
    },
    {
      question: `What are the side effects of ${displayName}?`,
      answer: medicine.label?.adverseReactions 
        ? `Common side effects may include those listed in the Adverse Reactions section above. If you experience severe side effects, seek medical attention immediately.`
        : `Side effects vary by individual. Consult the full prescribing information or ask your pharmacist about potential side effects.`
    },
    {
      question: `Can I take ${displayName} with other medications?`,
      answer: `Drug interactions are possible. Always inform your healthcare provider about all medications, supplements, and vitamins you are taking. Check the Drug Interactions section above for known interactions.`
    }
  ];
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// ═══════════════════════════════════════════════════════════════════
// INDIAN MEDICINES DATABASE - Local dataset (250K+ medicines)
// ═══════════════════════════════════════════════════════════════════
import indianMedicinesData from '@/data/indian-medicines-sample.json';

// Optimized field names for smaller file size
interface IndianMedicineOptimized {
  i: string;      // id
  n: string;      // name
  b: string;      // baseName
  p: number;      // price
  m: string;      // manufacturer
  t: string;      // type
  k: string;      // packSize
  c1: string;     // composition1
  c2?: string;    // composition2
  d?: boolean;    // isDiscontinued
  u?: string[];   // uses
  se?: string[];  // sideEffects
  su?: string[];  // substitutes
  tc?: string;    // therapeuticClass
  hf?: boolean;   // habitForming
}

// Full interface for internal use
interface IndianMedicine {
  id: string;
  name: string;
  baseName: string;
  price: number;
  manufacturer: string;
  type: string;
  packSize: string;
  composition1: string;
  composition2: string;
  isDiscontinued: boolean;
  uses?: string[];
  sideEffects?: string[];
  substitutes?: string[];
  therapeuticClass?: string;
  habitForming?: boolean;
}

// Convert optimized format to full format
function expandMedicine(opt: IndianMedicineOptimized): IndianMedicine {
  return {
    id: opt.i,
    name: opt.n,
    baseName: opt.b,
    price: opt.p,
    manufacturer: opt.m,
    type: opt.t,
    packSize: opt.k,
    composition1: opt.c1,
    composition2: opt.c2 || '',
    isDiscontinued: opt.d || false,
    uses: opt.u || [],
    sideEffects: opt.se || [],
    substitutes: opt.su || [],
    therapeuticClass: opt.tc || '',
    habitForming: opt.hf || false,
  };
}

const indianMedicines: IndianMedicine[] = indianMedicinesData as IndianMedicine[];

// Search Indian medicines - Local sample first, then API for full 254K database
function searchIndianMedicineLocal(searchTerm: string): IndianMedicine | null {
  const normalized = searchTerm.toLowerCase().trim();
  
  // Exact match on base name first
  let match = indianMedicines.find(m => 
    m.baseName.toLowerCase() === normalized ||
    m.name.toLowerCase() === normalized
  );
  
  if (match) return match;
  
  // Partial match on name
  match = indianMedicines.find(m => 
    m.name.toLowerCase().includes(normalized) ||
    m.baseName.toLowerCase().includes(normalized)
  );
  
  if (match) return match;
  
  // Match on composition
  match = indianMedicines.find(m => {
    const comp1 = m.composition1.toLowerCase().replace(/\([^)]+\)/g, '').trim();
    return comp1.includes(normalized) || normalized.includes(comp1.split(' ')[0]);
  });
  
  return match || null;
}

// Search full Indian medicines database (254K medicines) - reads from optimized JSON file
async function searchIndianMedicineFullDB(searchTerm: string): Promise<IndianMedicine | null> {
  try {
    // Import fs and path for server-side file reading
    const fs = await import('fs');
    const path = await import('path');
    
    const filePath = path.join(process.cwd(), 'data', 'indian-medicines.json');
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log('Full Indian medicines database not found');
      return null;
    }
    
    const data = fs.readFileSync(filePath, 'utf-8');
    const allMedicinesOptimized: IndianMedicineOptimized[] = JSON.parse(data);
    
    const normalized = searchTerm.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    
    // Exact match on base name first
    let match = allMedicinesOptimized.find(m => 
      m.b.toLowerCase().replace(/[^a-z0-9]/g, '') === normalized ||
      m.n.toLowerCase().replace(/[^a-z0-9]/g, '') === normalized
    );
    
    if (match) return expandMedicine(match);
    
    // Partial match on name
    match = allMedicinesOptimized.find(m => 
      m.n.toLowerCase().replace(/[^a-z0-9]/g, '').includes(normalized) ||
      m.b.toLowerCase().replace(/[^a-z0-9]/g, '').includes(normalized)
    );
    
    if (match) return expandMedicine(match);
    
    // Match on composition
    match = allMedicinesOptimized.find(m => {
      const comp1 = m.c1.toLowerCase().replace(/[^a-z0-9]/g, '');
      return comp1.includes(normalized);
    });
    
    return match ? expandMedicine(match) : null;
  } catch (error) {
    console.error('Indian medicine search error:', error);
    return null;
  }
}

// Convert Indian medicine to MedicineInfo format
function convertIndianMedicineToInfo(med: IndianMedicine): MedicineInfo {
  const composition = [med.composition1, med.composition2].filter(Boolean).join(' + ');
  
  // Build uses text from enriched data
  const usesText = med.uses && med.uses.length > 0
    ? med.uses.map(u => `• ${u}`).join('\n')
    : `${med.name} contains ${composition}. Consult your healthcare provider for specific uses.`;
  
  // Build side effects text from enriched data
  const sideEffectsText = med.sideEffects && med.sideEffects.length > 0
    ? med.sideEffects.map(s => `• ${s}`).join('\n')
    : 'Side effects vary. Consult prescribing information or your healthcare provider.';
  
  // Build substitutes text
  const substitutesText = med.substitutes && med.substitutes.length > 0
    ? `Alternative medicines: ${med.substitutes.slice(0, 5).join(', ')}`
    : '';
  
  // Drug class from therapeutic class if available
  const drugClass = med.therapeuticClass 
    ? [med.therapeuticClass]
    : [med.type.charAt(0).toUpperCase() + med.type.slice(1)];
  
  return {
    id: `indian-${med.id}`,
    slug: med.baseName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    
    brandName: med.name,
    genericName: med.composition1.replace(/\([^)]+\)/g, '').trim(),
    alternativeNames: med.substitutes || [],
    
    drugClass: drugClass,
    pharmacologicClass: [],
    
    activeIngredients: [{
      name: med.composition1.replace(/\([^)]+\)/g, '').trim(),
      strength: med.composition1.match(/\(([^)]+)\)/)?.[1] || '',
      unit: ''
    }],
    inactiveIngredients: [],
    
    dosageForms: [med.packSize],
    routesOfAdministration: ['Oral'],
    
    manufacturer: {
      name: med.manufacturer,
    },
    ndcCodes: [],
    
    label: {
      indicationsAndUsage: usesText,
      dosageAndAdministration: `Consult your healthcare provider for proper dosage. This medicine is available as ${med.packSize}.${med.habitForming ? '\n\n⚠️ This medicine may be habit-forming. Use only as directed by your doctor.' : ''}`,
      warnings: med.habitForming 
        ? '⚠️ HABIT FORMING: This medicine may cause dependence. Use only as directed by your healthcare provider. Do not exceed recommended dose.'
        : 'This medicine information is from the Indian pharmaceutical database. Always consult a qualified healthcare provider before use.',
      adverseReactions: sideEffectsText,
      drugInteractions: substitutesText ? `${substitutesText}\n\nConsult prescribing information for drug interactions.` : 'Consult prescribing information for drug interactions.',
      contraindications: 'Consult prescribing information for contraindications.',
      overdosage: '',
      clinicalPharmacology: `Active composition: ${composition}`,
    },
    
    pillImages: [],
    
    fdaApplicationNumber: undefined,
    approvalDate: undefined,
    marketStatus: med.habitForming ? 'prescription' : 'prescription',
    
    rxcui: undefined,
    rxnormSynonyms: med.substitutes || [],
    
    metaTitle: `${med.name} - Uses, Side Effects, Price ₹${med.price} | MediVault`,
    metaDescription: `${med.name} by ${med.manufacturer}. ${med.uses?.[0] || `Contains ${composition}`}. Price: ₹${med.price}. Side effects, substitutes & more.`,
    keywords: [med.baseName.toLowerCase(), med.manufacturer.toLowerCase(), 'india', 'medicine', composition.toLowerCase(), ...(med.uses || []).map(u => u.toLowerCase())].filter(Boolean),
    
    // Custom fields for Indian medicines
    indianPrice: med.price,
    indianPackSize: med.packSize,
    
    sources: {
      openFDA: false,
      rxNorm: false,
      dailyMed: false,
      pubChem: false,
      indianDatabase: true,
    },
    
    lastUpdated: new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
  };
}

export default function MedicinePage({ medicine, error, formattedLastUpdated }: MedicinePageProps) {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  
  // Fetch interactions client-side if RxCUI is available
  const { data: interactions, loading: interactionsLoading } = useDrugInteractions(
    medicine?.genericName || medicine?.brandName,
    undefined // Second drug - not provided for single drug lookup
  );

  // Generate FAQs for this medicine (only if medicine exists)
  const faqs = medicine ? generateFAQs(medicine) : [];

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
        <link rel="canonical" href={`https://www.blushandbreath.com/medicine/${medicine.slug}`} />
        
        {/* Open Graph */}
        <meta property="og:title" content={medicine.metaTitle} />
        <meta property="og:description" content={medicine.metaDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://www.blushandbreath.com/medicine/${medicine.slug}`} />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={medicine.metaTitle} />
        <meta name="twitter:description" content={medicine.metaDescription} />
      </Head>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-text-subtle-light dark:text-text-subtle-dark mb-6">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link href="/medicines" className="hover:text-primary flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">local_pharmacy</span>
            MediVault
          </Link>
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
                    : medicine.marketStatus === 'research'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-500 text-white'
                }`}>
                  {medicine.marketStatus === 'prescription' ? 'Rx' : medicine.marketStatus === 'otc' ? 'OTC' : medicine.marketStatus === 'research' ? 'Research' : medicine.marketStatus}
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
              {medicine.sources.pubChem && (
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded text-xs flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">science</span>
                  PubChem (NIH)
                </span>
              )}
              {medicine.sources.drugCentral && (
                <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded text-xs flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">local_hospital</span>
                  DrugCentral
                </span>
              )}
              {medicine.sources.wikipedia && (
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 rounded text-xs flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">menu_book</span>
                  Wikipedia
                </span>
              )}
              {medicine.sources.myUpchar && (
                <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded text-xs flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">flag</span>
                  India (myUpchar)
                </span>
              )}
              {medicine.sources.indianDatabase && (
                <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded text-xs flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">flag</span>
                  🇮🇳 India
                </span>
              )}
              {medicine.indianPrice && (
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded text-xs flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">currency_rupee</span>
                  ₹{medicine.indianPrice}
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

          {/* Legal Status by Country */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text-light dark:text-text-dark mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-500">gavel</span>
              Legal Status by Country
            </h2>
            <div className="bg-white dark:bg-card-dark rounded-lg border border-border-light dark:border-border-dark overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-text-light dark:text-text-dark">Country</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-text-light dark:text-text-dark">Legal Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-text-light dark:text-text-dark">Prescription</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-text-light dark:text-text-dark">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light dark:divide-border-dark">
                    <tr>
                      <td className="px-4 py-3 text-sm text-text-subtle-light dark:text-text-subtle-dark">United States</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          medicine.marketStatus === 'otc' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        }`}>
                          {medicine.marketStatus === 'otc' ? 'OTC' : 'Varies'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-text-subtle-light dark:text-text-subtle-dark">
                        {medicine.marketStatus === 'otc' ? 'No' : 'Check FDA'}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-subtle-light dark:text-text-subtle-dark">
                        Consult healthcare provider
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-border-light dark:border-border-dark">
                <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">info</span>
                  Legal status may change. Always verify with local authorities before traveling internationally with medication.
                </p>
              </div>
            </div>
          </section>

          {/* Scientific References */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text-light dark:text-text-dark mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-500">science</span>
              Scientific References
            </h2>
            <div className="bg-white dark:bg-card-dark rounded-lg p-4 border border-border-light dark:border-border-dark">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-blue-500 text-lg flex-shrink-0">verified</span>
                  <div>
                    <p className="font-medium text-text-light dark:text-text-dark">FDA Drug Label</p>
                    <a
                      href={`https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=${encodeURIComponent(displayName)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-medical-blue dark:text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      View on DailyMed
                      <span className="material-symbols-outlined text-xs">open_in_new</span>
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-green-500 text-lg flex-shrink-0">article</span>
                  <div>
                    <p className="font-medium text-text-light dark:text-text-dark">PubMed Research</p>
                    <a
                      href={`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(medicine.genericName || displayName)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-medical-blue dark:text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      Search PubMed for studies
                      <span className="material-symbols-outlined text-xs">open_in_new</span>
                    </a>
                  </div>
                </li>
              </ul>
            </div>
          </section>

          {/* FAQ Section with Schema.org markup */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text-light dark:text-text-dark mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-500">help</span>
              Frequently Asked Questions
            </h2>
            <div className="space-y-3" itemScope itemType="https://schema.org/FAQPage">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-card-dark rounded-lg border border-border-light dark:border-border-dark overflow-hidden"
                  itemScope
                  itemProp="mainEntity"
                  itemType="https://schema.org/Question"
                >
                  <button
                    onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <span className="font-medium text-text-light dark:text-text-dark pr-4" itemProp="name">
                      {faq.question}
                    </span>
                    <span className={`material-symbols-outlined text-gray-400 transition-transform ${
                      expandedFAQ === index ? 'rotate-180' : ''
                    }`}>
                      expand_more
                    </span>
                  </button>
                  {expandedFAQ === index && (
                    <div 
                      className="px-4 pb-4 border-t border-border-light dark:border-border-dark"
                      itemScope
                      itemProp="acceptedAnswer"
                      itemType="https://schema.org/Answer"
                    >
                      <p className="pt-3 text-text-subtle-light dark:text-text-subtle-dark" itemProp="text">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Data Source Info */}
          <section className="mb-8">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <h4 className="font-semibold text-text-light dark:text-text-dark mb-2">Data Sources</h4>
              <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark">
                This information is sourced from the FDA&apos;s public drug database (OpenFDA) and 
                the National Library of Medicine&apos;s RxNorm API. Data was last updated on{' '}
                {formattedLastUpdated || 'recently'}.
              </p>
              {medicine.rxcui && (
                <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark mt-2">
                  RxNorm CUI: {medicine.rxcui}
                </p>
              )}
            </div>
          </section>

          {/* FDA Disclaimer */}
          <section className="mb-8">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-blue-500 flex-shrink-0">info</span>
                <div>
                  <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-1">FDA Disclaimer</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    This information is for educational purposes only and is not intended as medical advice. 
                    Always consult a healthcare professional before starting, stopping, or changing any medication. 
                    The information provided may not cover all possible uses, actions, precautions, side effects, 
                    or interactions.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </article>

        {/* Legal Disclaimers - Moved to bottom */}
        <LegalDisclaimerBanner pageType="medicine" className="mt-8" />
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

// ═══════════════════════════════════════════════════════════════════
// BRAND NAME MAPPING - Maps regional brand names to generic INN names
// ═══════════════════════════════════════════════════════════════════
const brandNameMappings: Record<string, string> = {
  // Modafinil brands
  'r-mod': 'modafinil',
  'r mod': 'modafinil',
  'provigil': 'modafinil',
  'modiodal': 'modafinil',
  'modalert': 'modafinil',
  'modvigil': 'modafinil',
  'alertec': 'modafinil',
  'modapro': 'modafinil',
  // Piracetam brands
  'nootropil': 'piracetam',
  'nootropyl': 'piracetam',
  'noopreman': 'piracetam',
  // Phenylpiracetam brands
  'phenotropil': 'phenylpiracetam',
  'carphedon': 'phenylpiracetam',
  'fonturacetam': 'phenylpiracetam',
  // Aniracetam brands
  'draganon': 'aniracetam',
  'sarpul': 'aniracetam',
  'ampamet': 'aniracetam',
  // Vinpocetine brands
  'cavinton': 'vinpocetine',
  'intelectol': 'vinpocetine',
  // Other common mappings
  'nuvigil': 'armodafinil',
  'waklert': 'armodafinil',
  
  // ═══════════════════════════════════════════════════════════════════
  // INTERNATIONAL TO US NAME MAPPINGS
  // ═══════════════════════════════════════════════════════════════════
  'paracetamol': 'acetaminophen', // International → US name
  'salbutamol': 'albuterol', // International → US name
  'adrenaline': 'epinephrine', // International → US name
  
  // ═══════════════════════════════════════════════════════════════════
  // INDIAN BRAND NAMES - Popular Indian pharmaceutical brands
  // ═══════════════════════════════════════════════════════════════════
  // Paracetamol/Acetaminophen brands (India)
  'crocin': 'acetaminophen',
  'dolo': 'acetaminophen',
  'dolo 650': 'acetaminophen',
  'calpol': 'acetaminophen',
  'pacimol': 'acetaminophen',
  'metacin': 'acetaminophen',
  'pyrigesic': 'acetaminophen',
  'fepanil': 'acetaminophen',
  // Ibuprofen brands (India)
  'brufen': 'ibuprofen',
  'ibugesic': 'ibuprofen',
  'combiflam': 'ibuprofen',
  // Aspirin brands (India)
  'disprin': 'aspirin',
  'ecosprin': 'aspirin',
  // Omeprazole brands (India)
  'omez': 'omeprazole',
  'ocid': 'omeprazole',
  // Pantoprazole brands (India)
  'pan': 'pantoprazole',
  'pan 40': 'pantoprazole',
  'pantop': 'pantoprazole',
  'pantocid': 'pantocid',
  // Azithromycin brands (India)
  'azee': 'azithromycin',
  'azithral': 'azithromycin',
  'zithromax': 'azithromycin',
  // Amoxicillin brands (India)
  'mox': 'amoxicillin',
  'novamox': 'amoxicillin',
  // Cetirizine brands (India)
  'cetzine': 'cetirizine',
  'zyrtec': 'cetirizine',
  'alerid': 'cetirizine',
  'okacet': 'cetirizine',
  // Metformin brands (India)
  'glycomet': 'metformin',
  'glucophage': 'metformin',
  // Atorvastatin brands (India)
  'atorva': 'atorvastatin',
  'lipitor': 'atorvastatin',
  'tonact': 'atorvastatin',
  // Amlodipine brands (India)
  'amlong': 'amlodipine',
  'amlip': 'amlodipine',
  'stamlo': 'amlodipine',
  // Telmisartan brands (India)
  'telma': 'telmisartan',
  'telmikind': 'telmisartan',
  // Montelukast brands (India)
  'montair': 'montelukast',
  'montek': 'montelukast',
  // Levothyroxine brands (India)
  'thyronorm': 'levothyroxine',
  'eltroxin': 'levothyroxine',
  // Vitamin D brands (India)
  'd3 must': 'cholecalciferol',
  'calcirol': 'cholecalciferol',
  'uprise d3': 'cholecalciferol',
  // Multivitamin brands (India)
  'zincovit': 'multivitamin',
  'becosules': 'multivitamin',
  'supradyn': 'multivitamin',
  // Other popular Indian brands
  'shelcal': 'calcium carbonate',
  'limcee': 'vitamin c',
  'allegra': 'fexofenadine',
  'sinarest': 'acetaminophen',
  'vicks action 500': 'acetaminophen',
  'saridon': 'acetaminophen',
  'volini': 'diclofenac',
  'voveran': 'diclofenac',
  'flexon': 'ibuprofen',
};

// ═══════════════════════════════════════════════════════════════════
// MyChem.info API (DrugCentral wrapper) - International drugs & nootropics
// ═══════════════════════════════════════════════════════════════════
async function fetchFromMyChem(drugName: string): Promise<MedicineInfo | null> {
  try {
    // First check if this is a brand name that needs mapping
    const normalizedName = drugName.toLowerCase().trim();
    const genericName = brandNameMappings[normalizedName] || drugName;
    
    const encodedName = encodeURIComponent(genericName);
    const url = `https://mychem.info/v1/query?q=${encodedName}&fields=drugcentral,drugbank,chembl,pubchem`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MediVault/1.0 (HealthBeauty Hub Medicine Encyclopedia)'
      }
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    if (!data.hits || data.hits.length === 0) {
      return null;
    }
    
    const hit = data.hits[0];
    const dc = hit.drugcentral || {};
    const drugbank = hit.drugbank || {};
    const chembl = hit.chembl || {};
    const pubchem = hit.pubchem || {};
    
    // Check if we have meaningful data
    if (!dc.name && !drugbank.name && !chembl.pref_name) {
      return null;
    }
    
    // Build synonyms list
    const synonyms: string[] = [];
    if (dc.synonyms) synonyms.push(...(Array.isArray(dc.synonyms) ? dc.synonyms : [dc.synonyms]));
    if (drugbank.synonyms) synonyms.push(...(Array.isArray(drugbank.synonyms) ? drugbank.synonyms : [drugbank.synonyms]));
    const uniqueSynonyms = [...new Set(synonyms)].slice(0, 15);
    
    // Determine approval status
    const approvalCountries = dc.approval_country || [];
    const fdaApproved = approvalCountries.some((c: string) => c?.includes('FDA') || c?.includes('US'));
    const emaApproved = approvalCountries.some((c: string) => c?.includes('EMA') || c?.includes('Europe'));
    const russiaApproved = approvalCountries.some((c: string) => c?.includes('Russia'));
    
    // Get mechanism of action
    const mechanism = dc.mechanism_of_action || drugbank.mechanism_of_action || '';
    
    // Get indications
    const indications = dc.indication || [];
    const indicationText = Array.isArray(indications) 
      ? indications.map((ind: any) => ind.indication_class || ind.indication || ind).filter(Boolean).join('. ')
      : (indications || '');
    
    // Get pharmacology class
    const pharmaClass = dc.pharmacology_class || drugbank.pharmacology_class || [];
    const pharmaClassArray = Array.isArray(pharmaClass) ? pharmaClass : [pharmaClass].filter(Boolean);
    
    // Build drug interactions text
    const ddiList = dc.ddi || [];
    const interactionsText = Array.isArray(ddiList) && ddiList.length > 0
      ? ddiList.slice(0, 10).map((ddi: any) => 
          `• ${ddi.drug_name || 'Unknown'}: ${ddi.description || ddi.interaction_description || 'Interaction reported'}`
        ).join('\n')
      : 'Drug interaction data available via DrugCentral. Consult a healthcare professional.';
    
    // Get adverse events summary
    const faers = dc.faers_adverse_events || {};
    const adverseText = faers.total_count 
      ? `Based on FDA FAERS data: ${faers.total_count} adverse event reports, including ${faers.serious_count || 0} serious reports.`
      : 'Adverse event data available. Consult prescribing information.';
    
    // Determine market status
    let marketStatus: 'prescription' | 'otc' | 'discontinued' | 'recalled' | 'research' = 'research';
    if (fdaApproved) marketStatus = 'prescription';
    else if (emaApproved || russiaApproved) marketStatus = 'prescription';
    
    const mychemMedicine: MedicineInfo = {
      id: `mychem-${hit._id || genericName}`,
      slug: genericName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      
      brandName: uniqueSynonyms[0] || '',
      genericName: dc.name || drugbank.name || chembl.pref_name || genericName,
      alternativeNames: uniqueSynonyms,
      
      drugClass: pharmaClassArray.length > 0 ? pharmaClassArray : ['Drug (DrugCentral)'],
      pharmacologicClass: pharmaClassArray,
      
      activeIngredients: [{
        name: dc.name || drugbank.name || genericName,
        strength: '',
        unit: ''
      }],
      inactiveIngredients: [],
      
      dosageForms: drugbank.dosages ? [drugbank.dosages] : [],
      routesOfAdministration: drugbank.route ? [drugbank.route] : ['Oral'],
      
      manufacturer: {
        name: 'Various manufacturers',
      },
      ndcCodes: [],
      
      label: {
        indicationsAndUsage: indicationText || `${genericName} is a pharmaceutical compound. ${mechanism ? `Mechanism: ${mechanism}` : ''}`,
        dosageAndAdministration: drugbank.dosages || 'Dosage varies by indication. Consult prescribing information or healthcare provider.',
        warnings: `${!fdaApproved ? 'Note: This drug may not be FDA-approved in the United States. ' : ''}Always consult a qualified healthcare provider before use.`,
        adverseReactions: adverseText,
        drugInteractions: interactionsText,
        contraindications: drugbank.contraindications || 'Consult prescribing information for contraindications.',
        overdosage: '',
        clinicalPharmacology: mechanism || 'Pharmacology data available via DrugCentral database.',
      },
      
      pillImages: [],
      
      fdaApplicationNumber: undefined,
      approvalDate: undefined,
      marketStatus,
      
      rxcui: undefined,
      rxnormSynonyms: uniqueSynonyms,
      
      metaTitle: `${dc.name || genericName} - Drug Information | MediVault`,
      metaDescription: `${dc.name || genericName} drug information including mechanism, indications, side effects. ${fdaApproved ? 'FDA approved.' : emaApproved ? 'EMA approved.' : russiaApproved ? 'Approved in Russia.' : ''}`,
      keywords: [genericName.toLowerCase(), 'drug', 'medicine', ...(pharmaClassArray.map((c: string) => c.toLowerCase()))],
      
      sources: {
        openFDA: false,
        rxNorm: false,
        dailyMed: false,
        pubChem: false,
        drugCentral: true,
      },
      
      lastUpdated: new Date().toISOString(),
      fetchedAt: new Date().toISOString(),
    };
    
    return mychemMedicine;
  } catch (error) {
    console.error('MyChem.info fetch error:', error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// Wikipedia API - Rich descriptions and pharmacology details
// ═══════════════════════════════════════════════════════════════════
async function fetchWikipediaData(drugName: string): Promise<{
  extract: string;
  infobox: Record<string, string>;
} | null> {
  try {
    // First check brand name mapping
    const normalizedName = drugName.toLowerCase().trim();
    const genericName = brandNameMappings[normalizedName] || drugName;
    
    const encodedName = encodeURIComponent(genericName);
    
    // Fetch article extract (introduction)
    const extractUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&titles=${encodedName}&prop=extracts&explaintext=1&exintro=1&exchars=1500&redirects=1&origin=*`;
    
    const extractResponse = await fetch(extractUrl, {
      headers: {
        'User-Agent': 'MediVault/1.0 (HealthBeauty Hub Medicine Encyclopedia)'
      }
    });
    
    if (!extractResponse.ok) {
      return null;
    }
    
    const extractData = await extractResponse.json();
    const pages = extractData.query?.pages || {};
    const pageId = Object.keys(pages)[0];
    
    if (!pageId || pages[pageId].missing) {
      return null;
    }
    
    const extract = pages[pageId].extract || '';
    
    // Fetch wikitext to parse infobox
    const wikitextUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&titles=${encodedName}&prop=revisions&rvprop=content&rvsection=0&redirects=1&origin=*`;
    
    const wikitextResponse = await fetch(wikitextUrl, {
      headers: {
        'User-Agent': 'MediVault/1.0 (HealthBeauty Hub Medicine Encyclopedia)'
      }
    });
    
    let infobox: Record<string, string> = {};
    
    if (wikitextResponse.ok) {
      const wikitextData = await wikitextResponse.json();
      const wikiPages = wikitextData.query?.pages || {};
      const wikiPageId = Object.keys(wikiPages)[0];
      const wikitext = wikiPages[wikiPageId]?.revisions?.[0]?.['*'] || '';
      
      // Parse infobox parameters
      const paramRegex = /\|\s*(\w+)\s*=\s*([^\n|]+?)(?=\n\s*\||\n\}|\}\})/g;
      let match;
      
      while ((match = paramRegex.exec(wikitext)) !== null) {
        const key = match[1].trim().toLowerCase();
        let value = match[2].trim()
          .replace(/\[\[([^\]|]+)\|?([^\]]*)\]\]/g, '$2$1') // Handle wiki links
          .replace(/\{\{[^}]+\}\}/g, '') // Remove templates
          .replace(/<[^>]+>/g, '') // Remove HTML tags
          .trim();
        
        if (value) {
          infobox[key] = value;
        }
      }
    }
    
    return { extract, infobox };
  } catch (error) {
    console.error('Wikipedia fetch error:', error);
    return null;
  }
}

// Helper to enrich medicine data with Wikipedia content
function enrichWithWikipedia(medicine: MedicineInfo, wikiData: { extract: string; infobox: Record<string, string> }): MedicineInfo {
  const { extract, infobox } = wikiData;
  
  // Enrich indications with Wikipedia extract if sparse
  if (medicine.label.indicationsAndUsage.length < 100 && extract.length > 50) {
    medicine.label.indicationsAndUsage = extract;
  }
  
  // Add pharmacokinetics from infobox
  const pkDetails: string[] = [];
  if (infobox.bioavailability) pkDetails.push(`Bioavailability: ${infobox.bioavailability}`);
  if (infobox.protein_bound) pkDetails.push(`Protein binding: ${infobox.protein_bound}`);
  if (infobox.metabolism) pkDetails.push(`Metabolism: ${infobox.metabolism}`);
  if (infobox.elimination_half_life) pkDetails.push(`Half-life: ${infobox.elimination_half_life}`);
  if (infobox.excretion) pkDetails.push(`Excretion: ${infobox.excretion}`);
  
  if (pkDetails.length > 0) {
    medicine.label.clinicalPharmacology = `${medicine.label.clinicalPharmacology}\n\nPharmacokinetics:\n• ${pkDetails.join('\n• ')}`;
  }
  
  // Add route of administration if available
  if (infobox.routes_of_administration && medicine.routesOfAdministration.length === 0) {
    medicine.routesOfAdministration = [infobox.routes_of_administration];
  }
  
  // Update meta description with Wikipedia extract
  if (extract.length > 50) {
    medicine.metaDescription = extract.substring(0, 155) + '...';
  }
  
  return medicine;
}

// ═══════════════════════════════════════════════════════════════════
// Wikipedia-only fallback (when MyChem also fails)
// ═══════════════════════════════════════════════════════════════════
async function fetchFromWikipediaOnly(drugName: string): Promise<MedicineInfo | null> {
  const wikiData = await fetchWikipediaData(drugName);
  
  if (!wikiData || !wikiData.extract || wikiData.extract.length < 50) {
    return null;
  }
  
  const { extract, infobox } = wikiData;
  const normalizedName = drugName.toLowerCase().trim();
  const genericName = brandNameMappings[normalizedName] || drugName;
  
  // Build synonyms from infobox trade names
  const synonyms: string[] = [];
  if (infobox.tradename) synonyms.push(...infobox.tradename.split(',').map(s => s.trim()));
  if (infobox.trade_name) synonyms.push(...infobox.trade_name.split(',').map(s => s.trim()));
  
  const wikiMedicine: MedicineInfo = {
    id: `wiki-${genericName.replace(/\s+/g, '-')}`,
    slug: genericName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    
    brandName: synonyms[0] || '',
    genericName: infobox.drug_name || infobox.inn || genericName,
    alternativeNames: synonyms.slice(0, 10),
    
    drugClass: infobox.type ? [infobox.type] : ['Drug (Wikipedia)'],
    pharmacologicClass: [],
    
    activeIngredients: [{
      name: infobox.iupac_name || genericName,
      strength: '',
      unit: ''
    }],
    inactiveIngredients: [],
    
    dosageForms: [],
    routesOfAdministration: infobox.routes_of_administration ? [infobox.routes_of_administration] : [],
    
    manufacturer: {
      name: 'Various manufacturers',
    },
    ndcCodes: [],
    
    label: {
      indicationsAndUsage: extract,
      dosageAndAdministration: 'Consult prescribing information or healthcare provider for dosage.',
      warnings: 'Information from Wikipedia. Always verify with official sources and consult a healthcare professional.',
      adverseReactions: 'See Wikipedia article for reported adverse reactions.',
      drugInteractions: 'Consult prescribing information for drug interactions.',
      contraindications: 'Consult prescribing information for contraindications.',
      overdosage: '',
      clinicalPharmacology: [
        infobox.bioavailability ? `Bioavailability: ${infobox.bioavailability}` : '',
        infobox.protein_bound ? `Protein binding: ${infobox.protein_bound}` : '',
        infobox.metabolism ? `Metabolism: ${infobox.metabolism}` : '',
        infobox.elimination_half_life ? `Half-life: ${infobox.elimination_half_life}` : '',
        infobox.excretion ? `Excretion: ${infobox.excretion}` : '',
      ].filter(Boolean).join('\n') || 'See Wikipedia article for pharmacology details.',
    },
    
    pillImages: [],
    
    fdaApplicationNumber: undefined,
    approvalDate: undefined,
    marketStatus: infobox.legal_us?.toLowerCase().includes('rx') ? 'prescription' : 'research',
    
    rxcui: undefined,
    rxnormSynonyms: synonyms,
    
    metaTitle: `${infobox.drug_name || genericName} - Drug Information | MediVault`,
    metaDescription: extract.substring(0, 155) + '...',
    keywords: [genericName.toLowerCase(), 'drug', 'medicine', 'wikipedia'],
    
    sources: {
      openFDA: false,
      rxNorm: false,
      dailyMed: false,
      pubChem: false,
      wikipedia: true,
    },
    
    lastUpdated: new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
  };
  
  return wikiMedicine;
}

// Helper function to fetch compound data from PubChem (NIH database)
// This is used as a fallback for drugs not in OpenFDA (nootropics, international drugs, etc.)
async function fetchFromPubChem(drugName: string): Promise<MedicineInfo | null> {
  try {
    const encodedName = encodeURIComponent(drugName);
    
    // Fetch description, properties, and synonyms in parallel
    const [descResponse, propsResponse, synResponse] = await Promise.all([
      fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodedName}/description/JSON`),
      fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodedName}/property/MolecularFormula,MolecularWeight,IUPACName,XLogP,HBondDonorCount,HBondAcceptorCount/JSON`),
      fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodedName}/synonyms/JSON`),
    ]);

    // Check if compound exists in PubChem
    if (!propsResponse.ok) {
      return null;
    }

    const propsData = await propsResponse.json();
    const properties = propsData?.PropertyTable?.Properties?.[0];
    
    if (!properties) {
      return null;
    }

    // Get description if available
    let description = '';
    if (descResponse.ok) {
      const descData = await descResponse.json();
      const descriptions = descData?.InformationList?.Information || [];
      // Find the first useful description
      for (const info of descriptions) {
        if (info.Description && info.Description.length > 50) {
          description = info.Description;
          break;
        }
      }
    }

    // Get synonyms if available
    let synonyms: string[] = [];
    if (synResponse.ok) {
      const synData = await synResponse.json();
      synonyms = synData?.InformationList?.Information?.[0]?.Synonym?.slice(0, 10) || [];
    }

    // Build MedicineInfo object from PubChem data
    const pubchemMedicine: MedicineInfo = {
      id: `pubchem-${properties.CID}`,
      slug: drugName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      
      brandName: '',
      genericName: drugName,
      alternativeNames: synonyms,
      
      drugClass: ['Compound (PubChem)'],
      pharmacologicClass: [],
      
      activeIngredients: [{
        name: properties.IUPACName || drugName,
        strength: '',
        unit: ''
      }],
      inactiveIngredients: [],
      
      dosageForms: [],
      routesOfAdministration: [],
      
      manufacturer: {
        name: 'Various (Research Chemical)',
      },
      ndcCodes: [],
      
      label: {
        indicationsAndUsage: description || `${drugName} is a chemical compound found in the PubChem database. Molecular Formula: ${properties.MolecularFormula}. Molecular Weight: ${properties.MolecularWeight} g/mol.`,
        dosageAndAdministration: 'Dosage information not available from PubChem. This compound may not be approved for human use. Consult a healthcare professional.',
        warnings: 'WARNING: This compound information is from PubChem (NIH chemical database) and may not be approved by the FDA for human consumption. Use at your own risk. Always consult a qualified healthcare provider.',
        adverseReactions: 'Adverse reaction data not available from PubChem database.',
        drugInteractions: 'Drug interaction data not available from PubChem database.',
        contraindications: 'Contraindication data not available from PubChem database.',
        overdosage: '',
        clinicalPharmacology: `Chemical Properties:\n• Molecular Formula: ${properties.MolecularFormula}\n• Molecular Weight: ${properties.MolecularWeight} g/mol\n• IUPAC Name: ${properties.IUPACName || 'N/A'}\n• XLogP (Lipophilicity): ${properties.XLogP || 'N/A'}\n• H-Bond Donors: ${properties.HBondDonorCount || 'N/A'}\n• H-Bond Acceptors: ${properties.HBondAcceptorCount || 'N/A'}`,
      },
      
      pillImages: [],
      
      fdaApplicationNumber: undefined,
      approvalDate: undefined,
      marketStatus: 'research', // Not FDA approved
      
      rxcui: undefined,
      rxnormSynonyms: synonyms,
      
      metaTitle: `${drugName} - Compound Information | MediVault`,
      metaDescription: `${drugName} compound information from PubChem. Molecular formula: ${properties.MolecularFormula}. Learn about this chemical compound.`,
      keywords: [drugName.toLowerCase(), 'pubchem', 'compound', 'nootropic', properties.MolecularFormula],
      
      sources: {
        openFDA: false,
        rxNorm: false,
        dailyMed: false,
        pubChem: true,
      },
      
      lastUpdated: new Date().toISOString(),
      fetchedAt: new Date().toISOString(),
    };

    return pubchemMedicine;
  } catch (error) {
    console.error('PubChem fetch error:', error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// myUpchar API - Indian Medicine Database (2L+ medicines)
// Direct search - searches with EXACT name (for Indian brand names)
// ═══════════════════════════════════════════════════════════════════
async function fetchFromMyUpcharDirect(drugName: string): Promise<MedicineInfo | null> {
  try {
    // Search with the EXACT name provided (no brand name mapping)
    const encodedName = encodeURIComponent(drugName);
    
    // myUpchar API endpoint - searching for Allopath (modern medicine)
    const url = `https://beta.myupchar.com/api/medicine/search?name=${encodedName}&type=Allopath&page=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MediVault/1.0 (HealthBeauty Hub Medicine Encyclopedia)',
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    // Check if we got results
    if (!data || !data.medicines || data.medicines.length === 0) {
      return null;
    }
    
    // Find the best match from results
    const medicine = data.medicines[0];
    
    // Build synonyms from alternatives
    const synonyms: string[] = [];
    if (medicine.alternatives) {
      synonyms.push(...medicine.alternatives.slice(0, 10));
    }
    
    // Build side effects text
    const sideEffectsText = Array.isArray(medicine.side_effects) 
      ? medicine.side_effects.map((se: string) => `• ${se}`).join('\n')
      : 'Side effects information available. Consult a healthcare professional.';
    
    // Build uses text
    const usesText = Array.isArray(medicine.uses)
      ? medicine.uses.map((use: string) => `• ${use}`).join('\n')
      : medicine.uses || `${medicine.name || drugName} is a medicine available in India.`;
    
    // Get the display name - prefer API response name, fallback to search term
    const displayName = medicine.name || drugName;
    const saltContent = medicine.salt_content || '';
    
    const myupcharMedicine: MedicineInfo = {
      id: `myupchar-${medicine.id || drugName}`,
      slug: drugName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      
      brandName: displayName, // Show the actual brand name (Crocin, Dolo, etc.)
      genericName: saltContent, // Show the salt/generic (Paracetamol, etc.)
      alternativeNames: synonyms,
      
      drugClass: medicine.category ? [medicine.category] : ['Medicine (India)'],
      pharmacologicClass: [],
      
      activeIngredients: [{
        name: saltContent || displayName,
        strength: medicine.strength || '',
        unit: ''
      }],
      inactiveIngredients: [],
      
      dosageForms: medicine.dosage_form ? [medicine.dosage_form] : [],
      routesOfAdministration: ['Oral'],
      
      manufacturer: {
        name: medicine.manufacturer || 'Indian Pharmaceutical Company',
      },
      ndcCodes: [],
      
      label: {
        indicationsAndUsage: usesText,
        dosageAndAdministration: medicine.dosage || 'Consult prescribing information or healthcare provider for dosage.',
        warnings: 'This medicine information is from the Indian pharmaceutical database (myUpchar). Always consult a qualified healthcare provider before use.',
        adverseReactions: sideEffectsText,
        drugInteractions: 'Consult prescribing information for drug interactions.',
        contraindications: medicine.contraindications || 'Consult prescribing information for contraindications.',
        overdosage: '',
        clinicalPharmacology: saltContent ? `Active ingredient: ${saltContent}` : '',
      },
      
      pillImages: [],
      
      fdaApplicationNumber: undefined,
      approvalDate: undefined,
      marketStatus: 'prescription', // Most Indian medicines require prescription
      
      rxcui: undefined,
      rxnormSynonyms: synonyms,
      
      metaTitle: `${displayName} - Indian Medicine Information | MediVault`,
      metaDescription: `${displayName} medicine information from India. ${saltContent ? `Contains ${saltContent}.` : ''} ${medicine.manufacturer ? `Manufactured by ${medicine.manufacturer}.` : ''} Find uses, side effects, and alternatives.`,
      keywords: [displayName.toLowerCase(), saltContent.toLowerCase(), 'india', 'medicine', 'indian pharmaceutical', medicine.manufacturer?.toLowerCase() || ''].filter(Boolean),
      
      sources: {
        openFDA: false,
        rxNorm: false,
        dailyMed: false,
        pubChem: false,
        myUpchar: true,
      },
      
      lastUpdated: new Date().toISOString(),
      fetchedAt: new Date().toISOString(),
    };
    
    return myupcharMedicine;
  } catch (error) {
    console.error('myUpchar fetch error:', error);
    return null;
  }
}

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
    const normalizedName = drugName.toLowerCase().trim();
    const genericName = brandNameMappings[normalizedName];
    
    // ═══════════════════════════════════════════════════════════════════
    // STEP 1: Search LOCAL Indian medicines sample (50 popular medicines)
    // This gives instant results for common Indian brands
    // ═══════════════════════════════════════════════════════════════════
    let indianMedicine = searchIndianMedicineLocal(drugName);
    
    // ═══════════════════════════════════════════════════════════════════
    // STEP 1b: If not in local sample, search FULL database (254K medicines)
    // ═══════════════════════════════════════════════════════════════════
    if (!indianMedicine) {
      indianMedicine = await searchIndianMedicineFullDB(drugName);
    }
    
    if (indianMedicine) {
      console.log(`✅ Found in Indian database: ${indianMedicine.name}`);
      let medicine = convertIndianMedicineToInfo(indianMedicine);
      
      // Get the generic compound name for Wikipedia enrichment
      const genericCompound = indianMedicine.composition1.replace(/\([^)]+\)/g, '').trim();
      
      // Enrich with Wikipedia data about the generic compound
      const wikiData = await fetchWikipediaData(genericCompound);
      
      if (wikiData) {
        medicine = enrichWithWikipedia(medicine, wikiData);
        medicine.sources.wikipedia = true;
      }
      
      // Format date at build time to prevent hydration mismatch
      const formattedLastUpdated = new Date(medicine.lastUpdated).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric', 
        year: 'numeric',
        timeZone: 'UTC'
      });
      
      return {
        props: { medicine, formattedLastUpdated },
        revalidate: 86400, // Revalidate daily
      };
    }
    
    // For non-Indian medicines, use resolved name (brand → generic mapping)
    const resolvedName = genericName || drugName;
    
    // ═══════════════════════════════════════════════════════════════════
    // STEP 2: Try OpenFDA (FDA-approved drugs) - most authoritative source
    // ═══════════════════════════════════════════════════════════════════
    try {
      const response = await fetch(`${API_BASE_URL}/api/medicine/${encodeURIComponent(resolvedName)}`);
      const result = await response.json();

      if (result.success && result.data) {
        // Enrich with Wikipedia data for better descriptions
        const wikiData = await fetchWikipediaData(resolvedName);
        let medicine = result.data;
        
        if (wikiData) {
          medicine = enrichWithWikipedia(medicine, wikiData);
          medicine.sources.wikipedia = true;
        }
        
        const formattedLastUpdated = new Date(medicine.lastUpdated).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC'
        });
        
        return {
          props: { medicine, formattedLastUpdated },
          revalidate: 86400, // Revalidate daily
        };
      }
    } catch (fdaError) {
      console.log('OpenFDA lookup failed, trying other sources:', fdaError);
    }

    // ═══════════════════════════════════════════════════════════════════
    // STEP 3: Try MyChem.info/DrugCentral (international drugs & nootropics)
    // ═══════════════════════════════════════════════════════════════════
    const mychemMedicine = await fetchFromMyChem(resolvedName);
    
    if (mychemMedicine) {
      // Enrich with Wikipedia data
      const wikiData = await fetchWikipediaData(resolvedName);
      let medicine = mychemMedicine;
      
      if (wikiData) {
        medicine = enrichWithWikipedia(medicine, wikiData);
        medicine.sources.wikipedia = true;
      }
      
      const formattedLastUpdated = new Date(medicine.lastUpdated).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC'
      });
      
      return {
        props: { medicine, formattedLastUpdated },
        revalidate: 86400, // Revalidate daily
      };
    }

    // ═══════════════════════════════════════════════════════════════════
    // STEP 4: Try myUpchar with resolved name (generic fallback)
    // ═══════════════════════════════════════════════════════════════════
    const myupcharMedicine = await fetchFromMyUpcharDirect(resolvedName);
    
    if (myupcharMedicine) {
      // Enrich with Wikipedia data
      const wikiData = await fetchWikipediaData(resolvedName);
      let medicine = myupcharMedicine;
      
      if (wikiData) {
        medicine = enrichWithWikipedia(medicine, wikiData);
        medicine.sources.wikipedia = true;
      }
      
      const formattedLastUpdated = new Date(medicine.lastUpdated).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC'
      });
      
      return {
        props: { medicine, formattedLastUpdated },
        revalidate: 86400, // Revalidate daily
      };
    }

    // ═══════════════════════════════════════════════════════════════════
    // STEP 4: Try Wikipedia only (for drugs with Wikipedia articles)
    // ═══════════════════════════════════════════════════════════════════
    const wikiMedicine = await fetchFromWikipediaOnly(resolvedName);
    
    if (wikiMedicine) {
      const formattedLastUpdated = new Date(wikiMedicine.lastUpdated).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC'
      });
      
      return {
        props: { medicine: wikiMedicine, formattedLastUpdated },
        revalidate: 86400, // Revalidate daily
      };
    }

    // ═══════════════════════════════════════════════════════════════════
    // STEP 5: Fallback to PubChem (chemical properties only)
    // ═══════════════════════════════════════════════════════════════════
    const pubchemMedicine = await fetchFromPubChem(resolvedName);
    
    if (pubchemMedicine) {
      const formattedLastUpdated = new Date(pubchemMedicine.lastUpdated).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC'
      });
      
      return {
        props: { medicine: pubchemMedicine, formattedLastUpdated },
        revalidate: 86400, // Revalidate daily
      };
    }

    // ═══════════════════════════════════════════════════════════════════
    // No data found in any source
    // ═══════════════════════════════════════════════════════════════════
    return {
      props: { medicine: null, error: `"${drugName}" not found in OpenFDA, DrugCentral, myUpchar (India), Wikipedia, or PubChem databases. Try searching with a different name or spelling.` },
      revalidate: 60,
    };
  } catch (error) {
    console.error('Failed to fetch medicine:', error);
    return {
      props: { medicine: null, error: 'Failed to load medicine data. Please try again later.' },
      revalidate: 60,
    };
  }
};
