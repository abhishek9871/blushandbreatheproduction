### CLAUDE CODE IMPLEMENTATION TICKET: Replace Jina Reader with Free Mozilla Readability

**Context:**

- You have a Health page (`/health`) that displays articles from News API and PubMed API
- PubMed articles render correctly (structured API) ✅
- News API articles currently use Jina Reader, which scrapes entire pages and shows unprofessional content with navigation/ads/programmatic prefixes ❌
- Your backend is a Cloudflare Worker configured via `wrangler.backend.toml`
- Frontend is React + TypeScript SPA

**Goal:** Replace Jina Reader with Mozilla Readability.js (the same algorithm powering Firefox Reader View) for professional article extraction—100% free, no API keys, unlimited use.

***

### PHASE 1: Understanding the Architecture

**Before writing code, locate and understand:**

1. **Backend Worker file** (e.g., `_worker.js`, `worker.ts`, or `src/worker.js`)
    - This is where your News API and PubMed API fetching logic lives
    - Find the function that currently calls Jina Reader API for article content
    - Identify the route that serves article content to the frontend (e.g., `/api/articles/:id` or similar)
2. **Frontend article display component**
    - Find the React component that renders individual article content (likely `ArticleDetailPage.tsx` or similar)
    - Identify how it currently receives and displays article HTML/content
    - Note what props/data structure it expects
3. **Current Jina Reader integration**
    - Locate where `https://r.jina.ai/${url}` or similar is being called
    - Note what preprocessing you're currently doing on Jina's response
    - Identify any caching logic (KV or Durable Objects)

**Document your findings** in a comment before proceeding.

***

### PHASE 2: Install Dependencies

**Since your backend is a Cloudflare Worker, you need to bundle dependencies for the Worker environment.**

**Step 1: Install packages in your project root:**

```bash
npm install @mozilla/readability jsdom open-graph-scraper
```

**Step 2: Ensure your Worker build process bundles Node.js packages**

Cloudflare Workers don't natively support Node.js libraries like `jsdom`. You need to:

- **If using Wrangler with esbuild bundling** (default for modern Workers):
    - Verify `wrangler.backend.toml` has `compatibility_flags = ["nodejs_compat"]` or similar
    - Check that your build command bundles dependencies (esbuild should handle this automatically)
- **If you encounter "jsdom not found" errors in Worker:**
    - You may need to use a Worker-compatible alternative like `linkedom` instead of `jsdom`
    - Alternative installation: `npm install @mozilla/readability linkedom`
    - `linkedom` is a lighter, Worker-friendly DOM implementation

**Recommendation:** Try `jsdom` first. If it fails in Worker environment, switch to `linkedom`.

***

### PHASE 3: Create Article Extraction Service in Worker

**File location:** Create this as a new module in your Worker backend (e.g., `src/articleExtractor.js` or inline in `_worker.js` if small project)

**Implementation Instructions:**

1. **Import dependencies at top of your Worker file:**
```javascript
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom'; // or: import { parseHTML } from 'linkedom'; if jsdom doesn't work
import ogs from 'open-graph-scraper';
```

2. **Create the extraction function:**
```javascript
/**
 * Extract article content using Mozilla Readability (free, no API key)
 * @param {string} url - Article URL to extract
 * @returns {Promise<Object>} Article content with metadata
 */
async function extractArticleContent(url) {
  try {
    // Step 1: Fetch the article HTML
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Blush&Breath/1.0)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    
    // Step 2: Extract Open Graph metadata first (for social preview data)
    let ogData = {};
    try {
      const { result } = await ogs({ html });
      ogData = result || {};
    } catch (ogError) {
      console.warn('Open Graph extraction failed, continuing without metadata:', ogError.message);
    }
    
    // Step 3: Parse with Readability to get clean article content
    const dom = new JSDOM(html, { url }); // or: const { document } = parseHTML(html); for linkedom
    const document = dom.window.document;
    
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
        author: ogData.ogArticleAuthor || '',
        publishDate: ogData.ogArticlePublishedTime || '',
        image: ogData.ogImage?.[^0]?.url || '',
        excerpt: ogData.ogDescription || '',
        siteName: ogData.ogSiteName || new URL(url).hostname,
        readingTime: 0,
        isParseable: false
      };
    }
    
    // Step 4: Calculate reading time (average 200 words per minute)
    const wordCount = article.textContent.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);
    
    // Step 5: Extract first image from article if OG image not available
    let featuredImage = ogData.ogImage?.[^0]?.url || '';
    if (!featuredImage) {
      const imgMatch = article.content.match(/<img[^>]+src="([^">]+)"/);
      featuredImage = imgMatch ? imgMatch[^1] : '';
    }
    
    // Step 6: Return normalized article object
    return {
      title: ogData.ogTitle || article.title || 'Untitled',
      content: article.content,           // Clean HTML with <p>, <img>, <blockquote>, etc.
      textContent: article.textContent,   // Plain text version
      author: ogData.ogArticleAuthor || article.byline || '',
      publishDate: ogData.ogArticlePublishedTime || article.publishedTime || '',
      image: featuredImage,
      excerpt: ogData.ogDescription || article.excerpt || '',
      siteName: ogData.ogSiteName || article.siteName || new URL(url).hostname,
      readingTime: readingTime,
      length: article.length,
      isParseable: true
    };
    
  } catch (error) {
    console.error('Article extraction failed:', error);
    throw new Error(`Failed to extract article: ${error.message}`);
  }
}
```

