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

// Helper function to fetch image from Unsplash API
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

    // Get image URL using Unsplash API
    let imageUrl = 'https://picsum.photos/400/300?random=' + index; // Default placeholder fallback
    
    // Try to get a specific image from Unsplash
    // Clean up search terms: remove commas, extra spaces, and ensure it's a simple query
    const rawTerm = food.description?.split(',')[0] || food.description || 'food';
    const searchTerms = rawTerm.trim();
    
    // Use provided Unsplash key or fallback to env
    // The user provided key: 45KTR6-Zue9Pkb6Obw4swYQE7r0iUqfa-ghgJc73UpI
    const unsplashKey = env.UNSPLASH_ACCESS_KEY || '45KTR6-Zue9Pkb6Obw4swYQE7r0iUqfa-ghgJc73UpI';
    
    const unsplashUrl = await fetchUnsplashImage(searchTerms, unsplashKey);
    if (unsplashUrl) {
      imageUrl = unsplashUrl;
    } 
    // If Unsplash fails, we stick with the Picsum placeholder.
    // We DO NOT use source.unsplash.com as it is deprecated and broken.

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
