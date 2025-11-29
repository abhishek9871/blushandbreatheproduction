import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const faqs: FAQItem[] = [
    // General
    {
      category: 'general',
      question: 'What is Blush & Breathe?',
      answer: 'Blush & Breathe is a health and beauty content aggregation platform. We curate articles, videos, and resources from trusted sources across the web to bring you the best wellness information in one place. We do not create original content – we find and organize the best content from reputable publications.'
    },
    {
      category: 'general',
      question: 'Is Blush & Breathe free to use?',
      answer: 'Yes! Blush & Breathe is completely free to use. You can browse articles, watch videos, use our AI diet planner, and access all features without any subscription or payment required.'
    },
    {
      category: 'general',
      question: 'How do you select the content on your platform?',
      answer: 'We aggregate content from established health and beauty publications, medical journals, certified nutritionists, and trusted wellness experts. Our system automatically fetches and updates content to ensure you have access to the latest information.'
    },
    // Products & Shopping
    {
      category: 'shopping',
      question: 'Do you sell products directly?',
      answer: 'No, we do not sell products directly. Blush & Breathe is a content platform. The products you see in our Health Store section are from eBay and other third-party marketplaces. When you click on a product, you\'ll be directed to the seller\'s page to complete your purchase.'
    },
    {
      category: 'shopping',
      question: 'Who handles my order if I buy a product through your site?',
      answer: 'All purchases are handled directly by the third-party seller (typically eBay sellers). We simply display products that may interest our health and wellness audience. The seller is responsible for order processing, payment, shipping, and customer service.'
    },
    {
      category: 'shopping',
      question: 'I have an issue with my order. Can you help?',
      answer: 'Since we don\'t process orders or payments, we cannot assist with order issues directly. Please contact the seller through the platform where you made your purchase (e.g., eBay). They have customer service teams dedicated to resolving order issues.'
    },
    // Shipping
    {
      category: 'shipping',
      question: 'How long does shipping take?',
      answer: 'Shipping times vary by seller and location. Each product listing on eBay or other platforms shows estimated delivery times. Blush & Breathe does not control shipping – this is managed entirely by the individual sellers.'
    },
    {
      category: 'shipping',
      question: 'Do you ship internationally?',
      answer: 'We don\'t ship anything as we\'re a content platform. International shipping availability depends on the individual seller. Check each product listing for shipping destinations and costs.'
    },
    // Returns
    {
      category: 'returns',
      question: 'What is your return policy?',
      answer: 'Blush & Breathe does not have a return policy because we don\'t sell products. Return policies are set by individual sellers on eBay or other platforms. Always review the seller\'s return policy before making a purchase.'
    },
    {
      category: 'returns',
      question: 'How do I return a product?',
      answer: 'To return a product, contact the seller directly through the platform where you purchased it. eBay has a buyer protection program and return request system. The seller will provide instructions based on their return policy.'
    },
    // Features
    {
      category: 'features',
      question: 'How does the AI Diet Planner work?',
      answer: 'Our AI Diet Planner uses Google Gemini AI to create personalized weekly meal plans based on your health profile, dietary preferences, allergies, and fitness goals. Simply enter your information, and the AI generates a complete 7-day meal plan with recipes and nutritional information.'
    },
    {
      category: 'features',
      question: 'Is the AI-generated diet plan medically reviewed?',
      answer: 'The AI diet planner provides general nutritional guidance based on standard dietary recommendations. It is not a substitute for professional medical advice. Always consult with a healthcare provider or registered dietitian before making significant changes to your diet, especially if you have health conditions.'
    },
    {
      category: 'features',
      question: 'Can I save articles to read later?',
      answer: 'Yes! You can bookmark any article by clicking the bookmark icon. Your bookmarks are saved locally in your browser and accessible anytime from the bookmarks section.'
    },
    // Privacy
    {
      category: 'privacy',
      question: 'Do you collect my personal data?',
      answer: 'We collect minimal data necessary to provide our services. Diet planner preferences are stored locally in your browser. We don\'t sell your data to third parties. For full details, please review our Privacy Policy.'
    },
    {
      category: 'privacy',
      question: 'Do I need to create an account?',
      answer: 'No account is required to use Blush & Breathe. You can browse content, use the AI diet planner, and bookmark articles without signing up. Your preferences are stored locally on your device.'
    }
  ];

  const categories = [
    { id: 'all', label: 'All Questions', icon: 'list' },
    { id: 'general', label: 'General', icon: 'info' },
    { id: 'shopping', label: 'Shopping', icon: 'shopping_bag' },
    { id: 'shipping', label: 'Shipping', icon: 'local_shipping' },
    { id: 'returns', label: 'Returns', icon: 'assignment_return' },
    { id: 'features', label: 'Features', icon: 'star' },
    { id: 'privacy', label: 'Privacy', icon: 'lock' }
  ];

  const filteredFaqs = activeCategory === 'all' 
    ? faqs 
    : faqs.filter(faq => faq.category === activeCategory);

  return (
    <>
      <Head>
        <title>Frequently Asked Questions | Blush & Breathe Help Center</title>
        <meta name="description" content="Find answers to common questions about Blush & Breathe. Learn about our platform, shopping, shipping, returns, AI features, and privacy policies." />
        <meta name="keywords" content="FAQ, frequently asked questions, help, support, blush and breathe help, health platform FAQ" />
        <meta property="og:title" content="FAQ | Blush & Breathe Help Center" />
        <meta property="og:description" content="Find answers to your questions about Blush & Breathe health and beauty platform." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://www.blushandbreath.com/info/faq" />
        <meta name="robots" content="index, follow" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-transparent dark:from-primary/10">
        {/* Hero Section */}
        <section className="relative py-16 sm:py-24 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
              Help Center
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Frequently Asked Questions
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Find quick answers to common questions about Blush & Breathe.
            </p>
          </div>
        </section>

        {/* Category Filter */}
        <section className="px-4 pb-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setOpenIndex(0);
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                    activeCategory === cat.id
                      ? 'bg-primary text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">{cat.icon}</span>
                  <span className="hidden sm:inline">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Accordion */}
        <section className="py-8 sm:py-12 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="space-y-3">
              {filteredFaqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm"
                >
                  <button
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                    className="w-full px-6 py-5 text-left flex items-start justify-between gap-4"
                  >
                    <span className="font-medium text-gray-900 dark:text-white">
                      {faq.question}
                    </span>
                    <span className={`material-symbols-outlined text-primary transition-transform flex-shrink-0 ${
                      openIndex === index ? 'rotate-180' : ''
                    }`}>
                      expand_more
                    </span>
                  </button>
                  {openIndex === index && (
                    <div className="px-6 pb-5">
                      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Still Have Questions */}
        <section className="py-12 sm:py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-8 sm:p-12 text-center">
              <span className="material-symbols-outlined text-5xl text-primary mb-4 block">
                support_agent
              </span>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Still Have Questions?
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-lg mx-auto">
                Can&apos;t find what you&apos;re looking for? Our team is happy to help.
              </p>
              <Link 
                href="/info/contact" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">mail</span>
                Contact Support
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
