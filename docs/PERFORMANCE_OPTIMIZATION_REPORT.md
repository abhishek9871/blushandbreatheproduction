# Performance Optimization Report
## Buy DMAA India Page - Mobile Performance

**Current Score:** 69/100 (Mobile)  
**Target Score:** 90-100/100  
**Date:** December 2, 2025

---

## Executive Summary

The page has excellent SEO (100), Best Practices (100), and good Accessibility (90), but mobile performance suffers due to:

1. **Font-Induced Render Delay** (2,290ms) - Primary Issue
2. **Unused JavaScript** (62KB wasted)
3. **Legacy Polyfills** (14KB unnecessary)
4. **Eager Loading** of below-fold components

### Projected Impact of Fixes

| Fix | LCP Impact | Score Impact |
|-----|------------|--------------|
| Font optimization | -2.0s | +15-20 pts |
| Remove polyfills | -0.3s | +3-5 pts |
| Lazy load components | -0.5s | +5-8 pts |
| **Total** | **-2.8s** | **+23-33 pts** |

**Expected Final Score: 92-100** ✅

---

## Current Metrics Analysis

| Metric | Current | Target | Gap |
|--------|---------|--------|-----|
| FCP | 4.4s | < 1.8s | 🔴 -2.6s |
| LCP | 5.1s | < 2.5s | 🔴 -2.6s |
| TBT | 20ms | < 200ms | 🟢 OK |
| CLS | 0 | < 0.1 | 🟢 OK |
| SI | 5.0s | < 3.4s | 🔴 -1.6s |

### LCP Breakdown (Critical)
```
Time to First Byte:     0 ms      ✅ Server is fast
Element Render Delay:   2,290 ms  🔴 FONTS BLOCKING TEXT
Load Delay:             Variable
Load Duration:          Variable
```

**Root Cause:** The LCP element (hero text) waits 2.3 seconds for fonts to load before rendering.

---

## Issue #1: Font Loading Strategy (Critical)

### Current Implementation
```tsx
// _document.tsx
<link rel="preload" href="...Material+Symbols..." as="style" />
<link rel="stylesheet" href="...Material+Symbols..." />
<link rel="preload" href="...Lexend..." as="style" />
<link rel="stylesheet" href="...Lexend..." />
```

### Problems
1. `preload as="style"` is suboptimal for fonts
2. No `preconnect` to font origins (adds DNS/TCP latency)
3. Fonts block text rendering until loaded
4. Material Symbols (298KB) is huge for icons

### Fix #1A: Add Preconnect (Immediate Win)
```tsx
// Add BEFORE font links in _document.tsx
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
```

### Fix #1B: Use `media="print"` Trick for Non-Blocking Load
```tsx
// Replace stylesheet links with:
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap"
  media="print"
  onLoad="this.media='all'"
/>
<noscript>
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap"
  />
</noscript>
```

### Fix #1C: Subset Lexend Font (Reduce 75KB → ~20KB)
Only load weights actually used:
```tsx
// Current: 300;400;500;600;700;800;900 (7 weights = 75KB)
// Needed: 400;500;600;700 (4 weights = ~35KB)
family=Lexend:wght@400;500;600;700&display=swap
```

### Fix #1D: Consider Self-Hosting Fonts
Self-hosted fonts eliminate:
- DNS lookup (50-100ms)
- TCP connection (50-100ms)  
- Font CSS fetch (100-200ms)

Total potential savings: **200-400ms**

---

## Issue #2: Unused JavaScript (62KB)

### Current State
| File | Total | Unused | Savings |
|------|-------|--------|---------|
| `dda731e5b33170ae.js` | 42.8KB | 37.5KB | 87% unused |
| `22eccf613f1ad806.js` | 64.6KB | 24.9KB | 39% unused |

