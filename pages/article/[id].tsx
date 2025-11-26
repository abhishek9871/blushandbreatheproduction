import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from 'next';
import { getArticles, getArticleById } from '@/services/apiService';
import { fetchFullArticle } from '@/services/fullArticle';
import { ArticleCard, ReadingProgressBar, SocialShare, BookmarkButton } from '@/components';
import type { Article } from '@/types';

interface ArticlePageProps {
  article: Article | null;
  relatedArticles: Article[];
  articleNotFound?: boolean;
}

// Generate paths at build time
// Note: We return empty paths because article IDs are URLs containing special characters
// that are invalid in Windows file paths. All pages will be generated on-demand.
export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: 'blocking', // Generate all pages on-demand for SEO
  };
};

export const getStaticProps: GetStaticProps<ArticlePageProps> = async ({ params }) => {
  const id = params?.id as string;

  if (!id) {
    return { notFound: true };
  }

  try {
    const article = await getArticleById(decodeURIComponent(id));

    if (!article) {
      // Return empty article - client will check sessionStorage
      return {
        props: {
          article: null,
          relatedArticles: [],
          articleNotFound: true,
        },
        revalidate: 60, // Try again soon
      };
    }

    // Fetch related articles (same category, exclude current)
    const { data: allArticles } = await getArticles(1);
    const relatedArticles = allArticles
      .filter((a) => a.category === article.category && a.id !== article.id)
      .slice(0, 3);

    return {
      props: {
        article,
        relatedArticles,
        articleNotFound: false,
      },
      revalidate: 3600, // Re-generate every hour
    };
  } catch (error) {
    console.error('Failed to fetch article:', error);
    // Return empty article - client will check sessionStorage
    return {
      props: {
        article: null,
        relatedArticles: [],
        articleNotFound: true,
      },
      revalidate: 60,
    };
  }
};

const categoryColorMap: Record<string, string> = {
  Nutrition: 'text-accent',
  Fitness: 'text-blue-500',
  'Mental Health': 'text-purple-500',
  Skincare: 'text-secondary',
  Health: 'text-primary',
};

// Sanitize HTML to remove potentially dangerous content
const sanitizeHtml = (html: string): string => {
  if (!html) return '';
  return html
    // Remove script tags
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    // Remove style tags
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    // Remove iframe tags
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
    // Remove onclick and other event handlers
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/on\w+\s*=\s*'[^']*'/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]+/gi, '')
    // Remove javascript: links
    .replace(/href\s*=\s*"javascript:[^"]*"/gi, 'href="#"')
    .replace(/href\s*=\s*'javascript:[^']*'/gi, "href='#'");
};

// Convert plain text/markdown-like content to HTML
const contentToHtml = (content: string): string => {
  if (!content) return '';
  
  // Check if content already contains HTML tags
  const hasHtmlTags = /<[a-z][\s\S]*>/i.test(content);
  
  if (hasHtmlTags) {
    // Content is already HTML, just sanitize it
    return sanitizeHtml(content);
  }
  
  // Convert markdown-like content to HTML
  const paragraphs = content.split('\n\n').filter(p => p.trim());
  return paragraphs.map(p => {
    // Headers
    if (p.startsWith('## ')) {
      return `<h2>${p.slice(3)}</h2>`;
    }
    if (p.startsWith('### ')) {
      return `<h3>${p.slice(4)}</h3>`;
    }
    // Unordered lists
    if (p.includes('\n- ')) {
      const items = p.split('\n- ').filter(item => item.trim());
      return '<ul>' + items.map(i => `<li>${i}</li>`).join('') + '</ul>';
    }
    // Ordered lists
    if (p.match(/^\d+\./m)) {
      const items = p.split(/\n\d+\.\s/).filter(item => item.trim());
      return '<ol>' + items.map(i => `<li>${i}</li>`).join('') + '</ol>';
    }
    // Regular paragraphs
    return `<p>${p}</p>`;
  }).join('\n');
};

