## Recommended Solution: Lightweight Serverless Article Extraction for English RSS Feeds

Based on your requirements—willingness to use serverless functions, focus on English content, and priority on logged-in user experience—here's the optimal approach for getting full article content from RSS feeds.[1][2][3]

### Architecture Overview

Deploy a **lightweight serverless function** (Vercel Edge Functions or Netlify Functions) that extracts full article content on-demand when users click to read an article. This approach balances simplicity, cost-effectiveness, and performance.[3][4][5]

### Core Implementation Strategy

**1. Article Extraction Library**

Use **@extractus/article-extractor** as your primary extraction engine. This Node.js library is actively maintained (updated 5 days ago as of November 2024), specifically designed for extracting article content, and works well in serverless environments.[6][7][8]

Key advantages:
- Built on Mozilla's Readability algorithm with enhancements[9][10]
- Returns structured data: title, description, content, author, published date, images[8][6]
- Supports custom transformations for specific domains[6][8]
- Works with both URLs and pre-fetched HTML[8][6]
- Lightweight enough for edge deployment[6]

Alternative: **Mozilla Readability** directly for maximum reliability, though @extractus/article-extractor offers more features.[11][10][12]

**2. Serverless Platform Choice**

**Vercel Edge Functions** (recommended):[4][13][3]
- **Free tier**: 100,000 invocations/month, 1 hour runtime logs[14]
- **Edge runtime**: Faster cold starts than traditional serverless (must begin response within 25 seconds)[13]
- **Duration limits**: 300s default on free tier (sufficient for article extraction)[13]
- **No cold start optimization needed** for edge functions[3][13]

**Netlify Functions** (alternative):[2][15][14]
- **Free tier**: 125,000 invocations/month[14]
- **Background functions** on Pro plan for longer-running tasks (10s-15min)[5][16][17]
- Supports TypeScript, JavaScript, and Go[5]

### Implementation Steps

**Step 1: Create Serverless Function**

For Vercel Edge Function:[18][4][3]

```javascript
// api/extract-article.js
import { extract } from '@extractus/article-extractor';

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  const { searchParams } = new URL(request.url);
  const articleUrl = searchParams.get('url');
  
  if (!articleUrl) {
    return new Response(JSON.stringify({ error: 'URL required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const article = await extract(articleUrl, {
      descriptionLengthThreshold: 120,
      contentLengthThreshold: 200
    });
    
    return new Response(JSON.stringify(article), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
```

**Step 2: Frontend Integration**

Call the serverless function when users request full article content:[6]

```javascript
async function fetchFullArticle(rssItemUrl) {
  const response = await fetch(
    `/api/extract-article?url=${encodeURIComponent(rssItemUrl)}`
  );
  const article = await response.json();
  return article; // { title, content, author, published, image, ... }
}
```

**Step 3: Cost Management**

Implement **caching** to minimize serverless invocations:[17][3]

- **Edge caching**: Set `Cache-Control` headers (available on Vercel free tier)[17][5]
- **Client-side caching**: Store extracted articles in IndexedDB/localStorage
- **Strategic extraction**: Only fetch full content when user explicitly requests it (not on RSS feed list load)[19]

### Advanced Enhancements (Optional)

**1. CORS Proxy Integration**

If some sites block direct fetching, add a lightweight CORS proxy:[20][21][22]

```javascript
// Use Cloudflare Workers as CORS proxy
const fetchWithProxy = async (url) => {
  return fetch(`https://your-worker.workers.dev/?url=${url}`);
};
```

**2. Jina Reader API Alternative**

For sites with complex structures, consider **Jina Reader API** as a fallback:[23][24][25]
- Free tier with reasonable limits[25]
- Converts HTML to clean Markdown automatically[24][23]
- Handles JavaScript-heavy sites better[24]

**3. Rate Limiting Protection**

Add rate limiting to protect your serverless function:[26][27][28]

```javascript
// Vercel KV rate limiting example
import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";

