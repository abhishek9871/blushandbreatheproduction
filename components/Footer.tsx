'use client';

import React, { useState } from 'react';
import Link from 'next/link';

const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${apiUrl}/api/newsletter/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('Thanks for subscribing!');
        setEmail('');
        setTimeout(() => {
          setStatus('idle');
          setMessage('');
        }, 5000);
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to subscribe. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Failed to subscribe. Please try again.');
    }
  };

  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold mb-4 text-gray-900 dark:text-gray-100">Shop</h3>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li><Link className="hover:text-secondary dark:hover:text-secondary transition-colors" href="/beauty">Beauty</Link></li>
              <li><Link className="hover:text-primary dark:hover:text-primary transition-colors" href="/health">Health</Link></li>
              <li><Link className="hover:text-accent dark:hover:text-accent transition-colors" href="/nutrition">Nutrition</Link></li>
              <li><Link className="hover:text-primary dark:hover:text-primary transition-colors" href="/videos">Videos</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4 text-gray-900 dark:text-gray-100">About Us</h3>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li><Link className="hover:text-primary dark:hover:text-primary transition-colors" href="/info/about">Our Story</Link></li>
              <li><Link className="hover:text-primary dark:hover:text-primary transition-colors" href="/info/careers">Careers</Link></li>
              <li><Link className="hover:text-primary dark:hover:text-primary transition-colors" href="/info/press">Press</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4 text-gray-900 dark:text-gray-100">Support</h3>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li><Link className="hover:text-primary dark:hover:text-primary transition-colors" href="/info/contact">Contact Us</Link></li>
              <li><Link className="hover:text-primary dark:hover:text-primary transition-colors" href="/info/faq">FAQ</Link></li>
              <li><Link className="hover:text-primary dark:hover:text-primary transition-colors" href="/info/shipping">Shipping</Link></li>
              <li><Link className="hover:text-primary dark:hover:text-primary transition-colors" href="/info/returns">Returns</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4 text-gray-900 dark:text-gray-100">Join Our Newsletter</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Get the latest on new arrivals, promotions, and more.</p>
            <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
              <div className="flex">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-label="Your email"
                  className="flex-grow rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-primary focus:border-primary text-sm h-11 px-3"
                  placeholder="Your email"
                  disabled={status === 'loading'}
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="bg-primary text-white px-4 rounded-r-md font-semibold text-sm h-11 hover:bg-opacity-80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
                </button>
              </div>
              {message && (
                <p className={`text-xs ${status === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {message}
                </p>
              )}
            </form>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-8 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600 dark:text-gray-400">
          <p>© 2025 Blush & Breathe. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <Link className="hover:text-primary dark:hover:text-primary transition-colors" href="/info/terms">Terms of Service</Link>
            <Link className="hover:text-primary dark:hover:text-primary transition-colors" href="/info/privacy">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
