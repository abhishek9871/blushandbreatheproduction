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
│   │   └── youtube/videos.ts  # YouTube API proxy
│   ├── medicine/              # Medicine detail pages
│   │   └── [slug].tsx         # Dynamic medicine page (ISR)
│   ├── medicines/             # MediVault section
│   │   ├── index.tsx          # Medicine encyclopedia home
│   │   └── search.tsx         # Intelligent search (Indian + FDA)
│   ├── info/                  # Footer info pages (SEO optimized)
│   │   ├── about.tsx          # Our Story
│   │   ├── careers.tsx        # Careers page
│   │   ├── press.tsx          # Press & Media
│   │   ├── contact.tsx        # Contact form
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
│       ├── banned-substances.json    # 8 banned substances
│       ├── legal-supplements.json    # Legal alternatives
│       ├── affiliate-products.json   # 19 affiliate products
│       └── index.ts                  # Data access functions
├── types/                     # TypeScript types
│   └── substance.ts           # MedicineInfo, DrugInteraction, BannedSubstance types
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
| `banned-substances.json` | Banned/dangerous substances | 8 substances |
| `legal-supplements.json` | Safe legal alternatives | Multiple supplements |
| `affiliate-products.json` | Affiliate product recommendations | 19 products |
| `index.ts` | Data access & search functions | - |

#### Banned Substances Covered
| Substance | Category | Status | Why Banned |
|-----------|----------|--------|------------|
| **DMAA** | Stimulant | FDA Banned (2013) | 5 deaths, cardiovascular risks |
| **Phenibut** | Nootropic | FDA Banned (2019) | 1,320 poison cases, severe withdrawal |
| **Kratom** | Other | Restricted (7 states) | 91 overdose deaths, opioid-like |
| **SARMs** | SARM | Unapproved drug | Felony charges, liver toxicity |
| **Ephedrine** | Stimulant | FDA Banned (2004) | 155 deaths, cardiac events |
| **Clenbuterol** | Stimulant | Not for humans | Veterinary only, cardiac hypertrophy |
| **Cardarine** | Other | Never approved | Cancer at ALL doses in studies |
| **Nandrolone** | Prohormone | Schedule III | Controlled substance, felony |

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
*Last updated: November 27, 2025 (Indian Medicines Database 254K, Intelligent Search, Banned Substances Encyclopedia with Affiliate Products)*
