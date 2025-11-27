/**
 * AffiliateDisclosure Component
 * 
 * FTC-required affiliate disclosure for pages with affiliate links.
 * MUST be visible near every affiliate link per FTC guidelines.
 */

import React from 'react';

interface AffiliateDisclosureProps {
  variant?: 'inline' | 'banner' | 'tooltip' | 'compact' | 'sticky';
  className?: string;
}

// FTC-compliant disclosure texts
const AFFILIATE_DISCLOSURE_SHORT = 
  "Transparency: We may earn a commission if you click links on this page. " +
  "This helps support our harm-reduction mission.";

const AFFILIATE_DISCLOSURE_FULL =
  "Affiliate Disclosure: Some of the links on this page are affiliate links, " +
  "meaning we may earn a commission at no additional cost to you if you make a purchase. " +
  "We only recommend products we believe in and have researched thoroughly. " +
  "This commission helps support our free educational content and harm-reduction mission.";

const AFFILIATE_DISCLOSURE_MINIMAL =
  "As an affiliate, we earn from qualifying purchases.";

export function AffiliateDisclosure({ variant = 'banner', className = '' }: AffiliateDisclosureProps) {
  // Compact version - appears near individual product links
  if (variant === 'compact') {
    return (
      <span className={`text-xs text-blue-600 dark:text-blue-400 ${className}`}>
        <span className="material-symbols-outlined text-xs align-middle mr-0.5">info</span>
        Affiliate link
      </span>
    );
  }

  // Tooltip version - for inline with links
  if (variant === 'tooltip') {
    return (
      <span 
        className={`inline-flex items-center cursor-help group relative ${className}`}
        title={AFFILIATE_DISCLOSURE_SHORT}
      >
        <span className="material-symbols-outlined text-sm text-blue-500 dark:text-blue-400">
          paid
        </span>
        <span className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg w-64 z-50">
          {AFFILIATE_DISCLOSURE_SHORT}
          <span className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </span>
      </span>
    );
  }

  // Inline version - within content
  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2 ${className}`}>
        <span className="material-symbols-outlined text-lg">payments</span>
        <span>{AFFILIATE_DISCLOSURE_SHORT}</span>
      </div>
    );
  }

  // Sticky version - fixed position notice
  if (variant === 'sticky') {
    return (
      <div className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-blue-200 dark:border-blue-800 p-3 z-40 ${className}`}>
        <div className="flex items-start gap-2">
          <span className="material-symbols-outlined text-blue-500 dark:text-blue-400 flex-shrink-0">
            payments
          </span>
          <div>
            <p className="text-xs text-gray-700 dark:text-gray-300">
              {AFFILIATE_DISCLOSURE_SHORT}
            </p>
            <button 
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1"
              onClick={(e) => {
                const target = e.currentTarget.parentElement?.parentElement?.parentElement;
                if (target) target.style.display = 'none';
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Banner version - full prominent display
  return (
    <div className={`bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 flex-shrink-0">
          payments
        </span>
        <div>
          <h4 className="font-semibold text-blue-800 dark:text-blue-300 text-sm mb-1">
            Affiliate Disclosure
          </h4>
          <p className="text-blue-700 dark:text-blue-400 text-sm">
            {AFFILIATE_DISCLOSURE_FULL}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Wrapper component for affiliate links with built-in disclosure
 */
interface AffiliateLinkProps {
  href: string;
  children: React.ReactNode;
  showDisclosure?: boolean;
  className?: string;
}

export function AffiliateLink({ 
  href, 
  children, 
  showDisclosure = true,
  className = '' 
}: AffiliateLinkProps) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <a 
        href={href}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="hover:opacity-80 transition-opacity"
      >
        {children}
      </a>
      {showDisclosure && <AffiliateDisclosure variant="tooltip" />}
    </span>
  );
}

export default AffiliateDisclosure;
