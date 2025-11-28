/**
 * FAQ Accordion Component
 * 
 * Renders FAQs as an expandable accordion with semantic HTML
 * Supports FAQPage schema for rich snippets
 */

import React, { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  faqs: FAQItem[];
  className?: string;
}

export function FAQAccordion({ faqs, className = '' }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!faqs || faqs.length === 0) return null;

  return (
    <section className={`faq-accordion ${className}`} id="faqs">
      <h2 className="text-2xl font-bold text-text-light dark:text-text-dark mb-6 flex items-center gap-3">
        <span className="material-symbols-outlined text-primary">help_outline</span>
        Frequently Asked Questions
      </h2>
      
      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="border border-border-light dark:border-border-dark rounded-lg overflow-hidden bg-white dark:bg-card-dark"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              aria-expanded={openIndex === index}
            >
              <span className="font-semibold text-text-light dark:text-text-dark pr-4">
                {faq.question}
              </span>
              <span 
                className={`material-symbols-outlined text-primary transition-transform duration-200 flex-shrink-0 ${
                  openIndex === index ? 'rotate-180' : ''
                }`}
              >
                expand_more
              </span>
            </button>
            
            <div
              className={`overflow-hidden transition-all duration-200 ${
                openIndex === index ? 'max-h-96' : 'max-h-0'
              }`}
            >
              <div className="px-5 pb-4 text-text-subtle-light dark:text-text-subtle-dark leading-relaxed border-t border-border-light dark:border-border-dark pt-4">
                {faq.answer}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default FAQAccordion;
