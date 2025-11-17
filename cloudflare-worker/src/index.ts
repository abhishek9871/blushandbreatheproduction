import { XMLParser } from 'fast-xml-parser';

export interface Env {
  ALLOWED_HOSTS?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

function okJSON(body: unknown, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=86400",
      ...corsHeaders,
      ...extra,
    },
  });
}

function errorJSON(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...corsHeaders,
    },
  });
}

function isHttpUrl(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch (_) {
    return false;
  }
}

function getTitleFromMarkdown(md: string | undefined) {
  if (!md) return undefined;
  const m = md.match(/^#\s+(.+)$/m);
  return m?.[1]?.trim();
}

function cleanMarkdown(md: string) {
  let cleaned = md;
  
  // Remove image URL patterns that appear as text like ![Image 19: description](url)
  cleaned = cleaned.replace(/!\[Image \d+:[^\]]*\]\([^)]+\)/g, '');
  
  // Remove standalone image URLs in parentheses
  cleaned = cleaned.replace(/\(https?:\/\/[^\s)]+\.(jpg|jpeg|png|gif|webp|svg)[^)]*\)/gi, '');
  
  // Remove common unwanted patterns
  cleaned = cleaned.replace(/^(Sign in|Sign up|Log in|Log out|Subscribe|Newsletter|Trending|Related|Share this|Tweet|Follow us|Read more|Continue reading|Click here).*$/gim, '');
  
  // Remove standalone bracketed text
  cleaned = cleaned.replace(/^\[.*?\]\s*$/gm, '');
  
  // Remove excessive whitespace
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.trim();
  
  return cleaned;
}

