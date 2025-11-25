
import React from 'react';
import { Link } from 'react-router-dom';
import type { Article } from '../types';
import BookmarkButton from './BookmarkButton';

interface ArticleCardProps {
  article: Article;
}

const categoryColorMap: { [key: string]: string } = {
    'Nutrition': 'text-accent',
    'Fitness': 'text-blue-500',
    'Mental Health': 'text-purple-500',
    'Skincare': 'text-secondary',
    'Health': 'text-primary'
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  const categoryClass = categoryColorMap[article.category] || 'text-primary';
  return (
    <Link to={`/article/${encodeURIComponent(article.id)}`} className="flex flex-col gap-4 group">
      <div 
        className="w-full overflow-hidden bg-center bg-no-repeat bg-cover rounded-xl aspect-video transition-transform group-hover:scale-105" 
        style={{ backgroundImage: `url("${article.imageUrl}")` }}>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
            <p className={`text-xs font-bold tracking-wider uppercase ${categoryClass}`}>{article.category}</p>
            <BookmarkButton item={{ ...article, contentType: 'Article' }} className="text-text-subtle-light dark:text-text-subtle-dark hover:text-primary dark:hover:text-primary -mr-2" />
        </div>
        <h3 className="text-lg font-bold leading-tight text-text-light dark:text-text-dark group-hover:text-primary transition-colors">{article.title}</h3>
        <p className="text-sm font-normal text-text-subtle-light dark:text-text-subtle-dark line-clamp-2">{article.description}</p>
        <p className="mt-1 text-xs font-normal text-text-subtle-light dark:text-text-subtle-dark">{article.date}</p>
      </div>
    </Link>
  );
};

export default ArticleCard;
