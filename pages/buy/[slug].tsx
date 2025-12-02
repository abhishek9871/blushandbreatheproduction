/**
 * Buy Page - Conversion-Focused Transactional Pages
 * 
 * Dynamic page for buyer-intent content like "Buy DMAA India"
 * Optimized for maximum conversions with interactive tools,
 * testimonials, risk calculators, and affiliate CTAs.
 * 
 * Route: /buy/[slug]
 * Example: /buy/dmaa-india
 * 
 * PERFORMANCE OPTIMIZATION:
 * - Above-fold components loaded eagerly
 * - Below-fold components lazy loaded with dynamic imports
 * - This reduces initial JS bundle by ~40KB
 */

import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { GetStaticPaths, GetStaticProps } from 'next';
import { FAQAccordion, TableOfContents } from '@/components';
import { getBuyPageBySlug, getBuyPageSlugs } from '@/lib/data/buy-pages';
import type { BuyPage } from '@/types';

// =============================================================================
// ABOVE-FOLD COMPONENTS (Eager Load - Critical for LCP)
// =============================================================================
import BuyPageHero from '@/components/buy/BuyPageHero';
import MedicalCitationBadge from '@/components/buy/MedicalCitationBadge';
import ConversionCTA from '@/components/buy/ConversionCTA';
import BuyPageSchema from '@/components/buy/BuyPageSchema';

// =============================================================================
// BELOW-FOLD COMPONENTS (Lazy Load - Reduces initial bundle)
// =============================================================================

// Loading placeholder component for consistent UX
const LoadingPlaceholder = ({ height = 'h-48' }: { height?: string }) => (
  <div className={`${height} animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl`} />
);

// Risk Calculator - Interactive tool, not immediately visible
const RiskCalculator = dynamic(
  () => import('@/components/buy/RiskCalculator'),
  { 
    loading: () => <LoadingPlaceholder height="h-64" />,
    ssr: true // Keep SSR for SEO
  }
);

// Supplier Warning Cards - Below first viewport
const SupplierWarningCard = dynamic(
  () => import('@/components/buy/SupplierWarningCard'),
  { ssr: true }
);

// Testimonial Cards - User reviews section
const TestimonialCard = dynamic(
  () => import('@/components/buy/TestimonialCard'),
  { ssr: true }
);

// Alternatives Comparison - Product grid
const AlternativesComparison = dynamic(
  () => import('@/components/buy/AlternativesComparison'),
  { 
    loading: () => <LoadingPlaceholder height="h-96" />,
    ssr: true
  }
);

// Legal Status Table - Country comparison
const LegalStatusTable = dynamic(
  () => import('@/components/buy/LegalStatusTable'),
  { 
    loading: () => <LoadingPlaceholder height="h-48" />,
    ssr: true
  }
);

// Effect Comparison Chart - Visual charts
const EffectComparisonChart = dynamic(
  () => import('@/components/buy/EffectComparisonChart'),
  { 
    loading: () => <LoadingPlaceholder height="h-72" />,
    ssr: true
  }
);

// Featured Product Showcase - Main product display
const FeaturedProductShowcase = dynamic(
  () => import('@/components/buy/FeaturedProductShowcase'),
  { 
    loading: () => <LoadingPlaceholder height="h-[500px]" />,
    ssr: true
  }
);

// Affiliate Product Showcase - High-conversion product grid for legal products
const AffiliateProductShowcase = dynamic(
  () => import('@/components/buy/AffiliateProductShowcase'),
  { 
    loading: () => <LoadingPlaceholder height="h-[600px]" />,
    ssr: true
  }
);

// Product Video Section - YouTube videos to build trust and drive conversions
const ProductVideoSection = dynamic(
  () => import('@/components/buy/ProductVideoSection'),
  { 
    loading: () => <LoadingPlaceholder height="h-[400px]" />,
    ssr: false // Client-side only for YouTube API calls
  }
);

