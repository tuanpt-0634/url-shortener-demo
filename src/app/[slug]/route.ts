import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { UrlShortenerService } from '@/lib/services/url-shortener';
import { AnalyticsService } from '@/lib/services/analytics';
import { parseUserAgent } from '@/lib/utils/device-detector';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Validate slug format
  if (!/^[A-Za-z0-9]{6,8}$/.test(slug)) {
    return NextResponse.json(
      { error: 'Invalid slug format' },
      { status: 404 }
    );
  }

  // Get database instance
  const db = await getDb();

  // Fetch the short URL
  const shortUrl = await UrlShortenerService.getBySlug(slug, db);

  if (!shortUrl) {
    return NextResponse.json(
      { error: 'Short URL not found' },
      { status: 404 }
    );
  }

  // Extract request metadata for analytics
  const referrer = request.headers.get('referer') || null;
  const userAgent = request.headers.get('user-agent') || null;
  const { deviceType, browser, os } = parseUserAgent(userAgent);
  const ipAddress = request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') || null;

  // Record analytics in background (fire-and-forget for performance)
  // Don't await - let it run async to keep redirect fast
  AnalyticsService.recordClick(
    {
      shortUrlId: shortUrl.id,
      referrer,
      userAgent,
      deviceType,
      browser,
      os,
      ipAddress,
    },
    db
  ).catch((error) => {
    // Log but don't fail the redirect
    console.error('Analytics tracking failed:', error);
  });

  // Redirect immediately (HTTP 302 for temporary redirect)
  return NextResponse.redirect(shortUrl.originalUrl, 302);
}
