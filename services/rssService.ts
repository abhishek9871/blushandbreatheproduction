import type { Article } from '../types';

const READER_ENDPOINT = import.meta.env.VITE_READER_ENDPOINT as string | undefined;

const RSS_FEEDS = {
  health: [
    'https://www.cbsnews.com/latest/rss/health',
    'https://www.sciencedaily.com/rss/health_medicine.xml',
    'https://www.medicalnewstoday.com/rss',
    'https://www.news-medical.net/tag/feed/Health.aspx',
    'https://medicalxpress.com/rss-feed/',
  ],
};

const cleanHtml = (html: string | undefined): string => {
  if (!html) return '';
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/on\w+\s*=\s*'[^']*'/gi, '');
};

export const fetchRSSArticles = async (category: 'health' = 'health'): Promise<Article[]> => {
  if (!READER_ENDPOINT) return [];
  
  const feeds = RSS_FEEDS[category] || [];
  const articles: Article[] = [];

  for (const feedUrl of feeds) {
    try {
      const endpoint = READER_ENDPOINT.replace(/\/$/, '') + '/rss?url=' + encodeURIComponent(feedUrl);
      const res = await fetch(endpoint);
      if (!res.ok) continue;
      
      const data = await res.json() as { articles: any[] };
      
      for (const item of data.articles.slice(0, 5)) {
        if (!item.link || !item.title) continue;

        const article: Article = {
          id: item.link,
          title: item.title,
          description: item.description || '',
          imageUrl: item.image || '',
          category: 'Health',
          date: item.pubDate || new Date().toISOString(),
          content: cleanHtml(item.content || item.description || ''),
        };

        articles.push(article);
      }
    } catch (error) {
      console.error(`Failed to fetch RSS feed ${feedUrl}:`, error);
    }
  }

  return articles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};
