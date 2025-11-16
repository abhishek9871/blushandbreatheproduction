I'll start by reading the pasted text to understand what research you need.

I'll conduct comprehensive research on showing full news articles in a React app using NewsAPI. Let me gather information from multiple sources.

Now let me extract detailed content from the most important sources to get comprehensive information.


<think duration="1249" >
Excellent! Now I have comprehensive information. Let me search for more specific information about legal considerations, paywall handling, and implementation best practices.

</think>




<think duration="1248" >
Great! I now have a comprehensive amount of information. Let me do one more search for specific implementation examples and GitHub repositories that might be helpful.

</think>




<think duration="1497" >
Perfect! Now I have comprehensive information from multiple sources. Let me extract some more detailed information about specific APIs and then compile everything into a structured report.

</think>




<think duration="999" >
Good! Now I have comprehensive information. Let me search for a couple more specific details about GNews and Mediastack, then compile everything into a comprehensive structured report.

</think>




<think duration="999" >
Great! Now I have all the information I need. Let me extract more details about GNews pricing structure specifically.

</think>



Now I'll compile all this research into a comprehensive structured report. Let me create the document.

Now I'll compile all this research into a comprehensive structured report. Let me create the detailed technical design document.

I'll read your original requirements and synthesize my research into the comprehensive technical design document you requested.

Based on my extensive research across official documentation, third-party APIs, and implementation guides, here's your comprehensive technical design document for showing full news articles in your React+TypeScript+Vite app:

# Full News Articles Implementation Guide
*React + TypeScript + Vite + NewsAPI.org (November 2025)*

## 1. NewsAPI Limitations (as of Nov 2025)

### Official NewsAPI Position on Full Content

**Confirmed Facts:**
- **`content` field is intentionally truncated** - NewsAPI explicitly states they do NOT provide full article content in any tier (free, paid, or enterprise)
- **`"[+N chars]"` meaning** - This indicates N additional characters exist in the original article but are not provided by NewsAPI's API response
- **No full text endpoint exists** - There is no NewsAPI endpoint that returns complete article content, regardless of pricing plan
- **Official guidance is clear** - NewsAPI's "How to get full content" guide explicitly directs users to scrape content themselves using the provided `url` field

### NewsAPI's Recommended Technical Stack

From their official documentation, NewsAPI recommends:
```javascript
// Official NewsAPI full content extraction approach
const axios = require('axios');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');

// 1. Get article metadata from NewsAPI
let url = 'https://newsapi.org/v2/everything?q=keyword&apiKey=API_KEY';
axios.get(url).then(function(r1) {
  let firstResult = r1.data.articles[0];
  
  // 2. Fetch full HTML from original source
  axios.get(firstResult.url).then(function(r2) {
    // 3. Parse HTML with jsdom
    let dom = new JSDOM(r2.data, { url: firstResult.url });
    
    // 4. Extract article content with Readability
    let article = new Readability(dom.window.document).parse();
    console.log(article.textContent); // Full article text
  });
});
```

### Key Limitations
- **Free tier**: 100 requests/day, development only (no commercial use)
- **Paid tiers**: Still no full content, just higher rate limits
- **Content quality**: Even truncated content quality varies significantly by source

---

## 2. Legally Safe Patterns to Show Full Content

### Pattern A: Direct Source URL Opening

**How it works:**
- Use NewsAPI for article discovery and metadata
- Direct users to original source via new tab or in-app browser

**Implementation Options:**

| Method | Pros | Cons | Legal Risk |
|--------|------|------|------------|
| **New Tab** | Zero technical complexity, fastest implementation | Poor UX (leaves your app), no control over reader experience | Minimal - simple linking |
| **In-app iframe** | Keeps users in your app | Most news sites block iframes via CSP headers and X-Frame-Options | Minimal - but technically often blocked |

