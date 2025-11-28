/**
 * Refresh Article Data Script
 * 
 * Fetches Wikipedia summaries, PubMed research articles, and Wikimedia Commons images
 * for all banned substances and legal supplements.
 * 
 * Run: node scripts/refresh-article-data.js
 * 
 * APIs used (all free, no API keys required):
 * - Wikipedia REST API: https://en.wikipedia.org/api/rest_v1/
 * - PubMed E-utilities: https://eutils.ncbi.nlm.nih.gov/entrez/eutils/
 * - Wikimedia Commons API: https://commons.wikimedia.org/w/api.php
 */

const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

const CONFIG = {
  // Rate limiting (be respectful to APIs)
  requestDelayMs: 500,
  
  // PubMed settings
  pubmedMaxResults: 3,
  
  // Wikimedia Commons settings
  maxImages: 3,
  
  // Output file
  outputPath: path.join(__dirname, '../lib/data/substance-articles.json'),
  
  // User agent (required by Wikipedia API policy)
  userAgent: 'BlushAndBreathe/1.0 (https://blushandbreathe.com; contact@blushandbreathe.com)',
};

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url, options = {}, retries = 3) {
  const headers = {
    'User-Agent': CONFIG.userAgent,
    'Accept': 'application/json',
    ...options.headers,
  };

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, { ...options, headers });
      if (response.ok) {
        return await response.json();
      }
      if (response.status === 404) {
        return null; // Not found is acceptable
      }
      console.warn(`Attempt ${i + 1} failed for ${url}: ${response.status}`);
    } catch (error) {
      console.warn(`Attempt ${i + 1} error for ${url}:`, error.message);
    }
    await sleep(1000 * (i + 1)); // Exponential backoff
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════
// WIKIPEDIA API
// ═══════════════════════════════════════════════════════════════════

/**
 * Clean Wikipedia HTML content for display
 * Handles: [edit] links, images, internal links, citations, chemical data, navboxes
 */
