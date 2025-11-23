## COMPLETE Claude Code IMPLEMENTATION PROMPT: Health \& Wellness Store (Design + Backend + Frontend + Dev Server Testing)

**Context:**

- You previously built a working Beauty store using eBay Browse API with category 26395 (Health \& Beauty root).[^1]
- That implementation is live on production at `https://jyotilalchandani.pages.dev/beauty` and fully functional.[^1]
- We now have approved design mockups from Google Stitch for a **separate** Health \& Wellness store stored in the local `Wellness Designs/` folder.[^1]
- This ticket implements a complete new Health store from scratch (backend + frontend) matching those designs exactly, testable on dev server before production deployment.

***

### PHASE 1: Study the Design Mockups (Critical First Step)

**Before writing any code:**

1. **Open and carefully examine these files:**
    - `Wellness Designs/Desktop/screen.png` - Desktop layout mockup (1440px)
    - `Wellness Designs/Desktop/code.html` - HTML structure from Google Stitch
    - `Wellness Designs/Mobile/screen.png` - Mobile layout mockup (375px)
    - `Wellness Designs/Mobile/code.html` - Mobile HTML structure from Google Stitch
2. **Extract and document these design elements:**
    - **Color palette:** Identify exact hex colors used (teal blues, greens, backgrounds)
    - **Typography:** Font families, sizes, weights visible in mockups
    - **Layout structure:** Hero section, filter sidebar vs chips, product grid columns
    - **Component patterns:** Trust badges, benefit tags, button styles, card shadows
    - **Spacing/sizing:** Margins, padding, gaps between elements
    - **Interactive states:** Hover effects, active filters, button states visible in designs
3. **Note any Health-specific UI elements** not present in Beauty:
    - Trust badge strip (FDA, GMP, Lab Tested, Organic, Vegan icons)
    - Hero section with educational messaging
    - Product card "FOR [BENEFIT]" tags (FOR IMMUNITY, FOR ENERGY, etc.)
    - Key ingredient callouts on cards
    - Any unique filter patterns or CTA language

**Output a design analysis document** (comment block or separate file) listing:

- Colors mapped to CSS variable names
- Component specifications (hero height, card dimensions, filter widths)
- Differences from Beauty page that require new code vs reusable components

***

### PHASE 2: Backend Implementation (eBay Browse API for Health Categories)

**Goal:** Create Health-specific API routes that mirror Beauty's architecture but use Health \& Wellness category IDs.

#### Backend Routes to Implement

Create two new Worker routes (in `_worker.js` or equivalent backend file):

**1. `/api/health/search` - Health Product Search**

```javascript
// Health category mapping (production-verified from eBay)
const healthCategoryMap = {
  'all': '67588',           // Health Care root (2M+ items)
  'vitamins': '11776',      // Vitamins & Minerals (649K+ items)
  'fitness': '15273',       // Fitness Equipment
  'supplements': '180959',  // Dietary Supplements
  'medical': '79631',       // Medical Supplies & Equipment
  'wellness': '15258'       // Natural & Alternative Remedies
};
```

**Category ID sources (already researched):**[^4][^5][^6]

- **67588** (Health Care) - eBay's root health category
- **11776** (Vitamins \& Minerals) - Largest subcategory, 649K+ products, verified via live marketplace[^5]
- **15273** (Fitness Equipment) - High-ticket items (equipment \$100-\$2000)[^7]
- **180959** (Dietary Supplements) - Protein powders, sports nutrition[^7]
- **79631** (Medical Supplies) - Glucose monitors, blood pressure devices[^4]
- **15258** (Natural \& Alternative Remedies) - Essential oils, aromatherapy[^8]

**Implementation:**

- Accept same parameters as Beauty: `q`, `category`, `sort`, `minPrice`, `maxPrice`, `condition`, `page`, `pageSize`
- Map `category` param using `healthCategoryMap` instead of Beauty's category map
- Call eBay Browse `GET /buy/browse/v1/item_summary/search` with:
    - `category_ids` from map above
    - `q`, `sort`, `limit`, `offset`, `filter` parameters passed through from frontend
    - Same OAuth token logic as Beauty (reuse existing token service)
- Normalize eBay response into same DTO structure Beauty uses:

```javascript
{
  items: [
    {
      id: itemId,
      title: string,
      price: { value: number, currency: string },
      imageUrl: string,
      condition: string,
      webUrl: itemWebUrl
    }
  ],
  pagination: { page, pageSize, total, hasNextPage },
  refinements: { conditions, brands, aspects }
}
```

- Use identical 5-minute cache strategy with KV as Beauty[^9]
- Same error handling and stale-on-error fallback[^10]

**2. `/api/health/item/:id` - Health Product Detail**

- Identical logic to `/api/beauty/item/:id`
- Call eBay Browse `GET /buy/browse/v1/item/{item_id}?fieldgroups=PRODUCT`
- Return same detail DTO:

```javascript
{
  id, title, price, currency, condition,
  images: [url1, url2, ...],
  shortDescription: string,
  itemSpecifics: { brand, form, size, ... },
  webUrl: itemWebUrl,
  seller: { username, feedbackPercentage }
}
```

- Same 2-hour cache, same error handling[^9]

**Testing queries for validation** (guaranteed to return results):[^11][^5]

