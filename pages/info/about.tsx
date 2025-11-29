import Head from 'next/head';
import Link from 'next/link';
import { useEffect } from 'react';

export default function AboutPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <>
      <Head>
        <title>Our Story | Blush & Breathe - Health & Beauty Hub</title>
        <meta name="description" content="Discover the story behind Blush & Breathe. We curate the best health, beauty, and wellness content from trusted sources to help you live your best life." />
        <meta name="keywords" content="about us, blush and breathe, wellness platform, content curation, health and wellness" />
        <meta property="og:title" content="Our Story | Blush & Breathe" />
        <meta property="og:description" content="Discover the story behind Blush & Breathe - your trusted health and beauty content hub." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://www.blushandbreath.com/info/about" />
        <meta name="robots" content="index, follow" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-transparent dark:from-primary/10">
        {/* Hero Section */}
        <section className="relative py-16 sm:py-24 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
              Our Story
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Curating Wellness,<br className="hidden sm:block" /> One Article at a Time
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              We believe everyone deserves access to trusted health and beauty information. 
              That&apos;s why we built Blush & Breathe.
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-12 sm:py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
              <div className="order-2 md:order-1">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Our Mission
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  In a world overflowing with information, finding reliable health and beauty advice can be overwhelming. 
                  We created Blush & Breathe to solve this problem.
                </p>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  As a <strong className="text-primary">content aggregation platform</strong>, we carefully curate articles, 
                  videos, and resources from trusted sources across the web. Our AI-powered tools help you discover 
                  personalized nutrition plans, beauty tips, and wellness advice tailored to your needs.
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  We don&apos;t create the content – we find the best of it and bring it to you in one beautiful, 
                  easy-to-navigate platform.
                </p>
              </div>
              <div className="order-1 md:order-2 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl p-8 sm:p-12">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">1000+</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Curated Articles</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl sm:text-4xl font-bold text-secondary mb-2">50+</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Trusted Sources</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl sm:text-4xl font-bold text-accent mb-2">24/7</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Updated Content</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">AI</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Powered Tools</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-12 sm:py-16 px-4 bg-white dark:bg-gray-800/50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
              What We Stand For
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {[
                {
                  icon: 'verified',
                  title: 'Trusted Sources',
                  description: 'We only aggregate content from reputable health and beauty publications, ensuring you get reliable information.'
                },
                {
                  icon: 'diversity_3',
                  title: 'Accessibility',
                  description: 'Health and beauty knowledge should be free and accessible to everyone, regardless of background.'
                },
                {
                  icon: 'auto_awesome',
                  title: 'Innovation',
                  description: 'Our AI-powered diet planner and smart search help you find exactly what you need, faster.'
                },
                {
                  icon: 'shield',
                  title: 'Privacy First',
                  description: 'Your data stays yours. We don\'t sell your information or track you across the web.'
                },
                {
                  icon: 'eco',
                  title: 'Holistic Wellness',
                  description: 'We believe true beauty comes from within – health, nutrition, and self-care go hand in hand.'
                },
                {
                  icon: 'handshake',
                  title: 'Transparency',
                  description: 'We\'re upfront about being aggregators. Original content belongs to its creators, always credited.'
                }
              ].map((value, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 hover:shadow-lg transition-shadow">
                  <span className="material-symbols-outlined text-3xl text-primary mb-4 block">
                    {value.icon}
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to Start Your Wellness Journey?
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Explore our curated content and discover tips that work for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/health" className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                Explore Health
              </Link>
              <Link href="/beauty" className="px-6 py-3 bg-secondary text-white rounded-lg font-semibold hover:bg-secondary/90 transition-colors">
                Discover Beauty
              </Link>
              <Link href="/nutrition" className="px-6 py-3 bg-accent text-gray-900 rounded-lg font-semibold hover:bg-accent/90 transition-colors">
                Plan Your Nutrition
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
