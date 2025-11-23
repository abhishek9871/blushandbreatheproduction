# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a health & beauty hub application built with React, TypeScript, and Vite. The app aggregates content from multiple sources including health articles (PubMed), beauty products (eBay API), nutrition information (API Ninjas), and YouTube videos. It features a Cloudflare Worker backend for proxy/content processing and uses a HashRouter for client-side routing.

## Development Commands

### Local Development
```bash
npm run dev          # Start Vite dev server on port 3001
npm run build        # Build for production
npm run preview      # Preview production build
```

### Testing
```bash
npm run test:playwright  # Run Playwright tests with UI (headed mode)
```

The Playwright config expects:
- Frontend dev server on port 3001
- Backend server on port 3003 (when using local Express server)

### Cloudflare Worker Development
```bash
cd cloudflare-worker
npm install
wrangler dev         # Start local Cloudflare Worker
wrangler deploy      # Deploy to Cloudflare
```

## Architecture Overview

### Frontend Structure
- **Entry Point**: `index.tsx` → `App.tsx`
- **Routing**: Uses HashRouter from react-router-dom (all routes prefixed with `#/`)
- **State Management**: Context-based (ThemeProvider, BookmarkProvider)
- **Styling**: TailwindCSS with custom theme configuration

### Key Directories
- `pages/` - Route components (HomePage, HealthPage, BeautyPageEbay, NutritionPage, VideosPage, etc.)
- `components/` - Reusable UI components (Header, Footer, cards, modals, skeletons)
- `hooks/` - Custom React hooks (useTheme, useBookmarks, useNutritionCart, useComparison)
- `services/` - API service layers
- `types/` - TypeScript type definitions (main types in `types.ts`, eBay types in `types/ebay.ts`)
- `cloudflare-worker/` - Standalone Cloudflare Worker for RSS/content extraction

### Service Layer Architecture

**apiService.ts**: Main API orchestration layer that:
- Interfaces with multiple external APIs (NewsAPI, YouTube, API Ninjas, eBay)
- Handles PubMed article fetching via pubmedService
- Manages product search and detail retrieval from eBay
- Provides nutrition data lookups
- Uses Vite proxy configuration for CORS handling in dev mode
- Falls back to `/api/*` routes in production

**Cloudflare Worker** (`cloudflare-worker/src/index.ts`):
- Provides `/rss` endpoint for parsing RSS feeds
- Provides `/read` endpoint for extracting article content using Jina Reader API
- Handles CORS for all endpoints
- Deployed separately from main app

### API Configuration

The app uses Vite proxies in development (vite.config.ts):
- `/api` → Express server on localhost:3003
- `/newsapi` → NewsAPI with API key injection
- `/ninjas` → API Ninjas with API key injection

Environment variables in `.env.local`:
- `VITE_YOUTUBE_API_KEY` - YouTube Data API v3 key
- `VITE_NEWSAPI_KEY` - NewsAPI key (optional)
- `VITE_API_NINJAS_KEY` - API Ninjas key (optional)

### Key Features

**Multi-Source Content Aggregation**:
- Health articles from PubMed RSS feeds
- Beauty products from eBay API with advanced filtering
- Nutrition data from API Ninjas
- YouTube videos via YouTube Data API v3

**Nutrition Flow** (NutritionPage):
- Search foods via API Ninjas
- Add items to persistent cart (useNutritionCart hook)
- Compare foods side-by-side (useComparison hook)
- Track daily nutritional goals (DailyGoals component)
- User profile with dietary preferences (useUserProfile hook)

**Beauty Product Integration**:
- eBay product search with category filtering
- Product detail pages with image galleries
- Filter-based UI (BeautyPageEbay component)
- Type-safe eBay API integration (types/ebay.ts)

**Bookmarks System**:
- Universal bookmarking for articles, products, videos, nutrition items
- Persisted to localStorage
- BookmarkProvider context for global state

**Theme System**:
- Light/dark mode toggle
- Class-based dark mode (`darkMode: "class"` in Tailwind)
- ThemeProvider context stores preference in localStorage

## Important Implementation Notes

### TypeScript Path Aliases
The project uses `@/*` alias pointing to root directory (configured in tsconfig.json and vite.config.ts). Use absolute imports like:
```typescript
import { Article } from '@/types';
```

### Content Types
All content items (Articles, Products, Videos, etc.) have a `contentType` property for type discrimination in mixed collections. This is critical for the bookmark system.

### eBay Integration Details
- Category-based product search (see beauty filter categories in BeautyPageEbay)
- Recent fixes: Updated category IDs for beauty products (November 2024)
- Product detail page uses eBay item ID for fetching full product info
- Routing: `/beauty/product/:itemId`

### Nutrition Cart Persistence
The nutrition cart (useNutritionCart) persists items to localStorage with key `nutrition-cart`. Items are stored with full nutrition data to avoid re-fetching.

### Food Comparison Logic
The comparison feature (useComparison hook) uses strict ID+name matching to prevent false positives when comparing food items. This was a bug fix implemented to handle similar food names correctly.

### React Router Configuration
Uses HashRouter instead of BrowserRouter to support static hosting environments (GitHub Pages, Cloudflare Pages). All routes are prefixed with `#/` in URLs.

### API Rate Limiting
The RateLimitTracker component monitors API usage, particularly for YouTube API. Consider implementing rate limit handling if extending API calls.

## Common Development Patterns

### Adding a New Page
1. Create component in `pages/`
2. Add route in `App.tsx` wrapped with `<PageWrapper>`
3. Update navigation in `Header.tsx` if needed
4. Add types to `types.ts` if new data structures needed

### Adding External API Integration
1. Add API key to `.env.local` with `VITE_` prefix
2. Configure proxy in `vite.config.ts` if CORS handling needed
3. Add service function to `services/apiService.ts`
4. Define TypeScript interfaces for API responses
5. Handle loading/error states in components

### Working with Cloudflare Worker
The worker is a separate project with its own package.json. To modify:
1. Edit `cloudflare-worker/src/index.ts`
2. Test locally with `wrangler dev`
3. Deploy with `wrangler deploy`
4. Update worker URL references in frontend if needed

## Testing

Playwright tests are in `playwright/` directory. The test configuration:
- Starts both frontend and backend servers automatically
- Uses chromium browser
- Single worker (no parallel execution)
- Screenshots and videos on failure only

When writing tests, note that the app uses HashRouter, so URLs include `#/` prefix.

## Deployment Considerations

- Frontend builds to `dist/` directory
- Cloudflare Worker deploys independently
- Environment variables must be set in production environment
- Static assets are served from CDN (Googleusercontent in mock data)
- The app can be deployed to static hosts (Vercel, Netlify, Cloudflare Pages, GitHub Pages)

## Known Configuration Details

- Port 3001: Vite dev server
- Port 3003: Express backend server (if used)
- Tailwind safelist includes theme color classes for dynamic application
- TypeScript configured with JSX transform (`jsx: "react-jsx"`)
- Allows importing TS extensions (`allowImportingTsExtensions: true`)
