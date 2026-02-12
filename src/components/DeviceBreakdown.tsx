'use client';

/**
 * DeviceBreakdown Component
 * Displays device type distribution with visual breakdown
 */

import React from 'react';

interface DeviceBreakdownProps {
  data: Record<string, number>;
}

const DEVICE_COLORS: Record<string, string> = {
  mobile: 'bg-blue-500',
  desktop: 'bg-green-500',
  tablet: 'bg-purple-500',
  unknown: 'bg-gray-400',
};

const DEVICE_ICONS: Record<string, string> = {
  mobile: '📱',
  desktop: '🖥️',
  tablet: '📱',
  unknown: '❓',
};

export function DeviceBreakdown({ data }: DeviceBreakdownProps) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Device Breakdown</h3>
        <p className="text-gray-500">No device data available</p>
      </div>
    );
  }

  const totalClicks = Object.values(data).reduce((sum, count) => sum + count, 0);
  const devices = Object.entries(data).sort((a, b) => b[1] - a[1]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Device Breakdown</h3>

      {/* Progress bar visualization */}
      <div className="mb-6">
        <div className="flex h-8 rounded-lg overflow-hidden">
          {devices.map(([device, count]) => {
            const percentage = (count / totalClicks) * 100;
            const color = DEVICE_COLORS[device] || DEVICE_COLORS.unknown;

            return (
              <div
                key={device}
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
                  {device}: {count} clicks ({Math.round(percentage)}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Device list */}
      <div className="space-y-3">
        {devices.map(([device, count]) => {
          const percentage = (count / totalClicks) * 100;
          const color = DEVICE_COLORS[device] || DEVICE_COLORS.unknown;
          const icon = DEVICE_ICONS[device] || DEVICE_ICONS.unknown;

          return (
            <div key={device} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{icon}</span>
                <div>
                  <p className="font-medium capitalize">{device}</p>
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
