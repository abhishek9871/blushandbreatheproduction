# Troubleshooting Guide - Cloudflare Setup

Detailed solutions for common issues encountered with this architecture.

---

## 🔴 Critical Issues

### Issue 1: "Fallback: true" in Affiliate Endpoint Response

**Symptom:**
```json
{
  "ok": true,
  "newCount": 1,
  "fallback": true
}
```

**Cause:** Durable Objects not properly bound or initialized. System is falling back to KV storage.

**Solution:**

**Step 1:** Verify migration format in `wrangler.backend.toml`
```toml
[[migrations]]
tag = "v1"
new_sqlite_classes = ["AffiliateCounter"]  # ← Correct for free plan
# NOT: new_classes = ["AffiliateCounter"]  # ← Wrong, causes DO to be unbound
```

**Step 2:** Verify DO class is exported in `_worker.js`
```javascript
// Line 2-62 of _worker.js
export class AffiliateCounter {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }
  // ... methods
}
```

**Step 3:** Check DO binding in wrangler.backend.toml
```toml
[[durable_objects.bindings]]
name = "AFFILIATE_DO"
class_name = "AffiliateCounter"  # ← Must match class name exactly
```

**Step 4:** Redeploy
```bash
npx wrangler deploy --config wrangler.backend.toml --env ""
```

**Step 5:** Verify in Cloudflare dashboard
- Go to: Workers → jyotilalchandani-backend → Settings
- Check "Bindings" section shows: `env.AFFILIATE_DO (AffiliateCounter) Durable Object`

**Step 6:** Test endpoint
```bash
curl -X POST https://jyotilalchandani.pages.dev/api/affiliate/click \
  -H "Content-Type: application/json" \
  -d '{"barcode":"TESTDO","offerItemId":"1","affiliateUrl":"https://test.com"}'

# Response should NOT contain "fallback": true
# Should show: {"ok":true,"newCount":1}
```

---

### Issue 2: Articles Show Mock Data Instead of Real News

**Symptom:** Health page shows hardcoded articles, not real news

**Cause:** `/api/newsapi` endpoint not working or NEWSAPI_KEY not configured

**Solution:**

**Step 1:** Test the endpoint directly
```bash
curl "https://jyotilalchandani.pages.dev/api/newsapi?category=health&pageSize=1"

# Success response:
# {"status":"ok","totalResults":68,"articles":[...]}

# Error response:
# {"status":"error","message":"News API key not configured"}
# OR
# {"status":"error","message":"Error: NewsAPI error: 400 - ..."}
```

**Step 2:** Check if secret is configured
```bash
npx wrangler secret list --config wrangler.backend.toml

# Should show:
# [
#   {
#     "name": "NEWSAPI_KEY",
#     "type": "secret_text"
#   }
# ]
```

**Step 3:** If secret missing, add it
```bash
# Get the key from .env.production or your password manager
echo "15e89be5f2da4687bc1c0f990e10885b" | npx wrangler secret put NEWSAPI_KEY --config wrangler.backend.toml
```

**Step 4:** Verify endpoint code in `_worker.js`
```javascript
// Should have this around line 285:
if (path === '/api/newsapi' && request.method === 'GET') {
  const apiKey = env.NEWSAPI_KEY || env.VITE_NEWSAPI_KEY;
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
  // ...
}
```

**Step 5:** Redeploy backend
```bash
npx wrangler deploy --config wrangler.backend.toml --env ""
```

**Step 6:** Test again
```bash
curl "https://jyotilalchandani-backend.sparshrajput088.workers.dev/api/newsapi?category=health&pageSize=1" | jq '.articles[0].title'

# Should output real article title, not error
```

**Step 7:** If still failing, check logs
```bash
npx wrangler tail --config wrangler.backend.toml
# Perform request and watch logs for errors
```

---

### Issue 3: "ASSETS Binding Reserved" Error on Pages Deploy

**Symptom:**
```
X [ERROR] Processing wrangler.toml configuration:
    - The name 'ASSETS' is reserved in Pages projects. Please use a different name for your Assets binding.
```

**Cause:** wrangler.toml has `[assets]` section, which conflicts with Pages built-in asset handling

**Solution:**

**Step 1:** Open `wrangler.toml`

**Step 2:** Remove or comment out this section:
```toml
# ❌ DELETE THIS:
# [assets]
# directory = "dist"
# binding = "ASSETS"

# ✅ Pages handles assets automatically
```

**Step 3:** Redeploy Pages
```bash
npx wrangler pages deploy dist --commit-dirty
```

---

### Issue 4: Pages Function Not Routing to Backend

**Symptom:** API calls return 404, or route to Pages instead of Worker

**Cause:** Pages Functions not configured correctly or `functions/api/[[proxy]].js` missing

**Solution:**