```javascript
// Use these to verify categories work
const testQueries = [
  { q: 'vitamin c 1000mg', category: '11776' },  // Should return 50K+ items
  { q: 'protein powder', category: '15273' },     // Should return 80K+ items
  { q: 'essential oils', category: '15258' },     // Should return 200K+ items
  { q: 'blood pressure monitor', category: '79631' } // Should return 20K+ items
];
```


***

### PHASE 3: Frontend Implementation (Match Google Stitch Designs Exactly)

#### Step 1: Create Health Page Components

**File: `pages/HealthStorePageEbay.tsx`** (NOT `HealthPage.tsx` - that's your existing articles page)

**Reference:** `Wellness Designs/Desktop/code.html` and `screen.png`

**Implementation checklist:**

1. **Extract design-specified colors from mockups:**

```css
/* Add these to your CSS variables or inline styles */
--health-primary: #2C7A7B;      /* Teal - trust + wellness */
--health-secondary: #38A169;    /* Green - health + vitality */
--health-accent: #4299E1;       /* Blue - medical authority */
--health-bg: #F7FAFC;           /* Soft gray-white */
--health-text: #1A365D;         /* Dark blue-gray */
```

2. **Hero Section** (match `Wellness Designs/Desktop/design.png` exactly):
    - Height: ~300px desktop, ~200px mobile
    - Gradient background: light cyan (\#EBF8FF) to white
    - Heading: "Science-Backed Wellness Products" or text visible in mockup (48px desktop, 24px mobile)
    - Subheading: Educational text about certified supplements/health essentials (18px desktop, 14px mobile)
    - Search bar: Centered, 600px wide desktop, full-width mobile, magnifying glass icon
3. **Trust Badge Strip** (implement as shown in mockup):
    - Position: Below header, sticky on scroll
    - Icons: FDA Registered, GMP Certified, Lab Tested, Organic, Vegan (grayscale, 40px each)
    - Desktop: Horizontal row, all visible
    - Mobile: Horizontal scrollable carousel
    - Use placeholder SVGs or icon font if exact icons not provided
4. **Filter Layout:**
    - **Desktop** (sidebar as in Beauty): 280px width, left side, fixed position
        - Categories: `['All Health', 'Vitamins & Minerals', 'Fitness Equipment', 'Supplements', 'Medical Supplies', 'Wellness & Remedies']`
        - Map to backend: `['all', 'vitamins', 'fitness', 'supplements', 'medical', 'wellness']`
    - **Mobile** (horizontal chips): Scrollable filter chips at top, price/sort in bottom sheet modals
    - Reuse your existing dropdown mutual exclusivity logic from Beauty
5. **Product Grid:**
    - **Desktop**: 3 columns (360px cards with gaps)
    - **Mobile**: Single column, full-width cards (343px accounting for margins)
    - Card design enhancements for Health:
        - **Benefit tag** (top-right corner): Small colored tag like "FOR IMMUNITY" or "FOR ENERGY"
            - Logic: Map category → benefit text
                - `vitamins` → "FOR WELLNESS"
                - `fitness` → "FOR PERFORMANCE"
                - `supplements` → "FOR NUTRITION"
                - `medical` → "FOR HEALTH"
                - `wellness` → "FOR BALANCE"
        - **Key ingredient callout**: Extract from eBay `itemSpecifics` and show below title (e.g., "Vitamin C 1000mg", "Organic Turmeric")
        - Star rating + review count (from eBay if available, else hide gracefully)
        - "Shop Now" button (teal `#2C7A7B`, full width, rounded 8px)
6. **Spacing and Typography** (match mockups):
    - 32px padding around main content desktop, 16px mobile
    - 24px gap between cards desktop, 12px mobile
    - 16px internal card padding
    - Font: Inter or system font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`)
    - Heading weight: 600, body: 400, prices: 700

#### Step 2: Create Health Product Detail Page

**File: `pages/HealthProductDetailPageEbay.tsx`**

**Reference:** `Wellness Designs/Mobile/design.png` for detail page layout (if shown)

**Implementation:**

- Duplicate Beauty product detail structure
- Call `/api/health/item/:id` instead of `/api/beauty/item/:id`
- Use Health color palette (teal primary instead of Beauty's colors)
- Same layout: Hero image + thumbnails, title, price, condition, specs, "Buy on eBay" button
- Update breadcrumb: "Health Store > Product Name"


#### Step 3: API Service Functions

**File: `services/apiService.ts`**

Add Health-specific functions mirroring Beauty's:

```typescript
export const searchHealthProducts = async (params: {
  q?: string;
  category?: string;
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  page?: number;
  pageSize?: number;
}): Promise<ProductSearchResponse> => {
  const queryParams = new URLSearchParams();
  if (params.q) queryParams.set('q', params.q);
  if (params.category) queryParams.set('category', params.category);
  // ... map all params
  
  const response = await fetch(`/api/health/search?${queryParams}`);
  if (!response.ok) throw new Error('Health search failed');
  return response.json();
};

export const getHealthProductDetail = async (itemId: string): Promise<ProductDetail> => {
  const response = await fetch(`/api/health/item/${encodeURIComponent(itemId)}`);
  if (!response.ok) throw new Error('Health item fetch failed');
  return response.json();
};
```


#### Step 4: Routing

**File: `App.tsx`**

Add routes:

```typescript
<Route path="/health-store" element={<HealthStorePageEbay />} />
<Route path="/health-store/product/:itemId" element={<HealthProductDetailPageEbay />} />
```

**Navigation:** Add "Health Store" link to main nav pointing to `/health-store`