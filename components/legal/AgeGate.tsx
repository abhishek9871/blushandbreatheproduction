/**
 * AgeGate Component
 * 
 * Age verification modal for restricted content (e.g., Kratom, certain supplements).
 * Stores verification in localStorage for 24 hours.
 */

'use client';

import React, { useState, useEffect } from 'react';

interface AgeGateProps {
  minAge?: number;
  substanceName?: string;
  onVerified?: () => void;
  onDenied?: () => void;
  className?: string;
}

const STORAGE_KEY = 'age_verified';
const VERIFICATION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export function AgeGate({
  minAge = 18,
  substanceName,
  onVerified,
  onDenied,
  className = '',
}: AgeGateProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if already verified
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const { timestamp, verified } = JSON.parse(stored);
      if (verified && Date.now() - timestamp < VERIFICATION_DURATION) {
        setIsVerified(true);
        onVerified?.();
        return;
      }
    }
    // Show gate if not verified
    setIsVisible(true);
  }, [onVerified]);

  const handleVerify = (isOfAge: boolean) => {
    if (isOfAge) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ timestamp: Date.now(), verified: true })
      );
      setIsVerified(true);
      setIsVisible(false);
      onVerified?.();
    } else {
      setIsVerified(false);
      onDenied?.();
    }
  };

  // Already verified - don't show anything
  if (isVerified === true) {
    return null;
  }

  // Denied access
  if (isVerified === false) {
    return (
      <div className="fixed inset-0 bg-gray-950 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-sm sm:max-w-md w-full p-5 sm:p-6 text-center mx-4">
          <span className="material-symbols-outlined text-5xl md:text-6xl text-red-500 mb-3 md:mb-4">
            block
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
            You must be {minAge} years or older to view this content.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 min-h-[48px] bg-primary text-white rounded-lg hover:opacity-90 transition-opacity text-base"
          >
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  // Not yet verified - show gate
  if (!isVisible) {
    return null;
  }

  return (
    <div className={`fixed inset-0 bg-gray-950/90 z-50 flex items-center justify-center p-4 ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-sm sm:max-w-md w-full p-5 sm:p-6 md:p-8 mx-4">
        {/* Header */}
        <div className="text-center mb-6">
          <span className="material-symbols-outlined text-4xl md:text-5xl text-amber-500 mb-2 md:mb-3">
            warning
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Age Verification Required
          </h2>
          {substanceName ? (
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Content about <strong>{substanceName}</strong> is restricted to adults only.
            </p>
          ) : (
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              This content contains information that may be restricted in some jurisdictions.
            </p>
          )}
        </div>

        {/* Warning box */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
          <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300">
            <strong>Important:</strong> The information on this page is for educational purposes only. 
            We do not encourage, promote, or condone the use of any illegal substances.
          </p>
        </div>

        {/* Question */}
        <div className="text-center mb-4 sm:mb-6">
          <p className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
            Are you {minAge} years of age or older?
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => handleVerify(false)}
            className="flex-1 px-4 sm:px-6 py-3 min-h-[48px] bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm sm:text-base"
          >
            No, I&apos;m Under {minAge}
          </button>
          <button
            onClick={() => handleVerify(true)}
            className="flex-1 px-4 sm:px-6 py-3 min-h-[48px] bg-primary text-white rounded-lg font-medium hover:opacity-90 transition-opacity text-sm sm:text-base"
          >
            Yes, I&apos;m {minAge}+
          </button>
        </div>

        {/* Legal notice */}
        <p className="text-xs text-gray-500 dark:text-gray-500 text-center mt-4">
          By clicking &quot;Yes&quot;, you confirm that you are of legal age and accept our{' '}
          <a href="/info/terms" className="text-primary hover:underline">Terms of Service</a>.
        </p>
      </div>
    </div>
  );
}

/**
 * Hook to check age verification status
 */
export function useAgeVerification(): { isVerified: boolean; reset: () => void } {
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const { timestamp, verified } = JSON.parse(stored);
      if (verified && Date.now() - timestamp < VERIFICATION_DURATION) {
        setIsVerified(true);
      }
    }
  }, []);

  const reset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setIsVerified(false);
  };

  return { isVerified, reset };
}

export default AgeGate;
