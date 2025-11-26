/**
 * API Service for Next.js Frontend
 * 
 * This service calls the external Cloudflare Worker backend.
 * All relative `/api/*` paths are replaced with the full external API URL.
 * 
 * Environment Variables (Next.js style):
 * - NEXT_PUBLIC_API_URL: Base URL for Cloudflare Worker (e.g., https://api.yourdomain.com)
 * - NEXT_PUBLIC_YOUTUBE_API_KEY: YouTube Data API key
 */

import type {
  Article,
  Product,
  Video,
  NutritionInfo,
  TipCard,
  Tutorial,
  ApiResourceKey,
  EbaySearchParams,
  EbaySearchResponse,
  EbayProductDetail,
} from '@/types';

// --- API BASE URL (Cloudflare Worker) ---
// Remove trailing slash and ensure HTTPS
const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.yourdomain.com';
const API_BASE_URL = rawApiUrl.replace(/\/$/, '').replace(/^http:/, 'https:');

// --- FETCH OPTIONS (Fix 307 redirects) ---
const defaultFetchOptions: RequestInit = {
  redirect: 'follow',
  headers: {
    'Content-Type': 'application/json',
  },
};

// --- EXTERNAL API KEYS ---
const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

// --- API ENDPOINTS ---
const NEWS_API_BASE_URL = `${API_BASE_URL}/api/newsapi`;
const NUTRITION_API_BASE_URL = `${API_BASE_URL}/api/nutrition`;
const BEAUTY_API_BASE_URL = `${API_BASE_URL}/api/beauty`;
const HEALTH_API_BASE_URL = `${API_BASE_URL}/api/health`;
const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

// --- MOCK DATA (Fallback) ---
const mockArticles: Article[] = [
  {
    id: 'mock-1',
    title: 'The Ultimate Guide to Healthy Skin',
    description: 'Discover the secrets to maintaining radiant, healthy skin with our comprehensive guide.',
    imageUrl: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=800',
    category: 'Skincare',
    date: new Date().toISOString(),
    content: 'Full article content here...',
  },
  {
    id: 'mock-2',
    title: 'Nutrition Tips for Glowing Skin',
    description: 'Learn how your diet affects your skin health and which foods to eat for a natural glow.',
    imageUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800',
    category: 'Nutrition',
    date: new Date().toISOString(),
    content: 'Full article content here...',
  },
];

const mockVideos: Video[] = [
  {
    id: 'mock-video-1',
    title: 'Morning Skincare Routine',
    description: 'Start your day with this refreshing skincare routine.',
    imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800',
    duration: '10:30',
  },
];

const mockNutritionData: NutritionInfo[] = [
  {
    id: 'nutrition-mock-1',
    name: 'Avocado',
    description: 'Rich in healthy fats and vitamins.',
    imageUrl: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=500',
    nutrients: { protein: 2, carbs: 9, fats: 15 },
  },
];

// --- HELPER FUNCTIONS ---
const cleanNewsApiText = (text: string | null | undefined): string => {
  if (!text) return '';
  return text.replace(/\s*\[\+\d+\s*chars\]$/i, '').trim();
};

// Raw API response types
interface YouTubeSearchItem {
  id: { videoId: string };
}

interface YouTubeVideoItem {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default?: { url: string };
      medium?: { url: string };
      high?: { url: string };
    };
  };
  contentDetails: {
    duration: string;
  };
}

interface NutrientInfoResponse {
  name: string;
  searchQuery: string;
  benefits: string[];
  dailyValue?: string;
  sources?: string[];
}

interface RawNewsApiArticle {
  id?: string;
  url?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  image?: string;
  urlToImage?: string;
  category?: string;
  date?: string;
  publishedAt?: string;
  content?: string;
}

// --- NEWS API FUNCTIONS ---
interface NewsApiResponse {
  status?: string;
  code?: string;
  message?: string;
  totalResults?: number;
  articles?: RawNewsApiArticle[];
  hasMore?: boolean;
}

export const fetchArticlesFromAPI = async (
  page: number = 1,
  pageSize: number = 20,
  category?: string,
  query?: string
): Promise<{ data: Article[]; hasMore: boolean }> => {
  try {
    const url = new URL(NEWS_API_BASE_URL);
    url.searchParams.set('page', String(page));
    url.searchParams.set('pageSize', String(pageSize));
    if (category && category !== 'All') {
      url.searchParams.set('category', category);
    }
    if (query) {
      url.searchParams.set('q', query);
    }

    console.log('[API] Fetching NewsAPI:', url.toString());
    const response = await fetch(url.toString(), defaultFetchOptions);
    if (!response.ok) {
      throw new Error(`NewsAPI error: ${response.status} - ${response.statusText}`);
    }

    const json = await response.json() as NewsApiResponse;

    if (json.status === 'ok' && Array.isArray(json.articles)) {
      const fallbackImage = mockArticles[0]?.imageUrl || '';
      
      const articles: Article[] = json.articles.map((item: RawNewsApiArticle) => ({
        id: item.id || item.url || '',
        title: item.title || 'Untitled article',
        description: cleanNewsApiText(item.description || ''),
        imageUrl: item.imageUrl || item.image || item.urlToImage || fallbackImage,
        category: item.category || 'Health',
        date: item.date || item.publishedAt || new Date().toISOString().split('T')[0],
        content: cleanNewsApiText(item.content || item.description || ''),
      }));

      const hasMore = json.hasMore !== undefined
        ? json.hasMore
        : page * pageSize < (json.totalResults ?? articles.length);

      return { data: articles, hasMore };
    }

    if (json.status === 'error') {
      console.error('NewsAPI responded with an error', { code: json.code, message: json.message });
      throw new Error(json.message || 'NewsAPI responded with an error');
    }

    return { data: [], hasMore: false };
  } catch (error) {
    console.error('fetchArticlesFromAPI error:', error);
    // Return mock data as fallback
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return { data: mockArticles.slice(start, end), hasMore: false };
  }
};

