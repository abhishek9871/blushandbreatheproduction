/**
 * BuyPageSchema Component
 * 
 * Generates Schema.org structured data for buy pages.
 * Includes Article, FAQPage, Product, Review, Video, and SoftwareApplication schemas.
 */

import React from 'react';
import Head from 'next/head';
import type { BuyPage } from '@/types';

const SITE_URL = 'https://www.blushandbreath.com';

// Affiliate product type for berberine products
interface AffiliateProduct {
  id: string;
  name: string;
  shortName: string;
  brand: string;
  description: string;
  price: number;
  originalPrice?: number;
  currency: string;
  affiliateUrl: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  badges?: string[];
  isTopPick?: boolean;
  isBestValue?: boolean;
}

interface BuyPageSchemaProps {
  page: BuyPage;
  pageUrl: string;
  datePublished: string;
  dateModified: string;
  /** Affiliate products for legal supplement pages (berberine) */
  affiliateProducts?: AffiliateProduct[];
}

export default function BuyPageSchema({
  page,
  pageUrl,
  datePublished,
  dateModified,
  affiliateProducts = [],
}: BuyPageSchemaProps) {
  // Check if this is a berberine/legal product page
  const isBerberinePage = page.slug.includes('berberine');
  
  // Article Schema - Using 'Article' for Google rich results support
  // Note: MedicalWebPage is not supported by Google for Article rich results
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': pageUrl,
    headline: page.title,
    description: page.metaDescription,
    image: `${SITE_URL}/images/og-buy-${page.slug}.jpg`,
    url: pageUrl,
    datePublished,
    dateModified,
    author: {
      '@type': 'Organization',
      name: 'Blush & Breathe',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
    publisher: {
      '@type': 'Organization',
      name: 'Blush & Breathe',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': pageUrl,
    },
    articleSection: 'Health & Fitness',
    keywords: page.keywords.join(', '),
    wordCount: page.wordCount,
    // Only include 'about' for banned substance pages (DMAA/Clenbuterol)
    // For berberine, products are defined separately with proper Product schemas
    ...(isBerberinePage ? {} : {
      about: {
        '@type': 'ChemicalSubstance',
        name: page.slug.includes('clenbuterol') ? 'Clenbuterol' : 'DMAA (1,3-Dimethylamylamine)',
        alternateName: page.slug.includes('clenbuterol') 
          ? ['Clenbuterol Hydrochloride', 'Clen'] 
          : ['Methylhexanamine', 'DMAA', '1,3-DMAA'],
        description: 'Banned dietary supplement ingredient',
      },
    }),
    mentions: page.medicalSources.map(source => ({
      '@type': 'MedicalStudy',
      name: source.title,
      url: source.url,
    })),
    hasPart: page.sections.map((section, index) => ({
      '@type': 'WebPageElement',
      name: section.title,
      cssSelector: `#${section.id}`,
      position: index + 1,
    })),
  };

  // FAQ Schema for featured snippets
  const faqSchema = page.faqs && page.faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: page.faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  } : null;

  // SoftwareApplication Schema for calculator (only for DMAA/Clenbuterol pages with calculator)
  const substanceName = page.slug.includes('clenbuterol') ? 'Clenbuterol' : 'DMAA';
  const calculatorSchema = (page.hasCalculator && !isBerberinePage) ? {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: `${substanceName} India Customs Risk Calculator`,
    applicationCategory: 'HealthApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
    },
    description: `Calculate your ${substanceName} import risk and potential customs penalties for India.`,
    featureList: [
      'Port-specific seizure rates',
      'Order value risk assessment',
      'Penalty estimation',
      'Legal alternative recommendations',
    ],
  } : null;

  // BreadcrumbList Schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Health',
        item: `${SITE_URL}/health`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Buy Guides',
        item: `${SITE_URL}/buy`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: page.title,
        item: pageUrl,
      },
    ],
  };

  // Product Schemas for alternatives (DMAA/Clenbuterol pages)
  const productSchemas = !isBerberinePage ? page.alternatives
    .filter(alt => alt.isTopPick)
    .map(product => ({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      image: product.image || `${SITE_URL}/images/products/${product.id}.jpg`,
      brand: {
        '@type': 'Brand',
        name: product.brand,
      },
      description: `Legal alternative to ${product.alternativeFor}. ${product.pros.join('. ')}.`,
      offers: {
        '@type': 'Offer',
        price: product.price,
        priceCurrency: 'INR',
        availability: 'https://schema.org/InStock',
        priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      aggregateRating: product.rating ? {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        bestRating: 5,
        worstRating: 1,
        reviewCount: product.reviewCount || 100,
      } : undefined,
    })) : [];

  // Affiliate Product Schemas for Berberine page (all 5 products)
  const affiliateProductSchemas = affiliateProducts.map(product => ({
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${pageUrl}#${product.id}`,
    name: product.name,
    image: product.imageUrl,
    description: product.description,
    brand: {
      '@type': 'Brand',
      name: product.brand,
    },
    sku: product.id,
    offers: {
      '@type': 'Offer',
      url: product.affiliateUrl,
      price: product.price,
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      seller: {
        '@type': 'Organization',
        name: 'Amazon India',
      },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      bestRating: 5,
      worstRating: 1,
      reviewCount: product.reviewCount,
    },
    review: {
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: product.rating,
        bestRating: 5,
      },
      author: {
        '@type': 'Organization',
        name: 'Blush & Breathe',
      },
      reviewBody: product.isTopPick 
        ? `Our top pick for berberine supplements in India. ${product.description}`
        : product.isBestValue
        ? `Best value berberine supplement. ${product.description}`
        : `Quality berberine supplement from ${product.brand}. ${product.description}`,
    },
  }));

  // Video Schemas for embedded YouTube videos (berberine page)
  const videoSchemas = isBerberinePage ? [
    {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: 'Why Doctors Recommend Berberine Supplements',
      description: 'Expert reviews on berberine supplements for weight loss and blood sugar control in India',
      thumbnailUrl: 'https://img.youtube.com/vi/berberine-review/hqdefault.jpg',
      uploadDate: datePublished,
      contentUrl: `${pageUrl}#top-pick-videos`,
      embedUrl: 'https://www.youtube.com/embed/',
      duration: 'PT10M',
      publisher: {
        '@type': 'Organization',
        name: 'Blush & Breathe',
        logo: {
          '@type': 'ImageObject',
          url: `${SITE_URL}/logo.png`,
        },
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: 'Berberine for Weight Loss & Blood Sugar Control',
      description: 'Learn how berberine helps with weight management and metabolic health',
      thumbnailUrl: 'https://img.youtube.com/vi/berberine-weight-loss/hqdefault.jpg',
      uploadDate: datePublished,
      contentUrl: `${pageUrl}#berberine-education`,
      embedUrl: 'https://www.youtube.com/embed/',
      duration: 'PT8M',
      publisher: {
        '@type': 'Organization',
        name: 'Blush & Breathe',
        logo: {
          '@type': 'ImageObject',
          url: `${SITE_URL}/logo.png`,
        },
      },
    },
  ] : [];

  return (
    <Head>
      {/* Article Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      {/* FAQ Schema */}
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      {/* Calculator Schema */}
      {calculatorSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(calculatorSchema) }}
        />
      )}

      {/* Breadcrumb Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Product Schemas (DMAA/Clenbuterol alternatives) */}
      {productSchemas.map((schema, index) => (
        <script
          key={`product-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      {/* Affiliate Product Schemas (Berberine products) */}
      {affiliateProductSchemas.map((schema, index) => (
        <script
          key={`affiliate-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      {/* Video Schemas */}
      {videoSchemas.map((schema, index) => (
        <script
          key={`video-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </Head>
  );
}