const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});
```

### Performance Optimization

**Cold Start Mitigation**:[29][30][31]

1. **Keep functions lightweight**: Minimize dependencies, bundle with esbuild[32][19]
2. **Use Edge Runtime**: Vercel Edge Functions avoid cold starts entirely[3][13]
3. **Optimize memory allocation**: Higher memory = faster execution on traditional serverless[30]
4. **Background resource loading**: Load non-critical resources asynchronously[31]

**Function Best Practices**:[33][19][32]

- Keep functions single-purpose (one function = article extraction)[19]
- Avoid long-running operations (articles should extract in <10s)[32]
- Implement proper error handling and logging[33]
- Monitor performance with built-in analytics[19]

### Cost Comparison

**Free Tier Sustainability**:[34][14]

| Platform | Invocations | Duration | Bandwidth | Commercial Use |
|----------|-------------|----------|-----------|----------------|
| Vercel | 100,000/mo | 300s default | 100GB | Not allowed on free tier[34] |
| Netlify | 125,000/mo | 10s (26s background on paid) | 100GB | **Allowed on free tier**[34] |

For 200 articles/day with logged-in users: ~6,000 invocations/month—**well within both free tiers**.[34][14]

### Alternative: Cloudflare Workers

For maximum performance and cost-efficiency:[35][36][20]

- **Free tier**: 100,000 requests/day[20]
- **Ultra-fast edge execution**: No cold starts[20]
- **Built-in caching and CORS handling**[20]

Example scraper already built: [scrapedown](https://github.com/ozanmakes/scrapedown)[35]

### Recommendation Summary

**Start with Vercel Edge Functions + @extractus/article-extractor** for:
- Zero cold start latency[13][3]
- Simple deployment process[4][18]
- Generous free tier for your use case[14]
- Built-in caching support[17]

**Upgrade path**: If you need commercial use on free tier, switch to **Netlify Functions**. If you need extreme performance and scale, migrate to **Cloudflare Workers**.[35][34][20]

This architecture keeps your implementation lightweight, maintains fast UX for logged-in users, and stays within free/low-cost tiers while providing robust full-text article extraction for English content.[1][2][3][6]

[1](https://vercel.com/docs/functions)
[2](https://www.netlify.com/blog/intro-to-serverless-functions/)
[3](https://vercel.com/blog/edge-functions-generally-available)
[4](https://vercel.com/docs/functions/quickstart)
[5](https://ikius.com/blog/vercel-vs-netlify)
[6](https://www.npmjs.com/package/@extractus/article-extractor/v/7.2.5)
[7](https://www.npmjs.com/package/@extractus/article-extractor/v/8.0.18)
[8](https://github.com/extractus/article-extractor)
[9](https://github.com/awendland/readable-web-extractor-comparison)
[10](https://github.com/mozilla/readability)
[11](https://news.ycombinator.com/item?id=28301113)
[12](https://www.libhunt.com/compare-readability-vs-parser)
[13](https://vercel.com/docs/functions/limitations)
[14](https://northflank.com/blog/vercel-vs-netlify-choosing-the-deployment-platform-in-2025)
[15](https://www.netlify.com/platform/core/functions/)
[16](https://www.takeit.agency/en/blog/vercel-vs-netlify)
[17](https://snipcart.com/blog/vercel-vs-netlify)
[18](https://mmazzarolo.com/blog/2021-06-06-metascraper-serverless-function/)
[19](https://appwrite.io/blog/post/serverless-functions-best-practices)
[20](https://www.conroyp.com/articles/serverless-api-caching-cloudflare-workers-json-cors-proxy)
[21](https://github.com/chinmay-sh/cors-serverless-proxy)
[22](https://gonzalohirsch.com/blog/secure-and-budget-friendly-cors-proxy-setup-aws/)
[23](https://www.boardflare.com/python-functions/text/jina_reader)
[24](https://blog.apify.com/jina-ai-vs-firecrawl/)
[25](https://jina.ai/reader/)
[26](https://vercel.com/changelog/vercel-waf-rate-limiting-now-generally-available)
[27](https://vercel.com/guides/add-rate-limiting-vercel)
[28](https://edge-functions-api-rate-limit.vercel.app)
[29](https://milvus.io/ai-quick-reference/how-do-serverless-platforms-optimize-cold-start-times)
[30](https://dev.to/vaib/conquering-cold-starts-strategies-for-high-performance-serverless-applications-59eg)
[31](https://www.movestax.com/post/7-cold-start-mitigation-techniques-for-serverless-apps)
[32](https://pcg.io/insights/serverless-best-practices/)
[33](https://www.freecodecamp.org/news/serverless-architecture-patterns-and-best-practices/)
[34](https://dev.to/maxniederman/netlify-vs-vercel-a-comparison-5643)
[35](https://github.com/ozanmakes/scrapedown)
[36](https://web.scraper.workers.dev)
[37](https://www.reddit.com/r/rss/comments/1bk4uhr/full_text_rss_in_2024/)
[38](https://scrape.do/blog/best-web-scraping-api/)
[39](https://github.com/ScrapeGraphAI/Scrapegraph-ai/issues/586)
[40](https://thunderbit.com/blog/best-web-scraping-apis)
[41](https://docs.graphgrid.com/tutorials/ai/rss-nlp-tutorial)
[42](https://www.webscrapingapi.com/pricing/scraper-api)
[43](https://rss.app)
[44](https://dev.to/lilxyzz/netlify-vs-vercel-2024-free-hosting-face-off-oo9)
[45](https://www.scraperapi.com/web-scraping/tools/free/)
[46](https://www.fivefilters.org/2021/google-news-rss-feeds/)
[47](https://proxyway.com/best/best-web-scraping-apis)
[48](https://codewithmukesh.com/blog/aws-lambda-text-extraction-textract-dotnet/)
[49](https://www.controlaltachieve.com/2016/11/10-readability-alternatives.html)
[50](https://www.fivefilters.org/2014/full-text-rss-33/)
[51](https://pub.aimind.so/building-a-serverless-pdf-text-extraction-solution-with-azure-functions-65dfa7d0c274)
[52](https://github.com/timothytylee/full-text-rss)
[53](https://unstructured.io/blog/introducing-unstructured-serverless-api)
[54](https://www.reddit.com/r/linuxquestions/comments/bca679/parse_html_readabilityjs_style_but_simpler/)
[55](https://stackoverflow.com/questions/5227592/extract-cdata-from-rss-xml-using-javascript)
[56](https://dl.acm.org/doi/10.1145/3431379.3460636)
[57](https://www.geeksforgeeks.org/javascript/how-to-fetch-and-parse-rss-feeds-in-javascript/)
[58](https://www.sciencedirect.com/science/article/pii/S0167739X24000360)
[59](https://github.com/mozilla/fathom/issues/86)
[60](https://blog.keyvan.net/p/full-text-rss-3)
[61](https://www.npmjs.com/package/@gardenapple/readability-cli)
[62](https://www.npmjs.com/package/@settingdust%2Farticle-extractor)
[63](https://npm-compare.com/json5,jsonc-parser,bson,hjson)
[64](https://cloudonaut.io/how-to-enable-cors-on-api-gateway-with-lambda-proxy-integration/)
[65](https://www.linkedin.com/posts/stephango_new-project-defuddle-defuddle-di%CB%88f%CA%8Cdl-activity-7302482501355061248-q_sT)
[66](https://www.npmjs.com/package/automated-readability)
[67](https://github.com/topics/article-extractor)
[68](https://www.endorlabs.com/learn/48-most-popular-open-source-tools-for-npm-applications-scored)
[69](https://www.contentstack.com/docs/developers/how-to-guides/understanding-and-resolving-cors-error)
[70](https://www.scraperapi.com/blog/python-newspaper3k/)
[71](https://www.libhunt.com/compare-Readability4J-vs-parser)
[72](https://scrapeops.io/python-web-scraping-playbook/newspaper3k/)
[73](https://jocmp.com/2025/07/12/full-content-extractors-comparing-defuddle/)
[74](https://newspaper.readthedocs.io)
[75](https://github.com/topics/mercury-parser?o=desc&s=)
[76](https://github.com/codelucas/newspaper)
[77](https://docs.sim.ai/tools/jina)
[78](https://www.geeksforgeeks.org/python/newspaper-article-scraping-curation-python/)
[79](https://dev.to/johnantony92/scraping-the-smart-wayhow-i-vibe-coded-refactoreda-free-ai-web-scraper-using-pythonjina-38hi)
[80](https://scrapfly.io/blog/posts/how-to-bypass-cloudflare-anti-scraping)
[81](https://www.scraperapi.com/blog/scrape-cloudflare-protected-websites-with-python/)
[82](https://www.splunk.com/en_us/blog/learn/serverless-functions.html)
[83](https://developers.cloudflare.com/queues/tutorials/web-crawler-with-browser-rendering/)
[84](https://upstash.com/blog/edge-rate-limiting)
[85](https://www.alibabacloud.com/blog/building-an-etl-system-the-best-practice-for-database-+-serverless-function-compute_600725)
[86](https://neilpatel.com/blog/google-reader-alternatives/)
[87](https://dev.to/wanggithub0/generating-a-custom-rss-feed-with-cloudflare-workers-a-step-by-step-guide-2m34)
[88](https://zapier.com/blog/best-rss-feed-reader-apps/)
[89](https://samirpaulb.github.io/posts/serverless-newsletter-and-contact-system/)
[90](https://strapi.io/blog/7-best-javascript-pdf-parsing-libraries-nodejs-2025)
[91](https://visualping.io/blog/rss-alternative)
[92](https://www.youtube.com/watch?v=vaO65FY-O48)
[93](https://ironpdf.com/nodejs/blog/compare-to-other-components/node-pdf-library/)
[94](https://www.reddit.com/r/rss/comments/yc63jl/any_recommendation_of_rss_service_that_has_full/)
[95](https://www.contentful.com/blog/generate-blog-rss-feed-with-javascript-and-netlify/)
[96](https://www.techaheadcorp.com/blog/39-best-node-js-libraries-frameworks/)
[97](https://www.theverge.com/24036427/rss-feed-reader-best)
[98](https://serverlessrepo.aws.amazon.com/applications/us-east-1/787245235252/serverless-rss-filtered-feed-gen)
[99](https://stackoverflow.com/questions/22565081/node-js-module-for-extracting-web-page-content)
[100](https://unstract.com/blog/open-source-document-data-extraction-with-unstract-deepseek/)
[101](https://www.reddit.com/r/Hosting/comments/1nq6hkv/vercel_vs_netlify_2025_which_free_tier_is_better/)
[102](https://www.zyte.com/blog/news-article-data-extraction-open-source-vs-closed-source-solutions/)
[103](https://www.lateral.io/resources-blog/article-extractor-api)
[104](https://payproglobal.com/answers/what-is-cold-start/)
[105](https://www.getmonetizely.com/articles/vercel-vs-netlify-which-developer-platform-has-better-pricing-for-your-modern-web-projects)
[106](https://apify.com/lukaskrivka/article-extractor-smart)
[107](https://aws.amazon.com/blogs/compute/understanding-and-remediating-cold-starts-an-aws-lambda-perspective/)
[108](https://www.webstacks.com/blog/vercel-vs-netlify)
[109](https://github.com/firecrawl/firecrawl)