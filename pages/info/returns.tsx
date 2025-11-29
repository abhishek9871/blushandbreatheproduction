import Head from 'next/head';
import Link from 'next/link';
import { useEffect } from 'react';

export default function ReturnsPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <>
      <Head>
        <title>Returns & Refunds | Blush & Breathe</title>
        <meta name="description" content="Returns and refund information for products found on Blush & Breathe. We're a content aggregator - all returns are handled by eBay sellers directly." />
        <meta name="keywords" content="returns policy, refunds, eBay returns, product returns, refund policy" />
        <meta property="og:title" content="Returns & Refunds | Blush & Breathe" />
        <meta property="og:description" content="Important return and refund information for products found on Blush & Breathe platform." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://www.blushandbreath.com/info/returns" />
        <meta name="robots" content="index, follow" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-transparent dark:from-orange-900/10">
        {/* Hero Section */}
        <section className="relative py-16 sm:py-24 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-block px-4 py-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-sm font-medium mb-6">
              Returns & Refunds
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Returns Information
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Everything you need to know about returning products found through our platform.
            </p>
          </div>
        </section>

        {/* Important Notice Banner */}
        <section className="px-4 pb-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-800 rounded-2xl p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <span className="material-symbols-outlined text-orange-600 dark:text-orange-400 text-4xl flex-shrink-0">
                  assignment_return
                </span>
                <div>
                  <h2 className="text-xl font-bold text-orange-900 dark:text-orange-100 mb-3">
                    Blush & Breathe Does Not Process Returns
                  </h2>
                  <p className="text-orange-800 dark:text-orange-200 mb-4">
                    <strong>Blush & Breathe is a content aggregation platform</strong>. We do not sell products, 
                    process payments, or handle returns. The products shown in our Health Store section are 
                    from <strong>eBay sellers and third-party marketplaces</strong>.
                  </p>
                  <p className="text-orange-700 dark:text-orange-300 text-sm">
                    All return requests must be submitted directly to the seller through eBay.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How Returns Work */}
        <section className="py-12 sm:py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
              How to Return a Product
            </h2>
            <div className="space-y-6">
              {[
                {
                  step: 1,
                  title: 'Locate Your Order on eBay',
                  desc: 'Log in to your eBay account and go to "Purchase History" to find the order you want to return.',
                  icon: 'receipt_long'
                },
                {
                  step: 2,
                  title: 'Check Seller\'s Return Policy',
                  desc: 'Each seller has their own return policy. Review it on the original product listing or your order confirmation.',
                  icon: 'policy'
                },
                {
                  step: 3,
                  title: 'Start a Return Request',
                  desc: 'Click "Return this item" on eBay and follow the prompts. Select your reason for return.',
                  icon: 'undo'
                },
                {
                  step: 4,
                  title: 'Ship the Item Back',
                  desc: 'Once approved, the seller will provide return shipping instructions. Keep your tracking number!',
                  icon: 'local_shipping'
                },
                {
                  step: 5,
                  title: 'Receive Your Refund',
                  desc: 'After the seller receives and inspects the item, your refund will be processed through eBay.',
                  icon: 'payments'
                }
              ].map((item) => (
                <div key={item.step} className="flex gap-4 sm:gap-6 bg-white dark:bg-gray-800 rounded-xl p-5 sm:p-6 shadow-sm">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-orange-600 dark:text-orange-400 text-2xl">
                        {item.icon}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-orange-600 dark:text-orange-400">STEP {item.step}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{item.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* eBay Buyer Protection */}
        <section className="py-12 sm:py-16 px-4 bg-white dark:bg-gray-800/50">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <span className="material-symbols-outlined text-5xl text-green-600 mb-4 block">
                verified_user
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                eBay Buyer Protection
              </h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Purchases made through eBay are covered by eBay&apos;s Money Back Guarantee. 
                If an item doesn&apos;t arrive or isn&apos;t as described, you can get your money back.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-6">
              {[
                {
                  title: 'Item Not Received',
                  desc: 'If your item never arrives, you can request a refund through eBay.',
                  icon: 'inventory_2'
                },
                {
                  title: 'Item Not as Described',
                  desc: 'Receive something different from the listing? You\'re covered.',
                  icon: 'difference'
                },
                {
                  title: 'Resolution Center',
                  desc: 'eBay mediates disputes between buyers and sellers.',
                  icon: 'gavel'
                }
              ].map((item, i) => (
                <div key={i} className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 text-center">
                  <span className="material-symbols-outlined text-3xl text-green-600 dark:text-green-400 mb-3 block">
                    {item.icon}
                  </span>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Return FAQs */}
        <section className="py-12 sm:py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
              Returns FAQ
            </h2>
            <div className="space-y-4">
              {[
                {
                  q: 'How long do I have to return an item?',
                  a: 'Return windows vary by seller, typically 30-60 days. Check the seller\'s return policy on the product listing. eBay\'s Money Back Guarantee allows returns within 30 days for most items.'
                },
                {
                  q: 'Who pays for return shipping?',
                  a: 'This depends on the seller\'s policy and the reason for return. If the item was misrepresented, the seller usually covers shipping. For change-of-mind returns, you may be responsible for shipping costs.'
                },
                {
                  q: 'Can I return used items?',
                  a: 'Most sellers only accept returns of unused items in original packaging. However, if an item is defective or not as described, you can return it regardless of use. Check the seller\'s policy for specifics.'
                },
                {
                  q: 'How long until I receive my refund?',
                  a: 'Once the seller receives your return, refunds are typically processed within 2-5 business days. The time for funds to appear in your account depends on your payment method.'
                },
                {
                  q: 'The seller won\'t accept my return. What do I do?',
                  a: 'If you believe you\'re entitled to a return and the seller refuses, open a case in eBay\'s Resolution Center. eBay will review the situation and make a decision. Their Money Back Guarantee protects buyers.'
                }
              ].map((faq, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
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
        <section className="py-12 sm:py-16 px-4 bg-white dark:bg-gray-800/50">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 rounded-2xl p-8 sm:p-12 text-center">
              <span className="material-symbols-outlined text-5xl text-orange-600 mb-4 block">
                support
              </span>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Need Help With a Return?
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-lg mx-auto">
                Contact the eBay seller directly or use eBay&apos;s Resolution Center for assistance with returns and refunds.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="https://www.ebay.com/help/buying/returns-refunds/return-item-refund?id=4041" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors"
                >
                  <span className="material-symbols-outlined">open_in_new</span>
                  eBay Returns Help
                </a>
                <a 
                  href="https://resolutioncenter.ebay.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="material-symbols-outlined">gavel</span>
                  Resolution Center
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Related Pages */}
        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Related Information
            </h3>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/info/shipping" className="px-5 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-sm">
                Shipping Info
              </Link>
              <Link href="/info/faq" className="px-5 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-sm">
                FAQ
              </Link>
              <Link href="/info/contact" className="px-5 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-sm">
                Contact Us
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