function cleanWikipediaHtml(html, articleUrl) {
  if (!html) return '';
  
  const wikiBase = 'https://en.wikipedia.org';
  
  let cleaned = html
    // Remove script/style/iframe/noscript tags
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
    
    // Remove [edit] section links and brackets completely
    .replace(/\[\s*edit\s*\]/gi, '')
    .replace(/<span[^>]*mw-editsection[^>]*>[\s\S]*?<\/span>/gi, '')
    
    // Remove citation superscripts and reference markers
    .replace(/<sup[^>]*reference[^>]*>[\s\S]*?<\/sup>/gi, '')
    .replace(/<sup[^>]*>[\s\S]*?\[\d+\][\s\S]*?<\/sup>/gi, '')
    .replace(/\[\d+\]/g, '')
    .replace(/\[citation needed\]/gi, '')
    .replace(/\[verify\]/gi, '')
    // Remove empty brackets [] that remain after citation removal (multiple patterns)
    .replace(/\[\s*\]/g, '')
    .replace(/\(\s*\)/g, '')
    // Remove nested span brackets: <span><span>[</span><span>]</span></span>
    .replace(/<span><span>\[<\/span><span>\]<\/span><\/span>/gi, '')
    .replace(/<span[^>]*><span[^>]*>\[<\/span><span[^>]*>\]<\/span><\/span>/gi, '')
    .replace(/<span[^>]*>\[<\/span>\s*<span[^>]*>\]<\/span>/gi, '')
    // Remove paragraphs containing only empty bracket spans (specific pattern)
    .replace(/<p[^>]*>\s*<span[^>]*><span[^>]*>\[<\/span><span[^>]*>\]<\/span><\/span>\s*<\/p>/gi, '')
    // Remove standalone brackets on their own line or paragraph
    .replace(/<p[^>]*>\s*\[\s*\]\s*<\/p>/gi, '')
    .replace(/<span[^>]*>\s*\[\s*\]\s*<\/span>/gi, '')
    .replace(/<div[^>]*>\s*\[\s*\]\s*<\/div>/gi, '')
    // Remove brackets surrounded by whitespace
    .replace(/>\s*\[\s*\]\s*</g, '><')
    .replace(/\s+\[\s*\]\s+/g, ' ')
    .replace(/\s+\[\s*\]/g, '')
    .replace(/\[\s*\]\s+/g, '')
    
    // Remove chembox verification row (☒ N ☑ Y what is this? verify)
    .replace(/<tr[^>]*>[\s\S]*?what is this[\s\S]*?verify[\s\S]*?<\/tr>/gi, '')
    .replace(/☒\s*N[\s\S]*?☑\s*Y/gi, '')
    .replace(/\(what is this\?\)\s*\(verify\)/gi, '')
    .replace(/<a[^>]*>[\s\S]*?\(what is this\?\)[\s\S]*?<\/a>/gi, '')
    .replace(/<a[^>]*>[\s\S]*?\(verify\)[\s\S]*?<\/a>/gi, '')
    
    // Remove navigation boxes (these are huge template sections at the bottom)
    .replace(/<table[^>]*navbox[^>]*>[\s\S]*?<\/table>/gi, '')
    .replace(/<div[^>]*navbox[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<section[^>]*>[\s\S]*?navbox[\s\S]*?<\/section>/gi, '')
    
    // Remove category links, metadata, and other Wikipedia-specific sections
    .replace(/<div[^>]*catlinks[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<div[^>]*metadata[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<div[^>]*sistersitebox[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<div[^>]*noprint[^>]*>[\s\S]*?<\/div>/gi, '')
    
    // Remove SMILES, InChI rows (chemical notation - displays poorly)
    .replace(/<tr[^>]*>[\s\S]{0,200}SMILES[\s\S]*?<\/tr>/gi, '')
    .replace(/<tr[^>]*>[\s\S]{0,200}InChI[\s\S]*?<\/tr>/gi, '')
    .replace(/<tr[^>]*>[\s\S]{0,200}3D model[\s\S]*?<\/tr>/gi, '')
    
    // Remove "show/hide" toggle text and collapsible elements
    .replace(/<span[^>]*>show<\/span>/gi, '')
    .replace(/<span[^>]*>hide<\/span>/gi, '')
    
    // Fix images - convert all URL formats to absolute HTTPS
    .replace(/<img([^>]*)src="\.\/([^"]+)"([^>]*)>/gi, (match, before, path, after) => {
      return `<img${before}src="https://en.wikipedia.org/wiki/${path}"${after}>`;
    })
    .replace(/<img([^>]*)src="\/([^"]+)"([^>]*)>/gi, (match, before, path, after) => {
      if (path.startsWith('/')) path = path.substring(1);
      return `<img${before}src="https://en.wikipedia.org/${path}"${after}>`;
    })
    .replace(/<img([^>]*)src="\/\/([^"]+)"([^>]*)>/gi, (match, before, url, after) => {
      return `<img${before}src="https://${url}"${after}>`;
    })
    
    // Convert relative Wikipedia links (./PageName format from REST API)
    .replace(/<a([^>]*)href="\.\/([^"#]+)([^"]*)"([^>]*)>/gi, (match, before, page, hash, after) => {
      const absoluteUrl = `${wikiBase}/wiki/${page}${hash}`;
      return `<a${before}href="${absoluteUrl}" target="_blank" rel="noopener noreferrer"${after}>`;
    })
    
    // Convert /wiki/ links to absolute
    .replace(/<a([^>]*)href="\/wiki\/([^"#]+)([^"]*)"([^>]*)>/gi, (match, before, page, hash, after) => {
      const absoluteUrl = `${wikiBase}/wiki/${page}${hash}`;
      return `<a${before}href="${absoluteUrl}" target="_blank" rel="noopener noreferrer"${after}>`;
    })
    
    // Convert other relative URLs to absolute
    .replace(/<a([^>]*)href="\/([^"]+)"([^>]*)>/gi, (match, before, path, after) => {
      if (path.startsWith('/')) return match;
      return `<a${before}href="${wikiBase}/${path}" target="_blank" rel="noopener noreferrer"${after}>`;
    })
    
    // Ensure all external links open in new tab
    .replace(/<a([^>]*)href="(https?:\/\/[^"]+)"([^>]*)>/gi, (match, before, url, after) => {
      if (match.includes('target=')) return match;
      return `<a${before}href="${url}" target="_blank" rel="noopener noreferrer"${after}>`;
    })
    
    // Remove broken/edit links
    .replace(/<a[^>]*action=edit[^>]*>[\s\S]*?<\/a>/gi, '')
    .replace(/<a[^>]*redlink=1[^>]*>([^<]*)<\/a>/gi, '$1')
    
    // Clean Wikipedia-specific classes
    .replace(/class="[^"]*mw-[^"]*"/gi, '')
    .replace(/class="[^"]*infobox[^"]*"/gi, 'class="wiki-infobox"')
    .replace(/class="[^"]*wikitable[^"]*"/gi, 'class="wiki-table"')
    
    // Remove problematic attributes
    .replace(/typeof="[^"]*"/gi, '')
    .replace(/about="[^"]*"/gi, '')
    .replace(/data-mw[^=]*="[^"]*"/gi, '')
    .replace(/id="[^"]*cite[^"]*"/gi, '')
    
    // Remove inline styles that hide content
    .replace(/style="[^"]*display:\s*none[^"]*"/gi, '')
    
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '> <')
    
    // Remove empty elements (run multiple times for nested empties)
    .replace(/<span>\s*<\/span>/gi, '')
    .replace(/<div>\s*<\/div>/gi, '')
    .replace(/<p>\s*<\/p>/gi, '')
    .replace(/<td>\s*<\/td>/gi, '<td>-</td>')
    
    .trim();
  
  // Second pass: Remove any remaining navigation sections (they can be nested)
  cleaned = cleaned
    .replace(/<table[^>]*>[\s\S]*?VMATs[\s\S]*?<\/table>/gi, '') // Remove transporter navboxes
    .replace(/<table[^>]*>[\s\S]*?See also:[\s\S]*?<\/table>/gi, '') // Remove "See also" navboxes
    .replace(/<table[^>]*>[\s\S]*?Receptor\/signaling[\s\S]*?<\/table>/gi, ''); // Remove receptor navboxes
  
  // Final pass: Remove any remaining empty bracket patterns (after whitespace normalization)
  cleaned = cleaned
    .replace(/<span>\s*<span>\s*\[\s*<\/span>\s*<span>\s*\]\s*<\/span>\s*<\/span>/gi, '')
    .replace(/<span>\s*\[\s*<\/span>\s*<span>\s*\]\s*<\/span>/gi, '')
    .replace(/<p>\s*<\/p>/gi, '')
    .replace(/\[\s*\]/g, '');
  
  return cleaned;
}

