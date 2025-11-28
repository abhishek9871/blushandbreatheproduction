/**
 * SchemaMarkup Component - JSON-LD Structured Data Generator
 * 
 * Generates Schema.org compliant JSON-LD for Google Rich Snippets.
 * Supports Drug, DietarySupplement, MedicalWebPage, Product, and FAQPage schemas.
 */

import Head from 'next/head';
import type { BannedSubstance, LegalSupplement, MedicineInfo, AffiliateProduct, PubMedArticle } from '@/types';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

type SchemaType = 'Drug' | 'DietarySupplement' | 'MedicalWebPage' | 'Product' | 'FAQPage' | 'WebPage';

interface FAQItem {
  question: string;
  answer: string;
}

interface SchemaMarkupProps {
  type: SchemaType;
  // Data based on schema type
  bannedSubstance?: BannedSubstance;
  supplement?: LegalSupplement;
  medicine?: MedicineInfo;
  product?: AffiliateProduct;
  faqItems?: FAQItem[];
  // Citation support for research articles
  citations?: PubMedArticle[];
  // Page metadata
  pageUrl: string;
  pageTitle: string;
  pageDescription: string;
  datePublished?: string;
  dateModified?: string;
}

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const SITE_URL = 'https://blushandbreathe.com';
const SITE_NAME = 'Blush & Breathe';
const ORGANIZATION_LOGO = `${SITE_URL}/images/logo.png`;

// ═══════════════════════════════════════════════════════════════════
// SCHEMA GENERATORS
// ═══════════════════════════════════════════════════════════════════

/**
 * Generate Organization schema (used as publisher)
 */
function generateOrganizationSchema() {
  return {
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: ORGANIZATION_LOGO,
    },
  };
}

/**
 * Generate MedicalWebPage schema for banned substance pages
 */
function generateMedicalWebPageSchema(
  substance: BannedSubstance,
  pageUrl: string,
  datePublished: string,
  dateModified: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    '@id': pageUrl,
    name: substance.metaTitle,
    headline: `${substance.name} - Risks, Side Effects & Legal Status`,
    description: substance.metaDescription,
    url: pageUrl,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': pageUrl,
    },
    datePublished,
    dateModified,
    publisher: generateOrganizationSchema(),
    author: generateOrganizationSchema(),
    about: {
      '@type': 'Drug',
      name: substance.name,
      alternateName: substance.alternativeNames,
      description: substance.description,
      legalStatus: {
        '@type': 'DrugLegalStatus',
        applicableLocation: {
          '@type': 'Country',
          name: 'United States',
        },
      },
      warning: substance.sideEffects.join('. '),
      adverseOutcome: substance.healthRisks.map(r => r.description).join('. '),
    },
    medicalAudience: {
      '@type': 'MedicalAudience',
      audienceType: 'Consumer',
    },
    specialty: 'Pharmacology',
    keywords: substance.keywords.join(', '),
  };
}

/**
 * Generate DietarySupplement schema for supplement pages
 */
function generateDietarySupplementSchema(
  supplement: LegalSupplement,
  pageUrl: string,
  datePublished: string,
  dateModified: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'DietarySupplement',
    '@id': pageUrl,
    name: supplement.name,
    alternateName: supplement.alternativeNames,
    description: supplement.description,
    url: pageUrl,
    
    // Dosage information
    recommendedIntake: {
      '@type': 'RecommendedDoseSchedule',
      frequency: supplement.dosage.timing,
      doseValue: supplement.dosage.recommended,
    },
    
    // Safety information
    safetyConsideration: supplement.sideEffects.join('. '),
    warning: supplement.contraindications.join('. '),
    interactingDrug: supplement.drugInteractions.map(drug => ({
      '@type': 'Drug',
      name: drug,
    })),
    
    // Regulatory status
    legalStatus: {
      '@type': 'DrugLegalStatus',
      applicableLocation: {
        '@type': 'Country',
        name: 'United States',
      },
      description: `FDA Status: ${supplement.fdaStatus.toUpperCase()}`,
    },
    
    // Benefits/Uses
    relevantSpecialty: supplement.category,
    recognizingAuthority: supplement.qualityCertifications.map(cert => ({
      '@type': 'Organization',
      name: cert,
    })),
    
    // Metadata
    datePublished,
    dateModified,
    publisher: generateOrganizationSchema(),
  };
}

/**
 * Generate Drug schema for medicine pages
 */
