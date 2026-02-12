import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { UrlShortenerService } from '@/lib/services/url-shortener';
import { AnalyticsService } from '@/lib/services/analytics';
import { parseUserAgent } from '@/lib/utils/device-detector';
import { createRouteLogger } from '@/lib/utils/logger';

const logger = createRouteLogger('/[slug]');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Skip reserved paths (these should be handled by other routes)
  const reservedPaths = ['analytics', 'api', 'admin', 'dashboard', '_next', 'public'];
  if (reservedPaths.includes(slug.toLowerCase())) {
    // Return null to let Next.js continue to other route handlers
    return new NextResponse(null, { status: 404 });
  }

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
  const ipAddress =
    request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null;

  // Record analytics - use waitUntil in Cloudflare, await in local dev
  const analyticsPromise = AnalyticsService.recordClick(
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
    logger.error('Analytics tracking failed', error instanceof Error ? error : undefined, {
      slug,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });
  });

  if (process.env.RUNTIME_PLATFORM === 'cloudflare') {
    // In Cloudflare Workers: use waitUntil for non-blocking background task
    const { getCloudflareContext } = await import('@opennextjs/cloudflare');
    const { ctx } = getCloudflareContext();
    ctx.waitUntil(analyticsPromise);
  } else {
    // In local dev: await to ensure completion
    await analyticsPromise;
  }

  // Redirect (HTTP 302 for temporary redirect)
  return NextResponse.redirect(shortUrl.originalUrl, 302);
}
