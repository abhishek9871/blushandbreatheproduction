/**
 * Comparison Page - Side-by-side comparison of banned vs legal substances
 * 
 * URL format: /compare/[bannedSlug]-vs-[alternativeSlug]
 * Example: /compare/dmaa-vs-caffeine
 */

import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import {
  getBannedSubstances,
  getLegalSupplements,
  getBannedSubstanceBySlug,
  getLegalSupplementBySlug,
  getAffiliateProductsForSupplement,
} from '@/lib/data';
import { compareSubstances } from '@/utils/safeSwap';
import { MetaHead, SchemaMarkup, AffiliateDisclosure, FDADisclaimer } from '@/components';
import { trackComparisonView, trackAffiliateClick } from '@/lib/analytics';
import type { BannedSubstance, LegalSupplement, AffiliateProduct } from '@/types';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface ComparisonPageProps {
  banned: BannedSubstance | null;
  alternative: LegalSupplement | null;
  products: AffiliateProduct[];
  slug: string;
}

// ═══════════════════════════════════════════════════════════════════
// STATIC GENERATION
// ═══════════════════════════════════════════════════════════════════

export const getStaticPaths: GetStaticPaths = async () => {
  const bannedSubstances = getBannedSubstances();
  const paths: { params: { slug: string } }[] = [];

  // Generate paths for each banned substance and its alternatives
  for (const banned of bannedSubstances) {
    for (const altSlug of banned.legalAlternatives) {
      paths.push({
        params: { slug: `${banned.slug}-vs-${altSlug}` },
      });
    }
  }

  return {
    paths,
    fallback: 'blocking', // ISR for new comparisons
  };
};

export const getStaticProps: GetStaticProps<ComparisonPageProps> = async ({ params }) => {
  const slug = params?.slug as string;
  
  // Parse the slug: format is "banned-vs-alternative"
  const vsMatch = slug.match(/^(.+)-vs-(.+)$/);
  
  if (!vsMatch) {
    return { notFound: true };
  }

  const [, bannedSlug, alternativeSlug] = vsMatch;
  
  const banned = getBannedSubstanceBySlug(bannedSlug);
  const alternative = getLegalSupplementBySlug(alternativeSlug);
  
  if (!banned || !alternative) {
    return { notFound: true };
  }

  const products = getAffiliateProductsForSupplement(alternativeSlug);

  return {
    props: {
      banned,
      alternative,
      products,
      slug,
    },
    revalidate: 86400, // 24 hours ISR
  };
};

// ═══════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════

