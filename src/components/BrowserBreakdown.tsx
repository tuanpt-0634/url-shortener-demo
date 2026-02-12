'use client';

/**
 * BrowserBreakdown Component
 * Displays browser distribution with visual breakdown
 */

import React from 'react';

interface BrowserBreakdownProps {
  data: Record<string, number>;
}

const BROWSER_COLORS: Record<string, string> = {
  Chrome: 'bg-yellow-500',
  Safari: 'bg-blue-500',
  Firefox: 'bg-orange-500',
  Edge: 'bg-cyan-500',
  Opera: 'bg-red-500',
  Brave: 'bg-orange-600',
  'Samsung Internet': 'bg-purple-500',
  'Internet Explorer': 'bg-blue-700',
  Other: 'bg-gray-400',
  Unknown: 'bg-gray-300',
};

const BROWSER_ICONS: Record<string, string> = {
  Chrome: '🌐',
  Safari: '🧭',
  Firefox: '🦊',
  Edge: '🌊',
  Opera: '🎭',
  Brave: '🦁',
  'Samsung Internet': '📱',
  'Internet Explorer': '💤',
  Other: '🌍',
  Unknown: '❓',
};

export function BrowserBreakdown({ data }: BrowserBreakdownProps) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Browser Breakdown</h3>
        <p className="text-gray-500">No browser data available</p>
      </div>
    );
  }

  const totalClicks = Object.values(data).reduce((sum, count) => sum + count, 0);
  const browsers = Object.entries(data).sort((a, b) => b[1] - a[1]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Browser Breakdown</h3>

      {/* Progress bar visualization */}
      <div className="mb-6">
        <div className="flex h-8 rounded-lg overflow-hidden">
          {browsers.map(([browser, count]) => {
            const percentage = (count / totalClicks) * 100;
            const color = BROWSER_COLORS[browser] || BROWSER_COLORS.Unknown;

            return (
              <div
                key={browser}
                className={`${color} relative group`}
                style={{ width: `${percentage}%` }}
              >
                {percentage > 10 && (
                  <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium">
                    {Math.round(percentage)}%
                  </span>
                )}
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                  {browser}: {count} clicks ({Math.round(percentage)}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Browser list */}
      <div className="space-y-3">
        {browsers.map(([browser, count]) => {
          const percentage = (count / totalClicks) * 100;
          const color = BROWSER_COLORS[browser] || BROWSER_COLORS.Unknown;
          const icon = BROWSER_ICONS[browser] || BROWSER_ICONS.Unknown;

          return (
            <div key={browser} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{icon}</span>
                <div>
                  <p className="font-medium">{browser}</p>
                  <p className="text-sm text-gray-500">
                    {count} clicks • {percentage.toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className={`w-16 h-2 ${color} rounded-full`} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
