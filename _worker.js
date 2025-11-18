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
        const cacheKey = `usda_search:${encodeURIComponent(query)}:page_${page}:size_${pageSize}`;
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
        const transformedFoods = searchData.foods?.map((food, index) => transformUSDAData(food, index + (page - 1) * pageSize, page)).filter(Boolean) || [];

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
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
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