export const getArticles = (page: number = 1, category?: string, query?: string) => {
  return fetchArticlesFromAPI(page, 20, category, query);
};

export const getFeaturedArticles = async (): Promise<{ data: Article[]; hasMore: boolean }> => {
  return fetchArticlesFromAPI(1, 3);
};

export const getArticleById = async (id: string): Promise<Article | undefined> => {
  try {
    const url = new URL(NEWS_API_BASE_URL);
    url.searchParams.set('id', id);

    console.log('[API] Fetching article by ID:', url.toString());
    const response = await fetch(url.toString(), defaultFetchOptions);
    if (response.ok) {
      const json = await response.json() as NewsApiResponse;
      if (json.status === 'ok' && json.articles && json.articles.length > 0) {
        const item = json.articles[0];
        const fallbackImage = mockArticles[0]?.imageUrl || '';
        return {
          id: item.id || item.url || '',
          title: item.title || 'Untitled article',
          description: cleanNewsApiText(item.description || ''),
          imageUrl: item.imageUrl || item.image || fallbackImage,
          category: item.category || 'Health',
          date: item.date || new Date().toISOString().split('T')[0],
          content: cleanNewsApiText(item.content || item.description || ''),
        };
      }
    }
  } catch (error) {
    console.error('[API] Failed to fetch article by ID:', error);
  }

  // Fallback to mock data
  return mockArticles.find(article => article.id === id);
};

// --- YOUTUBE API FUNCTIONS ---
interface YouTubeAPIResponse {
  videos: Video[];
  nextPageToken: string | null;
  hasMore: boolean;
  totalResults?: number;
}

// Page token storage for pagination
const pageTokenCache: Record<string, string[]> = {};

export const fetchVideosFromAPI = async (
  category: string = 'All',
  type: 'shorts' | 'long' | 'all' = 'all',
  pageToken?: string,
  maxResults: number = 12,
  searchQuery?: string
): Promise<YouTubeAPIResponse> => {
  try {
    const params = new URLSearchParams({
      category,
      type,
      maxResults: String(maxResults),
    });

    if (pageToken) {
      params.set('pageToken', pageToken);
    }

    if (searchQuery) {
      params.set('query', searchQuery);
    }

    const response = await fetch(`/api/youtube/videos?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Video API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      videos: data.videos || [],
      nextPageToken: data.nextPageToken || null,
      hasMore: data.hasMore || false,
      totalResults: data.totalResults,
    };
  } catch (error) {
    console.error('fetchVideosFromAPI error:', error);
    // Return mock data as fallback
    return {
      videos: mockVideos,
      nextPageToken: null,
      hasMore: false,
    };
  }
};

// Fetch shorts (videos under 60 seconds)
export const getShorts = async (
  category: string = 'All',
  pageToken?: string
): Promise<YouTubeAPIResponse> => {
  return fetchVideosFromAPI(category, 'shorts', pageToken, 12);
};

// Fetch long videos (videos over 60 seconds)
export const getLongVideos = async (
  category: string = 'All',
  pageToken?: string
): Promise<YouTubeAPIResponse> => {
  return fetchVideosFromAPI(category, 'long', pageToken, 12);
};

// Search videos with custom query
export const searchVideos = async (
  query: string,
  type: 'shorts' | 'long' | 'all' = 'all',
  pageToken?: string
): Promise<YouTubeAPIResponse> => {
  return fetchVideosFromAPI('All', type, pageToken, 20, query);
};

// Legacy function for backwards compatibility
export const getVideos = async (
  page: number = 1,
  category?: string
): Promise<{ data: Video[]; hasMore: boolean }> => {
  const result = await fetchVideosFromAPI(category || 'All', 'all', undefined, 12);
  return {
    data: result.videos,
    hasMore: result.hasMore,
  };
};

// --- NUTRITION API FUNCTIONS ---
export const fetchNutritionData = async (
  page: number = 1,
  pageSize: number = 6
): Promise<{ data: (NutritionInfo | TipCard)[]; hasMore: boolean }> => {
  try {
    const url = `${NUTRITION_API_BASE_URL}?page=${page}&pageSize=${pageSize}`;
    console.log('[API] Fetching Nutrition:', url);
    const response = await fetch(url, defaultFetchOptions);

    if (!response.ok) {
      throw new Error(`Nutrition API error: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    return { data: result.data, hasMore: result.hasMore };
  } catch (error) {
    console.error('Nutrition API error:', error);
    return { data: mockNutritionData, hasMore: false };
  }
};

export const getNutritionData = (page: number = 1) => {
  return fetchNutritionData(page, 6);
};

export const searchUSDAFoods = async (
  query: string,
  page: number = 1,
  pageSize: number = 20
): Promise<{
  data: NutritionInfo[];
  totalHits: number;
  currentPage: number;
  hasMore: boolean;
}> => {
  try {
    const url = `${NUTRITION_API_BASE_URL}/search?query=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}`;
    console.log('[API] Searching USDA:', url);
    const response = await fetch(url, defaultFetchOptions);

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status} - ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('USDA search error:', error);
    return {
      data: [],
      totalHits: 0,
      currentPage: page,
      hasMore: false,
    };
  }
};

