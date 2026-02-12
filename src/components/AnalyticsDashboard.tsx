'use client';

/**
 * AnalyticsDashboard Component
 * Main analytics dashboard that integrates all visualization components
 */

import React, { useState } from 'react';
import { ClickChart } from './ClickChart';
import { DeviceBreakdown } from './DeviceBreakdown';
import { ReferrerBreakdown } from './ReferrerBreakdown';
import { BrowserBreakdown } from './BrowserBreakdown';
import { OSBreakdown } from './OSBreakdown';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface AnalyticsData {
  shortUrl: {
    slug: string;
    originalUrl: string;
    createdAt: string;
  };
  summary: {
    totalClicks: number;
    period: string;
    dateRange: { startDate: string; endDate: string } | null;
  };
  timeSeries: { period: string; clicks: number }[];
  deviceBreakdown: Record<string, number>;
  referrerBreakdown: Record<string, number>;
  browserBreakdown: Record<string, number>;
  osBreakdown: Record<string, number>;
}

interface AnalyticsDashboardProps {
  data: AnalyticsData;
  token: string;
}

export function AnalyticsDashboard({ data, token }: AnalyticsDashboardProps) {
  const [period, setPeriod] = useState<'daily' | 'weekly'>(
    data.summary.period as 'daily' | 'weekly'
  );

  const handlePeriodChange = (newPeriod: 'daily' | 'weekly') => {
    setPeriod(newPeriod);
    // Reload data with new period
    window.location.href = `/analytics/${token}?period=${newPeriod}`;
  };

  // Format created date in user's timezone
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Analytics Dashboard
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm text-gray-500">Short URL</p>
              <p className="font-mono text-lg font-semibold text-blue-600">
                /{data.shortUrl.slug}
              </p>
              <p className="text-sm text-gray-600 break-all mt-1">
                {data.shortUrl.originalUrl}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Created {formatDate(data.shortUrl.createdAt)}
              </p>
            </div>

            {/* Period selector */}
            <div className="flex gap-2">
              <Button
                onClick={() => handlePeriodChange('daily')}
                variant={period === 'daily' ? 'primary' : 'outline'}
                size="sm"
              >
                Daily
              </Button>
              <Button
                onClick={() => handlePeriodChange('weekly')}
                variant={period === 'weekly' ? 'primary' : 'outline'}
                size="sm"
              >
                Weekly
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <Card>
            <div className="text-center py-4">
              <p className="text-4xl font-bold text-blue-600">
                {data.summary.totalClicks}
              </p>
              <p className="text-sm text-gray-500 mt-2">Total Clicks</p>
            </div>
          </Card>

          <Card>
            <div className="text-center py-4">
              <p className="text-4xl font-bold text-green-600">
                {Object.keys(data.referrerBreakdown).length}
              </p>
              <p className="text-sm text-gray-500 mt-2">Traffic Sources</p>
            </div>
          </Card>

          <Card>
            <div className="text-center py-4">
              <p className="text-4xl font-bold text-purple-600">
                {Object.keys(data.deviceBreakdown).length}
              </p>
              <p className="text-sm text-gray-500 mt-2">Device Types</p>
            </div>
          </Card>
        </div>

        {/* Main Chart */}
        <div className="mb-8">
          <ClickChart data={data.timeSeries} periodType={period} />
        </div>

        {/* Breakdown Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <DeviceBreakdown data={data.deviceBreakdown} />
          <ReferrerBreakdown data={data.referrerBreakdown} />
        </div>

        {/* Browser and OS Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <BrowserBreakdown data={data.browserBreakdown} />
          <OSBreakdown data={data.osBreakdown} />
        </div>

        {/* Footer with token info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Analytics Token: <code className="bg-gray-100 px-2 py-1 rounded font-mono text-xs">{token}</code>
          </p>
          <p className="mt-1">
            Keep this token private to protect your analytics data
          </p>
        </div>
      </div>
    </div>
  );
}
