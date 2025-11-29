/**
 * MetaHead Component - Dynamic SEO Metadata Generator
 * 
 * Generates optimized meta tags for substance education pages.
 * Supports banned substances, supplements, medicines, and comparisons.
 */

import Head from 'next/head';
import type { BannedSubstance, LegalSupplement, MedicineInfo } from '@/types';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

type PageType = 'banned' | 'supplement' | 'medicine' | 'comparison' | 'general';

interface MetaHeadProps {
  pageType: PageType;
  // Dynamic data based on page type
  bannedSubstance?: BannedSubstance;
  supplement?: LegalSupplement;
  medicine?: MedicineInfo;
  // Comparison specific
  comparisonData?: {
    banned: BannedSubstance;
    alternative: LegalSupplement;
  };
  // Override defaults
  customTitle?: string;
  customDescription?: string;
  customImage?: string;
  noIndex?: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const SITE_URL = 'https://blushandbreathe.com';
const SITE_NAME = 'Blush & Breathe';
const CURRENT_YEAR = new Date().getFullYear();
const DEFAULT_OG_IMAGE = `${SITE_URL}/images/og-default.jpg`;

// SEO Title Templates
const TITLE_TEMPLATES = {
  banned: (name: string) => 
    `Is ${name} Banned? Side Effects, Legality & Safe Alternatives (${CURRENT_YEAR})`,
  supplement: (name: string) => 
    `${name} Benefits, Dosage, Side Effects & Review (${CURRENT_YEAR})`,
  medicine: (name: string) => 
    `${name} - Uses, Dosage, Side Effects & Interactions (${CURRENT_YEAR})`,
  comparison: (banned: string, alt: string) => 
    `${banned} vs ${alt}: Which is Safer & More Effective? (${CURRENT_YEAR})`,
  general: (title: string) => 
    `${title} | ${SITE_NAME}`,
};

// SEO Description Templates
const DESCRIPTION_TEMPLATES = {
  banned: (substance: BannedSubstance) => {
    const altNames = substance.legalAlternatives.slice(0, 2).join(', ');
    return `Learn about ${substance.name} safety, legal status in ${CURRENT_YEAR}, and why it was banned by ${substance.bannedBy.join(', ')}. Discover safe, legal alternatives like ${altNames || 'natural supplements'}.`;
  },
  supplement: (supplement: LegalSupplement) => {
    const benefits = supplement.benefits.slice(0, 2).join(', ');
    return `Complete guide to ${supplement.name}: ${benefits}. Learn proper dosage (${supplement.dosage.recommended}), side effects, and where to buy quality ${supplement.name} supplements.`;
  },
  medicine: (medicine: MedicineInfo) => 
    `${medicine.brandName} (${medicine.genericName}) - Complete drug information including uses, dosage, side effects, warnings, and drug interactions. FDA-approved prescribing information.`,
  comparison: (banned: BannedSubstance, alt: LegalSupplement) =>
    `Compare ${banned.name} (banned) vs ${alt.name} (legal). Learn the differences in safety, effectiveness, and legality. Find out why ${alt.name} is the safer choice.`,
};

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

function generateTitle(props: MetaHeadProps): string {
  if (props.customTitle) return props.customTitle;

  switch (props.pageType) {
    case 'banned':
      return props.bannedSubstance 
        ? TITLE_TEMPLATES.banned(props.bannedSubstance.name)
        : 'Banned Substance Information';
    case 'supplement':
      return props.supplement
        ? TITLE_TEMPLATES.supplement(props.supplement.name)
        : 'Supplement Information';
    case 'medicine':
      return props.medicine
        ? TITLE_TEMPLATES.medicine(props.medicine.brandName)
        : 'Medicine Information';
    case 'comparison':
      return props.comparisonData
        ? TITLE_TEMPLATES.comparison(
            props.comparisonData.banned.name,
            props.comparisonData.alternative.name
          )
        : 'Substance Comparison';
    default:
      return `${SITE_NAME} - Health & Wellness`;
  }
}

function generateDescription(props: MetaHeadProps): string {
  if (props.customDescription) return props.customDescription;

  switch (props.pageType) {
    case 'banned':
      return props.bannedSubstance
        ? DESCRIPTION_TEMPLATES.banned(props.bannedSubstance)
        : 'Learn about banned and restricted substances, their risks, and safe legal alternatives.';
    case 'supplement':
      return props.supplement
        ? DESCRIPTION_TEMPLATES.supplement(props.supplement)
        : 'Comprehensive supplement information including benefits, dosage, and safety.';
    case 'medicine':
      return props.medicine
        ? DESCRIPTION_TEMPLATES.medicine(props.medicine)
        : 'Complete drug information and prescribing details.';
    case 'comparison':
      return props.comparisonData
        ? DESCRIPTION_TEMPLATES.comparison(
            props.comparisonData.banned,
            props.comparisonData.alternative
          )
        : 'Compare banned substances with their legal alternatives.';
    default:
      return 'Your trusted source for health, wellness, and supplement information.';
  }
}

function generateCanonicalUrl(props: MetaHeadProps): string {
  switch (props.pageType) {
    case 'banned':
      return props.bannedSubstance
        ? `${SITE_URL}/banned/${props.bannedSubstance.slug}`
        : SITE_URL;
    case 'supplement':
      return props.supplement
        ? `${SITE_URL}/supplement/${props.supplement.slug}`
        : SITE_URL;
    case 'medicine':
      return props.medicine
        ? `${SITE_URL}/medicine/${props.medicine.slug}`
        : SITE_URL;
    case 'comparison':
      return props.comparisonData
        ? `${SITE_URL}/compare/${props.comparisonData.banned.slug}-vs-${props.comparisonData.alternative.slug}`
        : SITE_URL;
    default:
      return SITE_URL;
  }
}

function generateKeywords(props: MetaHeadProps): string[] {
  const baseKeywords = ['health', 'supplements', 'wellness'];

  switch (props.pageType) {
    case 'banned':
      if (props.bannedSubstance) {
        return [
          props.bannedSubstance.name,
          ...props.bannedSubstance.alternativeNames,
          'banned substance',
          'is it legal',
          'side effects',
          'safe alternatives',
          ...props.bannedSubstance.keywords,
        ];
      }
      return [...baseKeywords, 'banned substances', 'restricted supplements'];
    case 'supplement':
      if (props.supplement) {
        return [
          props.supplement.name,
          ...props.supplement.alternativeNames,
          'supplement',
          'benefits',
          'dosage',
          'side effects',
          'where to buy',
          ...props.supplement.keywords,
        ];
      }
      return [...baseKeywords, 'dietary supplements', 'vitamins'];
    case 'medicine':
      if (props.medicine) {
        return [
          props.medicine.brandName,
          props.medicine.genericName,
          ...props.medicine.alternativeNames,
          'drug information',
          'dosage',
          'side effects',
          'interactions',
        ];
      }
      return [...baseKeywords, 'medicine', 'drug information'];
    case 'comparison':
      if (props.comparisonData) {
        return [
          `${props.comparisonData.banned.name} vs ${props.comparisonData.alternative.name}`,
          'comparison',
          'alternative',
          'safer option',
          'legal substitute',
        ];
      }
      return [...baseKeywords, 'comparison', 'alternatives'];
    default:
      return baseKeywords;
  }
}

function generateOgImage(props: MetaHeadProps): string {
  if (props.customImage) return props.customImage;

  // In production, you could use a dynamic OG image generator
  // For now, return page-type specific defaults
  switch (props.pageType) {
    case 'banned':
      return `${SITE_URL}/images/og-banned.jpg`;
    case 'supplement':
      return `${SITE_URL}/images/og-supplement.jpg`;
    case 'medicine':
      return `${SITE_URL}/images/og-medicine.jpg`;
    case 'comparison':
      return `${SITE_URL}/images/og-comparison.jpg`;
    default:
      return DEFAULT_OG_IMAGE;
  }
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function MetaHead(props: MetaHeadProps) {
  const title = generateTitle(props);
  const description = generateDescription(props);
  const canonicalUrl = generateCanonicalUrl(props);
  const keywords = generateKeywords(props);
  const ogImage = generateOgImage(props);

  // Determine robots directive
  // All content pages should use 'index, follow' to support pillar-cluster SEO strategy
  // Affiliate links should use rel="nofollow sponsored" individually, not page-wide nofollow
  const robotsContent = props.noIndex 
    ? 'noindex, nofollow' 
    : 'index, follow';

  return (
    <Head>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      <meta name="robots" content={robotsContent} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="article" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Additional SEO */}
      <meta name="author" content={SITE_NAME} />
      <meta name="publisher" content={SITE_NAME} />
      <meta name="copyright" content={`© ${CURRENT_YEAR} ${SITE_NAME}`} />
      
      {/* Medical/Health specific */}
      {(props.pageType === 'banned' || props.pageType === 'supplement' || props.pageType === 'medicine') && (
        <>
          <meta name="medical-audience" content="consumer" />
          <meta name="content-type" content="educational" />
        </>
      )}

      {/* Article metadata for dated content */}
      <meta property="article:published_time" content={new Date().toISOString()} />
      <meta property="article:modified_time" content={new Date().toISOString()} />
      <meta property="article:section" content="Health" />
      {keywords.slice(0, 5).map((tag, i) => (
        <meta key={i} property="article:tag" content={tag} />
      ))}
    </Head>
  );
}

export default MetaHead;
