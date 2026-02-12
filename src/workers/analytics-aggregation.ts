/**
 * Analytics Pre-Aggregation Worker
 *
 * Cloudflare Scheduled Worker to pre-aggregate analytics data
 * into the analytics_summary table for faster dashboard queries.
 *
 * Runs daily at midnight UTC to summarize the previous day's data.
 *
 * To schedule in wrangler.toml:
 *
 * [triggers]
 * crons = ["0 0 * * *"]  # Run daily at midnight UTC
 */

import { getDb } from '@/lib/db/client';
import { clickEvents, analyticsSummary } from '@/lib/db/schema';
import { sql, eq, gte, lt, and } from 'drizzle-orm';
import { createServiceLogger } from '@/lib/utils/logger';

const logger = createServiceLogger('analytics-aggregation');

// Type definition for Cloudflare Workers scheduled events
interface ScheduledEvent {
  scheduledTime: number;
  cron: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface Env {
  DB: any;
}

/**
 * Scheduled event handler for Cloudflare Workers
 * This is called automatically by Cloudflare's cron triggers
 */
export async function scheduled(
  event: ScheduledEvent,
  _env: Env,
  _ctx: ExecutionContext
): Promise<void> {
  logger.info('Starting analytics pre-aggregation job', {
    scheduledTime: new Date(event.scheduledTime).toISOString(),
    cron: event.cron,
  });

  try {
    await aggregateAnalytics();

    logger.info('Analytics pre-aggregation completed successfully');
  } catch (error) {
    logger.error('Analytics pre-aggregation failed', error instanceof Error ? error : undefined, {
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Aggregate analytics data for the previous day
 */
async function aggregateAnalytics(): Promise<void> {
  const db = await getDb();

  // Calculate date range for yesterday (in UTC)
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  yesterday.setUTCHours(0, 0, 0, 0);

  const today = new Date(yesterday);
  today.setUTCDate(today.getUTCDate() + 1);

  const startDate = yesterday.toISOString();
  const endDate = today.toISOString();

  logger.info('Aggregating data for date range', { startDate, endDate });

  // Get all unique short URLs that have clicks in the date range
  const urlsWithClicks = await db
    .select({
      shortUrlId: clickEvents.shortUrlId,
      totalClicks: sql<number>`count(*)`.as('total_clicks'),
      uniqueReferrers: sql<number>`count(distinct ${clickEvents.referrer})`.as('unique_referrers'),
      mobileClicks: sql<number>`sum(case when ${clickEvents.deviceType} = 'mobile' then 1 else 0 end)`.as('mobile_clicks'),
      desktopClicks: sql<number>`sum(case when ${clickEvents.deviceType} = 'desktop' then 1 else 0 end)`.as('desktop_clicks'),
      tabletClicks: sql<number>`sum(case when ${clickEvents.deviceType} = 'tablet' then 1 else 0 end)`.as('tablet_clicks'),
    })
    .from(clickEvents)
    .where(
      and(
        gte(clickEvents.timestamp, startDate),
        lt(clickEvents.timestamp, endDate)
      )
    )
    .groupBy(clickEvents.shortUrlId);

  logger.info(`Found ${urlsWithClicks.length} URLs with clicks to aggregate`);

  // Insert or update summary records for each URL
  for (const urlData of urlsWithClicks) {
    try {
      // Check if summary already exists for this URL and period
      const existing = await db
        .select()
        .from(analyticsSummary)
        .where(
          and(
            eq(analyticsSummary.shortUrlId, urlData.shortUrlId),
            eq(analyticsSummary.periodStart, startDate),
            eq(analyticsSummary.periodType, 'daily')
          )
        )
        .limit(1);

      const deviceBreakdown = JSON.stringify({
        mobile: urlData.mobileClicks,
        desktop: urlData.desktopClicks,
        tablet: urlData.tabletClicks,
      });

      if (existing.length > 0) {
        // Update existing record
        await db
          .update(analyticsSummary)
          .set({
            totalClicks: urlData.totalClicks,
            clicksByDevice: deviceBreakdown,
          })
          .where(eq(analyticsSummary.id, existing[0].id));

        logger.debug('Updated analytics summary', {
          shortUrlId: urlData.shortUrlId,
          periodStart: startDate,
        });
      } else {
        // Insert new record
        await db.insert(analyticsSummary).values({
          shortUrlId: urlData.shortUrlId,
          periodStart: startDate,
          periodEnd: endDate,
          periodType: 'daily',
          totalClicks: urlData.totalClicks,
          clicksByDevice: deviceBreakdown,
          createdAt: new Date().toISOString(),
        });

        logger.debug('Created analytics summary', {
          shortUrlId: urlData.shortUrlId,
          periodStart: startDate,
        });
      }
    } catch (error) {
      logger.error('Failed to aggregate analytics for URL', error instanceof Error ? error : undefined, {
        shortUrlId: urlData.shortUrlId,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      // Continue with other URLs even if one fails
      continue;
    }
  }

  logger.info('Analytics aggregation batch completed', {
    processedUrls: urlsWithClicks.length,
  });
}

/**
 * Export for standalone execution (testing, manual runs)
 */
export { aggregateAnalytics };
