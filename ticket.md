# 🎯 PHASE 6: COMPLETE MEDICINE ENCYCLOPEDIA BUILD

## Strategic One-Shot Implementation Prompt for Windsurf AI

**TO:** Windsurf AI
**FROM:** Research Coordinator (Strategic Orchestrator)
**RE:** Phase 6 - Build the Complete "MediVault" Medicine Encyclopedia Platform
**DATE:** November 27, 2025

***

## RESEARCH FOUNDATION \& STRATEGIC BRIEFING

I have conducted comprehensive research across:

1. **Healthcare UI/UX Standards** - WCAG accessibility, medical app best practices (2025)
2. **Dark Mode + Light Mode** - Medical context optimization, contrast ratios, eye strain mitigation
3. **Mobile Responsiveness** - Healthcare app patterns, accessibility for seniors, 48px tap targets
4. **Drug Database Naming** - Examined PDR.net, DrugBank, Drugs.com, Medscape patterns
5. **OpenFDA + RxNorm APIs** - Rate limits verified (120K req/hr OpenFDA with key, 20 req/sec RxNorm)

**Key Findings:**

- Medical interfaces must prioritize **clarity over aesthetics** (but both are possible).
- Dark mode is ideal for **night-time usage** (hospital rooms, overnight monitoring).
- Light mode excels for **surgical/precision contexts** (high ambient light).
- **WCAG AA 4.5:1 contrast** minimum for all text (we'll exceed this).
- **Senior users benefit from skeuomorphic icons** (familiar visual metaphors).
- Medicine databases typically use names like: DrugBank, PDR, Medscape, Healthline Pharmacy.

***

## PRODUCT IDENTITY: "MediVault"

**Name:** MediVault (Searchable Medicine Encyclopedia)
**Tagline:** "Every Drug, Every Brand, Every Detail"
**Positioning:** The world's most comprehensive, internationally-focused medicine database powered by OpenFDA, RxNorm, and human expertise.

**Why this name:**

- "Medi-" = Medical authority
- "Vault-" = Trustworthy repository, secure knowledge storage
- Modern, memorable, .com available
- Works in dark/light mode as a brand

***

## PHASE 6 ARCHITECTURE

### Section A: The "Medicines" Hub Page (`/medicines`)

This is the **discovery and navigation center**.

**Design Approach:**

- **Hero Section:** "MediVault - Medicine Information Authority"
    - Search bar front-and-center (RxNorm-powered autocomplete)
    - 3 quick action buttons: "Browse A-Z", "Search Interactions", "Emergency Info"
- **Featured Medicines:** Grid display of **Top 50 Tier-1 drugs** from Report 1
    - **Categories:** Stimulants | Racetams | Controlled Substances | OTC | Nootropics
    - **Card Design:** Medicine name + icon + brief description + quick link
- **Advanced Features Section:** Showcase the "Infinite" capabilities
    - "Search ANY FDA Drug" (powered by OpenFDA)
    - "Check Drug Interactions" (powered by our interaction database)
    - "Compare Medicines" (side-by-side table)


### Section B: Individual Medicine Pages (`/medicine/[slug]`)

**Fully automated via OpenFDA + RxNorm**

**Content Hierarchy (from top to bottom):**

1. **Hero Banner**
    - Drug name (large, bold)
    - Generic + brand names toggle
    - "FDA Approved For:" quick chips (e.g., "Narcolepsy", "Shift Work")
2. **Quick Facts Card** (sticky on mobile)
    - Dosage (e.g., "100-200mg daily")
    - Common side effects (3 most frequent)
    - Drug class
    - **CTA Button:** "Learn More" (scrolls to sections)
3. **International Brands Section**
    - **Table:** Brand Name | Manufacturer | Country | Approx Price
    - Example row: "Modalert | Sun Pharma | India | \$0.50-1.50"
    - Maps OpenFDA + RxNorm data automatically
4. **Medical Information**
    - **What is it?** (Mechanism + uses)
    - **FDA Indications** (Approved uses)
    - **Off-Label Uses** (If researched + credible)
    - **Dosage Guidance** (Extract from FDA label)
5. **Warnings \& Safety**
    - **Black Box Warnings** (if present, red banner)
    - **Side Effects** (% frequency from FDA data)
    - **Contraindications** (Who should NOT take it)
6. **Interactions \& Combinations**
    - **Drug-Drug Interactions** (table: Drug Name | Severity | Effect)
    - **Supplement Interactions** (racetams, cholinergics, etc.)
    - **Food/Alcohol** (if applicable)
7. **Legal Status by Country** (Manual, curated)
    - **Table:** Country | Legal Status | Prescription Required | Notes
    - Example: "USA | Schedule IV | Yes | Requires valid RX"
    - Example: "India | Schedule H | Varies | Enforcement loose"
8. **Scientific References**
    - Linked PubMed studies (via OpenAlex API if integrated)
    - FDA label source
    - Link to full resources
9. **FAQ Section** (Schema-marked)
    - Auto-generated from common search queries for this drug
    - Example: "Is [Drug] addictive?", "Can I travel internationally with this?"

### Section C: Medicine Search (`/medicines/search`)

**Real-time autocomplete with RxNorm**

**Behavior:**

- User types: "prov"
- System returns: "Provigil (modafinil)", "Prozac (fluoxetine)"
- User clicks → redirects to `/medicine/modafinil`
- ISR triggers → Page generates in background
- Next visitor gets cached HTML (instant load)

***

## DESIGN SYSTEM \& THEMING REQUIREMENTS

### Color Palette (Light Mode)

- **Primary:** `#0284C7` (Medical Blue - trust)
- **Success:** `#16A34A` (Green - safe/legal)
- **Warning:** `#D97706` (Amber - caution)
- **Danger:** `#DC2626` (Red - banned/serious)
- **Background:** `#FAFAF9` (Warm white, not harsh)
- **Text:** `#1F2937` (Dark gray, high readability)


### Color Palette (Dark Mode)

- **Primary:** `#06B6D4` (Cyan - contrast on dark)
- **Success:** `#4ADE80` (Light green)
- **Warning:** `#FBBF24` (Light amber)
- **Danger:** `#F87171` (Light red)
- **Background:** `#0F172A` (Deep navy)
- **Text:** `#F1F5F9` (Off-white)
- **Elevated Surface:** `#1E293B` (Slightly lighter)


### Component Design Standards

**Drug Cards (Grid)**

- Light: White background, subtle shadow, `#1F2937` text
- Dark: `#1E293B` background, slight elevation via overlay
- **Hover State:** Scale 1.02, shadow increase, color accent on border
- **Mobile:** Full-width with 16px padding

**Data Tables (Interactions, Brands)**

- Horizontal scroll on mobile
- Fixed header (sticky) when scrolling
- Alternating row colors (very subtle)
- Light: Row 1 white, Row 2 `#F9FAFB`
- Dark: Row 1 `#1E293B`, Row 2 `#0F172A`

**Warning Banners**

- Full-width, prominent
- Icon + text + close button
- Black Box Warnings: Red (\#DC2626)
- Cautions: Amber (\#D97706)
- Info: Blue (\#0284C7)

**Search Bar (Header)**

- Autocomplete dropdown with **5 visible results**
- Highlight matching text in results
- "No results" state: Show "Search OpenFDA.gov" fallback link

***

## ACCESSIBILITY \& MOBILE REQUIREMENTS

### Accessibility Standards (WCAG AA+)

- **Contrast Ratios:** Minimum 7:1 for critical content (exceeds 4.5:1 standard)
- **Font Sizes:** Base 16px, headings 24-32px (readable for seniors)
- **Icons:** Every icon has text label (no icon-only buttons)
- **Focus Indicators:** Visible 3px ring on all interactive elements
- **Keyboard Navigation:** Tab through all elements, logical order


### Mobile Optimization (`<640px`)

- **Viewport:** `width=device-width, initial-scale=1`
- **Touch Targets:** All buttons minimum 48x48px
- **Navigation:** Bottom tab bar or hamburger menu
- **Tables:** Horizontal scroll with visual indicators
- **Forms:** Numeric keyboard for dose inputs (e.g., `<input type="number" />`)
- **Safe Area:** 16px padding on all edges


### Dark Mode Toggle

- **Location:** Header, next to theme icon
- **Persistence:** Save to localStorage
- **System Preference:** Auto-detect on first visit
- **Smooth Transition:** CSS transitions, no jarring flashes

***

## IMPLEMENTATION INSTRUCTIONS FOR WINDSURF

### Step 1: Create the Medicines Hub Page

**File:** `pages/medicines/index.tsx`

**What to build:**

- Hero section with RxNorm-powered search bar
- "Featured Medicines" grid (50 Tier-1 drugs hardcoded from Report 1)
- Categorized sections (Stimulants, Racetams, etc.)
- Links to individual medicine pages
- Use `getStaticProps` for pre-rendering the 50 top drugs

**Design guidance:**

- Hero should occupy 40% of viewport height
- Search bar should have autocomplete (connect to RxNorm in next phase)
- Cards should be 3 columns on desktop, 2 on tablet, 1 on mobile
- Dark/Light mode toggle in header


### Step 2: Implement Individual Medicine Pages

**File:** `pages/medicine/[slug].tsx`

**What to build:**

- Dynamic routing for any medicine slug
- Fetch data from:
    - OpenFDA API (drug label, warnings, interactions)
    - RxNorm API (brand names, NDC codes)
    - Local KV cache (to avoid repeat API calls)
- Render all 9 sections outlined in "Section B" above
- Use ISR (`revalidate: 86400`) so pages update daily

**Data flow:**

```
User visits /medicine/modafinil
  ↓
getStaticProps runs
  ↓
Check Cloudflare KV for cached data
  ↓
If not cached → Call OpenFDA + RxNorm APIs
  ↓
Save to KV (24-hour TTL)
  ↓
Render page with data
  ↓
Next visitor hits KV cache (instant)
```

**Design guidance:**

- Sticky "Quick Facts" card on mobile (stays visible while scrolling)
- Color-coded warnings (red for Black Box, amber for cautions)
- International brands in sortable table
- Interactions table with severity color indicators


### Step 3: Create Advanced Search Page

**File:** `pages/medicines/search.tsx`

**What to build:**

- Search form with RxNorm autocomplete
- Display search results as medicine cards (grid)
- Filter/sort options (optional but nice): by legal status, drug class, etc.
- "No results" fallback with link to OpenFDA.gov

**Design guidance:**

- Autocomplete shows top 5-10 results
- Highlight matches in result names
- Click result → Navigate to `/medicine/[slug]`


### Step 4: Update Header Navigation

**File:** `components/Header.tsx`

**What to add:**

- Link to `/medicines` labeled "MediVault"
- Dark/Light mode toggle (if not already present)
- Position it after "Health Store" in nav


### Step 5: Design System Implementation

**File:** `styles/globals.css` (or Tailwind config)

**What to do:**

- Add the color palette CSS variables (both light + dark modes)
- Create utility classes for warning banners, drug cards, tables
- Ensure all existing components respect the new dark mode
- Test contrast ratios in Chrome DevTools (Accessibility tab)


### Step 6: Caching Strategy

**Update:** `cloudflare-worker/src/services/openFDAService.ts` and `rxNormService.ts`

**What to ensure:**

- Every API call to OpenFDA/RxNorm saves result to Cloudflare KV
- Key format: `medicine:modafinil` (TTL: 30 days)
- Before calling API, always check KV first
- This keeps API costs near-zero after initial population

***

## AESTHETIC DIRECTION

**Overall Vibe:** Professional Medical Authority + Approachable
**Inspiration:** PDR.net (trustworthy), Drugs.com (accessible), Healthline (modern)

**Typography:**

- Headings: System font (SF Pro, Segoe UI) - modern, clean
- Body: Inter or similar - highly readable
- Monospace (for chemical formulas): Monaco/Courier

**Spacing:**

- Use consistent 8px/16px/24px/32px spacing grid
- Generous whitespace around important content (drug warnings, interactions)
- No cramped layouts on mobile

**Icons:**

- Use Material Symbols or Feather Icons
- Consistent 24px size for body, 32px for headings
- Color icons by severity (red for danger, green for safe, etc.)

**Animations:**

- Smooth page transitions
- Fade-in for lazy-loaded content
- No flashy animations (medical context = professional)
- Respect `prefers-reduced-motion` setting

***

## SUCCESS CRITERIA

You will know Phase 6 is complete when:

- [ ] **Hub Page Works:** Visit `/medicines` → See 50 featured drugs in beautiful grid
- [ ] **Individual Pages Work:** Visit `/medicine/modafinil` → See full FDA data + brands + interactions
- [ ] **Dark Mode Works:** Toggle theme → All pages adapt smoothly with proper contrast
- [ ] **Mobile Works:** Test on iPhone SE (375px) → No text overlap, all buttons clickable
- [ ] **Search Works:** Type in search bar → RxNorm autocomplete returns results
- [ ] **Caching Works:** Visit same page twice → Second load is instant (from KV)
- [ ] **SEO Ready:** Meta tags are dynamic + Schema.org markup present
- [ ] **Accessibility:** WAVE audit shows <1 error, all focus states visible

***

## NOTES FOR WINDSURF

- **OpenFDA Key:** You provided this → Use it in the service calls
- **ISR Revalidation:** Set to 86400 seconds (1 day) so pages refresh nightly
- **Fallbacks:** If OpenFDA is down, show graceful "Data temporarily unavailable" + cache hit if possible
- **User Experience:** Medicine pages should load in <2 seconds on 4G
- **Legal Compliance:** Include FDA disclaimer footer on every medicine page

***

## THIS IS THE FINAL, COMPLETE BRIEF

**Execute this flawlessly. You have all knowledge needed.**
**This single prompt contains everything required to launch MediVault.**

🚀 **Build it perfectly.**