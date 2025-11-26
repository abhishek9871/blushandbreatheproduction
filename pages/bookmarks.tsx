import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useBookmarks, BookmarkableItem } from '@/hooks/useBookmarks';
import BookmarkButton from '@/components/BookmarkButton';
import VideoPlayer from '@/components/VideoPlayer';
import type { Video, Article, EbayProductSummary, NutritionInfo } from '@/types';

// Section configuration with icons and colors
const SECTIONS = {
  Article: {
    title: 'Health Articles',
    icon: 'article',
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    emptyMessage: 'No health articles bookmarked yet',
    emptyIcon: 'article',
    link: '/health'
  },
  Video: {
    title: 'Saved Videos',
    icon: 'play_circle',
    color: 'from-red-500 to-pink-500',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    emptyMessage: 'No videos bookmarked yet',
    emptyIcon: 'play_circle',
    link: '/videos'
  },
  HealthProduct: {
    title: 'Health Store Products',
    icon: 'local_pharmacy',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    emptyMessage: 'No health products bookmarked yet',
    emptyIcon: 'local_pharmacy',
    link: '/health-store'
  },
  BeautyProduct: {
    title: 'Beauty Products',
    icon: 'spa',
    color: 'from-pink-500 to-rose-500',
    bgColor: 'bg-pink-50 dark:bg-pink-900/20',
    emptyMessage: 'No beauty products bookmarked yet',
    emptyIcon: 'spa',
    link: '/beauty'
  },
  Nutrition: {
    title: 'Nutrition Favorites',
    icon: 'restaurant',
    color: 'from-orange-500 to-amber-500',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    emptyMessage: 'No nutrition items bookmarked yet',
    emptyIcon: 'restaurant',
    link: '/nutrition'
  },
  Product: {
    title: 'Products',
    icon: 'inventory_2',
    color: 'from-purple-500 to-violet-500',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    emptyMessage: 'No products bookmarked yet',
    emptyIcon: 'inventory_2',
    link: '/beauty'
  },
  Tutorial: {
    title: 'Tutorials',
    icon: 'school',
    color: 'from-indigo-500 to-blue-500',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    emptyMessage: 'No tutorials bookmarked yet',
    emptyIcon: 'school',
    link: '/'
  }
};

type ContentType = keyof typeof SECTIONS;

