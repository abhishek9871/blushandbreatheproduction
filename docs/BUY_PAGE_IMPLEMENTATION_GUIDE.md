# Buy Page Implementation Guide
## The Definitive Reference for Creating New `/buy/[slug]` Pages

> **Purpose**: This document is the source of truth for AI agents implementing new buy pages. Follow this guide exactly to avoid repeating past mistakes and deliver production-ready pages efficiently.

---

## 📋 Table of Contents

1. [Pre-Implementation Checklist](#1-pre-implementation-checklist)
2. [Research Phase](#2-research-phase)
3. [Data Structure & JSON Schema](#3-data-structure--json-schema)
4. [Content Requirements](#4-content-requirements)
5. [Medical Citations & Sources](#5-medical-citations--sources)
6. [Product Integration](#6-product-integration)
7. [Schema Markup (CRITICAL)](#7-schema-markup-critical)
8. [UI/UX Requirements](#8-uiux-requirements)
9. [Testing Protocol](#9-testing-protocol)
10. [Deployment & Indexing](#10-deployment--indexing)
11. [Common Mistakes to Avoid](#11-common-mistakes-to-avoid)

---

## 1. Pre-Implementation Checklist

Before writing ANY code, complete these steps:

### Required Information Gathering
- [ ] Target substance/product name
- [ ] Primary keyword (e.g., "buy [substance] india")
- [ ] User intent analysis (why are they searching?)
- [ ] Legal status in India (FSSAI, customs, etc.)
- [ ] Health risks documented by FDA/medical sources
- [ ] Legal alternatives available in India
- [ ] Featured product with Amazon India affiliate link (or any that suits best)

### Files You Will Modify
```
lib/data/buy-pages.json          # Main data file
types/buy-page.ts                # TypeScript interfaces (if adding new fields)
components/buy/BuyPageSchema.tsx # Schema markup (rarely needs changes)
public/sitemap-0.xml             # Auto-generated on build
```

### Files You Should NOT Modify (Already Set Up)
```
pages/buy/[slug].tsx             # Page template (reusable)
components/buy/                  # All UI components (reusable)
```

---

## 2. Research Phase

### Step 1: Keyword Research Prompt

Use this exact prompt with the deep research tool:

```
Research comprehensive keyword data for "[SUBSTANCE] India" buying intent:

1. PRIMARY KEYWORDS (High Intent):
   - "buy [substance] india"
   - "[substance] india"
   - "[substance] price india"
   - "where to buy [substance] india"
   - "[substance] legal india"

2. LONG-TAIL KEYWORDS:
   - "[substance] alternative india"
   - "[substance] india 2025"
   - "[substance] banned india"
   - "[substance] cod india" (cash on delivery)
   - "[substance] amazon india"

3. INFORMATIONAL KEYWORDS:
   - "is [substance] legal in india"
   - "[substance] side effects"
   - "[substance] drug test india"
   - "[substance] customs india"

For each keyword, find:
- Monthly search volume (India)
- Keyword difficulty
- Current top-ranking content
- User intent (buy, research, compare)

Also research:
- Legal status under FSSAI regulations
- Customs seizure rates at major ports
- Health risks documented by FDA/medical journals
- Legal alternatives available on Amazon India with COD
```

### Step 2: Medical Citations Research Prompt

```
Find 10-15 peer-reviewed medical sources about [SUBSTANCE]:

REQUIRED SOURCE TYPES:
1. FDA warnings or statements (at least 1)
2. Case reports from medical journals (at least 2-3)
3. Clinical studies or reviews (at least 3-4)
4. Regulatory body statements (WADA, DEA, etc.)
5. Toxicology reports

FOR EACH SOURCE, PROVIDE:
- Exact title
- Publication/Authority name
- Publication year
- Direct URL (MUST be working and accessible)
- Key quote (1-2 sentences)
- Authors (if applicable)

VERIFY: Each URL must be accessible and lead to the actual source.
Do NOT provide URLs that redirect or are broken.
```

### Step 3: Legal Alternatives Research Prompt

```
Find the top 3-5 legal alternatives to [SUBSTANCE] available in India:

FOR EACH PRODUCT:
1. Product name and brand
2. Amazon India URL (must be currently available)
3. Current price in INR
4. Number of servings
5. Star rating and review count
6. Key ingredients with doses
7. Why it's a good alternative (mechanism similarity)
8. COD availability
9. Delivery time

PRIORITY: Products from established Indian brands (BigMuscles, MuscleBlaze, etc.)
or international brands with strong India presence.
```

---

## 3. Data Structure & JSON Schema

### Location: `lib/data/buy-pages.json`

Each buy page entry must include ALL these fields:

```json
{
  "slug": "substance-india",
  "title": "Buy [Substance] India 2025: Legal Guide, Risks & Safe Alternatives",
  "metaDescription": "Learn [Substance]'s legal status in India, health risks & best legal alternatives. Expert-reviewed guide. Updated [Month] 2025.",
  "keywords": [
    "buy [substance] india",
    "[substance] india",
    "[substance] legal india",
    // ... 7-10 keywords
  ],
  "lastUpdated": "2025-MM-DD",
  "wordCount": 3000, // Minimum 3000 words
  "sections": [
    // See Section 4 for required sections
  ],
  "legalStatus": {
    "india": {
      "status": "banned|legal|gray-area",
      "authority": "FSSAI|DCGI|etc",
      "regulation": "Specific regulation number",
      "effectiveDate": "YYYY-MM-DD",
      "penalties": "Description of penalties",
      "enforcement": "Description of enforcement level"
    }
  },
  "customsRisk": {
    "seizureRate": 45, // Percentage
    "majorPorts": {
      "mumbai": 45,
      "delhi": 40,
      "chennai": 35
    },
    "penalties": {
      "min": 10000,
      "max": 1000000
    }
  },
  "healthRisks": {
    // Documented health risks
  },
  "supplierWarnings": [
    // Scam patterns to warn users about
  ],
  "testimonials": [
    // Real user experiences (anonymized)
  ],
  "calculatorConfig": {
    // Risk calculator configuration
  },
  "featuredProduct": {
    // See Section 6
  },
  "alternatives": [
    // See Section 6
  ],
  "medicalSources": [
    // See Section 5
  ],
  "citations": [
    // See Section 5
  ],
  "faqs": [
    // 6-8 FAQs covering common questions
  ],
  "effectComparison": [
    // Compare substance vs alternatives
  ],
  "sideEffectComparison": [
    // Compare side effects
  ]
}
```

---

## 4. Content Requirements

### Required Sections (in order)

```json
"sections": [
  {
    "id": "legal-status",
    "title": "Is [Substance] Legal in India? 2025 FSSAI Status",
    "content": "Comprehensive legal analysis...",
    "keywordTarget": "[substance] legal india"
  },
  {
    "id": "risks",
    "title": "[Substance] Health Risks: What Medical Research Shows",
    "content": "FDA warnings, case reports, statistics...",
    "keywordTarget": "[substance] side effects"
  },
  {
    "id": "supplier-warnings",
    "title": "[Substance] Suppliers in India: Scam Warnings",
    "content": "Common scam patterns, what to avoid...",
    "keywordTarget": "[substance] india supplier"
  },
  {
    "id": "testimonials",
    "title": "Real User Experiences: [Substance] Scams in India",
    "content": "Anonymized user stories...",
    "keywordTarget": "[substance] review india"
  },
  {
    "id": "legal-alternatives",
    "title": "Legal [Substance] Alternatives Available in India with COD",
    "content": "Product comparisons, recommendations...",
    "keywordTarget": "[substance] alternative india"
  },
  {
    "id": "athletes",
    "title": "[Substance] and Drug Testing: What Indian Athletes Must Know",
    "content": "WADA status, detection windows, NADA rules...",
    "keywordTarget": "[substance] drug test india"
  }
]
```

### Required FAQs (6-8 questions)

Must include these question patterns:
1. "Is [substance] legal in India in 2025?"
2. "Can I import [substance] to India for personal use?"
3. "What is the price of [substance] in India?"
4. "What are safe [substance] alternatives available in India?"
5. "Will [substance] show up on drug tests in India?"
6. "Are IndiaMART [substance] suppliers legitimate?"
7. "How does [substance] compare to legal alternatives?"
8. "What are the health risks of [substance]?"

---

## 5. Medical Citations & Sources

### Citation Structure

```json
"citations": [
  {
    "title": "Exact Title of the Source",
    "source": "Publication Name",
    "url": "https://direct-link-to-source.com",
    "year": "2023",
    "type": "regulatory|case-report|study|review",
    "authors": "Author Name et al." // Optional
  }
]
```

### Medical Sources Structure

```json
"medicalSources": [
  {
    "id": "unique-id",
    "sourceType": "fda|pubmed|case_report|regulatory|wada",
    "title": "Full Title",
    "date": "YYYY-MM-DD",
    "authority": "Publishing Authority",
    "keyQuote": "One key quote from the source...",
    "citationText": "Formal citation format",
    "url": "https://verified-working-url.com",
    "relevanceToIndia": "Why this matters for Indian consumers"
  }
]
```

### CRITICAL: URL Verification

Before adding ANY citation URL:
1. Visit the URL yourself
2. Verify it leads to the actual source
3. Verify the content matches the title
4. Do NOT use URLs that:
   - Redirect to login pages
   - Lead to paywalls without abstracts
   - Are broken or 404
   - Lead to different content than described

### Minimum Citation Requirements

| Source Type | Minimum Count |
|-------------|---------------|
| FDA/Regulatory | 1 |
| Case Reports | 2 |
| Clinical Studies | 3 |
| Review Articles | 2 |
| WADA/Sports Bodies | 1 (if applicable) |
| **Total** | **10-15** |

---

## 6. Product Integration

### Featured Product Structure

```json
"featuredProduct": {
  "id": "product-slug-featured",
  "name": "Product Name",
  "brand": "Brand Name",
  "tagline": "Compelling tagline",
  "price": 1599,
  "originalPrice": 1999,
  "servings": 30,
  "pricePerServing": 53,
  "rating": 4.6,
  "reviewCount": 2847,
  "images": {
    "main": "https://high-quality-image-url.jpg",
    "gallery": [
      "https://gallery-image-1.jpg",
      "https://gallery-image-2.jpg"
    ]
  },
  "highlights": [
    { "icon": "bolt", "title": "Serving Size", "description": "14g Ultra-Potent" },
    { "icon": "science", "title": "Key Ingredient", "description": "Clinical Dose" }
  ],
  "ingredients": [
    { "name": "Ingredient", "amount": "7000mg", "benefit": "What it does" }
  ],
  "benefits": [
    "Benefit statement 1",
    "Benefit statement 2"
  ],
  "guarantees": [
    "COD Available",
    "1-3 Day Delivery",
    "100% FSSAI Legal"
  ],
  "buyLink": "https://www.amazon.in/product-url?tag=blushandbreat-21",
  "officialLink": "https://brand-official-site.com"
}
```

### Alternatives Array Structure

```json
"alternatives": [
  {
    "id": "product-slug",
    "name": "Product Name",
    "brand": "Brand Name",
    "image": "https://product-image-url.jpg", // REQUIRED for Merchant Listings
    "tier": "preworkout|ayurvedic|nootropic|sarms_alternative",
    "alternativeFor": "Substance Name",
    "keyIngredients": ["Ingredient 7000mg", "Ingredient 1500mg"],
    "caffeine": 150,
    "price": 1599,
    "pricePerServing": 53,
    "servings": 30,
    "rating": 4.6,
    "reviewCount": 200,
    "effectScore": 8, // 1-10 vs original substance
    "hasCOD": true,
    "deliveryDays": "1-3 days",
    "whereToBuy": ["https://amazon.in/product-url"],
    "affiliateProgram": "amazon_associates_india",
    "commission": "6-9%",
    "isTopPick": true, // Only ONE product should be true
    "pros": [
      "Pro statement 1",
      "Pro statement 2"
    ],
    "cons": [
      "Con statement 1",
      "Con statement 2"
    ]
  }
]
```

### CRITICAL: Image Field

**EVERY alternative with `isTopPick: true` MUST have an `image` field.**

This is required for Google Merchant Listings rich results. Missing image = invalid schema = no rich results.

---

## 7. Schema Markup (CRITICAL)

### DO NOT USE These Schema Types

| Schema Type | Why It Fails |
|-------------|--------------|
| `MedicalWebPage` | Not supported for Article rich results |
| `Drug` | Subtype of Product - requires offers/aggregateRating |
| `Substance` | Same issue as Drug |

### CORRECT Schema Types

```javascript
// For the main article content
'@type': 'Article'  // NOT MedicalWebPage

// For describing banned substances (informational, not for sale)
'@type': 'ChemicalSubstance'  // NOT Drug

// For products you're recommending
'@type': 'Product'  // With image, offers, aggregateRating
```

### Product Schema Requirements

Every Product schema MUST have:
- `name` - Product name
- `image` - Valid image URL
- `brand` - Brand object
- `description` - Product description
- `offers` - Price, currency, availability
- `aggregateRating` - Rating value and review count (if available)

### Schema Validation Checklist

Before deployment, verify in Rich Results Test:
- [ ] Articles - 1 valid item
- [ ] Product snippets - All valid (no missing offers/rating errors)
- [ ] Merchant listings - Valid with image
- [ ] Breadcrumbs - Valid
- [ ] FAQ - Valid
- [ ] Review snippets - Valid (if applicable)
- [ ] Software apps - Valid (if calculator present)

---

## 8. UI/UX Requirements

### Mobile Responsiveness (CRITICAL)

Test on these viewport widths:
- 375px (iPhone SE)
- 390px (iPhone 12/13/14)
- 414px (iPhone Plus models)
- 768px (Tablet)
- 1024px (Desktop)
- 1440px (Large Desktop)

### Component-Specific Requirements

#### MedicalCitationBadge
- Must show all citations in scrollable container
- Max height: 500px with overflow-y: auto
- Each citation needs "View Source" button
- Badges for source types (FDA, Case Report, Study, Regulatory)

#### Featured Product Showcase
- Hero image must be optimized (use Next.js Image)
- Price display with original price strikethrough
- CTA buttons must be prominent
- Guarantee badges visible

#### Alternatives Grid
- 3 columns on desktop, 2 on tablet, 1 on mobile
- Card hover effects
- Rating stars visible
- Price per serving calculation

### Dark Mode Requirements

All components must work in dark mode. Check:
- [ ] Text contrast meets WCAG AA (4.5:1 minimum)
- [ ] Background colors use dark variants
- [ ] Borders use appropriate dark colors
- [ ] Icons visible against dark backgrounds
- [ ] Charts/graphs have dark mode variants

### Light Mode Requirements
- [ ] Text contrast meets WCAG AA
- [ ] Subtle shadows for depth
- [ ] Proper use of gray scale
- [ ] No pure white (#fff) backgrounds - use off-white

---

## 9. Testing Protocol

### Phase 1: Local Development

```bash
npm run dev
```

1. Open http://localhost:3000/buy/[slug]
2. Test all interactive elements
3. Check console for errors
4. Verify all links work

### Phase 2: Desktop Testing (Chrome DevTools MCP)

Test in Chrome DevTools:
- [ ] Page loads without errors
- [ ] All images load
- [ ] Interactive elements work
- [ ] Forms submit correctly
- [ ] Affiliate links have correct tags

### Phase 3: Mobile Testing (Playwright MCP)

```javascript
// Test on mobile viewport
await page.setViewportSize({ width: 375, height: 667 });
await page.goto('https://localhost:3000/buy/[slug]');
```

Test:
- [ ] Layout doesn't break
- [ ] Text is readable
- [ ] Buttons are tappable (min 44x44px)
- [ ] Horizontal scrolling (should NOT exist)
- [ ] Images don't overflow

### Phase 4: Build Verification

```bash
npm run build
```

Must complete with:
- [ ] No TypeScript errors
- [ ] No build warnings (except known ones)
- [ ] Page generates successfully

### Phase 5: Rich Results Test

Go to: https://search.google.com/test/rich-results

Enter your URL and verify:
- [ ] All items detected
- [ ] No critical errors
- [ ] Product snippets valid
- [ ] Articles detected (if applicable)
- [ ] FAQ valid
- [ ] Breadcrumbs valid

### Phase 6: Post-Deployment

After `npx vercel --prod`:
1. Visit production URL
2. Re-run Rich Results Test on production URL
3. Check Google Search Console
4. Request indexing

---

## 10. Deployment & Indexing

### Deployment Commands

```bash
# Build locally first
npm run build

# If build succeeds, deploy
npx vercel --prod
```

### Post-Deployment Checklist

- [ ] Visit production URL
- [ ] Test all functionality
- [ ] Run Rich Results Test on production URL
- [ ] Verify all rich results are valid

### Google Search Console

1. Go to https://search.google.com/search-console
2. URL Inspection → Enter your URL
3. Verify "Enhancements and experience" shows:
   - Product snippets ✓
   - Merchant listings ✓
   - Breadcrumbs ✓
   - FAQ ✓
   - Review snippets ✓
4. Click "Request Indexing"

### Expected Search Console Enhancements

Note: **Articles will NOT appear** in Search Console enhancements.
This is normal - Article schema helps SEO but doesn't create a visual enhancement.

---

## 11. Common Mistakes to Avoid

### ❌ Schema Mistakes

| Mistake | Consequence | Fix |
|---------|-------------|-----|
| Using `MedicalWebPage` | No Article rich result | Use `Article` |
| Using `Drug` for banned substance | Product validation error | Use `ChemicalSubstance` |
| Missing `image` on Product | Invalid Merchant Listings | Add image URL |
| Missing `offers` on Product | Invalid Product snippets | Add offers object |
| Missing `aggregateRating` | Reduced rich result visibility | Add rating data |

### ❌ Citation Mistakes

| Mistake | Consequence | Fix |
|---------|-------------|-----|
| Broken URLs | Lost credibility, poor UX | Verify every URL |
| Outdated sources | Reduced E-E-A-T | Use sources < 5 years old |
| Missing source types | Incomplete coverage | Include all required types |
| No "View Source" buttons | Poor UX | Add clickable buttons |

### ❌ UI/UX Mistakes

| Mistake | Consequence | Fix |
|---------|-------------|-----|
| Not testing mobile | Broken layout | Test on 375px width |
| Ignoring dark mode | Invisible text | Test both themes |
| Tiny tap targets | Frustrating UX | Min 44x44px buttons |
| Missing image optimization | Slow page load | Use Next.js Image |

### ❌ Product Data Mistakes

| Mistake | Consequence | Fix |
|---------|-------------|-----|
| Wrong Amazon link | Lost affiliate revenue | Verify each link |
| Missing affiliate tag | No tracking | Include `?tag=blushandbreat-21` |
| Outdated prices | User distrust | Verify current prices |
| Missing `isTopPick` | No featured product | Set ONE to true |
| Missing `image` on top pick | Invalid schema | Add image URL |

### ❌ TypeScript Mistakes

| Mistake | Consequence | Fix |
|---------|-------------|-----|
| Adding fields not in interface | Build error | Update types/buy-page.ts |
| Wrong field types | Build error | Match interface exactly |
| Missing required fields | Build error | Include all required fields |

---

## 📝 Implementation Workflow Summary

```
1. RESEARCH (2-3 hours)
   ├── Keyword research with deep research tool
   ├── Medical citations research
   ├── Legal alternatives research
   └── Verify ALL URLs work

2. DATA ENTRY (1-2 hours)
   ├── Add entry to buy-pages.json
   ├── Follow exact structure from this guide
   ├── Include all required sections
   └── Update types/buy-page.ts if adding new fields

3. BUILD & TEST (30 minutes)
   ├── npm run build
   ├── Fix any TypeScript errors
   ├── Test locally with npm run dev
   └── Test mobile and dark mode

4. RICH RESULTS VALIDATION (15 minutes)
   ├── Run Rich Results Test
   ├── Fix any schema errors
   ├── Rebuild if changes needed
   └── Verify all items valid

5. DEPLOY & INDEX (15 minutes)
   ├── npx vercel --prod
   ├── Test production URL
   ├── Request indexing in Search Console
   └── Document in commit message
```

---

## 📚 Reference Files

| File | Purpose |
|------|---------|
| `lib/data/buy-pages.json` | All buy page data |
| `types/buy-page.ts` | TypeScript interfaces |
| `components/buy/BuyPageSchema.tsx` | Schema markup generation |
| `pages/buy/[slug].tsx` | Page template |
| `components/buy/` | All UI components |
| `CONTEXT.md` | Project-wide rules |

---

## 🎯 Success Criteria

A buy page is ready for indexing when:

1. ✅ Rich Results Test shows all items valid
2. ✅ No TypeScript/build errors
3. ✅ Mobile layout works perfectly
4. ✅ Dark mode works perfectly
5. ✅ All citation URLs are verified working
6. ✅ All product links have affiliate tags
7. ✅ Featured product has image
8. ✅ FAQs cover all common questions
9. ✅ Word count is 3000+
10. ✅ Content is factually accurate

---

*Last Updated: December 2025*
*Based on learnings from Buy DMAA India page implementation*