// hb-reader worker for clean article extraction using Mozilla Readability
const READER_ENDPOINT = 'https://hb-reader.sparshrajput088.workers.dev';

/**
 * Fallback: Fetch Wikipedia article HTML directly from Wikipedia REST API
 */
async function fetchWikipediaHtmlDirect(articleTitle) {
  try {
    const encodedTitle = encodeURIComponent(articleTitle);
    const restUrl = `https://en.wikipedia.org/api/rest_v1/page/html/${encodedTitle}`;
    
    const response = await fetch(restUrl, {
      headers: { 
        'Accept': 'text/html',
        'User-Agent': CONFIG.userAgent
      }
    });
    
    if (!response.ok) {
      return null;
    }
    
    const rawHtml = await response.text();
    
    // Extract just the body content (REST API returns full HTML document)
    // Use indexOf for better performance with large HTML
    const bodyStartTag = rawHtml.indexOf('<body');
    const bodyEndTag = rawHtml.indexOf('</body>');
    
    if (bodyStartTag !== -1 && bodyEndTag !== -1) {
      // Find the end of the opening body tag
      const bodyContentStart = rawHtml.indexOf('>', bodyStartTag) + 1;
      const bodyContent = rawHtml.substring(bodyContentStart, bodyEndTag);
      if (bodyContent.length > 100) {
        return bodyContent;
      }
    }
    
    // Fallback: remove doctype, html, head tags manually
    return rawHtml
      .replace(/<!DOCTYPE[^>]*>/gi, '')
      .replace(/<html[^>]*>/gi, '')
      .replace(/<\/html>/gi, '')
      .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
      .replace(/<body[^>]*>/gi, '')
      .replace(/<\/body>/gi, '')
      .trim();
  } catch (error) {
    console.warn('Wikipedia REST API fallback failed:', error.message);
    return null;
  }
}

