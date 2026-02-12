/**
 * Analytics API Route
 * GET /api/analytics/:token - Fetch analytics data for a short URL
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { AnalyticsService } from '@/lib/services/analytics';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Validate token format (32 alphanumeric characters)
    if (!token || !/^[A-Za-z0-9]{32}$/.test(token)) {
      return NextResponse.json(
        { error: 'Invalid analytics token format' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'daily'; // 'daily' or 'weekly'
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Fetch basic analytics data by token
    const analyticsData = await AnalyticsService.getAnalyticsByToken(token, db);

    if (!analyticsData) {
      return NextResponse.json(
        { error: 'Analytics not found. Invalid or unauthorized token.' },
        { status: 404 }
      );
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
    const deviceBreakdown = await AnalyticsService.getDeviceBreakdown(
      shortUrl.id,
      db
    );

    const referrerBreakdown = await AnalyticsService.getReferrerBreakdown(
      shortUrl.id,
      db
    );

    const browserBreakdown = await AnalyticsService.getBrowserBreakdown(
      shortUrl.id,
      db
    );

    const osBreakdown = await AnalyticsService.getOSBreakdown(
      shortUrl.id,
      db
    );

    const clicksByPeriod = await AnalyticsService.getClicksByPeriod(
      shortUrl.id,
      period as 'daily' | 'weekly',
      db
    );

    // Return comprehensive analytics response
    return NextResponse.json({
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
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
