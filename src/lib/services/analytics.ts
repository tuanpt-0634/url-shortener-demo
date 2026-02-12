/**
 * Analytics Service
 * Handles click event tracking and analytics data aggregation
 */

import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { clickEvents, shortUrls } from '@/lib/db/schema';
import { ClickEvent, DeviceType } from '@/lib/types';

export interface RecordClickParams {
  shortUrlId: number;
  referrer: string | null;
  userAgent: string | null;
  deviceType: DeviceType;
  ipAddress?: string | null;
}

export class AnalyticsService {
  /**
   * Records a click event for a short URL
   * @param params - Click event parameters
   * @param db - Database instance
   * @returns The created click event
   */
  static async recordClick(
    params: RecordClickParams,
    db: BetterSQLite3Database
  ): Promise<ClickEvent> {
    const { shortUrlId, referrer, userAgent, deviceType, ipAddress = null } = params;

    // Generate UTC timestamp in ISO 8601 format
    const timestamp = new Date().toISOString();

    try {
      const [clickEvent] = await db
        .insert(clickEvents)
        .values({
          shortUrlId,
          timestamp,
          referrer,
          userAgent,
          deviceType,
          ipAddress,
        })
        .returning();

      return clickEvent as ClickEvent;
    } catch (error) {
      console.error('Failed to record click event:', error);
      throw new Error('Failed to record click event');
    }
  }

  /**
   * Gets analytics data for a short URL by analytics token
   * @param token - Analytics token
   * @param db - Database instance
   * @returns Analytics data or null if not found
   */
  static async getAnalyticsByToken(
    token: string,
    db: BetterSQLite3Database
  ): Promise<{ shortUrl: typeof shortUrls.$inferSelect; clicks: ClickEvent[] } | null> {
    try {
      // Find the short URL by analytics token
      const [shortUrl] = await db
        .select()
        .from(shortUrls)
        .where(eq(shortUrls.analyticsToken, token))
        .limit(1);

      if (!shortUrl) {
        return null;
      }

      // Get all click events for this short URL
      const clicks = await db
        .select()
        .from(clickEvents)
        .where(eq(clickEvents.shortUrlId, shortUrl.id))
        .orderBy(desc(clickEvents.timestamp));

      return {
        shortUrl,
        clicks,
      };
    } catch (error) {
      console.error('Failed to get analytics by token:', error);
      throw new Error('Failed to get analytics');
    }
  }

  /**
   * Gets click events for a date range
   * @param shortUrlId - Short URL ID
   * @param startDate - Start date (ISO 8601)
   * @param endDate - End date (ISO 8601)
   * @param db - Database instance
   * @returns Array of click events
   */
  static async getClicksByDateRange(
    shortUrlId: number,
    startDate: string,
    endDate: string,
    db: BetterSQLite3Database
  ): Promise<ClickEvent[]> {
    try {
      const clicks = await db
        .select()
        .from(clickEvents)
        .where(
          and(
            eq(clickEvents.shortUrlId, shortUrlId),
            gte(clickEvents.timestamp, startDate),
            lte(clickEvents.timestamp, endDate)
          )
        )
        .orderBy(desc(clickEvents.timestamp));

      return clicks as ClickEvent[];
    } catch (error) {
      console.error('Failed to get clicks by date range:', error);
      throw new Error('Failed to get clicks');
    }
  }

  /**
   * Aggregates click events by device type
   * @param shortUrlId - Short URL ID
   * @param db - Database instance
   * @returns Device breakdown
   */
  static async getDeviceBreakdown(
    shortUrlId: number,
    db: BetterSQLite3Database
  ): Promise<Record<string, number>> {
    try {
      const clicks = await db
        .select()
        .from(clickEvents)
        .where(eq(clickEvents.shortUrlId, shortUrlId));

      // Aggregate by device type
      const breakdown: Record<string, number> = {};
      clicks.forEach((click) => {
        const device = click.deviceType || 'unknown';
        breakdown[device] = (breakdown[device] || 0) + 1;
      });

      return breakdown;
    } catch (error) {
      console.error('Failed to get device breakdown:', error);
      throw new Error('Failed to get device breakdown');
    }
  }

  /**
   * Aggregates click events by referrer
   * @param shortUrlId - Short URL ID
   * @param db - Database instance
   * @returns Referrer breakdown
   */
  static async getReferrerBreakdown(
    shortUrlId: number,
    db: BetterSQLite3Database
  ): Promise<Record<string, number>> {
    try {
      const clicks = await db
        .select()
        .from(clickEvents)
        .where(eq(clickEvents.shortUrlId, shortUrlId));

      // Aggregate by referrer
      const breakdown: Record<string, number> = {};
      clicks.forEach((click) => {
        const referrer = click.referrer || 'direct';
        breakdown[referrer] = (breakdown[referrer] || 0) + 1;
      });

      return breakdown;
    } catch (error) {
      console.error('Failed to get referrer breakdown:', error);
      throw new Error('Failed to get referrer breakdown');
    }
  }

  /**
   * Aggregates clicks by time period (daily or weekly)
   * @param shortUrlId - Short URL ID
   * @param periodType - 'daily' or 'weekly'
   * @param db - Database instance
   * @returns Time-series data
   */
  static async getClicksByPeriod(
    shortUrlId: number,
    periodType: 'daily' | 'weekly',
    db: BetterSQLite3Database
  ): Promise<{ period: string; clicks: number }[]> {
    try {
      const clicks = await db
        .select()
        .from(clickEvents)
        .where(eq(clickEvents.shortUrlId, shortUrlId))
        .orderBy(clickEvents.timestamp);

      // Group by period
      const periods: Record<string, number> = {};
      clicks.forEach((click) => {
        const date = new Date(click.timestamp);
        let periodKey: string;

        if (periodType === 'daily') {
          // Format as YYYY-MM-DD
          periodKey = date.toISOString().split('T')[0];
        } else {
          // Weekly: Get the Monday of the week
          const monday = new Date(date);
          monday.setDate(date.getDate() - date.getDay() + 1);
          periodKey = monday.toISOString().split('T')[0];
        }

        periods[periodKey] = (periods[periodKey] || 0) + 1;
      });

      // Convert to array and sort by period
      return Object.entries(periods)
        .map(([period, clicks]) => ({ period, clicks }))
        .sort((a, b) => a.period.localeCompare(b.period));
    } catch (error) {
      console.error('Failed to get clicks by period:', error);
      throw new Error('Failed to get clicks by period');
    }
  }
}
