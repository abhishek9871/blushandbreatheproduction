# Free APIs for Medicine & Supplement Articles - Complete Integration Guide

## Overview

Add high-quality, free articles with images to your medicine search app using these 100% free APIs:

✅ **Wikipedia API** - Comprehensive medicine articles + images
✅ **NIH/NLM APIs** - Official health articles (CDC, FDA, NIH)
✅ **PubMed API** - Scientific research papers + abstracts
✅ **News API** - Latest health news articles
✅ **Wikimedia Commons API** - Free medicine/supplement images
✅ **ODS NIH API** - Dietary supplement fact sheets

---

## Option 1: ⭐ Wikipedia API (BEST FOR OVERVIEW ARTICLES)

**Free**: Yes, completely free
**Coverage**: 500K+ medicine/supplement articles
**Images**: Yes, with Wikimedia Commons integration
**Authentication**: None required

### Setup

```python
import requests
import json

class WikipediaArticleFetcher:
    """
    Fetch medicine articles from Wikipedia with full details and images
    """
    
    BASE_URL = "https://en.wikipedia.org/w/api.php"
    
    @staticmethod
    def search_medicine(medicine_name: str):
        """
        Search for medicine on Wikipedia
        """
        params = {
            'action': 'query',
            'format': 'json',
            'list': 'search',
            'srsearch': medicine_name,
            'srlimit': 5  # Top 5 results
        }
        
        response = requests.get(WikipediaArticleFetcher.BASE_URL, params=params)
        results = response.json()
        
        return results['query']['search']
    
    @staticmethod
    def get_article_content(title: str):
        """
        Get full article content with introduction and images
        """
        params = {
            'action': 'query',
            'format': 'json',
            'titles': title,
            'prop': 'extracts|images|pageimages',
            'exintro': True,  # Only introduction
            'explaintext': True,  # Plain text, no markup
            'piprop': 'thumbnail',  # Get thumbnail image
            'pithumbsize': 300  # 300px thumbnail
        }
        
        response = requests.get(WikipediaArticleFetcher.BASE_URL, params=params)
        data = response.json()
        
        pages = data['query']['pages']
        page = list(pages.values())[0]
        
        return {
            'title': page.get('title', ''),
            'extract': page.get('extract', ''),
            'thumbnail': page.get('thumbnail', {}).get('source', None),
            'url': f"https://en.wikipedia.org/wiki/{title.replace(' ', '_')}"
        }
    
    @staticmethod
    def get_article_with_images(title: str):
        """
        Get article with all associated images
        """
        params = {
            'action': 'query',
            'format': 'json',
            'titles': title,
            'prop': 'images'
        }
        
        response = requests.get(WikipediaArticleFetcher.BASE_URL, params=params)
        data = response.json()
        
        pages = data['query']['pages']
        page = list(pages.values())[0]
        
        images = page.get('images', [])
        image_titles = [img['title'] for img in images if not img['title'].endswith('.svg')]
        
        return image_titles[:5]  # Top 5 images

# Usage
fetcher = WikipediaArticleFetcher()

# Search for medicine
results = fetcher.search_medicine("Paracetamol")
for result in results:
    print(f"- {result['title']}")

# Get article content
article = fetcher.get_article_content("Paracetamol")
print(f"Title: {article['title']}")
print(f"Content: {article['extract'][:500]}...")
print(f"Image: {article['thumbnail']}")
print(f"Full article: {article['url']}")

# Get images
images = fetcher.get_article_with_images("Aspirin")
print(f"Associated images: {images}")
```

### API Endpoint Examples

```bash
# Search for medicine
https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=Paracetamol&format=json

# Get article content with image
https://en.wikipedia.org/w/api.php?action=query&titles=Paracetamol&prop=extracts|pageimages&exintro=true&explaintext=true&piprop=thumbnail&pithumbsize=300&format=json

# Get all images in article
https://en.wikipedia.org/w/api.php?action=query&titles=Aspirin&prop=images&format=json
```

---

## Option 2: ⭐⭐ NIH ODS API (OFFICIAL HEALTH INFORMATION)

