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
│  • Vercel Edge Functions for AI │  • Cron: Hourly RSS refresh    │
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
│   │   └── api/nutrition/     # Vercel Edge Functions for AI
│   │       ├── generate-diet-plan.ts  # Gemini diet plan generation
│   │       └── regenerate-meal.ts     # Gemini meal regeneration
│   ├── components/            # React components
│   │   └── DietChart/         # Diet plan UI components
│   ├── services/              # API services
│   │   ├── apiService.ts      # Backend API calls
│   │   └── fullArticle.ts     # Article fetching via hb-reader
│   ├── hooks/                 # Custom React hooks
│   │   └── useUserProfile.tsx # Diet plan state & AI calls
│   ├── vercel.json            # Vercel config (Edge Function timeouts)
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

# Frontend (from nextjs-frontend/) - INCLUDE ALL ENV VARS!
npm run build && npx vercel --prod -e YOUTUBE_API_KEY=AIzaSyAhO7HnkzSlfCcNq92ztaRFn492RA6YdSA
```

### ⚠️ CRITICAL: Vercel Environment Variables
When deploying to Vercel, you **MUST** include environment variables in the deploy command:
```bash
npx vercel --prod -e YOUTUBE_API_KEY=<key> -e GEMINI_API_KEY=<key>
```
**If you forget `-e YOUTUBE_API_KEY=...`**, the Videos page will return 500 errors with `"YouTube API key not configured"`.

### AI Diet Plan Architecture
```
User fills profile form (EnhancedProfileSetup.tsx)
        │
        ▼
useUserProfile.tsx calls /api/nutrition/generate-diet-plan
        │
        ▼
Vercel Edge Function (60s timeout) calls Gemini 2.0 Flash API
        │
        ▼
Gemini returns JSON diet plan (weeklyPlan, shoppingList, tips)
        │
        ▼
WeeklyPlanView.tsx displays the plan with dark mode support
```

**Why Vercel Edge for AI?** Cloudflare Workers free plan has 10ms CPU limit. AI calls need 15-45 seconds. Vercel Edge Functions allow 60s timeout.

## Recent Fixes Applied

### 1. Videos Page - YouTube API Integration (Nov 26, 2025)
- **Feature**: Real YouTube videos with Shorts + Full Videos sections, search, infinite scroll
- **API Route**: `nextjs-frontend/pages/api/youtube/videos.ts` (server-side YouTube API calls)
- **API Key**: `YOUTUBE_API_KEY` - **MUST be passed in deploy command** (see Deployment Commands)
- **Key Files**:
  - `nextjs-frontend/pages/videos.tsx` - Main page with mobile/desktop responsive design
  - `nextjs-frontend/components/VideoCard.tsx` - Video card with view counts, channel info
  - `nextjs-frontend/services/apiService.ts` - `getShorts()`, `getLongVideos()`, `searchVideos()`
- **Mobile Optimizations**:
  - Horizontal scroll for categories and shorts (touch swipe)
  - Stacked section headers (title above subtitle)
  - Play buttons always visible on mobile (no hover)
  - Edge-to-edge shorts scroll with snap behavior

### 2. AI Diet Plan with Gemini (Nov 26, 2025)
- **Feature**: Personalized diet plan generation using Google Gemini 2.0 Flash
- **Problem**: Cloudflare Workers free plan has 10ms CPU limit - AI calls timeout
- **Solution**: Hybrid approach - Vercel Edge Functions handle AI (60s timeout)
- **Files**:
  - `nextjs-frontend/pages/api/nutrition/generate-diet-plan.ts` - Main AI endpoint
  - `nextjs-frontend/pages/api/nutrition/regenerate-meal.ts` - Meal regeneration
  - `nextjs-frontend/hooks/useUserProfile.tsx` - Routes AI calls to Vercel API
  - `nextjs-frontend/vercel.json` - Configures 60s/30s timeouts
- **API Key**: `GEMINI_API_KEY` set in Vercel environment variables
- **Model**: `gemini-2.0-flash` with `temperature: 0.3`, `maxOutputTokens: 8192`

### 2. Dark Mode Fix for Diet Plan (Nov 26, 2025)
- **Problem**: Text invisible on dark backgrounds (labels, buttons, headings)
- **Fix**: Added `text-text-light dark:text-text-dark` to all text elements
- **Files**:
  - `nextjs-frontend/components/DietChart/EnhancedProfileSetup.tsx`
  - `nextjs-frontend/components/DietChart/WeeklyPlanView.tsx`
  - `nextjs-frontend/styles/globals.css` - Added `card-dark` color variable

### 3. Health Store Pagination (Nov 26, 2025)
- **Problem**: "Last Page" button caused "No products found" + pagination disappeared
- **Fix**: 
  - Show pagination when `total > 0` OR `page > 1` (allows navigating back from empty pages)
  - Changed "Last Page" → "Skip Forward 10 pages" (capped at page 200 due to eBay API limits)
  - Added page indicator ("Page X")
  - Added warning message for empty pages
- **File**: `nextjs-frontend/pages/health-store/index.tsx` (lines 406-465)

### 2. Product Card Bookmark/Tag Overlap (Nov 26, 2025)
- **Problem**: Bookmark button overlapped with "FOR HEALTH" benefit tag (both top-right)
- **Fix**: Moved bookmark button to `top-2 left-2`, kept benefit tag at `top-2 right-2`
- **File**: `nextjs-frontend/pages/health-store/index.tsx` (lines 371-387)

### 3. Clear Search Button (Nov 26, 2025)
- **Problem**: No way to clear search and return to default product listing
- **Fix**: Added X button inside search input field that:
  - Appears when user types or has active search query (`?q=...`)
  - Clears input state AND removes `q` param from URL
  - Wrapped input + clear button in relative container for proper positioning
- **File**: `nextjs-frontend/pages/health-store/index.tsx` (lines 169-176, 231-250)

### 4. Navigation Link Highlighting (Nov 25, 2025)
- **Problem**: `/health` link highlighted when on `/health-store`
- **Fix**: Changed `isActive` to use exact match OR `path + '/'` prefix
- **File**: `nextjs-frontend/components/Header.tsx` (line 21-25)

### 5. RSS Feed Description Truncation
- **Problem**: Descriptions were cut off at 400 characters
- **Fix**: Removed `.substring(0, 400)` in `_worker.js`

### 6. Dark/Light Mode Toggle
- **Problem**: Tailwind v4 defaults to media-query dark mode
- **Fix**: Added `@custom-variant dark (&:where(.dark, .dark *));`
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
*Last updated: November 26, 2025 (Added Videos page with YouTube API + mobile optimizations)*
