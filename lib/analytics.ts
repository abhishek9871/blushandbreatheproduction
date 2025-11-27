/**
 * Analytics Tracking Module
 * 
 * Lightweight analytics wrapper for tracking user interactions
 * with substance education content. Supports Google Analytics 4
 * and custom event tracking.
 * 
 * PRIVACY: No PII is collected. All events are anonymized.
 */

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

type EventCategory = 
  | 'substance_education'
  | 'affiliate'
  | 'safety'
  | 'navigation'
  | 'engagement';

interface AnalyticsEvent {
  category: EventCategory;
  action: string;
  label?: string;
  value?: number;
  // Additional custom dimensions
  customDimensions?: Record<string, string | number | boolean>;
}

interface PageViewData {
  pageType: 'banned' | 'supplement' | 'medicine' | 'comparison' | 'general';
  pageTitle: string;
  pagePath: string;
  substanceName?: string;
  substanceCategory?: string;
}

// ═══════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const DEBUG_MODE = process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === 'true';

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Check if analytics is available
 */
function isAnalyticsAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  // Check for gtag (Google Analytics 4)
  return typeof (window as unknown as { gtag?: unknown }).gtag === 'function';
}

/**
 * Send event to Google Analytics 4
 */
function sendToGA4(event: AnalyticsEvent): void {
  if (!isAnalyticsAvailable()) return;
  
  const gtag = (window as unknown as { gtag: (...args: unknown[]) => void }).gtag;
  
  gtag('event', event.action, {
    event_category: event.category,
    event_label: event.label,
    value: event.value,
    ...event.customDimensions,
  });
}

/**
 * Log event for debugging
 */
function debugLog(eventName: string, data: unknown): void {
  if (DEBUG_MODE || !IS_PRODUCTION) {
    console.log(`[Analytics] ${eventName}:`, data);
  }
}

// ═══════════════════════════════════════════════════════════════════
// PUBLIC API - GENERIC TRACKING
// ═══════════════════════════════════════════════════════════════════

/**
 * Track a custom event
 */
export function trackEvent(event: AnalyticsEvent): void {
  debugLog('Event', event);
  
  if (IS_PRODUCTION) {
    sendToGA4(event);
  }
}

/**
 * Track a page view
 */
export function trackPageView(data: PageViewData): void {
  debugLog('PageView', data);
  
  if (IS_PRODUCTION && isAnalyticsAvailable()) {
    const gtag = (window as unknown as { gtag: (...args: unknown[]) => void }).gtag;
    
    gtag('event', 'page_view', {
      page_title: data.pageTitle,
      page_location: window.location.href,
      page_path: data.pagePath,
      page_type: data.pageType,
      substance_name: data.substanceName,
      substance_category: data.substanceCategory,
    });
  }
}

// ═══════════════════════════════════════════════════════════════════
// PUBLIC API - SUBSTANCE EDUCATION SPECIFIC EVENTS
// ═══════════════════════════════════════════════════════════════════

/**
 * Track when user clicks on a safe swap alternative
 */
export function trackSafeSwapClick(
  fromSubstance: string,
  toSupplement: string,
  position?: number
): void {
  trackEvent({
    category: 'substance_education',
    action: 'safe_swap_click',
    label: `${fromSubstance} → ${toSupplement}`,
    value: position,
    customDimensions: {
      from_substance: fromSubstance,
      to_supplement: toSupplement,
      list_position: position ?? 0,
    },
  });
}

/**
 * Track when user clicks an affiliate product link
 */
export function trackAffiliateClick(
  productId: string,
  productName: string,
  brand: string,
  price: number,
  supplementSlug: string
): void {
  trackEvent({
    category: 'affiliate',
    action: 'affiliate_click',
    label: `${brand} - ${productName}`,
    value: Math.round(price * 100), // Value in cents
    customDimensions: {
      product_id: productId,
      product_name: productName,
      brand: brand,
      price: price,
      supplement_slug: supplementSlug,
      affiliate_network: 'mixed', // Can be expanded per product
    },
  });
}

/**
 * Track when user views a safety warning
 */
export function trackWarningViewed(
  substanceName: string,
  warningType: 'banned' | 'interaction' | 'overdose' | 'addiction' | 'general',
  severity: 'low' | 'moderate' | 'high' | 'critical'
): void {
  trackEvent({
    category: 'safety',
    action: 'warning_viewed',
    label: `${warningType}: ${substanceName}`,
    customDimensions: {
      substance_name: substanceName,
      warning_type: warningType,
      severity: severity,
    },
  });
}

