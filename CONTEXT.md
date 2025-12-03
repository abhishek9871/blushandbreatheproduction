# Blush & Breathe Production - Project Context

> **Purpose**: This file provides essential context for AI assistants working on this codebase. Read this first before making changes.

---

## 🚨 CRITICAL: READ THIS FIRST (AI AGENTS)

> **This section contains MANDATORY rules that MUST be followed before making ANY changes to the codebase. Failure to follow these rules has caused significant issues in the past.**

### Production Domain (CANONICAL URL)

```
✅ CORRECT: https://www.blushandbreath.com
❌ WRONG:   https://blushandbreath.com (non-www)
❌ WRONG:   https://blushandbreathproduction.vercel.app (Vercel preview)
```

**ALL URLs in the codebase MUST use `https://www.blushandbreath.com`**. This includes:
- Sitemap URLs (`next-sitemap.config.js` → `siteUrl`)
- Canonical URLs in page `<Head>` tags
- Open Graph `og:url` meta tags
- Schema.org structured data URLs
- robots.txt `Host` and `Sitemap` directives
- Any hardcoded URLs in components

### SEO & Indexing Rules (LEARNED FROM PAST MISTAKES)

| Rule | Description | Files Affected |
|------|-------------|----------------|
| **www vs non-www** | ALWAYS use `www.blushandbreath.com`. The server redirects non-www to www, causing Google "Redirect Error" if sitemap uses non-www. | `next-sitemap.config.js`, `MetaHead.tsx`, `SchemaMarkup.tsx`, all page files |
| **Canonical URLs** | Every indexable page MUST have `<link rel="canonical" href="https://www.blushandbreath.com/..." />` | All pages in `pages/` |
| **robots.txt** | MUST allow `/_next/static/` for Google to render JS/CSS. MUST disallow `/api/` to prevent API indexing. | `public/robots.txt`, `next-sitemap.config.js` |
| **Date Formatting** | Use UTC timezone in `getStaticProps` to prevent hydration mismatch: `toLocaleDateString('en-US', { timeZone: 'UTC' })` | Dynamic pages with dates |
| **Open Graph Tags** | Homepage and all important pages need `og:url`, `og:title`, `og:description`, `og:type` | `pages/index.tsx`, all SEO pages |
| **API XHR Blocking** | `/api/` routes are intentionally blocked in robots.txt. This causes "1/24 resources blocked" in Google - this is EXPECTED and OK because page content is SSG. | N/A |

### Secrets Management (NEVER COMMIT SECRETS)

```
⚠️ CRITICAL: Secrets were removed from wrangler.backend.toml on Nov 29, 2025
```

**DO NOT add secrets to these files:**
- `wrangler.backend.toml` - Use `wrangler secret put` instead
- Any `.env` file that's not in `.gitignore`
- Any source code file

**Cloudflare Worker Secrets (set via CLI):**
```bash
wrangler secret put EBAY_CLIENT_ID
wrangler secret put EBAY_CLIENT_SECRET  
wrangler secret put UNSPLASH_ACCESS_KEY
```

**Vercel Environment Variables (set in dashboard or CLI):**
```bash
npx vercel env add GEMINI_API_KEY production
npx vercel env add YOUTUBE_API_KEY production
npx vercel env add RESEND_API_KEY production
```

### Pre-Deployment Checklist

Before deploying ANY changes, verify:

- [ ] All URLs use `https://www.blushandbreath.com` (not non-www or Vercel URL)
- [ ] No secrets/API keys in source code
- [ ] `npm run build` succeeds without errors
- [ ] Sitemap generates with correct www URLs
- [ ] New pages have canonical URLs and OG tags

### Google Search Console Sitemap

```
Main Sitemap: https://www.blushandbreath.com/sitemap.xml
Priority Sitemap: https://www.blushandbreath.com/sitemap-priority.xml
Total Discovered URLs: 166 (158 main + 8 priority)
Status: Success (as of Dec 3, 2025)
```

**Priority Sitemap** (8 high-value URLs with priority 1.0/0.9):
- 5 SEO Articles: natural-steroids-guide, dbal-max-review-2025, pregnancy-safe-pre-workout, best-legal-steroids-cutting, breastfeeding-safe-pre-workout
- 3 Buy Pages: berberine-india, clenbuterol-india, dmaa-india

When adding new pages:
1. Rebuild: `npm run build` (regenerates sitemap)
2. Deploy: `npx vercel --prod`
3. Wait 24-48 hours for Google to crawl new URLs from sitemap
4. For priority pages, add to `sitemap-priority.xml` and exclude from main sitemap in `next-sitemap.config.js`

---

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
│  • URL: www.blushandbreath.com  │  • KV: MERGED_CACHE            │
│    (Custom domain on Vercel)    │  • Durable Objects: Affiliate  │
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
├── data/                      # Local databases
│   ├── indian-medicines.json  # 254K Indian medicines (85MB optimized)
│   └── indian-medicines-sample.json  # 50 popular medicines for static import
├── scripts/                   # Data processing scripts
│   ├── setup-indian-medicines.js    # CSV → JSON conversion
│   ├── merge-medicine-data.js       # Merge price + usage data
│   └── optimize-medicine-data.js    # Compress for Vercel limits
├── pages/                     # Next.js pages (SSR/ISR)
│   ├── api/                   # API routes
│   │   ├── contact.ts         # Contact form → Resend email
│   │   ├── indian-medicine/   # Indian medicines API
│   │   │   └── [name].ts      # Search 254K medicines
│   │   ├── medicine/          # FDA medicine API
│   │   │   └── [slug].ts      # OpenFDA integration
│   │   ├── nutrition/         # Vercel Edge Functions for AI
│   │   │   ├── generate-diet-plan.ts  # Gemini diet plan generation
│   │   │   └── regenerate-meal.ts     # Gemini meal regeneration
│   │   ├── substances/        # Substance-related APIs
│   │   │   ├── openfda-interactions.ts # Drug interaction checker (Nov 28)
│   │   │   └── ...            # Other substance APIs
│   │   └── youtube/videos.ts  # YouTube API proxy
│   ├── medicine/              # Medicine detail pages
│   │   └── [slug].tsx         # Dynamic medicine page (ISR)
│   ├── medicines/             # MediVault section
│   │   ├── index.tsx          # Medicine encyclopedia home
│   │   ├── interactions.tsx   # Drug Interaction Checker (rebuilt Nov 28)
│   │   └── search.tsx         # Intelligent search (Indian + FDA)
│   ├── info/                  # Footer info pages (SEO optimized)
│   │   ├── about.tsx          # Our Story
│   │   ├── careers.tsx        # Careers page
│   │   ├── press.tsx          # Press & Media
│   │   ├── contact.tsx        # Contact form
│   │   ├── emergency.tsx      # Emergency info (created Nov 28)
│   │   ├── faq.tsx            # FAQ with category filters
│   │   ├── shipping.tsx       # Shipping info (eBay disclaimer)
│   │   ├── returns.tsx        # Returns info (eBay disclaimer)
│   │   ├── terms.tsx          # Terms of Service
│   │   └── privacy.tsx        # Privacy Policy
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
├── lib/                       # Data libraries
│   └── data/                  # Research data files
│       ├── banned-substances.json    # 31 banned substances (pillar pages)
│       ├── legal-supplements.json    # 10 legal alternatives
│       ├── affiliate-products.json   # 19 affiliate products
│       ├── articles.json             # 29 guide/cluster articles
│       ├── buy-pages.json            # 3 Amazon affiliate buy pages
│       ├── substance-articles.json   # Wikipedia/PubMed content (2-4MB)
│       └── index.ts                  # Data access functions
├── types/                     # TypeScript types
│   └── substance.ts           # MedicineInfo, DrugInteraction, BannedSubstance types
├── styles/globals.css         # Tailwind CSS styles
├── public/                    # Static assets
│   ├── sitemap.xml            # Sitemap index (auto-generated)
│   ├── sitemap-0.xml          # Main sitemap (auto-generated, 158 URLs)
│   ├── sitemap-priority.xml   # Priority sitemap (manually created, 8 URLs)
│   └── robots.txt             # Robots file (auto-generated with both sitemaps)
├── Research/                  # SEO research files for new articles
│   ├── article1_dbal_max.md
│   ├── article2_pregnancy_safe_pre_workout.md
│   ├── article3_best_legal_steroids_cutting.md
│   ├── article4_breastfeeding_safe_pre_workout.md
│   ├── article5_natural_steroids.md
│   └── phase*.md              # Keyword research phases
├── components/SEO/            # SEO-related components
│   ├── MetaHead.tsx           # Page meta tags (SITE_URL constant)
│   └── SchemaMarkup.tsx       # Structured data (Article, FAQ, etc.)
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
- `RESEND_API_KEY` - For Contact Form email delivery (via Resend API)
- `CONTACT_EMAIL` - Destination email for contact form submissions (`sparshrajput088@gmail.com`)

**No need to pass `-e` flags during deployment.** If you need to update them, use:
```bash
npx vercel env add <VAR_NAME> production
```