/**
 * Fetch full Wikipedia article content using Mozilla Readability worker
 * Falls back to Wikipedia REST API if reader service fails
 */
async function fetchWikipediaFullContent(articleUrl, articleTitle) {
  let html = null;
  
  // Try 1: Use hb-reader worker (Mozilla Readability)
  try {
    const endpoint = `${READER_ENDPOINT}/read?url=${encodeURIComponent(articleUrl)}`;
    const response = await fetch(endpoint, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (!data.error && !data.blocked && data.html) {
        html = data.html;
      }
    }
    
    if (!html) {
      console.warn('Reader service failed, trying Wikipedia REST API fallback...');
    }
  } catch (error) {
    console.warn('Reader service error:', error.message);
  }
  
  // Try 2: Fallback to Wikipedia REST API directly
  if (!html && articleTitle) {
    html = await fetchWikipediaHtmlDirect(articleTitle);
    if (html) {
      console.log('    ✓ Used Wikipedia REST API fallback');
    }
  }
  
  if (!html) {
    return null;
  }
  
  // Clean the HTML content using our comprehensive cleaner
  const cleanHtml = cleanWikipediaHtml(html, articleUrl);
  
  // Estimate reading time (average 200 words per minute)
  const textContent = cleanHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const wordCount = textContent.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200);
  
  return {
    html: cleanHtml,
    readingTime: readingTime > 0 ? readingTime : 5,
  };
}

async function fetchWikipedia(searchTerms) {
  // Try each search term until we find a match
  for (const term of searchTerms) {
    const encodedTerm = encodeURIComponent(term);
    
    // First try the REST API summary endpoint (cleaner data)
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodedTerm}`;
    const data = await fetchWithRetry(summaryUrl);
    
    if (data && data.type !== 'disambiguation' && data.extract) {
      const articleUrl = data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodedTerm}`;
      
      // Fetch full article content (with fallback to Wikipedia REST API)
      console.log('    - Fetching full Wikipedia article content...');
      const fullContent = await fetchWikipediaFullContent(articleUrl, data.title);
      
      return {
        title: data.title,
        extract: data.extract,
        extractHtml: data.extract_html,
        // Full article content from Wikipedia REST API (cleaned)
        fullContent: fullContent?.html || null,
        readingTime: fullContent?.readingTime || null,
        thumbnail: data.thumbnail ? {
          source: data.thumbnail.source,
          width: data.thumbnail.width,
          height: data.thumbnail.height,
        } : undefined,
        originalImage: data.originalimage ? {
          source: data.originalimage.source,
          width: data.originalimage.width,
          height: data.originalimage.height,
        } : undefined,
        url: articleUrl,
        pageid: data.pageid,
        lastModified: data.timestamp,
      };
    }
    
    await sleep(CONFIG.requestDelayMs);
  }
  
  return null;
}

// ═══════════════════════════════════════════════════════════════════
// PUBMED API
// ═══════════════════════════════════════════════════════════════════