**Free**: Yes, 100% free
**Coverage**: Dietary supplements, vitamins, minerals
**Quality**: Peer-reviewed by NIH
**Images**: Limited but available
**Best for**: Supplements, vitamins, minerals

### Setup

```python
import requests
import xml.etree.ElementTree as ET

class NIHODSFetcher:
    """
    Fetch official NIH dietary supplement information
    """
    
    BASE_URL = "https://ods.od.nih.gov/api/"
    
    @staticmethod
    def search_supplement(supplement_name: str):
        """
        Search NIH database for supplement information
        
        Available supplements include:
        - Calcium
        - Iron
        - Magnesium
        - Zinc
        - Vitamin A, B, C, D, E, K
        - Iodine
        - Potassium
        - Selenium
        - Copper
        - Manganese
        - Chromium
        - Molybdenum
        And many more...
        """
        
        # List all available content
        response = requests.get(BASE_URL)
        
        # Search content by title
        content_list = response.json()  # Returns available supplements
        
        matching = [item for item in content_list 
                   if supplement_name.lower() in item.get('title', '').lower()]
        
        return matching
    
    @staticmethod
    def get_supplement_content(supplement_name: str):
        """
        Get HTML or XML content for specific supplement
        """
        params = {
            'search': supplement_name,
            'format': 'html'  # or 'xml'
        }
        
        response = requests.get(
            f"{NIHODSFetcher.BASE_URL}search",
            params=params
        )
        
        return response.text

# Usage
fetcher = NIHODSFetcher()

# Get Zinc information
zinc_info = fetcher.get_supplement_content("Zinc - Consumer")
print(zinc_info)

# Get Calcium information
calcium_info = fetcher.get_supplement_content("Calcium - Consumer")
print(calcium_info)
```

### Available NIH ODS Content

```
Consumer Fact Sheets:
- Calcium - Consumer
- Iron - Consumer
- Magnesium - Consumer
- Zinc - Consumer
- Vitamin A - Consumer
- Vitamin B6 - Consumer
- Vitamin B12 - Consumer
- Vitamin C - Consumer
- Vitamin D - Consumer
- Vitamin E - Consumer
- Vitamin K - Consumer
- Iodine - Consumer
- Potassium - Consumer
- Selenium - Consumer
- Folate - Consumer

+ Spanish versions available for all

+ Health Professional versions available

+ Dietary Supplements Background Information

Full list: https://ods.od.nih.gov/api/
```

---

## Option 3: ⭐⭐⭐ PubMed API (SCIENTIFIC RESEARCH)

**Free**: Yes, completely free
**Coverage**: 35+ million biomedical articles
**Quality**: Peer-reviewed research papers
**Best for**: Scientific evidence, drug interactions, clinical studies
**Images**: Limited (PDFs available)

### Setup

```python
import requests
from urllib.parse import quote

class PubMedFetcher:
    """
    Fetch scientific research articles from PubMed
    """
    
    BASE_URL = "https://pubmed.ncbi.nlm.nih.gov/api/search"
    SUMMARY_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
    
    @staticmethod
    def search_articles(medicine_name: str, max_results: int = 10):
        """
        Search for medicine-related research articles
        """
        params = {
            'term': medicine_name + ' AND (free full text[Filter])',
            'retmax': max_results,
            'rettype': 'json'
        }
        
        response = requests.get(PubMedFetcher.BASE_URL, params=params)
        data = response.json()
        
        articles = []
        if 'esearchresult' in data:
            for uid in data['esearchresult'].get('idlist', [])[:max_results]:
                article = PubMedFetcher.get_article_summary(uid)
                articles.append(article)
        
        return articles
    
    @staticmethod
    def get_article_summary(pmid: str):
        """
        Get detailed article summary
        """
        params = {
            'db': 'pubmed',
            'id': pmid,
            'rettype': 'abstract',
            'retmode': 'json'
        }
        
        response = requests.get(PubMedFetcher.SUMMARY_URL, params=params)
        data = response.json()
        
        articles = data.get('result', {}).get(pmid, {})
        
        return {
            'pmid': pmid,
            'title': articles.get('title', ''),
            'abstract': articles.get('abstracttext', ''),
            'authors': articles.get('authors', []),
            'journal': articles.get('journal', ''),
            'pub_date': articles.get('pubdate', ''),
            'url': f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/"
        }
    
    @staticmethod
    def search_free_full_text(medicine_name: str):
        """
        Search only for articles with free full text available
        """
        params = {
            'term': f"{medicine_name} AND (free full text[Filter])",
            'retmax': 20,
            'rettype': 'json'
        }
        
        response = requests.get(PubMedFetcher.BASE_URL, params=params)
        return response.json()

# Usage
fetcher = PubMedFetcher()

# Search for paracetamol research
articles = fetcher.search_articles("Paracetamol", max_results=5)
for article in articles:
    print(f"Title: {article['title']}")
    print(f"Abstract: {article['abstract'][:200]}...")
    print(f"Authors: {', '.join([a['name'] for a in article['authors'][:3]])}")
    print(f"Read full: {article['url']}\n")
```

