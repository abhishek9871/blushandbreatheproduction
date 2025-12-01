/**
 * Buy Page - Conversion-Focused Transactional Pages
 * 
 * Dynamic page for buyer-intent content like "Buy DMAA India"
 * Optimized for maximum conversions with interactive tools,
 * testimonials, risk calculators, and affiliate CTAs.
 * 
 * Route: /buy/[slug]
 * Example: /buy/dmaa-india
 */

import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { GetStaticPaths, GetStaticProps } from 'next';
import { FAQAccordion, TableOfContents } from '@/components';
import { getBuyPageBySlug, getBuyPageSlugs } from '@/lib/data/buy-pages';
import type { BuyPage } from '@/types';

// Import Buy Page Components
import BuyPageHero from '@/components/buy/BuyPageHero';
import MedicalCitationBadge from '@/components/buy/MedicalCitationBadge';
import RiskCalculator from '@/components/buy/RiskCalculator';
import SupplierWarningCard from '@/components/buy/SupplierWarningCard';
import TestimonialCard from '@/components/buy/TestimonialCard';
import AlternativesComparison from '@/components/buy/AlternativesComparison';
import LegalStatusTable from '@/components/buy/LegalStatusTable';
import EffectComparisonChart from '@/components/buy/EffectComparisonChart';
import ConversionCTA from '@/components/buy/ConversionCTA';
import BuyPageSchema from '@/components/buy/BuyPageSchema';

interface BuyPageProps {
  page: BuyPage | null;
  error?: string;
  formattedDate?: string;
}

const SITE_URL = 'https://www.blushandbreath.com';