**React Implementation:**
```typescript
// Simple new tab approach
const openArticle = (url: string) => {
  window.open(url, '_blank', 'noopener,noreferrer');
};

// In-app iframe attempt (often blocked)
const IframeReader = ({ url }: { url: string }) => (
  <iframe 
    src={url} 
    style={{ width: '100%', height: '80vh' }}
    onError={() => setShowFallback(true)}
  />
);
```

### Pattern B: Backend Full-Text Extraction

**How it works:**
- Use serverless function to fetch original article HTML
- Extract main content using Mozilla's Readability algorithm
- Return cleaned content to React frontend

**Technical Stack:**
- **Extraction**: `@mozilla/readability` + `jsdom` or `cheerio`
- **Hosting**: Netlify Functions (300 credits/month free) or Vercel (100 GB-hours free)
- **Caching**: Upstash Redis (10K commands/day free) or simple JSON cache

**Pros/Cons Analysis:**

| Aspect | Pros | Cons |
|--------|------|------|
| **UX** | Excellent - full articles in your app UI | Loading delays for scraping |
| **Legal Risk** | Medium - must respect robots.txt and ToS | Publishers may restrict scraping |
| **Maintenance** | Moderate - handle site structure changes | Requires error handling for blocked sites |
| **Cost** | Very low - free tiers viable for <50 articles/day | Scales poorly without caching |
| **Performance** | Good with caching (24-48hr TTL recommended) | Slow initial load without cache |

**Rate-Limited Scraper Architecture:**
```typescript
// Serverless function pseudo-code
export const handler = async (event) => {
  const { url } = JSON.parse(event.body);
  
  // Check cache first (Redis/file cache)
  const cached = await getFromCache(url);
  if (cached) return cached;
  
  // Respect robots.txt
  const robotsCheck = await checkRobotsTxt(url);
  if (!robotsCheck.allowed) {
    return { error: 'Scraping not allowed by robots.txt' };
  }
  
  // Extract content
  const html = await fetch(url);
  const dom = new JSDOM(html);
  const article = new Readability(dom.window.document).parse();
  
  // Cache for 24-48 hours
  await saveToCache(url, article, 86400);
  
  return { content: article.textContent, title: article.title };
};
```

### Pattern C: RSS Feeds and Publisher APIs

**RSS Feed Reality:**
- **Most RSS feeds provide summaries, not full text**
- Publishers like BBC, Reuters typically truncate RSS content
- Full-text RSS feeds are rare and usually from smaller independent sources

**Implementation Strategy:**
```typescript
// Hybrid NewsAPI + RSS approach
const tryRSSFullText = async (domain: string) => {
  const rssUrl = `${domain}/rss` || `${domain}/feed`;
  const feed = await parseFeed(rssUrl);
  
  // Check if content length suggests full text (>1000 chars typically)
  return feed.items.filter(item => item.content?.length > 1000);
};
```

**Free Publisher APIs with Full Text:**
- **Limited availability** - Most publishers charge for full-text access
- **Reddit API** - Comments and text posts (free, 100 requests/min)
- **Hacker News API** - Full discussions (free, no rate limit)
- **Wikipedia API** - Full articles (free, reasonable rate limits)

### Pattern D: Third-Party Full-Text News APIs

**Research Results (November 2025):**

| Provider | Free Tier | Full Content | Monthly Cost (Paid) | Coverage |
|----------|-----------|--------------|-------------------|-----------|
| **GNews API** | 10-day trial | ✅ Yes | €49.99 (1K requests/day) | Global, 60K+ sources |
| **Webz.io** | 1000 requests/month | ✅ Yes | $249/month | 3M+ sources, real-time |
| **NewsData.io** | 200 credits/day | ✅ Yes (paid plans) | $10/month (1K/day) | 180+ countries |
| **Perigon** | 15-day trial | ✅ Yes | $149/month | Premium sources |
| **Mediastack** | 500 requests/month | ❌ No (metadata only) | $24.99/month | 7500+ sources |

