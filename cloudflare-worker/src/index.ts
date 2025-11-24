import { XMLParser } from 'fast-xml-parser';
import { Readability } from '@mozilla/readability';
import { parseHTML } from 'linkedom';

export interface Env {
  ALLOWED_HOSTS?: string;
  ARTICLES_CACHE?: KVNamespace;
}

/**
 * Simple Open Graph metadata extractor (lightweight, no heavy dependencies)
 */
function extractOpenGraphMetadata(html: string) {
  const og: any = {};

  // Extract OG title
  const titleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
                     html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["'][^>]*>/i);
  if (titleMatch) og.ogTitle = titleMatch[1];

  // Extract OG description
  const descMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
                    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["'][^>]*>/i);
  if (descMatch) og.ogDescription = descMatch[1];

  // Extract OG image
  const imageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
                     html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["'][^>]*>/i);
  if (imageMatch) og.ogImage = [{ url: imageMatch[1] }];

  // Extract OG site name
  const siteMatch = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
                    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:site_name["'][^>]*>/i);
  if (siteMatch) og.ogSiteName = siteMatch[1];

  // Extract article author
  const authorMatch = html.match(/<meta[^>]*property=["']article:author["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
                      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']article:author["'][^>]*>/i) ||
                      html.match(/<meta[^>]*name=["']author["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  if (authorMatch) og.ogArticleAuthor = authorMatch[1];

  // Extract article published time
  const publishMatch = html.match(/<meta[^>]*property=["']article:published_time["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
                       html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']article:published_time["'][^>]*>/i);
  if (publishMatch) og.ogArticlePublishedTime = publishMatch[1];

  return og;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

function okJSON(body: unknown, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=86400",
      ...corsHeaders,
      ...extra,
    },
  });
}

function errorJSON(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...corsHeaders,
    },
  });
}

function isHttpUrl(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch (_) {
    return false;
  }
}

function getTitleFromMarkdown(md: string | undefined) {
  if (!md) return undefined;
  const m = md.match(/^#\s+(.+)$/m);
  return m?.[1]?.trim();
}

function cleanMarkdown(md: string) {
  let cleaned = md;
  
  // Remove image URL patterns that appear as text like ![Image 19: description](url)
  cleaned = cleaned.replace(/!\[Image \d+:[^\]]*\]\([^)]+\)/g, '');
  
  // Remove standalone image URLs in parentheses
  cleaned = cleaned.replace(/\(https?:\/\/[^\s)]+\.(jpg|jpeg|png|gif|webp|svg)[^)]*\)/gi, '');
  
  // Remove common unwanted patterns
  cleaned = cleaned.replace(/^(Sign in|Sign up|Log in|Log out|Subscribe|Newsletter|Trending|Related|Share this|Tweet|Follow us|Read more|Continue reading|Click here).*$/gim, '');
  
  // Remove standalone bracketed text
  cleaned = cleaned.replace(/^\[.*?\]\s*$/gm, '');
  
  // Remove excessive whitespace
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.trim();
  
  return cleaned;
}