### API Examples

```bash
# Search PubMed with free full text
https://pubmed.ncbi.nlm.nih.gov/api/search?term=Paracetamol%20AND%20(free%20full%20text)&retmax=10&rettype=json

# Get article details
https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=12345678&rettype=abstract&retmode=json
```

---

## Option 4: ⭐⭐ News API (LATEST HEALTH NEWS)

**Free**: Yes (limited free tier)
**Coverage**: 150,000+ news sources
**Freshness**: Real-time articles
**Best for**: Latest health news, supplements news, medicine updates
**Images**: Yes, all articles include images

### Setup

```python
import requests

class NewsAPIFetcher:
    """
    Fetch latest health and medicine articles
    """
    
    def __init__(self, api_key=None):
        # Get free API key from: https://newsapi.org
        self.api_key = api_key or "demo"  # Demo key available
        self.base_url = "https://newsapi.org/v2"
    
    def search_health_news(self, medicine_name: str, max_results: int = 20):
        """
        Search for latest news about medicine
        """
        params = {
            'q': f"{medicine_name} health OR supplement OR drug",
            'sortBy': 'publishedAt',
            'pageSize': max_results,
            'apiKey': self.api_key
        }
        
        response = requests.get(
            f"{self.base_url}/everything",
            params=params
        )
        
        articles = response.json().get('articles', [])
        
        return [{
            'title': article['title'],
            'description': article['description'],
            'content': article['content'],
            'image': article['urlToImage'],
            'source': article['source']['name'],
            'url': article['url'],
            'published_at': article['publishedAt']
        } for article in articles]
    
    def search_by_category(self, category: str = 'health', max_results: int = 20):
        """
        Get top health headlines by category
        """
        params = {
            'category': category,
            'sortBy': 'publishedAt',
            'pageSize': max_results,
            'apiKey': self.api_key
        }
        
        response = requests.get(
            f"{self.base_url}/top-headlines",
            params=params
        )
        
        return response.json().get('articles', [])

# Usage (get free API key from https://newsapi.org)
fetcher = NewsAPIFetcher(api_key="YOUR_FREE_API_KEY")

# Search for Vitamin D news
articles = fetcher.search_health_news("Vitamin D", max_results=10)
for article in articles:
    print(f"Title: {article['title']}")
    print(f"Source: {article['source']}")
    print(f"Image: {article['image']}")
    print(f"Read: {article['url']}\n")
```

### Get Free News API Key

1. Visit: https://newsapi.org
2. Sign up (free)
3. Get API key (no payment required)

---

## Option 5: Wikimedia Commons API (MEDICINE IMAGES)

**Free**: Yes, all images CC0/CC-BY license
**Coverage**: 70M+ free images
**Quality**: Professional medical images
**Best for**: Medicine, supplement, drug images

### Setup

