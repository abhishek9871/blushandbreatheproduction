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
      return new Response(JSON.stringify({ error: 'not_found' }), { status: 404, headers: { 'Content-Type':'application/json' }});
    } catch (err) {
      return new Response(JSON.stringify({ error: 'do_error', detail: String(err) }), { status: 500, headers: { 'Content-Type':'application/json' }});
    }
  }

  async _handleClick(request) {
    const body = await request.json().catch(()=>({}));
    const barcode = body.barcode || 'unknown';
    const offerItemId = body.offerItemId || null;
    const affiliateUrl = (body.affiliateUrl || '').toString().slice(0,256);
    const ip = body.ip || 'unknown';
    const ua = (body.userAgent || '').toString().slice(0,200);
    const ts = body.timestamp || new Date().toISOString();

    const countKey = 'count';
    const clicksKey = 'clicks';

    const currentCount = (await this.state.storage.get(countKey)) || 0;
    const clicks = (await this.state.storage.get(clicksKey)) || [];

    const newClick = { ts, barcode, offerItemId, affiliateUrl, ip, ua };
    const updatedClicks = [newClick, ...clicks].slice(0,200);

    await this.state.storage.put(countKey, currentCount + 1);
    await this.state.storage.put(clicksKey, updatedClicks);

    return new Response(JSON.stringify({ ok: true, newCount: currentCount + 1 }), { headers: { 'Content-Type':'application/json' }});
  }

  async _handleStats() {
    const count = (await this.state.storage.get('count')) || 0;
    const clicks = (await this.state.storage.get('clicks')) || [];
    return new Response(JSON.stringify({ count, lastClicks: clicks.slice(0,10) }), { headers: { 'Content-Type':'application/json' }});
  }

  async _handleClear() {
    await this.state.storage.delete('count');
    await this.state.storage.delete('clicks');
    return new Response(JSON.stringify({ ok: true, cleared: true }), { headers: { 'Content-Type':'application/json' }});
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

// Helper function to transform USDA food data to our NutritionInfo format
function transformUSDAData(food, index, page) {
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

    // Get image URL (USDA doesn't provide images, so we'll use a placeholder or try to find branded food images)
    let imageUrl = 'https://picsum.photos/400/300?random=' + index; // Default placeholder

    if (food.brandName && food.gtinUpc) {
      // For branded foods, we could potentially use the GTIN to find images
      // For now, use a food category based image
      imageUrl = `https://source.unsplash.com/400x300/?${encodeURIComponent(food.description?.split(',')[0] || 'food')}`;
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
      id: `nutrition-${index}-${page}`,
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

    // News API proxy
    if (path === '/api/newsapi' && request.method === 'GET') {
      const url = new URL(request.url);
      const category = url.searchParams.get('category') || 'health';
      const language = url.searchParams.get('language') || 'en';
      const country = url.searchParams.get('country') || 'us';
      const page = url.searchParams.get('page') || '1';
      const pageSize = url.searchParams.get('pageSize') || '20';
      const apiKey = env.NEWSAPI_KEY || env.VITE_NEWSAPI_KEY;

      try {
        if (!apiKey) {
          return new Response(JSON.stringify({ status: 'error', message: 'News API key not configured' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        const newsUrl = `https://newsapi.org/v2/top-headlines?category=${category}&language=${language}&country=${country}&page=${page}&pageSize=${pageSize}&apiKey=${apiKey}`;
        const newsResponse = await fetch(newsUrl, {
          headers: {
            'User-Agent': 'BlushAndBreathe/1.0 (+https://jyotilalchandani.pages.dev)'
          }
        });
        const newsData = await newsResponse.json();
        
        if (!newsResponse.ok) {
          console.error('NewsAPI response:', newsData);
          throw new Error(`NewsAPI error: ${newsResponse.status} - ${newsData.message || 'Unknown error'}`);
        }
        
        return new Response(JSON.stringify(newsData), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (error) {
        console.error('NewsAPI proxy error:', error);
        return new Response(JSON.stringify({ status: 'error', message: String(error) }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // USDA Nutrition API endpoint
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
        const cacheKey = `nutrition:page_${page}:size_${pageSize}`;
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
                const nutritionInfo = transformUSDAData(food, i, page);

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

    // Return 404 for undefined routes
    return new Response(JSON.stringify({ error: 'not_found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};
