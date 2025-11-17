import { fetchPubMedFullArticle } from './pubmedService';
import { generateFullArticle } from './contentGenerator';

const READER_ENDPOINT = import.meta.env.VITE_READER_ENDPOINT as string | undefined;

const cleanMarkdown = (md: string) => {
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
};

const toHtml = (md: string) => {
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

const tryRSSContent = async (url: string): Promise<FullArticleResult | undefined> => {
  if (!READER_ENDPOINT) return undefined;
  
  try {
    const hostname = new URL(url).hostname;
    
    const rssFeeds: Record<string, string> = {
      'cbsnews.com': 'https://www.cbsnews.com/latest/rss/health',
      'sciencedaily.com': 'https://www.sciencedaily.com/rss/health_medicine.xml',
      'medicalnewstoday.com': 'https://www.medicalnewstoday.com/rss',
      'news-medical.net': 'https://www.news-medical.net/tag/feed/Health.aspx',
      'medicalxpress.com': 'https://medicalxpress.com/rss-feed/',
    };
    
    const feedUrl = Object.entries(rssFeeds).find(([domain]) => hostname.includes(domain))?.[1];
    if (!feedUrl) return undefined;
    
    const endpoint = READER_ENDPOINT.replace(/\/$/, '') + '/rss?url=' + encodeURIComponent(feedUrl);
    const res = await fetch(endpoint);
    if (!res.ok) return undefined;
    
    const data = await res.json() as { articles: any[] };
    const item = data.articles.find((i: any) => i.link === url);
    
    if (item && item.content) {
      const cleaned = cleanMarkdown(item.content);
      return {
        title: item.title,
        html: sanitizeHtml(toHtml(cleaned)),
        markdown: cleaned,
        source: hostname
      };
    }
  } catch (e) {
    return undefined;
  }
  return undefined;
};

export const fetchFullArticle = async (url: string): Promise<FullArticleResult> => {
  // Try PubMed Central first (free, legal, full articles)
  if (url.includes('pmc.ncbi.nlm.nih.gov') || url.includes('PMC')) {
    try {
      const content = await fetchPubMedFullArticle(url);
      if (content && content.length > 100) {
        const html = toHtml(content);
        return {
          title: 'Full Article',
          html: sanitizeHtml(html),
          markdown: content,
          source: 'PubMed Central'
        };
      }
    } catch (e) {
      console.error('PubMed fetch failed:', e);
    }
  }

  // Try Jina Reader for other sources
  const tryWorker = async () => {
    if (!READER_ENDPOINT) return undefined;
    const endpoint = READER_ENDPOINT.replace(/\/$/, '') + '/read?url=' + encodeURIComponent(url);
    const res = await fetch(endpoint, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) return undefined;
    const data = await res.json().catch(() => undefined) as any;
    if (!data) return undefined;
    const cleanedMd = data.markdown ? cleanMarkdown(String(data.markdown)) : undefined;
    const html = data.html || (cleanedMd ? toHtml(cleanedMd) : undefined);
    return { title: data.title, html: html ? sanitizeHtml(String(html)) : undefined, markdown: cleanedMd, source: data.source } as FullArticleResult;
  };

  const viaWorker = await tryWorker().catch(() => undefined);
  if (viaWorker && (viaWorker.html || viaWorker.markdown)) return viaWorker;

  // If Jina Reader fails, try RSS content as fallback
  const rssContent = await tryRSSContent(url);
  if (rssContent && rssContent.html) return rssContent;

  // Last resort: direct Jina Reader call
  const u = new URL(url);
  const proto = u.protocol.replace(':', '');
  const jinaUrl = `https://r.jina.ai/${proto}://${u.host}${u.pathname}${u.search}`;
  const res = await fetch(jinaUrl);
  if (!res.ok) throw new Error('Reader fetch failed');
  const md = await res.text();
  const cleanedMd = cleanMarkdown(md);
  const html = toHtml(cleanedMd);
  return { markdown: cleanedMd, html: sanitizeHtml(html), source: new URL(url).hostname };
};
