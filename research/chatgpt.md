1. NewsAPI limitations (Nov 2025)
Truncated content field: NewsAPI’s content field is always shortened. The docs state the unformatted content is “truncated to 200 chars”
newsapi.org
. In practice you often see "[+123 chars]" appended to indicate additional omitted text beyond that limit. (Older answers noted 260 chars on free plan
stackoverflow.com
, but current docs say 200.)
No full text on any plan: No NewsAPI plan ever returns full articles. The NewsAPI FAQ explicitly confirms this: “Is the full article content available with any plan? No…you are able to use the URL included with each result to scrape this yourself if required.”
newsapi.org
. Even paid tiers only give snippets/headlines (paid plans add real-time and volume, but not full bodies).
Official guidance: NewsAPI recommends scraping on your side. Their docs say: “We don’t provide the full article content… but you can scrape the content yourself using the URL”
newsapi.org
. For example, their Node.js guide shows using axios to fetch the page HTML and then @mozilla/readability (with jsdom) to extract the main article text
newsapi.org
. In short, NewsAPI expects you to (legally) fetch and parse each URL yourself if you want more than the summary.
2. Legally safe patterns for “full” content
(a) Open the source URL directly
New browser tab/link: Show only the snippet in-app and have a “Read on [Source]” button that opens the original article URL in a new tab.
UX: The user leaves your app to read the full story. It’s simple but breaks immersion.
Legal: Very safe. You are not copying content, just linking. This respects copyright and NewsAPI’s policy since you’re sending users to the publisher
scoredetect.com
.
Maintenance: Trivial (just an <a href> or window.open).
Cost: Zero (no extra calls, no backend).
Performance: Instant.
In-app iframe/WebView: Attempt to embed the publisher’s page inside your app (e.g. an <iframe> or mobile WebView).
UX: Keeps user in-app, but almost never works. Most news sites set X-Frame-Options: SAMEORIGIN or Content-Security-Policy that blocks framing. Even if it loaded, the full page (with ads, nav, scripts) can be very heavy and inconsistent with your UI.
Legal: Still just hosting the original page (with their scripts), so probably fine legally. But many sites specifically forbid embedding their pages.
Maintenance: Unpredictable. You’d have to handle iframes breaking or resizing.
Performance: Poor (loads entire site each time). Also, cross-origin iframes can’t be controlled or styled easily.
Implementation idea: <iframe src={article.url} style={{width:'100%',height:'100%'}} />. In practice you’ll likely hit refusal to display.
(b) Backend full-text extraction (server-side scraping)
How it works: On clicking an article, your app calls a small backend (e.g. a serverless Node.js function) with the article’s URL. The function fetches the HTML (using axios or fetch), then runs a parser (like Mozilla’s Readability, which is open-source) to strip out menus/ads and extract the main text. You return that cleaned HTML or text to the frontend to display.
Pros & Cons:
UX: Excellent (user sees a full article rendered in your app, similar style to normal content). You control fonts, sizing, etc. Very engaging.
Legal/Copyright: Risky. You are copying the full text of a copyrighted article. NewsAPI’s Terms forbid “reproduce or republish copyrighted material”
newsapi.org
. Scraping a page whose ToS disallows it can also be a ToS violation and possibly trigger DMCA issues, especially if content is paywalled
nyulawreview.org
. If you do this, at minimum always credit the source (title, author, site name, link)
scoredetect.com
. Legally, it’s a gray area – some argue it could be “fair use” (transformation or news reporting), but it’s not guaranteed.
Maintenance: Moderate. You must run and maintain a backend function. News sites have different HTML structures, so Readability may sometimes fail or grab extra content (though it works well for most news articles). If a site changes layout, your parser might break. But using a well-tested library (Readability) minimizes tweaks.
Cost: Very low if done serverlessly. All components (Node, axios, jsdom, Readability) are free. You can deploy on Vercel/Netlify free tier. Only cost is computing time: fetching & parsing a page once per article view.
Performance: Slower than direct linking (you must wait for the fetch+parse). Usually sub-second if the page is fast. With caching (see below) it’s faster on repeat. The heavy lifting is on your serverless function, so the user only waits ~500ms+ on first load.
Caching & Rate-Limit: Since NewsAPI free-tier only allows 100 calls/day
newsapi.org
, we should save any useful data we can. Cache scraped articles (keyed by URL) for some time (e.g. a Redis or KV cache with TTL of hours) so repeated reads don’t re-fetch the page. Also throttle scraping: process one URL at a time or use a queue library (like p-limit) to avoid hammering a site or your function. This conserves both NewsAPI quota (only used for initial search) and respects publisher servers.
Implementation (React+Vite):
Backend function: e.g. GET /api/fetchArticle?url=.... In Node, do const html = await axios.get(url), const dom = new JSDOM(html.data, {url}), const article = new Readability(dom.window.document).parse(). Return JSON { title: article.title, content: article.content }.
Frontend: On article page, call that endpoint (via fetch) passing the NewsAPI URL. Show a loading state. When JSON returns, render article.title and insert article.content into a <div dangerouslySetInnerHTML> (after sanitizing if desired). Show an attribution link (“Source: [publication]”) somewhere. Handle errors by falling back to a “Read original” link or message.
Edge cases: If paywall or no content, article.content may be tiny or null; detect that and skip scraping (just show a note “Full text unavailable, view original”).
(c) RSS feeds or publisher APIs
RSS feeds: Many sites offer RSS/Atom feeds. Some feeds include the full article content (in <content:encoded> or similar), while others provide only a summary.
Approach: When an article’s source domain has an RSS feed, you can try fetching it instead. If the feed item for that article contains full text, just use it. Otherwise, treat it like a summary feed and fall back to scraping or linking.
Pros: If full-text RSS is available, it’s easy and very fast to use. It’s also authorized by the publisher (they provided the feed for sharing).
Cons: Not all sites provide full content in RSS. Many only do summaries with a “read more” link. Managing feeds requires extra logic (finding the feed URL, parsing XML).
Implementation: E.g. use rss-parser on the backend. For each article URL, see if you can derive a feed URL (common patterns: /rss, /feed). If found, fetch that feed and look for a matching link. If full content exists, return it instead of scraping.
Publisher APIs: Some news publishers have their own APIs (often requiring registration). For example, The Guardian Open Platform gives free API access to all Guardian articles (non-commercial dev use)
open-platform.theguardian.com
. Others: The New York Times API (metadata and some content), NewsAPI itself (but it lacks full text), etc.
Approach: If you identify that an article’s source is (say) the Guardian, you could call the Guardian API to get the full text. Same for any publisher API you’re willing to integrate.
Pros: Legal and reliable – the publisher intends developers to use their API. Often includes images and structured data.
Cons: Usually site-specific: you’d need separate code/keys for each API. Many publishers have no public API or very limited access.
Implementation: In the detail handler, if source == 'theguardian.com', call Guardian API (requires an API key) to get the article. Otherwise fall back to normal methods. This is more work but can pay off for high-traffic sources.
(d) Third-party full-text/news APIs (free tiers)
Several companies offer news APIs with generous free tiers, some with full text:
GNews API: Free: 100 requests/day, up to 10 articles/request, 12‑hour delay, 30-day archive
gnews.io
. Paid plans include “Full content”
gnews.io
. Free plan has no full text, just headlines/snippets.
Mediastack (apilayer): Free: 100 calls/month, headlines/snippets only (no full text)
finlight.me
. Broad coverage (7500+ sources) but returns only title/description and URL.
NewsData.io: Offers free daily credits (e.g. 200) for headlines search. It used to have a “full_content” field, but recent changelog indicates free users no longer get full content. (We couldn’t fetch docs easily, but assume free = summary only.)
Finlight: Free 5,000 requests/month (10,000 via referral) with full article text (focused on finance/news analytics)
finlight.me
. However, Finlight is geared to financial press, not general news.
Others: NewsCatcher, ContextualWeb News, GDELT, etc – many exist, but most free tiers are limited and focus on data extraction, not full articles.
Comparison: Most free news APIs resemble NewsAPI: they give you headlines and a snippet or summary, not the full body. Finlight is a notable exception (but niche). GNews requires paid plan for body text. Mediastack free is just for dev/trial. Rate limits vary (100/day vs 100/month vs 5k/month). Coverage differs too (NewsAPI claimed 150k sources; Mediastack ~7.5k; GNews ~60k; Finlight ~curated finance). Always check each provider’s terms: they may also forbid republishing full content without license.
Use cases: Such APIs might be used alongside NewsAPI for redundancy or extra features (like sentiment or NLP), but none offer a clear, unlimited free full-text solution comparable to simply scraping via the URL. For a small hobby app, they are mostly either redundant or more restrictive than NewsAPI’s free plan.
(e) AI-based expansion (LLM)
Idea: Take the NewsAPI title/description and feed it to an AI model (e.g. OpenAI’s GPT, Google Gemini) with a prompt to “expand” or “rewrite” it into a fuller article. The AI generates a new article that reads like the original but is (hopefully) mostly original text.
UX: Can produce a fluent, engaging “article” view in-app. The user can read it as if it were a human-written summary. However, AI can hallucinate details or make factual errors.
Legal: This is “derivative” content. It’s not a verbatim copy of the original article, so many consider it more permissible. It’s arguably a transformative use of the snippet. Still, it’s untested legally, so it’s gray. Many news sites might not approve of this either. However, it avoids directly reproducing copyrighted text (the AI-generated text is (in theory) new).
Cost: Using an LLM has a cost. E.g. OpenAI’s GPT-3.5 Turbo costs ~$0.002 per 1K tokens. A 500-word article (~3000 tokens) would cost about $0.006. That’s a few cents per article. OpenAI gives $18 free credit (soon to be used up if many calls). Gemini/Claude have their own pricing (likely paid). There are no truly free LLM APIs for unlimited use. So this method can get expensive at scale.
Performance: API calls take a couple of seconds, so detail pages would load slower (show a spinner). You must also handle rate-limits (OpenAI, etc.). Caching results is even more important here to avoid repeated billing.
Implementation: Frontend or backend can make the call. For example, serverless function POST /api/expandArticle sending { title, description } with a prompt like “Write a full news article from this title and snippet.” Then display the returned text in the app.
Trade-offs: The article won’t match the original exactly. Some readers might notice differences or slightly fabricated content. But it could feel “complete” enough. For a hobby project, this is an intriguing option if you want to avoid scraping, but be cautious about misinformation.
3. Special considerations
Paywalls / Subscription sites: If a source article is behind a paywall, your scraper or iframe will usually just hit a gate page. Circumventing paywalls is likely illegal. Under the DMCA, bypassing a technological barrier to access copyrighted content is prohibited
nyulawreview.org
. Best practice: detect paywalled cases (e.g. seeing only a login form) and do not try to scrape. Instead, inform the user “This article is paywalled – please read it on the original site,” and provide the link. Many apps simply skip paywalled content or only show the summary.
Attribution & links: Always credit the original source. At a minimum, display the article title, author (if available), and publication name, with a hyperlink to the original URL
scoredetect.com
. Many aggregators show something like “Source: [Publication]” below the article. Do not strip out copyright notices. ScoreDetect’s guide advises: “Visibly credit the author, publication name, date, and source URL; link back to the original rather than uploading copies”
scoredetect.com
. This is both ethical and aligns with fair use norms.
Rate limiting & caching: Combine NewsAPI limits with your own. The free Developer key allows 100 requests/day
newsapi.org
, so minimize calls (cache search results, page through only if needed). Cache scraped/extracted content per article URL (e.g. in-memory or a small Redis) with a reasonable TTL (perhaps a few hours to a day for news). Respect each publisher’s crawling limits: e.g. don’t issue tens of scrapes per second for one site. In practice, queue/sleep between fetches. If you use LLMs or third-party APIs, cache those outputs too (to avoid exceeding rate limits or paying repeatedly).
4. Concrete architectural options
Option A – Zero-backend (pure linking)
Architecture (text): React+Vite frontend only. Use NewsAPI in the browser to search headlines. Render list of titles/snippets. Detail view shows only the summary (from NewsAPI) plus a button/link “Read on [source]” opening the original URL in a new tab.
Tech: React, Fetch/axios from browser to newsapi.org, plain HTML/JS/CSS. Host on Netlify/Vercel as a static site.
Cost: Free (NewsAPI Developer key). No server costs.
Article page behavior: User sees title, image, snippet from NewsAPI. A prominent “View Original” link or button. No attempt to fetch full text.
Pros: Simplest to build, no legal risk (just linking). Very fast pages.
Cons: Poor UX for detail page (user jumps away). The article “feels incomplete” in-app.
Recommended? Only for the minimal MVP. Good for early prototypes or if budget/effort absolutely minimal.
Option B – Lightweight serverless scraper
Architecture: React+Vite frontend + one Node.js serverless function (on Vercel/Netlify).
Frontend uses NewsAPI to list articles.
On detail, React calls the serverless /api/fetchArticle?url=....
The serverless fetches HTML + extracts content, returns it to React.
Tech stack:
Frontend: React, use useEffect to fetch content from your function.
Serverless: Node.js (or TypeScript) function. Dependencies: axios (HTTP), jsdom, @mozilla/readability. (All free/open-source.)
Hosting: Vercel/Netlify free tier (both support Node functions). They offer plenty of free invocations for a small app.
Cost: ~$0 on free tiers (Vercel/Netlify offer thousands of function calls). NewsAPI calls (100/day) are free under Developer plan
newsapi.org
.
Article page behavior:
User clicks an article. Show a loading spinner. Call backend to get title and content (HTML).
Display the full text inside the app.
Example: show <h1>{title}</h1><div dangerouslySetInnerHTML={{ __html: content }} />.
Include a “Source: [Name]” with a link at bottom.
If fetch fails (paywall/blocked), show a message and a “Read on original” link.
Why recommended: Balances UX and ease-of-implementation. Provides real content in-app on a small budget. The main downsides are legal caution (we noted) and slightly increased complexity (but still manageable). For a hobby/early-stage project, this is a strong choice.
Option C – Hybrid (NewsAPI + RSS/alt APIs)
Architecture:
Still use NewsAPI for discovery (browser or tiny server call).
For each article, first try an alternate route: e.g. see if the domain has an RSS with full text or a known publisher API (like Guardian). If so, fetch from there.
Otherwise fallback to the same serverless scraping as Option B (or to linking).
Tech: Same as B plus possibly: an RSS parsing library (or call an RSS-to-JSON service), extra API clients (e.g. fetch Guardian API via fetch). Possibly incorporate a secondary news API (like NewsData) by calling it either in client or in a serverless function.
Cost: Still minimal. The Guardian API is free for non-commercial devs (just sign up)
open-platform.theguardian.com
. Calling extra APIs might need additional keys but no extra hosting cost.
Behavior:
If an article is from a source with full RSS/API, the detail page fetches the content from that instead of scraping.
E.g. Guardian article detail gets its text via the Guardian API.
If not, use scraper.
When to use: If your app targets a few big news sources that offer full content, this yields the best content fidelity. Also helps avoid scraping legal issues for those. However, it adds maintenance (tracking multiple sources).
Recommended? Good if you specifically care about sources like The Guardian, which allow their content to be reused. Otherwise, it’s extra work for modest gain.
Option D – AI Expansion (LLM-powered)
Architecture: React+Vite frontend + serverless function that calls an LLM API (e.g. OpenAI).
On detail page, send title+description to LLM via your backend, get generated text back.
Tech:
Backend: Node.js function calling OpenAI’s API (or other model’s API).
Frontend: As usual, but showing AI content instead.
Cost: Non-zero. OpenAI API is paid: e.g. GPT-3.5 Turbo ~ $0.002/1K tokens. A 500-word article (~4000 tokens) might cost ~$0.008. Dozens of articles could be several dollars per month. Free credit ($18) may cover initial usage.
Behavior:
User sees a fully written article (AI-generated) that loosely follows the snippet.
It may read well, but could contain inaccuracies or invented details.
You should still label the source (maybe with a disclaimer “This content was AI-generated.”).
Recommended? Innovative but risky. For a hobby project, if you have some credit and want novelty, you could try it. But it’s generally not as reliable as pulling real content, and costs money. It might also violate some providers’ terms or user expectations.
5. Implementation Checklist (Option B example)
Below is a step-by-step checklist for implementing Option B (Lightweight serverless scraper), which we recommend for a balance of UX and cost. Adjust as needed for your environment (Vercel, Netlify, etc.):
Setup serverless environment:
Choose your host (e.g. Vercel, Netlify). Both have free Node functions.
Create a new function (for example, fetchArticle.js).
Install dependencies (backend):
In your function’s project, run:
npm install axios jsdom @mozilla/readability
These libraries let you fetch pages and extract readable text.
Write the fetch function: (pseudocode)
export default async function handler(req, res) {
  const url = req.query.url;
  if (!url) {
    return res.status(400).json({ error: 'No URL provided' });
  }
  try {
    // Fetch the full HTML of the page
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'NewsApp/1.0 (+https://yourapp.com)' }
    });
    const html = response.data;
    // Parse and extract article content
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    if (article && article.content) {
      // Return title and HTML content
      res.status(200).json({
        title: article.title,
        content: article.content
      });
    } else {
      // Extraction failed (likely paywall or no <article> tag)
      res.status(204).json({ error: 'No content extracted' });
    }
  } catch (err) {
    console.error('Error fetching article:', err.message);
    res.status(502).json({ error: 'Failed to retrieve article' });
  }
}
Key points: Use axios.get(url) to fetch. Use jsdom+Readability on the HTML (const reader = new Readability(dom.window.document)). article.content is sanitized HTML of the article body.
Error handling: Catch network errors (504, etc.) and return an error. Check article for null (if readability found nothing). Respond with an error code or message.
Implement caching (optional but recommended):
To avoid re-scraping the same URL repeatedly, cache the results. In a quick prototype, you might use an in-memory map (persists only while the function instance lives). For more persistence, use a free KV store (e.g. Upstash Redis has a free tier). Example: before fetching, check cache[url]; if exists and not expired, return cached content. Otherwise, fetch + parse + store in cache with a timestamp.
This will save time and reduce load on both your function and the target site.
Frontend: trigger content fetch:
In your React detail page (e.g. ArticleDetail.tsx), get the NewsAPI article object (via props or router state) which contains url, source.name, etc.
On mount, call the backend:
useEffect(() => {
  async function loadContent() {
    setLoading(true);
    try {
      const res = await fetch(`/api/fetchArticle?url=${encodeURIComponent(article.url)}`);
      if (res.ok) {
        const data = await res.json();
        setFullTitle(data.title);
        setFullHtml(data.content);
      } else {
        // handle no content or error
        setError('Full text not available');
      }
    } catch (err) {
      setError('Error fetching article');
    }
    setLoading(false);
  }
  loadContent();
}, [article.url]);
Skeleton: Show a spinner (Loading...) while loading is true.
Display: If fullHtml is set, render it:
<h1>{fullTitle || article.title}</h1>
<div className="article-body" dangerouslySetInnerHTML={{ __html: fullHtml }} />
<p><em>Source: {article.source.name} (<a href={article.url} target="_blank">original link</a>)</em></p>
Use dangerouslySetInnerHTML cautiously – you may sanitize fullHtml (whitelist tags) to avoid any malicious scripts (though Readability output should be fairly clean).
Error & edge handling (frontend):
If error state is set (or if response code was 204), display a friendly message: e.g. “Sorry, this article is unavailable. [Read original]” with a link.
If fullHtml came back empty, do the same.
Handle non-HTML URLs: If article.url points to a PDF or non-page, skip fetch and just show “Open in new tab” link.
Attribution & links:
In the article view, always show the source. For example:
<footer className="article-footer">
  Article courtesy of <strong>{article.source.name}</strong>. 
  <a href={article.url} target="_blank" rel="noopener noreferrer">
    Read original article
  </a>.
