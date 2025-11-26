import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'general',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('sent');
        setFormData({ name: '', email: '', subject: 'general', message: '' });
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Failed to send message. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('Failed to send message. Please try again.');
    }
  };

  return (
    <>
      <Head>
        <title>Contact Us | Blush & Breathe Support</title>
        <meta name="description" content="Get in touch with Blush & Breathe. Contact us for general inquiries, feedback, or partnership opportunities. We're here to help!" />
        <meta name="keywords" content="contact us, support, help, feedback, blush and breathe contact, customer service" />
        <meta property="og:title" content="Contact Us | Blush & Breathe" />
        <meta property="og:description" content="Get in touch with the Blush & Breathe team. We're here to help!" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://blushandbreathproduction.vercel.app/info/contact" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-transparent dark:from-primary/10">
        {/* Hero Section */}
        <section className="relative py-16 sm:py-24 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
              Contact Us
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              We&apos;d Love to Hear From You
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Have a question, feedback, or just want to say hello? We&apos;re here to help.
            </p>
          </div>
        </section>

        {/* Important Notice */}
        <section className="px-4 pb-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
              <div className="flex gap-4">
                <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-2xl flex-shrink-0">
                  info
                </span>
                <div>
                  <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
                    Important: About Product Orders
                  </h3>
                  <p className="text-amber-700 dark:text-amber-300 text-sm">
                    Blush & Breathe is a <strong>content aggregation platform</strong>. We do not sell products directly. 
                    Products shown on our site are from eBay and other third-party sellers. For order issues, shipping 
                    inquiries, or returns, please contact the seller directly through their platform. 
                    See our <Link href="/info/shipping" className="underline font-medium">Shipping</Link> and{' '}
                    <Link href="/info/returns" className="underline font-medium">Returns</Link> pages for more details.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Form & Info */}
        <section className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
              {/* Contact Form */}
              <div className="lg:col-span-3">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                    Send Us a Message
                  </h2>
                  
                  {status === 'sent' ? (
                    <div className="text-center py-12">
                      <span className="material-symbols-outlined text-6xl text-green-500 mb-4 block">
                        check_circle
                      </span>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Message Sent!
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Thank you for reaching out. We&apos;ll get back to you soon.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Your Name
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="John Doe"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Email Address
                          </label>
                          <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="john@example.com"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Subject
                        </label>
                        <select
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                          <option value="general">General Inquiry</option>
                          <option value="feedback">Feedback & Suggestions</option>
                          <option value="partnership">Partnership Opportunity</option>
                          <option value="press">Press & Media</option>
                          <option value="technical">Technical Issue</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Message
                        </label>
                        <textarea
                          required
                          rows={5}
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                          placeholder="How can we help you?"
                        />
                      </div>
                      
                      {/* Error Message */}
                      {status === 'error' && errorMessage && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                          <p className="text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">error</span>
                            {errorMessage}
                          </p>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={status === 'sending'}
                        className="w-full sm:w-auto px-8 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {status === 'sending' ? (
                          <>
                            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            Sending...
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined">send</span>
                            Send Message
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* Contact Info */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                    Quick Links
                  </h3>
                  <div className="space-y-4">
                    <Link href="/info/faq" className="flex items-center gap-3 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-primary">help</span>
                      <span>Check our FAQ first</span>
                    </Link>
                    <Link href="/info/shipping" className="flex items-center gap-3 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-primary">local_shipping</span>
                      <span>Shipping Information</span>
                    </Link>
                    <Link href="/info/returns" className="flex items-center gap-3 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-primary">assignment_return</span>
                      <span>Returns Policy</span>
                    </Link>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                    Response Time
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    We typically respond within <strong className="text-gray-900 dark:text-white">24-48 hours</strong> during business days. 
                    For urgent matters, please mention it in your subject line.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Follow Us
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    Stay connected for the latest updates and wellness tips.
                  </p>
                  <div className="flex gap-3">
                    {['Twitter', 'Instagram', 'Facebook'].map((social) => (
                      <button 
                        key={social}
                        className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-primary hover:scale-110 transition-all shadow-sm"
                        aria-label={social}
                      >
                        <span className="material-symbols-outlined text-xl">
                          {social === 'Twitter' ? 'alternate_email' : social === 'Instagram' ? 'photo_camera' : 'group'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