function ComparisonHeader({ banned, alternative }: { banned: BannedSubstance; alternative: LegalSupplement }) {
  return (
    <div className="bg-gradient-to-r from-red-900/20 via-gray-900 to-green-900/20 rounded-xl p-6 mb-8">
      <div className="flex items-center justify-center gap-4 mb-4">
        <span className="material-symbols-outlined text-3xl text-blue-400">balance</span>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Substance Comparison</h1>
      </div>
      <div className="grid md:grid-cols-3 gap-4 items-center">
        {/* Banned Side */}
        <div className="text-center">
          <span className="inline-block px-3 py-1 bg-red-600/30 text-red-400 text-xs font-semibold rounded-full mb-2">
            BANNED / RESTRICTED
          </span>
          <h2 className="text-xl font-bold text-red-400">{banned.name}</h2>
          <p className="text-gray-400 text-sm mt-1">{banned.category}</p>
        </div>
        
        {/* VS */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-800 rounded-full border-2 border-gray-700">
            <span className="text-gray-400 font-bold">VS</span>
          </div>
        </div>
        
        {/* Alternative Side */}
        <div className="text-center">
          <span className="inline-block px-3 py-1 bg-green-600/30 text-green-400 text-xs font-semibold rounded-full mb-2">
            LEGAL ALTERNATIVE
          </span>
          <h2 className="text-xl font-bold text-green-400">{alternative.name}</h2>
          <p className="text-gray-400 text-sm mt-1">{alternative.category}</p>
        </div>
      </div>
    </div>
  );
}

function ComparisonTable({ banned, alternative }: { banned: BannedSubstance; alternative: LegalSupplement }) {
  const comparison = compareSubstances(banned.slug, alternative.slug);
  
  if (!comparison) return null;

  return (
    <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden mb-8">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-800/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Category</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-red-400">
                {banned.name}
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-green-400">
                {alternative.name}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {comparison.comparison.map((row, index) => (
              <tr key={index} className="hover:bg-gray-800/30">
                <td className="px-4 py-3 text-sm font-medium text-white">{row.category}</td>
                <td className="px-4 py-3 text-sm text-gray-300">
                  <div className="flex items-start gap-2">
                    {row.advantage === 'alternative' && (
                      <span className="material-symbols-outlined text-base text-red-400 flex-shrink-0">cancel</span>
                    )}
                    <span>{row.banned}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-300">
                  <div className="flex items-start gap-2">
                    {row.advantage === 'alternative' && (
                      <span className="material-symbols-outlined text-base text-green-400 flex-shrink-0">check_circle</span>
                    )}
                    <span>{row.alternative}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SafetyComparison({ banned, alternative }: { banned: BannedSubstance; alternative: LegalSupplement }) {
  return (
    <div className="grid md:grid-cols-2 gap-6 mb-8">
      {/* Banned Risks */}
      <div className="bg-red-900/10 border border-red-900/30 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-xl text-red-400">warning</span>
          <h3 className="font-semibold text-red-400">Risks of {banned.name}</h3>
        </div>
        <ul className="space-y-2">
          {banned.healthRisks.slice(0, 3).map((risk, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
              <span className="material-symbols-outlined text-base text-red-400 flex-shrink-0">cancel</span>
              <span><strong className="text-red-300">{risk.category}:</strong> {risk.description.slice(0, 100)}...</span>
            </li>
          ))}
          {banned.sideEffects.slice(0, 3).map((effect, i) => (
            <li key={`se-${i}`} className="flex items-start gap-2 text-sm text-gray-400">
              <span className="w-4 h-4 flex items-center justify-center">•</span>
              <span>{effect}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Alternative Benefits */}
      <div className="bg-green-900/10 border border-green-900/30 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-xl text-green-400">verified_user</span>
          <h3 className="font-semibold text-green-400">Benefits of {alternative.name}</h3>
        </div>
        <ul className="space-y-2">
          {alternative.benefits.slice(0, 5).map((benefit, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
              <span className="material-symbols-outlined text-base text-green-400 flex-shrink-0">check_circle</span>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
        {alternative.scientificEvidence && alternative.scientificEvidence.length > 0 && (
          <div className="mt-4 pt-4 border-t border-green-900/30">
            <p className="text-xs text-green-400">
              {alternative.scientificEvidence[0].studies}+ studies support these benefits
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function RecommendedProducts({ products, alternative }: { products: AffiliateProduct[]; alternative: LegalSupplement }) {
  if (products.length === 0) return null;

  return (
    <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6 mb-8">
      <h3 className="text-lg font-semibold text-white mb-4">
        Recommended {alternative.name} Products
      </h3>
      <div className="grid md:grid-cols-3 gap-4">
        {products.slice(0, 3).map((product) => (
          <div
            key={product.id}
            className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-green-500/50 transition-colors"
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium text-white text-sm">{product.name}</h4>
              {product.thirdPartyTested && (
                <span className="px-2 py-0.5 bg-green-600/20 text-green-400 text-xs rounded">
                  Tested
                </span>
              )}
            </div>
            <p className="text-gray-400 text-xs mb-2">{product.brand}</p>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-yellow-400 text-sm">★ {product.rating}</span>
              <span className="text-gray-500 text-xs">({product.reviewCount} reviews)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-green-400 font-semibold">${product.price}</span>
              <a
                href={product.affiliateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-medium rounded transition-colors"
              >
                Buy Now
                <span className="material-symbols-outlined text-xs">open_in_new</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Disclaimer() {
  return (
    <div className="bg-blue-900/20 border border-blue-800/50 rounded-xl p-5">
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-xl text-blue-400 flex-shrink-0">info</span>
        <div>
          <h4 className="font-semibold text-blue-300 mb-2">Important Disclaimer</h4>
          <p className="text-sm text-gray-400">
            This comparison is for educational purposes only and does not constitute medical advice.
            The legal alternative suggested may provide similar benefits but results vary by individual.
            Always consult with a qualified healthcare provider before starting any supplement regimen,
            especially if you have underlying health conditions or are taking medications.
          </p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function ComparisonPage({ banned, alternative, products, slug }: ComparisonPageProps) {
  const router = useRouter();

  // Loading state for ISR
  if (router.isFallback) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading comparison...</div>
      </div>
    );
  }

  // 404 state
  if (!banned || !alternative) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-center px-4">
        <span className="material-symbols-outlined text-6xl text-yellow-500 mb-4">warning</span>
        <h1 className="text-2xl font-bold text-white mb-2">Comparison Not Found</h1>
        <p className="text-gray-400 mb-6">
          The comparison you&apos;re looking for doesn&apos;t exist or the URL is invalid.
        </p>
        <Link
          href="/banned"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Browse Banned Substances
        </Link>
      </div>
    );
  }

  const pageTitle = `${banned.name} vs ${alternative.name} - Safe Alternative Comparison`;
  const pageDescription = `Compare ${banned.name} (banned) with ${alternative.name} (legal alternative). Learn about safety, effectiveness, and where to buy legal options.`;

  // Track comparison view on mount
  useEffect(() => {
    if (banned && alternative) {
      trackComparisonView(banned.name, alternative.name);
    }
  }, [banned, alternative]);

  return (
    <>
      {/* Dynamic SEO Metadata */}
      <MetaHead
        pageType="comparison"
        comparisonData={{ banned, alternative }}
      />
      
      {/* Schema.org Structured Data - Comparison WebPage */}
      <SchemaMarkup
        type="WebPage"
        pageUrl={`https://blushandbreathe.com/compare/${slug}`}
        pageTitle={pageTitle}
        pageDescription={pageDescription}
        datePublished={banned.createdAt}
        dateModified={new Date().toISOString()}
      />

      <main className="min-h-screen bg-gray-950">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Back Navigation */}
          <Link
            href={`/banned/${banned.slug}`}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Back to {banned.name}
          </Link>

          {/* Header */}
          <ComparisonHeader banned={banned} alternative={alternative} />

          {/* Comparison Table */}
          <ComparisonTable banned={banned} alternative={alternative} />

          {/* Safety Comparison */}
          <SafetyComparison banned={banned} alternative={alternative} />

          {/* Recommended Products */}
          <RecommendedProducts products={products} alternative={alternative} />

          {/* Navigation Links */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <Link
              href={`/banned/${banned.slug}`}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-red-900/20 border border-red-900/50 text-red-400 rounded-lg hover:bg-red-900/30 transition-colors"
            >
              Learn more about {banned.name}
            </Link>
            <Link
              href={`/supplement/${alternative.slug}`}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-green-900/20 border border-green-900/50 text-green-400 rounded-lg hover:bg-green-900/30 transition-colors"
            >
              Learn more about {alternative.name}
            </Link>
          </div>

          {/* Disclaimer */}
          <Disclaimer />
        </div>
      </main>
    </>
  );
}
