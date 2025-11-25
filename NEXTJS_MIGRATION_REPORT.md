# Next.js Migration Analysis Report

## 1. Project Root Files & Folders

### Configuration Files
- **`package.json`** — NPM config, scripts, dependencies
- **`vite.config.ts`** — Vite bundler configuration with proxy setup
- **`tailwind.config.js`** — TailwindCSS theme/plugins
- **`postcss.config.js`** — PostCSS configuration
- **`tsconfig.json`** — TypeScript configuration
- **`playwright.config.js`** — E2E test configuration

### Environment Files
- **`.env.local`** — Local environment variables (61 bytes)
- **`.env.production`** — Production environment variables (117 bytes)

### Entry Points
- **`index.html`** — HTML template
- **`index.tsx`** — React root mount with providers
- **`App.tsx`** — Main app component with routing

### Cloudflare Deployment
- **`wrangler.toml`** — Pages config
- **`wrangler.backend.toml`** — Backend Worker config
- **`wrangler.pages.toml`** — Pages-specific config
- **`_worker.js`** — Cloudflare Worker backend (105KB)
- **`functions/api/`** — Cloudflare Pages Functions proxy

### Other Root Items
- **`constants.ts`**, **`types.ts`** — Shared constants & types
- **`dist/`** — Build output
- **`server/`** — Local dev server (3 items)
- **`mockups/`**, **`most important docs/`** — Documentation

---

## 2. Source Structure

### Page Components — `pages/`
| File | Route |
|------|-------|
| `HomePage.tsx` | `/` |
| `HealthPage.tsx` | `/health` |
| `BeautyPageEbay.tsx` | `/beauty` |
| `BeautyProductDetailPage.tsx` | `/beauty/product/:itemId` |
| `HealthStorePageEbay.tsx` | `/health-store` |
| `HealthProductDetailPageEbay.tsx` | `/health-store/product/:itemId` |
| `NutritionPage.tsx` | `/nutrition` |
| `VideosPage.tsx` | `/videos` |
| `ArticlePage.tsx` | `/article/:id` |
| `ProductPage.tsx` | `/product/:id` |
| `BookmarksPage.tsx` | `/bookmarks` |
| `InfoPage.tsx` | `/info/:slug` |
| `BeautyPage.tsx` | *(unused legacy)* |

### Reusable UI Components — `components/` (36 total)
**Layout/Navigation:**
- `Header.tsx`, `Footer.tsx`, `PageWrapper.tsx`

**Core UI:**
- `ArticleCard.tsx`, `ProductCard.tsx`, `VideoCard.tsx`, `NutritionCard.tsx`, `TutorialCard.tsx`
- `SearchModal.tsx`, `OffersModal.tsx`, `NewsletterModal.tsx`, `VideoPlayer.tsx`
- `BookmarkButton.tsx`, `ThemeToggle.tsx`, `SocialShare.tsx`, `Toast.tsx`

**Feature Components:**
- `DailyGoals.tsx`, `FoodComparison.tsx`, `MealPlanner.tsx`, `NutritionSearch.tsx`
- `NutritionHero.tsx`, `NutrientEducation.tsx`, `PersonalizedRecommendations.tsx`
- `ProgressDashboard.tsx`, `ProfileSetup.tsx`, `UserProfile.tsx`
- `MiniCart.tsx`, `CartStatusBadge.tsx`, `RateLimitTracker.tsx`, `ReadingProgressBar.tsx`

**Utility:**
- `ErrorBoundary.tsx`, `ErrorMessage.tsx`, `LoadingSpinner.tsx`

**Skeletons — `components/skeletons/`:**
- `ArticleCardSkeleton.tsx`, `ProductCardSkeleton.tsx`, `VideoCardSkeleton.tsx`

### API/Service Functions — `services/`
| File | Purpose |
|------|---------|
| `apiService.ts` | Main API layer (58KB) — News, YouTube, eBay, Nutrition APIs |
| `pubmedService.ts` | PubMed article fetching |
| `rssService.ts` | RSS feed parsing |
| `fullArticle.ts` | Full article content fetching |
| `contentGenerator.ts` | AI content generation |
| `mockApiService.ts` | Mock data (empty) |