function generateDrugSchema(
  medicine: MedicineInfo,
  pageUrl: string,
  dateModified: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Drug',
    '@id': pageUrl,
    name: medicine.brandName,
    alternateName: [medicine.genericName, ...medicine.alternativeNames],
    description: medicine.label.indicationsAndUsage.slice(0, 500),
    url: pageUrl,
    
    // Drug classification
    drugClass: medicine.drugClass.map(cls => ({
      '@type': 'DrugClass',
      name: cls,
    })),
    
    // Active ingredients
    activeIngredient: medicine.activeIngredients.map(ing => ({
      '@type': 'DrugStrength',
      activeIngredient: ing.name,
      strengthValue: ing.strength,
      strengthUnit: ing.unit,
    })),
    
    // Dosage forms
    dosageForm: medicine.dosageForms,
    administrationRoute: medicine.routesOfAdministration,
    
    // Manufacturer
    manufacturer: {
      '@type': 'Organization',
      name: medicine.manufacturer.name,
    },
    
    // Regulatory
    legalStatus: {
      '@type': 'DrugLegalStatus',
      applicableLocation: {
        '@type': 'Country',
        name: 'United States',
      },
      description: medicine.marketStatus === 'prescription' 
        ? 'Prescription only' 
        : 'Over the counter',
    },
    
    // Warnings and interactions
    warning: medicine.label.warnings.slice(0, 500),
    interactingDrug: medicine.label.drugInteractions.slice(0, 300),
    adverseOutcome: medicine.label.adverseReactions.slice(0, 500),
    
    // Metadata
    dateModified,
    publisher: generateOrganizationSchema(),
  };
}

/**
 * Generate Product schema for affiliate products
 */
function generateProductSchema(
  product: AffiliateProduct,
  pageUrl: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${pageUrl}#product-${product.id}`,
    name: product.name,
    description: product.description,
    brand: {
      '@type': 'Brand',
      name: product.brand,
    },
    sku: product.id,
    
    // Offers
    offers: {
      '@type': 'Offer',
      url: product.affiliateUrl,
      priceCurrency: product.currency || 'USD',
      price: product.price,
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability: product.inStock 
        ? 'https://schema.org/InStock' 
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: product.brand,
      },
    },
    
    // Reviews/Ratings
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
      bestRating: 5,
      worstRating: 1,
    },
    
    // Product attributes
    category: product.category,
    ...(product.certifications.length > 0 && {
      award: product.certifications.join(', '),
    }),
  };
}

/**
 * Generate FAQPage schema
 */
