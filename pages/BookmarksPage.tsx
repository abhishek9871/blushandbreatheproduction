
import React, { useMemo } from 'react';
import { useBookmarks, BookmarkableItem } from '../hooks/useBookmarks';
import ArticleCard from '../components/ArticleCard';
import ProductCard from '../components/ProductCard';
import VideoCard from '../components/VideoCard';
import NutritionCard from '../components/NutritionCard';
import { Link } from 'react-router-dom';
import { getHighQualityEbayImage } from '../utils/productUtils';
import BookmarkButton from '../components/BookmarkButton';

const BookmarksPage: React.FC = () => {
    const { bookmarkedItems } = useBookmarks();

    const categorizedItems = useMemo(() => {
        const categories: Record<string, BookmarkableItem[]> = {
            'Articles': [],
            'Health Products': [],
            'Beauty Products': [],
            'Nutrition Facts': [],
            'Videos': [],
            'Other': []
        };

        bookmarkedItems.forEach(item => {
            switch (item.contentType) {
                case 'Article':
                    categories['Articles'].push(item);
                    break;
                case 'HealthProduct':
                    categories['Health Products'].push(item);
                    break;
                case 'BeautyProduct':
                    categories['Beauty Products'].push(item);
                    break;
                case 'Nutrition':
                    categories['Nutrition Facts'].push(item);
                    break;
                case 'Video':
                    categories['Videos'].push(item);
                    break;
                case 'Product': // Legacy/Mock products
                    categories['Beauty Products'].push(item);
                    break;
                default:
                    categories['Other'].push(item);
            }
        });

        return categories;
    }, [bookmarkedItems]);

    const renderEbayProduct = (product: any, type: 'health' | 'beauty') => (
        <Link
            key={product.id}
            to={`/${type === 'health' ? 'health-store' : 'beauty'}/product/${encodeURIComponent(product.id)}`}
            className="group relative flex flex-col overflow-hidden rounded-xl border border-border-light dark:border-border-dark shadow-sm hover:shadow-lg transition-shadow duration-300 bg-white dark:bg-gray-800"
        >
            <div className="absolute top-2 right-2 z-10">
                <BookmarkButton item={product} className="bg-white/70 dark:bg-black/70 hover:bg-white dark:hover:bg-black text-text-subtle-light dark:text-text-subtle-dark hover:text-secondary" />
            </div>
            <div className="aspect-square w-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                <img
                    alt={product.title}
                    className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    src={getHighQualityEbayImage(product.imageUrl)}
                />
            </div>
            <div className="flex flex-1 flex-col p-4">
                <h3 className="font-semibold mt-1 text-brand-text dark:text-white line-clamp-2">{product.title}</h3>
                <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark mt-2">
                    {product.condition}
                </p>
                <p className="text-lg font-bold mt-auto pt-2 text-brand-text dark:text-white">
                    ${product.price?.value?.toFixed(2)}
                </p>
            </div>
        </Link>
    );

    const renderSection = (title: string, items: BookmarkableItem[]) => {
        if (items.length === 0) return null;

        return (
            <section key={title} className="mb-12">
                <div className="flex items-center gap-4 mb-6">
                    <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
                    <div className="h-px flex-1 bg-border-light dark:bg-border-dark"></div>
                    <span className="text-sm text-text-subtle-light dark:text-text-subtle-dark font-medium bg-background-light dark:bg-background-dark px-3 py-1 rounded-full border border-border-light dark:border-border-dark">
                        {items.length} item{items.length !== 1 ? 's' : ''}
                    </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {items.map(item => {
                        switch (item.contentType) {
                            case 'Article':
                                return <ArticleCard key={item.id} article={item as any} />;
                            case 'HealthProduct':
                                return renderEbayProduct(item, 'health');
                            case 'BeautyProduct':
                                return renderEbayProduct(item, 'beauty');
                            case 'Product': // Mock products
                                return <ProductCard key={item.id} product={item as any} />;
                            case 'Nutrition':
                                return <NutritionCard key={item.id} item={item as any} />;
                            case 'Video':
                                return <VideoCard key={item.id} video={item as any} />;
                            default:
                                return null;
                        }
                    })}
                </div>
            </section>
        );
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
            <div className="flex flex-col gap-2 mb-10">
                <h1 className="text-4xl lg:text-5xl font-black tracking-[-0.033em]">Your Bookmarks</h1>
                <p className="text-lg text-text-subtle-light dark:text-text-subtle-dark">
                    Manage your saved articles, products, and nutrition facts.
                </p>
            </div>

            {bookmarkedItems.length === 0 ? (
                <div className="text-center py-24 border-2 border-dashed border-border-light dark:border-border-dark rounded-2xl bg-background-light/50 dark:bg-background-dark/50">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-4xl text-primary">bookmark_border</span>
                    </div>
                    <h2 className="text-2xl font-bold mb-3">No bookmarks yet</h2>
                    <p className="text-text-subtle-light dark:text-text-subtle-dark max-w-md mx-auto mb-8">
                        Save items you love by clicking the bookmark icon on articles, products, and nutrition cards.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Link to="/" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-white bg-primary hover:bg-primary/90 transition-colors">
                            Explore Articles
                        </Link>
                        <Link to="/beauty" className="inline-flex items-center justify-center px-6 py-3 border border-border-light dark:border-border-dark text-base font-medium rounded-full text-text-light dark:text-text-dark bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            Browse Store
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {renderSection('Health Products', categorizedItems['Health Products'])}
                    {renderSection('Beauty Products', categorizedItems['Beauty Products'])}
                    {renderSection('Nutrition Facts', categorizedItems['Nutrition Facts'])}
                    {renderSection('Articles', categorizedItems['Articles'])}
                    {renderSection('Videos', categorizedItems['Videos'])}
                    {renderSection('Other', categorizedItems['Other'])}
                </div>
            )}
        </div>
    );
};

export default BookmarksPage;
