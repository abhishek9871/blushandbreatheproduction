'use client';

import React, { useState, useEffect, useRef } from 'react';

interface NewsletterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NewsletterModal: React.FC<NewsletterModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);
    
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      console.log('Subscribed with:', email);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" 
      onClick={onClose}
    >
      <div 
        ref={modalRef}
        className="bg-background-light dark:bg-background-dark w-full max-w-md rounded-xl shadow-2xl flex flex-col items-center text-center p-8 relative page-fade-in" 
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Close newsletter signup"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-primary text-4xl">mail</span>
        </div>
        <h2 className="text-2xl font-bold mb-2">Join Our Newsletter</h2>
        <p className="text-text-subtle-light dark:text-text-subtle-dark mb-6">
          Get the latest on new arrivals, promotions, and health tips.
        </p>
        <form onSubmit={handleSubmit} className="w-full flex">
          <input 
            ref={inputRef}
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email"
            aria-label="Your email"
            required
            className="flex-grow rounded-l-md border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark/50 focus:ring-primary focus:border-primary text-sm h-11"
          />
          <button 
            type="submit"
            className="bg-primary text-white px-6 rounded-r-md font-semibold text-sm h-11 hover:bg-opacity-80 transition-colors"
          >
            Subscribe
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewsletterModal;
