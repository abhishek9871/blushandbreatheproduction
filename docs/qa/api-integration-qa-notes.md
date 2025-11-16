# API Integration QA Notes

- **Scope**
  - Articles via NewsAPI (`articles`)
  - Videos via YouTube Data API (`videos`)
  - Nutrition via API Ninjas (`nutrition`)
  - Products/tutorials remain mock-backed; still go through caching + rate-limit layer.

- **Environment Setup Checks**
  - Verify `.env.local` contains:
    - `VITE_NEWSAPI_KEY`
    - `VITE_YOUTUBE_API_KEY`
    - `VITE_API_NINJAS_KEY`
  - Run `npm run dev` and confirm no console errors about missing API keys before making network calls.

- **Happy-Path Scenarios**
  - **Articles**
    - Visit Health page and Home page.
    - Confirm article cards load with real titles/images when keys are valid.
    - Scroll to trigger infinite scroll; verify `hasMore` eventually becomes `false`.
  - **Videos**
    - Visit Videos page.
    - Confirm video cards populate from YouTube.
    - Scroll to trigger additional pages.
  - **Nutrition**
    - Visit Nutrition page.
    - Confirm nutrition items load from API Ninjas with non-zero nutrient values when possible.

- **Caching & TTL**
  - Load a page (e.g., Health page), then reload within a few seconds.
  - Verify in DevTools that subsequent loads do not re-hit the external API for the same page (data served from `localStorage`).

- **Rate-Limit Tracking**
  - Open the footer `RateLimitTracker`.
  - Trigger several article/video/nutrition loads (scrolling counts as multiple calls).
  - Confirm counters for `articles`, `videos`, and `nutrition` increment.

- **Fallback Behavior**
  - Temporarily break one API in DevTools (e.g., block `newsapi.org` or `googleapis.com`).
  - Reload the relevant page.
  - Expected:
    - Console logs an error for the failing API.
    - UI still shows content from mock fallback data (no blank screens).

- **Missing / Invalid Keys**
  - Set an invalid key for one service in `.env.local` and restart dev server.
  - Expected:
    - Console shows a clear error including the API name.
    - UI gracefully falls back to mock data for that resource type.

- **Error Messaging**
  - Force an API error (network offline, invalid key, or 4xx from provider).
  - Confirm:
    - `useApi` surfaces a friendly `ErrorMessage` in the UI where applicable.
    - Console logs include resource key, page number, and whether retries were exhausted.

- **Regression Checks**
  - Bookmarks still work (since they read from `allMockData`).
  - Search modal still searches across mock-based content without depending on external APIs.
