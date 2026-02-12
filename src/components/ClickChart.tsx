'use client';

/**
 * ClickChart Component
 * Displays time-series visualization of click events
 */

import React from 'react';

interface ClickChartProps {
  data: { period: string; clicks: number }[];
  periodType: 'daily' | 'weekly';
}

export function ClickChart({ data, periodType }: ClickChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Click Trends</h3>
        <p className="text-gray-500">No click data available</p>
      </div>
    );
  }

  // Calculate max value for scaling
  const maxClicks = Math.max(...data.map(d => d.clicks));
  const chartHeight = 200;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">
        Click Trends ({periodType === 'daily' ? 'Daily' : 'Weekly'})
      </h3>

      <div className="relative" style={{ height: chartHeight }}>
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500 pr-2">
          <span>{maxClicks}</span>
          <span>{Math.floor(maxClicks / 2)}</span>
          <span>0</span>
        </div>

        {/* Chart area */}
        <div className="ml-12 h-full flex items-end justify-around gap-1">
          {data.map((item, index) => {
            const barHeight = maxClicks > 0
              ? (item.clicks / maxClicks) * chartHeight
              : 0;

            return (
              <div key={index} className="flex flex-col items-center flex-1">
                {/* Bar */}
                <div className="w-full flex justify-center">
                  <div
                    className="bg-blue-500 hover:bg-blue-600 transition-colors rounded-t w-full max-w-[40px] relative group"
                    style={{ height: `${barHeight}px` }}
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {item.clicks} clicks
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* X-axis labels */}
      <div className="ml-12 mt-2 flex justify-around">
        {data.map((item, index) => {
          // Show every nth label to avoid crowding
          const showLabel = data.length <= 7 || index % Math.ceil(data.length / 7) === 0;

          if (!showLabel) return <div key={index} className="flex-1" />;

          const date = new Date(item.period);
          const label = periodType === 'daily'
            ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

          return (
            <div key={index} className="flex-1 text-xs text-gray-600 text-center">
              {label}
            </div>
          );
        })}
      </div>

      {/* Summary stats */}
      <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-blue-600">
            {data.reduce((sum, item) => sum + item.clicks, 0)}
          </p>
          <p className="text-xs text-gray-500">Total Clicks</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-blue-600">
            {Math.round(data.reduce((sum, item) => sum + item.clicks, 0) / data.length)}
          </p>
          <p className="text-xs text-gray-500">Avg per {periodType === 'daily' ? 'Day' : 'Week'}</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-blue-600">{maxClicks}</p>
          <p className="text-xs text-gray-500">Peak</p>
        </div>
      </div>
    </div>
  );
}