function toHtml(md: string) {
  let html = md.replace(/\r\n/g, "\n");
  
  // Headers
  html = html.replace(/^######\s+(.*)$/gm, '<h6>$1</h6>')
             .replace(/^#####\s+(.*)$/gm, '<h5>$1</h5>')
             .replace(/^####\s+(.*)$/gm, '<h4>$1</h4>')
             .replace(/^###\s+(.*)$/gm, '<h3>$1</h3>')
             .replace(/^##\s+(.*)$/gm, '<h2>$1</h2>')
             .replace(/^#\s+(.*)$/gm, '<h1>$1</h1>');
  
  // Bold, italic, links
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
             .replace(/\*(.*?)\*/g, '<em>$1</em>')
             .replace(/\[(.*?)\]\((https?:[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1<\/a>');
  
  // Images
  html = html.replace(/!\[(.*?)\]\((https?:[^\s)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;height:auto;" />');
  
  // Blockquotes
  html = html.replace(/^>\s+(.*)$/gm, '<blockquote>$1</blockquote>');
  
  // Unordered lists
  html = html.replace(/^[*-]\s+(.*)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);
  
  // Ordered lists
  html = html.replace(/^\d+\.\s+(.*)$/gm, '<li>$1</li>');
  
  // Code blocks
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Paragraphs
  html = html.split(/\n\s*\n/).map(p => {
    const trimmed = p.trim();
    if (!trimmed) return '';
    if (/^<(h\d|ul|ol|blockquote|pre|img)/.test(trimmed)) return trimmed;
    return `<p>${trimmed}</p>`;
  }).filter(Boolean).join('\n');
  
  return html;
}

function isHostAllowed(host: string, env: Env) {
  const list = (env.ALLOWED_HOSTS || "").trim();
  if (!list) return true; // empty = allow all
  const allowed = new Set(list.split(/\s*,\s*/).filter(Boolean).map(h => h.toLowerCase()));
  return allowed.has(host.toLowerCase());
}

async function fetchWithReader(targetUrl: string) {
  // Jina Reader expects: https://r.jina.ai/http://<host><path><search>
  const u = new URL(targetUrl);
  const proto = u.protocol.replace(':', ''); // 'http' or 'https'
  const jinaUrl = `https://r.jina.ai/${proto}://${u.host}${u.pathname}${u.search}`;
  const res = await fetch(jinaUrl, {
    headers: {
      "User-Agent": "hb-reader/1.0 (+https://example.com)",
      "Accept": "text/plain, text/markdown, */*",
      "X-With-Generated-Alt": "true",
      "X-With-Images-Summary": "true",
      "X-With-Links-Summary": "true",
      "X-Timeout": "30",
      "X-Remove-Selector": "header, footer, nav, .header, .footer, .navigation, .nav, .sidebar, .ad, .ads, .advertisement, .social-share, .comments, .related, .trending, .newsletter, .subscribe, .signup, .signin, .login, .cookie-banner, .popup, .modal, aside, [role='complementary'], [role='navigation'], [class*='share'], [class*='social'], [class*='comment'], [class*='sidebar'], [class*='related'], [class*='trending'], [class*='newsletter'], [id*='sidebar'], [id*='comment'], [id*='social']",
      "X-Target-Selector": "article, main, [role='main'], .article, .post, .content, .entry-content, .post-content, .article-content, [class*='article'], [class*='post-content'], [class*='entry-content']",
    },
    cf: { cacheEverything: true },
  });
  if (!res.ok) {
    return undefined;
  }
  const md = await res.text();
  return { markdown: md } as { markdown: string } | undefined;
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname === "/" || url.pathname === "") {
      return okJSON({ status: "ok", service: "hb-reader", time: new Date().toISOString() });
    }

    if (url.pathname.endsWith("/rss") || url.pathname === "/rss") {
      const feedUrl = url.searchParams.get("url");
      if (!feedUrl) return errorJSON(400, "Missing url parameter");
      if (!isHttpUrl(feedUrl)) return errorJSON(400, "Invalid url");

      try {
        const res = await fetch(feedUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HealthBeautyHub/1.0)' },
          cf: { cacheEverything: true, cacheTtl: 3600 },
        });
        if (!res.ok) return errorJSON(502, "Failed to fetch RSS feed");
        
        const xmlText = await res.text();
        const parser = new XMLParser({
          ignoreAttributes: false,
          attributeNamePrefix: '@_',
        });
        const data = parser.parse(xmlText);
        
        const items = data.rss?.channel?.item || data.feed?.entry || [];
        const articles = (Array.isArray(items) ? items : [items]).slice(0, 20).map((item: any) => ({
          title: item.title || '',
          link: item.link?.['@_href'] || item.link || '',
          description: item.description || item.summary || '',
          content: item['content:encoded'] || item.content || item.description || '',
          pubDate: item.pubDate || item.published || item.updated || '',
          image: item.enclosure?.['@_url'] || item['media:thumbnail']?.['@_url'] || '',
        }));

        return okJSON({ articles });
      } catch (error) {
        return errorJSON(500, "RSS parsing failed");
      }
    }

    if (url.pathname.endsWith("/read") || url.pathname === "/read") {
      const target = url.searchParams.get("url");
      if (!target) return errorJSON(400, "Missing url parameter");
      if (!isHttpUrl(target)) return errorJSON(400, "Invalid url (must be http/https)");

      const host = new URL(target).hostname;
      if (!isHostAllowed(host, env)) return errorJSON(403, "Host not allowed");

      // Use external reader (free) to transform HTML to Markdown
      const result = await fetchWithReader(target);
      if (!result || !result.markdown) {
        return okJSON({
          error: "Content extraction blocked or unavailable",
          blocked: true,
          message: "This website blocks automated content extraction. Please visit the source directly.",
          source: host,
          url: target
        });
      }

      const cleanedMarkdown = cleanMarkdown(result.markdown);
      
      return okJSON({
        title: getTitleFromMarkdown(cleanedMarkdown),
        markdown: cleanedMarkdown,
        html: toHtml(cleanedMarkdown),
        source: host,
      });
    }

    return errorJSON(404, "Not found");
  },
};
