# Cloudflare Pages Deployment Fix

## Problem
NewsAPI and PubMed integrations work in dev but fail in production because:
- Direct browser API calls are blocked by CORS
- Vite dev proxy doesn't exist in production
- API keys would be exposed client-side

## Solution
Created Cloudflare Functions to proxy API calls server-side.

## Setup Steps

### 1. Environment Variables in Cloudflare Pages

Go to your Cloudflare Pages project dashboard:
1. Navigate to **Settings** → **Environment variables**
2. Add these variables for **Production**:
   - `VITE_NEWSAPI_KEY` = `15e89be5f2da4687bc1c0f990e10885b`
   - `VITE_API_NINJAS_KEY` = (your API Ninjas key if you have one)
   - `VITE_READER_ENDPOINT` = `https://hb-reader.sparshrajput088.workers.dev`

3. Add the same variables for **Preview** environment

### 2. Deploy

The `functions/` directory will be automatically detected by Cloudflare Pages:
- `/api/newsapi` → `functions/api/newsapi.ts`
- `/api/ninjas` → `functions/api/ninjas.ts`

Run:
```bash
npm run build
```

Then deploy to Cloudflare Pages (via Git push or manual upload).

### 3. Verify

After deployment:
- Visit your production site
- Check the Health page - articles should load from NewsAPI and PubMed
- Check browser console for any errors
- Verify API calls go to `/api/newsapi` and `/api/ninjas` (not external URLs)

## What Changed

1. **Created Cloudflare Functions** (`functions/api/`)
   - Server-side proxies for NewsAPI and API Ninjas
   - Handles API keys securely
   - Adds CORS headers

2. **Updated apiService.ts**
   - Production now uses `/api/newsapi` instead of direct NewsAPI calls
   - Production now uses `/api/ninjas` instead of direct API Ninjas calls
   - Dev continues using Vite proxy

## Testing Locally

Dev server still works as before:
```bash
npm run dev
```

To test production build locally:
```bash
npm run build
npm run preview
```

Note: Cloudflare Functions only work when deployed to Cloudflare Pages, not in local preview.
