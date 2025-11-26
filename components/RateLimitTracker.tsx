'use client';

import React, { useState, useEffect } from 'react';

interface RateLimitStatus {
  [key: string]: { used: number; limit: number };
}

const RateLimitTracker: React.FC = () => {
  const [status, setStatus] = useState<RateLimitStatus>({
    newsapi: { used: 0, limit: 100 },
    youtube: { used: 0, limit: 100 },
    nutrition: { used: 0, limit: Infinity },
  });

  useEffect(() => {
    // Status could be fetched from an API endpoint if needed
  }, []);

  const getUsageColor = (used: number, limit: number) => {
    if (limit === Infinity) return 'text-green-500';
    const percentage = (used / limit) * 100;
    if (percentage > 90) return 'text-red-500';
    if (percentage > 70) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="mt-8 pt-4 border-t border-border-light dark:border-border-dark">
      <h4 className="text-xs font-bold uppercase text-text-subtle-light dark:text-text-subtle-dark mb-2">API Usage (24h)</h4>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-subtle-light dark:text-text-subtle-dark">
        {Object.entries(status).map(([key, { used, limit }]) => (
          <div key={key}>
            <span className="capitalize">{key}: </span>
            <span className={`font-semibold ${getUsageColor(used, limit)}`}>
              {used} / {limit === Infinity ? '∞' : limit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RateLimitTracker;
