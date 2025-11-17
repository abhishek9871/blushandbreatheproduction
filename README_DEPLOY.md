# Cloudflare Pages + Workers Deployment Guide

## Overview
This guide covers deploying the Beauty product system with eBay integration and affiliate monetization to Cloudflare Pages.

## Prerequisites
- Cloudflare account with Pages and Workers enabled
- eBay Developer account with API credentials
- Node.js 18+ for local development

## 1. Cloudflare KV Setup

Create the following KV namespaces in Cloudflare dashboard:

```bash
# Production namespaces
MERGED_CACHE - for caching merged product data
EBAY_TOKEN - for eBay OAuth tokens
SUGGESTIONS - for user product suggestions
OVERRIDES - for admin product overrides
AFFILIATE - for affiliate click tracking

# Preview namespaces (create separate ones)
MERGED_CACHE_PREVIEW
EBAY_TOKEN_PREVIEW
SUGGESTIONS_PREVIEW
OVERRIDES_PREVIEW
AFFILIATE_PREVIEW
```

## 2. Update wrangler.toml

Replace placeholder IDs in `wrangler.toml` with actual KV namespace IDs:

```toml
[[kv_namespaces]]
binding = "MERGED_CACHE"
id = "your_actual_merged_cache_id"
preview_id = "your_actual_merged_cache_preview_id"
```

## 3. Environment Variables

Set these in Cloudflare Pages dashboard (Settings > Environment Variables):

### Production & Preview:
```
EBAY_CLIENT_ID=your_ebay_client_id
EBAY_CLIENT_SECRET=your_ebay_client_secret
EBAY_CAMPAIGN_ID=your_ebay_campaign_id
ADMIN_PASSWORD=your_secure_admin_password
OBF_BASE_URL=https://world.openbeautyfacts.org
MERGED_TTL_SECONDS=14400
```

## 4. eBay Developer Setup

1. Create eBay Developer account: https://developer.ebay.com/
2. Create application for "Browse API"
3. Get Client ID and Client Secret
4. Optional: Set up eBay Partner Network (EPN) for campaign ID

## 5. Build and Deploy

### Local Development:
```bash
npm install
npm run build
npx wrangler pages dev dist
```

### Production Deployment:
```bash
# Build the project
npm run build

# Deploy to Cloudflare Pages
npx wrangler pages deploy dist

# Or connect GitHub repo for automatic deployments
```

## 6. Verify Deployment

### Test endpoints:
```bash
# Test merged product data
curl https://jyotilalchandani.pages.dev/api/products/3017620422003/merged

# Test suggestions
curl -X POST https://jyotilalchandani.pages.dev/api/products/3017620422003/suggestions \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","info":"Test suggestion"}'

# Test affiliate tracking
curl -X POST https://jyotilalchandani.pages.dev/api/affiliate/click \
  -H "Content-Type: application/json" \
  -d '{"barcode":"3017620422003","offerItemId":"test","affiliateUrl":"https://ebay.com"}'
```

## 7. Admin Access

Access admin interface at:
```
https://jyotilalchandani.pages.dev/admin/products/{barcode}/edit
```

Use the ADMIN_PASSWORD set in environment variables.

## 8. Monitoring

### KV Usage:
- Check Cloudflare dashboard for KV read/write operations
- Monitor cache hit rates via X-Cache headers

### eBay API:
- Monitor rate limits (5000 calls/day for sandbox, higher for production)
- Check token refresh in EBAY_TOKEN namespace

### Affiliate Tracking:
- View click counts in AFFILIATE namespace
- Keys: `count:{barcode}` and `count:offer:{itemId}`

## 9. Troubleshooting

### Common Issues:

1. **KV Namespace Not Found**
   - Verify namespace IDs in wrangler.toml
   - Ensure namespaces exist in Cloudflare dashboard

2. **eBay API Errors**
   - Check EBAY_CLIENT_ID and EBAY_CLIENT_SECRET
   - Verify API credentials are for production (not sandbox)

3. **CORS Issues**
   - Middleware handles CORS automatically
   - Check _middleware.ts is deployed

4. **Cache Issues**
   - Use `?forceRefresh=true` to bypass cache
   - Check TTL settings in environment variables

### Debug Commands:
```bash
# Check KV contents
npx wrangler kv:key list --namespace-id=your_namespace_id

# View specific key
npx wrangler kv:key get "merged:3017620422003" --namespace-id=your_namespace_id

# Clear cache
npx wrangler kv:key delete "merged:3017620422003" --namespace-id=your_namespace_id
```

## 10. Performance Optimization

### Caching Strategy:
- Merged data: 4 hours TTL
- eBay tokens: expires_in - 60 seconds
- Static assets: Cloudflare CDN

### Rate Limiting:
- eBay API: Built-in retry with exponential backoff
- KV operations: No explicit limits needed

## 11. Security

### API Keys:
- All secrets stored in Cloudflare environment variables
- No hardcoded credentials in code

### Admin Access:
- Bearer token authentication
- Password-based access control

### CORS:
- Configured for production domain
- Handles preflight requests

## 12. Scaling Considerations

### KV Limits:
- 100,000 read operations/day (free tier)
- 1,000 write operations/day (free tier)
- Upgrade to Workers Paid for higher limits

### eBay API:
- 5,000 calls/day (free tier)
- Contact eBay for production limits

### Cloudflare Pages:
- 500 builds/month (free tier)
- Unlimited bandwidth and requests

## Support

For issues:
1. Check Cloudflare Pages logs
2. Monitor KV namespace usage
3. Verify eBay API credentials
4. Test endpoints with curl commands above