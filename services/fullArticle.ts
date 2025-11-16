const READER_ENDPOINT = import.meta.env.VITE_READER_ENDPOINT as string | undefined;

const toHtml = (md: string) => {
  const esc = (s: string) => s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  let html = md
    .replace(/\r\n/g, "\n");
  html = html.replace(/^######\s+(.*)$/gm, '<h6>$1</h6>')
             .replace(/^#####\s+(.*)$/gm, '<h5>$1</h5>')
             .replace(/^####\s+(.*)$/gm, '<h4>$1</h4>')
             .replace(/^###\s+(.*)$/gm, '<h3>$1</h3>')
             .replace(/^##\s+(.*)$/gm, '<h2>$1</h2>')
             .replace(/^#\s+(.*)$/gm, '<h1>$1</h1>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
             .replace(/\*(.*?)\*/g, '<em>$1</em>')
             .replace(/\[(.*?)\]\((https?:[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1<\/a>');
  html = html.split(/\n\s*\n/).map(p => {
    if (/^<h\d>/.test(p.trim())) return p;
    return `<p>${p.trim()}</p>`;
  }).join('\n');
  return html;
};

const sanitizeHtml = (html: string) => {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<link[^>]*>/gi, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/on\w+\s*=\s*'[^']*'/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]+/gi, '');
};

export type FullArticleResult = { title?: string; html?: string; markdown?: string; source?: string };

export const fetchFullArticle = async (url: string): Promise<FullArticleResult> => {
  const tryWorker = async () => {
    if (!READER_ENDPOINT) return undefined;
    const endpoint = READER_ENDPOINT.replace(/\/$/, '') + '/read?url=' + encodeURIComponent(url);
    const res = await fetch(endpoint, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) return undefined;
    const data = await res.json().catch(() => undefined) as any;
    if (!data) return undefined;
    const html = data.html || (data.markdown ? toHtml(String(data.markdown)) : undefined);
    return { title: data.title, html: html ? sanitizeHtml(String(html)) : undefined, markdown: data.markdown, source: data.source } as FullArticleResult;
  };

  const viaWorker = await tryWorker().catch(() => undefined);
  if (viaWorker && (viaWorker.html || viaWorker.markdown)) return viaWorker;

  const u = new URL(url);
  const proto = u.protocol.replace(':', '');
  const jinaUrl = `https://r.jina.ai/${proto}://${u.host}${u.pathname}${u.search}`;
  const res = await fetch(jinaUrl);
  if (!res.ok) throw new Error('Reader fetch failed');
  const md = await res.text();
  const html = toHtml(md);
  return { markdown: md, html: sanitizeHtml(html), source: new URL(url).hostname };
};
