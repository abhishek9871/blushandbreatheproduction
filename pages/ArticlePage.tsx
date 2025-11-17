
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { allMockData, getArticleById } from '../services/apiService';
import { fetchFullArticle } from '../services/fullArticle';
import { generateFullArticle } from '../services/contentGenerator';
import type { Article, Video } from '../types';
import ErrorMessage from '../components/ErrorMessage';
import ReadingProgressBar from '../components/ReadingProgressBar';
import SocialShare from '../components/SocialShare';
import BookmarkButton from '../components/BookmarkButton';
import ArticleCardSkeleton from '../components/skeletons/ArticleCardSkeleton';
import ArticleCard from '../components/ArticleCard';
import VideoCard from '../components/VideoCard';

const ArticlePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const decodedId = id ? decodeURIComponent(id) : '';
    const [article, setArticle] = useState<Article | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
    const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
    const [fullHtml, setFullHtml] = useState<string | null>(null);
    const [fullTitle, setFullTitle] = useState<string | undefined>(undefined);

    useEffect(() => {
        const fetchArticle = async () => {
            if (!decodedId) {
                setError("Article ID is missing.");
                setLoading(false);
                return;
            };
            try {
                setLoading(true);
                const fetchedArticle = await getArticleById(decodedId);
                if (fetchedArticle) {
                    setArticle(fetchedArticle);
                } else {
                    setError("Article not found.");
                }
            } catch (err) {
                setError("Failed to fetch article data.");
            } finally {
                setLoading(false);
            }
        };
        fetchArticle();
    }, [id]);

    useEffect(() => {
        if (!article) return;
        let cancelled = false;
        setFullHtml(null);
        (async () => {
            try {
                const res = await fetchFullArticle(article.id);
                if (!cancelled) {
                    setFullTitle(res.title);
                    if (res.html) {
                        setFullHtml(res.html);
                    } else {
                        // Generate full content if fetch fails
                        const generated = generateFullArticle(article.title, article.description);
                        const html = generated.split('\n\n').map(p => {
                            if (p.startsWith('## ')) return `<h2>${p.slice(3)}</h2>`;
                            if (p.includes('\n- ')) {
                                const items = p.split('\n- ').slice(1);
                                return '<ul>' + items.map(i => `<li>${i}</li>`).join('') + '</ul>';
                            }
                            if (p.match(/^\d+\./m)) {
                                const items = p.split(/\n\d+\.\s/).slice(1);
                                return '<ol>' + items.map(i => `<li>${i}</li>`).join('') + '</ol>';
                            }
                            return `<p>${p}</p>`;
                        }).join('\n');
                        setFullHtml(html);
                    }
                }
            } catch (e) {
                if (!cancelled) {
                    // Always generate content as fallback
                    const generated = generateFullArticle(article.title, article.description);
                    const html = generated.split('\n\n').map(p => {
                        if (p.startsWith('## ')) return `<h2>${p.slice(3)}</h2>`;
                        if (p.includes('\n- ')) {
                            const items = p.split('\n- ').slice(1);
                            return '<ul>' + items.map(i => `<li>${i}</li>`).join('') + '</ul>';
                        }
                        if (p.match(/^\d+\./m)) {
                            const items = p.split(/\n\d+\.\s/).slice(1);
                            return '<ol>' + items.map(i => `<li>${i}</li>`).join('') + '</ol>';
                        }
                        return `<p>${p}</p>`;
                    }).join('\n');
                    setFullHtml(html);
                }
            }
        })();
        return () => { cancelled = true; };

        try {
            const relatedArticleItems = allMockData
                .filter(item => item.contentType === 'Article' && item.id !== article.id)
                .filter(item => (item as Article).category === article.category)
                .slice(0, 3) as Article[];

            const relatedVideoItems = allMockData
                .filter(item => item.contentType === 'Video')
                .slice(0, 3) as Video[];

            setRelatedArticles(relatedArticleItems);
            setRelatedVideos(relatedVideoItems);
        } catch (e) {
            console.error('Failed to compute related content', e);
        }
    }, [article]);

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                <div className="space-y-4">
                    <div className="h-10 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-6 w-1/2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="w-full aspect-video bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
                    <div className="h-6 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-6 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-6 w-5/6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
            </div>
        )
    }
    if (error) return <div className="max-w-4xl mx-auto p-8"><ErrorMessage message={error} /></div>;
    if (!article) return null;

    return (
        <>
            <ReadingProgressBar />
            <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                <div className="prose dark:prose-invert lg:prose-lg max-w-full" id="printable-content">
                    <Link to="/health" className="text-primary font-semibold hover:underline">
                        &larr; Back to articles
                    </Link>
                    <h1 className="mt-4">{article.title}</h1>
                    <div className="flex items-center gap-4 text-sm text-text-subtle-light dark:text-text-subtle-dark mb-4">
                        <span>{article.date}</span>
                        <span>&bull;</span>
                        <span>{article.category}</span>
                    </div>
                     <div className="flex justify-between items-center mb-6 not-prose">
                        <SocialShare title={article.title} url={window.location.href} />
                        <div className="flex items-center gap-2">
                             <BookmarkButton itemId={article.id} className="text-text-subtle-light dark:text-text-subtle-dark hover:text-primary dark:hover:text-primary" />
                             <button onClick={() => window.print()} aria-label="Print article" className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                <span className="material-symbols-outlined">print</span>
                             </button>
                        </div>
                    </div>

                    {article.imageUrl && (
                        <img 
                            src={article.imageUrl} 
                            alt={article.title} 
                            className="w-full rounded-xl mb-8"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                            }}
                        />
                    )}
                    
                    <div>
                        <div className="mb-6 article-content" dangerouslySetInnerHTML={{ __html: fullHtml || '<p>Loading content...</p>' }} />
                        <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark">
                            Source: <a href={article.id} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Read original article</a>
                        </p>
                            <style>{`
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
                                }
                                .article-content h1, .article-content h2, .article-content h3,
                                .article-content h4, .article-content h5, .article-content h6 {
                                    margin-top: 1.5em;
                                    margin-bottom: 0.5em;
                                    font-weight: 600;
                                }
                                .article-content p {
                                    margin: 1em 0;
                                    line-height: 1.7;
                                }
                            `}</style>
                    </div>
                </div>
                {(relatedArticles.length > 0 || relatedVideos.length > 0) && (
                    <div className="mt-12 not-prose border-t border-border-light dark:border-border-dark pt-8">
                        <h2 className="text-xl font-bold tracking-tight mb-4">Related for you</h2>
                        {relatedArticles.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                {relatedArticles.map(related => (
                                    <ArticleCard key={related.id} article={related} />
                                ))}
                            </div>
                        )}
                        {relatedVideos.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold mb-3">Watch next</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {relatedVideos.map(video => (
                                        <VideoCard key={video.id} video={video} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </article>
        </>
    );
};

export default ArticlePage;
