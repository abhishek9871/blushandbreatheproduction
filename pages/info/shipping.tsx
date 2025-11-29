import Head from 'next/head';
import Link from 'next/link';
import { useEffect } from 'react';

export default function ShippingPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <>
      <Head>
        <title>Shipping Information | Blush & Breathe</title>
        <meta name="description" content="Learn about shipping for products found on Blush & Breathe. We're a content aggregator - all shipping is handled by eBay sellers directly." />
        <meta name="keywords" content="shipping information, delivery, eBay shipping, product delivery, shipping policy" />
        <meta property="og:title" content="Shipping Information | Blush & Breathe" />
        <meta property="og:description" content="Important shipping information for products found on Blush & Breathe platform." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://www.blushandbreath.com/info/shipping" />
        <meta name="robots" content="index, follow" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-transparent dark:from-blue-900/10">
        {/* Hero Section */}
        <section className="relative py-16 sm:py-24 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-block px-4 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium mb-6">
              Shipping Information
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              How Shipping Works
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Important information about product delivery and shipping for items found on our platform.
            </p>
          </div>
        </section>

        {/* Important Notice Banner */}
        <section className="px-4 pb-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-2xl p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-4xl flex-shrink-0">
                  local_shipping
                </span>
                <div>
                  <h2 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-3">
                    Blush & Breathe Does Not Ship Products
                  </h2>
                  <p className="text-blue-800 dark:text-blue-200 mb-4">
                    <strong>Blush & Breathe is a content aggregation platform</strong>, not an e-commerce store. 
                    We curate health and beauty articles, videos, and resources. The products displayed in our 
                    Health Store section are from <strong>eBay sellers and third-party marketplaces</strong>.
                  </p>
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    All shipping, delivery, and order fulfillment is handled directly by the individual sellers 
                    on those platforms.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-12 sm:py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
              How Product Shipping Works
            </h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                {
                  step: '1',
                  icon: 'search',
                  title: 'Browse Products',
                  desc: 'Find health and wellness products in our curated store section powered by eBay.'
                },
                {
                  step: '2',
                  icon: 'open_in_new',
                  title: 'Visit Seller Page',
                  desc: 'Click on a product to be redirected to the eBay seller\'s listing page.'
                },
                {
                  step: '3',
                  icon: 'local_shipping',
                  title: 'Seller Ships Direct',
                  desc: 'The eBay seller handles your order, payment, and shipping directly.'
                }
              ].map((item) => (
                <div key={item.step} className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {item.step}
                  </div>
                  <span className="material-symbols-outlined text-4xl text-blue-600 dark:text-blue-400 mt-4 mb-3 block">
                    {item.icon}
                  </span>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Shipping FAQs */}
        <section className="py-12 sm:py-16 px-4 bg-white dark:bg-gray-800/50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
              Shipping Questions
            </h2>
            <div className="space-y-6">
              {[
                {
                  q: 'How long will my order take to arrive?',
                  a: 'Delivery times vary by seller. Each eBay listing shows estimated shipping times based on the seller\'s location and shipping method. Standard shipping typically takes 5-14 business days, while express options may be available.'
                },
                {
                  q: 'Can I track my shipment?',
                  a: 'Most eBay sellers provide tracking information after shipping. You can track your order through eBay\'s website or app using the tracking number provided by the seller.'
                },
                {
                  q: 'Do you offer free shipping?',
                  a: 'We don\'t handle shipping. Many eBay sellers offer free shipping, but this varies by seller and product. Check each listing for specific shipping costs and promotions.'
                },
                {
                  q: 'What if my package is lost or damaged?',
                  a: 'Contact the eBay seller directly through eBay\'s messaging system. eBay also has buyer protection programs to help resolve shipping issues. If the seller is unresponsive, you can open a case with eBay\'s Resolution Center.'
                },
                {
                  q: 'Do sellers ship internationally?',
                  a: 'International shipping availability depends on the individual seller. Each product listing indicates shipping destinations. Look for "Ships to" information on the seller\'s page.'
                }
              ].map((faq, i) => (
                <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {faq.q}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact eBay */}
        <section className="py-12 sm:py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-2xl p-8 sm:p-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Need Help With Your Order?
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Since orders are placed directly with eBay sellers, they are your best point of contact 
                    for shipping inquiries.
                  </p>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-blue-600 text-lg">check_circle</span>
                      Contact seller through eBay messages
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-blue-600 text-lg">check_circle</span>
                      Use eBay&apos;s Resolution Center for disputes
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-blue-600 text-lg">check_circle</span>
                      Check eBay&apos;s buyer protection policies
                    </li>
                  </ul>
                </div>
                <div className="text-center">
                  <a 
                    href="https://www.ebay.com/help/home" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    <span className="material-symbols-outlined">open_in_new</span>
                    Visit eBay Help Center
                  </a>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                    Opens eBay&apos;s official help page
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Related Pages */}
        <section className="py-12 px-4 bg-white dark:bg-gray-800/50">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Related Information
            </h3>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/info/returns" className="px-5 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                Returns Policy
              </Link>
              <Link href="/info/faq" className="px-5 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                FAQ
              </Link>
              <Link href="/info/contact" className="px-5 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                Contact Us
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
