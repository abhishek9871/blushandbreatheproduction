/**
 * Buy Page Types for Transactional/Conversion Pages
 * 
 * Used for pages like /buy/dmaa-india that focus on
 * buyer intent with conversion optimization.
 */

import type { FAQItem, Citation } from './substance';

// ═══════════════════════════════════════════════════════════════════
// MEDICAL CITATION TYPES
// ═══════════════════════════════════════════════════════════════════

export interface MedicalSource {
  id: string;
  sourceType: 'fda' | 'pubmed' | 'fssai' | 'wada' | 'who' | 'case_report' | 'regulatory';
  title: string;
  date: string;
  authority: string;
  keyQuote: string;
  citationText: string;
  url: string;
  relevanceToIndia?: string;
}

// ═══════════════════════════════════════════════════════════════════
// SUPPLIER WARNING TYPES
// ═══════════════════════════════════════════════════════════════════

export interface SupplierWarning {
  id: string;
  name: string;
  location: string;
  gstStatus: 'verified' | 'invalid' | 'pending';
  gstNumber?: string;
  yearsInBusiness: number;
  pricePerKg: number;
  moq: string;
  trustScore: number; // 0-10
  riskLevel: 'low' | 'moderate' | 'high' | 'extreme';
  scamReports: number;
  redFlags: string[];
  complaintsUrl?: string;
  caseNumber?: string;
  testimonialQuote?: string;
}

// ═══════════════════════════════════════════════════════════════════
// TESTIMONIAL TYPES
// ═══════════════════════════════════════════════════════════════════

export interface UserTestimonial {
  id: string;
  username: string;
  platform: 'reddit' | 'quora' | 'trustpilot' | 'consumer_forum' | 'youtube' | 'forum';
  date: string;
  quote: string;
  sourceUrl: string;
  upvotes?: number;
  verified?: boolean;
  location?: string;
  lossAmount?: string;
  outcome?: 'scammed' | 'switched' | 'warning' | 'success';
}

// ═══════════════════════════════════════════════════════════════════
// CALCULATOR DATA TYPES
// ═══════════════════════════════════════════════════════════════════

export interface PortRiskData {
  name: string;
  code: string;
  seizureRate: number; // percentage
  primaryRiskFactor: string;
}

export interface ValueRiskTier {
  minValue: number;
  maxValue: number;
  seizureRate: number;
  reasoning: string;
}

export interface DeclarationRiskData {
  type: string;
  seizureRate: number;
  notes: string;
}

export interface CourierRiskData {
  name: string;
  seizureRate: number;
  inspectionLikelihood: string;
}

export interface PenaltyData {
  violationType: string;
  minPenalty: number;
  maxPenalty: number;
  legalBasis: string;
}

export interface CalculatorConfig {
  ports: PortRiskData[];
  valueTiers: ValueRiskTier[];
  declarations: DeclarationRiskData[];
  couriers: CourierRiskData[];
  penalties: PenaltyData[];
  quantityThreshold: number; // grams
  quantityRiskBonus: number; // percentage added if over threshold
}

// ═══════════════════════════════════════════════════════════════════
// ALTERNATIVE PRODUCT TYPES
// ═══════════════════════════════════════════════════════════════════

export interface AlternativeProduct {
  id: string;
  name: string;
  brand: string;
  tier: 'preworkout' | 'ayurvedic' | 'nootropic' | 'sarms_alternative';
  alternativeFor: string;
  keyIngredients: string[];
  caffeine?: number; // mg
  price: number; // INR
  pricePerServing?: number;
  servings?: number;
  rating: number;
  reviewCount?: number;
  effectScore: number; // 1-10 vs DMAA
  hasCOD: boolean;
  deliveryDays: string;
  whereToBuy: string[];
  affiliateProgram: string;
  commission: string;
  isTopPick?: boolean;
  pros: string[];
  cons: string[];
}

export interface EffectComparison {
  effect: string;
  dmaa: number;
  dmha: number;
  caffeine: number;
  muscleblaze: number;
  natural: number;
}

export interface SideEffectComparison {
  effect: string;
  dmaa: 'high' | 'moderate' | 'low' | 'none';
  dmha: 'high' | 'moderate' | 'low' | 'none';
  natural: 'high' | 'moderate' | 'low' | 'none';
}

// ═══════════════════════════════════════════════════════════════════
// BUY PAGE SECTION TYPES
// ═══════════════════════════════════════════════════════════════════

export interface BuyPageSection {
  id: string;
  title: string;
  content: string; // HTML content
  keywordTarget?: string;
  featuredSnippetOptimized?: boolean;
}

export interface LegalStatusByCountry {
  country: string;
  status: 'banned' | 'legal' | 'gray_area';
  authority: string;
  penalty: string;
}

// ═══════════════════════════════════════════════════════════════════
// FEATURED PRODUCT TYPE (for promoted alternatives)
// ═══════════════════════════════════════════════════════════════════

export interface FeaturedProduct {
  id: string;
  name: string;
  brand: string;
  tagline: string;
  price: number;
  originalPrice?: number;
  servings: number;
  pricePerServing: number;
  rating: number;
  reviewCount: number;
  images: {
    main: string;
    gallery: string[];
    badges?: string[];
  };
  highlights: {
    icon: string;
    title: string;
    description: string;
  }[];
  ingredients: {
    name: string;
    amount: string;
    benefit: string;
  }[];
  benefits: string[];
  guarantees: string[];
  buyLink: string;
  amazonLink?: string;
  officialLink?: string;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN BUY PAGE TYPE
// ═══════════════════════════════════════════════════════════════════

export interface BuyPage {
  id: string;
  slug: string;
  substanceSlug: string; // links to banned substance
  
  // SEO Metadata
  title: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  
  // Hero Section
  heroTitle: string;
  heroSubtitle: string;
  quickStats: {
    legalStatus: string;
    seizureRisk: string;
    healthRisk: string;
    sportsBan: string;
  };
  
  // Content Sections
  introduction: string;
  sections: BuyPageSection[];
  conclusion: string;
  
  // Data Elements
  medicalSources: MedicalSource[];
  supplierWarnings: SupplierWarning[];
  testimonials: UserTestimonial[];
  calculatorConfig: CalculatorConfig;
  featuredProduct?: FeaturedProduct; // Promoted product showcase
  alternatives: AlternativeProduct[];
  legalStatusByCountry: LegalStatusByCountry[];
  effectComparison: EffectComparison[];
  sideEffectComparison: SideEffectComparison[];
  
  // FAQ & Schema
  faqs: FAQItem[];
  citations: Citation[];
  
  // Related Pages
  relatedPillarPage: string; // /banned/dmaa
  relatedPages: {
    slug: string;
    title: string;
    type: 'banned' | 'supplement' | 'compare' | 'guide';
  }[];
  
  // Metadata
  publishedDate: string;
  modifiedDate: string;
  readingTime: number;
  wordCount: number;
  
  // Feature Flags
  hasCalculator: boolean;
  hasTestimonials: boolean;
  hasVideo: boolean;
}

export interface BuyPagesData {
  pages: BuyPage[];
}
