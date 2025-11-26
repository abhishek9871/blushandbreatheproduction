/**
 * NEWS AGGREGATOR CONFIGURATION
 * 
 * To enable the self-hosted news aggregator:
 * 
 * 1. Add Cron Trigger to wrangler.backend.toml:
 *    [triggers]
 *    crons = ["0 * * * *"]  # Runs every hour
 * 
 * 2. Add Guardian API Secret:
 *    npx wrangler secret put GUARDIAN_API_KEY --config wrangler.backend.toml
 *    Get your free API key from: https://open-platform.theguardian.com/access/
 * 
 * 3. Ensure nodejs_compat is enabled (already configured):
 *    compatibility_flags = ["nodejs_compat"]
 * 
 * The aggregator fetches from:
 * - The Guardian API (health section)
 * - Multiple RSS feeds (Medical News Today, Healthline, Mayo Clinic, NIH, Well+Good)
 * 
 * Articles are cached in MERGED_CACHE KV with key: 'latest_health_news'
 * Cache TTL: Refreshed hourly by cron job
 */

// ═══════════════════════════════════════════════════════════════════
// NEWS AGGREGATOR - RSS & GUARDIAN INTEGRATION
// ═══════════════════════════════════════════════════════════════════

// Enhanced RSS/XML parser for Workers - extracts high-quality content
function parseRSSFeed(xmlText) {
  const items = [];
  
  // Match all <item> or <entry> tags (RSS 2.0 and Atom)
  const itemRegex = /<item[\s\S]*?<\/item>|<entry[\s\S]*?<\/entry>/gi;
  const matches = xmlText.match(itemRegex) || [];
  
  for (const itemXml of matches) {
    try {
      // Helper to extract tag content with CDATA support
      const getTag = (tag) => {
        const match = itemXml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`, 'i'));
        if (!match) return '';
        let content = match[1].trim();
        // Remove CDATA wrapper
        content = content.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
        return content;
      };
      
      // Helper to extract attribute values
      const getAttr = (tag, attr) => {
        const match = itemXml.match(new RegExp(`<${tag}[^>]*\\s${attr}=["']([^"']*)["']`, 'i'));
        return match ? match[1] : '';
      };
      
      // Extract all possible attributes from a tag (for self-closing tags)
      const getAllAttrs = (tag) => {
        const match = itemXml.match(new RegExp(`<${tag}([^>]*)\\s*/?>`, 'i'));
        if (!match) return {};
        const attrStr = match[1];
        const attrs = {};
        const attrRegex = /(\w+)=["']([^"']*)["']/g;
        let attrMatch;
        while ((attrMatch = attrRegex.exec(attrStr)) !== null) {
          attrs[attrMatch[1]] = attrMatch[2];
        }
        return attrs;
      };
      
      // Helper to extract first image from HTML content
      const extractImageFromHTML = (html) => {
        if (!html) return '';
        // Look for img tags with src attribute
        const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (imgMatch) return imgMatch[1];
        
        // Look for og:image meta tags
        const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
        if (ogMatch) return ogMatch[1];
        
        return '';
      };
      
      // Helper to clean HTML and extract text
      const cleanHTML = (html) => {
        if (!html) return '';
        // Remove script and style tags
        html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
        // Keep paragraph breaks
        html = html.replace(/<\/p>/gi, '</p>\n');
        html = html.replace(/<br\s*\/?>/gi, '\n');
        // Remove remaining HTML tags but keep the content
        html = html.replace(/<[^>]+>/g, ' ');
        // Decode HTML entities
        html = html.replace(/&nbsp;/g, ' ');
        html = html.replace(/&amp;/g, '&');
        html = html.replace(/&lt;/g, '<');
        html = html.replace(/&gt;/g, '>');
        html = html.replace(/&quot;/g, '"');
        html = html.replace(/&#39;/g, "'");
        // Clean up whitespace
        html = html.replace(/\s+/g, ' ').trim();
        return html;
      };
      
      // Extract basic fields
      const title = getTag('title');
      const link = getTag('link') || getAttr('link', 'href') || getTag('guid');
      
      if (!title || !link) continue; // Skip if missing essentials
      
      // Extract content - try multiple sources for best quality
      let fullContent = getTag('content:encoded') || getTag('content') || '';
      const description = getTag('description') || getTag('summary') || '';
      
      // If content is empty or too short, use description
      if (!fullContent || fullContent.length < 200) {
        fullContent = description;
      }
      
      // Extract author
      const author = getTag('dc:creator') || getTag('author') || getTag('creator') || '';
      
      // Extract date
      const pubDate = getTag('pubDate') || getTag('published') || getTag('updated') || getTag('dc:date') || '';
      
      // Extract category/tags
      const category = getTag('category');
      
      // Extract image - try multiple sources
      let image = '';
      
      // 1. Try media:content tag
      const mediaContentAttrs = getAllAttrs('media:content');
      if (mediaContentAttrs.url && (mediaContentAttrs.medium === 'image' || mediaContentAttrs.type?.startsWith('image/'))) {
        image = mediaContentAttrs.url;
      }
      
      // 2. Try media:thumbnail
      if (!image) {
        image = getAttr('media:thumbnail', 'url');
      }
      
      // 3. Try enclosure tag (for podcasts/media)
      if (!image) {
        const enclosureAttrs = getAllAttrs('enclosure');
        if (enclosureAttrs.url && enclosureAttrs.type?.startsWith('image/')) {
          image = enclosureAttrs.url;
        }
      }
      
      // 4. Try to extract from content HTML
      if (!image && fullContent) {
        image = extractImageFromHTML(fullContent);
      }
      
      // 5. Try to extract from description HTML
      if (!image && description) {
        image = extractImageFromHTML(description);
      }
      
      // Clean description for preview (remove HTML) - keep full text
      const cleanDescription = cleanHTML(description);
      
      // Keep full content as HTML for article pages
      const contentForStorage = fullContent || description || '';
      
      items.push({
        title: title.substring(0, 300), // Limit title length
        link: link,
        description: cleanDescription,
        pubDate: pubDate,
        content: contentForStorage,
        image: image,
        author: author,
        category: category
      });
    } catch (e) {
      console.error('Error parsing RSS item:', e);
    }
  }
  
  return items;
}

// High-quality health RSS feeds - verified working endpoints (tested Nov 2025)
const HEALTH_RSS_FEEDS = [
  {
    url: 'https://feeds.bbci.co.uk/news/health/rss.xml',
    name: 'BBC Health News',
    enabled: true
  },
  {
    url: 'https://www.sciencedaily.com/rss/top/health.xml',
    name: 'ScienceDaily Health',
    enabled: true
  },
  {
    url: 'https://wwwnc.cdc.gov/travel/rss/notices.xml',
    name: 'CDC Travel Health',
    enabled: true
  },
  {
    url: 'https://www.health.harvard.edu/blog/feed',
    name: 'Harvard Health Blog',
    enabled: false // Returns 404, disabled for now
  },
  {
    url: 'https://www.wellandgood.com/feed/',
    name: 'Well+Good',
    enabled: false // Requires testing, disabled temporarily
  }
];

// Intelligently determine article category based on content
function determineCategory(title, description) {
  const text = (title + ' ' + description).toLowerCase();

  // Expanded keywords for better categorization
  // Check for Nutrition first (more specific)
  if (text.match(/\b(nutrition|diet|food|eating|meal|vitamin|protein|carb|carbohydrate|calorie|supplement|nutrient|superfood|recipe|ingredient|snack|breakfast|lunch|dinner|vegan|vegetarian|organic|healthy eating|balanced diet|omega|fiber|antioxidant|mineral)\b/i)) {
    return 'Nutrition';
  }

  // Check for Fitness (very specific keywords)
  if (text.match(/\b(fitness|exercise|workout|gym|training|running|yoga|sport|muscle|cardio|athletic|strength|endurance|jogging|swimming|cycling|pilates|aerobic|marathon|weight lifting|bodybuilding|crossfit|hiit|walking|physical activity|active lifestyle)\b/i)) {
    return 'Fitness';
  }

  // Check for Mental Health
  if (text.match(/\b(mental|anxiety|depression|stress|therapy|mindfulness|meditation|psychology|wellbeing|well-being|psychiatric|counseling|cognitive|emotional|bipolar|ptsd|adhd|autism|self-care|resilience|mindset|happiness|mood)\b/i)) {
    return 'Mental Health';
  }

  // Check for Skincare/Beauty
  if (text.match(/\b(skin|skincare|beauty|cosmetic|acne|wrinkle|facial|moisturizer|sunscreen|dermatology|complexion|anti-aging|serum|cleanser|exfoliat|pore|blemish|collagen|retinol|spf|uv protection|makeup|hair care)\b/i)) {
    return 'Skincare';
  }

  return 'Health'; // Default category for general health topics
}

// Fetch articles from The Guardian API
async function fetchGuardianNews(env, query = null) {
  const apiKey = env.GUARDIAN_API_KEY;
  if (!apiKey || apiKey === 'PLACEHOLDER') {
    console.log('Guardian API key not configured, skipping Guardian fetch');
    return [];
  }

  try {
    const allArticles = [];
    // If query is provided, just fetch 1 page of results
    const maxPages = query ? 1 : 3;
    
    // Fetch pages
    for (let page = 1; page <= maxPages; page++) {
      const url = new URL('https://content.guardianapis.com/search');
      
      // Use provided query or default health topics
      const searchQuery = query 
        ? `${query} AND (health OR wellness OR nutrition OR fitness OR mental health OR skincare OR beauty)`
        : 'health OR wellness OR nutrition OR fitness OR mental health OR skincare OR beauty';
        
      url.searchParams.set('q', searchQuery);
      url.searchParams.set('show-fields', 'body,thumbnail,trailText');
      url.searchParams.set('page-size', '50'); // Maximum allowed by Guardian API
      url.searchParams.set('page', String(page));
      url.searchParams.set('api-key', apiKey);

      const response = await fetch(url.toString());
      if (!response.ok) {
        console.error(`Guardian API error on page ${page}:`, response.status);
        continue; // Skip this page but continue with others
      }

      const data = await response.json();
      const articles = (data.response?.results || []).map(item => {
        const title = item.webTitle;
        const description = item.fields?.trailText || '';
        
        return {
          id: item.webUrl,
          url: item.webUrl,
          title: title,
          description: description,
          content: item.fields?.body || '',
          image: item.fields?.thumbnail || '',
          source: 'The Guardian',
          publishedAt: item.webPublicationDate,
          category: determineCategory(title, description) // Smart categorization
        };
      });

      allArticles.push(...articles);
      console.log(`Fetched ${articles.length} articles from The Guardian (page ${page})`);
      
      // Small delay between requests to be respectful to the API
      if (page < 3) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    console.log(`Total fetched from The Guardian: ${allArticles.length} articles`);
    return allArticles;
  } catch (error) {
    console.error('Error fetching Guardian news:', error);
    return [];
  }
}

// Fetch and parse RSS feeds with enhanced quality extraction
async function fetchRSSFeeds() {
  const allArticles = [];
  let totalAttempted = 0;
  let totalSuccess = 0;

  for (const feed of HEALTH_RSS_FEEDS) {
    if (!feed.enabled) continue;
    
    totalAttempted++;
    
    try {
      console.log(`[RSS] Fetching from ${feed.name}...`);
      
      const response = await fetch(feed.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BlushAndBreathe/1.0; +https://jyotilalchandani.pages.dev)',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*'
        },
        cf: {
          cacheTtl: 1800, // Cache for 30 minutes
          cacheEverything: true
        }
      });

      if (!response.ok) {
        console.error(`[RSS] ${feed.name} returned status ${response.status}`);
        continue;
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('xml') && !contentType.includes('rss') && !contentType.includes('atom')) {
        console.warn(`[RSS] ${feed.name} returned unexpected content-type: ${contentType}`);
      }

      const xmlText = await response.text();
      
      if (!xmlText || xmlText.length < 100) {
        console.error(`[RSS] ${feed.name} returned empty or invalid XML`);
        continue;
      }
      
      const items = parseRSSFeed(xmlText);

      if (items.length === 0) {
        console.warn(`[RSS] ${feed.name} parsed but found 0 items`);
        continue;
      }

      // Process each item from this feed
      let validItems = 0;
      for (const item of items) {
        // Validate item has required fields
        if (!item.title || !item.link) {
          continue;
        }
        
        const title = item.title;
        const rawDescription = item.description || '';
        const rawContent = item.content || '';
        
        // Smart content/description handling:
        // - If content:encoded exists, use it as content and description as summary
        // - If only description exists and it's long (>300 chars), it's likely the full content
        //   In this case, create a short description from the first ~200 chars
        // - If description is short (<300 chars), it's a summary and we may not have full content
        
        let finalDescription = rawDescription;
        let finalContent = rawContent;
        
        // Check if content is empty or same as description
        const contentIsEmpty = !rawContent || rawContent.trim() === rawDescription.trim();
        
        if (contentIsEmpty && rawDescription.length > 300) {
          // Description is actually the full content (e.g., Science Daily)
          // Use it as content, keep full description (frontend fetches real content via Readability)
          finalContent = rawDescription;
          // Keep the full description - don't truncate it
          finalDescription = rawDescription;
        } else if (contentIsEmpty) {
          // Short description only (e.g., BBC) - mark that full content needs fetching
          finalContent = rawDescription; // Use what we have, frontend will fetch full article
        }
        
        // Fallback to title if still empty
        if (!finalDescription) finalDescription = title;
        if (!finalContent) finalContent = finalDescription;
        
        // Create article object with high-quality data
        const article = {
          id: item.link,
          url: item.link,
          title: title,
          description: finalDescription,
          content: finalContent,
          image: item.image || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800',
          source: feed.name,
          publishedAt: item.pubDate || new Date().toISOString(),
          category: determineCategory(title, rawDescription),
          author: item.author || feed.name
        };
        
        allArticles.push(article);
        validItems++;
      }

      totalSuccess++;
      console.log(`[RSS] ✓ ${feed.name}: ${validItems} articles extracted`);
      
      // Small delay between feeds to avoid overwhelming servers
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`[RSS] ✗ ${feed.name} failed:`, error.message);
      continue;
    }
  }

  console.log(`[RSS] Summary: ${totalSuccess}/${totalAttempted} feeds successful, ${allArticles.length} total articles`);
  return allArticles;
}

// Normalize, deduplicate, and mix articles for engaging experience
function normalizeAndDeduplicate(articles) {
  const seen = new Set();
  const unique = [];
  const sourceGroups = {
    guardian: [],
    rss: []
  };

  // First pass: deduplicate and group by source
  for (const article of articles) {
    if (!article.url || seen.has(article.url)) {
      continue; // Skip if no URL or duplicate
    }
    
    seen.add(article.url);
    
    // Format date consistently
    let formattedDate;
    try {
      const date = new Date(article.publishedAt);
      if (isNaN(date.getTime())) {
        formattedDate = new Date().toISOString().split('T')[0];
      } else {
        formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
      }
    } catch {
      formattedDate = new Date().toISOString().split('T')[0];
    }

    const normalizedArticle = {
      id: article.url, // Use URL as ID for frontend routing
      title: article.title || 'Untitled Article',
      description: article.description || '',
      imageUrl: article.image || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800',
      category: article.category || 'Health',
      date: formattedDate,
      content: article.content || article.description || '',
      source: article.source || 'Unknown',
      author: article.author || ''
    };

    // Group by source for intelligent mixing
    if (article.source === 'The Guardian') {
      sourceGroups.guardian.push(normalizedArticle);
    } else {
      sourceGroups.rss.push(normalizedArticle);
    }
  }

  // Sort each group by date (newest first)
  sourceGroups.guardian.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  sourceGroups.rss.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Intelligent mixing: Alternate between sources for diversity
  // Pattern: 2 Guardian, 1 RSS, 2 Guardian, 1 RSS, etc.
  // This creates an engaging, varied feed
  let guardianIndex = 0;
  let rssIndex = 0;
  let pattern = 0; // 0-1: Guardian, 2: RSS
  
  while (guardianIndex < sourceGroups.guardian.length || rssIndex < sourceGroups.rss.length) {
    if (pattern < 2 && guardianIndex < sourceGroups.guardian.length) {
      // Add Guardian article
      unique.push(sourceGroups.guardian[guardianIndex++]);
      pattern++;
    } else if (rssIndex < sourceGroups.rss.length) {
      // Add RSS article
      unique.push(sourceGroups.rss[rssIndex++]);
      pattern = 0; // Reset pattern
    } else if (guardianIndex < sourceGroups.guardian.length) {
      // If RSS exhausted, add remaining Guardian
      unique.push(sourceGroups.guardian[guardianIndex++]);
    }
  }

  console.log(`[Normalization] Mixed ${sourceGroups.guardian.length} Guardian + ${sourceGroups.rss.length} RSS = ${unique.length} total articles`);
  
  return unique;
}

// INLINE Durable Object so Wrangler detects it reliably
export class AffiliateCounter {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname || '';
    try {
      if (request.method === 'POST' && path.endsWith('/click')) {
        return await this._handleClick(request);
      }
      if (request.method === 'POST' && path.endsWith('/clear')) {
        return await this._handleClear();
      }
      if (request.method === 'GET' && path.endsWith('/stats')) {
        return await this._handleStats();
      }
      return new Response(JSON.stringify({ error: 'not_found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    } catch (err) {
      return new Response(JSON.stringify({ error: 'do_error', detail: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  }

  async _handleClick(request) {
    const body = await request.json().catch(() => ({}));
    const barcode = body.barcode || 'unknown';
    const offerItemId = body.offerItemId || null;
    const affiliateUrl = (body.affiliateUrl || '').toString().slice(0, 256);
    const ip = body.ip || 'unknown';
    const ua = (body.userAgent || '').toString().slice(0, 200);
    const ts = body.timestamp || new Date().toISOString();

    const countKey = 'count';
    const clicksKey = 'clicks';

    const currentCount = (await this.state.storage.get(countKey)) || 0;
    const clicks = (await this.state.storage.get(clicksKey)) || [];

    const newClick = { ts, barcode, offerItemId, affiliateUrl, ip, ua };
    const updatedClicks = [newClick, ...clicks].slice(0, 200);

    await this.state.storage.put(countKey, currentCount + 1);
    await this.state.storage.put(clicksKey, updatedClicks);

    return new Response(JSON.stringify({ ok: true, newCount: currentCount + 1 }), { headers: { 'Content-Type': 'application/json' } });
  }

  async _handleStats() {
    const count = (await this.state.storage.get('count')) || 0;
    const clicks = (await this.state.storage.get('clicks')) || [];
    return new Response(JSON.stringify({ count, lastClicks: clicks.slice(0, 10) }), { headers: { 'Content-Type': 'application/json' } });
  }

  async _handleClear() {
    await this.state.storage.delete('count');
    await this.state.storage.delete('clicks');
    return new Response(JSON.stringify({ ok: true, cleared: true }), { headers: { 'Content-Type': 'application/json' } });
  }
}

// Helper function to fetch food data from USDA API with retry logic
async function fetchUSDAFood(apiKey, query, retries = 3) {
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=1&api_key=${apiKey}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'BlushAndBreathe/1.0 (+https://jyotilalchandani.pages.dev)'
        }
      });

      if (response.ok) {
        return await response.json();
      }

      if (response.status === 429) {
        // Rate limited, wait longer
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      if (response.status >= 500 && attempt < retries) {
        // Server error, retry
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // Other errors, don't retry
      throw new Error(`USDA API error: ${response.status}`);

    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// High-quality curated food images by category (Unsplash CDN - reliable and fast)
const FOOD_CATEGORY_IMAGES = {
  // Fruits (with plurals)
  apple: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&q=80',
  apples: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&q=80',
  banana: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&q=80',
  bananas: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&q=80',
  orange: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=400&q=80',
  oranges: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=400&q=80',
  strawberry: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400&q=80',
  strawberries: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400&q=80',
  blueberry: 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=400&q=80',
  blueberries: 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=400&q=80',
  grape: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=400&q=80',
  grapes: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=400&q=80',
  mango: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&q=80',
  mangoes: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&q=80',
  pineapple: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=400&q=80',
  watermelon: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&q=80',
  lemon: 'https://images.unsplash.com/photo-1590502593747-42a996133562?w=400&q=80',
  lemons: 'https://images.unsplash.com/photo-1590502593747-42a996133562?w=400&q=80',
  lime: 'https://images.unsplash.com/photo-1590502593747-42a996133562?w=400&q=80',
  avocado: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400&q=80',
  avocados: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400&q=80',
  peach: 'https://images.unsplash.com/photo-1629828874514-c1e5103f2e40?w=400&q=80',
  peaches: 'https://images.unsplash.com/photo-1629828874514-c1e5103f2e40?w=400&q=80',
  cherry: 'https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=400&q=80',
  cherries: 'https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=400&q=80',
  kiwi: 'https://images.unsplash.com/photo-1585059895524-72359e06133a?w=400&q=80',
  papaya: 'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?w=400&q=80',
  guava: 'https://images.unsplash.com/photo-1536511132770-e5058c7e8c46?w=400&q=80',
  pomegranate: 'https://images.unsplash.com/photo-1541344999736-83eca272f6fc?w=400&q=80',
  
  // Vegetables (with plurals)
  broccoli: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400&q=80',
  carrot: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&q=80',
  carrots: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&q=80',
  spinach: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&q=80',
  palak: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&q=80',
  tomato: 'https://images.unsplash.com/photo-1546470427-0d4db154cde8?w=400&q=80',
  tomatoes: 'https://images.unsplash.com/photo-1546470427-0d4db154cde8?w=400&q=80',
  potato: 'https://images.unsplash.com/photo-1518977676601-b53f82ber44?w=400&q=80',
  potatoes: 'https://images.unsplash.com/photo-1518977676601-b53f82ber44?w=400&q=80',
  aloo: 'https://images.unsplash.com/photo-1518977676601-b53f82ber44?w=400&q=80',
  onion: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&q=80',
  onions: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&q=80',
  cucumber: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=400&q=80',
  cucumbers: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=400&q=80',
  lettuce: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400&q=80',
  pepper: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400&q=80',
  peppers: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400&q=80',
  capsicum: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400&q=80',
  corn: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&q=80',
  maize: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&q=80',
  beans: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=400&q=80',
  peas: 'https://images.unsplash.com/photo-1587735243474-e9d39f6d4e8e?w=400&q=80',
  matar: 'https://images.unsplash.com/photo-1587735243474-e9d39f6d4e8e?w=400&q=80',
  cabbage: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=400&q=80',
  gobhi: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=400&q=80',
  cauliflower: 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=400&q=80',
  celery: 'https://images.unsplash.com/photo-1580391564590-aeca65c5e2d3?w=400&q=80',
  mushroom: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80',
  mushrooms: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80',
  eggplant: 'https://images.unsplash.com/photo-1615484477778-ca3b77940c25?w=400&q=80',
  brinjal: 'https://images.unsplash.com/photo-1615484477778-ca3b77940c25?w=400&q=80',
  baingan: 'https://images.unsplash.com/photo-1615484477778-ca3b77940c25?w=400&q=80',
  okra: 'https://images.unsplash.com/photo-1425543103986-22abb7d7e8d2?w=400&q=80',
  bhindi: 'https://images.unsplash.com/photo-1425543103986-22abb7d7e8d2?w=400&q=80',
  garlic: 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2f85?w=400&q=80',
  ginger: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400&q=80',
  
  // Proteins (with plurals)
  chicken: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&q=80',
  beef: 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=400&q=80',
  pork: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400&q=80',
  fish: 'https://images.unsplash.com/photo-1510130387422-82bed34b37e9?w=400&q=80',
  salmon: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&q=80',
  tuna: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&q=80',
  shrimp: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=400&q=80',
  prawns: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=400&q=80',
  egg: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=400&q=80',
  eggs: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=400&q=80',
  omelette: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&q=80',
  omelet: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&q=80',
  scrambled: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&q=80',
  boiled: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=400&q=80',
  fried: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&q=80',
  turkey: 'https://images.unsplash.com/photo-1574672280600-4accfa5b6f98?w=400&q=80',
  lamb: 'https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=400&q=80',
  mutton: 'https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=400&q=80',
  bacon: 'https://images.unsplash.com/photo-1606851091851-e8c8c0fca5ba?w=400&q=80',
  sausage: 'https://images.unsplash.com/photo-1432139509613-5c4255815697?w=400&q=80',
  sausages: 'https://images.unsplash.com/photo-1432139509613-5c4255815697?w=400&q=80',
  tofu: 'https://images.unsplash.com/photo-1628689469838-524a4a973b8e?w=400&q=80',
  tempeh: 'https://images.unsplash.com/photo-1628689469838-524a4a973b8e?w=400&q=80',
  
  // Dairy & Indian Dairy (with plurals)
  milk: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80',
  cheese: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&q=80',
  paneer: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&q=80',
  cottage: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&q=80',
  curd: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80',
  dahi: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80',
  yogurt: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80',
  yoghurt: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80',
  butter: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&q=80',
  ghee: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&q=80',
  cream: 'https://images.unsplash.com/photo-1587657262400-5e78cd77a3a1?w=400&q=80',
  lassi: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=400&q=80',
  
  // Grains & Carbs
  bread: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80',
  rice: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=400&q=80',
  pasta: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&q=80',
  oats: 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=400&q=80',
  cereal: 'https://images.unsplash.com/photo-1521483451569-e33803c0330c?w=400&q=80',
  quinoa: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80',
  noodle: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&q=80',
  
  // Nuts & Seeds
  almond: 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400&q=80',
  peanut: 'https://images.unsplash.com/photo-1567892320421-1c657571ea4f?w=400&q=80',
  walnut: 'https://images.unsplash.com/photo-1563412885-139e4045ec09?w=400&q=80',
  cashew: 'https://images.unsplash.com/photo-1509912033470-1de0f06b4f9f?w=400&q=80',
  
  // Beverages
  coffee: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80',
  tea: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80',
  juice: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&q=80',
  smoothie: 'https://images.unsplash.com/photo-1502741224143-90386d7f8c82?w=400&q=80',
  soda: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80',
  
  // Prepared Foods & Indian Dishes
  pizza: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80',
  burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
  hamburger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
  sandwich: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&q=80',
  sandwiches: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&q=80',
  salad: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80',
  soup: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80',
  steak: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400&q=80',
  taco: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&q=80',
  tacos: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&q=80',
  burrito: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&q=80',
  sushi: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&q=80',
  curry: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400&q=80',
  biryani: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80',
  pulao: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80',
  fries: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80',
  // Indian Foods
  dal: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=80',
  daal: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=80',
  lentil: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=80',
  lentils: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=80',
  roti: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80',
  chapati: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80',
  naan: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80',
  paratha: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80',
  idli: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&q=80',
  dosa: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=400&q=80',
  samosa: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80',
  pakora: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80',
  chutney: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&q=80',
  raita: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80',
  kheer: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80',
  halwa: 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=400&q=80',
  gulab: 'https://images.unsplash.com/photo-1666190094665-2ce76d8d9f6f?w=400&q=80',
  jalebi: 'https://images.unsplash.com/photo-1601303516150-2621a6e67ca5?w=400&q=80',
  ladoo: 'https://images.unsplash.com/photo-1605197040668-1bbdd3e52cb0?w=400&q=80',
  laddu: 'https://images.unsplash.com/photo-1605197040668-1bbdd3e52cb0?w=400&q=80',
  chana: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80',
  chickpea: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80',
  chickpeas: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80',
  rajma: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80',
  kidney: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80',
  
  // Desserts & Sweets (with plurals)
  cake: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80',
  cakes: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80',
  cookie: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&q=80',
  cookies: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&q=80',
  biscuit: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&q=80',
  biscuits: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&q=80',
  chocolate: 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=400&q=80',
  ice: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400&q=80',
  icecream: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400&q=80',
  donut: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&q=80',
  donuts: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&q=80',
  doughnut: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&q=80',
  pie: 'https://images.unsplash.com/photo-1535920527002-b35e96722eb9?w=400&q=80',
  pies: 'https://images.unsplash.com/photo-1535920527002-b35e96722eb9?w=400&q=80',
  pudding: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80',
  pancake: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80',
  pancakes: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80',
  waffle: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=400&q=80',
  waffles: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=400&q=80',
  muffin: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=400&q=80',
  muffins: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=400&q=80',
  brownie: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&q=80',
  brownies: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&q=80',
  candy: 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=400&q=80',
  honey: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&q=80',
  sugar: 'https://images.unsplash.com/photo-1581441117193-63e8f0f30f59?w=400&q=80',
  
  // Default fallbacks by category
  fruit: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&q=80',
  vegetable: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80',
  meat: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&q=80',
  seafood: 'https://images.unsplash.com/photo-1579631542720-3a87824fff86?w=400&q=80',
  dairy: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400&q=80',
  grain: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80',
  snack: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400&q=80',
  beverage: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80',
  default: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80'
};

// Extract primary food keyword from complex USDA descriptions
function extractFoodKeyword(description) {
  if (!description) return null;
  
  const lowerDesc = description.toLowerCase();
  
  // Check for exact matches first
  for (const keyword of Object.keys(FOOD_CATEGORY_IMAGES)) {
    if (lowerDesc.includes(keyword)) {
      return keyword;
    }
  }
  
  // Extract first meaningful word (skip common prefixes)
  const skipWords = ['raw', 'cooked', 'fresh', 'frozen', 'canned', 'dried', 'organic', 'fast', 'food', 'foods', 'with', 'without', 'plain', 'whole', 'sliced', 'diced', 'chopped', 'ground', 'boiled', 'fried', 'baked', 'grilled', 'roasted', 'steamed'];
  
  const words = lowerDesc
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !skipWords.includes(word));
  
  if (words.length > 0) {
    // Check if first word matches any category
    for (const word of words) {
      if (FOOD_CATEGORY_IMAGES[word]) {
        return word;
      }
    }
  }
  
  return null;
}

// Get curated image URL for a food item
function getCuratedFoodImage(description) {
  const keyword = extractFoodKeyword(description);
  if (keyword && FOOD_CATEGORY_IMAGES[keyword]) {
    return FOOD_CATEGORY_IMAGES[keyword];
  }
  return null;
}

// Helper function to fetch image from Pexels API (better for food images)
async function fetchPexelsImage(query, apiKey) {
  if (!apiKey) return null;
  
  try {
    const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query + ' food')}&per_page=1&orientation=landscape`, {
      headers: {
        'Authorization': apiKey
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (data.photos && data.photos.length > 0) {
        return data.photos[0].src.medium; // Use medium size for faster loading
      }
    }
    return null;
  } catch (error) {
    console.error('Pexels API error:', error);
    return null;
  }
}

// Helper function to fetch image from Unsplash API (fallback)
async function fetchUnsplashImage(query, accessKey) {
  if (!accessKey) return null;
  
  try {
    const response = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`, {
      headers: {
        'Authorization': `Client-ID ${accessKey}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return data.results[0].urls.regular;
      }
    }
    return null;
  } catch (error) {
    console.error('Unsplash API error:', error);
    return null;
  }
}

// Helper function to transform USDA food data to our NutritionInfo format
async function transformUSDAData(food, index, page, env) {
  try {
    if (!food || !food.foodNutrients) {
      return null;
    }

    // Extract nutrients (protein, carbs, fats per 100g)
    let protein = 0, carbs = 0, fats = 0;

    food.foodNutrients.forEach(nutrient => {
      const value = parseFloat(nutrient.value) || 0;
      const unit = nutrient.unitName?.toLowerCase();

      if (nutrient.nutrientName?.toLowerCase().includes('protein')) {
        protein = Math.round(value * 10) / 10;
      } else if (nutrient.nutrientName?.toLowerCase().includes('carbohydrate')) {
        carbs = Math.round(value * 10) / 10;
      } else if (nutrient.nutrientName?.toLowerCase().includes('fat') && !nutrient.nutrientName?.toLowerCase().includes('trans')) {
        fats = Math.round(value * 10) / 10;
      }
    });

    // Get serving size info
    const servingSize = food.servingSize || 100;
    const servingUnit = food.servingSizeUnit || 'g';

    // Get image URL using smart curated image system
    // Priority: 1. Curated images (instant, accurate) 2. Pexels API 3. Unsplash API 4. Default fallback
    let imageUrl = FOOD_CATEGORY_IMAGES.default; // Default fallback
    
    // First, try to get a curated image (fastest and most accurate)
    const curatedImage = getCuratedFoodImage(food.description);
    if (curatedImage) {
      imageUrl = curatedImage;
    } else {
      // If no curated image, try Pexels API (better food photos than Unsplash)
      const rawTerm = food.description?.split(',')[0] || food.description || 'food';
      const searchTerms = rawTerm.trim();
      
      // Try Pexels first (better for food images)
      const pexelsKey = env.PEXELS_API_KEY;
      if (pexelsKey) {
        const pexelsUrl = await fetchPexelsImage(searchTerms, pexelsKey);
        if (pexelsUrl) {
          imageUrl = pexelsUrl;
        }
      }
      
      // If Pexels fails, try Unsplash as fallback
      if (imageUrl === FOOD_CATEGORY_IMAGES.default) {
        const unsplashKey = env.UNSPLASH_ACCESS_KEY || '45KTR6-Zue9Pkb6Obw4swYQE7r0iUqfa-ghgJc73UpI';
        const unsplashUrl = await fetchUnsplashImage(searchTerms, unsplashKey);
        if (unsplashUrl) {
          imageUrl = unsplashUrl;
        }
      }
    }

    // Generate description based on nutrients
    const benefits = [];
    if (protein > 10) benefits.push('High in protein');
    if (carbs > 20) benefits.push('Good carbohydrate source');
    if (fats > 10) benefits.push('Contains healthy fats');
    if (protein > 5 && carbs > 10 && fats > 5) benefits.push('Balanced macronutrients');

    const description = benefits.length > 0
      ? `${benefits.join(', ')}. Approximate nutrition facts per ${servingSize}${servingUnit} of ${food.description || 'food'}.`
      : `Approximate nutrition facts per ${servingSize}${servingUnit} of ${food.description || 'food'}.`;

    return {
      id: food.fdcId ? `usda-food-${food.fdcId}` : `usda-search-${food.description?.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() || 'unknown'}-${index}`,
      name: food.description || `Food Item ${index + 1}`,
      description,
      imageUrl,
      nutrients: {
        protein: Math.max(0, protein),
        carbs: Math.max(0, carbs),
        fats: Math.max(0, fats)
      }
    };

  } catch (error) {
    console.error('Error transforming USDA data:', error);
    return null;
  }
}

// Advanced Mode default export with full routing
export default {
  // Scheduled handler for news aggregator cron job
  async scheduled(event, env, ctx) {
    console.log(`[News Aggregator] Cron job started at: ${new Date().toISOString()}`);
    
    try {
      // Fetch articles from all sources
      console.log('[News Aggregator] Fetching from Guardian API...');
      const guardianArticles = await fetchGuardianNews(env);
      
      console.log('[News Aggregator] Fetching from RSS feeds...');
      const rssArticles = await fetchRSSFeeds();
      
      // Combine and deduplicate
      console.log('[News Aggregator] Normalizing and deduplicating...');
      const allArticles = normalizeAndDeduplicate([...guardianArticles, ...rssArticles]);
      
      console.log(`[News Aggregator] Total unique articles: ${allArticles.length}`);
      
      // Store in KV (MERGED_CACHE)
      await env.MERGED_CACHE?.put(
        'latest_health_news', 
        JSON.stringify(allArticles),
        {
          expirationTtl: 86400 // 24 hours TTL as backup
        }
      );
      
      console.log(`[News Aggregator] Successfully updated KV with ${allArticles.length} health articles`);
      console.log('[News Aggregator] Cron job completed successfully');
      
    } catch (error) {
      console.error('[News Aggregator] Cron job error:', error);
      // Don't throw - let the cron retry naturally
    }
  },

  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Affiliate click tracking
    if (path === '/api/affiliate/click' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { barcode, offerItemId, affiliateUrl, timestamp } = body;

        if (!barcode || !offerItemId || !affiliateUrl) {
          return new Response(JSON.stringify({ error: 'Missing required fields' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';

        try {
          const id = env.AFFILIATE_DO.idFromName(barcode);
          const stub = env.AFFILIATE_DO.get(id);

          const doResponse = await stub.fetch('https://do/click', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ barcode, offerItemId, affiliateUrl, timestamp, ip, userAgent })
          });

          if (doResponse.ok) {
            const result = await doResponse.json();
            return new Response(JSON.stringify({ ok: true, newCount: result.newCount }), {
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
          }
        } catch (doError) {
          console.warn('DO unavailable, using KV fallback:', doError);
        }

        // KV Fallback
        const clickData = {
          barcode,
          offerItemId,
          affiliateUrl: affiliateUrl.substring(0, 256),
          timestamp: timestamp || new Date().toISOString(),
          ip,
          userAgent: userAgent.substring(0, 100)
        };

        const clickKey = `AFFILIATE:CLICKS:${barcode}:${Date.now()}`;
        await env.AFFILIATE_KV.put(clickKey, JSON.stringify(clickData));

        const countKey = `AFFILIATE:COUNT:${barcode}`;
        const currentCount = await env.AFFILIATE_KV.get(countKey);
        const newCount = (parseInt(currentCount || '0') + 1).toString();
        await env.AFFILIATE_KV.put(countKey, newCount);

        return new Response(JSON.stringify({ ok: true, newCount: parseInt(newCount), fallback: true }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (error) {
        console.error('Affiliate click tracking error:', error);
        return new Response(JSON.stringify({ error: 'Failed to track click' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // Admin stats
    const statsMatch = path.match(/^\/api\/admin\/products\/([^/]+)\/stats$/);
    if (statsMatch && request.method === 'GET') {
      const barcode = statsMatch[1];
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Missing authorization' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      const token = authHeader.substring(7);
      const adminPassword = env.ADMIN_PASSWORD || 'admin123';
      if (token !== adminPassword) {
        return new Response(JSON.stringify({ error: 'Invalid authorization' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      try {
        const id = env.AFFILIATE_DO.idFromName(barcode);
        const stub = env.AFFILIATE_DO.get(id);

        const doResponse = await stub.fetch('https://do/stats', {
          method: 'GET'
        });

        if (doResponse.ok) {
          const stats = await doResponse.json();
          return new Response(JSON.stringify(stats), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }
      } catch (doError) {
        console.warn('DO unavailable, using KV fallback:', doError);
      }

      // KV Fallback
      const countKey = `AFFILIATE:COUNT:${barcode}`;
      const count = parseInt(await env.AFFILIATE_KV.get(countKey) || '0');

      const clicksList = await env.AFFILIATE_KV.list({ prefix: `AFFILIATE:CLICKS:${barcode}:` });
      const recentClicks = [];

      for (const key of clicksList.keys.slice(0, 5)) {
        const clickData = await env.AFFILIATE_KV.get(key.name);
        if (clickData) {
          recentClicks.push(JSON.parse(clickData));
        }
      }

      return new Response(JSON.stringify({
        count,
        lastClicks: recentClicks,
        fallback: true
      }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Admin clear
    const clearMatch = path.match(/^\/api\/admin\/products\/([^/]+)\/clear$/);
    if (clearMatch && request.method === 'POST') {
      const barcode = clearMatch[1];
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Missing authorization' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      const token = authHeader.substring(7);
      const adminPassword = env.ADMIN_PASSWORD || 'admin123';
      if (token !== adminPassword) {
        return new Response(JSON.stringify({ error: 'Invalid authorization' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      try {
        const id = env.AFFILIATE_DO.idFromName(barcode);
        const stub = env.AFFILIATE_DO.get(id);

        const doResponse = await stub.fetch('https://do/clear', {
          method: 'POST'
        });

        if (doResponse.ok) {
          return new Response(JSON.stringify({ ok: true, cleared: true }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }
      } catch (doError) {
        console.warn('DO unavailable:', doError);
      }

      return new Response(JSON.stringify({ ok: true, cleared: true }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Dev KV clear
    if (path === '/api/dev/kv-clear' && request.method === 'POST') {
      const authHeader = request.headers.get('Authorization');
      const adminPassword = env.ADMIN_PASSWORD || 'admin123';
      const expected = `Bearer ${adminPassword}`;
      if (authHeader !== expected) {
        return new Response(JSON.stringify({ error: 'unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      const body = await request.json().catch(() => ({}));
      const barcode = body.barcode;
      if (!barcode) {
        return new Response(JSON.stringify({ error: 'missing barcode' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      const countKey = `AFFILIATE:COUNT:${barcode}`;
      await env.AFFILIATE_KV.delete(countKey);

      const clicksList = await env.AFFILIATE_KV.list({ prefix: `AFFILIATE:CLICKS:${barcode}:` });
      const deletePromises = clicksList.keys.map(key => env.AFFILIATE_KV.delete(key.name));
      await Promise.all(deletePromises);

      return new Response(JSON.stringify({ ok: true, deleted: countKey, clicksDeleted: clicksList.keys.length }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Manual trigger for news aggregator (admin only)
    if (path === '/api/admin/refresh-news' && request.method === 'POST') {
      const authHeader = request.headers.get('Authorization');
      const adminPassword = env.ADMIN_PASSWORD || 'admin123';
      if (!authHeader || authHeader !== `Bearer ${adminPassword}`) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      try {
        console.log('[Manual Trigger] Starting news aggregation...');
        
        console.log('[Manual Trigger] Fetching Guardian articles...');
        const guardianArticles = await fetchGuardianNews(env);
        console.log(`[Manual Trigger] Guardian returned ${guardianArticles.length} articles`);
        
        console.log('[Manual Trigger] Fetching RSS feeds...');
        const rssArticles = await fetchRSSFeeds();
        console.log(`[Manual Trigger] RSS returned ${rssArticles.length} articles`);
        
        console.log('[Manual Trigger] Normalizing...');
        const allArticles = normalizeAndDeduplicate([...guardianArticles, ...rssArticles]);
        console.log(`[Manual Trigger] Final count: ${allArticles.length} articles`);
        
        await env.MERGED_CACHE?.put(
          'latest_health_news', 
          JSON.stringify(allArticles),
          { expirationTtl: 86400 }
        );
        
        return new Response(JSON.stringify({ 
          success: true, 
          articlesCount: allArticles.length,
          guardianCount: guardianArticles.length,
          rssCount: rssArticles.length,
          message: 'News cache refreshed successfully'
        }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (error) {
        console.error('[Manual Trigger] Error:', error);
        console.error('[Manual Trigger] Error stack:', error.stack);
        return new Response(JSON.stringify({ error: String(error), stack: error.stack }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // News API - Serves cached health articles from aggregator
    if (path === '/api/newsapi' && request.method === 'GET') {
      try {
        // Get cached articles from KV
        const articlesJson = await env.MERGED_CACHE?.get('latest_health_news');
        
        if (!articlesJson) {
          // Cache warming up - return helpful message
          return new Response(JSON.stringify({ 
            status: 'warming_up', 
            message: 'News cache is warming up. Please try again in a moment.',
            articles: []
          }), {
            status: 503,
            headers: { 
              'Content-Type': 'application/json', 
              'Access-Control-Allow-Origin': '*',
              'Retry-After': '60'
            }
          });
        }

        let articles = JSON.parse(articlesJson);

        // Support pagination and filtering via query params
        const url = new URL(request.url);
        const searchQuery = url.searchParams.get('q');
        
        // If search query is present, fetch fresh results from Guardian
        if (searchQuery) {
            try {
                // Check cache for this specific search query first
                const searchCacheKey = `search_results:${searchQuery}`;
                const cachedSearch = await env.MERGED_CACHE?.get(searchCacheKey);
                
                if (cachedSearch) {
                    const parsedCache = JSON.parse(cachedSearch);
                    // 1 hour TTL for search results
                    if (Date.now() - parsedCache.timestamp < 3600000) {
                        return new Response(JSON.stringify({
                            status: 'ok',
                            totalResults: parsedCache.articles.length,
                            articles: parsedCache.articles,
                            source: 'cache'
                        }), {
                            headers: { 
                                'Content-Type': 'application/json', 
                                'Access-Control-Allow-Origin': '*',
                                'Cache-Control': 'public, max-age=3600',
                                'X-Source': 'self-hosted-aggregator'
                            }
                        });
                    }
                }

                // Fetch fresh results
                const guardianResults = await fetchGuardianNews(env, searchQuery);
                const normalizedResults = normalizeAndDeduplicate(guardianResults);
                
                // Cache the results
                await env.MERGED_CACHE?.put(searchCacheKey, JSON.stringify({
                    timestamp: Date.now(),
                    articles: normalizedResults
                }), { expirationTtl: 3600 }); // 1 hour

                return new Response(JSON.stringify({
                    status: 'ok',
                    totalResults: normalizedResults.length,
                    articles: normalizedResults,
                    source: 'api'
                }), {
                    headers: { 
                        'Content-Type': 'application/json', 
                        'Access-Control-Allow-Origin': '*',
                        'Cache-Control': 'public, max-age=3600',
                        'X-Source': 'self-hosted-aggregator'
                    }
                });
            } catch (error) {
                console.error('Search error:', error);
                // Fallback to filtering cached articles if search fails
            }
        }
        
        // Check for single article fetch by ID
        const id = url.searchParams.get('id');
        if (id) {
            const article = articles.find(a => a.id === id || a.url === id);
            if (article) {
                return new Response(JSON.stringify({
                    status: 'ok',
                    totalResults: 1,
                    articles: [article]
                }), {
                    headers: { 
                        'Content-Type': 'application/json', 
                        'Access-Control-Allow-Origin': '*',
                        'Cache-Control': 'public, max-age=3600',
                        'X-Source': 'self-hosted-aggregator'
                    }
                });
            } else {
                 return new Response(JSON.stringify({ 
                    status: 'error', 
                    message: 'Article not found',
                    articles: []
                }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
                });
            }
        }

        const page = parseInt(url.searchParams.get('page') || '1');
        const pageSize = parseInt(url.searchParams.get('pageSize') || '50'); // Increased from 20 to 50
        const categoryFilter = url.searchParams.get('category'); // New: category filter

        // Filter by category if specified (and not "All")
        if (categoryFilter && categoryFilter !== 'All') {
          articles = articles.filter(article => article.category === categoryFilter);
        }

        const start = (page - 1) * pageSize;
        const end = start + pageSize;

        const paginatedArticles = articles.slice(start, end);
        const hasMore = end < articles.length;

        // Return in NewsAPI-compatible format for frontend
        return new Response(JSON.stringify({
          status: 'ok',
          totalResults: articles.length,
          articles: paginatedArticles,
          hasMore: hasMore,
          currentPage: page,
          category: categoryFilter || 'All'
        }), {
          headers: { 
            'Content-Type': 'application/json', 
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=600', // Cache in CDN for 10 minutes
            'X-Source': 'self-hosted-aggregator'
          }
        });
      } catch (error) {
        console.error('News cache read error:', error);
        return new Response(JSON.stringify({ 
          status: 'error', 
          message: 'Unable to load articles at this time.',
          articles: []
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // Newsletter subscription endpoint
    if (path === '/api/newsletter/subscribe' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { email } = body;

        // Validate email
        if (!email || !email.includes('@')) {
          return new Response(JSON.stringify({ error: 'Invalid email address' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        // Store subscription in KV (optional - for tracking)
        const timestamp = new Date().toISOString();
        const subscriptionKey = `NEWSLETTER:${email}`;
        await env.AFFILIATE_KV?.put(subscriptionKey, JSON.stringify({
          email,
          subscribedAt: timestamp
        }));

        // Send email notification using Resend
        const notificationEmail = 'sparshrajput088@gmail.com';
        const resendApiKey = env.RESEND_API_KEY;

        if (resendApiKey && resendApiKey !== 'PLACEHOLDER') {
          try {
            const emailResponse = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${resendApiKey}`
              },
              body: JSON.stringify({
                from: 'HealthBeauty Hub <onboarding@resend.dev>',
                to: [notificationEmail],
                subject: 'New Newsletter Subscription',
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2563eb;">New Newsletter Subscription</h2>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Subscribed at:</strong> ${new Date(timestamp).toLocaleString()}</p>
                    <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 14px;">This notification was sent from your HealthBeauty Hub website.</p>
                  </div>
                `
              })
            });

            if (!emailResponse.ok) {
              const errorText = await emailResponse.text();
              console.error('Resend API error:', errorText);
            } else {
              console.log('Newsletter email sent successfully');
            }
          } catch (emailError) {
            console.error('Email sending error:', emailError);
          }
        } else {
          console.warn('RESEND_API_KEY not configured - email not sent');
        }

        return new Response(JSON.stringify({
          success: true,
          message: 'Successfully subscribed to newsletter'
        }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });

      } catch (error) {
        console.error('Newsletter subscription error:', error);
        return new Response(JSON.stringify({ error: 'Failed to subscribe' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // Contact form submission endpoint
    if (path === '/api/contact/submit' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { name, email, subject, message } = body;

        // Validate inputs
        if (!name || !email || !subject || !message) {
          return new Response(JSON.stringify({ error: 'All fields are required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        if (!email.includes('@')) {
          return new Response(JSON.stringify({ error: 'Invalid email address' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        // Store contact submission in KV (optional - for tracking)
        const timestamp = new Date().toISOString();
        const contactKey = `CONTACT:${timestamp}:${email}`;
        await env.AFFILIATE_KV?.put(contactKey, JSON.stringify({
          name,
          email,
          subject,
          message,
          submittedAt: timestamp
        }));

        // Send email notification using Resend
        const notificationEmail = 'sparshrajput088@gmail.com';
        const resendApiKey = env.RESEND_API_KEY;

        if (resendApiKey && resendApiKey !== 'PLACEHOLDER') {
          try {
            const emailResponse = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${resendApiKey}`
              },
              body: JSON.stringify({
                from: 'HealthBeauty Hub <onboarding@resend.dev>',
                to: [notificationEmail],
                reply_to: email,
                subject: `New Contact Form: ${subject}`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2563eb;">New Contact Form Submission</h2>
                    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                      <p><strong>From:</strong> ${name}</p>
                      <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                      <p><strong>Subject:</strong> ${subject}</p>
                      <p><strong>Submitted at:</strong> ${new Date(timestamp).toLocaleString()}</p>
                    </div>
                    <div style="margin: 20px 0;">
                      <strong>Message:</strong>
                      <p style="white-space: pre-wrap; background: #f9fafb; padding: 15px; border-radius: 8px; margin-top: 10px;">${message}</p>
                    </div>
                    <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 14px;">This message was sent from your HealthBeauty Hub contact form.</p>
                    <p style="color: #6b7280; font-size: 14px;">Reply to: <a href="mailto:${email}">${email}</a></p>
                  </div>
                `
              })
            });

            if (!emailResponse.ok) {
              const errorText = await emailResponse.text();
              console.error('Resend API error:', errorText);
            } else {
              console.log('Contact form email sent successfully');
            }
          } catch (emailError) {
            console.error('Email sending error:', emailError);
          }
        } else {
          console.warn('RESEND_API_KEY not configured - email not sent');
        }

        return new Response(JSON.stringify({
          success: true,
          message: 'Message sent successfully'
        }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });

      } catch (error) {
        console.error('Contact form error:', error);
        return new Response(JSON.stringify({ error: 'Failed to send message' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // Nutrient education endpoint - provides educational content about vitamins/nutrients
    if (path === '/api/nutrition/nutrient-info' && request.method === 'GET') {
      const url = new URL(request.url);
      const nutrient = url.searchParams.get('nutrient') || '';

      if (!nutrient.trim()) {
        return new Response(JSON.stringify({ error: 'Nutrient parameter is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      const nutrientDatabase = {
        'vitamin c': {
          title: 'Vitamin C (Ascorbic Acid)',
          description: 'Essential vitamin that acts as a powerful antioxidant, supporting immune function and skin health.',
          benefits: [
            'Boosts immune system and helps fight infections',
            'Promotes collagen production for healthy skin and wound healing',
            'Powerful antioxidant that protects cells from damage',
            'Helps absorb iron from plant-based foods',
            'Supports brain health and neurotransmitter production'
          ],
          dailyValue: '90mg',
          deficiencySymptoms: ['Fatigue and weakness', 'Poor wound healing', 'Dry and splitting hair', 'Bleeding gums', 'Dry skin'],
          richFoodSources: ['Citrus fruits (oranges, lemons)', 'Bell peppers', 'Strawberries', 'Broccoli', 'Kiwi', 'Tomatoes'],
          searchQuery: 'vitamin c rich foods'
        },
        'vitamin d': {
          title: 'Vitamin D',
          description: 'Fat-soluble vitamin crucial for calcium absorption, bone health, and immune function.',
          benefits: [
            'Promotes calcium absorption for strong bones and teeth',
            'Supports immune system function',
            'Helps regulate mood and may help with depression',
            'Supports muscle function and strength',
            'May help reduce inflammation'
          ],
          dailyValue: '20mcg (800 IU)',
          deficiencySymptoms: ['Fatigue and tiredness', 'Bone pain', 'Muscle weakness', 'Depression', 'Hair loss'],
          richFoodSources: ['Fatty fish (salmon, mackerel)', 'Egg yolks', 'Fortified milk', 'Fortified cereals', 'Sunlight exposure'],
          searchQuery: 'vitamin d rich foods'
        },
        'protein': {
          title: 'Protein',
          description: 'Macronutrient essential for building and repairing tissues, making enzymes and hormones, and supporting overall body function.',
          benefits: [
            'Builds and repairs muscle tissue after exercise',
            'Supports immune function and antibody production',
            'Helps maintain healthy bones, skin, and hair',
            'Provides sustained energy and satiety',
            'Essential for hormone and enzyme production'
          ],
          dailyValue: '50g',
          deficiencySymptoms: ['Muscle loss and weakness', 'Edema (swelling)', 'Fatigue and low energy', 'Slow wound healing', 'Weakened immune system'],
          richFoodSources: ['Lean meats (chicken, turkey)', 'Fish and seafood', 'Eggs', 'Dairy products', 'Legumes and beans', 'Tofu and tempeh'],
          searchQuery: 'high protein foods'
        },
        'iron': {
          title: 'Iron',
          description: 'Essential mineral that plays a vital role in producing hemoglobin, which carries oxygen throughout your body.',
          benefits: [
            'Prevents anemia and fatigue',
            'Supports energy production and metabolism',
            'Essential for cognitive function and brain development',
            'Supports immune system function',
            'Helps maintain healthy pregnancy'
          ],
          dailyValue: '18mg',
          deficiencySymptoms: ['Fatigue and weakness', 'Pale skin', 'Shortness of breath', 'Headaches and dizziness', 'Cold hands and feet'],
          richFoodSources: ['Red meat', 'Spinach and leafy greens', 'Lentils and beans', 'Fortified cereals', 'Dark chocolate', 'Tofu'],
          searchQuery: 'iron rich foods'
        },
        'calcium': {
          title: 'Calcium',
          description: 'Essential mineral for building and maintaining strong bones and teeth, muscle function, and nerve signaling.',
          benefits: [
            'Builds and maintains strong bones and teeth',
            'Supports muscle contraction and function',
            'Essential for nerve transmission and signaling',
            'Helps with blood clotting',
            'May help regulate blood pressure'
          ],
          dailyValue: '1300mg',
          deficiencySymptoms: ['Weak and brittle bones', 'Muscle cramps and spasms', 'Numbness or tingling', 'Fatigue', 'Irregular heartbeat'],
          richFoodSources: ['Dairy products (milk, cheese, yogurt)', 'Leafy greens (kale, spinach)', 'Fortified plant milks', 'Tofu', 'Almonds', 'Sardines'],
          searchQuery: 'calcium rich foods'
        },
        'omega 3': {
          title: 'Omega-3 Fatty Acids',
          description: 'Essential fats that play crucial roles in brain health, reducing inflammation, and heart health.',
          benefits: [
            'Reduces inflammation throughout the body',
            'Supports brain health and cognitive function',
            'Promotes heart health and may lower heart disease risk',
            'Supports mental health and may reduce depression',
            'Essential for eye health and vision'
          ],
          dailyValue: '1.1g (EPA+DHA)',
          deficiencySymptoms: ['Dry skin and hair', 'Fatigue', 'Poor concentration', 'Joint pain', 'Mood swings'],
          richFoodSources: ['Fatty fish (salmon, mackerel, sardines)', 'Walnuts', 'Flaxseeds and chia seeds', 'Fish oil supplements', 'Algal oil'],
          searchQuery: 'omega 3 rich foods'
        },
        'fiber': {
          title: 'Dietary Fiber',
          description: 'Essential carbohydrate that aids digestion, helps maintain bowel health, and supports overall health.',
          benefits: [
            'Promotes regular bowel movements and prevents constipation',
            'Helps maintain healthy gut microbiome',
            'Lowers cholesterol levels',
            'Helps control blood sugar levels',
            'Promotes feeling of fullness and weight management'
          ],
          dailyValue: '25g',
          deficiencySymptoms: ['Constipation', 'High cholesterol', 'Blood sugar spikes', 'Weight gain', 'Poor gut health'],
          richFoodSources: ['Whole grains (oats, quinoa, brown rice)', 'Beans and legumes', 'Fruits and vegetables', 'Nuts and seeds', 'Popcorn'],
          searchQuery: 'high fiber foods'
        }
      };

      const lowerNutrient = nutrient.toLowerCase();
      const nutrientInfo = nutrientDatabase[lowerNutrient];

      if (!nutrientInfo) {
        return new Response(JSON.stringify({ error: 'Nutrient information not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      return new Response(JSON.stringify(nutrientInfo), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // USDA Food Search API endpoint - for real-time food search
    if (path === '/api/nutrition/search' && request.method === 'GET') {
      const url = new URL(request.url);
      const query = url.searchParams.get('query') || '';
      const page = parseInt(url.searchParams.get('page') || '1');
      const pageSize = Math.min(parseInt(url.searchParams.get('pageSize') || '20'), 50); // Cap at 50

      if (!query.trim()) {
        return new Response(JSON.stringify({ error: 'Query parameter is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      try {
        // Check rate limiting (USDA allows 1000 requests/hour per IP)
        const clientIP = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown';
        const rateLimitKey = `rate_limit:usda_search:${clientIP}`;
        const now = Date.now();
        const hourAgo = now - (60 * 60 * 1000);

        // Get current rate limit data
        let rateData = await env.NUTRITION_CACHE?.get(rateLimitKey);
        if (rateData) {
          rateData = JSON.parse(rateData);
          // Clean old entries
          rateData.requests = rateData.requests.filter(timestamp => timestamp > hourAgo);

          if (rateData.requests.length >= 900) { // Leave some buffer
            return new Response(JSON.stringify({
              error: 'Rate limit exceeded',
              message: 'Too many requests. Please try again later.',
              retryAfter: Math.ceil((rateData.requests[0] + (60 * 60 * 1000) - now) / 1000)
            }), {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Retry-After': Math.ceil((rateData.requests[0] + (60 * 60 * 1000) - now) / 1000).toString()
              }
            });
          }
        } else {
          rateData = { requests: [] };
        }

        // Check cache first
        const cacheKey = `v3_usda_search:${encodeURIComponent(query)}:page_${page}:size_${pageSize}`;
        const cachedResult = await env.NUTRITION_CACHE?.get(cacheKey);
        if (cachedResult) {
          const parsed = JSON.parse(cachedResult);
          if (parsed.timestamp > (now - (60 * 60 * 1000))) { // 1 hour TTL for search results
            return new Response(JSON.stringify(parsed.data), {
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
          }
        }

        // Fetch from USDA API
        const apiKey = env.USDA_API_KEY;
        if (!apiKey) {
          return new Response(JSON.stringify({ error: 'USDA API key not configured' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        // Call USDA FoodData Central search API
        const searchUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=${pageSize}&pageNumber=${page}&api_key=${apiKey}`;

        const searchResponse = await fetch(searchUrl, {
          headers: {
            'User-Agent': 'BlushAndBreathe/1.0 (+https://jyotilalchandani.pages.dev)'
          }
        });

        if (!searchResponse.ok) {
          if (searchResponse.status === 429) {
            return new Response(JSON.stringify({
              error: 'USDA API rate limit exceeded',
              message: 'Please try again in a few minutes'
            }), {
              status: 429,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
          }
          throw new Error(`USDA API error: ${searchResponse.status}`);
        }

        const searchData = await searchResponse.json();

        // Transform USDA data to our format
        const transformPromises = searchData.foods?.map((food, index) => transformUSDAData(food, index + (page - 1) * pageSize, page, env)) || [];
        const transformedFoodsRaw = await Promise.all(transformPromises);
        const transformedFoods = transformedFoodsRaw.filter(Boolean);

        const result = {
          data: transformedFoods,
          totalHits: searchData.totalHits || 0,
          currentPage: page,
          pageSize: pageSize,
          hasMore: (searchData.totalHits || 0) > page * pageSize
        };

        // Update rate limiting
        rateData.requests.push(now);
        await env.NUTRITION_CACHE?.put(rateLimitKey, JSON.stringify(rateData), {
          expirationTtl: 60 * 60 * 2 // 2 hours
        });

        // Cache the result
        const cacheData = {
          data: result,
          timestamp: now
        };
        await env.NUTRITION_CACHE?.put(cacheKey, JSON.stringify(cacheData), {
          expirationTtl: 60 * 60 * 1 // 1 hour for search cache
        });

        return new Response(JSON.stringify(result), {
          headers: { 
            'Content-Type': 'application/json', 
            'Access-Control-Allow-Origin': '*',
            'X-Worker-Version': 'v2-unsplash-fix'
          }
        });

      } catch (error) {
        console.error('USDA Search API error:', error);
        return new Response(JSON.stringify({
          error: 'Failed to search USDA database',
          message: 'Please try again later'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // USDA Nutrition API endpoint (for default nutrition data)
    if (path === '/api/nutrition' && request.method === 'GET') {
      const url = new URL(request.url);
      const page = parseInt(url.searchParams.get('page') || '1');
      const pageSize = parseInt(url.searchParams.get('pageSize') || '6');

      try {
        // Check rate limiting (USDA allows 1000 requests/hour per IP)
        const clientIP = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown';
        const rateLimitKey = `rate_limit:usda:${clientIP}`;
        const now = Date.now();
        const hourAgo = now - (60 * 60 * 1000);

        // Get current rate limit data
        let rateData = await env.NUTRITION_CACHE?.get(rateLimitKey);
        if (rateData) {
          rateData = JSON.parse(rateData);
          // Clean old entries
          rateData.requests = rateData.requests.filter(timestamp => timestamp > hourAgo);

          if (rateData.requests.length >= 1000) {
            return new Response(JSON.stringify({
              error: 'Rate limit exceeded',
              message: 'Too many requests. Please try again later.',
              retryAfter: Math.ceil((rateData.requests[0] + (60 * 60 * 1000) - now) / 1000)
            }), {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Retry-After': Math.ceil((rateData.requests[0] + (60 * 60 * 1000) - now) / 1000).toString()
              }
            });
          }
        } else {
          rateData = { requests: [] };
        }

        // Check cache first
        const cacheKey = `v3_nutrition:page_${page}:size_${pageSize}`;
        const cachedResult = await env.NUTRITION_CACHE?.get(cacheKey);
        if (cachedResult) {
          const parsed = JSON.parse(cachedResult);
          if (parsed.timestamp > (now - (7 * 24 * 60 * 60 * 1000))) { // 7 days TTL
            return new Response(JSON.stringify(parsed.data), {
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
          }
        }

        // Fetch from USDA API
        const apiKey = env.USDA_API_KEY;
        if (!apiKey) {
          return new Response(JSON.stringify({ error: 'USDA API key not configured' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        // Define food queries for variety (expandable list)
        const foodQueries = [
          'apple', 'banana', 'orange', 'strawberry', 'blueberry',
          'broccoli', 'spinach', 'kale', 'carrot', 'sweet potato',
          'chicken breast', 'salmon', 'eggs', 'greek yogurt', 'almonds',
          'brown rice', 'quinoa', 'oats', 'whole wheat bread', 'avocado',
          'beef steak', 'tofu', 'lentils', 'black beans', 'chickpeas'
        ];

        const nutritionTips = [
          { id: 'tip-1', type: 'tip', title: 'Stay Hydrated', description: 'Drink at least 8 glasses of water daily. Hydration is key to maintaining skin elasticity and flushing out toxins.', icon: 'water_drop' },
          { id: 'tip-2', type: 'tip', title: 'Eat the Rainbow', description: 'Include foods of different colors. Each color provides different antioxidants and nutrients for optimal skin health.', icon: 'palette' },
          { id: 'tip-3', type: 'tip', title: 'Timing Matters', description: 'Eat nutrient-rich foods for breakfast to kickstart your metabolism and provide sustained energy throughout the day.', icon: 'schedule' },
          { id: 'tip-4', type: 'tip', title: 'Limit Sugar & Processed Foods', description: 'Excess sugar can trigger inflammation and breakouts. Choose whole foods for clearer, healthier skin.', icon: 'do_not_disturb_on' },
          { id: 'tip-5', type: 'tip', title: 'Pair Proteins with Veggies', description: 'Combine lean proteins with colorful vegetables for complete nutrients that support skin regeneration and health.', icon: 'restaurant' },
          { id: 'tip-6', type: 'tip', title: 'Include Healthy Fats', description: 'Omega-3 and monounsaturated fats reduce inflammation and support your skin\'s natural oil balance.', icon: 'favorite' }
        ];

        const result = [];
        let currentIndex = 0;
        const start = (page - 1) * pageSize;
        const end = start + pageSize;

        // Interleave foods with tips like the original implementation
        for (let i = 0; i < foodQueries.length && result.length < pageSize; i++) {
          // Add tip every 2 foods
          if (i > 0 && i % 2 === 0 && nutritionTips.length > 0) {
            const tipIndex = Math.floor(i / 2) % nutritionTips.length;
            if (currentIndex >= start && currentIndex < end) {
              result.push(nutritionTips[tipIndex]);
            }
            currentIndex++;
            if (result.length >= pageSize) break;
          }

          if (currentIndex >= start && currentIndex < end) {
            try {
              // Call USDA API with retry logic
              const searchResponse = await fetchUSDAFood(apiKey, foodQueries[i], 3);

              if (searchResponse && searchResponse.foods && searchResponse.foods.length > 0) {
                const food = searchResponse.foods[0];
                const nutritionInfo = await transformUSDAData(food, i, page, env);

                if (nutritionInfo) {
                  result.push(nutritionInfo);
                }
              }
            } catch (error) {
              console.error(`Failed to fetch nutrition for ${foodQueries[i]}:`, error);
              // Continue with next food instead of failing completely
            }
          }
          currentIndex++;
        }

        // Update rate limiting
        rateData.requests.push(now);
        await env.NUTRITION_CACHE?.put(rateLimitKey, JSON.stringify(rateData), {
          expirationTtl: 60 * 60 * 2 // 2 hours to be safe
        });

        // Cache the result
        const cacheData = {
          data: { data: result, hasMore: result.length >= pageSize },
          timestamp: now
        };
        await env.NUTRITION_CACHE?.put(cacheKey, JSON.stringify(cacheData), {
          expirationTtl: 60 * 60 * 24 * 7 // 7 days
        });

        return new Response(JSON.stringify({ data: result, hasMore: result.length >= pageSize }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });

      } catch (error) {
        console.error('Nutrition API error:', error);
        return new Response(JSON.stringify({
          error: 'Failed to fetch nutrition data',
          message: 'Please try again later'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // EBAY BEAUTY STOREFRONT INTEGRATION
    // ═══════════════════════════════════════════════════════════════════
    // Implemented: November 22, 2025
    // App ID: Abhishek-Blushand-PRD-e6e427756-f9d13125
    // Environment: PROD (Production)
    // OAuth Endpoint: https://api.ebay.com/identity/v1/oauth2/token
    // Browse API: https://api.ebay.com/buy/browse/v1/
    // Documentation: See EBAY_INTEGRATION_README.md and DEPLOYMENT_SUMMARY.md
    // ═══════════════════════════════════════════════════════════════════

    // eBay Beauty Search API
    if (path === '/api/beauty/search' && request.method === 'GET') {
      try {
        const searchParams = new URL(request.url).searchParams;
        const q = searchParams.get('q') || '';
        const category = searchParams.get('category') || 'all';
        const sort = searchParams.get('sort') || 'best';
        const minPrice = searchParams.get('minPrice');
        const maxPrice = searchParams.get('maxPrice');
        const condition = searchParams.get('condition');
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '24'), 50);

        // Create cache key with version to bust old cache after filter logic changes
        const cacheKey = `ebay_search:v3_beauty:${q}:${category}:${sort}:${minPrice || ''}:${maxPrice || ''}:${condition || ''}:${page}:${pageSize}`;
        
        // Check cache first (5 minute TTL)
        const cachedResult = await env.MERGED_CACHE?.get(cacheKey);
        if (cachedResult) {
          const parsed = JSON.parse(cachedResult);
          if (parsed.timestamp > Date.now() - (5 * 60 * 1000)) {
            return new Response(JSON.stringify(parsed.data), {
              headers: { 
                'Content-Type': 'application/json', 
                'Access-Control-Allow-Origin': '*',
                'X-Cache': 'HIT'
              }
            });
          }
        }

        // Get eBay access token
        const token = await getEbayAccessToken(env);
        if (!token) {
          throw new Error('Failed to obtain eBay access token');
        }

        // Map category to eBay category ID
        const categoryMap = {
          'all': '26395',           // Health & Beauty root with keyword filtering
          'makeup': '31786',        // Makeup
          'skincare': '31763',      // Skin Care
          'hair': '11854',          // Hair Care & Styling
          'fragrance': '180345',    // Fragrances
          'nails': '47945'          // Nail Care, Manicure & Pedicure
        };
        const categoryId = categoryMap[category] || '26395';

        // Build eBay API params
        const offset = (page - 1) * pageSize;
        const ebayParams = new URLSearchParams({
          limit: pageSize.toString(),
          offset: offset.toString()
        });

        // For 'all' category, exclude health/supplement keywords to get beauty products
        if (category === 'all') {
          const beautyQuery = q && q.trim() 
            ? `${q.trim()} -(vitamin supplement protein medicine health fitness workout)` 
            : 'beauty -(vitamin supplement protein medicine health fitness workout)';
          ebayParams.append('q', beautyQuery);
          ebayParams.append('category_ids', categoryId);
        } else {
          // Specific category selected
          if (q && q.trim()) {
            ebayParams.append('q', q.trim());
          }
          ebayParams.append('category_ids', categoryId);
        }

        // Map sort parameter
        if (sort === 'priceAsc') {
          ebayParams.append('sort', 'price');
        } else if (sort === 'priceDesc') {
          ebayParams.append('sort', '-price');
        } else if (sort === 'newest') {
          ebayParams.append('sort', 'newlyListed');
        }
        // 'best' uses eBay's default Best Match

        // Build filters array (eBay requires proper filter syntax)
        const filters = [];
        
        // Price filter - eBay doesn't accept '*' wildcards
        if (minPrice || maxPrice) {
          const min = minPrice ? parseFloat(minPrice) : 0;
          const max = maxPrice ? parseFloat(maxPrice) : 999999;
          filters.push(`price:[${min}..${max}]`);
          filters.push('priceCurrency:USD');
        }

        // Condition filter
        if (condition) {
          const conditionMap = {
            'new': 'NEW',
            'used': 'USED',
            'refurbished': 'REFURBISHED'
          };
          const ebayCondition = conditionMap[condition];
          if (ebayCondition) {
            filters.push(`conditions:{${ebayCondition}}`);
          }
        }
        
        // Add all filters as a single parameter
        if (filters.length > 0) {
          ebayParams.append('filter', filters.join(','));
        }

        // Call eBay Browse API
        const ebayUrl = `https://api.ebay.com/buy/browse/v1/item_summary/search?${ebayParams.toString()}`;
        const headers = {
          'Authorization': `Bearer ${token}`,
          'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
        };
        
        // Add affiliate context if campaign ID is configured (for itemAffiliateWebUrl)
        const campaignId = env.EBAY_CAMPAIGN_ID;
        if (campaignId && campaignId !== 'PLACEHOLDER') {
          headers['X-EBAY-C-ENDUSERCTX'] = `affiliateCampaignId=${campaignId}`;
        }
        
        const ebayResponse = await fetch(ebayUrl, { headers });

        if (!ebayResponse.ok) {
          const errorText = await ebayResponse.text();
          console.error('eBay API error:', ebayResponse.status, errorText);
          
          // Try to serve cached data on error
          if (cachedResult) {
            return new Response(cachedResult, {
              headers: { 
                'Content-Type': 'application/json', 
                'Access-Control-Allow-Origin': '*',
                'X-Cache': 'STALE'
              }
            });
          }
          
          throw new Error(`eBay API returned ${ebayResponse.status}`);
        }

        const ebayData = await ebayResponse.json();

        // Normalize response
        const items = (ebayData.itemSummaries || []).map(item => ({
          id: item.itemId,
          title: item.title,
          price: {
            value: parseFloat(item.price?.value || 0),
            currency: item.price?.currency || 'USD'
          },
          imageUrl: item.image?.imageUrl || item.thumbnailImages?.[0]?.imageUrl || '',
          condition: item.condition || 'Not Specified',
          webUrl: item.itemWebUrl
        }));

        const total = ebayData.total || 0;
        const hasNextPage = (offset + pageSize) < total;

        // Extract refinements
        const refinements = {
          conditions: (ebayData.refinement?.conditionDistributions || []).map(c => ({
            value: c.condition,
            count: c.matchCount
          })),
          aspects: (ebayData.refinement?.aspectDistributions || []).slice(0, 5).map(a => ({
            name: a.localizedAspectName,
            values: (a.aspectValueDistributions || []).slice(0, 10).map(v => ({
              value: v.localizedAspectValue,
              count: v.matchCount
            }))
          }))
        };

        const result = {
          items,
          pagination: {
            page,
            pageSize,
            total,
            hasNextPage
          },
          refinements
        };

        // Cache the result
        const cacheData = {
          data: result,
          timestamp: Date.now()
        };
        await env.MERGED_CACHE?.put(cacheKey, JSON.stringify(cacheData), {
          expirationTtl: 300 // 5 minutes
        });

        return new Response(JSON.stringify(result), {
          headers: { 
            'Content-Type': 'application/json', 
            'Access-Control-Allow-Origin': '*',
            'X-Cache': 'MISS'
          }
        });

      } catch (error) {
        console.error('Beauty search error:', error);
        return new Response(JSON.stringify({
          error: 'search_failed',
          message: 'Unable to search products at this time. Please try again later.'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // eBay Beauty Item Detail API
    if (path.startsWith('/api/beauty/item/') && request.method === 'GET') {
      try {
        // Extract and decode the item ID (it comes URL-encoded from the frontend)
        const encodedItemId = path.replace('/api/beauty/item/', '');
        const itemId = decodeURIComponent(encodedItemId);
        
        console.log('Item detail request for:', itemId);
        
        if (!itemId) {
          return new Response(JSON.stringify({ error: 'Item ID required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        // Check cache first (2 hour TTL)
        const cacheKey = `ebay_item:${itemId}`;
        const cachedResult = await env.MERGED_CACHE?.get(cacheKey);
        if (cachedResult) {
          const parsed = JSON.parse(cachedResult);
          if (parsed.timestamp > Date.now() - (2 * 60 * 60 * 1000)) {
            return new Response(JSON.stringify(parsed.data), {
              headers: { 
                'Content-Type': 'application/json', 
                'Access-Control-Allow-Origin': '*',
                'X-Cache': 'HIT'
              }
            });
          }
        }

        // Get eBay access token
        const token = await getEbayAccessToken(env);
        if (!token) {
          throw new Error('Failed to obtain eBay access token');
        }

        // Call eBay Browse API for item details
        // The itemId is already in the correct format (e.g., v1|123456789|0)
        // Valid fieldgroups for getItem: COMPACT, PRODUCT, ADDITIONAL_SELLER_DETAILS, CHARITY_DETAILS
        const ebayUrl = `https://api.ebay.com/buy/browse/v1/item/${itemId}?fieldgroups=PRODUCT`;
        console.log('Fetching from eBay:', ebayUrl);
        
        const ebayResponse = await fetch(ebayUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
          }
        });

        if (!ebayResponse.ok) {
          const errorText = await ebayResponse.text();
          console.error('eBay item API error:', ebayResponse.status);
          console.error('Error details:', errorText);
          console.error('Item ID:', itemId);
          
          // Try to serve cached data on error
          if (cachedResult) {
            const parsed = JSON.parse(cachedResult);
            return new Response(JSON.stringify(parsed.data), {
              headers: { 
                'Content-Type': 'application/json', 
                'Access-Control-Allow-Origin': '*',
                'X-Cache': 'STALE'
              }
            });
          }
          
          if (ebayResponse.status === 404) {
            return new Response(JSON.stringify({ error: 'Item not found' }), {
              status: 404,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
          }
          
          throw new Error(`eBay API returned ${ebayResponse.status}: ${errorText}`);
        }

        const item = await ebayResponse.json();

        // Extract images
        const images = [];
        if (item.image?.imageUrl) {
          images.push(item.image.imageUrl);
        }
        if (item.additionalImages) {
          images.push(...item.additionalImages.map(img => img.imageUrl));
        }

        // Extract description (first 500 chars)
        let shortDescription = '';
        if (item.shortDescription) {
          shortDescription = item.shortDescription.substring(0, 500);
        } else if (item.description) {
          shortDescription = item.description.substring(0, 500);
        }

        // Extract item specifics
        const itemSpecifics = {};
        if (item.localizedAspects) {
          item.localizedAspects.forEach(aspect => {
            itemSpecifics[aspect.name] = aspect.value;
          });
        }

        // Normalize response
        const result = {
          id: item.itemId,
          title: item.title,
          price: {
            value: parseFloat(item.price?.value || 0),
            currency: item.price?.currency || 'USD'
          },
          condition: item.condition || 'Not Specified',
          images,
          shortDescription,
          itemSpecifics,
          webUrl: item.itemWebUrl,
          seller: {
            username: item.seller?.username || 'Unknown',
            feedbackPercentage: item.seller?.feedbackPercentage || 0,
            feedbackScore: item.seller?.feedbackScore || 0
          }
        };

        // Cache the result
        const cacheData = {
          data: result,
          timestamp: Date.now()
        };
        await env.MERGED_CACHE?.put(cacheKey, JSON.stringify(cacheData), {
          expirationTtl: 7200 // 2 hours
        });

        return new Response(JSON.stringify(result), {
          headers: { 
            'Content-Type': 'application/json', 
            'Access-Control-Allow-Origin': '*',
            'X-Cache': 'MISS'
          }
        });

      } catch (error) {
        console.error('Beauty item detail error:', error);
        return new Response(JSON.stringify({
          error: 'item_fetch_failed',
          message: 'Unable to fetch product details at this time. Please try again later.'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // EBAY HEALTH & WELLNESS STOREFRONT INTEGRATION
    // ═══════════════════════════════════════════════════════════════════
    // Implemented: January 2025
    // Health Category IDs (verified from eBay marketplace):
    //   - 67588: Health Care (root - 2M+ items)
    //   - 11776: Vitamins & Minerals (649K+ items)
    //   - 15273: Fitness Equipment (high-ticket items $100-$2000)
    //   - 180959: Dietary Supplements (protein powders, sports nutrition)
    //   - 79631: Medical Supplies & Equipment (glucose monitors, BP devices)
    //   - 15258: Natural & Alternative Remedies (essential oils, aromatherapy)
    // Test Queries (guaranteed results):
    //   - { q: 'vitamin c 1000mg', category: '11776' }  // 50K+ items
    //   - { q: 'protein powder', category: '15273' }    // 80K+ items
    //   - { q: 'essential oils', category: '15258' }    // 200K+ items
    //   - { q: 'blood pressure monitor', category: '79631' } // 20K+ items
    // ═══════════════════════════════════════════════════════════════════

    // eBay Health Search API
    if (path === '/api/health/search' && request.method === 'GET') {
      try {
        const searchParams = new URL(request.url).searchParams;
        const q = searchParams.get('q') || '';
        const category = searchParams.get('category') || 'all';
        const sort = searchParams.get('sort') || 'best';
        const minPrice = searchParams.get('minPrice');
        const maxPrice = searchParams.get('maxPrice');
        const condition = searchParams.get('condition');
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '24'), 50);

        // Create cache key with version to bust cache after filter logic changes
        const cacheKey = `ebay_health_search:v2:${q}:${category}:${sort}:${minPrice || ''}:${maxPrice || ''}:${condition || ''}:${page}:${pageSize}`;

        // Check cache first (5 minute TTL)
        const cachedResult = await env.MERGED_CACHE?.get(cacheKey);
        if (cachedResult) {
          const parsed = JSON.parse(cachedResult);
          if (parsed.timestamp > Date.now() - (5 * 60 * 1000)) {
            return new Response(JSON.stringify(parsed.data), {
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'X-Cache': 'HIT'
              }
            });
          }
        }

        // Get eBay access token
        const token = await getEbayAccessToken(env);
        if (!token) {
          throw new Error('Failed to obtain eBay access token');
        }

        // Map category to eBay category ID (Health & Wellness categories)
        const categoryMap = {
          'all': '67588',           // Health Care root
          'vitamins': '11776',      // Vitamins & Minerals
          'fitness': '15273',       // Fitness Equipment
          'supplements': '180959',  // Dietary Supplements
          'medical': '79631',       // Medical Supplies & Equipment
          'wellness': '15258'       // Natural & Alternative Remedies
        };
        const categoryId = categoryMap[category] || '67588';

        // Build eBay API params
        const offset = (page - 1) * pageSize;
        const ebayParams = new URLSearchParams({
          limit: pageSize.toString(),
          offset: offset.toString()
        });

        // Always filter by category
        ebayParams.append('category_ids', categoryId);

        // Handle search query
        if (q && q.trim()) {
          ebayParams.append('q', q.trim());
        } else {
          // If no query, provide a default based on category to ensure results
          // eBay Browse API sometimes fails with just category_ids for broad categories
          const defaultQueries = {
            'all': 'health',
            'vitamins': 'vitamins',
            'fitness': 'fitness equipment',
            'supplements': 'supplements',
            'medical': 'medical supplies',
            'wellness': 'natural remedies'
          };
          ebayParams.append('q', defaultQueries[category] || 'health');
        }

        // Map sort parameter
        if (sort === 'priceAsc') {
          ebayParams.append('sort', 'price');
        } else if (sort === 'priceDesc') {
          ebayParams.append('sort', '-price');
        } else if (sort === 'newest') {
          ebayParams.append('sort', 'newlyListed');
        }
        // 'best' uses eBay's default Best Match

        // Build filters array (eBay requires proper filter syntax)
        const filters = [];
        
        // Price filter - eBay doesn't accept '*' wildcards
        if (minPrice || maxPrice) {
          const min = minPrice ? parseFloat(minPrice) : 0;
          const max = maxPrice ? parseFloat(maxPrice) : 999999;
          filters.push(`price:[${min}..${max}]`);
          filters.push('priceCurrency:USD');
        }

        // Condition filter
        if (condition) {
          const conditionMap = {
            'new': 'NEW',
            'used': 'USED',
            'refurbished': 'REFURBISHED'
          };
          const ebayCondition = conditionMap[condition];
          if (ebayCondition) {
            filters.push(`conditions:{${ebayCondition}}`);
          }
        }
        
        // Add all filters as a single parameter
        if (filters.length > 0) {
          ebayParams.append('filter', filters.join(','));
        }

        // Call eBay Browse API
        const ebayUrl = `https://api.ebay.com/buy/browse/v1/item_summary/search?${ebayParams.toString()}`;
        const headers = {
          'Authorization': `Bearer ${token}`,
          'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
        };

        // Add affiliate context if campaign ID is configured
        const campaignId = env.EBAY_CAMPAIGN_ID;
        if (campaignId && campaignId !== 'PLACEHOLDER') {
          headers['X-EBAY-C-ENDUSERCTX'] = `affiliateCampaignId=${campaignId}`;
        }

        const ebayResponse = await fetch(ebayUrl, { headers });

        if (!ebayResponse.ok) {
          const errorText = await ebayResponse.text();
          console.error('eBay Health API error:', ebayResponse.status, errorText);

          // Try to serve cached data on error (stale-on-error)
          if (cachedResult) {
            return new Response(cachedResult, {
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'X-Cache': 'STALE'
              }
            });
          }

          throw new Error(`eBay API returned ${ebayResponse.status}`);
        }

        const ebayData = await ebayResponse.json();

        // Normalize response
        const items = (ebayData.itemSummaries || []).map(item => ({
          id: item.itemId,
          title: item.title,
          price: {
            value: parseFloat(item.price?.value || 0),
            currency: item.price?.currency || 'USD'
          },
          imageUrl: item.image?.imageUrl || item.thumbnailImages?.[0]?.imageUrl || '',
          condition: item.condition || 'Not Specified',
          webUrl: item.itemWebUrl
        }));

        const total = ebayData.total || 0;
        const hasNextPage = (offset + pageSize) < total;

        // Extract refinements
        const refinements = {
          conditions: (ebayData.refinement?.conditionDistributions || []).map(c => ({
            value: c.condition,
            count: c.matchCount
          })),
          aspects: (ebayData.refinement?.aspectDistributions || []).slice(0, 5).map(a => ({
            name: a.localizedAspectName,
            values: (a.aspectValueDistributions || []).slice(0, 10).map(v => ({
              value: v.localizedAspectValue,
              count: v.matchCount
            }))
          }))
        };

        const result = {
          items,
          pagination: {
            page,
            pageSize,
            total,
            hasNextPage
          },
          refinements
        };

        // Cache the result
        const cacheData = {
          data: result,
          timestamp: Date.now()
        };
        await env.MERGED_CACHE?.put(cacheKey, JSON.stringify(cacheData), {
          expirationTtl: 300 // 5 minutes
        });

        return new Response(JSON.stringify(result), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'X-Cache': 'MISS'
          }
        });

      } catch (error) {
        console.error('Health search error:', error);
        return new Response(JSON.stringify({
          error: 'search_failed',
          message: 'Unable to search health products at this time. Please try again later.'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // eBay Health Item Detail API
    if (path.startsWith('/api/health/item/') && request.method === 'GET') {
      try {
        // Extract and decode the item ID
        const encodedItemId = path.replace('/api/health/item/', '');
        const itemId = decodeURIComponent(encodedItemId);

        console.log('Health item detail request for:', itemId);

        if (!itemId) {
          return new Response(JSON.stringify({ error: 'Item ID required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        // Check cache first (2 hour TTL)
        const cacheKey = `ebay_health_item:${itemId}`;
        const cachedResult = await env.MERGED_CACHE?.get(cacheKey);
        if (cachedResult) {
          const parsed = JSON.parse(cachedResult);
          if (parsed.timestamp > Date.now() - (2 * 60 * 60 * 1000)) {
            return new Response(JSON.stringify(parsed.data), {
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'X-Cache': 'HIT'
              }
            });
          }
        }

        // Get eBay access token
        const token = await getEbayAccessToken(env);
        if (!token) {
          throw new Error('Failed to obtain eBay access token');
        }

        // Call eBay Browse API for item details
        const ebayUrl = `https://api.ebay.com/buy/browse/v1/item/${itemId}?fieldgroups=PRODUCT`;
        console.log('Fetching from eBay:', ebayUrl);

        const ebayResponse = await fetch(ebayUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
          }
        });

        if (!ebayResponse.ok) {
          const errorText = await ebayResponse.text();
          console.error('eBay health item API error:', ebayResponse.status);
          console.error('Error details:', errorText);
          console.error('Item ID:', itemId);

          // Try to serve cached data on error (stale-on-error)
          if (cachedResult) {
            const parsed = JSON.parse(cachedResult);
            return new Response(JSON.stringify(parsed.data), {
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'X-Cache': 'STALE'
              }
            });
          }

          if (ebayResponse.status === 404) {
            return new Response(JSON.stringify({ error: 'Item not found' }), {
              status: 404,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
          }

          throw new Error(`eBay API returned ${ebayResponse.status}: ${errorText}`);
        }

        const item = await ebayResponse.json();

        // Extract images
        const images = [];
        if (item.image?.imageUrl) {
          images.push(item.image.imageUrl);
        }
        if (item.additionalImages) {
          images.push(...item.additionalImages.map(img => img.imageUrl));
        }

        // Extract description (first 500 chars)
        let shortDescription = '';
        if (item.shortDescription) {
          shortDescription = item.shortDescription.substring(0, 500);
        } else if (item.description) {
          shortDescription = item.description.substring(0, 500);
        }

        // Extract item specifics
        const itemSpecifics = {};
        if (item.localizedAspects) {
          item.localizedAspects.forEach(aspect => {
            itemSpecifics[aspect.name] = aspect.value;
          });
        }

        // Normalize response
        const result = {
          id: item.itemId,
          title: item.title,
          price: {
            value: parseFloat(item.price?.value || 0),
            currency: item.price?.currency || 'USD'
          },
          condition: item.condition || 'Not Specified',
          images,
          shortDescription,
          itemSpecifics,
          webUrl: item.itemWebUrl,
          seller: {
            username: item.seller?.username || 'Unknown',
            feedbackPercentage: item.seller?.feedbackPercentage || 0,
            feedbackScore: item.seller?.feedbackScore || 0
          }
        };

        // Cache the result
        const cacheData = {
          data: result,
          timestamp: Date.now()
        };
        await env.MERGED_CACHE?.put(cacheKey, JSON.stringify(cacheData), {
          expirationTtl: 7200 // 2 hours
        });

        return new Response(JSON.stringify(result), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'X-Cache': 'MISS'
          }
        });

      } catch (error) {
        console.error('Health item detail error:', error);
        return new Response(JSON.stringify({
          error: 'item_fetch_failed',
          message: 'Unable to fetch product details at this time. Please try again later.'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // AI DIET PLAN GENERATION - Powered by Groq (Llama 3)
    // ═══════════════════════════════════════════════════════════════════
    
    // Calculate BMR, TDEE, and macro targets
    if (path === '/api/nutrition/calculate-targets' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { weight, height, age, gender, activityLevel, primaryGoal, targetWeight } = body;
        
        // Validate required fields
        if (!weight || !height || !age || !gender || !activityLevel || !primaryGoal) {
          return new Response(JSON.stringify({
            error: 'Missing required fields',
            required: ['weight', 'height', 'age', 'gender', 'activityLevel', 'primaryGoal']
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }
        
        // Validate ranges
        if (weight < 20 || weight > 300) {
          return new Response(JSON.stringify({ error: 'Weight must be between 20-300 kg' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }
        if (height < 100 || height > 250) {
          return new Response(JSON.stringify({ error: 'Height must be between 100-250 cm' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }
        if (age < 13 || age > 100) {
          return new Response(JSON.stringify({ error: 'Age must be between 13-100 years' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }
        
        // Calculate BMR using Mifflin-St Jeor equation (most accurate)
        let bmr;
        if (gender === 'male') {
          bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
        } else {
          bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
        }
        
        // Activity multipliers
        const activityMultipliers = {
          sedentary: 1.2,      // Little or no exercise
          light: 1.375,        // Light exercise 1-3 days/week
          moderate: 1.55,      // Moderate exercise 3-5 days/week
          active: 1.725,       // Hard exercise 6-7 days/week
          very_active: 1.9     // Very hard exercise, physical job
        };
        
        const multiplier = activityMultipliers[activityLevel] || 1.55;
        const tdee = Math.round(bmr * multiplier);
        
        // Goal-based calorie adjustment
        let dailyCalorieTarget;
        let weeklyWeightChange; // in kg
        switch (primaryGoal) {
          case 'weight_loss':
            dailyCalorieTarget = tdee - 500; // 0.5 kg/week loss
            weeklyWeightChange = -0.5;
            break;
          case 'aggressive_weight_loss':
            dailyCalorieTarget = tdee - 750; // 0.75 kg/week loss
            weeklyWeightChange = -0.75;
            break;
          case 'muscle_gain':
            dailyCalorieTarget = tdee + 300; // Lean bulk
            weeklyWeightChange = 0.25;
            break;
          case 'bulk':
            dailyCalorieTarget = tdee + 500; // Standard bulk
            weeklyWeightChange = 0.5;
            break;
          case 'maintenance':
          case 'health':
          default:
            dailyCalorieTarget = tdee;
            weeklyWeightChange = 0;
        }
        
        // Ensure minimum calories (safety)
        const minCalories = gender === 'male' ? 1500 : 1200;
        dailyCalorieTarget = Math.max(dailyCalorieTarget, minCalories);
        
        // Calculate macros based on goal
        let proteinPercent, carbPercent, fatPercent;
        switch (primaryGoal) {
          case 'weight_loss':
          case 'aggressive_weight_loss':
            proteinPercent = 0.30; // Higher protein for satiety
            carbPercent = 0.35;
            fatPercent = 0.35;
            break;
          case 'muscle_gain':
          case 'bulk':
            proteinPercent = 0.25;
            carbPercent = 0.50; // Higher carbs for energy
            fatPercent = 0.25;
            break;
          case 'maintenance':
          case 'health':
          default:
            proteinPercent = 0.25;
            carbPercent = 0.45;
            fatPercent = 0.30;
        }
        
        // Calculate macro grams
        const proteinGrams = Math.round((dailyCalorieTarget * proteinPercent) / 4);
        const carbGrams = Math.round((dailyCalorieTarget * carbPercent) / 4);
        const fatGrams = Math.round((dailyCalorieTarget * fatPercent) / 9);
        
        // Calculate weeks to goal if target weight is set
        let weeksToGoal = null;
        if (targetWeight && weeklyWeightChange !== 0) {
          const weightDiff = targetWeight - weight;
          if ((weightDiff < 0 && weeklyWeightChange < 0) || (weightDiff > 0 && weeklyWeightChange > 0)) {
            weeksToGoal = Math.ceil(Math.abs(weightDiff / weeklyWeightChange));
          }
        }
        
        // BMI calculation
        const heightInMeters = height / 100;
        const bmi = Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10;
        let bmiCategory;
        if (bmi < 18.5) bmiCategory = 'Underweight';
        else if (bmi < 25) bmiCategory = 'Normal';
        else if (bmi < 30) bmiCategory = 'Overweight';
        else bmiCategory = 'Obese';
        
        // Ideal weight range (BMI 18.5-24.9)
        const idealWeightMin = Math.round(18.5 * heightInMeters * heightInMeters);
        const idealWeightMax = Math.round(24.9 * heightInMeters * heightInMeters);
        
        const result = {
          bmr: Math.round(bmr),
          tdee,
          dailyCalorieTarget,
          macroTargets: {
            protein: proteinGrams,
            carbs: carbGrams,
            fats: fatGrams
          },
          macroPercentages: {
            protein: Math.round(proteinPercent * 100),
            carbs: Math.round(carbPercent * 100),
            fats: Math.round(fatPercent * 100)
          },
          weeklyWeightChange,
          weeksToGoal,
          bmi,
          bmiCategory,
          idealWeightRange: { min: idealWeightMin, max: idealWeightMax },
          hydrationGoal: Math.round(weight * 35), // 35ml per kg body weight
          calculatedAt: new Date().toISOString()
        };
        
        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
        
      } catch (error) {
        console.error('Calculate targets error:', error);
        return new Response(JSON.stringify({ error: 'Failed to calculate nutrition targets' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }
    
    // AI Diet Plan Generation using Groq
    if (path === '/api/nutrition/generate-diet-plan' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { userProfile, duration = 'week' } = body;
        
        // Validate user profile
        if (!userProfile) {
          return new Response(JSON.stringify({ error: 'User profile is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }
        
        const { 
          weight, height, age, gender, activityLevel, primaryGoal,
          dietaryRestrictions = [], allergies = [], cuisinePreferences = [],
          mealsPerDay = 4, cookingTime = 'moderate', dailyCalorieTarget, macroTargets
        } = userProfile;
        
        // Validate essential fields
        if (!dailyCalorieTarget || !macroTargets) {
          return new Response(JSON.stringify({ 
            error: 'Please calculate your nutrition targets first',
            missingFields: ['dailyCalorieTarget', 'macroTargets']
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }
        
        // Check for cached diet plan
        const profileHash = JSON.stringify({
          weight, height, age, gender, activityLevel, primaryGoal,
          dietaryRestrictions, allergies, cuisinePreferences, mealsPerDay,
          dailyCalorieTarget, macroTargets
        });
        const cacheKey = `diet_plan:${btoa(profileHash).substring(0, 50)}`;
        
        const cachedPlan = await env.NUTRITION_CACHE?.get(cacheKey);
        if (cachedPlan) {
          const parsed = JSON.parse(cachedPlan);
          // Return cached plan if less than 24 hours old
          if (parsed.generatedAt && (Date.now() - new Date(parsed.generatedAt).getTime()) < 24 * 60 * 60 * 1000) {
            return new Response(JSON.stringify({ ...parsed, fromCache: true }), {
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
          }
        }
        
        // Get Groq API key (faster than Gemini)
        const groqApiKey = env.GROQ_API_KEY;
        if (!groqApiKey) {
          return new Response(JSON.stringify({ error: 'AI service not configured' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }
        
        // Build the prompt
        const systemPrompt = `You are an expert nutritionist and registered dietitian with 20+ years of experience creating personalized diet plans. You specialize in Indian cuisine and can adapt any diet to regional food preferences.

CRITICAL RULES:
1. ALWAYS respect dietary restrictions and allergies - NEVER include restricted foods
2. Create practical, realistic meals with locally available ingredients
3. Include exact portion sizes in grams/ml
4. Calculate accurate calories and macros for each meal
5. Ensure daily totals match the target within ±5%
6. Consider cooking time preferences
7. Provide variety across the week
8. Include 1-2 snacks based on mealsPerDay setting

OUTPUT FORMAT: Return ONLY valid JSON matching this exact schema:
{
  "weeklyPlan": [
    {
      "day": "Monday",
      "meals": [
        {
          "type": "breakfast|morning_snack|lunch|evening_snack|dinner",
          "time": "8:00 AM",
          "name": "Meal name",
          "description": "Brief description",
          "ingredients": [
            { "name": "Ingredient", "quantity": 100, "unit": "g", "calories": 150 }
          ],
          "totalCalories": 400,
          "macros": { "protein": 20, "carbs": 45, "fats": 12 },
          "prepTime": 15,
          "instructions": "Brief cooking instructions",
          "alternatives": ["Quick swap option 1", "Quick swap option 2"]
        }
      ],
      "dailyTotals": { "calories": 1800, "protein": 120, "carbs": 180, "fats": 60 }
    }
  ],
  "shoppingList": [
    { "name": "Item", "quantity": "500g", "category": "produce|dairy|protein|grains|spices|other" }
  ],
  "mealPrepTips": ["Tip 1", "Tip 2", "Tip 3"],
  "weeklyNotes": "General notes about this plan"
}`;

        const userPrompt = `Create a personalized ${duration === 'day' ? 'daily' : 'weekly'} meal plan with these specifications:

USER PROFILE:
- Age: ${age} years, Gender: ${gender}
- Weight: ${weight} kg, Height: ${height} cm
- Activity Level: ${activityLevel}
- Goal: ${primaryGoal.replace(/_/g, ' ')}

NUTRITION TARGETS (per day):
- Calories: ${dailyCalorieTarget} kcal
- Protein: ${macroTargets.protein}g (${Math.round(macroTargets.protein * 4 / dailyCalorieTarget * 100)}%)
- Carbs: ${macroTargets.carbs}g (${Math.round(macroTargets.carbs * 4 / dailyCalorieTarget * 100)}%)
- Fats: ${macroTargets.fats}g (${Math.round(macroTargets.fats * 9 / dailyCalorieTarget * 100)}%)

DIETARY RESTRICTIONS: ${dietaryRestrictions.length > 0 ? dietaryRestrictions.join(', ') : 'None'}
ALLERGIES: ${allergies.length > 0 ? allergies.join(', ') : 'None'}
CUISINE PREFERENCES: ${cuisinePreferences.length > 0 ? cuisinePreferences.join(', ') : 'Indian, International mix'}
MEALS PER DAY: ${mealsPerDay}
COOKING TIME: ${cookingTime} (${cookingTime === 'minimal' ? '<15 min' : cookingTime === 'moderate' ? '15-30 min' : 'flexible'})

Generate a complete, practical ${duration === 'day' ? '1-day' : '7-day'} meal plan following the exact JSON schema.`;

        // Call Groq API (faster response times)
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 8000,
            response_format: { type: 'json_object' }
          })
        });
        
        if (!groqResponse.ok) {
          const errorText = await groqResponse.text();
          console.error('Groq API error:', groqResponse.status, errorText);
          
          if (groqResponse.status === 429) {
            return new Response(JSON.stringify({ 
              error: 'AI service is busy. Please try again in a moment.',
              retryAfter: 30
            }), {
              status: 429,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
          }
          
          return new Response(JSON.stringify({ 
            error: 'Failed to generate diet plan',
            details: errorText,
            status: groqResponse.status
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }
        
        const groqData = await groqResponse.json();
        const aiContent = groqData.choices?.[0]?.message?.content;
        
        if (!aiContent) {
          return new Response(JSON.stringify({ error: 'AI returned empty response' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }
        
        // Parse AI response
        let dietPlan;
        try {
          dietPlan = JSON.parse(aiContent);
        } catch (parseError) {
          console.error('Failed to parse AI response:', aiContent);
          return new Response(JSON.stringify({ error: 'AI response was not valid JSON' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }
        
        // Enhance the response with metadata
        const enhancedPlan = {
          ...dietPlan,
          id: crypto.randomUUID(),
          generatedAt: new Date().toISOString(),
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          userTargets: {
            dailyCalories: dailyCalorieTarget,
            macros: macroTargets
          },
          duration,
          aiModel: 'llama-3.3-70b-versatile'
        };
        
        // Cache the plan
        await env.NUTRITION_CACHE?.put(cacheKey, JSON.stringify(enhancedPlan), {
          expirationTtl: 24 * 60 * 60 // 24 hours
        });
        
        return new Response(JSON.stringify(enhancedPlan), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
        
      } catch (error) {
        console.error('Diet plan generation error:', error);
        return new Response(JSON.stringify({ 
          error: 'Failed to generate diet plan',
          message: error.message || 'Unknown error'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }
    
    // Regenerate a specific meal
    if (path === '/api/nutrition/regenerate-meal' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { userProfile, dayIndex, mealType, currentMeal } = body;
        
        if (!userProfile || dayIndex === undefined || !mealType) {
          return new Response(JSON.stringify({ error: 'Missing required fields' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }
        
        const { dailyCalorieTarget, macroTargets, dietaryRestrictions = [], allergies = [], cuisinePreferences = [] } = userProfile;
        
        const groqApiKey = env.GROQ_API_KEY;
        if (!groqApiKey) {
          return new Response(JSON.stringify({ error: 'AI service not configured' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }
        
        // Calculate target calories for this meal type
        let targetCalories;
        switch (mealType) {
          case 'breakfast': targetCalories = Math.round(dailyCalorieTarget * 0.25); break;
          case 'lunch': targetCalories = Math.round(dailyCalorieTarget * 0.30); break;
          case 'dinner': targetCalories = Math.round(dailyCalorieTarget * 0.30); break;
          case 'morning_snack':
          case 'evening_snack':
            targetCalories = Math.round(dailyCalorieTarget * 0.075); break;
          default: targetCalories = Math.round(dailyCalorieTarget * 0.25);
        }
        
        const prompt = `Generate a single ${mealType.replace('_', ' ')} meal (different from: ${currentMeal?.name || 'nothing'}).

TARGET: ~${targetCalories} calories
RESTRICTIONS: ${dietaryRestrictions.join(', ') || 'None'}
ALLERGIES: ${allergies.join(', ') || 'None'}
CUISINE: ${cuisinePreferences.join(', ') || 'Indian/International'}

Return JSON:
{
  "type": "${mealType}",
  "time": "appropriate time",
  "name": "Meal name",
  "description": "Brief description",
  "ingredients": [{ "name": "Item", "quantity": 100, "unit": "g", "calories": 150 }],
  "totalCalories": ${targetCalories},
  "macros": { "protein": X, "carbs": Y, "fats": Z },
  "prepTime": 15,
  "instructions": "Brief instructions",
  "alternatives": ["Option 1", "Option 2"]
}`;

        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: 'You are a nutritionist. Return ONLY valid JSON.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.8,
            max_tokens: 1000,
            response_format: { type: 'json_object' }
          })
        });
        
        if (!groqResponse.ok) {
          return new Response(JSON.stringify({ error: 'Failed to regenerate meal' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }
        
        const groqData = await groqResponse.json();
        const newMeal = JSON.parse(groqData.choices?.[0]?.message?.content || '{}');
        
        return new Response(JSON.stringify({ meal: newMeal, dayIndex, mealType }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
        
      } catch (error) {
        console.error('Meal regeneration error:', error);
        return new Response(JSON.stringify({ error: 'Failed to regenerate meal' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // Return 404 for undefined routes
    return new Response(JSON.stringify({ error: 'not_found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};

// ═══════════════════════════════════════════════════════════════════
// EBAY OAUTH TOKEN SERVICE
// ═══════════════════════════════════════════════════════════════════
// Implements OAuth 2.0 client-credentials grant for eBay Browse API access
// - Uses production endpoint (not sandbox)
// - Scope: https://api.ebay.com/oauth/api_scope
// - Tokens cached in EBAY_TOKEN KV namespace
// - 5-minute expiry buffer for token refresh
// - Reads credentials from env.EBAY_CLIENT_ID and env.EBAY_CLIENT_SECRET
// - No Dev ID required (client-credentials flow only needs App ID + Cert ID)
// ═══════════════════════════════════════════════════════════════════
async function getEbayAccessToken(env) {
  const now = Date.now();
  
  // Check KV for cached token
  const cachedToken = await env.EBAY_TOKEN?.get('access_token_data');
  if (cachedToken) {
    const tokenData = JSON.parse(cachedToken);
    // Check if token is still valid (with 5 minute buffer)
    if (tokenData.expiresAt && tokenData.expiresAt > (now + 300000)) {
      return tokenData.accessToken;
    }
  }

  // Get credentials from environment
  const clientId = env.EBAY_CLIENT_ID;
  const clientSecret = env.EBAY_CLIENT_SECRET;
  const ebayEnv = env.EBAY_ENV || 'PROD';

  if (!clientId || !clientSecret || clientId === 'PLACEHOLDER' || clientSecret === 'PLACEHOLDER') {
    console.error('eBay credentials not configured');
    return null;
  }

  // Determine eBay endpoint
  const tokenEndpoint = ebayEnv === 'SANDBOX' 
    ? 'https://api.sandbox.ebay.com/identity/v1/oauth2/token'
    : 'https://api.ebay.com/identity/v1/oauth2/token';

  try {
    // Create Basic Auth header
    const authString = btoa(`${clientId}:${clientSecret}`);
    
    // Request token
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authString}`
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'https://api.ebay.com/oauth/api_scope'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('eBay OAuth error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const accessToken = data.access_token;
    const expiresIn = data.expires_in || 7200; // Default 2 hours

    // Cache token in KV
    const tokenData = {
      accessToken,
      expiresAt: now + (expiresIn * 1000)
    };
    
    await env.EBAY_TOKEN?.put('access_token_data', JSON.stringify(tokenData), {
      expirationTtl: expiresIn
    });

    return accessToken;

  } catch (error) {
    console.error('eBay OAuth fetch error:', error);
    return null;
  }
}