async function fetchPubMed(searchQuery, maxResults = CONFIG.pubmedMaxResults) {
  const articles = [];
  
  try {
    // Step 1: Search for article IDs
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(searchQuery)}&retmax=${maxResults}&sort=relevance&retmode=json`;
    const searchData = await fetchWithRetry(searchUrl);
    
    if (!searchData?.esearchresult?.idlist?.length) {
      return articles;
    }
    
    const ids = searchData.esearchresult.idlist;
    
    await sleep(CONFIG.requestDelayMs);
    
    // Step 2: Fetch article details
    const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${ids.join(',')}&rettype=abstract&retmode=xml`;
    const response = await fetch(fetchUrl, {
      headers: { 'User-Agent': CONFIG.userAgent }
    });
    
    if (!response.ok) {
      console.warn('PubMed fetch failed:', response.status);
      return articles;
    }
    
    const xmlText = await response.text();
    
    // Parse XML (simple extraction without xml2js dependency)
    const articleMatches = xmlText.match(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g) || [];
    
    for (const articleXml of articleMatches) {
      try {
        const pmid = extractXmlValue(articleXml, 'PMID') || '';
        const title = extractXmlValue(articleXml, 'ArticleTitle') || '';
        const abstract = extractXmlValue(articleXml, 'AbstractText') || extractXmlValue(articleXml, 'Abstract') || '';
        const journal = extractXmlValue(articleXml, 'Title') || extractXmlValue(articleXml, 'MedlineTA') || '';
        const year = extractXmlValue(articleXml, 'Year') || new Date().getFullYear().toString();
        
        // Extract authors
        const authorMatches = articleXml.match(/<Author[^>]*>[\s\S]*?<\/Author>/g) || [];
        const authors = authorMatches.slice(0, 3).map(auth => {
          const lastName = extractXmlValue(auth, 'LastName') || '';
          const firstName = extractXmlValue(auth, 'ForeName') || extractXmlValue(auth, 'Initials') || '';
          return `${lastName} ${firstName}`.trim();
        }).filter(Boolean);
        
        // Extract DOI
        const doiMatch = articleXml.match(/<ArticleId IdType="doi">([^<]+)<\/ArticleId>/);
        const doi = doiMatch ? doiMatch[1] : undefined;
        
        if (pmid && title) {
          articles.push({
            pmid,
            title: cleanText(title),
            abstract: cleanText(abstract), // Full abstract - no truncation
            authors,
            journal: cleanText(journal),
            pubDate: year,
            year: parseInt(year, 10),
            doi,
            url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
          });
        }
      } catch (parseError) {
        console.warn('Error parsing PubMed article:', parseError.message);
      }
    }
  } catch (error) {
    console.warn('PubMed fetch error:', error.message);
  }
  
  return articles;
}

