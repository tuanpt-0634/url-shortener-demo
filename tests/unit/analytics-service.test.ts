/**
 * Unit Tests: Analytics Service
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AnalyticsService } from '@/lib/services/analytics';
import { getTestDb, cleanupTestDb } from '../setup';

describe('AnalyticsService', () => {
  let db: any;

  beforeEach(async () => {
    db = await getTestDb();
  });

  afterEach(async () => {
    await cleanupTestDb(db);
  });

  describe('recordClick', () => {
    it('should record a click event with all metadata', async () => {
      const clickData = {
        shortUrlId: 1,
        referrer: 'https://google.com',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0)',
        deviceType: 'mobile' as const,
        ipAddress: '192.168.1.1',
      };

      const clickEvent = await AnalyticsService.recordClick(clickData, db);

      expect(clickEvent).toBeDefined();
      expect(clickEvent.shortUrlId).toBe(1);
      expect(clickEvent.referrer).toBe('https://google.com');
      expect(clickEvent.deviceType).toBe('mobile');
      expect(clickEvent.ipAddress).toBe('192.168.1.1');
      expect(clickEvent.timestamp).toBeDefined();
    });

    it('should record click with null referrer (direct traffic)', async () => {
      const clickData = {
        shortUrlId: 1,
        referrer: null,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0)',
        deviceType: 'desktop' as const,
      };

      const clickEvent = await AnalyticsService.recordClick(clickData, db);

      expect(clickEvent.referrer).toBeNull();
      expect(clickEvent.deviceType).toBe('desktop');
    });

    it('should store timestamp in ISO 8601 UTC format', async () => {
      const clickData = {
        shortUrlId: 1,
        referrer: null,
        userAgent: null,
        deviceType: 'unknown' as const,
      };

      const clickEvent = await AnalyticsService.recordClick(clickData, db);

      // Verify ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ
      expect(clickEvent.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

      // Verify it's a valid date
      const date = new Date(clickEvent.timestamp);
      expect(date.toISOString()).toBe(clickEvent.timestamp);
    });

    it('should handle different device types', async () => {
      const deviceTypes: Array<'mobile' | 'desktop' | 'tablet' | 'unknown'> = [
        'mobile',
        'desktop',
        'tablet',
        'unknown',
      ];

      for (const deviceType of deviceTypes) {
        const clickEvent = await AnalyticsService.recordClick(
          {
            shortUrlId: 1,
            referrer: null,
            userAgent: null,
            deviceType,
          },
          db
        );

        expect(clickEvent.deviceType).toBe(deviceType);
      }
    });

    it('should record multiple clicks for same short URL', async () => {
      const clicks = await Promise.all([
        AnalyticsService.recordClick(
          { shortUrlId: 1, referrer: 'https://google.com', userAgent: null, deviceType: 'mobile' },
          db
        ),
        AnalyticsService.recordClick(
          { shortUrlId: 1, referrer: 'https://twitter.com', userAgent: null, deviceType: 'desktop' },
          db
        ),
        AnalyticsService.recordClick(
          { shortUrlId: 1, referrer: null, userAgent: null, deviceType: 'tablet' },
          db
        ),
      ]);

      expect(clicks).toHaveLength(3);
      expect(clicks[0].id).not.toBe(clicks[1].id);
      expect(clicks[1].id).not.toBe(clicks[2].id);
    });
  });

  describe('getDeviceBreakdown', () => {
    it('should aggregate clicks by device type', async () => {
      // Record multiple clicks with different device types
      await AnalyticsService.recordClick(
        { shortUrlId: 1, referrer: null, userAgent: null, deviceType: 'mobile' },
        db
      );
      await AnalyticsService.recordClick(
        { shortUrlId: 1, referrer: null, userAgent: null, deviceType: 'mobile' },
        db
      );
      await AnalyticsService.recordClick(
        { shortUrlId: 1, referrer: null, userAgent: null, deviceType: 'desktop' },
        db
      );
      await AnalyticsService.recordClick(
        { shortUrlId: 1, referrer: null, userAgent: null, deviceType: 'tablet' },
        db
      );

      const breakdown = await AnalyticsService.getDeviceBreakdown(1, db);

      expect(breakdown).toEqual({
        mobile: 2,
        desktop: 1,
        tablet: 1,
      });
    });

    it('should handle null device types as unknown', async () => {
      await AnalyticsService.recordClick(
        { shortUrlId: 1, referrer: null, userAgent: null, deviceType: 'unknown' },
        db
      );

      const breakdown = await AnalyticsService.getDeviceBreakdown(1, db);

      expect(breakdown).toEqual({
        unknown: 1,
      });
    });
  });

  describe('getReferrerBreakdown', () => {
    it('should aggregate clicks by referrer', async () => {
      await AnalyticsService.recordClick(
        { shortUrlId: 1, referrer: 'https://google.com', userAgent: null, deviceType: 'mobile' },
        db
      );
      await AnalyticsService.recordClick(
        { shortUrlId: 1, referrer: 'https://google.com', userAgent: null, deviceType: 'desktop' },
        db
      );
      await AnalyticsService.recordClick(
        { shortUrlId: 1, referrer: 'https://twitter.com', userAgent: null, deviceType: 'mobile' },
        db
      );
      await AnalyticsService.recordClick(
        { shortUrlId: 1, referrer: null, userAgent: null, deviceType: 'desktop' },
        db
      );

      const breakdown = await AnalyticsService.getReferrerBreakdown(1, db);

      expect(breakdown).toEqual({
        'https://google.com': 2,
        'https://twitter.com': 1,
        'direct': 1,
      });
    });

    it('should treat null referrer as direct traffic', async () => {
      await AnalyticsService.recordClick(
        { shortUrlId: 1, referrer: null, userAgent: null, deviceType: 'mobile' },
        db
      );
      await AnalyticsService.recordClick(
        { shortUrlId: 1, referrer: null, userAgent: null, deviceType: 'desktop' },
        db
      );

      const breakdown = await AnalyticsService.getReferrerBreakdown(1, db);

      expect(breakdown).toEqual({
        direct: 2,
      });
    });
  });

  describe('getClicksByPeriod', () => {
    it('should aggregate clicks by day', async () => {
      // Mock dates for testing (you may need to adjust this based on your test setup)
      const clicks = await Promise.all([
        AnalyticsService.recordClick(
          { shortUrlId: 1, referrer: null, userAgent: null, deviceType: 'mobile' },
          db
        ),
        AnalyticsService.recordClick(
          { shortUrlId: 1, referrer: null, userAgent: null, deviceType: 'desktop' },
          db
        ),
      ]);

      const periods = await AnalyticsService.getClicksByPeriod(1, 'daily', db);

      expect(periods.length).toBeGreaterThan(0);
      expect(periods[0]).toHaveProperty('period');
      expect(periods[0]).toHaveProperty('clicks');
      expect(periods[0].period).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return sorted periods', async () => {
      await AnalyticsService.recordClick(
        { shortUrlId: 1, referrer: null, userAgent: null, deviceType: 'mobile' },
        db
      );

      const periods = await AnalyticsService.getClicksByPeriod(1, 'daily', db);

      // Check if periods are sorted
      for (let i = 1; i < periods.length; i++) {
        expect(periods[i].period >= periods[i - 1].period).toBe(true);
      }
    });
  });

  describe('Error Handling', () => {
    it('should throw error when recording click fails', async () => {
      // Test with invalid short_url_id (foreign key constraint)
      const clickData = {
        shortUrlId: 99999, // Non-existent ID
        referrer: null,
        userAgent: null,
        deviceType: 'mobile' as const,
      };

      await expect(AnalyticsService.recordClick(clickData, db)).rejects.toThrow();
    });
  });
});
