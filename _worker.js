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

        // Create cache key with version to bust old cache after category restriction changes
        const cacheKey = `ebay_search:v2_beauty_only:${q}:${category}:${sort}:${minPrice || ''}:${maxPrice || ''}:${condition || ''}:${page}:${pageSize}`;
        
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

        // Build price filter
        if (minPrice || maxPrice) {
          const min = minPrice || '*';
          const max = maxPrice || '*';
          ebayParams.append('filter', `price:[${min}..${max}],priceCurrency:USD`);
        }

        // Build condition filter
        if (condition) {
          const conditionMap = {
            'new': 'NEW',
            'used': 'USED',
            'refurbished': 'REFURBISHED'
          };
          const ebayCondition = conditionMap[condition];
          if (ebayCondition) {
            const filterValue = `conditions:{${ebayCondition}}`;
            const existingFilter = ebayParams.get('filter');
            if (existingFilter) {
              ebayParams.set('filter', `${existingFilter},${filterValue}`);
            } else {
              ebayParams.append('filter', filterValue);
            }
          }
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

        // Create cache key
        const cacheKey = `ebay_health_search:${q}:${category}:${sort}:${minPrice || ''}:${maxPrice || ''}:${condition || ''}:${page}:${pageSize}`;

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

        // Add search query or category browse
        if (q && q.trim()) {
          // When there's a search query, use it directly without category_ids
          ebayParams.append('q', q.trim());
        } else {
          // No search query - browse by category
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

        // Build price filter
        if (minPrice || maxPrice) {
          const min = minPrice || '*';
          const max = maxPrice || '*';
          ebayParams.append('filter', `price:[${min}..${max}],priceCurrency:USD`);
        }

        // Build condition filter
        if (condition) {
          const conditionMap = {
            'new': 'NEW',
            'used': 'USED',
            'refurbished': 'REFURBISHED'
          };
          const ebayCondition = conditionMap[condition];
          if (ebayCondition) {
            const filterValue = `conditions:{${ebayCondition}}`;
            const existingFilter = ebayParams.get('filter');
            if (existingFilter) {
              ebayParams.set('filter', `${existingFilter},${filterValue}`);
            } else {
              ebayParams.append('filter', filterValue);
            }
          }
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