/**
 * Track when user views comparison page
 */
export function trackComparisonView(
  bannedSubstance: string,
  alternative: string
): void {
  trackEvent({
    category: 'substance_education',
    action: 'comparison_view',
    label: `${bannedSubstance} vs ${alternative}`,
    customDimensions: {
      banned_substance: bannedSubstance,
      alternative: alternative,
    },
  });
}

/**
 * Track when user expands a section (e.g., side effects, dosage)
 */
export function trackSectionExpand(
  substanceName: string,
  sectionName: string
): void {
  trackEvent({
    category: 'engagement',
    action: 'section_expand',
    label: `${substanceName}: ${sectionName}`,
    customDimensions: {
      substance_name: substanceName,
      section_name: sectionName,
    },
  });
}

/**
 * Track when user uses the search feature
 */
export function trackSearch(
  query: string,
  resultsCount: number,
  searchType: 'banned' | 'supplement' | 'all'
): void {
  trackEvent({
    category: 'engagement',
    action: 'search',
    label: query,
    value: resultsCount,
    customDimensions: {
      search_query: query,
      results_count: resultsCount,
      search_type: searchType,
    },
  });
}

/**
 * Track when user completes age verification
 */
export function trackAgeVerification(
  verified: boolean,
  substanceName?: string
): void {
  trackEvent({
    category: 'safety',
    action: 'age_verification',
    label: verified ? 'verified' : 'denied',
    customDimensions: {
      verification_result: verified,
      substance_name: substanceName ?? 'general',
    },
  });
}

/**
 * Track when user shares content
 */
export function trackShare(
  platform: 'twitter' | 'facebook' | 'linkedin' | 'email' | 'copy',
  contentType: 'banned' | 'supplement' | 'comparison',
  contentName: string
): void {
  trackEvent({
    category: 'engagement',
    action: 'share',
    label: `${platform}: ${contentName}`,
    customDimensions: {
      share_platform: platform,
      content_type: contentType,
      content_name: contentName,
    },
  });
}

/**
 * Track scroll depth on long-form content
 */
export function trackScrollDepth(
  depth: 25 | 50 | 75 | 100,
  pageType: string,
  pagePath: string
): void {
  trackEvent({
    category: 'engagement',
    action: 'scroll_depth',
    label: `${depth}%: ${pagePath}`,
    value: depth,
    customDimensions: {
      scroll_depth: depth,
      page_type: pageType,
    },
  });
}

// ═══════════════════════════════════════════════════════════════════
// REACT HOOK FOR COMPONENT INTEGRATION
// ═══════════════════════════════════════════════════════════════════

import { useCallback } from 'react';

/**
 * React hook for analytics tracking
 */
export function useAnalytics() {
  const trackSafeSwap = useCallback(
    (from: string, to: string, position?: number) => 
      trackSafeSwapClick(from, to, position),
    []
  );

  const trackAffiliate = useCallback(
    (productId: string, productName: string, brand: string, price: number, slug: string) =>
      trackAffiliateClick(productId, productName, brand, price, slug),
    []
  );

  const trackWarning = useCallback(
    (name: string, type: 'banned' | 'interaction' | 'overdose' | 'addiction' | 'general', severity: 'low' | 'moderate' | 'high' | 'critical') =>
      trackWarningViewed(name, type, severity),
    []
  );

  return {
    trackEvent,
    trackPageView,
    trackSafeSwap,
    trackAffiliate,
    trackWarning,
    trackComparisonView,
    trackSectionExpand,
    trackSearch,
    trackAgeVerification,
    trackShare,
    trackScrollDepth,
  };
}

// ═══════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════

/**
 * Initialize analytics (call once in _app.tsx)
 */
export function initAnalytics(): void {
  if (typeof window === 'undefined') return;
  
  debugLog('Init', { 
    GA_MEASUREMENT_ID, 
    IS_PRODUCTION, 
    DEBUG_MODE 
  });

  // Additional initialization logic can go here
  // e.g., setting up custom dimensions, user properties, etc.
}

export default {
  trackEvent,
  trackPageView,
  trackSafeSwapClick,
  trackAffiliateClick,
  trackWarningViewed,
  trackComparisonView,
  trackSectionExpand,
  trackSearch,
  trackAgeVerification,
  trackShare,
  trackScrollDepth,
  initAnalytics,
  useAnalytics,
};