export default function BookmarksPage() {
  const { bookmarkedItems, removeBookmark } = useBookmarks();
  const [activeTab, setActiveTab] = useState<ContentType | 'all'>('all');
  const [playingVideo, setPlayingVideo] = useState<Video | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Group bookmarks by content type
  const groupedBookmarks = bookmarkedItems.reduce((acc, item) => {
    const type = item.contentType as ContentType;
    if (!acc[type]) acc[type] = [];
    acc[type].push(item);
    return acc;
  }, {} as Record<ContentType, BookmarkableItem[]>);

  // Get counts for each type
  const getCounts = () => {
    const counts: Record<string, number> = { all: bookmarkedItems.length };
    Object.keys(SECTIONS).forEach(key => {
      counts[key] = groupedBookmarks[key as ContentType]?.length || 0;
    });
    return counts;
  };

  const counts = getCounts();

  // Filter items based on active tab
  const getDisplayItems = () => {
    if (activeTab === 'all') return bookmarkedItems;
    return groupedBookmarks[activeTab] || [];
  };

  // Render individual bookmark cards based on type
  const renderBookmarkCard = (item: BookmarkableItem) => {
    const type = item.contentType;

    switch (type) {
      case 'Video':
        return <VideoCard key={item.id} item={item as Video & { contentType: 'Video' }} onPlay={setPlayingVideo} />;
      case 'Article':
        return <ArticleCard key={item.id} item={item as Article & { contentType: 'Article' }} />;
      case 'HealthProduct':
      case 'BeautyProduct':
        return <EbayProductCard key={item.id} item={item as EbayProductSummary & { contentType: 'HealthProduct' | 'BeautyProduct' }} />;
      case 'Nutrition':
        return <NutritionCard key={item.id} item={item as (NutritionInfo & { contentType: 'Nutrition' })} />;
      default:
        return <GenericCard key={item.id} item={item} />;
    }
  };

  // Active types that have items
  const activeTypes = Object.keys(SECTIONS).filter(
    key => (groupedBookmarks[key as ContentType]?.length || 0) > 0
  ) as ContentType[];

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>My Bookmarks | Blush & Breathe</title>
        <meta name="description" content="View all your bookmarked health articles, beauty products, videos, and nutrition favorites in one place." />
        <meta name="robots" content="noindex" />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 dark:from-primary/20 dark:via-secondary/20 dark:to-accent/20 py-12 sm:py-16 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="max-w-6xl mx-auto relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <span className="material-symbols-outlined text-3xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                      bookmark
                    </span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                    My Bookmarks
                  </h1>
                </div>
                <p className="text-gray-600 dark:text-gray-300 max-w-xl">
                  Your personal collection of saved articles, videos, products, and more.
                </p>
              </div>
              <div className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                <span className="material-symbols-outlined text-primary">collections_bookmark</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{bookmarkedItems.length}</span>
                <span className="text-gray-500 dark:text-gray-400 text-sm">items saved</span>
              </div>
            </div>
          </div>
        </section>

        {/* Category Tabs */}
        {bookmarkedItems.length > 0 && (
          <section className="sticky top-16 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 px-4 py-3">
            <div className="max-w-6xl mx-auto">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                <TabButton
                  active={activeTab === 'all'}
                  onClick={() => setActiveTab('all')}
                  icon="apps"
                  label="All"
                  count={counts.all}
                />
                {activeTypes.map(type => (
                  <TabButton
                    key={type}
                    active={activeTab === type}
                    onClick={() => setActiveTab(type)}
                    icon={SECTIONS[type].icon}
                    label={SECTIONS[type].title.split(' ')[0]}
                    count={counts[type]}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Main Content */}
        <section className="py-8 sm:py-12 px-4">
          <div className="max-w-6xl mx-auto">
            {bookmarkedItems.length === 0 ? (
              <EmptyState />
            ) : activeTab === 'all' ? (
              // All bookmarks view - grouped by type
              <div className="space-y-12">
                {activeTypes.map(type => (
                  <BookmarkSection
                    key={type}
                    type={type}
                    items={groupedBookmarks[type]}
                    renderCard={renderBookmarkCard}
                  />
                ))}
              </div>
            ) : (
              // Single category view
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {getDisplayItems().map(renderBookmarkCard)}
              </div>
            )}
          </div>
        </section>

        {/* Video Player Modal */}
        {playingVideo && (
          <VideoPlayer video={playingVideo} onClose={() => setPlayingVideo(null)} />
        )}
      </div>
    </>
  );
}

// Tab Button Component
function TabButton({ active, onClick, icon, label, count }: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
        active
          ? 'bg-primary text-white shadow-md'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
      }`}
    >
      <span className="material-symbols-outlined text-lg">{icon}</span>
      <span>{label}</span>
      <span className={`px-1.5 py-0.5 rounded-full text-xs ${
        active ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-700'
      }`}>
        {count}
      </span>
    </button>
  );
}

// Bookmark Section Component
function BookmarkSection({ type, items, renderCard }: {
  type: ContentType;
  items: BookmarkableItem[];
  renderCard: (item: BookmarkableItem) => React.ReactNode;
}) {
  const section = SECTIONS[type];
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${section.color}`}>
            <span className="material-symbols-outlined text-2xl text-white">{section.icon}</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{section.title}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{items.length} saved</p>
          </div>
        </div>
        <Link
          href={section.link}
          className="text-primary hover:text-primary/80 text-sm font-medium flex items-center gap-1"
        >
          Browse more
          <span className="material-symbols-outlined text-lg">arrow_forward</span>
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {items.map(renderCard)}
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState() {
  return (
    <div className="text-center py-16 sm:py-24">
      <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <span className="material-symbols-outlined text-5xl text-gray-400">bookmark_border</span>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
        No bookmarks yet
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
        Start exploring and save your favorite articles, videos, and products to access them quickly anytime.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {[
          { label: 'Health Articles', path: '/health', icon: 'article' },
          { label: 'Videos', path: '/videos', icon: 'play_circle' },
          { label: 'Health Store', path: '/health-store', icon: 'local_pharmacy' },
          { label: 'Nutrition', path: '/nutrition', icon: 'restaurant' },
        ].map(link => (
          <Link
            key={link.path}
            href={link.path}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-xl">{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

// Video Card Component
function VideoCard({ item, onPlay }: { 
  item: Video & { contentType: 'Video' }; 
  onPlay: (video: Video) => void;
}) {
  return (
    <div className="group bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all">
      <div className="relative">
        <div className="absolute top-2 right-2 z-10">
          <BookmarkButton 
            item={item} 
            className="bg-black/40 text-white/80 hover:bg-black/60" 
          />
        </div>
        <button
          onClick={() => onPlay(item)}
          className="block w-full aspect-video relative cursor-pointer"
        >
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
            <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-white">play_arrow</span>
            </div>
          </div>
          <span className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
            {item.duration}
          </span>
          {item.isShort && (
            <span className="absolute top-2 left-2 px-2 py-1 bg-red-600 text-white text-xs rounded font-medium">
              SHORT
            </span>
          )}
        </button>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1">
          {item.title}
        </h3>
        {item.channelTitle && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{item.channelTitle}</p>
        )}
      </div>
    </div>
  );
}

// Article Card Component
function ArticleCard({ item }: { item: Article & { contentType: 'Article' } }) {
  return (
    <Link href={`/article/${item.id}`} className="group block">
      <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all h-full">
        <div className="relative aspect-[16/10]">
          <div className="absolute top-2 right-2 z-10">
            <BookmarkButton 
              item={item} 
              className="bg-black/40 text-white/80 hover:bg-black/60" 
            />
          </div>
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <span className="absolute bottom-2 left-2 px-2 py-1 bg-emerald-600 text-white text-xs rounded font-medium">
            {item.category}
          </span>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-primary transition-colors">
            {item.title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
            {item.description}
          </p>
        </div>
      </div>
    </Link>
  );
}

// eBay Product Card Component
function EbayProductCard({ item }: { item: EbayProductSummary & { contentType: 'HealthProduct' | 'BeautyProduct' } }) {
  const isHealth = item.contentType === 'HealthProduct';
  
  return (
    <a href={item.webUrl} target="_blank" rel="noopener noreferrer" className="group block">
      <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all h-full">
        <div className="relative aspect-square bg-gray-100 dark:bg-gray-700">
          <div className="absolute top-2 right-2 z-10">
            <BookmarkButton 
              item={item} 
              className="bg-black/40 text-white/80 hover:bg-black/60" 
            />
          </div>
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
          />
          <span className={`absolute top-2 left-2 px-2 py-1 text-white text-xs rounded font-medium ${
            isHealth ? 'bg-blue-600' : 'bg-pink-600'
          }`}>
            {isHealth ? 'Health' : 'Beauty'}
          </span>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-primary transition-colors text-sm">
            {item.title}
          </h3>
          <div className="flex items-center justify-between mt-2">
            <span className="text-lg font-bold text-primary">
              ${item.price.value.toFixed(2)}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
              {item.condition}
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}

// Nutrition Card Component
function NutritionCard({ item }: { item: NutritionInfo & { contentType: 'Nutrition' } }) {
  const hasNutrients = 'nutrients' in item && item.nutrients;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all">
      <div className="relative aspect-[4/3]">
        <div className="absolute top-2 right-2 z-10">
          <BookmarkButton 
            item={item} 
            className="bg-black/40 text-white/80 hover:bg-black/60" 
          />
        </div>
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2">
          {item.name}
        </h3>
        {hasNutrients && (
          <div className="flex gap-3 mt-2 text-xs">
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
              P: {item.nutrients.protein}g
            </span>
            <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded">
              C: {item.nutrients.carbs}g
            </span>
            <span className="px-2 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 rounded">
              F: {item.nutrients.fats}g
            </span>
          </div>
        )}
        {item.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
            {item.description}
          </p>
        )}
      </div>
    </div>
  );
}

// Generic Card Component (fallback)
function GenericCard({ item }: { item: BookmarkableItem }) {
  const title = 'title' in item ? item.title : ('name' in item ? item.name : 'Item');
  const image = 'imageUrl' in item ? item.imageUrl : '';
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all">
      {image && (
        <div className="relative aspect-video">
          <div className="absolute top-2 right-2 z-10">
            <BookmarkButton 
              item={item} 
              className="bg-black/40 text-white/80 hover:bg-black/60" 
            />
          </div>
          <img src={image} alt={title} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-4">
        <span className="text-xs text-primary font-medium uppercase">{item.contentType}</span>
        <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mt-1">
          {title}
        </h3>
      </div>
    </div>
  );
}
