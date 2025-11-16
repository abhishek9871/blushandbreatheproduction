
import React from 'react';
import { Link } from 'react-router-dom';
import RateLimitTracker from './RateLimitTracker';

interface FooterProps {
  onSubscribeClick: () => void;
}

const Footer: React.FC<FooterProps> = ({ onSubscribeClick }) => {
  return (
    <footer className="bg-gray-50 dark:bg-black/20 border-t border-border-light dark:border-border-dark mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold mb-4">Shop</h3>
            <ul className="space-y-3 text-sm text-text-subtle-light dark:text-text-subtle-dark">
              <li><Link className="hover:text-secondary dark:hover:text-secondary transition-colors" to="/beauty">Beauty</Link></li>
              <li><Link className="hover:text-primary dark:hover:text-primary transition-colors" to="/health">Health</Link></li>
              <li><Link className="hover:text-accent dark:hover:text-accent transition-colors" to="/nutrition">Nutrition</Link></li>
               <li><Link className="hover:text-primary dark:hover:text-primary transition-colors" to="/videos">Videos</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4">About Us</h3>
            <ul className="space-y-3 text-sm text-text-subtle-light dark:text-text-subtle-dark">
              <li><Link className="hover:text-primary dark:hover:text-primary transition-colors" to="/info/about">Our Story</Link></li>
              <li><Link className="hover:text-primary dark:hover:text-primary transition-colors" to="/info/careers">Careers</Link></li>
              <li><Link className="hover:text-primary dark:hover:text-primary transition-colors" to="/info/press">Press</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4">Support</h3>
            <ul className="space-y-3 text-sm text-text-subtle-light dark:text-text-subtle-dark">
              <li><Link className="hover:text-primary dark:hover:text-primary transition-colors" to="/info/contact">Contact Us</Link></li>
              <li><Link className="hover:text-primary dark:hover:text-primary transition-colors" to="/info/faq">FAQ</Link></li>
              <li><Link className="hover:text-primary dark:hover:text-primary transition-colors" to="/info/shipping">Shipping</Link></li>
              <li><Link className="hover:text-primary dark:hover:text-primary transition-colors" to="/info/returns">Returns</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4">Join Our Newsletter</h3>
            <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark mb-4">Get the latest on new arrivals, promotions, and more.</p>
            <div className="flex">
              <input aria-label="Your email" readOnly className="flex-grow rounded-l-md border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark/50 focus:ring-primary focus:border-primary text-sm h-11" placeholder="Your email"/>
              <button onClick={onSubscribeClick} className="bg-primary text-white px-4 rounded-r-md font-semibold text-sm h-11 hover:bg-opacity-80 transition-colors" type="button">Subscribe</button>
            </div>
          </div>
        </div>
        <RateLimitTracker />
        <div className="mt-8 border-t border-border-light dark:border-border-dark pt-8 flex flex-col sm:flex-row justify-between items-center text-sm text-text-subtle-light dark:text-text-subtle-dark">
          <p>© 2026 HealthBeauty Hub. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <Link className="hover:text-primary dark:hover:text-primary transition-colors" to="/info/terms">Terms of Service</Link>
            <Link className="hover:text-primary dark:hover:text-primary transition-colors" to="/info/privacy">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