3. **Add caching wrapper to avoid re-fetching same articles:**
```javascript
/**
 * Cache article content in KV for 24 hours
 * @param {string} url - Article URL
 * @param {KVNamespace} kv - Your KV binding (e.g., env.ARTICLES_CACHE)
 * @returns {Promise<Object>} Cached or freshly extracted article
 */
async function getCachedArticle(url, kv) {
  const cacheKey = `article:${url}`;
  
  // Try to get from cache
  const cached = await kv.get(cacheKey, 'json');
  if (cached) {
    console.log('Returning cached article for:', url);
    return cached;
  }
  
  // Extract fresh content
  console.log('Extracting fresh article for:', url);
  const article = await extractArticleContent(url);
  
  // Store in KV for 24 hours
  await kv.put(cacheKey, JSON.stringify(article), {
    expirationTtl: 86400 // 24 hours in seconds
  });
  
  return article;
}
```


***

### PHASE 4: Update Worker API Route

**Find your existing article content API route** (e.g., the one that currently calls Jina Reader).

**Replace Jina Reader call with the new `getCachedArticle` function:**

```javascript
// Example Worker route handler
async function handleArticleRequest(request, env) {
  const url = new URL(request.url);
  const articleUrl = url.searchParams.get('url'); // or however you pass the article URL
  
  if (!articleUrl) {
    return new Response('Missing article URL', { status: 400 });
  }
  
  try {
    // Use your KV binding name from wrangler.backend.toml
    const article = await getCachedArticle(articleUrl, env.ARTICLES_CACHE); // Replace ARTICLES_CACHE with your actual KV binding name
    
    return new Response(JSON.stringify(article), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400' // Cache in CDN for 24 hours
      }
    });
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to extract article', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
```

**If you don't have a KV namespace yet:**

1. Add to `wrangler.backend.toml`:
```toml
[[kv_namespaces]]
binding = "ARTICLES_CACHE"
id = "your_kv_id_here"  # Create KV namespace first: npx wrangler kv:namespace create "ARTICLES_CACHE"
```

2. Or use an existing KV binding you already have (same one as Beauty/Health stores if applicable)

***

### PHASE 5: Update Frontend to Use New Article Format

**Find your article detail React component** (e.g., `ArticleDetailPage.tsx`).

**Update to render the new article structure:**

```typescript
// Example component update
interface Article {
  title: string;
  content: string;        // Clean HTML from Readability
  textContent: string;
  author?: string;
  publishDate?: string;
  image?: string;
  excerpt?: string;
  siteName?: string;
  readingTime: number;
  isParseable: boolean;
}

export function ArticleDetailPage() {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const articleUrl = /* get from URL params or News API article URL */;
    
    // Call your Worker API route
    fetch(`/api/article?url=${encodeURIComponent(articleUrl)}`)
      .then(res => res.json())
      .then(data => {
        setArticle(data);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load article');
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading article...</div>;
  if (error || !article) return <div>{error}</div>;

  return (
    <article className="article-container">
      {/* Featured image */}
      {article.image && (
        <img src={article.image} alt={article.title} className="article-hero-image" />
      )}
      
      {/* Article header */}
      <header className="article-header">
        <h1>{article.title}</h1>
        <div className="article-meta">
          {article.author && <span>By {article.author}</span>}
          {article.publishDate && (
            <time>{new Date(article.publishDate).toLocaleDateString()}</time>
          )}
          <span>{article.readingTime} min read</span>
          {article.siteName && <span>Source: {article.siteName}</span>}
        </div>
        {article.excerpt && <p className="excerpt">{article.excerpt}</p>}
      </header>

      {/* Render clean HTML from Readability */}
      <div 
        className="article-content"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      {/* Quality notice if extraction was incomplete */}
      {!article.isParseable && (
        <div className="quality-notice">
          Article formatting may be incomplete. <a href={originalUrl} target="_blank">View original</a>
        </div>
      )}
    </article>
  );
}
```


