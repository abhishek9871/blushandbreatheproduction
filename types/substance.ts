/**
 * Substance Education Platform - Type Definitions
 * 
 * These types support the harm-reduction educational content about
 * banned/restricted substances with safe legal alternatives.
 */

// ═══════════════════════════════════════════════════════════════════
// BANNED SUBSTANCES
// ═══════════════════════════════════════════════════════════════════

export type LegalStatus = 
  | 'banned_worldwide'
  | 'banned_usa'
  | 'prescription_only'
  | 'controlled_substance'
  | 'legal_unregulated'
  | 'state_restricted'
  | 'fda_warning';

export type RiskLevel = 'low' | 'moderate' | 'high' | 'severe' | 'unknown';

export interface HealthRisk {
  category: string;
  description: string;
  severity: RiskLevel;
  sources: string[];
}

export interface BannedSubstance {
  id: string;
  slug: string;
  name: string;
  alternativeNames: string[];
  category: 'stimulant' | 'sarm' | 'prohormone' | 'nootropic' | 'peptide' | 'other';
  
  // Legal Information
  legalStatus: LegalStatus;
  legalStatusDetails: string;
  bannedDate?: string;
  bannedBy: string[]; // e.g., ['FDA', 'WADA', 'DEA']
  stateRestrictions?: Record<string, string>; // state -> restriction details
  
  // Health & Safety
  healthRisks: HealthRisk[];
  sideEffects: string[];
  contraindications: string[];
  overdoseRisk: RiskLevel;
  addictionPotential: RiskLevel;
  
  // Description & Education
  description: string;
  mechanism: string; // How it works
  history: string;
  whyBanned: string;
  
  // Alternatives
  legalAlternatives: string[]; // slugs of legal supplements
  
  // SEO & Metadata
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// ═══════════════════════════════════════════════════════════════════
// LEGAL SUPPLEMENTS
// ═══════════════════════════════════════════════════════════════════

export type SupplementCategory = 
  | 'amino_acid'
  | 'vitamin'
  | 'mineral'
  | 'herb'
  | 'adaptogen'
  | 'nootropic'
  | 'protein'
  | 'preworkout'
  | 'fat_burner'
  | 'sleep_aid'
  | 'other';

export interface DosageInfo {
  recommended: string;
  minimum: string;
  maximum: string;
  timing: string;
  withFood: boolean;
  notes?: string;
}

export interface ScientificEvidence {
  claim: string;
  evidenceLevel: 'strong' | 'moderate' | 'limited' | 'preliminary' | 'none';
  studies: number;
  summary: string;
  sources: string[];
}

export interface LegalSupplement {
  id: string;
  slug: string;
  name: string;
  alternativeNames: string[];
  category: SupplementCategory;
  
  // Product Information
  description: string;
  benefits: string[];
  mechanism: string;
  
  // Dosage & Usage
  dosage: DosageInfo;
  forms: string[]; // e.g., ['capsule', 'powder', 'liquid']
  
  // Safety
  sideEffects: string[];
  contraindications: string[];
  drugInteractions: string[];
  safetyRating: RiskLevel;
  
  // Scientific Backing
  scientificEvidence: ScientificEvidence[];
  
  // Regulatory
  fdaStatus: 'gras' | 'ndi' | 'dietary_ingredient' | 'drug' | 'unknown';
  qualityCertifications: string[]; // e.g., ['NSF', 'USP', 'GMP']
  
  // Alternatives (replaces these banned substances)
  replacementFor: string[]; // slugs of banned substances
  
  // Affiliate & Products
  affiliateProducts: string[]; // product IDs
  
  // SEO & Metadata
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// ═══════════════════════════════════════════════════════════════════
// MEDICINE / PHARMACEUTICAL
// ═══════════════════════════════════════════════════════════════════

export interface ActiveIngredient {
  name: string;
  strength: string;
  unit: string;
}

export interface Manufacturer {
  name: string;
  country?: string;
}

export interface DrugLabel {
  indicationsAndUsage: string;
  dosageAndAdministration: string;
  warnings: string;
  adverseReactions: string;
  drugInteractions: string;
  contraindications: string;
  overdosage?: string;
  clinicalPharmacology?: string;
}

export interface MedicineInfo {
  id: string;
  slug: string;
  
  // Basic Info
  brandName: string;
  genericName: string;
  alternativeNames: string[];
  
  // Classification
  drugClass: string[];
  pharmacologicClass: string[];
  scheduleClass?: string; // DEA schedule if controlled
  
  // Ingredients
  activeIngredients: ActiveIngredient[];
  inactiveIngredients?: string[];
  
  // Forms & Routes
  dosageForms: string[];
  routesOfAdministration: string[];
  
  // Manufacturer
  manufacturer: Manufacturer;
  ndcCodes: string[]; // National Drug Codes
  
  // Label Information (from OpenFDA)
  label: DrugLabel;
  
