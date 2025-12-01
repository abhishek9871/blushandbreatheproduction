/**
 * TestimonialCard Component
 * 
 * Displays user testimonials from Reddit, Quora, and other platforms.
 * Shows verified source links for credibility.
 */

import React from 'react';
import type { UserTestimonial } from '@/types';

interface TestimonialCardProps {
  testimonial: UserTestimonial;
}

export default function TestimonialCard({ testimonial }: TestimonialCardProps) {
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'reddit': return '🔴';
      case 'quora': return '🅠';
      case 'trustpilot': return '⭐';
      case 'consumer_forum': return '⚖️';
      case 'youtube': return '▶️';
      case 'forum': return '💬';
      default: return '💭';
    }
  };

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case 'reddit': return 'Reddit';
      case 'quora': return 'Quora';
      case 'trustpilot': return 'Trustpilot';
      case 'consumer_forum': return 'Consumer Forum';
      case 'youtube': return 'YouTube';
      case 'forum': return 'Forum';
      default: return 'Online';
    }
  };

  const getOutcomeColor = (outcome?: string) => {
    switch (outcome) {
      case 'scammed': return 'text-alert-red bg-alert-red-light dark:bg-alert-red-dark/30';
      case 'switched': return 'text-success-green bg-success-green-light dark:bg-success-green-dark/30';
      case 'warning': return 'text-warning-amber bg-warning-amber-light dark:bg-warning-amber-dark/30';
      case 'success': return 'text-success-green bg-success-green-light dark:bg-success-green-dark/30';
      default: return 'text-gray-500 bg-gray-100 dark:bg-gray-800';
    }
  };

  const getOutcomeLabel = (outcome?: string) => {
    switch (outcome) {
      case 'scammed': return 'Scammed';
      case 'switched': return 'Switched to Alternative';
      case 'warning': return 'Warning';
      case 'success': return 'Success Story';
      default: return 'Experience';
    }
  };

  return (
    <div className="p-4 bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{getPlatformIcon(testimonial.platform)}</span>
          <div>
            <p className="font-medium text-text-light dark:text-text-dark">
              {testimonial.username}
            </p>
            <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark">
              {getPlatformName(testimonial.platform)} • {testimonial.date}
            </p>
          </div>
        </div>
        {testimonial.outcome && (
          <span className={`px-2 py-1 text-xs font-medium rounded ${getOutcomeColor(testimonial.outcome)}`}>
            {getOutcomeLabel(testimonial.outcome)}
          </span>
        )}
      </div>

      {/* Quote */}
      <blockquote className="text-sm text-text-subtle-light dark:text-text-subtle-dark italic border-l-2 border-primary pl-3 mb-3">
        &ldquo;{testimonial.quote}&rdquo;
      </blockquote>

      {/* Loss Amount if applicable */}
      {testimonial.lossAmount && (
        <div className="flex items-center gap-2 mb-3 p-2 bg-alert-red-light dark:bg-alert-red-dark/20 rounded">
          <span className="material-symbols-outlined text-alert-red">payments</span>
          <span className="text-sm font-medium text-alert-red">
            Lost: {testimonial.lossAmount}
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-text-subtle-light dark:text-text-subtle-dark">
        <div className="flex items-center gap-2">
          {testimonial.upvotes && (
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-base">thumb_up</span>
              {testimonial.upvotes}
            </span>
          )}
          {testimonial.verified && (
            <span className="flex items-center gap-1 text-success-green">
              <span className="material-symbols-outlined text-base">verified</span>
              Verified
            </span>
          )}
        </div>
        <a
          href={testimonial.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:text-primary"
        >
          <span className="material-symbols-outlined text-base">open_in_new</span>
          View Source
        </a>
      </div>
    </div>
  );
}
