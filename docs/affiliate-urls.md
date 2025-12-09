# Programmatic SEO - Live Comparison Pages

These URLs are generated via Next.js ISR (Incremental Static Regeneration) on the production website.

## Live Production URLs

### B2B SaaS Comparisons (PartnerStack Revenue)
1. https://www.blushandbreath.com/compare/socialbee-vs-hootsuite
2. https://www.blushandbreath.com/compare/socialbee-vs-synthflow

### Beauty/Wellness Comparisons (Rakuten Revenue)
3. https://www.blushandbreath.com/compare/dyson-airwrap-vs-shark-flexstyle

---

## URL Generation Logic
- **Template**: `pages/compare/[slug].tsx`
- **ISR Revalidation**: 1 hour (3600 seconds)
- **Fallback**: `blocking` (New pages are generated on-demand)

## How to Add More Pages
1. Add product data to `utils/affiliate-data.ts`
2. Add the `slug` pair to `getStaticPaths` in `pages/compare/[slug].tsx`
3. Rebuild or let ISR generate on first request

---

*Last Updated: 2025-12-09*