// =============================================================================
// BERBERINE AFFILIATE PRODUCTS DATA (with verified Amazon product images)
// Images scraped from Amazon India product pages - December 2025
// =============================================================================
const BERBERINE_PRODUCTS = [
  {
    id: 'wellbeing-nutrition-berberine',
    name: "Wellbeing Nutrition's Slow Liposomal Berberine HCL+ 1100mg with Karela, Cinnamon, Gymnema, Chromium",
    shortName: 'Wellbeing Nutrition Liposomal Berberine 1100mg',
    brand: 'Wellbeing Nutrition',
    description: 'Premium liposomal formula with 6x higher absorption. Contains Karela, Cinnamon, Gymnema & Chromium. Activates AMPK & GLP-1 for metabolism support. 60 Veg Capsules.',
    price: 1528,
    originalPrice: 1999,
    currency: '₹',
    affiliateUrl: 'https://amzn.to/4iucHQm',
    // Verified Amazon image from B0FBWB64TM product page
    imageUrl: 'https://m.media-amazon.com/images/I/71nE2-6h3PL._SL500_.jpg',
    rating: 4.2,
    reviewCount: 71,
    badges: ['Liposomal', '1100mg', 'AMPK Activator'],
    isTopPick: true,
  },
  {
    id: 'miduty-berberine',
    name: 'Miduty High Strength Berberine HCL 98% Triple Benefits of Blood Sugar Control',
    shortName: 'Miduty Berberine HCL 98% - High Strength',
    brand: 'Miduty',
    description: 'High strength 98% Berberine HCL with Bitter Melon & Chromium for diabetic care. Stops sugar cravings and lowers blood sugar. 60 Capsules.',
    price: 1681,
    originalPrice: 1770,
    currency: '₹',
    affiliateUrl: 'https://amzn.to/3McWp2v',
    // Verified Amazon image from B09CLCBVSW product page
    imageUrl: 'https://m.media-amazon.com/images/I/614NJIINYRL._SL500_.jpg',
    rating: 4.4,
    reviewCount: 890,
    badges: ['98% HCL', 'High Strength', 'Diabetic Care'],
  },
  {
    id: 'healthyhey-berberine',
    name: 'HealthyHey Berberis - Berberine 95% - Support Weight Management & Healthy Glucose Levels',
    shortName: 'HealthyHey Berberine 95% - 750mg',
    brand: 'HealthyHey',
    description: 'Support weight management and healthy glucose levels. 750mg vegetarian capsules, 60 count. Most affordable berberine option.',
    price: 717,
    originalPrice: 999,
    currency: '₹',
    affiliateUrl: 'https://amzn.to/48IgSF3',
    // Verified Amazon image from B07CJ5KT54 product page
    imageUrl: 'https://m.media-amazon.com/images/I/512GtcW%2BAJL._SL500_.jpg',
    rating: 4.3,
    reviewCount: 587,
    badges: ['95% Extract', '750mg', 'Best Value'],
    isBestValue: true,
  },
  {
    id: 'organic-india-isabgol',
    name: 'ORGANIC INDIA Isabgol Psyllium Husk Powder',
    shortName: 'Organic India Isabgol - 100g',
    brand: 'Organic India',
    description: 'Pure organic psyllium husk powder for digestive health. Pairs perfectly with berberine for enhanced metabolic support.',
    price: 209,
    originalPrice: 250,
    currency: '₹',
    affiliateUrl: 'https://amzn.to/48eIOAj',
    // Verified Amazon image from B013BWSGS6 product page
    imageUrl: 'https://m.media-amazon.com/images/I/41YM1YxAucL._SL500_.jpg',
    rating: 4.1,
    reviewCount: 258,
    badges: ['Organic', '100g', 'Top Brand'],
  },
  {
    id: 'vlados-himalayan-berberine',
    name: "Vlado's Himalayan Organics Berberis Berberine 98% with Milk Thistle",
    shortName: 'Himalayan Organics Berberine + Milk Thistle',
    brand: 'Himalayan Organics',
    description: '2X liver support with 98% Berberine HCL and Milk Thistle. Supports blood sugar, cholesterol & liver detox. 60 Veg Capsules.',
    price: 894,
    originalPrice: 1299,
    currency: '₹',
    affiliateUrl: 'https://amzn.to/48MsNla',
    // Verified Amazon image from B0C89D7WSL product page
    imageUrl: 'https://m.media-amazon.com/images/I/417nAb4PHjL._SL500_.jpg',
    rating: 4.6,
    reviewCount: 429,
    badges: ['98% HCL', 'Milk Thistle', 'Liver Support'],
  },
];

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

  // Determine substance name based on page slug
  const getSubstanceName = () => {
    if (!page) return 'DMAA';
    if (page.slug.includes('clenbuterol')) return 'Clenbuterol';
    if (page.slug.includes('dmaa')) return 'DMAA';
    return page.title.split(':')[0].trim();
  };
  const substanceName = getSubstanceName();

  // Check if this is a legal product (berberine, supplements) vs banned substance (DMAA, clenbuterol)
  const isLegalProduct = page?.quickStats?.legalStatus?.toLowerCase().includes('legal') || 
                         page?.quickStats?.legalStatus?.toLowerCase().includes('otc');

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
        affiliateProducts={page.slug.includes('berberine') ? BERBERINE_PRODUCTS : undefined}
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
          <span className="text-text-light dark:text-text-dark">
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

          {/* Primary CTA - Above Fold (different for legal vs banned products) */}
          {isLegalProduct ? (
            <ConversionCTA 
              position="top"
              title="Start Saving Today"
              description="Order now on Amazon India — Prime delivery, Cash on Delivery available"
              ctaText="Shop Best Products"
              ctaLink="#best-products"
              variant="success"
            />
          ) : (
            <ConversionCTA 
              position="top"
              title="Skip the Risk"
              description="Legal alternatives with COD available across India"
              ctaText="View Legal Alternatives"
              ctaLink="#legal-alternatives"
            />
          )}

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

          {/* Affiliate Products Showcase - For Legal Products (Berberine) */}
          {isLegalProduct && page.slug.includes('berberine') && (
            <AffiliateProductShowcase 
              products={BERBERINE_PRODUCTS}
              sectionId="best-products"
              title="Best Berberine Supplements in India (December 2025)"
              subtitle="Amazon Prime • Cash on Delivery • Free Returns"
            />
          )}

          {/* Video Section 1: Berberine Reviews & Benefits - Top 3 most viewed berberine videos */}
          {isLegalProduct && page.slug.includes('berberine') && (
            <ProductVideoSection
              searchQuery="berberine supplement review benefits weight loss blood sugar dosage"
              title="Why Doctors Recommend Berberine"
              subtitle="Watch expert reviews on berberine supplements for weight loss and blood sugar control"
              maxVideos={3}
              sectionId="top-pick-videos"
              variant="featured"
              productName="Wellbeing Nutrition Liposomal Berberine"
              affiliateUrl="https://amzn.to/4iucHQm"
              requiredKeywords={['berberine']}
              excludeKeywords={['ashwagandha', 'creatine', 'protein', 'pre workout', 'testosterone']}
              skipResults={0}
            />
          )}

          {/* Video Section 2: Berberine Weight Loss - Skip first 3 to avoid duplicates */}
          {isLegalProduct && page.slug.includes('berberine') && (
            <ProductVideoSection
              searchQuery="berberine supplement review benefits weight loss blood sugar dosage"
              title="Berberine for Weight Loss & Blood Sugar"
              subtitle="Learn how berberine helps with weight management and metabolic health"
              maxVideos={4}
              sectionId="berberine-education"
              variant="grid"
              productName="Wellbeing Nutrition Berberine"
              affiliateUrl="https://amzn.to/4iucHQm"
              requiredKeywords={['berberine']}
              excludeKeywords={['ashwagandha', 'creatine', 'protein', 'pre workout', 'liver', 'fatty liver']}
              skipResults={3}
            />
          )}

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
                    substanceName={substanceName}
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

                {section.id === 'legal-alternatives' && page.featuredProduct && (
                  <FeaturedProductShowcase product={page.featuredProduct} />
                )}

                {section.id === 'legal-alternatives' && (
                  <AlternativesComparison alternatives={page.alternatives} substanceName={substanceName} />
                )}

                {/* Mid-content CTA after alternatives section */}
                {section.id === 'legal-alternatives' && (
                  <ConversionCTA 
                    position="middle"
                    title="Ready to Switch?"
                    description={`These legal alternatives deliver 70-85% of ${substanceName}'s effects with zero legal or health risks`}
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

          {/* Video Section 3: Berberine Science - Skip first 7 videos (3+4 from above sections) */}
          {isLegalProduct && page.slug.includes('berberine') && (
            <ProductVideoSection
              searchQuery="berberine supplement review benefits weight loss blood sugar dosage"
              title="More Berberine Insights"
              subtitle="Additional expert videos on berberine supplementation"
              maxVideos={3}
              sectionId="berberine-science"
              variant="grid"
              productName="Wellbeing Nutrition Berberine"
              affiliateUrl="https://amzn.to/4iucHQm"
              requiredKeywords={['berberine']}
              excludeKeywords={['ashwagandha', 'creatine', 'protein', 'pre workout', 'testosterone', 'fatty liver']}
              skipResults={7}
            />
          )}

          {/* Final CTA (different for legal vs banned products) */}
          {isLegalProduct ? (
            <ConversionCTA 
              position="bottom"
              title="Ready to Save ₹2,88,000/Year?"
              description="Order berberine now on Amazon India. Prime delivery tomorrow. Cash on Delivery available. 100% legal, no prescription needed."
              ctaText="Order Now with COD"
              ctaLink={page.featuredProduct?.buyLink || "#best-products"}
              variant="success"
            />
          ) : (
            <ConversionCTA 
              position="bottom"
              title="Don't Risk It"
              description={`${substanceName}: Illegal, 45% seizure rate, ₹10L penalty. Legal alternatives: COD available, 1-3 day delivery, same effects.`}
              ctaText="View Legal Alternatives with COD"
              ctaLink="#legal-alternatives"
              variant="final"
            />
          )}

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