```python
import requests

class WikimediaImageFetcher:
    """
    Fetch free medicine and supplement images from Wikimedia Commons
    """
    
    BASE_URL = "https://commons.wikimedia.org/w/api.php"
    
    @staticmethod
    def search_medicine_images(medicine_name: str, limit: int = 10):
        """
        Search for medicine/supplement images
        """
        params = {
            'action': 'query',
            'format': 'json',
            'list': 'search',
            'srsearch': f"{medicine_name} medicine pill drug",
            'srlimit': limit,
            'srnamespace': '6'  # File namespace only
        }
        
        response = requests.get(WikimediaImageFetcher.BASE_URL, params=params)
        results = response.json()
        
        return results['query']['search']
    
    @staticmethod
    def get_image_url(file_title: str):
        """
        Get direct URL for Wikimedia image
        """
        params = {
            'action': 'query',
            'format': 'json',
            'titles': file_title,
            'prop': 'imageinfo',
            'iiprop': 'url'
        }
        
        response = requests.get(WikimediaImageFetcher.BASE_URL, params=params)
        data = response.json()
        
        pages = data['query']['pages']
        page = list(pages.values())[0]
        
        if 'imageinfo' in page:
            return page['imageinfo'][0]['url']
        
        return None
    
    @staticmethod
    def get_high_res_images(medicine_name: str):
        """
        Get multiple high-resolution images
        """
        params = {
            'action': 'query',
            'format': 'json',
            'list': 'search',
            'srsearch': f"{medicine_name}",
            'srlimit': 5,
            'srnamespace': '6'
        }
        
        response = requests.get(WikimediaImageFetcher.BASE_URL, params=params)
        results = response.json()
        
        images = []
        for result in results['query']['search']:
            url = WikimediaImageFetcher.get_image_url(result['title'])
            if url:
                images.append({
                    'title': result['title'],
                    'url': url,
                    'license': 'CC-BY or CC0'
                })
        
        return images

# Usage
fetcher = WikimediaImageFetcher()

# Search for aspirin images
images = fetcher.search_medicine_images("Aspirin", limit=10)
for image in images:
    print(f"Image: {image['title']}")

# Get high-res images
high_res = fetcher.get_high_res_images("Paracetamol")
for img in high_res:
    print(f"Title: {img['title']}")
    print(f"URL: {img['url']}")
    print(f"License: {img['license']}\n")
```

---

## Complete Integration in FastAPI

