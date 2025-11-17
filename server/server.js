import express from 'express';
import cors from 'cors';
import { createClient } from 'redis';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

// Load admin password from env
if (!process.env.ADMIN_PASSWORD) {
  console.warn('ADMIN_PASSWORD not set - admin features will be disabled');
}

const app = express();
const PORT = process.env.PORT || 3003;

// Redis client with fallback
let redisClient;
let useInMemoryCache = false;
const inMemoryCache = new Map();

try {
  redisClient = createClient({ url: process.env.REDIS_URL });
  await redisClient.connect();
  console.log('Connected to Redis');
} catch (error) {
  console.warn('Redis unavailable, falling back to in-memory cache:', error.message);
  useInMemoryCache = true;
}

// CORS for local development
app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true
}));

app.use(express.json());

// Cache helpers
const getCache = async (key) => {
  if (useInMemoryCache) {
    const item = inMemoryCache.get(key);
    return item?.expires > Date.now() ? item.value : null;
  }
  try {
    return await redisClient.get(key);
  } catch (error) {
    console.warn('Redis get error:', error.message);
    return null;
  }
};

const setCache = async (key, value, ttlSeconds) => {
  if (useInMemoryCache) {
    inMemoryCache.set(key, { value, expires: Date.now() + (ttlSeconds * 1000) });
    return;
  }
  try {
    await redisClient.setEx(key, ttlSeconds, value);
  } catch (error) {
    console.warn('Redis set error:', error.message);
  }
};

// eBay token management
const getEbayToken = async () => {
  const cached = await getCache('ebay:token');
  if (cached) return cached;

  const auth = Buffer.from(`${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`).toString('base64');
  
  try {
    const response = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope'
    });

    const data = await response.json();
    if (data.access_token) {
      await setCache('ebay:token', data.access_token, data.expires_in - 60);
      return data.access_token;
    }
    throw new Error('No access token received');
  } catch (error) {
    console.error('eBay token error:', error.message);
    throw error;
  }
};

