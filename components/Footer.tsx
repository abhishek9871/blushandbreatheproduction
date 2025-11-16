
import React from 'react';
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
              <li><a className="hover:text-secondary dark:hover:text-secondary transition-colors" href="#/beauty">Beauty</a></li>
              <li><a className="hover:text-primary dark:hover:text-primary transition-colors" href="#/health">Health</a></li>
              <li><a className="hover:text-accent dark:hover:text-accent transition-colors" href="#/nutrition">Nutrition</a></li>
               <li><a className="hover:text-primary dark:hover:text-primary transition-colors" href="#/videos">Videos</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4">About Us</h3>
            <ul className="space-y-3 text-sm text-text-subtle-light dark:text-text-subtle-dark">
              <li><a className="hover:text-primary dark:hover:text-primary transition-colors" href="#">Our Story</a></li>
              <li><a className="hover:text-primary dark:hover:text-primary transition-colors" href="#">Careers</a></li>
              <li><a className="hover:text-primary dark:hover:text-primary transition-colors" href="#">Press</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4">Support</h3>
            <ul className="space-y-3 text-sm text-text-subtle-light dark:text-text-subtle-dark">
              <li><a className="hover:text-primary dark:hover:text-primary transition-colors" href="#">Contact Us</a></li>
              <li><a className="hover:text-primary dark:hover:text-primary transition-colors" href="#">FAQ</a></li>
              <li><a className="hover:text-primary dark:hover:text-primary transition-colors" href="#">Shipping</a></li>
              <li><a className="hover:text-primary dark:hover:text-primary transition-colors" href="#">Returns</a></li>
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
            <a className="hover:text-primary dark:hover:text-primary transition-colors" href="#">Terms of Service</a>
            <a className="hover:text-primary dark:hover:text-primary transition-colors" href="#">Privacy Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