### Fix #2: Lazy Load Below-Fold Components
```tsx
// pages/buy/[slug].tsx
import dynamic from 'next/dynamic';

// Lazy load heavy components not visible on initial viewport
const EffectComparisonChart = dynamic(
  () => import('@/components/buy/EffectComparisonChart'),
  { loading: () => <div className="h-64 animate-pulse bg-gray-100 rounded-xl" /> }
);

const AlternativesComparison = dynamic(
  () => import('@/components/buy/AlternativesComparison'),
  { loading: () => <div className="h-96 animate-pulse bg-gray-100 rounded-xl" /> }
);

const RiskCalculator = dynamic(
  () => import('@/components/buy/RiskCalculator'),
  { loading: () => <div className="h-48 animate-pulse bg-gray-100 rounded-xl" /> }
);

const TestimonialCard = dynamic(
  () => import('@/components/buy/TestimonialCard')
);

const SupplierWarningCard = dynamic(
  () => import('@/components/buy/SupplierWarningCard')
);
```

**Expected Savings:** 30-40KB from initial bundle

---

## Issue #3: Legacy Polyfills (14KB)

### Current Polyfills (Unnecessary)
```
Array.prototype.at        - Baseline 2022
Array.prototype.flat      - Baseline 2019
Array.prototype.flatMap   - Baseline 2019
Object.fromEntries        - Baseline 2019
Object.hasOwn             - Baseline 2022
String.prototype.trimEnd  - Baseline 2019
String.prototype.trimStart - Baseline 2019
```

All these features are supported by 95%+ of browsers.

### Fix #3: Add Browserslist to package.json
```json
{
  "browserslist": [
    "last 2 Chrome versions",
    "last 2 Firefox versions",
    "last 2 Safari versions",
    "last 2 Edge versions",
    ">0.5%",
    "not dead",
    "not op_mini all"
  ]
}
```

Or create `.browserslistrc`:
```
last 2 Chrome versions
last 2 Firefox versions
last 2 Safari versions
last 2 Edge versions
>0.5%
not dead
not op_mini all
```

**Expected Savings:** 14KB

---

## Issue #4: DOM Size (1,323 elements)

### Current State
- Total elements: 1,323
- Max depth: 17
- Max children: 14

### Assessment
This is slightly high but not critical. The main contributors are:
1. Medical citations list (14 items)
2. Alternatives grid
3. Ingredients breakdown

### Recommendations (Optional)
1. Virtualize long lists if they grow
2. Consider collapsing ingredients by default
3. Lazy render testimonials beyond first 2

---

## Issue #5: Long Main Thread Tasks

### Current State
```
95ms task - e43bd05b55995c46.js
70ms task - _buildManifest.js
64ms task - 22eccf613f1ad806.js
55ms task - 22eccf613f1ad806.js
```

### Fix
Lazy loading components (Fix #2) will automatically reduce these by deferring JavaScript execution.

---

## Implementation Priority

### Phase 1: Quick Wins (30 minutes, +10-15 points)
1. ✅ Add preconnect hints
2. ✅ Reduce Lexend font weights
3. ✅ Add browserslist

### Phase 2: Font Optimization (1 hour, +10-15 points)
4. ✅ Make fonts non-render-blocking
5. ✅ Consider self-hosting (optional)

### Phase 3: Code Splitting (1 hour, +5-8 points)
6. ✅ Lazy load below-fold components

---

## Recommended Implementation

### Step 1: Update _document.tsx
```tsx
import { Html, Head, Main, NextScript } from "next/document";

const themeInitScript = `
(function() {
  function getTheme() {
    try {
      var stored = localStorage.getItem('theme');
      if (stored === 'light' || stored === 'dark') return stored;
    } catch (e) {}
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  var theme = getTheme();
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(theme);
  
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function() {
      document.documentElement.classList.add('fonts-loaded');
    });
  } else {
    setTimeout(function() {
      document.documentElement.classList.add('fonts-loaded');
    }, 500);
  }
})();
`;

export default function Document() {
  return (
    <Html lang="en" className="dark">
      <Head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        
        {/* Preconnect to font origins - MUST be first */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Favicon */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#2dd4bf" />
        
        {/* Material Symbols - Non-blocking load */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap"
          media="print"
          // @ts-ignore
          onLoad="this.media='all'"
        />
        
        {/* Lexend - Reduced weights, non-blocking */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700&display=swap"
          media="print"
          // @ts-ignore
          onLoad="this.media='all'"
        />
        
        {/* Fallback for no-JS */}
        <noscript>
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap" />
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700&display=swap" />
        </noscript>
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
```

