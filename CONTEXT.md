# Blush & Breathe Production - Project Context

> **Purpose**: This file provides essential context for AI assistants working on this codebase. Read this first before making changes.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRODUCTION SETUP                          │
├─────────────────────────────────────────────────────────────────┤
│  FRONTEND (Vercel)              │  BACKEND (Cloudflare Workers)  │
│  ─────────────────────          │  ────────────────────────────  │
│  • Next.js 16 (Pages Router)    │  • jyotilalchandani-backend    │
│  • Deployed on Vercel           │  • _worker.js (main entry)     │
│  • ISR with 1hr revalidation    │  • wrangler.backend.toml       │
│  • URL: blushandbreath          │  • KV: MERGED_CACHE            │
│    production.vercel.app        │  • Durable Objects: Affiliate  │
│                                 │  • Cron: Hourly RSS refresh    │
├─────────────────────────────────┴─────────────────────────────────┤
│  ARTICLE READER (Cloudflare Worker)                              │
│  • hb-reader worker (cloudflare-worker/src/index.ts)             │
│  • Uses Mozilla Readability for clean article extraction         │
│  • URL: hb-reader.sparshrajput088.workers.dev                    │
│  • Endpoint: /read?url=<article_url>                             │
└─────────────────────────────────────────────────────────────────┘
```

## Migration Summary

| Aspect | Previous (Cloudflare Pages) | Current (Vercel) |
|--------|----------------------------|------------------|
| Frontend | React SPA with HashRouter | Next.js with SSR/ISR |
| Routing | `/#/path` | `/path` (clean URLs) |
| SEO | Client-side only | Server-rendered meta tags |
| Config | `wrangler.toml` | `vercel.json` (if needed) |
| Deploy | `wrangler pages deploy` | `npx vercel --prod` |

**Why Vercel?** Better SEO support via SSR, cleaner URLs, simpler deployment for Next.js.

## Directory Structure

```
blushandbreatheproduction/
├── _worker.js                 # Main backend worker (Cloudflare)
├── wrangler.backend.toml      # Backend worker config
├── cloudflare-worker/         # hb-reader (Mozilla Readability)
│   └── src/index.ts           # Article extraction worker
├── nextjs-frontend/           # NEW: Next.js frontend
│   ├── pages/                 # Next.js pages (SSR/ISR)
│   ├── components/            # React components
│   ├── services/              # API services
│   │   ├── apiService.ts      # Backend API calls
│   │   └── fullArticle.ts     # Article fetching via hb-reader
│   ├── hooks/                 # Custom React hooks
│   └── styles/globals.css     # Tailwind CSS styles
├── src/                       # OLD: React SPA (reference only)
├── pages/                     # OLD: React pages (reference only)
└── services/                  # OLD: React services (reference only)
```

## Key Technical Details

### Backend API Base URL
```
https://jyotilalchandani-backend.sparshrajput088.workers.dev
```

### Environment Variables (Next.js)
```env
NEXT_PUBLIC_API_URL=https://jyotilalchandani-backend.sparshrajput088.workers.dev
NEXT_PUBLIC_READER_ENDPOINT=https://hb-reader.sparshrajput088.workers.dev
```

### Deployment Commands
```bash
# Backend Worker
npx wrangler deploy --config wrangler.backend.toml --env ""

# Refresh RSS Cache (after backend changes)
curl -X POST "https://jyotilalchandani-backend.sparshrajput088.workers.dev/api/admin/refresh-news" \
  -H "Authorization: Bearer admin123"

# Frontend (from nextjs-frontend/)
npm run build && npx vercel --prod
```

## Recent Fixes Applied

### 1. RSS Feed Description Truncation
- **Problem**: Descriptions were cut off at 400 characters
- **Fix**: `_worker.js` line 163 - removed `.substring(0, 400)`
- **File**: `_worker.js`

### 2. Full Article Content (BBC/Science Daily)
- **Problem**: RSS feeds don't include full article content
- **Fix**: Client-side fetching via hb-reader worker (Mozilla Readability)
- **File**: `nextjs-frontend/services/fullArticle.ts`

### 3. Dark/Light Mode Toggle
- **Problem**: Tailwind v4 defaults to media-query dark mode
- **Fix**: Added `@custom-variant dark (&:where(.dark, .dark *));` to globals.css
- **File**: `nextjs-frontend/styles/globals.css`

## Data Flow

```
User visits article page
        │
        ▼
Next.js getStaticProps fetches from backend API
        │
        ▼
Backend returns article with description (from RSS cache)
        │
        ▼
Page renders with description, shows loading state
        │
        ▼
Client-side useEffect calls hb-reader worker
        │
        ▼
hb-reader uses Mozilla Readability to extract full content
        │
        ▼
Full article HTML replaces loading state
```

## Important Notes

1. **Don't modify old React files** (`src/`, `pages/` at root, `services/` at root) - they're reference only
2. **All new frontend work** goes in `nextjs-frontend/`
3. **Backend cache** refreshes hourly via cron, or manually via admin endpoint
4. **ISR revalidation** is 1 hour - redeploy with `--force` for immediate updates
5. **The old Cloudflare Pages site** (`jyotilalchandani.pages.dev`) still works and uses the same backend

## Common Tasks

### Add a new page
1. Create file in `nextjs-frontend/pages/`
2. Use `getStaticProps` for data fetching
3. Set appropriate `revalidate` period

### Modify RSS parsing
1. Edit `_worker.js` (search for `parseRSSFeed` or `fetchRSSFeeds`)
2. Deploy: `npx wrangler deploy --config wrangler.backend.toml --env ""`
3. Refresh cache via admin endpoint

### Fix article rendering
1. Check `nextjs-frontend/services/fullArticle.ts` for client-side fetching
2. Check `cloudflare-worker/src/index.ts` for Readability extraction
3. Check `nextjs-frontend/pages/article/[id].tsx` for display logic

---
*Last updated: November 25, 2025*
