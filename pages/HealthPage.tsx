import React, { useState, useMemo } from 'react';
import ArticleCard from '../components/ArticleCard';
import { useApi } from '../hooks/useApi';
import { getArticles } from '../services/apiService';
import ErrorMessage from '../components/ErrorMessage';
import ArticleCardSkeleton from '../components/skeletons/ArticleCardSkeleton';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

const CATEGORIES = ['All', 'Nutrition', 'Fitness', 'Mental Health', 'Skincare'];

const HealthPage: React.FC = () => {
  const { data: articles, loading, loadingMore, error, loadMore, hasMore } = useApi(getArticles);
  const [activeCategory, setActiveCategory] = useState('All');
  
  const lastElementRef = useInfiniteScroll({
    loading: loadingMore,
    hasMore,
    onLoadMore: loadMore,
  });

  const filteredArticles = useMemo(() => {
    if (activeCategory === 'All') {
      return articles;
    }
    return articles.filter(article => article.category === activeCategory);
  }, [articles, activeCategory]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 mt-8">
            <div className="flex flex-wrap items-end justify-between gap-4 p-4">
                <div className="flex min-w-72 flex-col gap-2">
                    <h1 className="text-4xl lg:text-5xl font-black tracking-[-0.033em]">Health & Wellness Articles</h1>
                    <p className="text-base font-normal text-text-subtle-light dark:text-text-subtle-dark">Explore our latest articles on nutrition, fitness, and mental well-being.</p>
                </div>
            </div>
            <div className="flex gap-2 md:gap-3 p-3 overflow-x-auto">
                {CATEGORIES.map(category => (
                    <button 
                        key={category}
                        onClick={() => setActiveCategory(category)}
                        className={`flex h-11 shrink-0 cursor-pointer items-center justify-center gap-x-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                            activeCategory === category
                            ? 'bg-primary text-white'
                            : 'bg-border-light dark:bg-border-dark text-text-subtle-light dark:text-text-subtle-dark hover:bg-primary/20 dark:hover:bg-primary/20'
                        }`}
                    >
                        {category}
                    </button>
                ))}
            </div>
             {error && <ErrorMessage message={error} />}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-4">
                {loading 
                    ? Array.from({ length: 8 }).map((_, i) => <ArticleCardSkeleton key={i} />)
                    : filteredArticles.map((article, index) => {
                        if (index === filteredArticles.length - 1) {
                            return <div ref={lastElementRef} key={article.id}><ArticleCard article={article} /></div>;
                        }
                        return <ArticleCard key={article.id} article={article} />;
                    })
                }
                {loadingMore && Array.from({ length: 4 }).map((_, i) => <ArticleCardSkeleton key={`loading-${i}`} />)}
            </div>
             {!loading && !hasMore && <p className="text-center text-text-subtle-light dark:text-text-subtle-dark pb-8">You've reached the end!</p>}
        </div>
    </div>
  );
};

export default HealthPage;