export const getNutrientInfo = async (nutrient: string): Promise<NutrientInfoResponse | null> => {
  try {
    const url = `${NUTRITION_API_BASE_URL}/nutrient-info?nutrient=${encodeURIComponent(nutrient)}`;
    console.log('[API] Fetching nutrient info:', url);
    const response = await fetch(url, defaultFetchOptions);

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to fetch nutrient info: ${response.status} - ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Nutrient info error:', error);
    return null;
  }
};

// --- EBAY BEAUTY API FUNCTIONS ---
export async function searchBeautyProducts(params: EbaySearchParams): Promise<EbaySearchResponse> {
  const searchParams = new URLSearchParams();

  if (params.q) searchParams.append('q', params.q);
  if (params.category) searchParams.append('category', params.category);
  if (params.sort) searchParams.append('sort', params.sort);
  if (params.minPrice !== undefined) searchParams.append('minPrice', params.minPrice.toString());
  if (params.maxPrice !== undefined) searchParams.append('maxPrice', params.maxPrice.toString());
  if (params.condition) searchParams.append('condition', params.condition);
  if (params.page) searchParams.append('page', params.page.toString());
  if (params.pageSize) searchParams.append('pageSize', params.pageSize.toString());

  const url = `${BEAUTY_API_BASE_URL}/search?${searchParams.toString()}`;
  console.log('[API] Searching Beauty Products:', url);
  const response = await fetch(url, defaultFetchOptions);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to search products' }));
    throw new Error(error.message || 'Failed to search products');
  }

  return response.json();
}

export async function getBeautyProductDetail(itemId: string): Promise<EbayProductDetail> {
  const url = `${BEAUTY_API_BASE_URL}/item/${encodeURIComponent(itemId)}`;
  console.log('[API] Fetching Beauty Product Detail:', url);
  const response = await fetch(url, defaultFetchOptions);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Product not found');
    }
    const error = await response.json().catch(() => ({ message: 'Failed to fetch product details' }));
    throw new Error(error.message || 'Failed to fetch product details');
  }

  return response.json();
}

// --- EBAY HEALTH API FUNCTIONS ---
export async function searchHealthProducts(params: EbaySearchParams): Promise<EbaySearchResponse> {
  const searchParams = new URLSearchParams();

  if (params.q) searchParams.append('q', params.q);
  if (params.category) searchParams.append('category', params.category);
  if (params.sort) searchParams.append('sort', params.sort);
  if (params.minPrice !== undefined) searchParams.append('minPrice', params.minPrice.toString());
  if (params.maxPrice !== undefined) searchParams.append('maxPrice', params.maxPrice.toString());
  if (params.condition) searchParams.append('condition', params.condition);
  if (params.page) searchParams.append('page', params.page.toString());
  if (params.pageSize) searchParams.append('pageSize', params.pageSize.toString());

  const url = `${HEALTH_API_BASE_URL}/search?${searchParams.toString()}`;
  console.log('[API] Searching Health Products:', url);
  const response = await fetch(url, defaultFetchOptions);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to search health products' }));
    throw new Error(error.message || 'Failed to search health products');
  }

  return response.json();
}

export async function getHealthProductDetail(itemId: string): Promise<EbayProductDetail> {
  const url = `${HEALTH_API_BASE_URL}/item/${encodeURIComponent(itemId)}`;
  console.log('[API] Fetching Health Product Detail:', url);
  const response = await fetch(url, defaultFetchOptions);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Product not found');
    }
    const error = await response.json().catch(() => ({ message: 'Failed to fetch health product details' }));
    throw new Error(error.message || 'Failed to fetch health product details');
  }

  return response.json();
}

// --- GENERIC SEARCH ---
export const searchAll = async (query: string, filters: { type: string; sort: string }) => {
  if (!query) return [];

  // For now, search articles only (can be expanded)
  const { data: articles } = await fetchArticlesFromAPI(1, 20, undefined, query);
  
  return articles.map(article => ({
    ...article,
    contentType: 'Article' as const,
  }));
};