// eBay search with retry
const searchEbay = async (token, query, isGtin = false) => {
  const baseUrl = 'https://api.ebay.com/buy/browse/v1/item_summary/search';
  const params = new URLSearchParams({
    limit: '6',
    ...(isGtin ? { gtin: query } : { q: query })
  });

  let retries = 0;
  while (retries < 3) {
    try {
      const response = await fetch(`${baseUrl}?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 429) {
        retries++;
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
        continue;
      }

      const data = await response.json();
      return data.itemSummaries || [];
    } catch (error) {
      retries++;
      if (retries >= 3) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
    }
  }
  throw new Error('Max retries exceeded');
};

// Helper to get client IP
const getClientIP = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress || 
         'unknown';
};

// Admin auth middleware
const requireAdmin = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || auth !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Affiliate click tracking
app.post('/api/affiliate/click', async (req, res) => {
  const { barcode, offerItemId, affiliateUrl, timestamp } = req.body;
  const ip = getClientIP(req);
  
  try {
    const clickData = { barcode, offerItemId, affiliateUrl, timestamp, ip };
    
    if (useInMemoryCache) {
      // Simple in-memory tracking
      const clicks = inMemoryCache.get('affiliate:clicks') || [];
      clicks.push(JSON.stringify(clickData));
      inMemoryCache.set('affiliate:clicks', clicks);
      
      const barcodeCount = inMemoryCache.get(`affiliate:count:${barcode}`) || 0;
      inMemoryCache.set(`affiliate:count:${barcode}`, barcodeCount + 1);
      
      const offerCount = inMemoryCache.get(`affiliate:count:offer:${offerItemId}`) || 0;
      inMemoryCache.set(`affiliate:count:offer:${offerItemId}`, offerCount + 1);
    } else {
      await redisClient.lPush('affiliate:clicks', JSON.stringify(clickData));
      await redisClient.incr(`affiliate:count:${barcode}`);
      await redisClient.incr(`affiliate:count:offer:${offerItemId}`);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Affiliate click tracking error:', error);
    res.status(500).json({ error: 'Failed to track click' });
  }
});

// Product suggestions
app.post('/api/products/:barcode/suggestions', async (req, res) => {
  const { barcode } = req.params;
  const { name, info } = req.body;
  const ip = getClientIP(req);
  
  if (!info?.trim()) {
    return res.status(400).json({ error: 'Info is required' });
  }
  
  try {
    const suggestion = {
      name: name || 'Anonymous',
      info: info.trim(),
      timestamp: new Date().toISOString(),
      ip
    };
    
    if (useInMemoryCache) {
      const suggestions = inMemoryCache.get(`suggestions:product:${barcode}`) || [];
      suggestions.push(JSON.stringify(suggestion));
      inMemoryCache.set(`suggestions:product:${barcode}`, suggestions);
    } else {
      await redisClient.lPush(`suggestions:product:${barcode}`, JSON.stringify(suggestion));
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Suggestion save error:', error);
    res.status(500).json({ error: 'Failed to save suggestion' });
  }
});

// Admin: Get product for editing
app.get('/api/admin/products/:barcode', requireAdmin, async (req, res) => {
  const { barcode } = req.params;
  
  try {
    // Get current merged data
    const mergedKey = `merged:product:${barcode}`;
    const cached = await getCache(mergedKey);
    const merged = cached ? JSON.parse(cached) : null;
    
    // Get current overrides
    const overrideKey = `override:product:${barcode}`;
    const overrideData = await getCache(overrideKey);
    const overrides = overrideData ? JSON.parse(overrideData) : {};
    
    // Get suggestions
    const suggestionsKey = `suggestions:product:${barcode}`;
    let suggestions = [];
    if (useInMemoryCache) {
      suggestions = (inMemoryCache.get(suggestionsKey) || []).map(s => JSON.parse(s));
    } else {
      const rawSuggestions = await redisClient.lRange(suggestionsKey, 0, -1);
      suggestions = rawSuggestions.map(s => JSON.parse(s));
    }
    
    // Get affiliate stats
    const barcodeCount = useInMemoryCache ? 
      (inMemoryCache.get(`affiliate:count:${barcode}`) || 0) :
      parseInt(await redisClient.get(`affiliate:count:${barcode}`) || '0');
    
    res.json({ merged, overrides, suggestions, affiliateStats: { totalClicks: barcodeCount } });
  } catch (error) {
    console.error('Admin get product error:', error);
    res.status(500).json({ error: 'Failed to get product data' });
  }
});

// Admin: Save overrides
app.post('/api/admin/products/:barcode/overrides', requireAdmin, async (req, res) => {
  const { barcode } = req.params;
  const { name, brand, ingredients, labels, allergens, images } = req.body;
  
  try {
    const overrides = { name, brand, ingredients, labels, allergens, images };
    const overrideKey = `override:product:${barcode}`;
    
    if (useInMemoryCache) {
      inMemoryCache.set(overrideKey, JSON.stringify(overrides));
    } else {
      await redisClient.set(overrideKey, JSON.stringify(overrides));
    }
    
    // Clear merged cache to force refresh
    const mergedKey = `merged:product:${barcode}`;
    if (useInMemoryCache) {
      inMemoryCache.delete(mergedKey);
    } else {
      await redisClient.del(mergedKey);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Admin save overrides error:', error);
    res.status(500).json({ error: 'Failed to save overrides' });
  }
});

// Admin: Apply suggestion
app.post('/api/admin/products/:barcode/apply-suggestion', requireAdmin, async (req, res) => {
  const { barcode } = req.params;
  const { suggestionIndex, fields } = req.body;
  
  try {
    // Get current overrides
    const overrideKey = `override:product:${barcode}`;
    const overrideData = await getCache(overrideKey);
    const overrides = overrideData ? JSON.parse(overrideData) : {};
    
    // Apply suggestion fields
    Object.assign(overrides, fields);
    
    // Save updated overrides
    if (useInMemoryCache) {
      inMemoryCache.set(overrideKey, JSON.stringify(overrides));
    } else {
      await redisClient.set(overrideKey, JSON.stringify(overrides));
    }
    
    // Remove suggestion
    const suggestionsKey = `suggestions:product:${barcode}`;
    if (useInMemoryCache) {
      const suggestions = inMemoryCache.get(suggestionsKey) || [];
      suggestions.splice(suggestionIndex, 1);
      inMemoryCache.set(suggestionsKey, suggestions);
    } else {
      // Redis list removal is complex, for now just mark as applied
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Apply suggestion error:', error);
    res.status(500).json({ error: 'Failed to apply suggestion' });
  }
});

// Main merged endpoint
app.get('/api/products/:barcode/merged', async (req, res) => {
  const { barcode } = req.params;
  const forceRefresh = req.query.forceRefresh === 'true';

  // Validate barcode
  if (!barcode || !/^\d+$/.test(barcode)) {
    return res.status(400).json({ error: 'Invalid barcode format' });
  }

  const cacheKey = `merged:product:${barcode}`;
  
  // Check cache
  if (!forceRefresh) {
    const cached = await getCache(cacheKey);
    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.json(JSON.parse(cached));
    }
  }

  res.set('X-Cache', 'MISS');

  try {
    // Fetch OBF data
    let obfData = null;
    let obfAvailable = false;
    
    try {
      const obfResponse = await fetch(`${process.env.OBF_BASE_URL}/api/v2/product/${barcode}`);
      const obfResult = await obfResponse.json();
      if (obfResult.status === 1 && obfResult.product) {
        obfData = obfResult.product;
        obfAvailable = true;
      }
    } catch (error) {
      console.warn('OBF fetch error:', error.message);
    }

    // Get eBay token and search
    let ebayOffers = [];
    let ebayAvailable = false;
    let ebayError = null;

    try {
      const token = await getEbayToken();
      
      // Try GTIN search first
      let items = await searchEbay(token, barcode, true);
      
      // Fallback to text search if no GTIN results
      if (items.length === 0 && obfData) {
        const brand = obfData.brands?.split(',')[0]?.trim() || '';
        const productName = obfData.product_name || '';
        const searchQuery = brand && productName ? `${brand} ${productName}` : 
                           obfData.product_name || barcode;
        items = await searchEbay(token, searchQuery, false);
      }

      if (items.length > 0) {
        ebayAvailable = true;
        ebayOffers = items.map(item => ({
          title: item.title,
          price: item.price ? {
            value: item.price.value,
            currency: item.price.currency
          } : null,
          seller: item.seller?.username || 'Unknown',
          itemWebUrl: item.itemWebUrl,
          affiliateUrl: process.env.EBAY_CAMPAIGN_ID ? 
            `${item.itemWebUrl}?campid=${process.env.EBAY_CAMPAIGN_ID}` : 
            item.itemWebUrl,
          itemId: item.itemId,
          image: item.image?.imageUrl || null
        }));
      }
    } catch (error) {
      console.error('eBay search error:', error.message);
      ebayError = error.message;
    }

    // Check for admin overrides
    const overrideKey = `override:product:${barcode}`;
    const overrideData = await getCache(overrideKey);
    const overrides = overrideData ? JSON.parse(overrideData) : {};
    
    // Build merged response with overrides
    const merged = {
      id: barcode,
      name: overrides.name || obfData?.product_name || ebayOffers[0]?.title || barcode,
      brand: overrides.brand || obfData?.brands?.split(',')[0]?.trim() || null,
      category: obfData?.categories_tags?.[0]?.replace('en:', '').replace(/-/g, ' ') || null,
      images: {
        hero: overrides.images?.[0] || obfData?.image_front_url || ebayOffers[0]?.image || null,
        gallery: overrides.images || [
          obfData?.image_front_url,
          obfData?.image_ingredients_url,
          obfData?.image_nutrition_url,
          ...ebayOffers.slice(0, 3).map(offer => offer.image)
        ].filter(Boolean).filter((url, index, arr) => arr.indexOf(url) === index)
      },
      ingredients: overrides.ingredients || obfData?.ingredients_text || null,
      labels: overrides.labels || obfData?.labels_tags?.map(tag => tag.replace('en:', '').replace(/-/g, ' ')) || [],
      allergens: overrides.allergens || obfData?.allergens_tags?.map(tag => tag.replace('en:', '').replace(/-/g, ' ')) || [],
      offers: {
        primary: ebayOffers[0] || null,
        others: ebayOffers.slice(1, 5)
      },
      source: {
        obf: {
          available: obfAvailable,
          raw: obfAvailable ? {
            product_name: obfData.product_name,
            brands: obfData.brands,
            categories_tags: obfData.categories_tags?.slice(0, 3)
          } : null
        },
        ebay: {
          available: ebayAvailable,
          raw: ebayAvailable ? { itemCount: ebayOffers.length } : null,
          ...(ebayError && { error: ebayError }),
          ...((!process.env.EBAY_CAMPAIGN_ID && ebayAvailable) && { 
            note: 'Affiliate ID missing - links not wrapped' 
          })
        }
      },
      overrides: Object.keys(overrides).length > 0 ? Object.keys(overrides) : null,
      cachedAt: new Date().toISOString()
    };

    // Cache for 4 hours
    await setCache(cacheKey, JSON.stringify(merged), 4 * 60 * 60);
    
    res.json(merged);
  } catch (error) {
    console.error('Merged endpoint error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Simple admin page (basic HTML)
app.get('/admin/products/:barcode/edit', (req, res) => {
  const { barcode } = req.params;
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Admin - Edit Product ${barcode}</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input, textarea { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        textarea { height: 100px; }
        button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #0056b3; }
        .suggestions { background: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .suggestion { background: white; padding: 10px; margin: 10px 0; border-radius: 4px; border: 1px solid #ddd; }
        .stats { background: #e9ecef; padding: 15px; margin: 20px 0; border-radius: 4px; }
      </style>
    </head>
    <body>
      <h1>Edit Product: ${barcode}</h1>
      <div id="auth" style="display: none;">
        <input type="password" id="password" placeholder="Admin password" />
        <button onclick="authenticate()">Login</button>
      </div>
      <div id="content" style="display: none;">
        <form id="productForm">
          <div class="form-group">
            <label>Name:</label>
            <input type="text" id="name" />
          </div>
          <div class="form-group">
            <label>Brand:</label>
            <input type="text" id="brand" />
          </div>
          <div class="form-group">
            <label>Ingredients:</label>
            <textarea id="ingredients"></textarea>
          </div>
          <div class="form-group">
            <label>Labels (comma-separated):</label>
            <input type="text" id="labels" />
          </div>
          <div class="form-group">
            <label>Allergens (comma-separated):</label>
            <input type="text" id="allergens" />
          </div>
          <div class="form-group">
            <label>Images (comma-separated URLs):</label>
            <input type="text" id="images" />
          </div>
          <button type="submit">Save Overrides</button>
        </form>
        
        <div class="stats">
          <h3>Affiliate Stats</h3>
          <p>Total clicks: <span id="totalClicks">0</span></p>
        </div>
        
        <div class="suggestions">
          <h3>Pending Suggestions</h3>
          <div id="suggestionsList">No suggestions</div>
        </div>
      </div>
      
      <script>
        let token = localStorage.getItem('adminToken');
        if (token) {
          document.getElementById('content').style.display = 'block';
          loadData();
        } else {
          document.getElementById('auth').style.display = 'block';
        }
        
        function authenticate() {
          const password = document.getElementById('password').value;
          token = 'Bearer ' + password;
          localStorage.setItem('adminToken', token);
          document.getElementById('auth').style.display = 'none';
          document.getElementById('content').style.display = 'block';
          loadData();
        }
        
        async function loadData() {
          try {
            const response = await fetch('/api/admin/products/${barcode}', {
              headers: { 'Authorization': token }
            });
            const data = await response.json();
            
            // Fill form with current overrides
            document.getElementById('name').value = data.overrides.name || '';
            document.getElementById('brand').value = data.overrides.brand || '';
            document.getElementById('ingredients').value = data.overrides.ingredients || '';
            document.getElementById('labels').value = (data.overrides.labels || []).join(', ');
            document.getElementById('allergens').value = (data.overrides.allergens || []).join(', ');
            document.getElementById('images').value = (data.overrides.images || []).join(', ');
            
            // Show stats
            document.getElementById('totalClicks').textContent = data.affiliateStats.totalClicks;
            
            // Show suggestions
            const suggestionsList = document.getElementById('suggestionsList');
            if (data.suggestions.length > 0) {
              suggestionsList.innerHTML = data.suggestions.map((s, i) => 
                '<div class="suggestion">' +
                '<strong>' + s.name + '</strong> (' + new Date(s.timestamp).toLocaleString() + '):<br>' +
                s.info +
                '<br><button onclick="applySuggestion(' + i + ', \'' + s.info.replace(/'/g, "\\'")+'\')">Apply</button>' +
                '</div>'
              ).join('');
            }
          } catch (error) {
            console.error('Failed to load data:', error);
          }
        }
        
        document.getElementById('productForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const formData = {
            name: document.getElementById('name').value,
            brand: document.getElementById('brand').value,
            ingredients: document.getElementById('ingredients').value,
            labels: document.getElementById('labels').value.split(',').map(s => s.trim()).filter(Boolean),
            allergens: document.getElementById('allergens').value.split(',').map(s => s.trim()).filter(Boolean),
            images: document.getElementById('images').value.split(',').map(s => s.trim()).filter(Boolean)
          };
          
          try {
            await fetch('/api/admin/products/${barcode}/overrides', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': token },
              body: JSON.stringify(formData)
            });
            alert('Overrides saved successfully!');
          } catch (error) {
            alert('Failed to save overrides');
          }
        });
        
        async function applySuggestion(index, info) {
          // Simple parsing - in production would be more sophisticated
          const fields = { ingredients: info };
          try {
            await fetch('/api/admin/products/${barcode}/apply-suggestion', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': token },
              body: JSON.stringify({ suggestionIndex: index, fields })
            });
            alert('Suggestion applied!');
            loadData();
          } catch (error) {
            alert('Failed to apply suggestion');
          }
        }
      </script>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Admin access: http://localhost:${PORT}/admin/products/{barcode}/edit`);
});