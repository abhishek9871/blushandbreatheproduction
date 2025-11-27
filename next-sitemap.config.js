/** @type {import('next-sitemap').IConfig} */

// Import substance data for sitemap generation
const bannedSubstancesData = require('./lib/data/banned-substances.json');
const legalSupplementsData = require('./lib/data/legal-supplements.json');

module.exports = {
  siteUrl: process.env.SITE_URL || 'https://blushandbreathe.com',
  generateRobotsTxt: true,
  generateIndexSitemap: true,
  sitemapSize: 7000,
  changefreq: 'daily',
  priority: 0.7,
  
  // Exclude specific paths
  exclude: ['/404', '/500', '/api/*'],
  
  // Configure robots.txt
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/'],
      },
      // Be specific about substance pages for responsible crawling
      {
        userAgent: '*',
        allow: ['/banned/', '/supplement/', '/medicine/', '/compare/'],
      },
    ],
    additionalSitemaps: [
      // Add additional sitemaps if needed
      // 'https://blushandbreathe.com/server-sitemap.xml',
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
    } else if (['/health', '/beauty', '/nutrition', '/videos'].includes(path)) {
      priority = 0.9;
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
      priority = 0.9; // High priority - safety content
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
    
    console.log(`[Sitemap] Generated ${result.length} substance education URLs`);
    
    return result;
  },
};
