# Cloudflare Deployment Cheatsheet

Quick reference for common deployment tasks.

---

## 🚀 Full Deployment (Complete Flow)

```bash
# 1. Build frontend
npm run build

# 2. Deploy backend Worker (with Durable Objects)
npx wrangler deploy --config wrangler.backend.toml --env ""

# 3. Deploy Pages (static + functions)
npx wrangler pages deploy dist --commit-dirty
```

**Total Time:** ~1-2 minutes

---

## 🔧 Individual Deployments

### Deploy Only Frontend (Pages)
```bash
npm run build && npx wrangler pages deploy dist --commit-dirty
```

### Deploy Only Backend (Worker)
```bash
npx wrangler deploy --config wrangler.backend.toml --env ""
```

### Deploy with Specific Environment
```bash
npx wrangler deploy --config wrangler.backend.toml --env production
```

---

## 🔐 Secrets Management

### Add/Update Secret
```bash
echo "YOUR_SECRET_VALUE" | npx wrangler secret put SECRET_NAME --config wrangler.backend.toml
```

### List All Secrets
```bash
npx wrangler secret list --config wrangler.backend.toml
```

### Example: News API Key
```bash
echo "15e89be5f2da4687bc1c0f990e10885b" | npx wrangler secret put NEWSAPI_KEY --config wrangler.backend.toml
```

---

## 🧪 Testing Endpoints

### Test News API Endpoint
```bash
curl "https://jyotilalchandani.pages.dev/api/newsapi?category=health&pageSize=2"
```

### Test Backend Worker Directly
```bash
curl "https://jyotilalchandani-backend.sparshrajput088.workers.dev/api/newsapi?category=health&pageSize=1"
```

### Test Affiliate Click Tracking
```bash
curl -X POST https://jyotilalchandani.pages.dev/api/affiliate/click \
  -H "Content-Type: application/json" \
  -d '{
    "barcode": "TEST123",
    "offerItemId": "item1",
    "affiliateUrl": "https://example.com"
  }'
```

### Test Admin Stats
```bash
curl "https://jyotilalchandani.pages.dev/api/admin/products/TEST123/stats" \
  -H "Authorization: Bearer admin123"
```

### Test Admin Clear
```bash
curl -X POST "https://jyotilalchandani.pages.dev/api/admin/products/TEST123/clear" \
  -H "Authorization: Bearer admin123"
```

---

## 📊 Monitoring & Logs

### View Worker Logs (Real-time)
```bash
npx wrangler tail --config wrangler.backend.toml
```

### View Pages Logs
```bash
npx wrangler tail --config wrangler.toml
```

### Check Worker Status
- Go to: https://dash.cloudflare.com/ → Workers & Pages → jyotilalchandani-backend

### Check Pages Status
- Go to: https://dash.cloudflare.com/ → Pages → jyotilalchandani

---

## 🔄 Common Fixes

### Fix: Durable Objects Not Active (Fallback: true)

```bash
# 1. Verify wrangler.backend.toml has correct migration:
#    [[migrations]]
#    tag = "v1"
#    new_sqlite_classes = ["AffiliateCounter"]

# 2. Redeploy backend
npx wrangler deploy --config wrangler.backend.toml --env ""

# 3. Test (should NOT have "fallback": true in response)
curl -X POST https://jyotilalchandani.pages.dev/api/affiliate/click \
  -H "Content-Type: application/json" \
  -d '{"barcode":"TEST","offerItemId":"1","affiliateUrl":"https://test.com"}'
```

### Fix: News API Returning Error

```bash
# 1. Check if secret is set
npx wrangler secret list --config wrangler.backend.toml

# 2. If not set, add it
echo "15e89be5f2da4687bc1c0f990e10885b" | npx wrangler secret put NEWSAPI_KEY --config wrangler.backend.toml

# 3. Redeploy
npx wrangler deploy --config wrangler.backend.toml --env ""

# 4. Test
curl "https://jyotilalchandani.pages.dev/api/newsapi?category=health&pageSize=1"
```

### Fix: Pages Deploy Failed

```bash
# 1. Check wrangler.toml doesn't have "main" field
# 2. Check pages_build_output_dir = "dist"
# 3. Rebuild and redeploy
npm run build
npx wrangler pages deploy dist --commit-dirty
```

---

## 📋 Pre-Deployment Checklist

- [ ] Run `npm run build` successfully
- [ ] No errors in build output
- [ ] `.env.production` file exists (contains secrets)
- [ ] Secrets configured: `npx wrangler secret list --config wrangler.backend.toml`
- [ ] Backend routes look correct in `_worker.js`
- [ ] Pages Functions exist: `functions/api/[[proxy]].js`
- [ ] wrangler.backend.toml has DO migration
- [ ] wrangler.toml doesn't have "main" field

---

## 🔗 URLs to Know

| Purpose | URL |
|---------|-----|
| **Production Site** | https://jyotilalchandani.pages.dev/ |
| **Backend Worker (Direct)** | https://jyotilalchandani-backend.sparshrajput088.workers.dev/ |
| **Cloudflare Dashboard** | https://dash.cloudflare.com/ |
| **Pages Project Dashboard** | https://dash.cloudflare.com/?to=/:account/pages/view/jyotilalchandani |
| **Worker Dashboard** | https://dash.cloudflare.com/?to=/:account/workers/view/jyotilalchandani-backend |

---

## 🚨 Emergency: Rollback Previous Deployment

If deployment breaks production:

1. **Check what was deployed recently:**
   ```bash
   # View recent worker versions
   npx wrangler deployments list --config wrangler.backend.toml
   ```

2. **Rollback to previous version (via dashboard):**
   - Go to Worker dashboard
   - Click "Deployments" 
   - Click previous version
   - Click "Rollback"

3. **For Pages, redeploy previous build:**
   ```bash
   npm run build
   npx wrangler pages deploy dist --commit-dirty
   ```

---

## 💡 Pro Tips

1. **Always test locally before deploying**
   ```bash
   npm run dev  # Local dev server on :3001
   ```

2. **Use commit-dirty flag for development**
   ```bash
   npx wrangler pages deploy dist --commit-dirty
   ```

3. **View formatted logs**
   ```bash
   npx wrangler tail --config wrangler.backend.toml --format json | jq .
   ```

4. **Keep old secrets for rotation**
   - Don't delete old API keys immediately
   - Update in code first
   - Test thoroughly
   - Then delete old secret

5. **Monitor KV usage**
   - KV has free tier limits
   - Check dashboard for usage
   - Consider cleanup if getting close to limits

---

## 📞 Quick Help

**Question:** "How do I add a new API endpoint?"  
**Answer:** Edit `_worker.js`, add route handler, redeploy backend worker

**Question:** "Why are articles showing mock data?"  
**Answer:** News API key missing or `/api/newsapi` endpoint broken. Test endpoint with curl.

**Question:** "Affiliate clicks not incrementing?"  
**Answer:** Durable Object not connected. Check logs and redeploy backend.

**Question:** "Can I edit wrangler.toml without redeploying?"  
**Answer:** No, config changes require redeploy. Run full deployment cycle.

**Question:** "How long until changes go live?"  
**Answer:** ~30-60 seconds after deploy command succeeds.

---

**Last Updated:** November 18, 2025