  // Images
  pillImages: string[];
  
  // Regulatory
  fdaApplicationNumber?: string;
  approvalDate?: string;
  marketStatus: 'prescription' | 'otc' | 'discontinued' | 'recalled' | 'research';
  
  // RxNorm Data
  rxcui?: string; // RxNorm Concept Unique Identifier
  rxnormSynonyms?: string[];
  
  // SEO & Metadata
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  
  // Indian Market Data (optional)
  indianPrice?: number; // Price in INR (₹)
  indianPackSize?: string; // Pack size in India (e.g., "strip of 15 tablets")
  
  // Data Sources
  sources: {
    openFDA?: boolean;
    rxNorm?: boolean;
    dailyMed?: boolean;
    pubChem?: boolean; // NIH chemical compound database
    drugCentral?: boolean; // DrugCentral via MyChem.info
    wikipedia?: boolean; // Wikipedia drug articles
    myUpchar?: boolean; // Indian medicine database (myUpchar.com)
    cdsco?: boolean; // Indian Central Drugs Standard Control Organization
    indianDatabase?: boolean; // Local Indian medicines CSV database
  };
  
  // Timestamps
  lastUpdated: string;
  fetchedAt: string;
}

// ═══════════════════════════════════════════════════════════════════
// DRUG INTERACTIONS
// ═══════════════════════════════════════════════════════════════════

export type InteractionSeverity = 'minor' | 'moderate' | 'major' | 'contraindicated';

export interface DrugInteraction {
  id: string;
  
  // Interacting Items
  drugA: {
    name: string;
    slug: string;
    type: 'medicine' | 'supplement' | 'food' | 'alcohol';
  };
  drugB: {
    name: string;
    slug: string;
    type: 'medicine' | 'supplement' | 'food' | 'alcohol';
  };
  
  // Interaction Details
  severity: InteractionSeverity;
  description: string;
  mechanism?: string;
  clinicalEffects: string[];
  management: string;
  
  // Evidence
  documentation: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
  sources: string[];
  
  // Timestamps
  lastVerified: string;
}

// ═══════════════════════════════════════════════════════════════════
// AFFILIATE PRODUCTS
// ═══════════════════════════════════════════════════════════════════

export type AffiliateNetwork = 
  | 'transparent_labs'
  | 'nootropics_depot'
  | 'amazon'
  | 'iherb'
  | 'bodybuilding_com'
  | 'direct';

export interface AffiliateProduct {
  id: string;
  
  // Product Info
  name: string;
  brand: string;
  description: string;
  
  // Pricing
  price: number;
  currency: string;
  originalPrice?: number; // For showing discounts
  
  // Links
  affiliateUrl: string;
  directUrl: string;
  affiliateNetwork: AffiliateNetwork;
  
  // Commission
  commissionRate: number; // e.g., 0.10 for 10%
  commissionType: 'percentage' | 'flat';
  
  // Product Details
  servingSize: string;
  servings: number;
  dosagePerServing: string;
  
  // Images
  imageUrl: string;
  thumbnailUrl: string;
  
  // Ratings
  rating: number;
  reviewCount: number;
  
  // Categorization
  category: SupplementCategory;
  tags: string[];
  
  // Related Content
  relatedSupplements: string[]; // supplement slugs
  replacementFor: string[]; // banned substance slugs
  
  // Quality
  thirdPartyTested: boolean;
  certifications: string[];
  
  // Availability
  inStock: boolean;
  shipsTo: string[]; // country codes
  
  // Timestamps
  priceUpdatedAt: string;
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════════
// COMPARISON PAGES
// ═══════════════════════════════════════════════════════════════════

export interface ComparisonItem {
  slug: string;
  name: string;
  type: 'banned' | 'supplement' | 'medicine';
  
  // Comparison Attributes
  effectiveness: number; // 1-10 scale
  safety: number; // 1-10 scale
  legality: number; // 1-10 scale
  cost: number; // 1-10 scale (10 = cheapest)
  availability: number; // 1-10 scale
  
  // Key Points
  pros: string[];
  cons: string[];
  
  // Summary
  summary: string;
  verdict: string;
}

export interface SubstanceComparison {
  id: string;
  slug: string; // e.g., "dmaa-vs-caffeine"
  
  item1: ComparisonItem;
  item2: ComparisonItem;
  
  // Comparison Content
  introduction: string;
  detailedComparison: string;
  winner: 'item1' | 'item2' | 'tie' | 'depends';
  winnerReason: string;
  