</footer>
This satisfies the recommendation to credit and link back
scoredetect.com
. If author is provided by NewsAPI (article.author), you can include that too.
Styling and UX:
Design article pages so they look like a news article (readable font, line height, etc.).
Consider adding a “Back” link to the list.
Possibly a bookmark or share button.
Keep paragraphs short and use whitespace – news articles are typically not walls of text.
Use a loading skeleton (gray boxes) instead of raw “Loading...” text for polish.
Testing & edge cases:
Test with several sources (e.g. BBC, CNN, a blog) to see if readability works reliably.
Try a known paywalled site (e.g. NYTimes) – your function will likely return nothing or an error (because of paywall). Ensure your app handles that gracefully (fallback link).
If you hit Cloudflare or other anti-bot (HTTP 403), you might need to set a real browser-like User-Agent or skip. Do NOT try to bypass with headless browsers – that’s complex and risky.
For HTML parsing issues, you could catch exceptions and fallback.
Caching and rate-limits recap:
Cache backend responses per URL for some period (e.g. 12 hours).
Limit your NewsAPI queries (max 100/day on dev plan). Possibly pre-fetch in bulk at night and cache.
On backend, optionally add a small delay (setTimeout) or concurrency limit if you get rate-limited by publishers.
By following these steps, your app will serve full (or nearly full) articles in the UI while staying within a small budget. Remember to test thoroughly (handling failures is important for a good user experience), and always cite and link the original source as we’ve done above. Good luck with the implementation!