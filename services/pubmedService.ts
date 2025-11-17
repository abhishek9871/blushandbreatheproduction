import type { Article } from '../types';

const PUBMED_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

export const fetchPubMedArticles = async (query: string = 'health wellness beauty', maxResults: number = 10): Promise<Article[]> => {
  try {
    // Step 1: Search for article IDs
    const searchUrl = `${PUBMED_BASE}/esearch.fcgi?db=pmc&term=${encodeURIComponent(query)}+AND+open+access[filter]&retmax=${maxResults}&retmode=json&sort=date`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    
    const ids = searchData.esearchresult?.idlist || [];
    if (ids.length === 0) return [];

    // Step 2: Fetch article details
    const summaryUrl = `${PUBMED_BASE}/esummary.fcgi?db=pmc&id=${ids.join(',')}&retmode=json`;
    const summaryRes = await fetch(summaryUrl);
    const summaryData = await summaryRes.json();

    const articles: Article[] = [];
    for (const id of ids) {
      const article = summaryData.result?.[id];
      if (!article) continue;

      articles.push({
        id: `https://pmc.ncbi.nlm.nih.gov/articles/PMC${id}/`,
        title: article.title || 'Untitled',
        description: article.title || '',
        imageUrl: '',
        category: 'Health',
        date: article.pubdate || new Date().toISOString(),
        content: '', // Will be fetched on article page
      });
    }

    return articles;
  } catch (error) {
    console.error('PubMed fetch failed:', error);
    return [];
  }
};

export const fetchPubMedFullArticle = async (pmcId: string): Promise<string> => {
  try {
    const match = pmcId.match(/PMC(\d+)/);
    if (!match) return '';

    const id = match[1];
    const fetchUrl = `${PUBMED_BASE}/efetch.fcgi?db=pmc&id=${id}&retmode=xml`;
    const res = await fetch(fetchUrl);
    const xml = await res.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    
    let content = '';
    
    // Get abstract
    const abstract = doc.querySelector('abstract');
    if (abstract) {
      content += '## Abstract\n\n';
      const abstractParas = abstract.querySelectorAll('p');
      abstractParas.forEach(p => {
        content += p.textContent?.trim() + '\n\n';
      });
    }
    
    // Get body sections
    const body = doc.querySelector('body');
    if (body) {
      const sections = body.querySelectorAll('sec');
      sections.forEach(section => {
        const title = section.querySelector('title')?.textContent;
        if (title) content += `## ${title}\n\n`;
        
        const paragraphs = section.querySelectorAll('p');
        paragraphs.forEach(p => {
          const text = p.textContent?.trim();
          if (text) content += text + '\n\n';
        });
      });
    }

    return content.trim() || 'Full article content not available.';
  } catch (error) {
    console.error('PubMed fetch failed:', error);
    return '';
  }
};