**Step 1:** Verify Pages Function exists
```bash
# Check file exists
ls -la functions/api/[[proxy]].js

# Should exist and contain:
# export async function onRequest(context) {
#   const { request } = context;
#   const url = new URL(request.url);
#   const path = url.pathname;
#   
#   const backendUrl = `https://jyotilalchandani-backend.sparshrajput088.workers.dev${path}${url.search}`;
#   
#   const backendRequest = new Request(backendUrl, {
#     method: request.method,
#     headers: request.headers,
#     body: request.method !== 'GET' ? request.body : undefined
#   });
#   
#   try {
#     return await fetch(backendRequest);
#   } catch (err) {
#     return new Response(JSON.stringify({ error: 'Backend unavailable' }), {
#       status: 503,
#       headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
#     });
#   }
# }
```

**Step 2:** Verify wrangler.toml doesn't have "main"
```toml
# ❌ Pages shouldn't have main:
# main = "_worker.js"

# ✅ Correct for Pages:
pages_build_output_dir = "dist"
```

**Step 3:** Rebuild and redeploy
```bash
npm run build
npx wrangler pages deploy dist --commit-dirty
```

**Step 4:** Test routing
```bash
# Test that /api/* routes to backend
curl "https://jyotilalchandani.pages.dev/api/newsapi?category=health&pageSize=1" | jq '.status'

# Should output: "ok"
```

---

## 🟡 Deployment Issues

### Issue 5: Worker Deployment Hangs or Timeout

**Symptom:** `npx wrangler deploy` takes >30 seconds or times out

**Cause:** Large file size, network issue, or Cloudflare API slow

**Solution:**

**Step 1:** Check file size
```bash
ls -lh _worker.js
# Should be < 1 MB

# If larger, check for bundled dependencies
```

**Step 2:** Try with explicit env flag
```bash
npx wrangler deploy --config wrangler.backend.toml --env "" --verbose
```

**Step 3:** Check internet connection
```bash
ping -c 3 api.cloudflare.com
```

**Step 4:** Try again after waiting 5 minutes
```bash
sleep 300 && npx wrangler deploy --config wrangler.backend.toml --env ""
```

---

### Issue 6: "Worker Already Exists" Error

**Symptom:**
```
X [ERROR] A request to the Cloudflare API (/accounts/.../workers/scripts/jyotilalchandani-backend) failed.
```

**Cause:** Worker name already deployed, trying to deploy with conflict

**Solution:**

**Step 1:** Check if worker exists in dashboard
- Go to: https://dash.cloudflare.com/ → Workers

**Step 2:** If exists, redeploy to update
```bash
npx wrangler deploy --config wrangler.backend.toml --env "" --name jyotilalchandani-backend
```

**Step 3:** If doesn't exist, check account/project name
```bash
npx wrangler whoami
# Should show: Account Name and ID
```

**Step 4:** Verify wrangler.backend.toml has correct name
```toml
name = "jyotilalchandani-backend"  # ← Verify this
```

---

## 🟢 Runtime Issues

### Issue 7: Durable Object Has Stale Data

**Symptom:** Click counter shows old value, doesn't increment properly

**Cause:** DO state not syncing or transient error in previous request

**Solution:**

**Step 1:** Check DO state in dashboard
- Go to: Workers → jyotilalchandani-backend → Durable Objects
- Look for instances with wrong data

**Step 2:** Clear data for testing
```bash
# Use the clear endpoint
curl -X POST "https://jyotilalchandani.pages.dev/api/admin/products/TESTKEY/clear" \
  -H "Authorization: Bearer admin123"
```

**Step 3:** Verify with fresh request
```bash
# Check stats
curl "https://jyotilalchandani.pages.dev/api/admin/products/TESTKEY/stats" \
  -H "Authorization: Bearer admin123"

# Should show: {"count":0,"lastClicks":[]}
```

**Step 4:** If still wrong, restart DO
- Go to dashboard → Workers → jyotilalchandani-backend → Durable Objects
- Find the instance
- Click it and look for reset/restart option
- Or redeploy the worker to reset all instances

---

### Issue 8: KV Fallback Being Used (Affiliate Clicks)

**Symptom:** 
- Affiliate clicks working but response includes `"fallback": true`
- Click data stored in AFFILIATE_KV instead of DO

**Cause:** Durable Objects throwing error or unavailable

**Solution:**

**Step 1:** Check worker logs
```bash
npx wrangler tail --config wrangler.backend.toml
# Make a click request and watch logs for DO errors
```

**Step 2:** Look for errors like:
```
DO unavailable, using KV fallback: Error: ...
```

**Step 3:** Identify the DO error (check logs)

**Step 4:** Common DO errors:
- `DO class not found` → Check export in _worker.js
- `DO not bound` → Check wrangler.backend.toml migration
- `DO storage error` → Might be temporary, redeploy

**Step 5:** Redeploy to fix
```bash
npx wrangler deploy --config wrangler.backend.toml --env ""
```

---

## 🔵 Configuration Issues

### Issue 9: Environment Variables Not Found

**Symptom:** 
```
Error: env.NEWSAPI_KEY is undefined
OR
Error: env.ADMIN_PASSWORD is not configured
```

**Cause:** Environment variable not defined in wrangler config or set as secret

**Solution:**

**Step 1:** Check what's configured
```bash
# For secrets
npx wrangler secret list --config wrangler.backend.toml

