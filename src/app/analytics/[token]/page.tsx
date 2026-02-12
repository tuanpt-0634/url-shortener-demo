/**
 * Analytics Dashboard Page
 * Displays analytics for a short URL using the analytics token
 * Route: /analytics/[token]
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { Alert } from '@/components/ui/Alert';
import { getDb } from '@/lib/db/client';
import { AnalyticsService } from '@/lib/services/analytics';

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

interface PageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ period?: string; startDate?: string; endDate?: string }>;
}

// Loading component
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-lg mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[1, 2].map((i) => (
              <div key={i} className="h-80 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Fetch analytics data directly from database (server-side)
async function getAnalyticsData(
  token: string,
  period: string = 'daily',
  startDate?: string,
  endDate?: string
): Promise<AnalyticsData | null> {
  try {
    const db = await getDb();

    // Fetch basic analytics data by token
    const analyticsData = await AnalyticsService.getAnalyticsByToken(token, db);

    if (!analyticsData) {
      return null;
    }

    const { shortUrl, clicks } = analyticsData;

    // Filter clicks by date range if provided
    let filteredClicks = clicks;
    if (startDate && endDate) {
      const clicksInRange = await AnalyticsService.getClicksByDateRange(
        shortUrl.id,
        startDate,
        endDate,
        db
      );
      filteredClicks = clicksInRange;
    }

    // Get aggregated data
    const deviceBreakdown = await AnalyticsService.getDeviceBreakdown(shortUrl.id, db);
    const referrerBreakdown = await AnalyticsService.getReferrerBreakdown(shortUrl.id, db);
    const browserBreakdown = await AnalyticsService.getBrowserBreakdown(shortUrl.id, db);
    const osBreakdown = await AnalyticsService.getOSBreakdown(shortUrl.id, db);
    const clicksByPeriod = await AnalyticsService.getClicksByPeriod(
      shortUrl.id,
      period as 'daily' | 'weekly',
      db
    );

    // Return comprehensive analytics response
    return {
      shortUrl: {
        slug: shortUrl.slug,
        originalUrl: shortUrl.originalUrl,
        createdAt: shortUrl.createdAt,
      },
      summary: {
        totalClicks: filteredClicks.length,
        period,
        dateRange: startDate && endDate ? { startDate, endDate } : null,
      },
      timeSeries: clicksByPeriod,
      deviceBreakdown,
      referrerBreakdown,
      browserBreakdown,
      osBreakdown,
    };
  } catch (error) {
    console.error('Error fetching analytics:', error);
    throw error;
  }
}

// Main page component
export default async function AnalyticsPage({ params, searchParams }: PageProps) {
  const { token } = await params;
  const resolvedSearchParams = await searchParams;
  const period = resolvedSearchParams.period || 'daily';
  const { startDate, endDate } = resolvedSearchParams;

  // Validate token format
  if (!token || !/^[A-Za-z0-9]{32}$/.test(token)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert type="error">
            <h2 className="text-lg font-semibold mb-2">Invalid Token</h2>
            <p>The analytics token format is invalid. Please check your link and try again.</p>
          </Alert>
        </div>
      </div>
    );
  }

  // Fetch analytics data
  let analyticsData;
  try {
    analyticsData = await getAnalyticsData(token, period, startDate, endDate);
  } catch (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert type="error">
            <h2 className="text-lg font-semibold mb-2">Error Loading Analytics</h2>
            <p>Failed to load analytics data. Please try again later.</p>
          </Alert>
        </div>
      </div>
    );
  }

  // Handle not found
  if (!analyticsData) {
    notFound();
  }

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <AnalyticsDashboard data={analyticsData} token={token} />
    </Suspense>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps) {
  const { token } = await params;

  return {
    title: 'Analytics Dashboard - URL Shortener',
    description: 'View detailed analytics for your shortened URL',
    robots: 'noindex, nofollow', // Don't index analytics pages
  };
}
