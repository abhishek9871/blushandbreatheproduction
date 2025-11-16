
import React from 'react';
import { useBookmarks } from '../hooks/useBookmarks';
import ArticleCard from '../components/ArticleCard';
import ProductCard from '../components/ProductCard';
import VideoCard from '../components/VideoCard';
import { Link } from 'react-router-dom';

const BookmarksPage: React.FC = () => {
    const { bookmarkedItems } = useBookmarks();

    const renderItem = (item: any) => {
        switch (item.contentType) {
            case 'Article':
                return <ArticleCard article={item} />;
            case 'Product':
                return <ProductCard product={item} />;
            case 'Video':
                return <VideoCard video={item} />;
            default:
                return null;
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
            <h1 className="text-4xl lg:text-5xl font-black tracking-[-0.033em] mb-8">Your Bookmarks</h1>

            {bookmarkedItems.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-border-light dark:border-border-dark rounded-xl">
                    <span className="material-symbols-outlined text-6xl text-text-subtle-light dark:text-text-subtle-dark">bookmark_border</span>
                    <h2 className="mt-4 text-xl font-bold">No bookmarks yet!</h2>
                    <p className="mt-2 text-text-subtle-light dark:text-text-subtle-dark">
                        Click the bookmark icon on any item to save it for later.
                    </p>
                    <Link to="/" className="mt-6 inline-block bg-primary text-white font-bold py-2 px-6 rounded-full hover:bg-opacity-80 transition-colors">
                        Explore Content
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {bookmarkedItems.map(item => (
                        <div key={item.id}>{renderItem(item)}</div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BookmarksPage;
