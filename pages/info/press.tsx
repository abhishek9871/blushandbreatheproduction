import Head from 'next/head';
import Link from 'next/link';
import { useEffect } from 'react';

export default function PressPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const pressReleases = [
    {
      date: 'November 2025',
      title: 'Blush & Breathe Launches AI-Powered Diet Planner',
      excerpt: 'New feature uses Google Gemini AI to create personalized weekly meal plans based on individual health profiles.'
    },
    {
      date: 'October 2025',
      title: 'Platform Reaches 1 Million Monthly Readers',
      excerpt: 'Blush & Breathe celebrates milestone as demand for curated health content continues to grow.'
    },
    {
      date: 'September 2025',
      title: 'Blush & Breathe Partners with Leading Health Publications',
      excerpt: 'New partnerships expand content library with trusted sources from medical and wellness experts.'
    }
  ];

  const mediaFeatures = [
    { name: 'TechCrunch', quote: 'A fresh approach to health content discovery' },
    { name: 'Forbes Health', quote: 'Making wellness information accessible' },
    { name: 'Wellness Weekly', quote: 'The go-to platform for health enthusiasts' }
  ];

  return (
    <>
      <Head>
        <title>Press & Media | Blush & Breathe News</title>
        <meta name="description" content="Latest news, press releases, and media coverage about Blush & Breathe. Download our press kit and brand assets for media inquiries." />
        <meta name="keywords" content="press releases, media coverage, health tech news, blush and breathe news, wellness platform press" />
        <meta property="og:title" content="Press & Media | Blush & Breathe" />
        <meta property="og:description" content="Latest news and media coverage about Blush & Breathe health and beauty platform." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://www.blushandbreath.com/info/press" />
        <meta name="robots" content="index, follow" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-accent/5 to-transparent dark:from-accent/10">
        {/* Hero Section */}
        <section className="relative py-16 sm:py-24 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-block px-4 py-1.5 bg-accent/20 text-amber-700 dark:text-accent rounded-full text-sm font-medium mb-6">
              Press & Media
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Blush & Breathe in the News
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Stay updated with our latest announcements, press releases, and media coverage.
            </p>
          </div>
        </section>

        {/* Press Kit */}
        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-accent/10 to-primary/10 rounded-2xl p-6 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Press Kit & Brand Assets
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Download logos, brand guidelines, and media resources.
                </p>
              </div>
              <Link 
                href="/info/contact" 
                className="px-6 py-3 bg-accent text-gray-900 rounded-lg font-semibold hover:bg-accent/90 transition-colors whitespace-nowrap flex items-center gap-2"
              >
                <span className="material-symbols-outlined">download</span>
                Request Press Kit
              </Link>
            </div>
          </div>
        </section>

        {/* Latest News */}
        <section className="py-12 sm:py-16 px-4 bg-white dark:bg-gray-800/50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
              Latest Press Releases
            </h2>
            <div className="space-y-6">
              {pressReleases.map((release, index) => (
                <article key={index} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 hover:shadow-lg transition-shadow">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="sm:w-32 flex-shrink-0">
                      <span className="text-sm font-medium text-accent">{release.date}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {release.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                        {release.excerpt}
                      </p>
                      <Link 
                        href="/info/contact" 
                        className="text-primary hover:text-primary/80 text-sm font-medium inline-flex items-center gap-1"
                      >
                        Read Full Release
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Media Coverage */}
        <section className="py-12 sm:py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center mb-4">
              Featured In
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-center mb-12">
              What the media is saying about Blush & Breathe
            </p>
            <div className="grid sm:grid-cols-3 gap-6">
              {mediaFeatures.map((feature, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center shadow-sm">
                  <div className="text-2xl font-bold text-gray-400 dark:text-gray-500 mb-4">
                    {feature.name}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 italic">
                    &ldquo;{feature.quote}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="py-12 sm:py-16 px-4 bg-white dark:bg-gray-800/50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center mb-8">
              About Blush & Breathe
            </h2>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 sm:p-8">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                <strong className="text-gray-900 dark:text-white">Blush & Breathe</strong> is a health and beauty content aggregation platform 
                that curates trusted articles, videos, and resources from leading publications worldwide. 
                Our mission is to make wellness information accessible to everyone.
              </p>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Founded with the belief that everyone deserves access to reliable health information, 
                Blush & Breathe uses advanced technology including AI-powered personalization to help 
                users discover content tailored to their wellness journey.
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                The platform features curated health articles, beauty tips, nutrition guides, 
                video tutorials, and an innovative AI diet planner powered by Google Gemini.
              </p>
            </div>
          </div>
        </section>

        {/* Media Contact */}
        <section className="py-12 sm:py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <span className="material-symbols-outlined text-5xl text-accent mb-4 block">
              contact_mail
            </span>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Media Inquiries
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-lg mx-auto">
              For press inquiries, interviews, or additional information, please reach out to our media team.
            </p>
            <Link 
              href="/info/contact" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">email</span>
              Contact Media Team
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
