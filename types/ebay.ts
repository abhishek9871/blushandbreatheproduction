// eBay Beauty Product Types

export interface EbayPrice {
  value: number;
  currency: string;
}

export interface EbayProductSummary {
  id: string;
  title: string;
  price: EbayPrice;
  imageUrl: string;
  condition: string;
  webUrl: string;
}

export interface EbaySearchPagination {
  page: number;
  pageSize: number;
  total: number;
  hasNextPage: boolean;
}

export interface EbayRefinementValue {
  value: string;
  count: number;
}

export interface EbayAspectRefinement {
  name: string;
  values: EbayRefinementValue[];
}

export interface EbaySearchRefinements {
  conditions: EbayRefinementValue[];
  aspects: EbayAspectRefinement[];
}

export interface EbaySearchResponse {
  items: EbayProductSummary[];
  pagination: EbaySearchPagination;
  refinements: EbaySearchRefinements;
}

export interface EbaySearchParams {
  q?: string;
  category?: 'all' | 'makeup' | 'skincare' | 'hair' | 'fragrance' | 'nails';
  sort?: 'best' | 'priceAsc' | 'priceDesc' | 'newest';
  minPrice?: number;
  maxPrice?: number;
  condition?: 'new' | 'used' | 'refurbished';
  page?: number;
  pageSize?: number;
}

export interface EbaySeller {
  username: string;
  feedbackPercentage: number;
  feedbackScore: number;
}

export interface EbayProductDetail {
  id: string;
  title: string;
  price: EbayPrice;
  condition: string;
  images: string[];
  shortDescription: string;
  itemSpecifics: Record<string, string>;
  webUrl: string;
  seller: EbaySeller;
}
