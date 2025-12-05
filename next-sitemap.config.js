/** @type {import('next-sitemap').IConfig} */

// Import substance data for sitemap generation
const bannedSubstancesData = require('./lib/data/banned-substances.json');
const legalSupplementsData = require('./lib/data/legal-supplements.json');
const articlesData = require('./lib/data/articles.json');

// ═══════════════════════════════════════════════════════════════════
// PRIORITY URLs - Excluded from main sitemap (in sitemap-priority.xml)
// These get their own dedicated sitemap for faster indexing
// ═══════════════════════════════════════════════════════════════════
const PRIORITY_GUIDE_SLUGS = [
  'natural-steroids-guide',
  'dbal-max-review-2025',
  'pregnancy-safe-pre-workout',
  'best-legal-steroids-cutting',
  'breastfeeding-safe-pre-workout',
];

// Berberine Launch Campaign - Isolated sitemap for EU markets
const BERBERINE_GUIDE_SLUGS = [
  'berberine-kopen-belgie-gids',
  'berberine-vs-ozempic-prix',
  'berberine-ervaringen-2025',
];

// High-Ticket Seller Pages - Isolated sitemap for priority crawling
// GLP Lab France Content Cluster (Tier 1 Keywords - Difficulty 1-3/10)
const SELLER_PAGE_SLUGS = [
  'glp-lab-avis-france',           // Main pillar - "GLP Lab avis" (2/10)
  'glp-lab-forum-france',          // Cluster - "GLP Lab forum" (1/10)
  'complement-alimentaire-glp-1-guide', // Cluster - "Complément alimentaire GLP-1" (2/10)
  'glp-lab-arnaque-enquete',       // Cluster - "GLP Lab arnaque" (3/10)
];

const PRIORITY_BUY_SLUGS = [
  'berberine-india',
  'clenbuterol-india',
  'dmaa-india',
];

