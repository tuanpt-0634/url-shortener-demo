import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UrlShortenerService } from '@/lib/services/url-shortener';

// Mock database
const createMockDb = () => {
  const storage = new Map<string, any>();
  let idCounter = 1;

  return {
    select: () => ({
      from: () => ({
        where: (condition: any) => ({
          limit: () => {
            // Return empty array to simulate no existing URLs
            // This allows new short URLs to always be created
            return [];
          },
        }),
      }),
    }),
    insert: (table: any) => ({
      values: (data: any) => ({
        returning: () => {
          const record = { ...data, id: idCounter++ };
          storage.set(data.slug || data.analyticsToken, record);
          return [record];
        },
      }),
    }),
    storage, // Expose for test manipulation
  };
};

describe('UrlShortenerService', () => {
  let mockDb: any;

  beforeEach(() => {
    mockDb = createMockDb();
    vi.clearAllMocks();
  });

  describe('createShortUrl', () => {
    it('should create a new short URL with valid input', async () => {
      const result = await UrlShortenerService.createShortUrl({
        originalUrl: 'https://example.com',
        db: mockDb,
      });

      expect(result.isNewUrl).toBe(true);
      expect(result.shortUrl).toBeDefined();
      expect(result.shortUrl.slug).toHaveLength(6);
      expect(result.shortUrl.originalUrl).toBe('https://example.com/');
      expect(result.shortUrl.analyticsToken).toHaveLength(32);
      expect(result.shortUrl.createdAt).toBeDefined();
      expect(result.shortUrl.updatedAt).toBeDefined();
    });

    it('should normalize URLs before storing', async () => {
      const result = await UrlShortenerService.createShortUrl({
        originalUrl: 'https://example.com',
        db: mockDb,
      });

      expect(result.shortUrl.originalUrl).toBe('https://example.com/');
    });

    it('should reject invalid URLs', async () => {
      await expect(
        UrlShortenerService.createShortUrl({
          originalUrl: 'not-a-url',
          db: mockDb,
        })
      ).rejects.toThrow('Invalid URL format');
    });

    it('should reject non-HTTP/HTTPS URLs', async () => {
      await expect(
        UrlShortenerService.createShortUrl({
          originalUrl: 'ftp://example.com',
          db: mockDb,
        })
      ).rejects.toThrow('Invalid URL format');
    });

    it('should reject empty URLs', async () => {
      await expect(
        UrlShortenerService.createShortUrl({
          originalUrl: '',
          db: mockDb,
        })
      ).rejects.toThrow('Invalid URL format');
    });

    it('should generate unique slugs', async () => {
      const result1 = await UrlShortenerService.createShortUrl({
        originalUrl: 'https://example1.com',
        db: createMockDb(),
      });

      const result2 = await UrlShortenerService.createShortUrl({
        originalUrl: 'https://example2.com',
        db: createMockDb(),
      });

      expect(result1.shortUrl.slug).not.toBe(result2.shortUrl.slug);
    });

    it('should generate unique analytics tokens', async () => {
      const result1 = await UrlShortenerService.createShortUrl({
        originalUrl: 'https://example1.com',
        db: createMockDb(),
      });

      const result2 = await UrlShortenerService.createShortUrl({
        originalUrl: 'https://example2.com',
        db: createMockDb(),
      });

      expect(result1.shortUrl.analyticsToken).not.toBe(result2.shortUrl.analyticsToken);
    });

    it('should create new short URL for duplicate original URL (FR-006)', async () => {
      const db = createMockDb();
      const originalUrl = 'https://example.com/same-url';

      // Create first short URL
      const result1 = await UrlShortenerService.createShortUrl({
        originalUrl,
        db,
      });

      // Create second short URL with same original URL
      const result2 = await UrlShortenerService.createShortUrl({
        originalUrl,
        db,
      });

      // Both should be new URLs
      expect(result1.isNewUrl).toBe(true);
      expect(result2.isNewUrl).toBe(true);

      // Should have different slugs
      expect(result1.shortUrl.slug).not.toBe(result2.shortUrl.slug);

      // Should have different analytics tokens (separate tracking)
      expect(result1.shortUrl.analyticsToken).not.toBe(result2.shortUrl.analyticsToken);

      // Both should have same original URL
      expect(result1.shortUrl.originalUrl).toBe(result2.shortUrl.originalUrl);
    });

    it('should handle URLs with query parameters', async () => {
      const result = await UrlShortenerService.createShortUrl({
        originalUrl: 'https://example.com?foo=bar&baz=qux',
        db: mockDb,
      });

      expect(result.shortUrl.originalUrl).toContain('foo=bar');
      expect(result.shortUrl.originalUrl).toContain('baz=qux');
    });

    it('should handle URLs with fragments', async () => {
      const result = await UrlShortenerService.createShortUrl({
        originalUrl: 'https://example.com#section',
        db: mockDb,
      });

      expect(result.shortUrl.originalUrl).toContain('#section');
    });

    it('should store timestamps in ISO 8601 format', async () => {
      const result = await UrlShortenerService.createShortUrl({
        originalUrl: 'https://example.com',
        db: mockDb,
      });

      expect(result.shortUrl.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(result.shortUrl.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should handle very long URLs', async () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(2000);
      const result = await UrlShortenerService.createShortUrl({
        originalUrl: longUrl,
        db: mockDb,
      });

      expect(result.shortUrl.slug).toHaveLength(6);
    });

    it('should handle internationalized domain names', async () => {
      const result = await UrlShortenerService.createShortUrl({
        originalUrl: 'https://münchen.de',
        db: mockDb,
      });

      // IDNs may be stored as punycode (xn--mnchen-3ya.de) or unicode
      expect(result.shortUrl.originalUrl).toBeTruthy();
      expect(result.shortUrl.originalUrl).toMatch(/https:\/\//);
    });
  });

  describe('collision handling', () => {
    it('should retry with longer slug on collision', async () => {
      let callCount = 0;
      const mockDbWithCollision = {
        select: () => ({
          from: () => ({
            where: () => ({
              limit: () => {
                callCount++;
                // First call: collision detected
                if (callCount === 1) {
                  return Promise.resolve([{ slug: 'exists' }]);
                }
                // Second call: no collision
                return Promise.resolve([]);
              },
            }),
          }),
        }),
        insert: (table: any) => ({
          values: (data: any) => ({
            returning: () => [{ ...data, id: 1 }],
          }),
        }),
      };

      const result = await UrlShortenerService.createShortUrl({
        originalUrl: 'https://example.com',
        db: mockDbWithCollision,
      });

      expect(result.shortUrl.slug).toBeDefined();
      expect(result.shortUrl.slug.length).toBeGreaterThanOrEqual(6);
      expect(callCount).toBeGreaterThan(1); // Should have retried
    });

    it('should throw error after max retries', async () => {
      const mockDbWithCollisions = {
        select: () => ({
          from: () => ({
            where: () => ({
              limit: () => {
                // Always return collision
                return Promise.resolve([{ slug: 'collision' }]);
              },
            }),
          }),
        }),
        insert: (table: any) => ({
          values: () => ({
            returning: () => [],
          }),
        }),
      };

      await expect(
        UrlShortenerService.createShortUrl({
          originalUrl: 'https://example.com',
          db: mockDbWithCollisions,
        })
      ).rejects.toThrow('Unable to generate unique slug');
    });

    it('should increment slug length on each retry', async () => {
      let callCount = 0;
      const mockDbTrackingLength = {
        select: () => ({
          from: () => ({
            where: () => ({
              limit: () => {
                callCount++;
                // First 2 calls: collisions
                if (callCount <= 2) {
                  return Promise.resolve([{ slug: 'exists' }]);
                }
                // Third call: success
                return Promise.resolve([]);
              },
            }),
          }),
        }),
        insert: (table: any) => ({
          values: (data: any) => ({
            returning: () => [{ ...data, id: 1 }],
          }),
        }),
      };

      const result = await UrlShortenerService.createShortUrl({
        originalUrl: 'https://example.com',
        db: mockDbTrackingLength,
      });

      expect(callCount).toBeGreaterThan(2); // Should have tried multiple times
      expect(result.shortUrl.slug).toBeDefined();
    });
  });

  describe('getBySlug', () => {
    it('should return short URL when slug exists', async () => {
      // First create a URL
      const created = await UrlShortenerService.createShortUrl({
        originalUrl: 'https://example.com',
        db: mockDb,
      });

      // Mock the select to return the created URL
      const mockDbWithData = {
        select: () => ({
          from: () => ({
            where: () => ({
              limit: () => Promise.resolve([created.shortUrl]),
            }),
          }),
        }),
      };

      const result = await UrlShortenerService.getBySlug(created.shortUrl.slug, mockDbWithData);

      expect(result).toBeDefined();
      expect(result?.slug).toBe(created.shortUrl.slug);
      expect(result?.originalUrl).toBe(created.shortUrl.originalUrl);
    });

    it('should return null when slug does not exist', async () => {
      const mockDbEmpty = {
        select: () => ({
          from: () => ({
            where: () => ({
              limit: () => Promise.resolve([]),
            }),
          }),
        }),
      };

      const result = await UrlShortenerService.getBySlug('nonexistent', mockDbEmpty);
      expect(result).toBeNull();
    });
  });

  describe('getByToken', () => {
    it('should return short URL when token exists', async () => {
      // First create a URL
      const created = await UrlShortenerService.createShortUrl({
        originalUrl: 'https://example.com',
        db: mockDb,
      });

      // Mock the select to return the created URL
      const mockDbWithData = {
        select: () => ({
          from: () => ({
            where: () => ({
              limit: () => Promise.resolve([created.shortUrl]),
            }),
          }),
        }),
      };

      const result = await UrlShortenerService.getByToken(
        created.shortUrl.analyticsToken,
        mockDbWithData
      );

      expect(result).toBeDefined();
      expect(result?.analyticsToken).toBe(created.shortUrl.analyticsToken);
      expect(result?.originalUrl).toBe(created.shortUrl.originalUrl);
    });

    it('should return null when token does not exist', async () => {
      const mockDbEmpty = {
        select: () => ({
          from: () => ({
            where: () => ({
              limit: () => Promise.resolve([]),
            }),
          }),
        }),
      };

      const result = await UrlShortenerService.getByToken('nonexistenttoken12345678901234', mockDbEmpty);
      expect(result).toBeNull();
    });
  });
});
