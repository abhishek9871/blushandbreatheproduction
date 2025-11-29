import Head from 'next/head';
import Link from 'next/link';
import { useEffect } from 'react';

export default function PrivacyPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <>
      <Head>
        <title>Privacy Policy | Blush & Breathe</title>
        <meta name="description" content="Read the Privacy Policy for Blush & Breathe. Learn how we collect, use, and protect your information on our health and beauty content platform." />
        <meta name="keywords" content="privacy policy, data protection, user privacy, personal information, blush and breathe privacy" />
        <meta property="og:title" content="Privacy Policy | Blush & Breathe" />
        <meta property="og:description" content="Privacy Policy for Blush & Breathe health and beauty content platform." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://www.blushandbreath.com/info/privacy" />
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
              Privacy Policy
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
                
                {/* Highlight Box */}
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 mb-8">
                  <div className="flex gap-3">
                    <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-2xl flex-shrink-0">
                      shield
                    </span>
                    <div>
                      <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2 mt-0">
                        Your Privacy Matters
                      </h3>
                      <p className="text-green-800 dark:text-green-200 text-sm mb-0">
                        Blush & Breathe collects minimal data. We don&apos;t sell your information, 
                        don&apos;t require accounts, and store most preferences locally on your device.
                      </p>
                    </div>
                  </div>
                </div>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-0 mb-4">
                  1. Information We Collect
                </h2>
                
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Information You Provide
                </h3>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mb-4 space-y-2">
                  <li><strong>Newsletter:</strong> Email address if you subscribe to our newsletter</li>
                  <li><strong>Contact Form:</strong> Name, email, and message content when you contact us</li>
                  <li><strong>Diet Planner:</strong> Health profile data (stored locally in your browser, not on our servers)</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Information Collected Automatically
                </h3>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mb-6 space-y-2">
                  <li><strong>Usage Data:</strong> Pages visited, time spent, features used (anonymized analytics)</li>
                  <li><strong>Device Information:</strong> Browser type, device type, screen size</li>
                  <li><strong>Cookies:</strong> Preferences like dark mode setting (stored locally)</li>
                </ul>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  2. How We Use Your Information
                </h2>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mb-6 space-y-2">
                  <li>Send newsletters to subscribed users</li>
                  <li>Respond to contact form inquiries</li>
                  <li>Improve the Platform based on usage patterns</li>
                  <li>Provide personalized features (locally stored)</li>
                  <li>Ensure platform security and prevent abuse</li>
                </ul>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  3. Information We Do NOT Collect
                </h2>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mb-6 space-y-2">
                  <li>Payment information (we don&apos;t sell products)</li>
                  <li>Precise location data</li>
                  <li>Social media profiles</li>
                  <li>Passwords (no account system)</li>
                </ul>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  4. Local Storage
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Much of your data is stored locally in your browser using localStorage:
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mb-6 space-y-2">
                  <li><strong>Bookmarks:</strong> Saved articles stay on your device</li>
                  <li><strong>Theme Preference:</strong> Dark/light mode setting</li>
                  <li><strong>Diet Profile:</strong> Your nutrition preferences and generated meal plans</li>
                </ul>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  This data never leaves your device. You can clear it anytime through your browser settings.
                </p>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  5. Third-Party Services
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  We use the following third-party services:
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mb-6 space-y-2">
                  <li><strong>Vercel:</strong> Hosting and analytics (privacy-focused)</li>
                  <li><strong>Google Gemini AI:</strong> Powers our diet planner (data sent is processed per Google&apos;s privacy policy)</li>
                  <li><strong>YouTube:</strong> Video content (subject to YouTube&apos;s privacy policy)</li>
                  <li><strong>eBay:</strong> Product listings (clicking products takes you to eBay, subject to their privacy policy)</li>
                </ul>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  6. Data Sharing
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  <strong>We do not sell, rent, or share your personal information</strong> with third parties 
                  for marketing purposes. We may share data only:
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mb-6 space-y-2">
                  <li>With service providers who help operate the Platform</li>
                  <li>If required by law or legal process</li>
                  <li>To protect our rights or safety</li>
                </ul>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  7. Cookies
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  We use minimal cookies for essential functionality (like remembering your theme preference). 
                  We do not use tracking cookies for advertising. Third-party embeds (like YouTube videos) 
                  may set their own cookies per their policies.
                </p>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  8. Your Rights
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  You have the right to:
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mb-6 space-y-2">
                  <li>Access the personal data we hold about you</li>
                  <li>Request deletion of your data</li>
                  <li>Unsubscribe from newsletters</li>
                  <li>Clear local storage data via your browser</li>
                </ul>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  9. Children&apos;s Privacy
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  The Platform is not intended for children under 13. We do not knowingly collect 
                  information from children. If you believe a child has provided us with personal 
                  information, please contact us.
                </p>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  10. Changes to This Policy
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  We may update this Privacy Policy periodically. Changes will be posted on this page 
                  with an updated &quot;Last updated&quot; date. Continued use of the Platform constitutes 
                  acceptance of the updated policy.
                </p>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  11. Contact Us
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Questions about this Privacy Policy? <Link href="/info/contact" className="text-primary hover:underline">Contact us</Link>.
                </p>
              </div>
            </div>

            {/* Related Links */}
            <div className="mt-8 flex flex-wrap gap-4 justify-center">
              <Link href="/info/terms" className="px-5 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-sm">
                Terms of Service
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