### Custom Hooks — `hooks/`
| File | Purpose |
|------|---------|
| `useApi.ts` | Generic async data fetching |
| `useBookmarks.tsx` | Bookmark context provider |
| `useTheme.tsx` | Dark/light theme provider |
| `useInfiniteScroll.ts` | Infinite scroll logic |
| `useNutritionCart.tsx` | Nutrition cart state |
| `useUserProfile.tsx` | User profile management |
| `useComparison.tsx` | Food comparison feature |

### Utils — `utils/`
- `productUtils.ts` — Product data utilities (4.7KB)

### Types — `types/`
- `ebay.ts` — eBay API types
- `types.ts` (root) — Shared app types

### Static Assets
- **No `public/` folder** — Images use external CDN URLs
- **No `src/assets/`** — All images are fetched from APIs or external URLs
- Build output: `dist/assets/` (Vite-generated)

---

## 3. Key Dependencies

```json
{
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-router-dom": "^7.9.6",
    "fast-xml-parser": "^5.3.2",
    "rss-parser": "^3.13.0",
    "playwright": "^1.56.1"
  },
  "devDependencies": {
    "vite": "^6.2.0",
    "@vitejs/plugin-react": "^5.0.0",
    "typescript": "~5.8.2",
    "tailwindcss": "^3.4.18",
    "autoprefixer": "^10.4.22",
    "postcss": "^8.5.6",
    "@playwright/test": "^1.56.1"
  }
}
```

### Key Observations
- **HTTP client:** Native `fetch` (no axios)
- **Styling:** TailwindCSS 3.x with custom theme colors
- **State management:** React Context only (useTheme, useBookmarks, useNutritionCart)
- **No framer-motion or animation libraries**
- **React 19 (latest)**

---

## 4. Routing Logic

**Router:** `HashRouter` from react-router-dom v7 (uses `#/` URLs)

**Location:** `App.tsx`

**Pattern:**
```tsx
<HashRouter>
  <Suspense fallback={<LoadingSpinner />}>
    <Routes>
      <Route path="/" element={<PageWrapper><HomePage /></PageWrapper>} />
      <Route path="/health" element={...} />
      <Route path="/beauty" element={...} />
      <Route path="/beauty/product/:itemId" element={...} />
      {/* ... 12 total routes */}
    </Routes>
  </Suspense>
</HashRouter>
```

**Features:**
- **Lazy loading** via `React.lazy()` for all page components
- **Suspense** boundary for loading states
- **PageWrapper** component wraps all routes (likely for layout/scroll reset)
- **Dynamic routes:** `:itemId`, `:id`, `:slug` parameters

---

## 5. Environment Variables

**Access Pattern:** Vite's `import.meta.env`

**Variables Used:**
| Variable | Location |
|----------|----------|
| `VITE_NEWSAPI_KEY` | `apiService.ts`, `vite.config.ts` |
| `VITE_YOUTUBE_API_KEY` | `apiService.ts` |
| `VITE_API_NINJAS_KEY` | `apiService.ts`, `vite.config.ts` |
| `GEMINI_API_KEY` | `vite.config.ts` (mapped to `process.env`) |

**Dev vs Prod Detection:**
```ts
const IS_DEV = import.meta.env.DEV;
```

**Proxy Configuration (dev only):**
- `/api` → `http://localhost:3003`
- `/newsapi` → `https://newsapi.org`
- `/ninjas` → `https://api.api-ninjas.com/v1`

---

## Migration Considerations Summary

| Area | Current | Next.js Equivalent |
|------|---------|-------------------|
| Router | HashRouter (client) | App Router or Pages Router |
| Pages | `pages/*.tsx` | `app/*/page.tsx` or `pages/*.tsx` |
| API calls | Vite proxy + CF Workers | API Routes (`app/api/`) |
| Env vars | `import.meta.env.VITE_*` | `process.env.NEXT_PUBLIC_*` |
| Lazy loading | `React.lazy()` | Automatic with App Router |
| Build | Vite | Next.js built-in |
| Deployment | Cloudflare Pages + Workers | Vercel/Cloudflare Pages adapter |