module.exports = {
  siteUrl: process.env.SITE_URL || 'https://www.blushandbreath.com',
  generateRobotsTxt: true,
  generateIndexSitemap: true,
  sitemapSize: 7000,
  changefreq: 'daily',
  priority: 0.7,
  outDir: 'public', // Output directory for sitemap files
  
  // Exclude specific paths - ONLY include SEO-valuable static content pages
  // Exclude dynamic/API-dependent pages that will show different content to Googlebot
  exclude: [
    '/404', 
    '/500', 
    '/api/*', 
    '/_*',
    // Dynamic pages that depend on external APIs or user data - will cause "crawled but not indexed"
    '/bookmarks',      // User-specific localStorage data - empty for Googlebot
    '/health',         // Dynamic news feed from external API
    '/beauty',         // Dynamic product listings from external API  
    '/nutrition',      // Dynamic nutrition content from API
    '/videos',         // Dynamic YouTube API content
    '/health-store',   // Dynamic product catalog from external API
    '/medicines/search',       // Search results page - dynamic
    '/medicines/interactions', // Interactive tool - no static SEO content
    '/article/*',      // Dynamic article pages
    '/product/*',      // Dynamic product pages
    // Priority URLs - excluded from main sitemap (in sitemap-priority.xml for faster indexing)
    '/guide/natural-steroids-guide',
    '/guide/dbal-max-review-2025',
    '/guide/pregnancy-safe-pre-workout',
    '/guide/best-legal-steroids-cutting',
    '/guide/breastfeeding-safe-pre-workout',
    '/buy/berberine-india',
    '/buy/clenbuterol-india',
    '/buy/dmaa-india',
    // Berberine EU Launch - excluded (in sitemap-berberine.xml)
    '/guide/berberine-kopen-belgie-gids',
    '/guide/berberine-vs-ozempic-prix',
    '/guide/berberine-ervaringen-2025',
    // High-Ticket Seller Pages - excluded (in sitemap-sellers.xml)
    '/guide/glp-lab-avis-france',
    '/guide/glp-lab-forum-france',
    '/guide/complement-alimentaire-glp-1-guide',
    '/guide/glp-lab-arnaque-enquete',
  ],
  
  // Configure robots.txt
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/', 
          '/admin/', 
          '/bookmarks',           // User-specific page
          '/medicines/search',    // Search tool
          '/medicines/interactions', // Interactive tool
          '/article/',            // Dynamic articles
          '/product/',            // Dynamic products
        ],
      },
      // Explicitly allow Next.js static assets (JS/CSS) for proper rendering
      {
        userAgent: '*',
        allow: ['/_next/static/'],
      },
      // Explicitly allow SEO-valuable substance education pages
      {
        userAgent: '*',
        allow: ['/banned/', '/supplement/', '/compare/', '/guide/', '/info/', '/medicines'],
      },
    ],
    additionalSitemaps: [
      'https://www.blushandbreath.com/sitemap-priority.xml',
      'https://www.blushandbreath.com/sitemap-berberine.xml',
      'https://www.blushandbreath.com/sitemap-sellers.xml',
    ],
  },
  
  // Transform function to customize sitemap entries
  transform: async (config, path) => {
    // Set higher priority for main pages
    let priority = config.priority;
    let changefreq = config.changefreq;
    
    if (path === '/') {
      priority = 1.0;
      changefreq = 'daily';
    } else if (['/health', '/beauty', '/nutrition', '/videos', '/medicines'].includes(path)) {
      priority = 0.9;
      changefreq = 'daily';
    } else if (path === '/medicines/search') {
      priority = 0.85;
      changefreq = 'daily';
    } else if (path.startsWith('/article/') || path.startsWith('/product/')) {
      priority = 0.8;
      changefreq = 'weekly';
    } else if (path.startsWith('/info/')) {
      // Info pages (about, contact, faq, shipping, returns, etc.)
      priority = 0.6;
      changefreq = 'monthly';
    }
    // Substance Education Pages
    else if (path.startsWith('/banned/')) {
      priority = 0.9; // High priority - safety content (pillar pages)
      changefreq = 'weekly';
    } else if (path.startsWith('/guide/')) {
      priority = 0.85; // High priority - cluster articles (SEO content hub)
      changefreq = 'weekly';
    } else if (path.startsWith('/supplement/')) {
      priority = 0.8;
      changefreq = 'weekly';
    } else if (path.startsWith('/compare/')) {
      priority = 0.7;
      changefreq = 'monthly';
    } else if (path.startsWith('/medicine/')) {
      priority = 0.7;
      changefreq = 'weekly';
    }
    
    return {
      loc: path,
      changefreq,
      priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      alternateRefs: config.alternateRefs ?? [],
    };
  },
  
  // Additional paths to include (for dynamic routes with fallback: 'blocking')
  additionalPaths: async (config) => {
    const result = [];
    
    // ═══════════════════════════════════════════════════════════════════
    // BANNED SUBSTANCES
    // ═══════════════════════════════════════════════════════════════════
    const bannedSubstances = bannedSubstancesData.substances || [];
    bannedSubstances.forEach(substance => {
      result.push({
        loc: `/banned/${substance.slug}`,
        changefreq: 'weekly',
        priority: 0.9,
        lastmod: new Date().toISOString(),
      });
    });
    
    // ═══════════════════════════════════════════════════════════════════
    // LEGAL SUPPLEMENTS
    // ═══════════════════════════════════════════════════════════════════
    const supplements = legalSupplementsData.supplements || [];
    supplements.forEach(supplement => {
      result.push({
        loc: `/supplement/${supplement.slug}`,
        changefreq: 'weekly',
        priority: 0.8,
        lastmod: new Date().toISOString(),
      });
    });
    
    // ═══════════════════════════════════════════════════════════════════
    // COMPARISON PAGES
    // ═══════════════════════════════════════════════════════════════════
    // Generate comparison URLs for each banned substance with its alternatives
    bannedSubstances.forEach(substance => {
      if (substance.legalAlternatives && substance.legalAlternatives.length > 0) {
        substance.legalAlternatives.forEach(altSlug => {
          result.push({
            loc: `/compare/${substance.slug}-vs-${altSlug}`,
            changefreq: 'monthly',
            priority: 0.7,
            lastmod: new Date().toISOString(),
          });
        });
      }
    });
    
    // ═══════════════════════════════════════════════════════════════════
    // GUIDE PAGES (CLUSTER ARTICLES)
    // ═══════════════════════════════════════════════════════════════════
    // Content Hub cluster articles (Kratom, SARMs, DMAA, Phenibut guides)
    // NOTE: Priority guides are excluded (they're in sitemap-priority.xml)
    const articles = articlesData.articles || [];
    articles.forEach(article => {
      // Skip priority articles - they have their own sitemap for faster indexing
      if (PRIORITY_GUIDE_SLUGS.includes(article.slug)) {
        return;
      }
      // Skip berberine articles - they have their own sitemap for EU market indexing
      if (BERBERINE_GUIDE_SLUGS.includes(article.slug)) {
        return;
      }
      // Skip seller pages - they have their own sitemap for priority crawling
      if (SELLER_PAGE_SLUGS.includes(article.slug)) {
        return;
      }
      result.push({
        loc: `/guide/${article.slug}`,
        changefreq: 'weekly',
        priority: 0.85, // High priority - cluster content for SEO
        lastmod: article.modifiedDate || new Date().toISOString(),
      });
    });
    
    console.log(`[Sitemap] Generated ${result.length} substance education URLs`);
    console.log(`  - Banned substances: ${bannedSubstances.length}`);
    console.log(`  - Legal supplements: ${supplements.length}`);
    console.log(`  - Guide articles: ${articles.length}`);
    console.log(`  - Comparison pages: ${result.length - bannedSubstances.length - supplements.length - articles.length}`);
    
    return result;
  },
};
