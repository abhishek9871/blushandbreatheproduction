# UI Verification & Fix Agent Prompt

## Project Context

You are tasked with verifying and fixing UI issues on a recently built transactional buy page for a health/wellness Next.js website. The page is live at:

**Production URL**: `https://www.blushandbreath.com/buy/dmaa-india`

**Project Path**: `c:\Users\VASU\Desktop\blushandbreatheproduction`

## What Was Built

A dynamic buy page template (`/buy/[slug].tsx`) with multiple custom components for the "Buy DMAA India" keyword. The page includes:

### Key Files to Inspect/Fix

| File | Purpose |
|------|---------|
| `pages/buy/[slug].tsx` | Main page template |
| `components/buy/BuyPageHero.tsx` | Hero section with quick stats |
| `components/buy/MedicalCitationBadge.tsx` | Medical sources badge with "View Sources" dropdown |
| `components/buy/RiskCalculator.tsx` | Interactive customs risk calculator form |
| `components/buy/SupplierWarningCard.tsx` | Supplier warning cards |
| `components/buy/TestimonialCard.tsx` | User testimonial cards |
| `components/buy/ConversionCTA.tsx` | Call-to-action boxes |
| `components/buy/AlternativesComparison.tsx` | Legal alternatives comparison table/cards |
| `components/buy/LegalStatusTable.tsx` | Country-wise legal status table |
| `components/buy/EffectComparisonChart.tsx` | Effects/side effects comparison with tabs |
| `components/buy/BuyPageSchema.tsx` | Schema markup (no UI) |
| `components/buy/index.ts` | Component exports |
| `lib/data/buy-pages.json` | Page content data |

## Your Mission

**DO**: Find and fix all UI/UX issues affecting functionality and user experience on BOTH desktop and mobile.

**DO NOT**: Change any content, text, copy, data, or SEO elements. Only fix visual/interactive issues (eg. such as headings color, dropdown content, etc).

## Interactive Elements to Test

### 1. Medical Citation Badge - "View Sources" Dropdown
- **Location**: Below hero section
- **Expected**: Click "View Sources" button → reveals list of 5 medical sources
- **Test**: Does it expand/collapse? Is animation smooth? Does it work on mobile?

### 2. Table of Contents - Collapsible
- **Location**: Left sidebar on desktop, above content on mobile  
- **Expected**: Click "Table of Contents" → expands/collapses list of 8 sections
- **Test**: Does toggle work? Do anchor links scroll to correct sections?

### 3. Risk Calculator Form
- **Location**: Section 2 of page
- **Expected**: 
  - Port dropdown (6 options: Mumbai, Delhi, Chennai, Kolkata, Bangalore, Hyderabad)
  - Declaration Value slider/input
  - Declaration Type dropdown (Personal Use, Commercial, Gift)
  - Courier Type dropdown (International, Domestic)
  - Quantity slider/input
  - "Calculate Risk" button → shows results
- **Test**: Do all dropdowns open? Does calculation work? Do results display correctly?

### 4. Effect Comparison Chart Tabs
- **Location**: Health Risks section
- **Expected**: Two tabs - "Effects Comparison" and "Side Effects Comparison"
- **Test**: Do tabs switch content? Are bar charts visible? Do they render on mobile?

### 5. FAQ Accordion
- **Location**: Section 8, before final CTA
- **Expected**: 8 FAQ questions, each clickable to expand/collapse answer
- **Test**: Does each question expand independently? Smooth animation? Works on mobile?

### 6. Alternatives Comparison - View Toggle
- **Location**: Legal Alternatives section
- **Expected**: Toggle between "Cards" view and "Table" view
- **Test**: Does toggle work? Do both views render correctly?

### 7. Supplier Warning Cards - Expandable Details
- **Location**: Supplier Warnings section
- **Expected**: 3 cards, each may have expandable details
- **Test**: Any "Show More" or expandable content working?

### 8. Mobile-Specific Tests
- **Hamburger Menu**: Opens/closes navigation
- **Sticky Header**: Stays fixed on scroll, doesn't overlap content
- **Touch Targets**: All buttons minimum 44x44px
- **Horizontal Scroll**: No unwanted horizontal scrolling
- **Tables**: Responsive or horizontally scrollable

## Testing Procedure

### Step 1: Build & Run Locally
```bash
cd c:\Users\VASU\Desktop\blushandbreatheproduction
npm run dev
```
Navigate to: `http://localhost:3000/buy/dmaa-india`

### Step 2: Desktop Testing (Chrome DevTools MCP)
Use Chrome DevTools MCP tools to:
1. Navigate to the page
2. Take snapshots of interactive elements
3. Click each interactive element and verify state changes
4. Check console for JavaScript errors
5. Take full-page screenshots before/after fixes

### Step 3: Mobile Testing (Playwright MCP)
Use Playwright MCP tools to:
1. Set viewport to mobile (375x812 for iPhone, 390x844 for iPhone 14)
2. Test all interactive elements
3. Test hamburger menu
4. Verify touch interactions work
5. Check for layout issues

### Step 4: Fix Issues Found
For each issue:
1. Identify the component file
2. Read the relevant code section
3. Make minimal, targeted fixes
4. Do NOT change any text content, data, or copy
5. Preserve all existing styling patterns

## Common UI Issues to Look For

1. **Dropdowns not opening**: Check `onClick` handlers, `useState` for open/close state
2. **Accordion not expanding**: Check `aria-expanded` attributes, height transitions
3. **Tabs not switching**: Check active state management, conditional rendering
4. **Calculator not calculating**: Check form state, calculation function, results display
5. **Mobile menu stuck**: Check z-index, overflow, body scroll lock
6. **Charts not rendering**: Check conditional rendering, data availability
7. **Touch targets too small**: Ensure minimum 44px height for mobile buttons
8. **Sticky header overlap**: Check scroll margin for anchor links

## Code Style Guidelines

- Use existing Tailwind classes from the project
- Follow existing component patterns
- Use `dark:` prefix for dark mode styles
- Use responsive prefixes: `md:` for tablet+, `lg:` for desktop+
- Preserve all existing `aria-*` accessibility attributes

## Output Format

After testing, provide:
1. **Issues Found**: List each UI bug with component name and description
2. **Fixes Applied**: Show each edit made with before/after
3. **Verification**: Confirm each fix works on both desktop and mobile
4. **Screenshots**: Provide before/after screenshots where possible

## Important Constraints

⚠️ **CRITICAL RULES**:
1. **NO content changes** - Do not modify any text, titles, descriptions, FAQ answers, etc.
2. **NO data changes** - Do not modify `buy-pages.json` or any data files
3. **NO SEO changes** - Do not touch meta tags, schema, canonical URLs
4. **UI/UX only** - Focus solely on making interactive elements work correctly
5. **Minimal changes** - Make the smallest possible fix for each issue
6. **Test after each fix** - Verify the fix works before moving on

## Start Here

1. First, read `pages/buy/[slug].tsx` to understand the page structure
2. Read `components/buy/index.ts` to see all components
3. Start local dev server
4. Begin systematic testing of each interactive element listed above
5. Document and fix issues as you find them

---

**Begin your verification now. Test thoroughly on both desktop (1920x1080) and mobile (375x812) viewports.**