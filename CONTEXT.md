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
├── wrangler.backend.toml      # Backend worker config
├── cloudflare-worker/         # hb-reader (Mozilla Readability)
│   └── src/index.ts           # Article extraction worker
├── pages/                     # Next.js pages (SSR/ISR)
│   ├── api/                   # API routes
│   │   ├── nutrition/         # Vercel Edge Functions for AI
│   │   │   ├── generate-diet-plan.ts  # Gemini diet plan generation
│   │   │   └── regenerate-meal.ts     # Gemini meal regeneration
│   │   └── youtube/videos.ts  # YouTube API proxy
│   ├── index.tsx              # Homepage
│   ├── nutrition.tsx          # Nutrition page
│   ├── videos.tsx             # Videos page
│   └── ...                    # Other pages
├── components/                # React components
│   └── DietChart/             # Diet plan UI components
├── services/                  # API services
│   ├── apiService.ts          # Backend API calls
│   └── fullArticle.ts         # Article fetching via hb-reader
├── hooks/                     # Custom React hooks
│   └── useUserProfile.tsx     # Diet plan state & AI calls
├── styles/globals.css         # Tailwind CSS styles
├── public/                    # Static assets
├── vercel.json                # Vercel config (Edge Function timeouts)
├── next.config.ts             # Next.js configuration
├── package.json               # Dependencies
└── tsconfig.json              # TypeScript config
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

# Frontend (from root folder)
npm run build && npx vercel --prod
```

### ✅ Vercel Environment Variables (Already Configured)
The following environment variables are **permanently set** in Vercel project settings:
- `YOUTUBE_API_KEY` - For Videos page YouTube API integration
- `GEMINI_API_KEY` - For AI Diet Plan generation

**No need to pass `-e` flags during deployment.** If you need to update them, use:
```bash
npx vercel env add <VAR_NAME> production
```

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
- **API Route**: `pages/api/youtube/videos.ts` (server-side YouTube API calls)
- **API Key**: `YOUTUBE_API_KEY` - Permanently set in Vercel environment variables
- **Key Files**:
  - `pages/videos.tsx` - Main page with mobile/desktop responsive design
  - `components/VideoCard.tsx` - Video card with view counts, channel info
  - `services/apiService.ts` - `getShorts()`, `getLongVideos()`, `searchVideos()`
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
  - `pages/api/nutrition/generate-diet-plan.ts` - Main AI endpoint
  - `pages/api/nutrition/regenerate-meal.ts` - Meal regeneration
  - `hooks/useUserProfile.tsx` - Routes AI calls to Vercel API
  - `vercel.json` - Configures 60s/30s timeouts
- **API Key**: `GEMINI_API_KEY` set in Vercel environment variables
- **Model**: `gemini-2.0-flash` with `temperature: 0.3`, `maxOutputTokens: 8192`

### 3. Nutrition Page Mobile Optimization (Nov 26, 2025)
- **Feature**: Full mobile optimization for the Nutrition page and AI Diet Generator
- **Fixes**:
  - Step indicator: Smaller circles (`w-8 h-8`) and tighter margins on mobile
  - Footer buttons: Shorter text ("Calculate" vs "Calculate My Targets") on mobile
  - Search notification banner: Stacked layout, full-width button on mobile
  - NutritionTargetsDisplay: Responsive macro circles, stacked action buttons
  - Final Preferences: Fixed button overflow (Cooking Time "Moderate" button)
  - Hero badges: Compact text ("USDA Data", "AI Plans") on mobile
- **Key Files**:
  - `components/DietChart/EnhancedProfileSetup.tsx`
  - `components/DietChart/DietChartGenerator.tsx`
  - `components/DietChart/NutritionTargetsDisplay.tsx`
  - `components/NutritionHero.tsx`
  - `pages/nutrition.tsx`

### 4. Dark Mode Fix for Diet Plan (Nov 26, 2025)
- **Problem**: Text invisible on dark backgrounds (labels, buttons, headings)
- **Fix**: Added `text-text-light dark:text-text-dark` to all text elements
- **Files**:
  - `components/DietChart/EnhancedProfileSetup.tsx`
  - `components/DietChart/WeeklyPlanView.tsx`
  - `styles/globals.css` - Added `card-dark` color variable

### 5. Health Store Pagination (Nov 26, 2025)
- **Problem**: "Last Page" button caused "No products found" + pagination disappeared
- **Fix**: 
  - Show pagination when `total > 0` OR `page > 1` (allows navigating back from empty pages)
  - Changed "Last Page" → "Skip Forward 10 pages" (capped at page 200 due to eBay API limits)
  - Added page indicator ("Page X")
  - Added warning message for empty pages
- **File**: `pages/health-store/index.tsx` (lines 406-465)

### 2. Product Card Bookmark/Tag Overlap (Nov 26, 2025)
- **Problem**: Bookmark button overlapped with "FOR HEALTH" benefit tag (both top-right)
- **Fix**: Moved bookmark button to `top-2 left-2`, kept benefit tag at `top-2 right-2`
- **File**: `pages/health-store/index.tsx` (lines 371-387)

### 3. Clear Search Button (Nov 26, 2025)
- **Problem**: No way to clear search and return to default product listing
- **Fix**: Added X button inside search input field that:
  - Appears when user types or has active search query (`?q=...`)
  - Clears input state AND removes `q` param from URL
  - Wrapped input + clear button in relative container for proper positioning
- **File**: `pages/health-store/index.tsx` (lines 169-176, 231-250)

### 4. Navigation Link Highlighting (Nov 25, 2025)
- **Problem**: `/health` link highlighted when on `/health-store`
- **Fix**: Changed `isActive` to use exact match OR `path + '/'` prefix
- **File**: `components/Header.tsx` (line 21-25)

### 5. RSS Feed Description Truncation
- **Problem**: Descriptions were cut off at 400 characters
- **Fix**: Removed `.substring(0, 400)` in `_worker.js`

### 6. Dark/Light Mode Toggle
- **Problem**: Tailwind v4 defaults to media-query dark mode
- **Fix**: Added `@custom-variant dark (&:where(.dark, .dark *));`
- **File**: `styles/globals.css`

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

1. **Frontend is now in root** - All Next.js files (pages/, components/, services/, etc.) are at repository root
2. **Backend worker** stays in `cloudflare-worker/` folder
3. **Backend cache** refreshes hourly via cron, or manually via admin endpoint
4. **ISR revalidation** is 1 hour - redeploy with `--force` for immediate updates
5. **The old Cloudflare Pages site** (`jyotilalchandani.pages.dev`) still works and uses the same backend

## Common Tasks

### Add a new page
1. Create file in `pages/`
2. Use `getStaticProps` for data fetching
3. Set appropriate `revalidate` period

### Modify RSS parsing
1. Edit `_worker.js` (search for `parseRSSFeed` or `fetchRSSFeeds`)
2. Deploy: `npx wrangler deploy --config wrangler.backend.toml --env ""`
3. Refresh cache via admin endpoint

### Fix article rendering
1. Check `services/fullArticle.ts` for client-side fetching
2. Check `cloudflare-worker/src/index.ts` for Readability extraction
3. Check `pages/article/[id].tsx` for display logic

---
*Last updated: November 26, 2025 (Added Nutrition page mobile optimizations + permanent Vercel env vars)*
