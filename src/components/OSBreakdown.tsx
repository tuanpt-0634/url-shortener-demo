'use client';

/**
 * OSBreakdown Component
 * Displays operating system distribution with visual breakdown
 */

import React from 'react';

interface OSBreakdownProps {
  data: Record<string, number>;
}

const OS_COLORS: Record<string, string> = {
  Windows: 'bg-blue-500',
  macOS: 'bg-gray-700',
  Linux: 'bg-yellow-600',
  Android: 'bg-green-500',
  iOS: 'bg-gray-400',
  'Chrome OS': 'bg-red-500',
  Ubuntu: 'bg-orange-600',
  Other: 'bg-gray-400',
  Unknown: 'bg-gray-300',
};

const OS_ICONS: Record<string, string> = {
  Windows: '🪟',
  macOS: '🍎',
  Linux: '🐧',
  Android: '🤖',
  iOS: '📱',
  'Chrome OS': '🌐',
  Ubuntu: '🔶',
  Fedora: '🎩',
  Unix: '⚙️',
  Other: '💻',
  Unknown: '❓',
};

export function OSBreakdown({ data }: OSBreakdownProps) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Operating System Breakdown</h3>
        <p className="text-gray-500">No OS data available</p>
      </div>
    );
  }

  const totalClicks = Object.values(data).reduce((sum, count) => sum + count, 0);
  const osList = Object.entries(data).sort((a, b) => b[1] - a[1]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Operating System Breakdown</h3>

      {/* Progress bar visualization */}
      <div className="mb-6">
        <div className="flex h-8 rounded-lg overflow-hidden">
          {osList.map(([os, count]) => {
            const percentage = (count / totalClicks) * 100;
            const color = OS_COLORS[os] || OS_COLORS.Unknown;

            return (
              <div
                key={os}
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
                  {os}: {count} clicks ({Math.round(percentage)}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* OS list */}
      <div className="space-y-3">
        {osList.map(([os, count]) => {
          const percentage = (count / totalClicks) * 100;
          const color = OS_COLORS[os] || OS_COLORS.Unknown;
          const icon = OS_ICONS[os] || OS_ICONS.Unknown;

          return (
            <div key={os} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{icon}</span>
                <div>
                  <p className="font-medium">{os}</p>
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