function generateFAQSchema(faqItems: FAQItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

/**
 * Generate BreadcrumbList schema
 */
function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Generate ScholarlyArticle citations from PubMed articles
 * This adds scientific credibility signals for E-E-A-T SEO
 */
function generateCitationSchema(articles: PubMedArticle[]) {
  return articles.map(article => ({
    '@type': 'ScholarlyArticle',
    '@id': article.url,
    name: article.title,
    headline: article.title,
    abstract: article.abstract,
    datePublished: article.pubDate,
    url: article.url,
    identifier: {
      '@type': 'PropertyValue',
      propertyID: 'PMID',
      value: article.pmid,
    },
    ...(article.doi && {
      sameAs: `https://doi.org/${article.doi}`,
    }),
    author: article.authors.map(author => ({
      '@type': 'Person',
      name: author,
    })),
    publisher: {
      '@type': 'Organization',
      name: article.journal,
    },
    isPartOf: {
      '@type': 'PublicationIssue',
      isPartOf: {
        '@type': 'Periodical',
        name: article.journal,
      },
    },
  }));
}

// ═══════════════════════════════════════════════════════════════════
// AUTO-GENERATE FAQ FROM CONTENT
// ═══════════════════════════════════════════════════════════════════

function generateFAQFromBannedSubstance(substance: BannedSubstance): FAQItem[] {
  return [
    {
      question: `Is ${substance.name} legal?`,
      answer: `${substance.name} is ${substance.legalStatus.includes('banned') ? 'banned' : 'restricted'} in the United States. It has been prohibited by ${substance.bannedBy.join(', ')}. ${substance.whyBanned}`,
    },
    {
      question: `What are the side effects of ${substance.name}?`,
      answer: `Common side effects of ${substance.name} include: ${substance.sideEffects.slice(0, 5).join(', ')}. It has a ${substance.overdoseRisk} risk of overdose and ${substance.addictionPotential} addiction potential.`,
    },
    {
      question: `What are safe alternatives to ${substance.name}?`,
      answer: `Legal alternatives to ${substance.name} include: ${substance.legalAlternatives.map(s => s.replace(/-/g, ' ')).join(', ')}. These provide similar benefits without the legal and health risks.`,
    },
    {
      question: `Why was ${substance.name} banned?`,
      answer: substance.whyBanned,
    },
  ];
}

function generateFAQFromSupplement(supplement: LegalSupplement): FAQItem[] {
  return [
    {
      question: `What is ${supplement.name} good for?`,
      answer: `${supplement.name} benefits include: ${supplement.benefits.slice(0, 4).join(', ')}. ${supplement.mechanism}`,
    },
    {
      question: `How much ${supplement.name} should I take?`,
      answer: `The recommended dosage for ${supplement.name} is ${supplement.dosage.recommended}. Take it ${supplement.dosage.timing}. ${supplement.dosage.withFood ? 'Best taken with food.' : 'Can be taken on an empty stomach.'}`,
    },
    {
      question: `Is ${supplement.name} safe?`,
      answer: `${supplement.name} has a ${supplement.safetyRating} safety rating. Potential side effects include: ${supplement.sideEffects.join(', ')}. ${supplement.contraindications.length > 0 ? `Avoid if you have: ${supplement.contraindications.join(', ')}.` : ''}`,
    },
    {
      question: `Is ${supplement.name} FDA approved?`,
      answer: `${supplement.name} has ${supplement.fdaStatus.toUpperCase()} status with the FDA. Quality certifications include: ${supplement.qualityCertifications.join(', ') || 'varies by brand'}.`,
    },
  ];
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function SchemaMarkup(props: SchemaMarkupProps) {
  const {
    type,
    bannedSubstance,
    supplement,
    medicine,
    product,
    faqItems,
    citations,
    pageUrl,
    pageTitle,
    pageDescription,
    datePublished = new Date().toISOString(),
    dateModified = new Date().toISOString(),
  } = props;

  const schemas: object[] = [];

  // Add primary schema based on type
  switch (type) {
    case 'MedicalWebPage':
      if (bannedSubstance) {
        // Generate main schema with citation support
        const medicalSchema = generateMedicalWebPageSchema(
          bannedSubstance,
          pageUrl,
          datePublished,
          dateModified
        );
        
        // Add citations if provided (for E-E-A-T SEO)
        if (citations && citations.length > 0) {
          (medicalSchema as any).citation = generateCitationSchema(citations);
        }
        
        schemas.push(medicalSchema);
        // Auto-generate FAQ
        schemas.push(generateFAQSchema(generateFAQFromBannedSubstance(bannedSubstance)));
        // Add breadcrumbs
        schemas.push(generateBreadcrumbSchema([
          { name: 'Home', url: SITE_URL },
          { name: 'Health', url: `${SITE_URL}/health` },
          { name: 'Banned Substances', url: `${SITE_URL}/banned` },
          { name: bannedSubstance.name, url: pageUrl },
        ]));
      }
      break;

    case 'DietarySupplement':
      if (supplement) {
        // Generate main schema with citation support
        const supplementSchema = generateDietarySupplementSchema(
          supplement,
          pageUrl,
          datePublished,
          dateModified
        );
        
        // Add citations if provided (for E-E-A-T SEO)
        if (citations && citations.length > 0) {
          (supplementSchema as any).citation = generateCitationSchema(citations);
        }
        
        schemas.push(supplementSchema);
        // Auto-generate FAQ
        schemas.push(generateFAQSchema(generateFAQFromSupplement(supplement)));
        // Add breadcrumbs
        schemas.push(generateBreadcrumbSchema([
          { name: 'Home', url: SITE_URL },
          { name: 'Health', url: `${SITE_URL}/health` },
          { name: 'Supplements', url: `${SITE_URL}/supplements` },
          { name: supplement.name, url: pageUrl },
        ]));
      }
      break;

    case 'Drug':
      if (medicine) {
        schemas.push(generateDrugSchema(medicine, pageUrl, dateModified));
        // Add breadcrumbs
        schemas.push(generateBreadcrumbSchema([
          { name: 'Home', url: SITE_URL },
          { name: 'Health', url: `${SITE_URL}/health` },
          { name: 'Medicine', url: `${SITE_URL}/medicine` },
          { name: medicine.brandName, url: pageUrl },
        ]));
      }
      break;

    case 'Product':
      if (product) {
        schemas.push(generateProductSchema(product, pageUrl));
      }
      break;

    case 'FAQPage':
      if (faqItems && faqItems.length > 0) {
        schemas.push(generateFAQSchema(faqItems));
      }
      break;

    case 'WebPage':
    default:
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        '@id': pageUrl,
        name: pageTitle,
        description: pageDescription,
        url: pageUrl,
        publisher: generateOrganizationSchema(),
        datePublished,
        dateModified,
      });
  }

  if (schemas.length === 0) {
    return null;
  }

  return (
    <Head>
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </Head>
  );
}

export default SchemaMarkup;

// ═══════════════════════════════════════════════════════════════════
// EXPORTS FOR INDIVIDUAL SCHEMAS
// ═══════════════════════════════════════════════════════════════════

export {
  generateMedicalWebPageSchema,
  generateDietarySupplementSchema,
  generateDrugSchema,
  generateProductSchema,
  generateFAQSchema,
  generateBreadcrumbSchema,
  generateCitationSchema,
};