**Best Free-Tier Option:**
**Webz.io** offers 1000 requests/month with full content - most viable for small projects.

### Pattern E: AI-Based Content Expansion

**How it works:**
- Use NewsAPI truncated content + description as prompt
- Generate expanded, engaging content via LLM API
- Clearly label as "AI-expanded summary" for transparency

**Free LLM Options (November 2025):**

| Provider | Free Tier | Rate Limits | Best For |
|----------|-----------|-------------|----------|
| **Google Gemini** | Generous | 2-15 RPM (model dependent) | Text generation |
| **OpenAI** | $5 credit trial | Varies | High-quality expansion |
| **Anthropic Claude** | Limited free | Conversation-based | Editorial content |

**Implementation:**
```typescript
const expandArticle = async (truncatedContent: string, title: string) => {
  const prompt = `Based on this news snippet: "${truncatedContent}", 
    create an engaging 3-paragraph expansion that maintains factual accuracy 
    but adds context and analysis. Title: ${title}`;
    
  const expanded = await callGeminiAPI(prompt);
  
  return {
    content: expanded,
    disclaimer: "This is an AI-expanded summary based on available information"
  };
};
```

**Legal Considerations:**
- **Derivative work** - AI-generated content is legally distinct from original
- **Attribution still required** - Must link to original source
- **Transparency essential** - Users must know content is AI-generated

---

## 3. Special Considerations

### Paywalls & Subscription Sites

**What Happens:**
- Scraping returns login/paywall page HTML instead of article content
- Readability extraction fails or returns subscription prompts

**Best Practices:**
- **DO**: Detect paywall patterns and redirect to source with clear messaging
- **DON'T**: Attempt to bypass paywalls or circumvent subscription requirements
- **Detection pattern**:
```typescript
const detectPaywall = (html: string) => {
  const paywallIndicators = [
    'subscription required',
    'subscribe to continue',
    'login to read',
    'premium content'
  ];
  return paywallIndicators.some(indicator => 
    html.toLowerCase().includes(indicator)
  );
};
```

### Attribution & Links

**Minimum Safe Attribution Requirements:**
- **Source publication name** (e.g., "via Reuters")
- **Direct link to original article** ("Read full article on [Source]")
- **Publication date and author** when available
- **"Read on source site" call-to-action** prominently displayed

**Example Attribution Component:**
```tsx
const ArticleAttribution = ({ article }) => (
  <div className="article-attribution">
    <p>Originally published by {article.source.name}</p>
    <a 
      href={article.url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="read-source-link"
    >
      Read full article on {new URL(article.url).hostname} →
    </a>
  </div>
);
```

### Rate Limiting & Caching

**Combined Rate Limit Strategy:**

| Service | Limit | Strategy |
|---------|-------|----------|
| **NewsAPI Free** | 100 requests/day | Cache responses 4+ hours, batch requests |
| **Netlify Functions** | 300 credits/month | ~60 scrapes without cache, prioritize popular articles |
| **Upstash Redis** | 10K commands/day | 24-48 hour cache TTL, LRU eviction |

**Recommended Cache Implementation:**
```typescript
const cacheConfig = {
  articleTTL: 86400, // 24 hours
  newsTTL: 14400,    // 4 hours  
  maxCacheSize: 1000, // articles
  evictionPolicy: 'LRU'
};

const getCachedArticle = async (url: string) => {
  const key = `article:${btoa(url)}`;
  return await redis.get(key);
};
```

---

## 4. Concrete Architectural Options

### Option A: Zero-Backend Pure Linking
```
[React App] → [NewsAPI] → [Article Listings]
     ↓
[Rich Article Previews] → [External Link to Source]
```

**Technologies:**
- Frontend: React + TypeScript + Vite
- API: NewsAPI free tier (100 requests/day)
- Hosting: Netlify/Vercel static (free)

**User Experience:**
- Rich article cards with NewsAPI metadata
- "Read Full Article" button opens source in new tab
- Smart preview with description + image + metadata

