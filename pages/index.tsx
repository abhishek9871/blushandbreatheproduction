import Head from 'next/head';
import Link from 'next/link';
import type { GetStaticProps, InferGetStaticPropsType } from 'next';
import { getFeaturedArticles } from '@/services/apiService';
import { ArticleCard } from '@/components';
import { ArticleCardSkeleton } from '@/components/skeletons';
import type { Article } from '@/types';

interface HomeProps {
  featuredArticles: Article[];
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  try {
    const { data: articles } = await getFeaturedArticles();
    return {
      props: {
        featuredArticles: articles || [],
      },
      revalidate: 3600, // Re-generate every hour
    };
  } catch (error) {
    console.error('Failed to fetch featured articles:', error);
    return {
      props: { featuredArticles: [] },
      revalidate: 60, // Retry sooner on error
    };
  }
};

export default function Home({ featuredArticles }: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <>
      <Head>
        <title>Blush & Breathe | Health, Beauty & Wellness</title>
        <meta name="description" content="Your ultimate guide to health, beauty, and wellness. Discover skincare tips, nutrition guides, and wellness advice." />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Hero Section */}
        <section className="w-full">
          <div className="flex min-h-[500px] flex-col gap-6 bg-cover bg-center bg-no-repeat rounded-xl items-center justify-center text-center px-6 py-10" style={{ backgroundImage: "linear-gradient(to top, rgba(15, 118, 110, 0.8) 0%, rgba(45, 212, 191, 0.6) 100%)" }}>
            <div className="flex flex-col gap-4 max-w-3xl">
              <h1 className="text-white text-4xl font-black leading-tight tracking-tight md:text-6xl">The Ultimate Guide to Mindful Skincare</h1>
              <p className="text-white/90 text-base font-normal leading-relaxed md:text-lg">Discover the secrets to a radiant complexion and a calm mind with our comprehensive guide to skincare rituals.</p>
            </div>
            <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-8 mt-4 bg-white text-primary text-base font-bold leading-normal tracking-wide shadow-lg hover:bg-gray-200 transition-all transform hover:scale-105">
              <span className="truncate">Read Full Article</span>
            </button>
          </div>
        </section>

        {/* Category Cards */}
        <section className="py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/health" className="flex flex-1 gap-4 rounded-xl border-t-4 border-primary bg-white dark:bg-gray-800 p-6 flex-col shadow-sm hover:shadow-lg transition-shadow">
              <div className="text-primary"><span className="material-symbols-outlined text-3xl">local_hospital</span></div>
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Health</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-normal leading-normal">Explore articles and tips for a healthier lifestyle.</p>
              </div>
            </Link>
            <Link href="/beauty" className="flex flex-1 gap-4 rounded-xl border-t-4 border-secondary bg-white dark:bg-gray-800 p-6 flex-col shadow-sm hover:shadow-lg transition-shadow">
              <div className="text-secondary"><span className="material-symbols-outlined text-3xl">face_4</span></div>
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Beauty</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-normal leading-normal">Discover the latest beauty trends and skincare advice.</p>
              </div>
            </Link>
            <Link href="/nutrition" className="flex flex-1 gap-4 rounded-xl border-t-4 border-accent bg-white dark:bg-gray-800 p-6 flex-col shadow-sm hover:shadow-lg transition-shadow">
              <div className="text-accent"><span className="material-symbols-outlined text-3xl">restaurant</span></div>
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Nutrition</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-normal leading-normal">Find delicious recipes and expert nutrition guides.</p>
              </div>
            </Link>
          </div>
        </section>

        {/* Featured Articles */}
        <section className="py-8">
          <h2 className="text-2xl font-bold tracking-tight pb-6 text-gray-900 dark:text-gray-100">Featured Articles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredArticles.length > 0 ? (
              featuredArticles.map(article => <ArticleCard key={article.id} article={article} />)
            ) : (
              Array.from({ length: 3 }).map((_, i) => <ArticleCardSkeleton key={i} />)
            )}
          </div>
        </section>
      </div>
    </>
  );
}