```python
from fastapi import FastAPI, Query, HTTPException
from typing import List, Dict

app = FastAPI(title="Medicine Articles API")

# Initialize all fetchers
wiki_fetcher = WikipediaArticleFetcher()
nih_fetcher = NIHODSFetcher()
pubmed_fetcher = PubMedFetcher()
news_fetcher = NewsAPIFetcher(api_key="YOUR_API_KEY")
image_fetcher = WikimediaImageFetcher()

# ===== WIKIPEDIA ARTICLES =====

@app.get("/api/articles/wikipedia")
async def get_wikipedia_article(
    medicine: str = Query(..., min_length=2),
    include_images: bool = Query(True)
):
    """
    Get Wikipedia article about medicine with images
    """
    try:
        article = wiki_fetcher.get_article_content(medicine)
        
        images = []
        if include_images:
            image_titles = wiki_fetcher.get_article_with_images(medicine)
            images = [wiki_fetcher.get_image_url(title) for title in image_titles[:3]]
        
        return {
            "source": "Wikipedia",
            "title": article['title'],
            "content": article['extract'],
            "thumbnail": article['thumbnail'],
            "images": images,
            "url": article['url'],
            "license": "CC-BY-SA 3.0"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ===== NIH SUPPLEMENTS =====

@app.get("/api/articles/nih-supplements")
async def get_nih_supplement_info(
    supplement: str = Query(..., min_length=2)
):
    """
    Get official NIH information about dietary supplement
    """
    try:
        content = nih_fetcher.get_supplement_content(supplement)
        
        return {
            "source": "NIH Office of Dietary Supplements",
            "supplement": supplement,
            "content": content,
            "license": "Public Domain",
            "official": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ===== PUBMED RESEARCH =====

@app.get("/api/articles/research")
async def get_research_articles(
    medicine: str = Query(..., min_length=2),
    limit: int = Query(10, ge=1, le=20)
):
    """
    Get scientific research articles about medicine
    """
    try:
        articles = pubmed_fetcher.search_articles(medicine, limit)
        
        return {
            "source": "PubMed",
            "medicine": medicine,
            "count": len(articles),
            "articles": articles,
            "license": "Public Domain (abstracts)"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ===== NEWS ARTICLES =====

@app.get("/api/articles/news")
async def get_health_news(
    medicine: str = Query(..., min_length=2),
    limit: int = Query(10, ge=1, le=50)
):
    """
    Get latest news about medicine/supplement
    """
    try:
        articles = news_fetcher.search_health_news(medicine, limit)
        
        return {
            "source": "News API",
            "medicine": medicine,
            "count": len(articles),
            "articles": articles
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ===== MEDICINE IMAGES =====

@app.get("/api/images")
async def get_medicine_images(
    medicine: str = Query(..., min_length=2),
    limit: int = Query(10, ge=1, le=50)
):
    """
    Get free medicine/supplement images with CC licenses
    """
    try:
        images = image_fetcher.get_high_res_images(medicine)
        
        return {
            "source": "Wikimedia Commons",
            "medicine": medicine,
            "count": len(images),
            "images": images[:limit],
            "license": "CC-BY or CC0 (reusable)"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ===== UNIFIED ARTICLES ENDPOINT =====

@app.get("/api/articles/all")
async def get_all_articles(
    medicine: str = Query(..., min_length=2)
):
    """
    Get articles from ALL sources
    """
    try:
        results = {
            "medicine": medicine,
            "sources": {}
        }
        
        # Get Wikipedia
        try:
            wiki = wiki_fetcher.get_article_content(medicine)
            results["sources"]["wikipedia"] = {
                "title": wiki['title'],
                "extract": wiki['extract'][:1000],
                "image": wiki['thumbnail'],
                "url": wiki['url']
            }
        except:
            pass
        
        # Get News
        try:
            news = news_fetcher.search_health_news(medicine, max_results=5)
            results["sources"]["news"] = news[:3]
        except:
            pass
        
        # Get Research
        try:
            research = pubmed_fetcher.search_articles(medicine, max_results=5)
            results["sources"]["research"] = research[:3]
        except:
            pass
        
        # Get Images
        try:
            images = image_fetcher.get_high_res_images(medicine)
            results["sources"]["images"] = images[:5]
        except:
            pass
        
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## Frontend React Integration

```javascript
import React, { useState } from 'react';
import axios from 'axios';