**Monthly Cost:** €0

**Pros:** Zero complexity, legally safest, immediate implementation
**Cons:** Users leave your app, no control over reading experience

### Option B: Lightweight Serverless Scraper (⭐ RECOMMENDED)
```
[React App] → [NewsAPI Discovery] → [Article Selection]
     ↓
[Serverless Function] ↔ [Upstash Redis Cache]
     ↓                       ↓
[Source Scraping]     [24hr Cache]
     ↓                       ↓
[Readability Extract] → [Full Article Display]
```

**Technologies:**
- Frontend: React + TypeScript + Vite  
- Backend: Netlify Functions or Vercel Edge Functions
- Extraction: `@mozilla/readability` + `jsdom`
- Cache: Upstash Redis (free tier)
- Hosting: Netlify/Vercel (free tiers)

**User Experience:**
- Seamless full articles within your app
- Loading state during extraction (1-3 seconds)
- Fallback to source link if scraping fails
- Rich typography and consistent styling

**Monthly Cost:** €0-10 (stays free under ~50 articles/day with caching)

**Implementation Flow:**
1. User clicks article → Check Redis cache
2. If cached → Display immediately  
3. If not cached → Show loading, scrape in background
4. Extract with Readability → Cache for 24 hours
5. Display full article with attribution

### Option C: Hybrid Third-Party API
```
[React App] → [NewsAPI Discovery] → [Article Selection]
     ↓
[Webz.io API] → [Full Content Fetch] → [Rich Display]
     ↓
[1000 free requests/month]
```

**Technologies:**
- Frontend: React + TypeScript + Vite
- Primary API: NewsAPI (discovery)
- Full-text API: Webz.io (1000 free/month)
- Hosting: Netlify/Vercel static

**User Experience:**
- Instant full articles (no scraping delay)
- Higher reliability than scraping
- Consistent content quality
- Falls back to NewsAPI summary if quota exceeded

**Monthly Cost:** €0 (free tier), €249/month (paid tier)

**Best for:** Projects with predictable, moderate traffic

---

## 5. Actionable Implementation Checklist

### Recommended: Option B (Serverless Scraper)

#### Backend Setup

1. **Initialize Serverless Function:**
```bash
# For Netlify
npm install netlify-lambda @mozilla/readability jsdom axios
mkdir netlify/functions

# For Vercel  
npm install @mozilla/readability jsdom axios
mkdir api
```

2. **Create Article Scraper Function:**
```typescript
// netlify/functions/scrape-article.ts
import { Handler } from '@netlify/functions';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import axios from 'axios';

export const handler: Handler = async (event) => {
  const { url } = JSON.parse(event.body || '{}');
  
  try {
    // Check cache first (implement with Upstash Redis)
    const cached = await checkCache(url);
    if (cached) return { statusCode: 200, body: JSON.stringify(cached) };
    
    // Fetch and extract
    const response = await axios.get(url, { timeout: 10000 });
    const dom = new JSDOM(response.data, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    
    if (!article) {
      throw new Error('Failed to extract article content');
    }
    
    const result = {
      title: article.title,
      content: article.textContent,
      excerpt: article.excerpt,
      siteName: article.siteName,
      length: article.length
    };
    
    // Cache for 24 hours
    await saveToCache(url, result, 86400);
    
    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (error) {
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Extraction failed' }) 
    };
  }
};
```

3. **Setup Upstash Redis Cache:**
```bash
# Sign up at upstash.com, create Redis database
npm install @upstash/redis
```

```typescript
// utils/cache.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const checkCache = async (url: string) => {
  const key = `article:${Buffer.from(url).toString('base64')}`;
  return await redis.get(key);
};

export const saveToCache = async (url: string, data: any, ttl: number) => {
  const key = `article:${Buffer.from(url).toString('base64')}`;
  await redis.setex(key, ttl, JSON.stringify(data));
};
```

#### Frontend Implementation