⚠️ **Important**: When adding env vars via CLI, use interactive mode (don't pipe with `echo`) to avoid newline characters:
```bash
npx vercel env add CONTACT_EMAIL production
# Then type the value when prompted
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

### 1. Newsletter & Contact Form Email Integration (Nov 26, 2025)

**Newsletter** (existing):
- Backend endpoint: `POST /api/newsletter/subscribe` on Cloudflare Worker
- Called from `components/Footer.tsx`
- Uses `NEXT_PUBLIC_API_URL` environment variable

**Contact Form** (new):
- **API Route**: `pages/api/contact.ts` (Next.js API route)
- **Email Service**: [Resend](https://resend.com) (100 free emails/day)
- **Flow**: Form → `/api/contact` → Resend API → Gmail inbox
- **Sender**: `onboarding@resend.dev` (Resend's default domain)
- **Features**:
  - HTML formatted emails with gradient header
  - Reply-to set to sender's email for easy responses
  - Subject categories: General, Feedback, Partnership, Press, Technical, Other
  - Error handling with user-friendly messages
- **Files**:
  - `pages/api/contact.ts` - API endpoint with Resend integration
  - `pages/info/contact.tsx` - Contact form UI with error/success states

**Resend Setup** (if API key expires or changes):
1. Create account at https://resend.com
2. Generate API key from Dashboard → API Keys
3. Add to Vercel: `npx vercel env add RESEND_API_KEY production`
4. Add recipient: `npx vercel env add CONTACT_EMAIL production`
5. Redeploy: `npx vercel --prod --force`

**Info Pages** (all in `pages/info/`):
- SEO optimized with meta tags, canonical URLs, Open Graph
- Scroll-to-top behavior on all pages (`useEffect` + `window.scrollTo`)
- Mobile responsive with Tailwind
- Dark mode support
- **Important disclaimers** on Shipping/Returns: "Blush & Breathe is a content aggregator. eBay handles all orders."

### 2. Videos Page - YouTube API Integration (Nov 26, 2025)
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

### 3. AI Diet Plan with Gemini (Nov 26, 2025)
- **Feature**: Personalized diet plan generation using Google Gemini 2.0 Flash
- **Problem**: Cloudflare Workers free plan has 10ms CPU limit - AI calls timeout
- **Solution**: Hybrid approach - Vercel Edge Functions handle AI (60s timeout)
- **Files**:
  - `pages/api/nutrition/generate-diet-plan.ts` - Main AI endpoint (60s timeout)
  - `pages/api/nutrition/regenerate-meal.ts` - Meal regeneration (30s timeout)
  - `hooks/useUserProfile.tsx` - Routes AI calls to Vercel API
  - `vercel.json` - Configures Edge Function timeouts
- **API Key**: `GEMINI_API_KEY` set in Vercel environment variables
- **Model**: `gemini-2.0-flash` with `temperature: 0.3`, `maxOutputTokens: 8192`

### 3a. Swap Meal Feature (Nov 26, 2025)
- **Feature**: Intelligent AI-powered meal swapping while maintaining exact calorie/macro targets
- **Problem**: "Swap Meal" button on generated diet plan did nothing meaningful
- **Solution**: 
  - Enhanced `regenerate-meal.ts` to use current meal's nutritional data as targets
  - Prompt instructs Gemini to generate DIFFERENT meal with SAME calories (±10%)
  - Uses alternatives from current meal as inspiration
  - Updates state immutably so React re-renders properly
- **UI Improvements**:
  - Green border highlight on swapped meal card
  - "Meal swapped successfully!" banner with checkmark
  - Success indication auto-clears after 3 seconds
- **Key Code Changes**:
  - `hooks/useUserProfile.tsx` (lines 294-327): Proper immutable state updates for `setDietPlan`
  - `pages/api/nutrition/regenerate-meal.ts` (lines 55-118): Smart prompt with target matching
  - `components/DietChart/WeeklyPlanView.tsx`: Added `swappedMeal` state for visual feedback

### 3b. Gemini API Key Leak Fix (Nov 26, 2025)
- **Problem**: Diet plan generation failed with 500 error: "Your API key was reported as leaked"
- **Cause**: Google flagged the Gemini API key (likely exposed in public repo)
- **Fix**:
  1. Generate new API key at https://aistudio.google.com/app/apikey
  2. Delete old compromised key
  3. Update `GEMINI_API_KEY` in Vercel project settings
  4. Redeploy: `npx vercel --prod`
- **Prevention**: Never commit API keys to git. Use environment variables only.

### 4. Nutrition Page Mobile Optimization (Nov 26, 2025)
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

### 5. Dark Mode Fix for Diet Plan (Nov 26, 2025)
- **Problem**: Text invisible on dark backgrounds (labels, buttons, headings)
- **Fix**: Added `text-text-light dark:text-text-dark` to all text elements
- **Files**:
  - `components/DietChart/EnhancedProfileSetup.tsx`
  - `components/DietChart/WeeklyPlanView.tsx`
  - `styles/globals.css` - Added `card-dark` color variable

### 6. Health Store Pagination (Nov 26, 2025)
- **Problem**: "Last Page" button caused "No products found" + pagination disappeared
- **Fix**: 
  - Show pagination when `total > 0` OR `page > 1` (allows navigating back from empty pages)
  - Changed "Last Page" → "Skip Forward 10 pages" (capped at page 200 due to eBay API limits)
  - Added page indicator ("Page X")
  - Added warning message for empty pages
- **File**: `pages/health-store/index.tsx` (lines 406-465)

### 7. Product Card Bookmark/Tag Overlap (Nov 26, 2025)
- **Problem**: Bookmark button overlapped with "FOR HEALTH" benefit tag (both top-right)
- **Fix**: Moved bookmark button to `top-2 left-2`, kept benefit tag at `top-2 right-2`
- **File**: `pages/health-store/index.tsx` (lines 371-387)

### 8. Clear Search Button (Nov 26, 2025)
- **Problem**: No way to clear search and return to default product listing
- **Fix**: Added X button inside search input field that:
  - Appears when user types or has active search query (`?q=...`)
  - Clears input state AND removes `q` param from URL
  - Wrapped input + clear button in relative container for proper positioning
- **File**: `pages/health-store/index.tsx` (lines 169-176, 231-250)

### 9. Navigation Link Highlighting (Nov 25, 2025)
- **Problem**: `/health` link highlighted when on `/health-store`
- **Fix**: Changed `isActive` to use exact match OR `path + '/'` prefix
- **File**: `components/Header.tsx` (line 21-25)

### 10. RSS Feed Description Truncation
- **Problem**: Descriptions were cut off at 400 characters
- **Fix**: Removed `.substring(0, 400)` in `_worker.js`

### 11. Dark/Light Mode Toggle
- **Problem**: Tailwind v4 defaults to media-query dark mode
- **Fix**: Added `@custom-variant dark (&:where(.dark, .dark *));`
- **File**: `styles/globals.css`

### 12. Article Search Relevance Fix (Nov 26, 2025)
- **Problem**: Search results showed irrelevant articles (e.g., searching "yoga" returned unrelated health articles)
- **Solution**: Client-side filtering in `services/apiService.ts`:
  - Word boundary matching (`\b${term}\b`) prevents partial matches
  - Title/description matches prioritized (scored higher)
  - Category matching also considered
  - Results re-sorted by match score after filtering
- **File**: `services/apiService.ts` - `searchArticles()` function

### 13. Indian Medicines Database Integration (Nov 27, 2025)

**Overview**: Integrated 254K Indian medicines with brand names, prices (₹), manufacturers, uses, side effects, and substitutes.

#### Data Sources & Architecture
```
┌─────────────────────────────────────────────────────────────────────┐
│                    MEDICINE DATA FLOW                                │
├─────────────────────────────────────────────────────────────────────┤
│  Search Query                                                        │
│       │                                                              │
│       ▼                                                              │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ STEP 1: Local Indian DB (254K medicines)                    │    │
│  │ • data/indian-medicines.json (85MB optimized)               │    │
│  │ • Searched via searchIndianMedicineFullDB()                 │    │
│  │ • Returns: brand name, ₹price, manufacturer, composition    │    │
│  └─────────────────────────────────────────────────────────────┘    │
│       │ Not found?                                                   │
│       ▼                                                              │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ STEP 2: OpenFDA API (FDA-approved drugs)                    │    │
│  │ • api.fda.gov/drug/label.json                               │    │
│  │ • Returns: FDA labels, indications, warnings                │    │
│  └─────────────────────────────────────────────────────────────┘    │
│       │ Not found?                                                   │
│       ▼                                                              │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ STEP 3: MyChem.info/DrugCentral (International drugs)       │    │
│  │ • mychem.info/v1/chem/query                                 │    │
│  └─────────────────────────────────────────────────────────────┘    │
│       │ Not found?                                                   │
│       ▼                                                              │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ STEP 4: PubChem (NIH - 100M+ compounds)                     │    │
│  │ • pubchem.ncbi.nlm.nih.gov/rest/pug                         │    │
│  └─────────────────────────────────────────────────────────────┘    │
│       │                                                              │
│       ▼                                                              │
│  Wikipedia Enrichment (added to any source)                          │
│  • en.wikipedia.org/api/rest_v1/page/summary                        │
└─────────────────────────────────────────────────────────────────────┘
```

#### Kaggle Datasets Used
| Dataset | Records | Data |
|---------|---------|------|
| [A-Z Medicine Dataset of India](https://kaggle.com/datasets/shudhanshusingh/az-medicine-dataset-of-india) | 254K | name, price, manufacturer, composition, pack size |
| [250K Medicines Usage & Side Effects](https://kaggle.com/datasets/shudhanshusingh/250k-medicines-usage-side-effects-and-substitutes) | 248K | uses, side effects, substitutes, therapeutic class |

#### Data Processing Pipeline
```bash
# 1. Convert CSV to JSON with normalized structure
node scripts/setup-indian-medicines.js
# Output: data/indian-medicines.json (64MB)

# 2. Merge with usage/side effects dataset  
node scripts/merge-medicine-data.js
# Output: 168MB enriched JSON (100% match rate)

# 3. Optimize to stay under Vercel's 100MB limit
node scripts/optimize-medicine-data.js
# Output: 85MB (limited to top 2 uses, 3 side effects, 2 substitutes)
```

#### Optimized JSON Format (Compressed)
```typescript
interface IndianMedicineOptimized {
  i: string;      // id
  n: string;      // name (e.g., "Crocin 650 Tablet")
  b: string;      // baseName (e.g., "Crocin")
  p: number;      // price in ₹
  m: string;      // manufacturer
  t: string;      // type (allopathy/ayurvedic)
  k: string;      // packSize
  c1: string;     // composition1 (e.g., "Paracetamol (650mg)")
  c2?: string;    // composition2
  u?: string[];   // uses (top 2)
  se?: string[];  // sideEffects (top 3)
  su?: string[];  // substitutes (top 2)
  tc?: string;    // therapeuticClass
  hf?: boolean;   // habitForming
}
```

#### Key Files Created/Modified
| File | Purpose |
|------|---------|
| `scripts/setup-indian-medicines.js` | Converts Kaggle CSV to JSON |
| `scripts/merge-medicine-data.js` | Merges price data with usage data |
| `scripts/optimize-medicine-data.js` | Compresses to stay under 100MB |
| `data/indian-medicines.json` | Main database (85MB, 254K medicines) |
| `data/indian-medicines-sample.json` | Popular medicines for static import (50) |
| `pages/api/indian-medicine/[name].ts` | API for searching full DB |
| `pages/medicine/[slug].tsx` | Medicine detail page with Indian data |
| `pages/medicines/search.tsx` | Intelligent search with Indian results |
| `types/substance.ts` | Added `indianPrice`, `indianPackSize` fields |

#### Search Intelligence
```typescript
// Generic compound search (modafinil, paracetamol)
// → FDA info FIRST, then Indian brand options with prices

// Brand name search (waklert, crocin, dolo)
// → Indian brands FIRST with ₹ prices

function isLikelyGenericName(term: string): boolean {
  // Detects patterns like: /afinil$/, /racetam$/, /statin$/, etc.
}
```

#### UI Enhancements
- **🇮🇳 India badge** (orange) for Indian medicines
- **₹ Price badge** (green) showing MRP
- **Manufacturer & Composition** in search results
- **Uses** displayed as bullet points
- **Side Effects** in Adverse Reactions section
- **Substitutes** in Drug Interactions section

#### Example: Searching "modafinil"
```
Results (24 total):
1. Modafinil - Generic/FDA (compound info)
2. Provigil - US brand
3. Armod 50 Tablet - 🇮🇳 ₹177.6 - Emcure - Armodafinil
4. Modalert 100 - 🇮🇳 ₹204 - Sun Pharma - Modafinil
5. Modatec 100mg - 🇮🇳 ₹60 - Cipla - Modafinil (cheapest!)
...20 more Indian brands
```

#### Example: Searching "waklert" (brand)
```
Results (5 total):
1. Waklert 50 Tablet - 🇮🇳 ₹158 - Sun Pharma
2. Waklert 150 Tablet - 🇮🇳 ₹324 - Sun Pharma
3. Waklert 100mg Tablet - 🇮🇳 ₹143.75 - Sun Pharma
```

#### API Endpoint
```
GET /api/indian-medicine/[name]          # Single best match
GET /api/indian-medicine/[name]?list=true # Multiple results (up to 20)
```

#### Deployment Notes
- CSV files (A_Z_medicines_dataset_of_India.csv, medicine_dataset.csv) are NOT deployed
- Only the optimized JSON is deployed to keep under Vercel's 100MB limit
- API route caches parsed JSON in memory after first request

### 14. Banned Substances & Legal Alternatives System (Nov 27, 2025)

**Overview**: Research-based encyclopedia of banned/dangerous substances with legal alternatives and affiliate product recommendations.

#### Data Files (`lib/data/`)
| File | Content | Records |
|------|---------|---------|
| `banned-substances.json` | Banned/dangerous substances | 31 substances |
| `legal-supplements.json` | Safe legal alternatives | 10 supplements |
| `affiliate-products.json` | Affiliate product recommendations | 19 products |
| `substance-articles.json` | Wikipedia, PubMed, images data | 41 articles |
| `index.ts` | Data access & search functions | - |

#### Banned Substances Covered (31 total)
| # | Substance | Category | Status |
|---|-----------|----------|--------|
| 1 | **DMAA** | Stimulant | FDA Banned (2013) |
| 2 | **Phenibut** | Nootropic | FDA Banned (2019) |
| 3 | **Kratom** | Other | Restricted (7 states) |
| 4 | **SARMs** | SARM | Unapproved drug |
| 5 | **Ephedrine** | Stimulant | FDA Banned (2004) |
| 6 | **Clenbuterol** | Stimulant | Not for humans |
| 7 | **Cardarine** | Other | Never approved |
| 8 | **Nandrolone** | Prohormone | Schedule III |
| 9 | **DMHA (Octodrine)** | Stimulant | FDA Warning |
| 10 | **BMPEA** | Stimulant | FDA Banned |
| 11 | **Tianeptine** | Other | Restricted (multiple states) |
| 12 | **Adrafinil** | Nootropic | Unscheduled but risky |
| 13 | **Phenylpiracetam** | Nootropic | WADA Banned |
| 14 | **Ostarine (MK-2866)** | SARM | Unapproved drug |
| 15 | **Andarine (S-4)** | SARM | Unapproved drug |
| 16 | **Yohimbine** | Other | FDA Warning |
| 17 | **Higenamine** | Stimulant | WADA Banned |
| 18 | **Vinpocetine** | Nootropic | FDA Warning |
| 19 | **Picamilon** | Nootropic | FDA Banned (2015) |
| 20 | **AMP Citrate (DMBA)** | Stimulant | FDA Warning |
| 21 | **Methylsynephrine** | Stimulant | FDA Banned |
| 22 | **Hordenine** | Stimulant | WADA Banned |
| 23 | **Octopamine** | Stimulant | WADA Banned |
| 24 | **N-Methyltyramine** | Stimulant | WADA Banned |
| 25 | **Cyclazodone** | Nootropic | Unscheduled research chemical |
| 26 | **Hydrafinil** | Nootropic | Unscheduled research chemical |
| 27 | **Sulbutiamine** | Nootropic | Prescription in some countries |
| 28 | **Dendrobium Extract** | Stimulant | FDA Warning |
| 29 | **Acacia Rigidula** | Stimulant | FDA Warning |
| 30 | **Arecoline (Betel Nut)** | Other | Carcinogenic |
| 31 | **Synephrine** | Stimulant | Restricted in sports |

#### Legal Supplements Covered (10 total)
| # | Supplement | Category | FDA Status |
|---|------------|----------|------------|
| 1 | **Caffeine** | Nootropic | GRAS |
| 2 | **L-Theanine** | Amino Acid | GRAS |
| 3 | **Creatine Monohydrate** | Amino Acid | GRAS |
| 4 | **Beta-Alanine** | Amino Acid | Dietary Ingredient |
| 5 | **Citrulline Malate** | Amino Acid | Dietary Ingredient |
| 6 | **Ashwagandha** | Adaptogen | NDI |
| 7 | **Rhodiola Rosea** | Adaptogen | Dietary Ingredient |
| 8 | **Magnesium Glycinate** | Mineral | GRAS |
| 9 | **Lion's Mane Mushroom** | Nootropic | Dietary Ingredient |
| 10 | **Alpha-GPC** | Nootropic | GRAS |

#### Data Structure (Banned Substance)
```typescript
interface BannedSubstance {
  id: string;
  slug: string;
  name: string;
  alternativeNames: string[];
  category: 'stimulant' | 'nootropic' | 'sarm' | 'prohormone' | 'other';
  legalStatus: 'banned_usa' | 'restricted' | 'controlled';
  legalStatusDetails: string;
  bannedDate?: string;
  bannedBy: string[];
  stateRestrictions: Record<string, string>;
  healthRisks: { category: string; description: string; severity: string; sources: string[] }[];
  sideEffects: string[];
  contraindications: string[];
  overdoseRisk: 'low' | 'moderate' | 'high';
  addictionPotential: 'low' | 'moderate' | 'high';
  description: string;
  mechanism: string;
  history: string;
  whyBanned: string;
  legalAlternatives: string[];  // slugs of legal supplements
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
}
```

#### Affiliate Products (19 products)
| Brand | Products | Commission |
|-------|----------|------------|
| Transparent Labs | BULK Pre-Workout, Creatine HMB, SLEEP | 10% |
| Nootropics Depot | Alpha-GPC, L-Theanine, Ashwagandha, Rhodiola, Magnesium, Lion's Mane | 15% |
| Gorilla Mind | Gorilla Mode Pre-Workout | 3% (Amazon) |
| BulkSupplements | Creatine, Beta-Alanine, Citrulline | 3% (Amazon) |
| NOW Foods | Ashwagandha, Rhodiola, Magnesium | 3% (Amazon) |
| Thorne Research | Alpha-GPC | 10% |
| Jarrow Formulas | Alpha-GPC | 3% (Amazon) |
| Host Defense | Lion's Mane | 3% (Amazon) |

#### Data Access Functions (`lib/data/index.ts`)
```typescript
// Banned substances
getBannedSubstances(): BannedSubstance[]
getBannedSubstanceBySlug(slug: string): BannedSubstance | undefined
getBannedSubstanceSlugs(): string[]

// Legal supplements
getLegalSupplements(): LegalSupplement[]
getLegalSupplementBySlug(slug: string): LegalSupplement | undefined
getLegalAlternatives(bannedSlug: string): LegalSupplement[]

// Affiliate products
getAffiliateProducts(): AffiliateProduct[]
getAffiliateProductsForSupplement(supplementSlug: string): AffiliateProduct[]
getAffiliateProductsForBanned(bannedSlug: string): AffiliateProduct[]

// Search
searchSubstances(query: string): { banned: [], supplements: [] }
getSubstancesByCategory(category: string): { banned: [], supplements: [] }

// Validation
validateDataIntegrity(): { isValid: boolean; errors: string[]; stats: {} }
```

#### Use Case Flow
```
User searches "DMAA alternative"
       ↓
getBannedSubstanceBySlug('dmaa')
       ↓
Returns: risks, legal status, why banned
       ↓
getLegalAlternatives('dmaa')
       ↓
Returns: caffeine, citrulline-malate, beta-alanine
       ↓
getAffiliateProductsForBanned('dmaa')
       ↓
Returns: Transparent Labs BULK, Gorilla Mode, BulkSupplements products
       ↓
User clicks affiliate link → Commission earned
```

#### Related Components
- `components/legal/AffiliateDisclosure.tsx` - FTC disclosure component
- `components/substances/AffiliateProductCTA.tsx` - Product recommendation cards
- `pages/compare/[slug].tsx` - Substance comparison pages

---

## 📋 COMPLETE LIST OF IMPLEMENTED SUBSTANCE PAGES

> **Important**: This section lists ALL substance pages that have been implemented for SEO ranking. Use this as a reference to know what has already been built.

### Banned Substance Pages (`/banned/[slug]`)
**Route**: `pages/banned/[slug].tsx` | **Total**: 33 pages

| # | Slug | Name | Category |
|---|------|------|----------|
| 1 | `dmaa` | DMAA | Stimulant |
| 2 | `phenibut` | Phenibut | Nootropic |
| 3 | `kratom` | Kratom | Other |
| 4 | `sarms` | SARMs (Selective Androgen Receptor Modulators) | SARM |
| 5 | `ephedrine` | Ephedrine | Stimulant |
| 6 | `clenbuterol` | Clenbuterol | Stimulant |
| 7 | `cardarine` | Cardarine (GW501516) | Other |
| 8 | `nandrolone` | Nandrolone (Deca-Durabolin) | Prohormone |
| 9 | `dmha` | DMHA (Octodrine) | Stimulant |
| 10 | `bmpea` | BMPEA | Stimulant |
| 11 | `tianeptine` | Tianeptine | Other |
| 12 | `adrafinil` | Adrafinil | Nootropic |
| 13 | `phenylpiracetam` | Phenylpiracetam | Nootropic |
| 14 | `ostarine` | Ostarine (MK-2866) | SARM |
| 15 | `andarine` | Andarine (S-4) | SARM |
| 16 | `yohimbine` | Yohimbine/Yohimbe | Other |
| 17 | `higenamine` | Higenamine | Stimulant |
| 18 | `vinpocetine` | Vinpocetine | Nootropic |
| 19 | `picamilon` | Picamilon | Nootropic |
| 20 | `amp-citrate` | AMP Citrate (DMBA) | Stimulant |
| 21 | `methylsynephrine` | Methylsynephrine (Oxilofrine) | Stimulant |
| 22 | `hordenine` | Hordenine | Stimulant |
| 23 | `octopamine` | Octopamine | Stimulant |
| 24 | `n-methyltyramine` | N-Methyltyramine | Stimulant |
| 25 | `cyclazodone` | Cyclazodone | Nootropic |
| 26 | `hydrafinil` | Hydrafinil (Fluorenol) | Nootropic |
| 27 | `sulbutiamine` | Sulbutiamine | Nootropic |
| 28 | `dendrobium` | Dendrobium Extract | Stimulant |
| 29 | `acacia-rigidula` | Acacia Rigidula | Stimulant |
| 30 | `arecoline` | Arecoline (Betel Nut) | Other |
| 31 | `synephrine` | Synephrine | Stimulant |

**Features per page**:
- ✅ Full SEO meta tags (title, description, keywords)
- ✅ Schema.org MedicalWebPage structured data
- ✅ Why banned section with regulatory bodies
- ✅ Health risks & side effects
- ✅ Mechanism of action
- ✅ Safe legal alternatives with affiliate CTAs
- ✅ Wikipedia full article content (expandable)
- ✅ PubMed research citations
- ✅ Related images from Wikimedia
- ✅ Comparison page links

### Legal Supplement Pages (`/supplement/[slug]`)
**Route**: `pages/supplement/[slug].tsx` | **Total**: 10 pages

| # | Slug | Name | Category |
|---|------|------|----------|
| 1 | `caffeine` | Caffeine | Nootropic |
| 2 | `l-theanine` | L-Theanine | Amino Acid |
| 3 | `creatine-monohydrate` | Creatine Monohydrate | Amino Acid |
| 4 | `beta-alanine` | Beta-Alanine | Amino Acid |
| 5 | `citrulline-malate` | Citrulline Malate | Amino Acid |
| 6 | `ashwagandha` | Ashwagandha | Adaptogen |
| 7 | `rhodiola-rosea` | Rhodiola Rosea | Adaptogen |
| 8 | `magnesium-glycinate` | Magnesium Glycinate | Mineral |
| 9 | `lions-mane` | Lion's Mane Mushroom | Nootropic |
| 10 | `alpha-gpc` | Alpha-GPC | Nootropic |

**Features per page**:
- ✅ Full SEO meta tags
- ✅ Schema.org DietarySupplement structured data
- ✅ Benefits list
- ✅ Dosage guidelines (recommended, min, max)
- ✅ Side effects & contraindications
- ✅ Drug interactions warning
- ✅ Scientific evidence with study counts
- ✅ "Where to Buy" affiliate products
- ✅ "Legal Alternative To" banned substance links
- ✅ Wikipedia full article content
- ✅ PubMed research citations

### Comparison Pages (`/compare/[slug]`)
**Route**: `pages/compare/[slug].tsx` | **Total**: 73+ auto-generated pages

Format: `/compare/[banned-slug]-vs-[supplement-slug]`

Examples:
- `/compare/dmaa-vs-caffeine`
- `/compare/phenibut-vs-l-theanine`
- `/compare/kratom-vs-ashwagandha`
- `/compare/sarms-vs-creatine-monohydrate`

**Features per page**:
- ✅ Side-by-side comparison table
- ✅ Safety comparison (risks vs benefits)
- ✅ Recommended products for the legal alternative
- ✅ Links to both substance detail pages
- ✅ Medical disclaimer

### Affiliate Products (19 total)
**Data file**: `lib/data/affiliate-products.json`

| # | Brand | Product | Related Supplements |
|---|-------|---------|---------------------|
| 1 | Transparent Labs | BULK Pre-Workout | caffeine, beta-alanine, citrulline-malate |
| 2 | Gorilla Mind | Gorilla Mode Pre-Workout | caffeine, l-theanine |
| 3 | Transparent Labs | Creatine HMB | creatine-monohydrate |
| 4 | BulkSupplements | Creatine Monohydrate Powder | creatine-monohydrate |
| 5 | Nootropics Depot | Alpha-GPC 50% Powder | alpha-gpc |
| 6 | Thorne Research | Alpha-GPC Capsules | alpha-gpc |
| 7 | Jarrow Formulas | Alpha-GPC | alpha-gpc |
| 8 | Transparent Labs | SLEEP Supplement | l-theanine, magnesium-glycinate |
| 9 | Nootropics Depot | L-Theanine Powder | l-theanine |
| 10 | BulkSupplements | Beta-Alanine Powder | beta-alanine |
| 11 | BulkSupplements | Citrulline Malate 2:1 | citrulline-malate |
| 12 | Nootropics Depot | Ashwagandha KSM-66 | ashwagandha |
| 13 | NOW Foods | Ashwagandha | ashwagandha |
| 14 | Nootropics Depot | Rhodiola Rosea 3% | rhodiola-rosea |
| 15 | NOW Foods | Rhodiola | rhodiola-rosea |
| 16 | Nootropics Depot | Magnesium Glycinate | magnesium-glycinate |
| 17 | NOW Foods | Magnesium Glycinate | magnesium-glycinate |
| 18 | Nootropics Depot | Lion's Mane 8:1 Extract | lions-mane |
| 19 | Host Defense | Lion's Mane | lions-mane |

**Affiliate Networks**:
- Transparent Labs: 10% commission (direct)
- Nootropics Depot: 15% commission (direct)
- Amazon Associates: 3% commission
- Gorilla Mind: Direct partnership

---

### 15. Wikipedia Article Integration for Substance Pages (Nov 28, 2025)

**Overview**: Integrated full Wikipedia article content into banned substance and legal supplement pages with proper HTML cleaning, internal link preservation, and citation handling.

#### Architecture
```
┌─────────────────────────────────────────────────────────────────────┐
│                    WIKIPEDIA CONTENT FLOW                            │
├─────────────────────────────────────────────────────────────────────┤
│  scripts/refresh-article-data.js                                     │
│       │                                                              │
│       ▼                                                              │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ STEP 1: Try hb-reader worker (Mozilla Readability)          │    │
│  │ • URL: hb-reader.sparshrajput088.workers.dev/read           │    │
│  │ • Returns clean HTML via Readability.js                     │    │
│  └─────────────────────────────────────────────────────────────┘    │
│       │ Failed? (503/timeout)                                        │
│       ▼                                                              │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ STEP 2: Fallback to Wikipedia REST API                      │    │
│  │ • en.wikipedia.org/api/rest_v1/page/html/{title}            │    │
│  │ • Extracts body content via indexOf (not regex)             │    │
│  └─────────────────────────────────────────────────────────────┘    │
│       │                                                              │
│       ▼                                                              │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ STEP 3: cleanWikipediaHtml() - Comprehensive HTML cleaning  │    │
│  │ • Removes: scripts, styles, [edit] links, navboxes          │    │
│  │ • Removes: empty brackets [], citation markers               │    │
│  │ • Preserves: internal Wikipedia links, tables, images        │    │
│  │ • Converts: relative URLs to absolute Wikipedia URLs         │    │
│  └─────────────────────────────────────────────────────────────┘    │
│       │                                                              │
│       ▼                                                              │
│  lib/data/substance-articles.json                                    │
│  • Stores: fullContent (cleaned HTML), readingTime, summary          │
│  • Structure: { articles: { [slug]: { wikipedia: {...} } } }        │
└─────────────────────────────────────────────────────────────────────┘
```

#### Key Files
| File | Purpose |
|------|---------|
| `scripts/refresh-article-data.js` | Fetches Wikipedia, PubMed, images; cleans HTML |
| `lib/data/substance-articles.json` | Generated JSON with all article data (2-4 MB) |
| `components/articles/RelatedArticles.tsx` | WikipediaSection component renders fullContent |
| `styles/globals.css` | `.wikipedia-content` styles for dark mode, tables, links |
| `types/substance.ts` | `WikipediaArticle` interface with fullContent field |

#### HTML Cleaning Features (`cleanWikipediaHtml`)
```javascript
// Removed:
- <script>, <style>, <iframe>, <noscript> tags
- [edit] section links and mw-editsection spans
- Citation superscripts with numbers like [1], [2]
- Empty brackets [] and () after citation removal
- Nested span brackets: <span><span>[</span><span>]</span></span>
- Navigation boxes (navbox tables/divs)
- "What is this?" / "Verify" verification rows
- Infobox chemical identifiers (SMILES, InChI, InChIKey)
- Empty paragraphs <p></p>

// Preserved:
- Internal Wikipedia links (converted to target="_blank")
- External citation links
- Tables (wikitable, infobox)
- Images with proper styling
- Headings structure

// Converted:
- Relative URLs (/wiki/...) → absolute (https://en.wikipedia.org/wiki/...)
- href="#cite_..." → removed (in-page citation links)
```

#### CSS Styling (`styles/globals.css`)
```css
.wikipedia-content {
  /* Dark mode support for all elements */
  /* Table styling with borders */
  /* Link styling (blue, external indicators) */
  /* Image handling (max-width, background for dark mode) */
  /* Heading hierarchy */
  /* List styling */
}
```

#### Data Structure
```typescript
interface SubstanceArticles {
  articles: {
    [slug: string]: {
      wikipedia?: {
        title: string;
        extract: string;           // Short summary
        fullContent: string;       // Full cleaned HTML
        readingTime: number;       // Minutes (wordCount / 200)
        url: string;               // Wikipedia article URL
        thumbnail?: { source, width, height };
      };
      pubmed?: PubMedArticle[];
      images?: WikimediaImage[];
    };
  };
  lastUpdated: string;
}
```

#### Current Coverage (as of Nov 28, 2025)
- **Total substances**: 41 (31 banned + 10 supplements)
- **With full Wikipedia content**: 32/41 (78%)
- **Without content**: 9 (either no Wikipedia article exists or rate limited)
- **Articles with no Wikipedia page**: AMP Citrate, Citrulline Malate, Magnesium Glycinate, Hydrafinil

---

## 🔧 PROCEDURE: Adding New Articles with Wikipedia Content

When adding new banned substances or legal supplements that need Wikipedia content:

### Step 1: Add Substance Data

**For Banned Substances** - Edit `lib/data/banned-substances.json`:
```json
{
  "id": "unique-id",
  "slug": "substance-slug",
  "name": "Substance Name",
  "alternativeNames": ["Alt Name 1"],
  "category": "stimulant|nootropic|sarm|prohormone|other",
  "legalStatus": "banned_usa|restricted|controlled",
  "wikipediaSearchTerms": ["Exact Wikipedia Title", "Alternative Title"],
  // ... rest of required fields
}
```

**For Legal Supplements** - Edit `lib/data/legal-supplements.json`:
```json
{
  "id": "unique-id", 
  "slug": "supplement-slug",
  "name": "Supplement Name",
  "wikipediaSearchTerms": ["Exact Wikipedia Title"],
  // ... rest of required fields
}
```

### Step 2: Verify Wikipedia Article Exists
```bash
# Check if Wikipedia has an article (should return 200)
curl -I "https://en.wikipedia.org/api/rest_v1/page/summary/YOUR_TITLE"
```

### Step 3: Regenerate Article Data
```bash
# From project root
node scripts/refresh-article-data.js
```

This script will:
1. Read all substances from `banned-substances.json` and `legal-supplements.json`
2. For each substance, try to fetch Wikipedia content using `wikipediaSearchTerms`
3. Clean the HTML and calculate reading time
4. Fetch related PubMed research articles
5. Fetch related Wikimedia images
6. Save everything to `lib/data/substance-articles.json`

### Step 4: Verify Content
```bash
# Check if new article has content
node -e "const d = require('./lib/data/substance-articles.json'); 
const a = d.articles['your-slug']; 
console.log('Content:', a?.wikipedia?.fullContent?.length, 'chars');"
```

### Step 5: Build and Deploy
```bash
npm run build && npx vercel --prod
```

### Troubleshooting

**Article has no fullContent:**
1. Check `wikipediaSearchTerms` matches exact Wikipedia article title
2. The hb-reader service may have rate-limited - run script again later
3. Check Wikipedia article actually exists

**Empty brackets `[]` appearing:**
- The `cleanWikipediaHtml` function should handle this
- If new pattern appears, add regex to the final cleanup pass in `refresh-article-data.js`

**Content too long / page data warning:**
- Normal for large Wikipedia articles (e.g., Tianeptine = 236KB)
- Consider truncating or lazy-loading if performance issues

---

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

### 16. Drug Interaction Checker - Complete Rebuild (Nov 28, 2025)

**Overview**: Rebuilt the Drug Interaction Checker with a comprehensive curated database and OpenFDA fallback, replacing the non-functional old implementation.

#### Problem Statement
- Original implementation at `/medicines/interactions` pointed to a non-existent backend API
- "Check Interactions" button on `/medicines` linked to `/health` (wrong page)
- "Emergency Info" button linked to `/info/emergency` which was a 404

#### Solutions Implemented

##### 1. Emergency Info Page Created
**File**: `pages/info/emergency.tsx`
- Comprehensive emergency information page with:
  - Poison Control Center: 1-800-222-1222
  - 911 Emergency guidance
  - Overdose signs and symptoms
  - Naloxone (Narcan) information
  - What to tell emergency responders

##### 2. Navigation Buttons Fixed
**File**: `pages/medicines/index.tsx`
- Changed "Check Interactions" link from `/health` to `/medicines/interactions`
- Emergency Info link now works with the new page

##### 3. New Drug Interaction API
**File**: `pages/api/substances/openfda-interactions.ts`

**Architecture**:
```
User enters Drug A + Drug B
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Check Curated Database (40+ known interactions)         │
│ • Warfarin + Aspirin, Sertraline + Tramadol, etc.              │
│ • Includes: severity, mechanism, management                     │
│ • Drug class recognition (SSRIs+NSAIDs, Benzos+Opioids, etc.)  │
└─────────────────────────────────────────────────────────────────┘
        │ Not found?
        ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Check Drug Aliases (Brand → Generic mapping)            │
│ • Tylenol → Acetaminophen, Coumadin → Warfarin                 │
│ • Xanax → Alprazolam, Zoloft → Sertraline                      │
│ • 25+ common brand name mappings                                │
└─────────────────────────────────────────────────────────────────┘
        │ Not found?
        ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Query OpenFDA Drug Labels API                           │
│ • api.fda.gov/drug/label.json                                  │
│ • Searches drug_interactions field                              │
│ • Returns FDA label text with severity analysis                 │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
cleanFDAText() → Remove FDA label formatting
        │
        ▼
Return formatted interaction result
```

**Curated Interactions Include**:
| Drug A | Drug B | Severity | Reason |
|--------|--------|----------|--------|
| Warfarin | Aspirin/NSAIDs | Severe | Bleeding risk |
| SSRIs | Tramadol/MAOIs | Severe | Serotonin syndrome |
| Metformin | Alcohol | Moderate | Lactic acidosis |
| Statins | Grapefruit | Moderate | CYP3A4 inhibition |
| Levothyroxine | Calcium/Iron | Mild | Absorption reduction |
| ACE Inhibitors | Potassium | Moderate | Hyperkalemia |
| Benzos | Opioids | Severe | Respiratory depression |

**FDA Text Cleaning** (`cleanRawFDAText` function):
```javascript
// Removes:
- Section headers: "7 DRUG INTERACTIONS"
- Subsection headers: "Effects of X on Y Substrates"
- Reference citations: "[see Clinical Pharmacology (12.3)]"
- Section numbers: "(12.3)"
- Extra whitespace

// Extracts:
- Management recommendations
- Dosage adjustment advice
```

##### 4. Rebuilt Frontend UI
**File**: `pages/medicines/interactions.tsx`

**Features**:
- Two medication input fields with autocomplete (80+ common drugs)
- Swap button to reverse drug order
- Recent searches (localStorage)
- Quick-try examples (Warfarin+Aspirin, Sertraline+Tramadol, etc.)
- Severity color coding:
  - 🔴 Severe - Red badge, avoid combination
  - 🟠 Moderate - Orange badge, use caution
  - 🟡 Mild - Yellow badge, monitor
  - 🔵 Unknown - Blue badge, consult provider

**Results Display Cards**:
```
┌─────────────────────────────────────────┐
│ ⚠️ Moderate - Use Caution              │
│    piracetam + modafinil               │
│                          Source: FDA    │
├─────────────────────────────────────────┤
│ 📋 Description                          │
│ The clearance of drugs that are...     │
├─────────────────────────────────────────┤
│ 🔬 Mechanism of Interaction            │
│ This interaction involves drug...       │
├─────────────────────────────────────────┤
│ 🏥 Clinical Recommendation             │
│ Dosage adjustment should be...          │
├─────────────────────────────────────────┤
│ Source: FDA Drug Label (OpenFDA)        │
└─────────────────────────────────────────┘
```

**Information Cards**:
- "Tips for Safe Medication Use" - Keep medication list, use one pharmacy, etc.
- "When to Seek Immediate Help" - Bleeding, dizziness, breathing issues
- Link to Emergency Info page
- Severity level legend

#### Key Files Created/Modified
| File | Change |
|------|--------|
| `pages/info/emergency.tsx` | **Created** - Emergency info page |
| `pages/api/substances/openfda-interactions.ts` | **Created** - New comprehensive API |
| `pages/medicines/interactions.tsx` | **Rebuilt** - Complete UI overhaul |
| `pages/medicines/index.tsx` | Fixed button links |

#### API Response Format
```typescript
interface InteractionResponse {
  success: boolean;
  data: [{
    severity: 'severe' | 'moderate' | 'mild' | 'unknown';
    description: string;      // Cleaned FDA text or curated description
    mechanism?: string;       // How the interaction occurs
    management?: string;      // Clinical recommendations
    source: string;          // "Clinical Database" or "FDA Drug Label (OpenFDA)"
  }];
  drugA: string;
  drugB: string;
  sources?: string[];
}
```

#### Testing Examples
| Drug A | Drug B | Expected Result |
|--------|--------|-----------------|
| Warfarin | Aspirin | Severe - Bleeding risk (Curated) |
| Sertraline | Tramadol | Severe - Serotonin syndrome (Curated) |
| Coumadin | Advil | Severe - Recognizes brand names |
| Piracetam | Modafinil | Moderate - CYP3A4 induction (OpenFDA) |
| Caffeine | Water | Unknown - No interaction documented |

---

### 17. Phenibut Content Hub - Blue Ocean SEO Strategy (Nov 29, 2025)

**Overview**: Implemented a comprehensive Phenibut content hub following the Blue Ocean SEO strategy (pillar + cluster pages) that was successfully used for DMAA.

#### Blue Ocean SEO Strategy Explained
```
┌─────────────────────────────────────────────────────────────────────┐
│                    PILLAR + CLUSTER MODEL                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│              ┌──────────────────────────┐                           │
│              │    PILLAR PAGE           │                           │
│              │    /banned/phenibut      │                           │
│              │    (Comprehensive)       │                           │
│              └───────────┬──────────────┘                           │
│                          │                                           │
│     ┌────────────────────┼────────────────────┐                     │
│     │          │         │         │          │                     │
│     ▼          ▼         ▼         ▼          ▼                     │
│ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐                  │
│ │Cluster│ │Cluster│ │Cluster│ │Cluster│ │Cluster│                  │
│ │ Page  │ │ Page  │ │ Page  │ │ Page  │ │ Page  │                  │
│ │  #1   │ │  #2   │ │  #3   │ │  #4   │ │  #5   │                  │
│ └───┬───┘ └───┬───┘ └───┬───┘ └───┬───┘ └───┬───┘                  │
│     │         │         │         │         │                       │
│     └─────────┴─────────┴─────────┴─────────┘                       │
│                         │                                            │
│              (All link back to pillar)                               │
│                                                                      │
│  Benefits:                                                           │
│  • Pillar page ranks for competitive head terms                     │
│  • Cluster pages rank for long-tail keywords                        │
│  • Internal links pass authority both directions                    │
│  • Covers topic comprehensively (topical authority)                 │
└─────────────────────────────────────────────────────────────────────┘
```

#### Research Files Created
Located in `research/` folder:
| File | Content |
|------|---------|
| `phenibut-comprehensive-research.md` | Scientific mechanisms, pharmacology, clinical data |
| `phenibut-keywords.md` | Blue Ocean keyword opportunities (low KD, high value) |
| `phenibut-legal-status.md` | US federal, state, international legal status |
| `phenibut-products-alternatives.md` | Safe alternatives with clinical evidence |
| `phenibut-withdrawal-protocol.md` | Medical taper protocols, PAWS timeline |

#### Implementation Details

##### Pillar Page: `/banned/phenibut`
**Data file**: `lib/data/banned-substances.json` (updated phenibut entry)

**New Fields Added**:
```typescript
{
  isPillarPage: true,
  pillarSections: [
    {
      id: "what-is-phenibut",
      title: "What is Phenibut? Soviet Origins & How It Works",
      content: "<p>...</p><h3>...</h3><table>...</table>",  // Rich HTML
      keywords: ["phenibut mechanism of action", "how phenibut works"]
    },
    // ... 5 more sections
  ],
  faqs: [
    {
      question: "How long does phenibut withdrawal last?",
      answer: "Acute phenibut withdrawal typically peaks...",
      keywords: ["phenibut withdrawal duration", "phenibut withdrawal timeline"]
    },
    // ... 9 more FAQs
  ],
  citations: [
    {
      id: 1,
      authors: "Lapin I.",
      title: "Phenibut (β-Phenyl-GABA): A Tranquilizer and Nootropic Drug",
      journal: "CNS Drug Reviews",
      year: 2001,
      doi: "10.1111/j.1527-3458.2001.tb00211.x"
    },
    // ... 14 more citations
  ],
  relatedPages: [
    { type: "guide", slug: "phenibut-taper-schedule", title: "Safe Phenibut Tapering Schedule Guide" },
    { type: "guide", slug: "phenibut-paws-recovery-timeline", title: "Phenibut Withdrawal Timeline & PAWS Recovery" },
    { type: "guide", slug: "phenibut-withdrawal-warning-signs", title: "Phenibut Withdrawal Warning Signs: When to Seek Help" },
    { type: "guide", slug: "phenibut-baclofen-taper", title: "Phenibut to Baclofen Taper Protocol" },
    { type: "guide", slug: "phenibut-natural-withdrawal-support", title: "Natural Phenibut Withdrawal Support" },
    { type: "supplement", slug: "l-theanine", title: "L-Theanine: Safe Anxiety Alternative" },
    { type: "supplement", slug: "ashwagandha", title: "Ashwagandha: Natural Stress Support" },
    { type: "supplement", slug: "magnesium-glycinate", title: "Magnesium Glycinate: Sleep & Relaxation" }
  ]
}
```

**6 Pillar Sections**:
| # | Section ID | Title | Keywords Targeted |
|---|------------|-------|-------------------|
| 1 | `what-is-phenibut` | What is Phenibut? Soviet Origins & How It Works | phenibut mechanism, how phenibut works |
| 2 | `why-banned` | Why FDA Banned Phenibut (2019 Warning Letters) | phenibut FDA ban, phenibut warning letters |
| 3 | `withdrawal-syndrome` | Phenibut Withdrawal Syndrome: Symptoms & Severity | phenibut withdrawal symptoms, phenibut withdrawal timeline |
| 4 | `detection-testing` | Phenibut Drug Testing & Detection Windows | phenibut drug test, does phenibut show up on drug test |
| 5 | `legal-status-2025` | Phenibut Legal Status 2025: US & International | is phenibut legal, phenibut legal status |
| 6 | `safe-alternatives` | Safe Legal Alternatives to Phenibut | phenibut alternative, legal phenibut alternative |

**10 FAQs** (Schema.org FAQ structured data ready):
1. How long does phenibut withdrawal last?
2. Can phenibut withdrawal cause seizures?
3. Is phenibut legal in the United States?
4. Does phenibut show up on a drug test?
5. How do you safely taper off phenibut?
6. What does phenibut withdrawal feel like?
7. Can you die from phenibut withdrawal?
8. Why is phenibut so addictive?
9. What is the best natural alternative to phenibut?
10. How quickly can you become dependent on phenibut?

##### Cluster Pages (5 Guide Articles)
**Data file**: `lib/data/articles.json` (5 new entries added)

| # | Slug | Title | Target Keywords |
|---|------|-------|-----------------|
| 1 | `phenibut-taper-schedule` | Safe Phenibut Tapering Schedule: 50mg Daily Step-by-Step Guide [2025] | phenibut taper schedule, phenibut tapering protocol |
| 2 | `phenibut-paws-recovery-timeline` | Phenibut Withdrawal Timeline & PAWS Recovery: Week-by-Week Guide | phenibut PAWS, phenibut protracted withdrawal |
| 3 | `phenibut-withdrawal-warning-signs` | Phenibut Withdrawal Warning Signs: When to Seek Emergency Help | phenibut withdrawal symptoms, phenibut emergency |
| 4 | `phenibut-baclofen-taper` | Phenibut to Baclofen Taper Protocol: Conversion Guide [2025] | phenibut baclofen substitution, phenibut to baclofen ratio |
| 5 | `phenibut-natural-withdrawal-support` | Natural Phenibut Withdrawal Support: Supplements & Lifestyle [2025] | phenibut withdrawal supplements, natural phenibut alternatives |

**Article Structure** (ContentHubArticle type):
```typescript
{
  slug: "phenibut-taper-schedule",
  title: "Safe Phenibut Tapering Schedule: 50mg Daily Step-by-Step Guide [2025]",
  category: "guide",
  readingTime: "12 min read",
  lastUpdated: "2025-11-28",
  sections: [
    { id: "why-taper", title: "Why You Must Taper Phenibut (Never Quit Cold Turkey)", content: "..." },
    { id: "50mg-protocol", title: "The 50mg Daily Reduction Protocol", content: "..." },
    { id: "sample-schedules", title: "Sample Taper Schedules by Starting Dose", content: "..." },
    { id: "taper-too-fast", title: "Signs Your Taper is Too Fast", content: "..." }
  ],
  faqs: [...],
  citations: [...],
  relatedPages: [
    { type: "pillar", slug: "phenibut", title: "Complete Phenibut Guide" },
    // ... other related pages
  ]
}
```

#### Internal Linking Structure
```
                    ┌─────────────────────────┐
                    │    /banned/phenibut     │
                    │      (Pillar Page)      │
                    └───────────┬─────────────┘
                                │
           ┌────────────────────┼────────────────────┐
           │                    │                    │
           ▼                    ▼                    ▼
    Guide Articles       Supplement Pages      Comparison Pages
    ───────────────      ─────────────────     ─────────────────
    • /guide/phenibut-   • /supplement/        • /compare/
      taper-schedule       l-theanine            phenibut-vs-
    • /guide/phenibut-   • /supplement/          l-theanine
      paws-recovery        ashwagandha
    • /guide/phenibut-   • /supplement/
      withdrawal-          magnesium-
      warning-signs        glycinate
    • /guide/phenibut-
      baclofen-taper
    • /guide/phenibut-
      natural-support
           │
           └────────────────────┬────────────────────┘
                                │
                    (All link back to pillar via
                     relatedPages[type="pillar"])
```

#### SEO Features Implemented
- ✅ **Schema.org structured data**: MedicalWebPage for pillar, Article for guides
- ✅ **FAQ Schema**: 10 FAQs with expandable accordions
- ✅ **Table of Contents**: Auto-generated from sections + FAQs link
- ✅ **Citations**: 15 peer-reviewed sources for E-E-A-T signals
- ✅ **Year in title**: "[2025]" for freshness signals
- ✅ **Meta tags**: Custom title, description, keywords per page
- ✅ **Internal linking**: Bidirectional pillar ↔ cluster links
- ✅ **Age gate**: Phenibut is in AGE_RESTRICTED_SUBSTANCES array

#### Files Modified
| File | Changes |
|------|---------|
| `lib/data/banned-substances.json` | Expanded phenibut entry with `isPillarPage`, `pillarSections`, `faqs`, `citations`, `relatedPages` |
| `lib/data/articles.json` | Added 5 new guide articles for phenibut cluster pages |

#### Production URLs
- **Pillar**: https://www.blushandbreath.com/banned/phenibut
- **Cluster 1**: https://www.blushandbreath.com/guide/phenibut-taper-schedule
- **Cluster 2**: https://www.blushandbreath.com/guide/phenibut-paws-recovery-timeline
- **Cluster 3**: https://www.blushandbreath.com/guide/phenibut-withdrawal-warning-signs
- **Cluster 4**: https://www.blushandbreath.com/guide/phenibut-baclofen-taper
- **Cluster 5**: https://www.blushandbreath.com/guide/phenibut-natural-withdrawal-support

#### Build Stats
- Total static pages: 146
- New pages added: 6 (1 pillar update + 5 cluster articles)
- Build time: ~90 seconds

---

## 🔧 PROCEDURE: Adding New Content Hub (Blue Ocean SEO)

When creating a new pillar + cluster content hub like Phenibut/DMAA:

### Step 1: Research Phase
Create research files in `research/` folder:
```
research/
├── [substance]-comprehensive-research.md   # Scientific data
├── [substance]-keywords.md                 # Blue Ocean keyword analysis
├── [substance]-legal-status.md             # Legal/regulatory info
├── [substance]-products-alternatives.md    # Safe alternatives
└── [substance]-withdrawal-protocol.md      # Medical protocols (if applicable)
```

### Step 2: Update Pillar Page Data
Edit `lib/data/banned-substances.json`:
```json
{
  "slug": "substance-name",
  "isPillarPage": true,
  "pillarSections": [
    { "id": "section-1", "title": "...", "content": "<HTML>", "keywords": [] }
  ],
  "faqs": [
    { "question": "...", "answer": "...", "keywords": [] }
  ],
  "citations": [
    { "id": 1, "authors": "...", "title": "...", "journal": "...", "year": 2024, "doi": "..." }
  ],
  "relatedPages": [
    { "type": "guide", "slug": "...", "title": "..." },
    { "type": "supplement", "slug": "...", "title": "..." }
  ]
}
```

### Step 3: Create Cluster Articles
Edit `lib/data/articles.json` and add new entries:
```json
{
  "slug": "substance-topic-keyword",
  "title": "Title with [2025] for Freshness",
  "category": "guide",
  "sections": [...],
  "faqs": [...],
  "citations": [...],
  "relatedPages": [
    { "type": "pillar", "slug": "substance-name", "title": "Complete Guide" }
  ]
}
```

### Step 4: Build and Deploy
```bash
npm run build && npx vercel --prod
```

### Step 5: Verify Production
Test all URLs load correctly and internal links work.

---

### 18. SARMs Content Hub - Complete Implementation (Nov 29, 2025)

**Overview**: Implemented a massive content hub for SARMs (Selective Androgen Receptor Modulators) following the "Pillar + Cluster" SEO strategy. This hub targets high-intent medical, legal, and safety keywords to capture traffic and redirect users to safe legal alternatives.

#### Research Foundation
Based on 5 deep research reports located in `research/`:
- `sarms-keywords.md`: 50+ high-value keywords (Blue Ocean strategy)
- `sarms-legal-status.md`: 2025 regulatory landscape (FDA, WADA, DoD)
- `sarms-side-effects.md`: Medical review of DILI, suppression, and cancer risks
- `sarms-alternatives.md`: Evidence-based comparison of legal options
- `sarms-content-hub-structure.md`: Architecture blueprint

#### Implementation Details

##### Pillar Page: `/banned/sarms`
**Data file**: `lib/data/banned-substances.json` (updated SARMs entry)

**Key Features**:
- **Medical Authority**: Detailed sections on Drug-Induced Liver Injury (DILI), Testosterone Suppression, and Cardarine Cancer Risk.
- **Legal Clarity**: Explains the "Unapproved New Drug" status vs. Controlled Substance confusion, plus Military/WADA bans.
- **Rich Content**: 6 Pillar Sections, 6 FAQs, 6 Clinical Citations.
- **Conversion Focus**: Promotes "Tier 1" legal alternatives (Creatine, Phosphatidic Acid, Tongkat Ali).

##### Cluster Pages (10 New Articles)
**Data file**: `lib/data/articles.json`

| # | Slug | Title | Focus |
|---|------|-------|-------|
| 1 | `sarms-side-effects` | SARMs Side Effects: Medical Evidence & Health Risks | DILI, Vision Issues, Cancer |
| 2 | `are-sarms-legal` | Are SARMs Legal? 2025 Legal Status & Enforcement | FDA, SARMs Control Act, State Laws |
| 3 | `sarms-pct-guide` | SARMs Post-Cycle Therapy (PCT) Protocol | Recovery, SERMs, Protocols |
| 4 | `sarms-vs-steroids` | SARMs vs Steroids: Differences & Risks | Safety comparison, Efficacy |
| 5 | `ostarine-vs-ligandrol-vs-rad140` | Ostarine vs Ligandrol vs RAD-140 Comparison | Compound selection guide |
| 6 | `legal-alternatives-to-sarms` | Legal Alternatives to SARMs | Creatine, PA, Tongkat Ali evidence |
| 7 | `sarms-testosterone-suppression` | SARMs & Testosterone Suppression | HPG Axis impact, Recovery |
| 8 | `sarms-liver-hepatotoxicity` | SARMs & Liver Health: Hepatotoxicity | Clinical case studies of liver injury |
| 9 | `sarms-stacking-guide` | SARM Stacking Guide | Safety warnings, synergy risks |
| 10 | `sarms-banned-military-sports` | Military & Sports SARMs Bans | DoD Instruction 6130.06, WADA |

#### Internal Linking Strategy
- **Pillar (`/banned/sarms`)** links to all 10 cluster pages.
- **Cluster Pages** link back to the Pillar and to relevant sibling clusters (e.g., "Side Effects" links to "PCT Guide").
- **Product Integration**: All pages feature "Legal Alternative" cards pointing to affiliate products (Transparent Labs, etc.).

#### Production URLs
- **Pillar**: https://www.blushandbreath.com/banned/sarms
- **Cluster Example**: https://www.blushandbreath.com/guide/sarms-side-effects

---

### 19. Kratom Content Hub - Harm Reduction Strategy (Nov 28, 2025)

**Overview**: Implemented a massive Kratom content hub focusing on harm reduction, legal status clarity, and safe tapering protocols. This addresses the high search volume for "kratom withdrawal" and "is kratom legal".

#### Implementation Details

##### Pillar Page: `/banned/kratom`
**Data file**: `lib/data/banned-substances.json`

**Key Features**:
- **Legal Map**: Detailed breakdown of 7 banned states vs. 15+ KCPA regulated states.
- **Safety Data**: CDC overdose stats, seizure risks, and contamination warnings.
- **Taper Protocol**: The "10% Weekly Reduction" method.
- **Rich Content**: 6 Pillar Sections, 6 FAQs, 6 Citations.

##### Cluster Pages (7 Articles)
**Data file**: `lib/data/articles.json`

| # | Slug | Title | Focus |
|---|------|-------|-------|
| 1 | `kratom-withdrawal-timeline` | Kratom Withdrawal Timeline Day-by-Day | Acute vs PAWS phases |
| 2 | `kratom-taper-protocol` | How to Taper Off Kratom Safely | Step-by-step reduction guide |
| 3 | `kratom-withdrawal-supplements` | Supplements for Kratom Withdrawal | Magnesium, Vit C, Black Seed Oil |
| 4 | `kratom-legal-states-2025` | Kratom Legal Status Map 2025 | State-by-state laws (SB 154, etc.) |
| 5 | `kratom-drug-test` | Does Kratom Show Up on Drug Tests? | 5-panel vs specialized testing |
| 6 | `kratom-alternatives-pain` | Natural Kratom Alternatives for Pain | Safe legal options |
| 7 | `kratom-alternatives-energy` | Kratom Alternatives for Energy | Caffeine, Theanine, Rhodiola |

#### Production URLs
- **Pillar**: https://www.blushandbreath.com/banned/kratom
- **Cluster Example**: https://www.blushandbreath.com/guide/kratom-legal-states-2025

---

### 20. DMAA Content Hub - Blue Ocean SEO Strategy (Nov 27, 2025)

**Overview**: The first implementation of the "Pillar + Cluster" strategy, targeting the banned stimulant DMAA.

#### Implementation Details

##### Pillar Page: `/banned/dmaa`
**Data file**: `lib/data/banned-substances.json`

**Key Features**:
- **History**: From 1944 nasal decongestant to 2013 FDA ban.
- **Safety**: Documented deaths (London Marathon, Fort Bliss) and stroke risks.
- **Drug Testing**: Explanation of false positives for amphetamines.

##### Cluster Pages (2 Articles)
**Data file**: `lib/data/articles.json`

| # | Slug | Title | Focus |
|---|------|-------|-------|
| 1 | `dmaa-drug-testing-guide` | DMAA Drug Testing: False Positives | Military/Employment testing risks |
| 2 | `banned-pre-workouts-2025` | Complete List of Banned Pre Workouts | Jack3d, OxyElite Pro, etc. |

#### Production URLs
- **Pillar**: https://www.blushandbreath.com/banned/dmaa
- **Cluster Example**: https://www.blushandbreath.com/guide/dmaa-drug-testing-guide

---

### 21. Performance Optimization - Font & Bundle Fixes (Nov 30, 2025)

**Overview**: Major performance improvements reducing page load by 3.5MB through font optimization and JavaScript bundle fixes.

#### Problem Identified
- DMAA pillar page had 4.7MB network payload causing 55/100 mobile performance score
- **Root Cause 1**: Material Symbols variable font was 3.7MB (80% of total payload)
- **Root Cause 2**: `lib/data` bundle leak - JSON files bundled into client JS (~400KB)

#### Fix 1: Material Symbols Font (Global - ALL Pages)
**File**: `pages/_document.tsx`

```typescript
// BEFORE (3.7MB variable font with all axes):
Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200

// AFTER (297KB static font with fixed values):
Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap
```

- **Savings**: 3.4MB (92% reduction)
- **Affects**: All 165+ pages site-wide
- **Icons used**: ~110 icons (static font sufficient for all)

#### Fix 2: lib/data Bundle Leak (Banned Pages Only)
**File**: `pages/banned/[slug].tsx`

```typescript
// BEFORE (bundles entire lib/data into client JS):
import { getAffiliateProductsForSupplement } from '@/lib/data';
topProduct={getAffiliateProductsForSupplement(alternatives[0].slug)[0]}

// AFTER (fetches via API hook, no bundle leak):
const { data: affiliateProducts } = useAffiliateProducts(alternatives?.[0]?.slug);
topProduct={affiliateProducts?.[0]}
```

- **Savings**: ~400KB of JSON removed from client bundle
- **Root cause**: Direct function call in component caused Webpack to bundle entire `lib/data/index.ts` module

#### Results (DMAA Page Lighthouse Scores)
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Mobile Performance | 55 | **69** | +14 points |
| Desktop Performance | 62 | **98** | +36 points |
| Mobile LCP | 25.1s | **5.0s** | 5x faster |
| Mobile TBT | 190ms | **0ms** | Perfect |
| Font Payload | 3.7MB | **297KB** | 92% smaller |
| SEO Score | 100 | **100** | Maintained |

#### Other Pages Status
| Page Type | Pattern Used | Bundle Leak? |
|-----------|--------------|--------------|
| `/banned/[slug]` | ✅ Fixed - uses `useAffiliateProducts` hook | No |
| `/supplement/[slug]` | Already uses `useAffiliateProducts` hook | No |
| `/compare/[slug]` | Uses lib/data only in `getStaticProps` (tree-shaken) | No |
| `/guide/[slug]` | Uses lib/data only in `getStaticProps` (tree-shaken) | No |

#### Key Learnings
1. **Variable fonts are HUGE** - Only use if you need multiple weights/styles. Static fonts with fixed values are 10-15x smaller.
2. **Tree-shaking only works for server-side code** - If you import a function in a React component, the entire module gets bundled.
3. **Use hooks for client-side data fetching** - The `useAffiliateProducts` pattern fetches via API and avoids bundling JSON.

---

## 22. Bing IndexNow Integration (Nov 30, 2025)

### Purpose
To accelerate Bing indexing of priority URLs using IndexNow API, as Bing was showing "No results" while Google had already indexed 10+ pages.

### Implementation
**IndexNow Key**: `d8df54ad1c1949f6b6511cd1bc69a6c9`
**Key Location**: `https://www.blushandbreath.com/d8df54ad1c1949f6b6511cd1bc69a6c9.txt`

#### Steps Completed
1. **Added IndexNow key file** to `public/` directory
2. **Built and deployed** to Vercel production
3. **Submitted 50 priority URLs** via IndexNow API in 5 batches:
   - Homepage + Main pillar pages (DMAA, Phenibut, Kratom, SARMs)
   - Guide articles (Kratom, DMAA, Phenibut guides)
   - Supplements + Info pages (About, FAQ, Contact)
   - More banned substances (Cardarine, DMHA, Ostarine, etc.)
   - Comparison pages + SARMs guides
4. **Committed key file** to Git and pushed to main branch

#### PowerShell Command Used
```powershell
$body = @{host='www.blushandbreath.com';key='d8df54ad1c1949f6b6511cd1bc69a6c9';keyLocation='https://www.blushandbreath.com/d8df54ad1c1949f6b6511cd1bc69a6c9.txt';urlList=@('URL1','URL2',...)} | ConvertTo-Json; Invoke-RestMethod -Uri 'https://api.indexnow.org/indexnow' -Method POST -Body $body -ContentType 'application/json; charset=utf-8'
```

### Expected Timeline
| Timeline | Expected Action |
|----------|-----------------|
| Within hours | Bing receives and queues URLs |
| 1-3 days | Bing crawls submitted URLs |
| 3-7 days | URLs start appearing in Bing index |

### URLs Submitted (50 Total)
- Homepage: `https://www.blushandbreath.com/`
- Banned substances: DMAA, Phenibut, Kratom, SARMs, Ephedrine, Clenbuterol, Tianeptine, Cardarine, DMHA, Ostarine, Andarine, Yohimbine, Higenamine, Vinpocetine, Picamilon, Synephrine, Hordenine, Octopamine
- Supplements: Caffeine, L-Theanine, Creatine Monohydrate, Ashwagandha, Rhodiola Rosea, Beta-Alanine, Magnesium Glycinate, Lion's Mane
- Guides: Kratom legal states, DMAA drug testing, Phenibut withdrawal, Kratom withdrawal, Banned pre-workouts 2025, SARMs side effects, Legal alternatives to SARMs, Kratom taper protocol, Phenibut taper schedule, Kratom drug test, Kratom alternatives (pain & energy), Phenibut legal status, SARMs stacking, SARMs testosterone suppression, SARMs liver toxicity, SARMs banned military/sports, SARMs drug testing
- Info pages: About, FAQ, Contact
- Medicine database: `/medicines`
- Comparisons: DMAA vs Caffeine, Phenibut vs Ashwagandha, Kratom vs L-Theanine, SARMs vs Creatine, Ephedrine vs Caffeine

### Future Use
The IndexNow key is now permanently deployed. Use the same PowerShell command to submit new URLs when adding content to the site.

---

---

## 📋 PAST ISSUES & LESSONS LEARNED

This section documents issues that were encountered and fixed. AI agents should be aware of these to avoid repeating mistakes.

### Issue #1: www vs non-www URL Mismatch (Nov 29, 2025)

**Problem**: Google Search Console reported "Redirect error" for `/banned/dmaa` and other pages.

**Root Cause**: 
- Sitemap URLs used `https://blushandbreath.com` (non-www)
- Server redirected to `https://www.blushandbreath.com` (www)
- Google saw this as a redirect loop/error

**Files Fixed**:
- `next-sitemap.config.js` - Changed `siteUrl` to `https://www.blushandbreath.com`
- `public/robots.txt` - Changed `Host` and `Sitemap` directives
- `components/SEO/MetaHead.tsx` - Changed `SITE_URL` constant
- `components/SEO/SchemaMarkup.tsx` - Changed `SITE_URL` constant
- All page files with hardcoded canonical URLs

**Lesson**: ALWAYS use the www version of the domain everywhere.

### Issue #2: Homepage Missing SEO Tags (Nov 29, 2025)

**Problem**: Homepage (`pages/index.tsx`) had no canonical URL, no Open Graph tags.

**Fix**: Added complete SEO meta tags to `pages/index.tsx`:
```tsx
<link rel="canonical" href="https://www.blushandbreath.com/" />
<meta property="og:url" content="https://www.blushandbreath.com/" />
<meta property="og:title" content="..." />
```

### Issue #3: robots.txt Blocking JavaScript (Nov 29, 2025)

**Problem**: Google couldn't render pages properly because `/_next/` was blocked.

**Fix**: Updated robots.txt to explicitly allow `/_next/static/`:
```
Allow: /_next/static/
```

### Issue #4: Date Hydration Mismatch (Nov 29, 2025)

**Problem**: Pages with dates showed React hydration errors because server and client rendered different date strings.

**Fix**: Pre-compute formatted dates in `getStaticProps` with UTC timezone:
```typescript
const formattedDate = new Date(date).toLocaleDateString('en-US', {
  month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC'
});
```

### Issue #5: Secrets Committed to Git (Nov 29, 2025)

**Problem**: GitHub blocked push due to eBay/Unsplash API keys in `wrangler.backend.toml`.

**Fix**:
1. Removed secrets from `wrangler.backend.toml`
2. Updated `.gitignore` to exclude all `.env.*` files
3. Used `git rm --cached` to remove tracked `.env` files
4. Secrets now set via `wrangler secret put` CLI command

### Issue #6: API XHR Blocked by robots.txt (Nov 29, 2025)

**Problem**: Google URL Inspection showed "1/24 resources blocked" for API calls like `/api/substances/banned/kratom`.

**Resolution**: This is EXPECTED behavior and NOT a problem. The API endpoints are intentionally blocked because:
1. Pages use SSG (Static Site Generation) - content is pre-rendered
2. API calls are only for client-side interactivity
3. Google says "Page can be indexed" - the content is available

---

---

### 23. Enhanced Article Schema for Rich Results (Dec 3, 2025)

**Overview**: Comprehensive enhancement of the Article schema in `SchemaMarkup.tsx` to maximize Google Rich Results eligibility and voice search optimization.

#### Problem Statement
- Original Article schema was basic with only title, description, author
- Missing critical fields for Google's enhanced understanding
- No speakable markup for voice search
- No structured content breakdown

#### Schema Enhancements Implemented

**File**: `components/SEO/SchemaMarkup.tsx` - `generateArticleSchema()` function

| Field | Purpose | Implementation |
|-------|---------|----------------|
| `articleBody` | Full article text | Extracted from all sections |
| `hasPart` | TOC structure | 7 WebPageElements (intro, sections, FAQ, sources, alternatives, medical disclaimer, conclusion) |
| `speakable` | Voice search | CSS selectors for key sections |
| `about` | Topic entities | Keywords converted to Thing entities |
| `citation` | Authority signals | ScholarlyArticle with author, journal, DOI |
| `isAccessibleForFree` | Content access | `true` |
| `inLanguage` | Language code | `en-US` |
| `copyrightYear` | Copyright | Current year |
| `wordCount` | Content length | Calculated from articleBody |

#### Schema Structure
```typescript
{
  "@type": "Article",
  "headline": "...",
  "articleBody": "Full concatenated text from all sections...",
  "wordCount": 5000,
  "hasPart": [
    { "@type": "WebPageElement", "name": "Introduction", "cssSelector": "#introduction" },
    { "@type": "WebPageElement", "name": "Section 1", "cssSelector": "#section-1" },
    // ... 7 total parts
  ],
  "speakable": {
    "@type": "SpeakableSpecification",
    "cssSelector": ["#introduction", ".key-points", ".faq-section"]
  },
  "about": [
    { "@type": "Thing", "name": "keyword1" },
    { "@type": "Thing", "name": "keyword2" }
  ],
  "citation": {
    "@type": "ScholarlyArticle",
    "name": "Primary Source Title",
    "author": { "@type": "Person", "name": "Author Name" },
    "publisher": { "@type": "Organization", "name": "Journal Name" },
    "sameAs": "https://doi.org/..."
  },
  "isAccessibleForFree": true,
  "inLanguage": "en-US",
  "copyrightYear": 2025
}
```

#### Google Rich Results Test Verification
- **All 5 priority articles pass** with 7 valid items detected
- **Detected schemas**: Article, FAQ, BreadcrumbList
- **Non-critical issues**: Only in optional ScholarlyArticle fields (expected)
- **Report**: `STRUCTURED_DATA_VERIFICATION_REPORT.md`

#### Articles Tested
1. `/guide/natural-steroids-guide` ✅
2. `/guide/dbal-max-review-2025` ✅
3. `/guide/pregnancy-safe-pre-workout` ✅
4. `/guide/best-legal-steroids-cutting` ✅
5. `/guide/breastfeeding-safe-pre-workout` ✅

---

### 24. Priority Sitemap Architecture (Dec 3, 2025)

**Overview**: Created a separate high-priority sitemap (`sitemap-priority.xml`) for 8 key URLs to enable independent crawling and faster indexing.

#### Architecture
```
┌─────────────────────────────────────────────────────────────────────┐
│                    SITEMAP STRUCTURE                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  robots.txt                                                          │
│  └── Sitemap: sitemap.xml (index)                                   │
│  └── Sitemap: sitemap-priority.xml (priority URLs)                  │
│                                                                      │
│  sitemap.xml (Index)                                                 │
│  └── sitemap-0.xml (158 URLs - main content)                        │
│                                                                      │
│  sitemap-priority.xml (8 URLs - high priority)                      │
│  ├── 5 SEO Articles (priority: 1.0)                                 │
│  │   ├── /guide/natural-steroids-guide                              │
│  │   ├── /guide/dbal-max-review-2025                                │
│  │   ├── /guide/pregnancy-safe-pre-workout                          │
│  │   ├── /guide/best-legal-steroids-cutting                         │
│  │   └── /guide/breastfeeding-safe-pre-workout                      │
│  └── 3 Buy Pages (priority: 0.9)                                    │
│      ├── /buy/berberine-india                                       │
│      ├── /buy/clenbuterol-india                                     │
│      └── /buy/dmaa-india                                            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

#### Files Created/Modified

| File | Action | Purpose |
|------|--------|----------|
| `public/sitemap-priority.xml` | Created | 8 high-priority URLs with XML namespaces |
| `next-sitemap.config.js` | Modified | Added exclusions + additionalSitemaps |
| `public/robots.txt` | Auto-generated | Now includes both sitemaps |

#### next-sitemap.config.js Changes
```javascript
// Added at top of file:
const PRIORITY_GUIDE_SLUGS = [
  'natural-steroids-guide',
  'dbal-max-review-2025',
  'pregnancy-safe-pre-workout',
  'best-legal-steroids-cutting',
  'breastfeeding-safe-pre-workout',
];

const PRIORITY_BUY_SLUGS = [
  'berberine-india',
  'clenbuterol-india',
  'dmaa-india',
];

// Added to exclude array:
exclude: [
  // ... existing excludes
  '/guide/natural-steroids-guide',
  '/guide/dbal-max-review-2025',
  // ... all 8 priority URLs
],

// Added to robotsTxtOptions:
additionalSitemaps: [
  'https://www.blushandbreath.com/sitemap-priority.xml',
],
```

#### Google Search Console Status
| Sitemap | Discovered Pages | Status | Last Read |
|---------|------------------|--------|------------|
| `sitemap-priority.xml` | **8** | ✅ Success | Dec 3, 2025 |
| `sitemap.xml` (index) | 158 | ✅ Success | Dec 3, 2025 |

#### When to Add URLs to Priority Sitemap
Add a URL to `sitemap-priority.xml` when:
- It's a new monetization page (affiliate/buy pages)
- It's a high-value SEO article targeting competitive keywords
- It needs faster indexing than the standard sitemap
- It's a pillar page for a content hub

#### Procedure: Adding New Priority URLs
1. Add URL entry to `public/sitemap-priority.xml`
2. Add slug to `PRIORITY_GUIDE_SLUGS` or `PRIORITY_BUY_SLUGS` in `next-sitemap.config.js`
3. Add full path to `exclude` array in `next-sitemap.config.js`
4. Run `npm run build && npx vercel --prod`
5. Verify at https://www.blushandbreath.com/sitemap-priority.xml

---

### 25. New SEO Articles & Buy Pages (Dec 3, 2025)

**Overview**: Added 5 new comprehensive SEO articles targeting high-value fitness/supplement keywords, plus 3 Amazon affiliate buy pages.

#### New Articles Added (`lib/data/articles.json`)

| # | Slug | Title | Target Keywords |
|---|------|-------|------------------|
| 1 | `natural-steroids-guide` | Natural Steroids Guide 2025 | natural steroids, legal steroids, steroid alternatives |
| 2 | `dbal-max-review-2025` | D-Bal Max Review 2025 | dbal max review, d-bal max, legal dianabol |
| 3 | `pregnancy-safe-pre-workout` | Pregnancy Safe Pre-Workout Guide | pre workout while pregnant, safe pre workout pregnancy |
| 4 | `best-legal-steroids-cutting` | Best Legal Steroids for Cutting | legal steroids for cutting, cutting supplements |
| 5 | `breastfeeding-safe-pre-workout` | Breastfeeding Safe Pre-Workout | pre workout while breastfeeding, nursing mom supplements |

**Article Features**:
- ✅ Comprehensive sections with rich HTML content
- ✅ FAQ sections with Schema.org markup
- ✅ Medical citations (15+ per article)
- ✅ Internal links to pillar pages and supplements
- ✅ Affiliate product recommendations
- ✅ Enhanced Article schema (see Section 23)

#### New Buy Pages Added (`lib/data/buy-pages.json`)

| # | Slug | Product Focus | Affiliate |
|---|------|---------------|------------|
| 1 | `berberine-india` | Berberine supplements | Amazon India |
| 2 | `clenbuterol-india` | Legal Clenbuterol alternatives | Amazon India |
| 3 | `dmaa-india` | DMAA pre-workout alternatives | Amazon India |

**Buy Page Features**:
- ✅ Product comparison tables
- ✅ Price/value analysis
- ✅ Safety warnings and disclaimers
- ✅ Amazon affiliate links with disclosure
- ✅ Related article links

#### Production URLs
**Articles**:
- https://www.blushandbreath.com/guide/natural-steroids-guide
- https://www.blushandbreath.com/guide/dbal-max-review-2025
- https://www.blushandbreath.com/guide/pregnancy-safe-pre-workout
- https://www.blushandbreath.com/guide/best-legal-steroids-cutting
- https://www.blushandbreath.com/guide/breastfeeding-safe-pre-workout

**Buy Pages**:
- https://www.blushandbreath.com/buy/berberine-india
- https://www.blushandbreath.com/buy/clenbuterol-india
- https://www.blushandbreath.com/buy/dmaa-india

#### Build Stats (Dec 3, 2025)
- Total static pages: 175
- New pages added: 8 (5 articles + 3 buy pages)
- Build time: ~95 seconds

---

*Last updated: December 3, 2025 (Enhanced Article Schema, Priority Sitemap Architecture, 5 New SEO Articles, 3 Buy Pages, Google Rich Results Verification)*