  // SEO
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// ═══════════════════════════════════════════════════════════════════
// API RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════════

export interface SubstanceAPIResponse<T> {
  success: boolean;
  data: T | null;
  error?: string;
  source?: string;
  cached?: boolean;
  cachedAt?: string;
}

export interface SubstanceListResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasNextPage: boolean;
  };
  error?: string;
}

// OpenFDA specific response types
export interface OpenFDADrugResult {
  openfda?: {
    brand_name?: string[];
    generic_name?: string[];
    manufacturer_name?: string[];
    product_ndc?: string[];
    rxcui?: string[];
    pharm_class_epc?: string[];
    route?: string[];
  };
  indications_and_usage?: string[];
  dosage_and_administration?: string[];
  warnings?: string[];
  adverse_reactions?: string[];
  drug_interactions?: string[];
  contraindications?: string[];
  overdosage?: string[];
  clinical_pharmacology?: string[];
  active_ingredient?: string[];
  inactive_ingredient?: string[];
  dosage_form?: string[];
}

export interface OpenFDAResponse {
  meta: {
    disclaimer: string;
    terms: string;
    license: string;
    last_updated: string;
    results: {
      skip: number;
      limit: number;
      total: number;
    };
  };
  results: OpenFDADrugResult[];
}

// RxNorm specific response types
export interface RxNormConceptGroup {
  tty: string;
  conceptProperties: {
    rxcui: string;
    name: string;
    synonym?: string;
    tty: string;
    language: string;
    suppress: string;
    umlscui?: string;
  }[];
}

export interface RxNormDrugGroup {
  name: string;
  conceptGroup: RxNormConceptGroup[];
}

export interface RxNormResponse {
  drugGroup: RxNormDrugGroup;
}

// ═══════════════════════════════════════════════════════════════════
// LEGAL & COMPLIANCE
// ═══════════════════════════════════════════════════════════════════

export interface LegalDisclaimer {
  id: string;
  type: 'ftc' | 'fda' | 'medical' | 'affiliate' | 'general';
  title: string;
  content: string;
  required: boolean;
  displayOn: ('banned' | 'supplement' | 'medicine' | 'comparison' | 'all')[];
}

export interface StateRestriction {
  state: string;
  stateCode: string;
  substances: string[]; // slugs
  restrictionType: 'banned' | 'age_restricted' | 'prescription_required' | 'quantity_limited';
  details: string;
  effectiveDate: string;
  source: string;
}

// ═══════════════════════════════════════════════════════════════════
// SEARCH & FILTERING
// ═══════════════════════════════════════════════════════════════════

export interface SubstanceSearchParams {
  query?: string;
  type?: ('banned' | 'supplement' | 'medicine')[];
  category?: string[];
  legalStatus?: LegalStatus[];
  safetyRating?: RiskLevel[];
  page?: number;
  pageSize?: number;
  sortBy?: 'name' | 'popularity' | 'safety' | 'date';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult {
  id: string;
  slug: string;
  name: string;
  type: 'banned' | 'supplement' | 'medicine';
  description: string;
  imageUrl?: string;
  category: string;
  matchScore: number;
}

// ═══════════════════════════════════════════════════════════════════
// SITEMAP & SEO
// ═══════════════════════════════════════════════════════════════════

export interface SubstanceSitemapEntry {
  slug: string;
  type: 'banned' | 'supplement' | 'medicine' | 'comparison';
  lastModified: string;
  changeFrequency: 'daily' | 'weekly' | 'monthly';
  priority: number;
}

// ═══════════════════════════════════════════════════════════════════
// RELATED ARTICLES (Wikipedia, PubMed, Wikimedia Commons)
// ═══════════════════════════════════════════════════════════════════

export interface WikipediaArticle {
  title: string;
  extract: string; // Summary text
  extractHtml?: string; // HTML formatted extract
  // Full article content from Mozilla Readability
  fullContent?: string | null; // Clean HTML of full article
  fullContentMarkdown?: string | null; // Markdown version
  readingTime?: number | null; // Estimated reading time in minutes
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
  originalImage?: {
    source: string;
    width: number;
    height: number;
  };
  url: string;
  pageid: number;
  lastModified?: string;
}

export interface PubMedArticle {
  pmid: string;
  title: string;
  abstract: string;
  authors: string[];
  journal: string;
  pubDate: string;
  year: number;
  doi?: string;
  url: string;
  keywords?: string[];
  meshTerms?: string[];
}

export interface WikimediaImage {
  title: string;
  url: string;
  thumbUrl: string;
  width: number;
  height: number;
  description?: string;
  license?: string;
  artist?: string;
}

export interface SubstanceArticles {
  substanceSlug: string;
  substanceName: string;
  substanceType: 'banned' | 'supplement';
  
  // Wikipedia data (null if not found)
  wikipedia: WikipediaArticle | null;
  
  // PubMed research articles
  pubmed: PubMedArticle[];
  
  // Wikimedia Commons images
  images: WikimediaImage[];
  
  // Metadata
  fetchedAt: string;
  lastUpdated: string;
}

export interface SubstanceArticlesData {
  version: string;
  generatedAt: string;
  articles: Record<string, SubstanceArticles>; // keyed by slug
}
