# Cloudflare Architecture & Deployment Documentation

**Project:** Blush and Breathe Production  
**Production URL:** https://jyotilalchandani.pages.dev/  
**Last Updated:** November 18, 2025

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Components](#components)
3. [Deployment Configuration](#deployment-configuration)
4. [API Endpoints](#api-endpoints)
5. [Environment Variables & Secrets](#environment-variables--secrets)
6. [Deployment Process](#deployment-process)
7. [Troubleshooting](#troubleshooting)
8. [Future Maintenance](#future-maintenance)

---

## 🏗️ Architecture Overview

The project uses a **Cloudflare Pages + Workers hybrid architecture**:

```
┌─────────────────────────────────────────────────────────┐
│  FRONTEND (Cloudflare Pages)                            │
│  - Static assets (React/Vite build)                     │
│  - Pages Functions (functions/api/*.js)                 │
│  - URL: jyotilalchandani.pages.dev                      │
└──────────────┬──────────────────────────────────────────┘
               │ Proxies /api/* requests
               ▼
┌─────────────────────────────────────────────────────────┐
│  BACKEND WORKER (Cloudflare Workers)                    │
│  - Main API logic (_worker.js)                          │
│  - Durable Objects (AffiliateCounter)                   │
│  - KV Namespaces (caching & storage)                    │
│  - Worker: jyotilalchandani-backend                     │
│  - URL: jyotilalchandani-backend.sparshrajput088.workers.dev│
└─────────────────────────────────────────────────────────┘
```

### Why This Architecture?

- **Pages** handles static hosting and routing
- **Workers** handles dynamic API logic, Durable Objects, and KV storage
- **Pages Functions** bridges the frontend to backend Worker
- **Separation of concerns** makes maintenance easier

---

## 🔧 Components

### 1. **Cloudflare Pages (jyotilalchandani)**

**File:** `wrangler.toml`

```toml
name = "jyotilalchandani"
compatibility_date = "2024-09-01"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = "dist"

[[kv_namespaces]]
binding = "MERGED_CACHE"
id = "8c4c045cf255490a8b9146ab393bd0e0"

# ... other KV namespaces
```

**Purpose:**
- Serves static React/Vite build
- Routes all `/api/*` requests to backend Worker via Pages Functions
- Builds from `dist/` directory

**Pages Functions:** `functions/api/[[proxy]].js`
- Intercepts all `/api/*` requests
- Forwards them to backend Worker at `jyotilalchandani-backend.sparshrajput088.workers.dev`
- Returns response to client

---

### 2. **Cloudflare Worker (jyotilalchandani-backend)**

**File:** `wrangler.backend.toml`

```toml
name = "jyotilalchandani-backend"
compatibility_date = "2024-09-01"
compatibility_flags = ["nodejs_compat"]
main = "_worker.js"

[[durable_objects.bindings]]
name = "AFFILIATE_DO"
class_name = "AffiliateCounter"

[[migrations]]
tag = "v1"
new_sqlite_classes = ["AffiliateCounter"]

# ... KV namespaces
```

**Worker File:** `_worker.js`

Contains:
- `AffiliateCounter` Durable Object class
- Main `fetch()` handler with routing logic
- API endpoints implementation

---

### 3. **Durable Objects (AffiliateCounter)**

**Purpose:** Track affiliate click counts in real-time with persistent state

**Location:** `_worker.js` (lines 2-62)

**Methods:**
- `_handleClick()` - Increment click counter
- `_handleStats()` - Get click statistics
- `_handleClear()` - Reset counter to 0

**Storage:** SQLite-based persistent storage (Cloudflare managed)

**Migration:**
- Tag: `v1`
- Classes: `AffiliateCounter`
- Automatically created on first deploy

---

### 4. **KV Namespaces**

Five KV namespaces for caching and storage:

| Name | ID | Purpose |
|------|----|-----------| 
| `MERGED_CACHE` | `8c4c045cf255490a8b9146ab393bd0e0` | Product merge cache |
| `EBAY_TOKEN` | `1ea1e1dccdd04b2898f3700fd91a18c9` | eBay API tokens |
| `SUGGESTIONS` | `60392e62d508494b8f509e3ad8f3ddec` | Product suggestions |
| `OVERRIDES` | `4de8728f89104b92911d47ce70f70744` | Product overrides |
| `AFFILIATE_KV` | `63dd4c653efb42eb8b46714e9def97f4` | Affiliate fallback data |

---

## 🔐 Deployment Configuration

### wrangler.toml (Pages Config)

```toml
name = "jyotilalchandani"
compatibility_date = "2024-09-01"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = "dist"

[[kv_namespaces]]
binding = "MERGED_CACHE"
id = "8c4c045cf255490a8b9146ab393bd0e0"
# ... other namespaces
```

**Key Points:**
- NO `main` field (Pages-specific)
- Uses `pages_build_output_dir` to specify static output
- KV namespaces are read-only for Pages Functions
- Pages Functions in `functions/api/` handle routing

### wrangler.backend.toml (Worker Config)

```toml
name = "jyotilalchandani-backend"
compatibility_date = "2024-09-01"
compatibility_flags = ["nodejs_compat"]
main = "_worker.js"

[[durable_objects.bindings]]
name = "AFFILIATE_DO"
class_name = "AffiliateCounter"

[[migrations]]
tag = "v1"
new_sqlite_classes = ["AffiliateCounter"]

[[kv_namespaces]]
binding = "MERGED_CACHE"
id = "8c4c045cf255490a8b9146ab393bd0e0"
# ... other namespaces

[vars]
OBF_BASE_URL = "https://world.openbeautyfacts.org"
# ... other vars
```

**Key Points:**
- Has `main = "_worker.js"` (Worker requirement)
- Includes `[[durable_objects.bindings]]` for DO
- Includes `[[migrations]]` for DO initialization
- For free plan, uses `new_sqlite_classes` (not `new_classes`)

---

## 🔑 Environment Variables & Secrets

### Public Variables (in wrangler.backend.toml)

```toml
[vars]
OBF_BASE_URL = "https://world.openbeautyfacts.org"
MERGED_TTL_SECONDS = "14400"
EBAY_CLIENT_ID = "PLACEHOLDER"
EBAY_CLIENT_SECRET = "PLACEHOLDER"
EBAY_CAMPAIGN_ID = "PLACEHOLDER"
```

### Secrets (in Cloudflare Dashboard or via wrangler CLI)

**Set via:**
```bash
npx wrangler secret put NEWSAPI_KEY --config wrangler.backend.toml
```

**Current Secrets:**
- `NEWSAPI_KEY` - News API authentication key (value: `15e89be5f2da4687bc1c0f990e10885b`)
- `ADMIN_PASSWORD` - Admin API authentication (set via dashboard)

**Accessing Secrets in Code:**
```javascript
const apiKey = env.NEWSAPI_KEY;
const adminPass = env.ADMIN_PASSWORD;
```

---

## 📡 API Endpoints

### Affiliate Tracking

**POST `/api/affiliate/click`**
- Tracks affiliate clicks
- Uses Durable Object for real-time counting
- Fallback: KV storage if DO unavailable
- Response includes `newCount` and fallback status

**GET `/api/admin/products/{barcode}/stats`**
- Requires: `Authorization: Bearer {ADMIN_PASSWORD}`
- Returns click count and recent click details
- Uses Durable Object for primary storage

**POST `/api/admin/products/{barcode}/clear`**
- Requires: `Authorization: Bearer {ADMIN_PASSWORD}`
- Clears click counter for a product
- Returns `{ ok: true, cleared: true }`

### News API Proxy

**GET `/api/newsapi`**
- Proxies requests to NewsAPI.org
- Query params: `category`, `language`, `country`, `page`, `pageSize`
- Uses `NEWSAPI_KEY` secret
- Sets User-Agent header (required by News API)

**Example:**
```
https://jyotilalchandani.pages.dev/api/newsapi?category=health&pageSize=5
```

---

## 🚀 Deployment Process

### Step 1: Build Frontend

```bash
npm run build
```
- Builds React app with Vite
- Output: `dist/` directory
- Includes Pages Functions from `functions/` directory

### Step 2: Deploy Backend Worker

```bash
npx wrangler deploy --config wrangler.backend.toml --env ""
```
- Deploys `_worker.js` with Durable Objects and KV bindings
- Creates DO migrations automatically
- Takes ~10-15 seconds

### Step 3: Deploy Pages

```bash
npx wrangler pages deploy dist --commit-dirty
```
- Deploys static assets to Pages
- Deploys Pages Functions
- Sets up routing to backend Worker
- Takes ~20-30 seconds

### Full Deployment (One Command)

```bash
npm run build && npx wrangler deploy --config wrangler.backend.toml --env "" && npx wrangler pages deploy dist --commit-dirty
```

### Secrets Management

**Set News API Key:**
```bash
echo "YOUR_API_KEY" | npx wrangler secret put NEWSAPI_KEY --config wrangler.backend.toml
```

**Verify Secret is Set:**
```bash
npx wrangler secret list --config wrangler.backend.toml
```

---

## 🔍 How It Works (Request Flow)

### Example: Affiliate Click Tracking

```
1. Frontend (React) → POST /api/affiliate/click
   ↓
2. Pages Function (functions/api/[[proxy]].js)
   ↓
3. Backend Worker (_worker.js)
   ↓
4. Route matches: /api/affiliate/click
   ↓
5. Try Durable Object:
   - Get stub: env.AFFILIATE_DO.idFromName(barcode)
   - Call: stub.fetch('https://do/click', ...)
   - Increment counter in DO storage
   ↓
6. If DO fails, use KV fallback:
   - Store in AFFILIATE_KV
   - Include fallback: true in response
   ↓
7. Response → Frontend with updated count
```

### Example: News Articles

```
1. Frontend → GET /api/newsapi?category=health&pageSize=5
   ↓
2. Pages Function proxies to backend
   ↓
3. Backend Worker (/api/newsapi endpoint)
   - Gets NEWSAPI_KEY from env.NEWSAPI_KEY
   - Makes request to https://newsapi.org/v2/top-headlines
   - Adds User-Agent header
   - Returns JSON response
   ↓
4. Frontend receives real articles (not mock data)
   ↓
5. Frontend caches with localStorage
```

---

## 🛠️ Troubleshooting

### Issue: "Fallback: true" in Production

**Problem:** Durable Objects not connected, using KV fallback

**Solution:**
1. Check DO migration in wrangler.backend.toml:
   ```toml
   [[migrations]]
   tag = "v1"
   new_sqlite_classes = ["AffiliateCounter"]  # ← Correct format for free plan
   ```
2. Verify DO export in _worker.js:
   ```javascript
   export class AffiliateCounter { ... }  // ← Must be exported
   ```
3. Redeploy backend:
   ```bash
   npx wrangler deploy --config wrangler.backend.toml --env ""
   ```

### Issue: News API Returns Error

**Problem:** "News API key not configured" or "401 Unauthorized"

**Solution:**
1. Check secret is set:
   ```bash
   npx wrangler secret list --config wrangler.backend.toml
   ```
2. If missing, add it:
   ```bash
   echo "15e89be5f2da4687bc1c0f990e10885b" | npx wrangler secret put NEWSAPI_KEY --config wrangler.backend.toml
   ```
3. Redeploy worker
4. Test directly:
   ```bash
   curl "https://jyotilalchandani-backend.sparshrajput088.workers.dev/api/newsapi?category=health&pageSize=1"
   ```

### Issue: Pages Deploy Says "ASSETS Binding Reserved"

**Problem:** Cannot use ASSETS binding name in Pages projects

**Solution:**
- Remove `[assets]` section from wrangler.toml
- Pages handles static assets automatically
- Don't try to bind ASSETS in Pages config

### Issue: Durable Object Class Not Found

**Problem:** "Durable Object class not found: AffiliateCounter"

**Solution:**
1. Ensure class is exported in _worker.js:
   ```javascript
   export class AffiliateCounter { ... }
   ```
2. Ensure name matches in wrangler.backend.toml:
   ```toml
   [[durable_objects.bindings]]
   name = "AFFILIATE_DO"
   class_name = "AffiliateCounter"  # ← Must match
   ```
3. Redeploy with migration

---

## 📝 Files Reference

### Critical Files

| File | Purpose | Edit |
|------|---------|------|
| `_worker.js` | Backend Worker logic + DO class | Rarely |
| `wrangler.backend.toml` | Backend Worker config | When adding KV/secrets |
| `wrangler.toml` | Pages config | Rarely |
| `functions/api/[[proxy]].js` | Pages Function router | Rarely |
| `vite.config.ts` | Frontend build config | When changing API routes |
| `.env.production` | Production secrets (DO NOT COMMIT) | Before building |

### Directory Structure

```
/
├── _worker.js                 # Backend Worker code
├── functions/
│   └── api/
│       └── [[proxy]].js       # Pages Function for routing
├── src/                       # Frontend React code
├── services/
│   └── apiService.ts          # Frontend API calls
├── dist/                      # Built frontend (generated)
├── wrangler.toml              # Pages config
├── wrangler.backend.toml      # Worker config
└── CLOUDFLARE_ARCHITECTURE.md # This file
```

---

## 🔄 Maintenance Tasks

### Monthly

- Monitor Durable Object usage in dashboard
- Check KV namespace storage
- Review error logs in Worker dashboard

### Quarterly

- Update News API key if needed
- Test DO failover to KV
- Verify all endpoints are responding

### Before Deployment

- Run `npm run build` locally
- Test Pages Function routing
- Verify Worker endpoints manually
- Check secrets are configured

### Adding New API Endpoint

1. Add route in `_worker.js`:
   ```javascript
   if (path === '/api/myendpoint' && request.method === 'POST') {
     // implementation
   }
   ```
2. Deploy backend: `npx wrangler deploy --config wrangler.backend.toml --env ""`
3. Test endpoint
4. Redeploy Pages if needed

### Adding New Secret

1. Generate/obtain secret value
2. Set via CLI:
   ```bash
   echo "VALUE" | npx wrangler secret put SECRET_NAME --config wrangler.backend.toml
   ```
3. Verify: `npx wrangler secret list --config wrangler.backend.toml`
4. Use in code: `env.SECRET_NAME`
5. Redeploy worker

---

## 📊 Monitoring

### View Logs

**Backend Worker:**
```bash
npx wrangler tail --config wrangler.backend.toml
```

**Pages Function:**
```bash
npx wrangler tail --config wrangler.toml
```

### Check Status

- Pages: https://dash.cloudflare.com/ → Pages → jyotilalchandani
- Worker: https://dash.cloudflare.com/ → Workers → jyotilalchandani-backend
- Durable Object: Dashboard → Workers → jyotilalchandani-backend → Durable Objects

---

## ⚠️ Important Notes

1. **DO NOT commit `.env.production`** - Contains secrets
2. **Free plan limitation**: Must use `new_sqlite_classes` in migrations
3. **User-Agent required**: News API calls need User-Agent header
4. **Pages Functions naming**: `[[proxy]].js` for catch-all routing
5. **Worker URL structure**: `{worker-name}.{account-id}.workers.dev`
6. **KV consistency**: Eventually consistent, not real-time

---

## 🔗 Useful Links

- **Cloudflare Dashboard:** https://dash.cloudflare.com/
- **Pages Project:** https://jyotilalchandani.pages.dev/
- **Worker (direct):** https://jyotilalchandani-backend.sparshrajput088.workers.dev/
- **News API Docs:** https://newsapi.org/docs/
- **Cloudflare Workers Docs:** https://developers.cloudflare.com/workers/
- **Durable Objects Docs:** https://developers.cloudflare.com/durable-objects/
- **Wrangler CLI Docs:** https://developers.cloudflare.com/workers/wrangler/

---

## 📞 Contact & History

**Created:** November 18, 2025  
**Last Modified:** November 18, 2025  
**Owner:** Blush and Breathe Project Team

### Key Changes Made

1. **Nov 18, 2025** - Fixed Durable Objects binding in production
   - Updated `wrangler.backend.toml` with correct DO migration format
   - Separated Pages config from Worker config
   - Created Pages Functions for routing

2. **Nov 18, 2025** - Fixed News API articles
   - Added News API proxy endpoint in backend Worker
   - Configured NEWSAPI_KEY secret
   - Added User-Agent header for News API compatibility

---

**End of Documentation**
