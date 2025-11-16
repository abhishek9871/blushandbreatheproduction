
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { allMockData, getArticleById } from '../services/apiService';
import { fetchFullArticle } from '../services/fullArticle';
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
                    if (res.html) setFullHtml(res.html);
                }
            } catch (e) {
                if (!cancelled) setFullHtml(null);
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

                    <img src={article.imageUrl} alt={article.title} className="w-full rounded-xl mb-8" />
                    
                    {fullHtml ? (
                        <div>
                            <div className="mb-6" dangerouslySetInnerHTML={{ __html: fullHtml }} />
                            <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark">
                                Source: <a href={article.id} target="_blank" rel="noopener noreferrer">{new URL(article.id).hostname}</a>
                            </p>
                        </div>
                    ) : (
                        <>
                            <p className="lead">{article.description}</p>
                            {article.content.split('\n').map((paragraph, index) => (
                                <p key={index}>{paragraph}</p>
                            ))}
                            <p className="text-sm mt-4">Read full article on <a href={article.id} target="_blank" rel="noopener noreferrer">{new URL(article.id).hostname}</a></p>
                        </>
                    )}
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