### Step 2: Add browserslist to package.json
```json
{
  "browserslist": [
    "last 2 Chrome versions",
    "last 2 Firefox versions",
    "last 2 Safari versions", 
    "last 2 Edge versions",
    ">0.5%",
    "not dead"
  ]
}
```

### Step 3: Lazy Load Components in [slug].tsx
```tsx
import dynamic from 'next/dynamic';

// Eager load above-fold components
import BuyPageHero from '@/components/buy/BuyPageHero';
import MedicalCitationBadge from '@/components/buy/MedicalCitationBadge';
import ConversionCTA from '@/components/buy/ConversionCTA';
import BuyPageSchema from '@/components/buy/BuyPageSchema';

// Lazy load below-fold components
const RiskCalculator = dynamic(() => import('@/components/buy/RiskCalculator'), {
  loading: () => <div className="h-48 animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl" />
});

const SupplierWarningCard = dynamic(() => import('@/components/buy/SupplierWarningCard'));

const TestimonialCard = dynamic(() => import('@/components/buy/TestimonialCard'));

const EffectComparisonChart = dynamic(() => import('@/components/buy/EffectComparisonChart'), {
  loading: () => <div className="h-64 animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl" />
});

const FeaturedProductShowcase = dynamic(() => import('@/components/buy/FeaturedProductShowcase'), {
  loading: () => <div className="h-96 animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl" />
});

const AlternativesComparison = dynamic(() => import('@/components/buy/AlternativesComparison'), {
  loading: () => <div className="h-64 animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl" />
});

const LegalStatusTable = dynamic(() => import('@/components/buy/LegalStatusTable'));
```

---

## SEO Impact Assessment

### Will These Changes Affect SEO? ❌ NO

| Optimization | SEO Impact |
|--------------|------------|
| Preconnect hints | None |
| Non-blocking fonts | None (content unchanged) |
| Browserslist | None |
| Lazy loading | None (SSR still works) |

**Why it's safe:**
1. All content is still server-side rendered
2. Google sees the same HTML
3. Schema markup unchanged
4. Meta tags unchanged
5. Content unchanged

**Actually improves SEO:**
- Core Web Vitals are a ranking factor
- Better LCP = better rankings
- Mobile performance directly impacts mobile search rankings

---

## Testing Plan

### Before Implementation
```bash
# Run Lighthouse on current page
npx lighthouse https://www.blushandbreath.com/buy/dmaa-india --only-categories=performance --output=json --output-path=./before.json
```

### After Each Phase
1. Build locally: `npm run build`
2. Run dev server: `npm run dev`
3. Test with Lighthouse
4. If metrics improved, deploy: `npx vercel --prod`
5. Test production URL

### Success Criteria
- [ ] LCP < 2.5s (currently 5.1s)
- [ ] FCP < 1.8s (currently 4.4s)
- [ ] Performance score > 90 (currently 69)
- [ ] No SEO regression
- [ ] No visual changes

---

## Summary

| Metric | Before | After (Projected) | Improvement |
|--------|--------|-------------------|-------------|
| Performance | 69 | 92-100 | +23-31 pts |
| LCP | 5.1s | ~2.0s | -3.1s |
| FCP | 4.4s | ~1.5s | -2.9s |
| Bundle Size | ~170KB | ~120KB | -50KB |

**Total Implementation Time:** ~2-3 hours

---

*Report generated: December 2, 2025*
