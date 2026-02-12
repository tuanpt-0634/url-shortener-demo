'use client';

/**
 * ReferrerBreakdown Component
 * Displays traffic source breakdown with top referrers
 */

import React from 'react';

interface ReferrerBreakdownProps {
  data: Record<string, number>;
}

export function ReferrerBreakdown({ data }: ReferrerBreakdownProps) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Traffic Sources</h3>
        <p className="text-gray-500">No referrer data available</p>
      </div>
    );
  }

  const totalClicks = Object.values(data).reduce((sum, count) => sum + count, 0);

  // Sort by count and take top 10
  const topReferrers = Object.entries(data)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Extract domain from referrer URL
  const getDomain = (referrer: string): string => {
    if (referrer === 'direct') return 'Direct Traffic';
    try {
      const url = new URL(referrer);
      return url.hostname.replace('www.', '');
    } catch {
      return referrer;
    }
  };

  // Get icon for referrer type
  const getIcon = (referrer: string): string => {
    if (referrer === 'direct') return '🔗';
    if (referrer.includes('google')) return '🔍';
    if (referrer.includes('facebook') || referrer.includes('twitter') || referrer.includes('linkedin')) return '📱';
    return '🌐';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Traffic Sources</h3>

      <div className="space-y-3">
        {topReferrers.map(([referrer, count], index) => {
          const percentage = (count / totalClicks) * 100;
          const domain = getDomain(referrer);
          const icon = getIcon(referrer);

          return (
            <div key={referrer} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-lg">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" title={domain}>
                      {domain}
                    </p>
                    <p className="text-xs text-gray-500">
                      {count} clicks • {percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-600 ml-2">
                  #{index + 1}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300 group-hover:from-blue-600 group-hover:to-blue-700"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Show "Others" if there are more than 10 referrers */}
      {Object.keys(data).length > 10 && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-500 text-center">
            +{Object.keys(data).length - 10} more sources
          </p>
        </div>
      )}
    </div>
  );
}
