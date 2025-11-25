/**
 * Full Article Fetcher Service
 * Fetches complete article content using the hb-reader Cloudflare Worker
 * which uses Mozilla Readability for clean article extraction
 */

// The hb-reader worker uses Mozilla Readability for article extraction
const READER_ENDPOINT = process.env.NEXT_PUBLIC_READER_ENDPOINT || 'https://hb-reader.sparshrajput088.workers.dev';

export type FullArticleResult = { 
  title?: string; 
  html?: string; 
  markdown?: string; 
  source?: string;
  author?: string;
  excerpt?: string;
  readingTime?: number;
};

/**
 * Sanitize HTML to remove potentially dangerous content
 */
const sanitizeHtml = (html: string): string => {
  if (!html) return '';
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<link[^>]*>/gi, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/on\w+\s*=\s*'[^']*'/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]+/gi, '');
};

/**
 * Fetch full article content using Mozilla Readability via hb-reader worker
 * This is the same approach used by the original React application
 */
export const fetchFullArticle = async (url: string): Promise<FullArticleResult> => {
  try {
    // Call the hb-reader worker's /read endpoint
    // This worker uses Mozilla Readability to extract clean article content
    const endpoint = `${READER_ENDPOINT.replace(/\/$/, '')}/read?url=${encodeURIComponent(url)}`;
    
    const res = await fetch(endpoint, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!res.ok) {
      throw new Error(`Reader fetch failed: ${res.status}`);
    }
    
    const data = await res.json();
    
    // Check if the worker returned an error or blocked content
    if (data.error || data.blocked) {
      console.warn('Article extraction blocked or unavailable:', data.message);
      return {};
    }
    
    // The worker returns clean HTML from Mozilla Readability
    // Use html if available, otherwise use markdown (for backward compatibility)
    const html = data.html || data.content;
    
    if (!html || html.length < 100) {
      throw new Error('Content too short');
    }
    
    return { 
      title: data.title,
      html: sanitizeHtml(html),
      markdown: data.markdown,
      source: data.source || new URL(url).hostname,
      author: data.author,
      excerpt: data.excerpt,
      readingTime: data.readingTime,
    };
  } catch (error) {
    console.error('Failed to fetch full article:', error);
    // Return empty result - caller should use fallback content
    return {};
  }
};