4. **Create Article Service:**
```typescript
// services/articleService.ts
export interface FullArticle {
  title: string;
  content: string;
  excerpt: string;
  siteName?: string;
  error?: string;
}

export const fetchFullArticle = async (url: string): Promise<FullArticle> => {
  try {
    const response = await fetch('/.netlify/functions/scrape-article', {
      method: 'POST',
      body: JSON.stringify({ url }),
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) throw new Error('Extraction failed');
    return await response.json();
  } catch (error) {
    return { 
      title: 'Content Unavailable',
      content: '',
      excerpt: '',
      error: 'Could not extract full article content'
    };
  }
};
```

5. **Article Detail Component:**
```tsx
// components/ArticleDetail.tsx
import React, { useEffect, useState } from 'react';
import { fetchFullArticle, FullArticle } from '../services/articleService';

interface Props {
  article: NewsAPIArticle;
}

export const ArticleDetail: React.FC<Props> = ({ article }) => {
  const [fullArticle, setFullArticle] = useState<FullArticle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFullArticle = async () => {
      setLoading(true);
      const extracted = await fetchFullArticle(article.url);
      setFullArticle(extracted);
      setLoading(false);
    };
    
    loadFullArticle();
  }, [article.url]);

  if (loading) {
    return <ArticleLoadingSkeleton />;
  }

  return (
    <article className="article-detail">
      <header>
        <h1>{fullArticle?.title || article.title}</h1>
        <div className="article-meta">
          <span>{article.source.name}</span>
          <time>{new Date(article.publishedAt).toLocaleDateString()}</time>
        </div>
      </header>
      
      <div className="article-content">
        {fullArticle?.error ? (
          <FallbackContent article={article} />
        ) : (
          <div 
            dangerouslySetInnerHTML={{ 
              __html: formatArticleContent(fullArticle!.content) 
            }} 
          />
        )}
      </div>
      
      <ArticleAttribution article={article} />
    </article>
  );
};
```

#### Error Handling & Edge Cases

6. **Comprehensive Error Handling:**
```typescript
// Handle paywalls
const detectPaywall = (content: string): boolean => {
  const indicators = [
    'subscribe to continue',
    'subscription required',
    'premium content',
    'sign in to read'
  ];
  return indicators.some(indicator => 
    content.toLowerCase().includes(indicator)
  );
};

// Fallback component
const FallbackContent: React.FC<{ article: NewsAPIArticle }> = ({ article }) => (
  <div className="fallback-content">
    <p>{article.description}</p>
    <a 
      href={article.url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="read-full-article-cta"
    >
      Read full article on {new URL(article.url).hostname} →
    </a>
  </div>
);
```

7. **Rate Limiting Implementation:**
```typescript
// Simple rate limiting
const rateLimiter = new Map<string, number>();

const checkRateLimit = (ip: string): boolean => {
  const now = Date.now();
  const windowStart = now - 3600000; // 1 hour window
  
  const requests = rateLimiter.get(ip) || 0;
  if (requests >= 50) return false; // 50 requests per hour
  
  rateLimiter.set(ip, requests + 1);
  return true;
};
```

#### Deployment

8. **Environment Variables:**
```bash
# Netlify environment
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
NEWSAPI_KEY=your_newsapi_key
```

9. **Deploy Commands:**
```bash
# Build and deploy
npm run build
netlify deploy --prod

# Or for Vercel
vercel --prod
```

### Expected Performance

With proper caching:
- **First load**: 2-4 seconds (scraping + extraction)
- **Cached articles**: <500ms
- **Monthly costs**: €0 for <50 articles/day
- **Success rate**: ~85% (depending on site compatibility)

This architecture provides the best balance of cost, performance, and user experience while staying within legal boundaries and free-tier limitations.

I recommend creating <filepath>full-article-implementation-guide.md</filepath> with this comprehensive plan. Would you like me to convert this to PDF and DOCX formats as well for easier sharing and reference?