export default function ArticlePage({ article: serverArticle, relatedArticles, articleNotFound }: InferGetStaticPropsType<typeof getStaticProps>) {
  const router = useRouter();
  
  // State for client-side article (from sessionStorage)
  const [clientArticle, setClientArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(articleNotFound));
  
  // State for full article content fetched via Jina Reader (must be before conditional returns)
  const [fullHtml, setFullHtml] = useState<string | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  
  // Check sessionStorage for pending article on client side
  useEffect(() => {
    if (articleNotFound || !serverArticle) {
      try {
        const pending = sessionStorage.getItem('pendingArticle');
        if (pending) {
          const parsed = JSON.parse(pending) as Article;
          // Verify this is the right article by checking URL match
          const currentId = decodeURIComponent(router.query.id as string || '');
          if (parsed.id === currentId || parsed.id === router.query.id) {
            setClientArticle(parsed);
            sessionStorage.removeItem('pendingArticle'); // Clear after use
          }
        }
      } catch (e) {
        console.error('Failed to read article from sessionStorage:', e);
      }
      setIsLoading(false);
    }
  }, [articleNotFound, serverArticle, router.query.id]);
  
  // Use server article if available, otherwise use client article
  const article = serverArticle || clientArticle;
  
  // Fetch full article content from source on client side
  useEffect(() => {
    if (!article) return;
    
    let cancelled = false;
    setIsLoadingContent(true);
    setFullHtml(null);
    
    const loadFullContent = async () => {
      try {
        // Only fetch if article.id is a URL (external article)
        if (article.id.startsWith('http')) {
          const result = await fetchFullArticle(article.id);
          if (!cancelled && result.html) {
            setFullHtml(result.html);
          }
        }
      } catch (error) {
        console.error('Failed to fetch full article:', error);
      } finally {
        if (!cancelled) {
          setIsLoadingContent(false);
        }
      }
    };
    
    loadFullContent();
    
    return () => { cancelled = true; };
  }, [article]);
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading article...</p>
        </div>
      </div>
    );
  }
  
  // Show 404 if no article found
  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Article Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Sorry, we couldn&apos;t find this article. It may have been removed or the link is incorrect.
          </p>
          <Link 
            href="/health" 
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Browse Articles
          </Link>
        </div>
      </div>
    );
  }
  
  const categoryClass = categoryColorMap[article.category] || 'text-primary';
  const articleUrl = typeof window !== 'undefined' ? window.location.href : `https://blushandbreathe.com${router.asPath}`;
  
  // Use fetched content if available, otherwise fall back to API content
  const displayContent = fullHtml || contentToHtml(article.content);

  return (
    <>
      <Head>
        <title>{article.title} | Blush & Breathe</title>
        <meta name="description" content={article.description} />
        {/* Open Graph */}
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.description} />
        <meta property="og:image" content={article.imageUrl} />
        <meta property="og:type" content="article" />
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={article.title} />
        <meta name="twitter:description" content={article.description} />
        <meta name="twitter:image" content={article.imageUrl} />
      </Head>

      <ReadingProgressBar />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <Link href="/health" className="hover:text-primary transition-colors">Health</Link>
          <span>/</span>
          <span className="text-gray-700 dark:text-gray-300 truncate">{article.title}</span>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className={`text-sm font-bold tracking-wider uppercase ${categoryClass}`}>
              {article.category}
            </span>
            <div className="flex items-center gap-2">
              <BookmarkButton item={{ ...article, contentType: 'Article' }} />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black leading-tight tracking-tight mb-4 text-gray-900 dark:text-gray-100">
            {article.title}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
            {article.description}
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span>{article.date}</span>
            <span>•</span>
            <span>5 min read</span>
          </div>
        </header>

        {/* Featured Image */}
        <div className="relative w-full aspect-video mb-8 rounded-xl overflow-hidden">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Share Buttons */}
        <div className="mb-8">
          <SocialShare title={article.title} url={articleUrl} />
        </div>

        {/* Content */}
        <div className="article-content prose prose-lg dark:prose-invert max-w-none">
          {isLoadingContent && article.id.startsWith('http') ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Loading full article content...</p>
            </div>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: displayContent }} />
          )}
          
          {/* Source link */}
          {article.id.startsWith('http') && (
            <p className="mt-8 text-sm text-gray-500 dark:text-gray-400">
              Source:{' '}
              <a 
                href={article.id} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary hover:underline"
              >
                Read original article
              </a>
            </p>
          )}
        </div>
        
        {/* Article Content Styles */}
        <style jsx global>{`
          .article-content ul, .article-content ol {
            margin: 1em 0;
            padding-left: 2em;
          }
          .article-content ul {
            list-style-type: disc;
          }
          .article-content ol {
            list-style-type: decimal;
          }
          .article-content li {
            margin: 0.5em 0;
          }
          .article-content blockquote {
            border-left: 4px solid #e5e7eb;
            padding-left: 1em;
            margin: 1em 0;
            font-style: italic;
            color: #6b7280;
          }
          .dark .article-content blockquote {
            border-left-color: #4b5563;
            color: #9ca3af;
          }
          .article-content pre {
            background: #f3f4f6;
            padding: 1em;
            border-radius: 0.5em;
            overflow-x: auto;
            margin: 1em 0;
          }
          .dark .article-content pre {
            background: #1f2937;
          }
          .article-content code {
            background: #f3f4f6;
            padding: 0.2em 0.4em;
            border-radius: 0.25em;
            font-family: monospace;
            font-size: 0.9em;
          }
          .dark .article-content code {
            background: #1f2937;
          }
          .article-content pre code {
            background: transparent;
            padding: 0;
          }
          .article-content img {
            margin: 1.5em auto;
            display: block;
            border-radius: 0.5em;
            max-width: 100%;
          }
          .article-content h1, .article-content h2, .article-content h3,
          .article-content h4, .article-content h5, .article-content h6 {
            margin-top: 1.5em;
            margin-bottom: 0.5em;
            font-weight: 600;
            color: inherit;
          }
          .article-content p {
            margin: 1em 0;
            line-height: 1.7;
          }
          .article-content a {
            color: #2dd4bf;
            text-decoration: underline;
          }
          .article-content a:hover {
            opacity: 0.8;
          }
        `}</style>

        {/* Author & Share */}
        <footer className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">person</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">Blush & Breathe Team</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Health & Wellness Experts</p>
              </div>
            </div>
            <SocialShare title={article.title} url={articleUrl} />
          </div>
        </footer>
      </article>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold mb-8 text-gray-900 dark:text-gray-100">Related Articles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {relatedArticles.map((relatedArticle) => (
              <ArticleCard key={relatedArticle.id} article={relatedArticle} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