export default function MedicineArticles() {
  const [medicine, setMedicine] = useState('');
  const [articles, setArticles] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchAllArticles = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.get(
        `http://localhost:8000/api/articles/all?medicine=${medicine}`
      );
      setArticles(response.data);
    } catch (error) {
      console.error('Error fetching articles:', error);
    }

    setLoading(false);
  };

  return (
    <div className="articles-container">
      <h1>📚 Medicine Articles & Information</h1>

      <form onSubmit={fetchAllArticles}>
        <input
          type="text"
          placeholder="Search medicine or supplement..."
          value={medicine}
          onChange={(e) => setMedicine(e.target.value)}
          minLength="2"
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Find Articles'}
        </button>
      </form>

      {articles && (
        <div className="results">
          {/* Wikipedia Section */}
          {articles.sources.wikipedia && (
            <section className="article-section wikipedia">
              <h2>📖 Overview (Wikipedia)</h2>
              {articles.sources.wikipedia.image && (
                <img 
                  src={articles.sources.wikipedia.image} 
                  alt={medicine}
                  className="medicine-image"
                />
              )}
              <p>{articles.sources.wikipedia.extract}</p>
              <a 
                href={articles.sources.wikipedia.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Read full article →
              </a>
            </section>
          )}

          {/* News Section */}
          {articles.sources.news && (
            <section className="article-section news">
              <h2>📰 Latest News</h2>
              {articles.sources.news.map((article, idx) => (
                <article key={idx} className="news-item">
                  {article.image && (
                    <img src={article.image} alt={article.title} />
                  )}
                  <h3>{article.title}</h3>
                  <p>{article.description}</p>
                  <span className="source">{article.source}</span>
                  <a href={article.url} target="_blank" rel="noopener noreferrer">
                    Read →
                  </a>
                </article>
              ))}
            </section>
          )}

          {/* Research Section */}
          {articles.sources.research && (
            <section className="article-section research">
              <h2>🔬 Scientific Research</h2>
              {articles.sources.research.map((article, idx) => (
                <article key={idx} className="research-item">
                  <h3>{article.title}</h3>
                  <p className="abstract">{article.abstract?.slice(0, 300)}...</p>
                  <p className="journal">{article.journal} - {article.pub_date}</p>
                  <a href={article.url} target="_blank" rel="noopener noreferrer">
                    Read on PubMed →
                  </a>
                </article>
              ))}
            </section>
          )}

          {/* Images Section */}
          {articles.sources.images && (
            <section className="article-section images">
              <h2>🖼️ Related Images</h2>
              <div className="image-grid">
                {articles.sources.images.map((image, idx) => (
                  <a 
                    key={idx}
                    href={image.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="image-item"
                  >
                    <img src={image.url} alt={image.title} />
                    <p>{image.title}</p>
                    <span className="license">{image.license}</span>
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <style jsx>{`
        .articles-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
        }

        form {
          display: flex;
          gap: 10px;
          margin: 20px 0;
        }

        input {
          flex: 1;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 5px;
        }

        button {
          padding: 10px 30px;
          background: #0066cc;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
        }

        .article-section {
          margin: 30px 0;
          padding: 20px;
          border-left: 4px solid #0066cc;
          background: #f9f9f9;
        }

        .medicine-image {
          width: 100%;
          max-width: 300px;
          height: auto;
          border-radius: 5px;
          margin: 10px 0;
        }

        .news-item, .research-item {
          margin: 15px 0;
          padding: 15px;
          background: white;
          border-radius: 5px;
        }

        .image-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 15px;
          margin-top: 15px;
        }

        .image-item {
          text-decoration: none;
          color: inherit;
        }

        .image-item img {
          width: 100%;
          height: 150px;
          object-fit: cover;
          border-radius: 5px;
        }

        .license {
          font-size: 12px;
          color: #666;
          display: block;
          margin-top: 5px;
        }
      `}</style>
    </div>
  );
}
```

---

## Summary: Which API to Use

| API | Best For | Coverage | Quality | Images |
|-----|----------|----------|---------|--------|
| **Wikipedia** | Overview articles | 500K+ | Good | Yes |
| **NIH ODS** | Supplement info | Supplements | Excellent | Limited |
| **PubMed** | Research evidence | 35M+ papers | Excellent | No |
| **News API** | Latest news | 150K+ sources | Good | Yes |
| **Wikimedia** | Medicine images | 70M+ images | Excellent | Yes |

---

## Complete Example URLs

```bash
# Wikipedia
https://en.wikipedia.org/w/api.php?action=query&titles=Paracetamol&prop=extracts|pageimages&explaintext=true&format=json

# NIH Supplements
https://ods.od.nih.gov/api/

# PubMed Search
https://pubmed.ncbi.nlm.nih.gov/api/search?term=Paracetamol&rettype=json

# News (free key from newsapi.org)
https://newsapi.org/v2/everything?q=Vitamin+D&apiKey=KEY

# Wikimedia Images
https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=Paracetamol&format=json
```

---

## Cost Analysis

| API | Cost | Notes |
|-----|------|-------|
| **Wikipedia** | FREE | Unlimited requests |
| **NIH ODS** | FREE | Official government data |
| **PubMed** | FREE | Unlimited research |
| **News API** | FREE | 100 requests/day free tier (enough for most apps) |
| **Wikimedia** | FREE | All images CC-licensed |

**Total cost: $0** (completely free!)

---

## Final Recommendation

**Use all 5 APIs together:**

1. **Wikipedia** - Main article overview
2. **NIH ODS** - For supplement pages
3. **PubMed** - Scientific evidence
4. **News API** - Latest updates
5. **Wikimedia** - Professional images

This gives users:
- ✅ Comprehensive information
- ✅ Latest news updates
- ✅ Scientific evidence
- ✅ Official government info
- ✅ High-quality images
- ✅ All completely FREE
- ✅ No authentication needed (except News API - free key)