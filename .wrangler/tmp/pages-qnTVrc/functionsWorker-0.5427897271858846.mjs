var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../.wrangler/tmp/bundle-cpIqm5/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// admin/products/[barcode]/clear.ts
async function onRequestPost(context) {
  const { env, params, request } = context;
  const auth = request.headers.get("authorization") || "";
  const expected = `Bearer ${env.ADMIN_PASSWORD || "ADMIN_PASSWORD_PLACEHOLDER"}`;
  if (auth !== expected) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }
  const barcode = params.barcode;
  if (!barcode) return new Response(JSON.stringify({ error: "missing barcode" }), { status: 400 });
  try {
    const id = env.AFFILIATE_DO.idFromName(barcode);
    const stub = env.AFFILIATE_DO.get(id);
    const res = await stub.fetch("https://do/clear", { method: "POST" });
    const body = await res.text();
    return new Response(body, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    try {
      const countKey = `AFFILIATE:COUNT:${barcode}`;
      const clicksKey = `AFFILIATE:CLICKS:${barcode}`;
      await env.AFFILIATE_KV.delete(countKey);
      await env.AFFILIATE_KV.delete(clicksKey);
      return new Response(JSON.stringify({ ok: true, fallbackCleared: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    } catch (kvErr) {
      return new Response(JSON.stringify({ error: "clear failed", detail: String(err) }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
  }
}
__name(onRequestPost, "onRequestPost");

// admin/products/[barcode]/clicks.ts
async function onRequestGet(context) {
  const { env, request, params } = context;
  const { barcode } = params;
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Missing authorization" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  const token = authHeader.substring(7);
  if (token !== env.ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: "Invalid authorization" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const id = env.AFFILIATE_DO.idFromName(barcode);
    const stub = env.AFFILIATE_DO.get(id);
    const doResponse = await stub.fetch("https://do/stats", {
      method: "GET"
    });
    if (doResponse.ok) {
      const stats = await doResponse.json();
      return new Response(JSON.stringify({ clicks: stats.lastClicks || [] }), {
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch (doError) {
    console.warn("DO unavailable, using KV fallback:", doError);
  }
  try {
    const clicksList = await env.AFFILIATE_KV.list({ prefix: `AFFILIATE:CLICKS:${barcode}:` });
    const clicks = [];
    for (const key of clicksList.keys.slice(0, 20)) {
      const clickData = await env.AFFILIATE_KV.get(key.name);
      if (clickData) {
        clicks.push(JSON.parse(clickData));
      }
    }
    return new Response(JSON.stringify({ clicks, fallback: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Clicks error:", error);
    return new Response(JSON.stringify({ error: "Failed to get clicks" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestGet, "onRequestGet");

// admin/products/[barcode]/edit.ts
async function onRequestGet2(context) {
  const { params, env } = context;
  const { barcode } = params;
  const html = `
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
        const response = await fetch('/admin/products/${barcode}/override', {
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
        await fetch('/admin/products/${barcode}/override', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': token },
          body: JSON.stringify(formData)
        });
        alert('Overrides saved successfully!');
      } catch (error) {
        alert('Failed to save overrides');
      }
    });
  <\/script>
</body>
</html>`;
  return new Response(html, {
    headers: { "Content-Type": "text/html" }
  });
}
__name(onRequestGet2, "onRequestGet");

// admin/products/[barcode]/override.ts
async function onRequestGet3(context) {
  const { params, env, request } = context;
  const { barcode } = params;
  if (!authenticateAdmin(request, env)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const overrideData = await env.OVERRIDES.get(`override:${barcode}`);
    const overrides = overrideData ? JSON.parse(overrideData) : {};
    const mergedData = await env.MERGED_CACHE.get(`merged:${barcode}`);
    const merged = mergedData ? JSON.parse(mergedData) : null;
    const suggestions = await getSuggestions(env, barcode);
    const barcodeCount = await env.AFFILIATE.get(`count:${barcode}`);
    const affiliateStats = { totalClicks: parseInt(barcodeCount || "0") };
    return new Response(JSON.stringify({
      merged,
      overrides,
      suggestions,
      affiliateStats
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Admin get product error:", error);
    return new Response(JSON.stringify({ error: "Failed to get product data" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestGet3, "onRequestGet");
async function onRequestPost2(context) {
  const { params, env, request } = context;
  const { barcode } = params;
  if (!authenticateAdmin(request, env)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const body = await request.json();
    const { name, brand, ingredients, labels, allergens, images } = body;
    const overrides = { name, brand, ingredients, labels, allergens, images };
    await env.OVERRIDES.put(`override:${barcode}`, JSON.stringify(overrides));
    await env.MERGED_CACHE.delete(`merged:${barcode}`);
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Admin save overrides error:", error);
    return new Response(JSON.stringify({ error: "Failed to save overrides" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestPost2, "onRequestPost");
function authenticateAdmin(request, env) {
  const auth = request.headers.get("Authorization");
  return auth === `Bearer ${env.ADMIN_PASSWORD}`;
}
__name(authenticateAdmin, "authenticateAdmin");
async function getSuggestions(env, barcode) {
  const suggestions = [];
  const listResult = await env.SUGGESTIONS.list({ prefix: `suggestions:${barcode}:` });
  for (const key of listResult.keys) {
    const data = await env.SUGGESTIONS.get(key.name);
    if (data) {
      suggestions.push(JSON.parse(data));
    }
  }
  return suggestions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
__name(getSuggestions, "getSuggestions");

// admin/products/[barcode]/stats.ts
async function onRequestGet4(context) {
  const { env, request, params } = context;
  const { barcode } = params;
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Missing authorization" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  const token = authHeader.substring(7);
  if (token !== env.ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: "Invalid authorization" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const id = env.AFFILIATE_DO.idFromName(barcode);
    const stub = env.AFFILIATE_DO.get(id);
    const doResponse = await stub.fetch("https://do/stats", {
      method: "GET"
    });
    if (doResponse.ok) {
      const stats = await doResponse.json();
      return new Response(JSON.stringify(stats), {
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch (doError) {
    console.warn("DO unavailable, using KV fallback:", doError);
  }
  try {
    const countKey = `AFFILIATE:COUNT:${barcode}`;
    const count = parseInt(await env.AFFILIATE_KV.get(countKey) || "0");
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
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Stats error:", error);
    return new Response(JSON.stringify({ error: "Failed to get stats" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestGet4, "onRequestGet");

// api/products/[barcode]/merged.ts
async function onRequestGet5(context) {
  const { params, env, request } = context;
  const { barcode } = params;
  const url = new URL(request.url);
  const forceRefresh = url.searchParams.get("forceRefresh") === "true";
  if (!barcode || !/^\d+$/.test(barcode)) {
    return new Response(JSON.stringify({ error: "Invalid barcode format" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const cacheKey = `merged:${barcode}`;
  if (!forceRefresh) {
    const cached = await env.MERGED_CACHE.get(cacheKey);
    if (cached) {
      return new Response(cached, {
        headers: {
          "Content-Type": "application/json",
          "X-Cache": "HIT"
        }
      });
    }
  }
  try {
    let obfData = null;
    let obfAvailable = false;
    try {
      const obfResponse = await fetch(`${env.OBF_BASE_URL}/api/v2/product/${barcode}`);
      const obfResult = await obfResponse.json();
      if (obfResult.status === 1 && obfResult.product) {
        obfData = obfResult.product;
        obfAvailable = true;
      }
    } catch (error) {
      console.warn("OBF fetch error:", error);
    }
    let ebayOffers = [];
    let ebayAvailable = false;
    let ebayError = null;
    try {
      const token = await getEbayToken(env);
      let items = await searchEbay(token, barcode, true);
      if (items.length === 0 && obfData) {
        const brand = obfData.brands?.split(",")[0]?.trim() || "";
        const productName = obfData.product_name || "";
        const searchQuery = brand && productName ? `${brand} ${productName}` : obfData.product_name || barcode;
        items = await searchEbay(token, searchQuery, false);
      }
      if (items.length > 0) {
        ebayAvailable = true;
        ebayOffers = items.map((item) => ({
          title: item.title,
          price: item.price ? {
            value: item.price.value,
            currency: item.price.currency
          } : null,
          seller: item.seller?.username || "Unknown",
          itemWebUrl: item.itemWebUrl,
          affiliateUrl: env.EBAY_CAMPAIGN_ID ? `${item.itemWebUrl}${item.itemWebUrl.includes("?") ? "&" : "?"}campid=${env.EBAY_CAMPAIGN_ID}` : item.itemWebUrl,
          itemId: item.itemId,
          image: item.image?.imageUrl || null
        }));
      }
    } catch (error) {
      console.error("eBay search error:", error);
      ebayError = error.message;
    }
    const overrideData = await env.OVERRIDES.get(`override:${barcode}`);
    const overrides = overrideData ? JSON.parse(overrideData) : {};
    const merged = {
      id: barcode,
      name: overrides.name || obfData?.product_name || ebayOffers[0]?.title || barcode,
      brand: overrides.brand || obfData?.brands?.split(",")[0]?.trim() || null,
      category: obfData?.categories_tags?.[0]?.replace("en:", "").replace(/-/g, " ") || null,
      images: {
        hero: overrides.images?.[0] || obfData?.image_front_url || ebayOffers[0]?.image || null,
        gallery: overrides.images || [
          obfData?.image_front_url,
          obfData?.image_ingredients_url,
          obfData?.image_nutrition_url,
          ...ebayOffers.slice(0, 3).map((offer) => offer.image)
        ].filter(Boolean).filter((url2, index, arr) => arr.indexOf(url2) === index)
      },
      ingredients: overrides.ingredients || obfData?.ingredients_text || null,
      labels: overrides.labels || obfData?.labels_tags?.map((tag) => tag.replace("en:", "").replace(/-/g, " ")) || [],
      allergens: overrides.allergens || obfData?.allergens_tags?.map((tag) => tag.replace("en:", "").replace(/-/g, " ")) || [],
      offers: {
        primary: ebayOffers[0] || null,
        others: ebayOffers.slice(1, 5)
      },
      overrides: Object.keys(overrides).length > 0 ? Object.keys(overrides) : null,
      source: {
        obf: { available: obfAvailable },
        ebay: {
          available: ebayAvailable,
          ...ebayError && { note: ebayError }
        }
      },
      cachedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const ttl = parseInt(env.MERGED_TTL_SECONDS) || 14400;
    await env.MERGED_CACHE.put(cacheKey, JSON.stringify(merged), { expirationTtl: ttl });
    return new Response(JSON.stringify(merged), {
      headers: {
        "Content-Type": "application/json",
        "X-Cache": "MISS"
      }
    });
  } catch (error) {
    console.error("Merged endpoint error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestGet5, "onRequestGet");
async function getEbayToken(env) {
  const cached = await env.EBAY_TOKEN.get("app_token");
  if (cached) return cached;
  const auth = btoa(`${env.EBAY_CLIENT_ID}:${env.EBAY_CLIENT_SECRET}`);
  const response = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope"
  });
  const data = await response.json();
  if (data.access_token) {
    await env.EBAY_TOKEN.put("app_token", data.access_token, { expirationTtl: data.expires_in - 60 });
    return data.access_token;
  }
  throw new Error("No access token received");
}
__name(getEbayToken, "getEbayToken");
async function searchEbay(token, query, isGtin = false) {
  const baseUrl = "https://api.ebay.com/buy/browse/v1/item_summary/search";
  const params = new URLSearchParams({
    limit: "6",
    ...isGtin ? { gtin: query } : { q: query }
  });
  let retries = 0;
  while (retries < 2) {
    try {
      const response = await fetch(`${baseUrl}?${params}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.status === 429) {
        retries++;
        await new Promise((resolve) => setTimeout(resolve, 500));
        continue;
      }
      const data = await response.json();
      return data.itemSummaries || [];
    } catch (error) {
      retries++;
      if (retries >= 2) throw error;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  throw new Error("Max retries exceeded");
}
__name(searchEbay, "searchEbay");

// api/products/[barcode]/suggestions.ts
async function onRequestPost3(context) {
  const { params, env, request } = context;
  const { barcode } = params;
  if (!barcode || !/^\d+$/.test(barcode)) {
    return new Response(JSON.stringify({ error: "Invalid barcode format" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const body = await request.json();
    const { name, info } = body;
    if (!info?.trim()) {
      return new Response(JSON.stringify({ error: "Info is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const suggestion = {
      name: name || "Anonymous",
      info: info.trim(),
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      ip: request.headers.get("CF-Connecting-IP") || "unknown"
    };
    const key = `suggestions:${barcode}:${Date.now()}`;
    await env.SUGGESTIONS.put(key, JSON.stringify(suggestion));
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Suggestion save error:", error);
    return new Response(JSON.stringify({ error: "Failed to save suggestion" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestPost3, "onRequestPost");

// api/affiliate/click.ts
async function onRequestPost4(context) {
  const { env, request } = context;
  try {
    const body = await request.json();
    const { barcode, offerItemId, affiliateUrl, timestamp } = body;
    if (!barcode || !offerItemId || !affiliateUrl) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";
    try {
      const id = env.AFFILIATE_DO.idFromName(barcode);
      const stub = env.AFFILIATE_DO.get(id);
      const doResponse = await stub.fetch("https://do/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcode, offerItemId, affiliateUrl, timestamp, ip, userAgent })
      });
      if (doResponse.ok) {
        const result = await doResponse.json();
        return new Response(JSON.stringify({ ok: true, newCount: result.newCount }), {
          headers: { "Content-Type": "application/json" }
        });
      }
    } catch (doError) {
      console.warn("DO unavailable, using KV fallback:", doError);
    }
    const clickData = {
      barcode,
      offerItemId,
      affiliateUrl: affiliateUrl.substring(0, 256),
      timestamp: timestamp || (/* @__PURE__ */ new Date()).toISOString(),
      ip,
      userAgent: userAgent.substring(0, 100)
    };
    const clickKey = `AFFILIATE:CLICKS:${barcode}:${Date.now()}`;
    await env.AFFILIATE_KV.put(clickKey, JSON.stringify(clickData));
    const countKey = `AFFILIATE:COUNT:${barcode}`;
    const currentCount = await env.AFFILIATE_KV.get(countKey);
    const newCount = (parseInt(currentCount || "0") + 1).toString();
    await env.AFFILIATE_KV.put(countKey, newCount);
    return new Response(JSON.stringify({ ok: true, newCount: parseInt(newCount), fallback: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Affiliate click tracking error:", error);
    return new Response(JSON.stringify({ error: "Failed to track click" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestPost4, "onRequestPost");

// dev/kv-clear.ts
async function onRequestPost5(context) {
  const { env, request } = context;
  const auth = request.headers.get("authorization") || "";
  const expected = `Bearer ${env.ADMIN_PASSWORD || "ADMIN_PASSWORD_PLACEHOLDER"}`;
  if (auth !== expected) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  const body = await request.json().catch(() => ({}));
  const barcode = body.barcode;
  if (!barcode) return new Response(JSON.stringify({ error: "missing barcode" }), { status: 400 });
  const countKey = `AFFILIATE:COUNT:${barcode}`;
  const clicksKey = `AFFILIATE:CLICKS:${barcode}`;
  await env.AFFILIATE_KV.delete(countKey);
  await env.AFFILIATE_KV.delete(clicksKey);
  return new Response(JSON.stringify({ ok: true, deleted: [countKey, clicksKey] }), { status: 200, headers: { "Content-Type": "application/json" } });
}
__name(onRequestPost5, "onRequestPost");

// api/newsapi.ts
async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const apiKey = env.VITE_NEWSAPI_KEY || env.NEWSAPI_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API key not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  const apiUrl = new URL("https://newsapi.org/v2/top-headlines");
  url.searchParams.forEach((value, key) => {
    if (key !== "apiKey") {
      apiUrl.searchParams.set(key, value);
    }
  });
  apiUrl.searchParams.set("apiKey", apiKey);
  const response = await fetch(apiUrl.toString(), {
    headers: {
      "User-Agent": "HealthBeautyHub/1.0"
    }
  });
  const data = await response.json();
  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json"
    }
  });
}
__name(onRequest, "onRequest");

// api/ninjas.ts
async function onRequest2(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const query = url.searchParams.get("query");
  if (!query) {
    return new Response(JSON.stringify({ error: "Missing query parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const apiKey = env.VITE_API_NINJAS_KEY || env.API_NINJAS_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API key not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  const apiUrl = `https://api.api-ninjas.com/v1/nutrition?query=${encodeURIComponent(query)}`;
  const response = await fetch(apiUrl, {
    headers: {
      "X-Api-Key": apiKey
    }
  });
  const data = await response.json();
  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json"
    }
  });
}
__name(onRequest2, "onRequest");

// _middleware.ts
async function onRequest3(context) {
  const { request, next } = context;
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }
  const response = await next();
  const newHeaders = new Headers(response.headers);
  newHeaders.set("Access-Control-Allow-Origin", "*");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}
__name(onRequest3, "onRequest");

// ../.wrangler/tmp/pages-qnTVrc/functionsRoutes-0.07966222909622234.mjs
var routes = [
  {
    routePath: "/admin/products/:barcode/clear",
    mountPath: "/admin/products/:barcode",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/admin/products/:barcode/clicks",
    mountPath: "/admin/products/:barcode",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/admin/products/:barcode/edit",
    mountPath: "/admin/products/:barcode",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet2]
  },
  {
    routePath: "/admin/products/:barcode/override",
    mountPath: "/admin/products/:barcode",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet3]
  },
  {
    routePath: "/admin/products/:barcode/override",
    mountPath: "/admin/products/:barcode",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  },
  {
    routePath: "/admin/products/:barcode/stats",
    mountPath: "/admin/products/:barcode",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet4]
  },
  {
    routePath: "/api/products/:barcode/merged",
    mountPath: "/api/products/:barcode",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet5]
  },
  {
    routePath: "/api/products/:barcode/suggestions",
    mountPath: "/api/products/:barcode",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost3]
  },
  {
    routePath: "/api/affiliate/click",
    mountPath: "/api/affiliate",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost4]
  },
  {
    routePath: "/dev/kv-clear",
    mountPath: "/dev",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost5]
  },
  {
    routePath: "/api/newsapi",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest]
  },
  {
    routePath: "/api/ninjas",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest2]
  },
  {
    routePath: "/",
    mountPath: "/",
    method: "",
    middlewares: [onRequest3],
    modules: []
  }
];

// ../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../../../AppData/Roaming/npm/node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");

// ../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// ../.wrangler/tmp/bundle-cpIqm5/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;

// ../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// ../.wrangler/tmp/bundle-cpIqm5/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=functionsWorker-0.5427897271858846.mjs.map
