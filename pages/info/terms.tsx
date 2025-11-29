import Head from 'next/head';
import Link from 'next/link';
import { useEffect } from 'react';

export default function TermsPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <>
      <Head>
        <title>Terms of Service | Blush & Breathe</title>
        <meta name="description" content="Read the Terms of Service for Blush & Breathe. Understand your rights and responsibilities when using our health and beauty content platform." />
        <meta name="keywords" content="terms of service, terms and conditions, user agreement, legal terms, blush and breathe terms" />
        <meta property="og:title" content="Terms of Service | Blush & Breathe" />
        <meta property="og:description" content="Terms of Service for Blush & Breathe health and beauty content platform." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://www.blushandbreath.com/info/terms" />
        <meta name="robots" content="index, follow" />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <section className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-12 sm:py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-sm mb-4">
              Legal
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Terms of Service
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Last updated: November 2025
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-10 shadow-sm">
              <div className="prose dark:prose-invert max-w-none">
                
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-0 mb-4">
                  1. Agreement to Terms
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  By accessing or using Blush & Breathe (&quot;the Platform&quot;), you agree to be bound by these 
                  Terms of Service. If you do not agree to these terms, please do not use our Platform.
                </p>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  2. Description of Service
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Blush & Breathe is a <strong>content aggregation platform</strong> that:
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mb-6 space-y-2">
                  <li>Curates health, beauty, and wellness articles from third-party sources</li>
                  <li>Displays products from eBay and other third-party marketplaces</li>
                  <li>Provides AI-powered tools for personalized nutrition planning</li>
                  <li>Aggregates video content from YouTube</li>
                </ul>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  We do not create original content (except for AI-generated meal plans), sell products directly, 
                  or process any purchase transactions.
                </p>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  3. Third-Party Content and Products
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  <strong>Content Disclaimer:</strong> Articles and videos displayed on the Platform are sourced 
                  from third-party publications. We do not guarantee their accuracy, completeness, or reliability. 
                  Always consult healthcare professionals before making health decisions.
                </p>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  <strong>Products Disclaimer:</strong> Products shown are from eBay sellers. We are not responsible 
                  for product quality, shipping, returns, or any transactions. All purchases are subject to eBay&apos;s 
                  terms and the individual seller&apos;s policies.
                </p>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  4. AI Diet Planner
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Our AI-powered diet planner provides general nutritional guidance only. It is <strong>not a 
                  substitute for professional medical advice</strong>, diagnosis, or treatment. Always seek 
                  advice from qualified healthcare providers regarding dietary changes, especially if you have 
                  health conditions or allergies.
                </p>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  5. User Responsibilities
                </h2>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mb-6 space-y-2">
                  <li>Use the Platform lawfully and respect intellectual property rights</li>
                  <li>Do not attempt to scrape, copy, or redistribute our curated content</li>
                  <li>Provide accurate information when using interactive features</li>
                  <li>Do not misuse the Platform in any way that could damage or impair it</li>
                </ul>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  6. Intellectual Property
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  The Platform&apos;s design, features, and functionality are owned by Blush & Breathe. 
                  Third-party content remains the property of its original creators and publishers. 
                  We respect copyright and link to original sources.
                </p>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  7. Limitation of Liability
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Blush & Breathe is provided &quot;as is&quot; without warranties of any kind. We are not liable for 
                  any damages arising from your use of the Platform, reliance on content, or purchases made 
                  through third-party links. Our maximum liability is limited to the amount you paid us 
                  (which is $0, as our service is free).
                </p>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  8. Changes to Terms
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  We may update these Terms at any time. Continued use of the Platform after changes 
                  constitutes acceptance of the new Terms. We encourage you to review this page periodically.
                </p>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  9. Governing Law
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  These Terms are governed by applicable laws. Any disputes shall be resolved through 
                  appropriate legal channels.
                </p>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  10. Contact
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Questions about these Terms? <Link href="/info/contact" className="text-primary hover:underline">Contact us</Link>.
                </p>
              </div>
            </div>

            {/* Related Links */}
            <div className="mt-8 flex flex-wrap gap-4 justify-center">
              <Link href="/info/privacy" className="px-5 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-sm">
                Privacy Policy
              </Link>
              <Link href="/info/faq" className="px-5 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-sm">
                FAQ
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