function extractXmlValue(xml, tagName) {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

function cleanText(text) {
  return text
    .replace(/<[^>]+>/g, '') // Remove any remaining HTML tags
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim();
}

// ═══════════════════════════════════════════════════════════════════
// WIKIMEDIA COMMONS API
// ═══════════════════════════════════════════════════════════════════

async function fetchWikimediaImages(searchQuery, maxImages = CONFIG.maxImages) {
  const images = [];
  
  try {
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&srnamespace=6&srlimit=${maxImages}&format=json&origin=*`;
    const searchData = await fetchWithRetry(searchUrl);
    
    if (!searchData?.query?.search?.length) {
      return images;
    }
    
    // Get image info for each result
    const titles = searchData.query.search.map(s => s.title).join('|');
    
    await sleep(CONFIG.requestDelayMs);
    
    const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(titles)}&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=400&format=json&origin=*`;
    const infoData = await fetchWithRetry(infoUrl);
    
    if (!infoData?.query?.pages) {
      return images;
    }
    
    for (const page of Object.values(infoData.query.pages)) {
      if (page.imageinfo?.[0]) {
        const info = page.imageinfo[0];
        const meta = info.extmetadata || {};
        
        images.push({
          title: page.title.replace('File:', ''),
          url: info.url,
          thumbUrl: info.thumburl || info.url,
          width: info.width,
          height: info.height,
          description: meta.ImageDescription?.value?.replace(/<[^>]+>/g, '').slice(0, 200),
          license: meta.LicenseShortName?.value,
          artist: meta.Artist?.value?.replace(/<[^>]+>/g, '').slice(0, 100),
        });
      }
    }
  } catch (error) {
    console.warn('Wikimedia fetch error:', error.message);
  }
  
  return images;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN PROCESS
// ═══════════════════════════════════════════════════════════════════

async function processSubstance(substance, type) {
  console.log(`  Processing: ${substance.name} (${type})`);
  
  const searchTerms = [substance.name, ...substance.alternativeNames.slice(0, 2)];
  
  // Fetch Wikipedia
  console.log(`    - Fetching Wikipedia...`);
  const wikipedia = await fetchWikipedia(searchTerms);
  await sleep(CONFIG.requestDelayMs);
  
  // Fetch PubMed
  console.log(`    - Fetching PubMed research...`);
  const pubmedQuery = type === 'banned' 
    ? `${substance.name} adverse effects OR ${substance.name} toxicity OR ${substance.name} safety`
    : `${substance.name} benefits OR ${substance.name} supplementation OR ${substance.name} efficacy`;
  const pubmed = await fetchPubMed(pubmedQuery);
  await sleep(CONFIG.requestDelayMs);
  
  // Fetch Wikimedia images (supplement search to get relevant medical/chemical images)
  console.log(`    - Fetching Wikimedia images...`);
  const imageQuery = `${substance.name} molecule OR ${substance.name} chemical OR ${substance.name} structure`;
  const images = await fetchWikimediaImages(imageQuery);
  
  const now = new Date().toISOString();
  
  return {
    substanceSlug: substance.slug,
    substanceName: substance.name,
    substanceType: type,
    wikipedia,
    pubmed,
    images,
    fetchedAt: now,
    lastUpdated: now,
  };
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  SUBSTANCE ARTICLES DATA REFRESH');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  
  // Load substance data
  const bannedPath = path.join(__dirname, '../lib/data/banned-substances.json');
  const supplementsPath = path.join(__dirname, '../lib/data/legal-supplements.json');
  
  const bannedData = JSON.parse(fs.readFileSync(bannedPath, 'utf-8'));
  const supplementsData = JSON.parse(fs.readFileSync(supplementsPath, 'utf-8'));
  
  const bannedSubstances = bannedData.substances || [];
  const supplements = supplementsData.supplements || [];
  
  console.log(`Found ${bannedSubstances.length} banned substances`);
  console.log(`Found ${supplements.length} legal supplements`);
  console.log('');
  
  const articles = {};
  
  // Process banned substances
  console.log('Processing Banned Substances:');
  console.log('─────────────────────────────');
  for (const substance of bannedSubstances) {
    const result = await processSubstance(substance, 'banned');
    articles[substance.slug] = result;
    console.log(`    ✓ Wikipedia: ${result.wikipedia ? 'Found' : 'Not found'}`);
    console.log(`    ✓ PubMed: ${result.pubmed.length} articles`);
    console.log(`    ✓ Images: ${result.images.length} images`);
    console.log('');
    await sleep(CONFIG.requestDelayMs);
  }
  
  // Process supplements
  console.log('Processing Legal Supplements:');
  console.log('────────────────────────────');
  for (const supplement of supplements) {
    const result = await processSubstance(supplement, 'supplement');
    articles[supplement.slug] = result;
    console.log(`    ✓ Wikipedia: ${result.wikipedia ? 'Found' : 'Not found'}`);
    console.log(`    ✓ PubMed: ${result.pubmed.length} articles`);
    console.log(`    ✓ Images: ${result.images.length} images`);
    console.log('');
    await sleep(CONFIG.requestDelayMs);
  }
  
  // Build output
  const output = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    articles,
  };
  
  // Write to file
  fs.writeFileSync(CONFIG.outputPath, JSON.stringify(output, null, 2), 'utf-8');
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  COMPLETE!');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Output: ${CONFIG.outputPath}`);
  console.log(`Total substances: ${Object.keys(articles).length}`);
  console.log(`File size: ${(fs.statSync(CONFIG.outputPath).size / 1024).toFixed(2)} KB`);
}

// Run the script
main().catch(console.error);
