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

    if (url.pathname.endsWith("/read") || url.pathname === "/read") {
      const target = url.searchParams.get("url");
      if (!target) return errorJSON(400, "Missing url parameter");
      if (!isHttpUrl(target)) return errorJSON(400, "Invalid url (must be http/https)");

      const host = new URL(target).hostname;
      if (!isHostAllowed(host, env)) return errorJSON(403, "Host not allowed");

      // Use external reader (free) to transform HTML to Markdown
      const result = await fetchWithReader(target);
      if (!result || !result.markdown || result.markdown.trim().length < 40) {
        return errorJSON(502, "Reader failed or returned empty content");
      }

      return okJSON({
        title: getTitleFromMarkdown(result.markdown),
        markdown: result.markdown,
        source: host,
      });
    }

    return errorJSON(404, "Not found");
  },
};