export default function BuyPageComponent({ page, error, formattedDate }: BuyPageProps) {
  const [calculatorResult, setCalculatorResult] = useState<{
    riskPercentage: number;
    penaltyMin: number;
    penaltyMax: number;
  } | null>(null);

  if (error || !page) {
    return (
      <>
        <Head>
          <title>Page Not Found | Blush & Breathe</title>
          <meta name="robots" content="noindex" />
        </Head>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-6xl text-gray-400 mb-4">
              error_outline
            </span>
            <h1 className="text-2xl font-bold text-text-light dark:text-text-dark mb-2">
              Page Not Found
            </h1>
            <p className="text-text-subtle-light dark:text-text-subtle-dark mb-4">
              {error || 'The page you are looking for does not exist.'}
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
  const tocItems = page.sections.map(s => ({ id: s.id, title: s.title }));

  const canonicalUrl = `${SITE_URL}/buy/${page.slug}`;

  return (
    <>
      {/* SEO Metadata */}
      <Head>
        <title>{page.metaTitle}</title>
        <meta name="description" content={page.metaDescription} />
        <meta name="keywords" content={page.keywords.join(', ')} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Open Graph */}
        <meta property="og:title" content={page.metaTitle} />
        <meta property="og:description" content={page.metaDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={`${SITE_URL}/images/og-buy-${page.slug}.jpg`} />
        <meta property="og:site_name" content="Blush & Breathe" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={page.metaTitle} />
        <meta name="twitter:description" content={page.metaDescription} />
        
        {/* Article metadata */}
        <meta property="article:published_time" content={page.publishedDate} />
        <meta property="article:modified_time" content={page.modifiedDate} />
        <meta property="article:section" content="Health" />
        <meta name="author" content="Blush & Breathe" />
      </Head>

      {/* Schema.org Structured Data */}
      <BuyPageSchema 
        page={page} 
        pageUrl={canonicalUrl}
        datePublished={page.publishedDate}
        dateModified={page.modifiedDate}
      />

      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {/* Breadcrumb */}
        <nav className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-text-subtle-light dark:text-text-subtle-dark mb-4 sm:mb-6">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link href="/health" className="hover:text-primary">Health</Link>
          <span>/</span>
          <span className="text-text-light dark:text-text-dark">Buy Guides</span>
          <span>/</span>
          <span className="text-text-light dark:text-text-dark truncate max-w-[150px] sm:max-w-[250px]">
            {page.title}
          </span>
        </nav>

        <article>
          {/* Hero Section */}
          <BuyPageHero
            title={page.heroTitle}
            subtitle={page.heroSubtitle}
            quickStats={page.quickStats}
            modifiedDate={formattedDate || ''}
            readingTime={page.readingTime}
          />

          {/* Medical Citation Badge - E-E-A-T Signal */}
          <MedicalCitationBadge 
            sources={page.medicalSources}
            modifiedDate={formattedDate || ''}
          />

          {/* Primary CTA - Above Fold */}
          <ConversionCTA 
            position="top"
            title="Skip the Risk"
            description="Legal alternatives with COD available across India"
            ctaText="View Legal Alternatives"
            ctaLink="#legal-alternatives"
          />

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
              dangerouslySetInnerHTML={{ __html: page.introduction }}
            />
          </section>

          {/* Content Sections */}
          <div className="buy-sections">
            {page.sections.map((section, index) => (
              <section 
                key={section.id} 
                id={section.id}
                className="mb-10 scroll-mt-20"
              >
                <h2 className="text-xl sm:text-2xl font-bold text-text-light dark:text-text-dark mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">
                    {getSectionIcon(section.id)}
                  </span>
                  {section.title}
                </h2>
                
                <div 
                  className="buy-page-content prose prose-lg dark:prose-invert max-w-none text-text-subtle-light dark:text-text-subtle-dark
                    prose-headings:text-text-light dark:prose-headings:text-text-dark
                    prose-strong:text-text-light dark:prose-strong:text-text-dark
                    prose-ul:list-disc prose-ol:list-decimal
                    prose-a:text-primary"
                  dangerouslySetInnerHTML={{ __html: section.content }}
                />

                {/* Conditional Components Based on Section */}
                {section.id === 'legal-status' && (
                  <LegalStatusTable data={page.legalStatusByCountry} />
                )}

                {section.id === 'risk-calculator' && page.hasCalculator && (
                  <RiskCalculator 
                    config={page.calculatorConfig}
                    onCalculate={setCalculatorResult}
                  />
                )}

                {section.id === 'supplier-warnings' && (
                  <div className="space-y-4 mt-6">
                    {page.supplierWarnings.map(supplier => (
                      <SupplierWarningCard key={supplier.id} supplier={supplier} />
                    ))}
                  </div>
                )}

                {section.id === 'testimonials' && page.hasTestimonials && (
                  <div className="grid gap-4 mt-6 md:grid-cols-2">
                    {page.testimonials.slice(0, 6).map(testimonial => (
                      <TestimonialCard key={testimonial.id} testimonial={testimonial} />
                    ))}
                  </div>
                )}

                {section.id === 'health-risks' && (
                  <EffectComparisonChart 
                    effects={page.effectComparison}
                    sideEffects={page.sideEffectComparison}
                  />
                )}

                {section.id === 'legal-alternatives' && (
                  <AlternativesComparison alternatives={page.alternatives} />
                )}

                {/* Mid-content CTA after alternatives section */}
                {section.id === 'legal-alternatives' && (
                  <ConversionCTA 
                    position="middle"
                    title="Ready to Switch?"
                    description="These legal alternatives deliver 70-85% of DMAA's effects with zero legal or health risks"
                    ctaText="Shop Now with COD"
                    ctaLink="#top-pick"
                    variant="prominent"
                  />
                )}
              </section>
            ))}
          </div>

          {/* Conclusion */}
          {page.conclusion && (
            <section className="mb-10 p-6 bg-gradient-to-r from-alert-red/10 to-success-green/10 dark:from-alert-red/20 dark:to-success-green/20 rounded-xl border border-border-light dark:border-border-dark">
              <h2 className="text-xl font-bold text-text-light dark:text-text-dark mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">summarize</span>
                The Bottom Line
              </h2>
              <div 
                className="prose dark:prose-invert max-w-none text-text-subtle-light dark:text-text-subtle-dark"
                dangerouslySetInnerHTML={{ __html: page.conclusion }}
              />
            </section>
          )}

          {/* FAQ Accordion */}
          {page.faqs && page.faqs.length > 0 && (
            <FAQAccordion 
              faqs={page.faqs} 
              className="mb-8"
            />
          )}

          {/* Final CTA */}
          <ConversionCTA 
            position="bottom"
            title="Don't Risk It"
            description="DMAA: Illegal, 45% seizure rate, ₹10L penalty. Legal alternatives: COD available, 1-3 day delivery, same effects."
            ctaText="View Legal Alternatives with COD"
            ctaLink="#legal-alternatives"
            variant="final"
          />

          {/* Related Pages */}
          {page.relatedPages && page.relatedPages.length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-text-light dark:text-text-dark mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">link</span>
                Related Resources
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {page.relatedPages.map((related, index) => (
                  <Link
                    key={index}
                    href={`/${related.type}/${related.slug}`}
                    className="p-4 bg-card-light dark:bg-card-dark rounded-lg border border-border-light dark:border-border-dark hover:border-primary transition-colors"
                  >
                    <span className="text-sm text-primary uppercase tracking-wide">
                      {related.type}
                    </span>
                    <p className="text-text-light dark:text-text-dark font-medium">
                      {related.title}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Citations */}
          {page.citations && page.citations.length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-text-light dark:text-text-dark mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">menu_book</span>
                References & Medical Sources
              </h2>
              <ul className="space-y-2">
                {page.citations.map((citation, index) => (
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

          {/* Disclaimers */}
          <section className="mb-8 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-xs text-text-subtle-light dark:text-text-subtle-dark space-y-3">
            <div>
              <strong className="text-text-light dark:text-text-dark">Medical Disclaimer:</strong>
              <p>This content is for informational purposes only and does not constitute medical advice. 
              It is based on publicly available research from the U.S. FDA, NIH, FSSAI, and peer-reviewed medical literature. 
              Consult a licensed physician or pharmacist before using any supplements.</p>
            </div>
            <div>
              <strong className="text-text-light dark:text-text-dark">Affiliate Disclosure:</strong>
              <p>We earn commissions from legal alternative recommendations at no extra cost to you. 
              This does not influence our editorial stance on safety or legality. Our mission is harm reduction through education.</p>
            </div>
            <div>
              <strong className="text-text-light dark:text-text-dark">Legal Notice:</strong>
              <p>Information on legal status is current as of {formattedDate}. Laws change frequently. 
              Verify with local authorities before making any decisions.</p>
            </div>
          </section>
        </article>
      </main>
    </>
  );
}

// Helper function to get section icons
function getSectionIcon(sectionId: string): string {
  const iconMap: Record<string, string> = {
    'legal-status': 'gavel',
    'risk-calculator': 'calculate',
    'supplier-warnings': 'warning',
    'testimonials': 'format_quote',
    'health-risks': 'health_and_safety',
    'legal-alternatives': 'verified_user',
    'athletes': 'sports',
    'faq': 'help',
    'default': 'article'
  };
  return iconMap[sectionId] || iconMap['default'];
}

/**
 * Generate static paths for all buy pages
 */
export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = getBuyPageSlugs();
  
  return {
    paths: slugs.map((slug) => ({ params: { slug } })),
    fallback: 'blocking',
  };
};

/**
 * Fetch buy page data at build time
 */
export const getStaticProps: GetStaticProps<BuyPageProps> = async ({ params }) => {
  const slug = params?.slug as string;

  if (!slug) {
    return {
      props: { page: null, error: 'Invalid slug' },
      revalidate: 60,
    };
  }

  try {
    const page = getBuyPageBySlug(slug);

    if (!page) {
      return {
        props: { page: null, error: 'Page not found' },
        revalidate: 60,
      };
    }

    // Format date at build time to prevent hydration mismatch
    const formattedDate = new Date(page.modifiedDate).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      timeZone: 'UTC'
    });

    return {
      props: {
        page,
        formattedDate,
      },
      revalidate: 3600, // Revalidate every hour
    };
  } catch (error) {
    console.error('Failed to fetch buy page:', error);
    return {
      props: { page: null, error: 'Failed to load page data' },
      revalidate: 60,
    };
  }
};