# For vars (shown in deploy output)
npx wrangler deploy --config wrangler.backend.toml --env "" --dry-run
```

**Step 2:** For SECRETS, add via CLI
```bash
echo "YOUR_SECRET_VALUE" | npx wrangler secret put SECRET_NAME --config wrangler.backend.toml
```

**Step 3:** For PUBLIC VARS, add to wrangler.backend.toml
```toml
[vars]
MY_PUBLIC_VAR = "value"
OBF_BASE_URL = "https://world.openbeautyfacts.org"
```

**Step 4:** Redeploy
```bash
npx wrangler deploy --config wrangler.backend.toml --env ""
```

**Step 5:** Verify in deploy output
```
Your Worker has access to the following bindings:
env.SECRET_NAME (secret)
env.MY_PUBLIC_VAR ("value")
```

---

### Issue 10: Multiple Environments Conflict

**Symptom:**
```
⚠️ [WARNING] Multiple environments are defined in the Wrangler configuration file, 
but no target environment was specified for the deploy command.
```

**Cause:** wrangler.backend.toml has both default and [env.production] sections

**Solution:**

**Option 1:** Deploy with explicit env
```bash
npx wrangler deploy --config wrangler.backend.toml --env ""  # Default env
npx wrangler deploy --config wrangler.backend.toml --env production  # Production env
```

**Option 2:** Remove conflicting env section in wrangler.backend.toml
```toml
# Keep only [vars] at top level
[vars]
VAR = "value"

# Remove or keep [env.production] as needed
# [env.production.vars]
# VAR = "value"
```

---

## 🟣 Network & DNS Issues

### Issue 11: "Failed to Fetch" in Production

**Symptom:** API calls from frontend fail with generic "Failed to fetch"

**Cause:** CORS, network error, or backend unreachable

**Solution:**

**Step 1:** Test backend is up
```bash
curl -I https://jyotilalchandani-backend.sparshrajput088.workers.dev/
# Should return 404 (no route), not connection error
```

**Step 2:** Check Pages Function working
```bash
curl -I https://jyotilalchandani.pages.dev/api/newsapi
# Should proxy to backend
```

**Step 3:** Check CORS headers
```bash
curl -I https://jyotilalchandani.pages.dev/api/affiliate/click
# Should show: Access-Control-Allow-Origin: *
```

**Step 4:** Check backend worker logs
```bash
npx wrangler tail --config wrangler.backend.toml
# Perform request from browser and check for errors
```

**Step 5:** Verify DNS
```bash
nslookup jyotilalchandani-backend.sparshrajput088.workers.dev
# Should resolve to Cloudflare IP
```

---

## 📋 Debug Checklist

When something breaks, run through this:

- [ ] Test endpoint directly with curl
- [ ] Check worker logs: `npx wrangler tail --config wrangler.backend.toml`
- [ ] Verify secrets: `npx wrangler secret list --config wrangler.backend.toml`
- [ ] Check Cloudflare dashboard status
- [ ] Verify wrangler.backend.toml and wrangler.toml configs
- [ ] Look at recent deployments in dashboard
- [ ] Check if Pages Function is returning 5xx
- [ ] Check if backend Worker is returning error
- [ ] Verify CORS headers in response
- [ ] Confirm environment variables are set
- [ ] Check file sizes aren't too large
- [ ] Try redeploy: `npm run build && npx wrangler deploy --config wrangler.backend.toml --env "" && npx wrangler pages deploy dist --commit-dirty`

---

## 🆘 When All Else Fails

1. **Clear browser cache**
   ```bash
   # Hard refresh in browser
   Ctrl + Shift + Delete  # or Cmd + Shift + Delete on Mac
   ```

2. **Rollback to previous version**
   - Go to Cloudflare dashboard → Workers → Deployments
   - Click previous version
   - Click "Rollback"

3. **Check status page**
   - https://www.cloudflarestatus.com/

4. **Reach out to Cloudflare support**
   - Include: Error message, curl output, wrangler version output
   ```bash
   npx wrangler --version
   ```

---

**Last Updated:** November 18, 2025  
**For More Help:** See CLOUDFLARE_ARCHITECTURE.md
