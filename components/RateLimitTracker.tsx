import React, { useState, useEffect } from 'react';
import { getRateLimitStatus, apiStatusEvent } from '../services/apiService';

// Fix: Define a type for the status object to ensure type safety.
type RateLimitStatus = ReturnType<typeof getRateLimitStatus>;

const RateLimitTracker: React.FC = () => {
    // Fix: Explicitly type the state hook.
    const [status, setStatus] = useState<RateLimitStatus>(getRateLimitStatus());

    useEffect(() => {
        const handleUpdate = (event: Event) => {
            // Fix: Type the CustomEvent to ensure detail property is correctly typed.
            const customEvent = event as CustomEvent<RateLimitStatus>;
            setStatus(customEvent.detail);
        };

        apiStatusEvent.addEventListener('update', handleUpdate);
        return () => {
            apiStatusEvent.removeEventListener('update', handleUpdate);
        };
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
            <h4 className="text-xs font-bold uppercase text-text-subtle-light dark:text-text-subtle-dark mb-2">API Usage (24h Simulated)</h4>
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
