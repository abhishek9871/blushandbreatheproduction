# Buy Page Quick Checklist
## Use this checklist for every new `/buy/[slug]` page

---

## Pre-Implementation

- [ ] Read `docs/BUY_PAGE_IMPLEMENTATION_GUIDE.md` fully
- [ ] Identify target substance/product
- [ ] Confirm legal status in India

---

## Research Phase

- [ ] Run keyword research prompt (see guide)
- [ ] Run medical citations research prompt (see guide)
- [ ] Run legal alternatives research prompt (see guide)
- [ ] **VERIFY every URL works** (critical!)
- [ ] Save research results for reference

---

## Data Entry

- [ ] Add entry to `lib/data/buy-pages.json`
- [ ] Include ALL required sections
- [ ] Add 10-15 verified medical citations
- [ ] Add featured product with:
  - [ ] `image` URL
  - [ ] `buyLink` with `?tag=blushandbreat-21`
  - [ ] `rating` and `reviewCount`
- [ ] Add 3-5 alternatives with:
  - [ ] `image` URL for `isTopPick: true` products
  - [ ] Verified Amazon links
  - [ ] Current prices
- [ ] Add 6-8 FAQs
- [ ] Update `types/buy-page.ts` if adding new fields

---

## Build & Local Test

- [ ] `npm run build` - No errors
- [ ] `npm run dev` - Test locally
- [ ] Test on mobile viewport (375px)
- [ ] Test dark mode
- [ ] Test light mode
- [ ] Verify all links work
- [ ] Verify all images load

---

## Rich Results Test

Go to: https://search.google.com/test/rich-results

- [ ] Product snippets - Valid
- [ ] Merchant listings - Valid (check image!)
- [ ] Articles - Valid (uses `Article` not `MedicalWebPage`)
- [ ] Breadcrumbs - Valid
- [ ] FAQ - Valid
- [ ] Review snippets - Valid
- [ ] No "Drug" type errors (use `ChemicalSubstance`)

---

## Deploy

- [ ] `npx vercel --prod`
- [ ] Visit production URL
- [ ] Re-run Rich Results Test on production

---

## Index

- [ ] Google Search Console → URL Inspection
- [ ] Verify enhancements detected
- [ ] Request Indexing
- [ ] Commit with descriptive message

---

## Schema Quick Reference

### ✅ USE
```javascript
'@type': 'Article'           // For main content
'@type': 'ChemicalSubstance' // For banned substances
'@type': 'Product'           // For recommendations (with image!)
```

### ❌ DON'T USE
```javascript
'@type': 'MedicalWebPage'    // Not supported for rich results
'@type': 'Drug'              // Triggers Product validation
'@type': 'Substance'         // Same issue
```

---

## Common Fixes

| Error | Fix |
|-------|-----|
| "Either offers, review or aggregateRating should be specified" | Change `Drug` to `ChemicalSubstance` |
| "Missing field image" on Merchant Listings | Add `image` to product with `isTopPick: true` |
| Articles not detected | Change `MedicalWebPage` to `Article` |
| TypeScript build error | Update `types/buy-page.ts` |

---

*Reference: `docs/BUY_PAGE_IMPLEMENTATION_GUIDE.md` for detailed instructions*