***

### PHASE 6: Add Professional Article Styling

**Create or update your article CSS** (e.g., `styles/article.css` or component styles):

```css
.article-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
  font-family: Georgia, 'Times New Roman', serif;
  line-height: 1.8;
  color: #1a1a1a;
}

.article-hero-image {
  width: 100%;
  max-height: 500px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 32px;
}

.article-header {
  margin-bottom: 40px;
  padding-bottom: 24px;
  border-bottom: 2px solid #e5e5e5;
}

.article-header h1 {
  font-size: 42px;
  font-weight: 700;
  margin: 0 0 20px 0;
  line-height: 1.2;
  color: #1a365d;
}

.article-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 14px;
  color: #666;
}

.excerpt {
  font-size: 20px;
  font-style: italic;
  color: #555;
  margin-top: 16px;
}

/* Clean article content from Readability */
.article-content {
  font-size: 19px;
  line-height: 1.8;
}

.article-content p {
  margin-bottom: 24px;
}

.article-content h2 {
  font-size: 32px;
  margin: 48px 0 20px 0;
  color: #1a365d;
}

.article-content img {
  max-width: 100%;
  height: auto;
  margin: 32px 0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.article-content blockquote {
  border-left: 4px solid #2C7A7B;
  padding-left: 24px;
  margin: 32px 0;
  font-style: italic;
  color: #555;
}

.quality-notice {
  background: #fff3cd;
  border: 1px solid #ffc107;
  padding: 12px 16px;
  border-radius: 6px;
  margin-top: 40px;
}
```


***

### PHASE 7: Testing Checklist

**Test with various article sources using curl commands:**

1. **Major news sites:**
    - BBC: https://www.bbc.com/news/health-...
    - NY Times: https://www.nytimes.com/...
    - The Guardian: https://www.theguardian.com/...
2. **Health/medical sites:**
    - Healthline articles
    - WebMD articles
    - Mayo Clinic health guides
3. **Blogs:**
    - Medium health articles
    - WordPress health blogs

**Verify:**

- [ ] No navigation/footer/ads visible in article content
- [ ] Images render correctly
- [ ] Author and publish date extracted (when available)
- [ ] Reading time calculated
- [ ] Typography is clean and readable
- [ ] No "programmatic prefixes" or Jina artifacts
- [ ] Article content looks professional (like Firefox Reader View)
- [ ] Caching works (second load of same article is faster)
- [ ] Error handling graceful if extraction fails

***

### PHASE 8: Deploy \& Validate

**Dev server testing:**

1. Verify article extraction works on 5-10 test URLs
2. Check browser console for errors
3. Validate Worker logs for any issues

**Production deployment:**

1. Deploy Worker: `npx wrangler deploy --config wrangler.backend.toml`
2. Deploy frontend: `npm run build && npx wrangler pages deploy dist`
3. Test on live site with real News API articles using curl comamnds ir any way you like.
4. Monitor Cloudflare Worker analytics for errors.

***

### DELIVERABLES

When complete, provide:

1. **List of modified files** with brief description of changes
2. **Screenshot or demo** showing before/after article rendering
3. **Test results** from at least 5 different article sources
4. **Performance notes** (extraction time, cache hit rate)

***

### IMPORTANT NOTES

**If `jsdom` doesn't work in Cloudflare Workers:**

- Replace with `linkedom`: `npm install linkedom`
- Change import: `import { parseHTML } from 'linkedom';`
- Change usage: `const { document } = parseHTML(html);`
- Everything else stays the same

**Mozilla Readability is 100% free:**

- No API keys needed
- No rate limits
- Apache 2.0 license (commercial use allowed)
- Same algorithm as Firefox Reader View

**This solution is battle-tested:**

- 10.5k GitHub stars
- Used by 9,300+ npm packages
- Active maintenance since 2015
- Handles thousands of site layouts

***

**Success criteria:** Articles render with clean, professional formatting identical to Firefox Reader View, with zero API costs and zero programmatic artifacts.