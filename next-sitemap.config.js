/** @type {import('next-sitemap').IConfig} */
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
    
    // Note: Dynamic paths with fallback: 'blocking' are automatically 
    // included when they are visited. For comprehensive sitemap coverage,
    // you can fetch and add popular dynamic paths here.
    
    // Example: Add featured articles
    // const { getArticles } = await import('./services/apiService');
    // const { data: articles } = await getArticles(1);
    // articles.forEach(article => {
    //   result.push({
    //     loc: `/article/${article.id}`,
    //     changefreq: 'weekly',
    //     priority: 0.8,
    //   });
    // });
    
    return result;
  },
};