function toHtml(md: string) {
  let html = md.replace(/\r\n/g, "\n");
  
  // Headers
  html = html.replace(/^######\s+(.*)$/gm, '<h6>$1</h6>')
             .replace(/^#####\s+(.*)$/gm, '<h5>$1</h5>')
             .replace(/^####\s+(.*)$/gm, '<h4>$1</h4>')
             .replace(/^###\s+(.*)$/gm, '<h3>$1</h3>')
             .replace(/^##\s+(.*)$/gm, '<h2>$1</h2>')
             .replace(/^#\s+(.*)$/gm, '<h1>$1</h1>');
  
  // Bold, italic, links
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
             .replace(/\*(.*?)\*/g, '<em>$1</em>')
             .replace(/\[(.*?)\]\((https?:[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1<\/a>');
  
  // Images
  html = html.replace(/!\[(.*?)\]\((https?:[^\s)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;height:auto;" />');
  
  // Blockquotes
  html = html.replace(/^>\s+(.*)$/gm, '<blockquote>$1</blockquote>');
  
  // Unordered lists
  html = html.replace(/^[*-]\s+(.*)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);
  
  // Ordered lists
  html = html.replace(/^\d+\.\s+(.*)$/gm, '<li>$1</li>');
  
  // Code blocks
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Paragraphs
  html = html.split(/\n\s*\n/).map(p => {
    const trimmed = p.trim();
    if (!trimmed) return '';
    if (/^<(h\d|ul|ol|blockquote|pre|img)/.test(trimmed)) return trimmed;
    return `<p>${trimmed}</p>`;
  }).filter(Boolean).join('\n');
  
  return html;
}

function isHostAllowed(host: string, env: Env) {
  const list = (env.ALLOWED_HOSTS || "").trim();
  if (!list) return true; // empty = allow all
  const allowed = new Set(list.split(/\s*,\s*/).filter(Boolean).map(h => h.toLowerCase()));
  return allowed.has(host.toLowerCase());
}

/**
 * Extract article content using Mozilla Readability (free, no API key)
 * @param targetUrl - Article URL to extract
 * @returns Article content with metadata
 */
async function extractArticleWithReadability(targetUrl: string) {
  try {
    // Step 1: Fetch the article HTML
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Blush&Breath/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      cf: { cacheEverything: true, cacheTtl: 3600 },
    });

    if (!response.ok) {
      console.error(`Failed to fetch ${targetUrl}: ${response.status}`);
      return undefined;
    }

    const html = await response.text();

    // Step 2: Extract Open Graph metadata first (for social preview data)
    const ogData = extractOpenGraphMetadata(html);

    // Step 3: Parse with Readability to get clean article content
    const { document } = parseHTML(html);

    const reader = new Readability(document, {
      charThreshold: 500,  // Require at least 500 chars to be valid article
      keepClasses: false   // Remove CSS classes for clean HTML
    });

    const article = reader.parse();

    if (!article) {
      // Readability couldn't parse - return basic fallback
      return {
        title: ogData.ogTitle || document.title || 'Article',
        content: '<p>Unable to extract article content. Please visit the original source.</p>',
        textContent: '',
        markdown: 'Unable to extract article content.',
        isParseable: false
      };
    }

    // Step 4: Calculate reading time (average 200 words per minute)
    const wordCount = article.textContent.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);

    // Step 5: Extract first image from article if OG image not available
    let featuredImage = ogData.ogImage?.[0]?.url || '';
    if (!featuredImage) {
      const imgMatch = article.content.match(/<img[^>]+src="([^">]+)"/);
      featuredImage = imgMatch ? imgMatch[1] : '';
    }

    // Step 6: Convert HTML content to Markdown for backward compatibility
    const markdown = htmlToMarkdown(article.content);

    // Step 7: Return normalized article object
    return {
      title: ogData.ogTitle || article.title || 'Untitled',
      content: article.content,           // Clean HTML with <p>, <img>, <blockquote>, etc.
      html: article.content,              // Same as content for compatibility
      markdown: markdown,                 // Markdown version for compatibility
      textContent: article.textContent,   // Plain text version
      author: ogData.ogArticleAuthor || article.byline || '',
      publishDate: ogData.ogArticlePublishedTime || article.publishedTime || '',
      image: featuredImage,
      excerpt: ogData.ogDescription || article.excerpt || '',
      siteName: ogData.ogSiteName || article.siteName || new URL(targetUrl).hostname,
      readingTime: readingTime,
      length: article.length,
      isParseable: true
    };

  } catch (error) {
    console.error('Article extraction failed:', error);
    return undefined;
  }
}

/**
 * Convert HTML to Markdown (simplified version for backward compatibility)
 */
function htmlToMarkdown(html: string): string {
  let markdown = html;

  // Remove style and script tags
  markdown = markdown.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  markdown = markdown.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

  // Headers
  markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
  markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
  markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
  markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');
  markdown = markdown.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n');
  markdown = markdown.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n');

  // Bold and italic
  markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
  markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');

  // Links
  markdown = markdown.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');

  // Images
  markdown = markdown.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, '![$2]($1)');
  markdown = markdown.replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, '![]($1)');

  // Paragraphs
  markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');

  // Line breaks
  markdown = markdown.replace(/<br\s*\/?>/gi, '\n');

  // Lists
  markdown = markdown.replace(/<ul[^>]*>/gi, '');
  markdown = markdown.replace(/<\/ul>/gi, '\n');
  markdown = markdown.replace(/<ol[^>]*>/gi, '');
  markdown = markdown.replace(/<\/ol>/gi, '\n');
  markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');

  // Blockquotes
  markdown = markdown.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n\n');

  // Remove remaining HTML tags
  markdown = markdown.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  markdown = markdown.replace(/&nbsp;/g, ' ');
  markdown = markdown.replace(/&amp;/g, '&');
  markdown = markdown.replace(/&lt;/g, '<');
  markdown = markdown.replace(/&gt;/g, '>');
  markdown = markdown.replace(/&quot;/g, '"');
  markdown = markdown.replace(/&#39;/g, "'");

  // Clean up excessive whitespace
  markdown = markdown.replace(/\n{3,}/g, '\n\n');
  markdown = markdown.trim();

  return markdown;
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname === "/" || url.pathname === "") {
      return okJSON({ status: "ok", service: "hb-reader", time: new Date().toISOString() });
    }

    if (url.pathname.endsWith("/rss") || url.pathname === "/rss") {
      const feedUrl = url.searchParams.get("url");
      if (!feedUrl) return errorJSON(400, "Missing url parameter");
      if (!isHttpUrl(feedUrl)) return errorJSON(400, "Invalid url");

      try {
        const res = await fetch(feedUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HealthBeautyHub/1.0)' },
          cf: { cacheEverything: true, cacheTtl: 3600 },
        });
        if (!res.ok) return errorJSON(502, "Failed to fetch RSS feed");
        
        const xmlText = await res.text();
        const parser = new XMLParser({
          ignoreAttributes: false,
          attributeNamePrefix: '@_',
        });
        const data = parser.parse(xmlText);
        
        const items = data.rss?.channel?.item || data.feed?.entry || [];
        const articles = (Array.isArray(items) ? items : [items]).slice(0, 20).map((item: any) => ({
          title: item.title || '',
          link: item.link?.['@_href'] || item.link || '',
          description: item.description || item.summary || '',
          content: item['content:encoded'] || item.content || item.description || '',
          pubDate: item.pubDate || item.published || item.updated || '',
          image: item.enclosure?.['@_url'] || item['media:thumbnail']?.['@_url'] || '',
        }));

        return okJSON({ articles });
      } catch (error) {
        return errorJSON(500, "RSS parsing failed");
      }
    }

    if (url.pathname.endsWith("/read") || url.pathname === "/read") {
      const target = url.searchParams.get("url");
      if (!target) return errorJSON(400, "Missing url parameter");
      if (!isHttpUrl(target)) return errorJSON(400, "Invalid url (must be http/https)");

      const host = new URL(target).hostname;
      if (!isHostAllowed(host, env)) return errorJSON(403, "Host not allowed");

      // Check cache first (if KV namespace is bound)
      const cacheKey = `article:${target}`;
      if (env.ARTICLES_CACHE) {
        const cached = await env.ARTICLES_CACHE.get(cacheKey, 'json');
        if (cached) {
          console.log('Returning cached article for:', target);
          return okJSON(cached, { 'X-Cache': 'HIT' });
        }
      }

      // Use Mozilla Readability (free, no API key) to extract article content
      const result = await extractArticleWithReadability(target);
      if (!result || !result.markdown) {
        return okJSON({
          error: "Content extraction blocked or unavailable",
          blocked: true,
          message: "This website blocks automated content extraction or article format is not supported. Please visit the source directly.",
          source: host,
          url: target
        });
      }

      // Clean the extracted markdown
      const cleanedMarkdown = cleanMarkdown(result.markdown);

      const response = {
        title: result.title || getTitleFromMarkdown(cleanedMarkdown),
        markdown: cleanedMarkdown,
        html: result.html,
        source: result.siteName || host,
        author: result.author,
        publishDate: result.publishDate,
        excerpt: result.excerpt,
        readingTime: result.readingTime,
        isParseable: result.isParseable
      };

      // Cache the result for 24 hours (if KV namespace is bound)
      if (env.ARTICLES_CACHE) {
        await env.ARTICLES_CACHE.put(cacheKey, JSON.stringify(response), {
          expirationTtl: 86400 // 24 hours
        });
      }

      return okJSON(response, { 'X-Cache': 'MISS' });
    }

    return errorJSON(404, "Not found");
  },
};
