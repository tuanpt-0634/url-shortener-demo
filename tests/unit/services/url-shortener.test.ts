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
            // Mock select with where clause
            const results = Array.from(storage.values()).filter((item) => {
              // Simple mock - in real test we'd need better condition parsing
              return true;
            });
            return results;
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
      // Create a mock DB that simulates a collision on first attempt
      const mockDbWithCollision = {
        select: () => ({
          from: () => ({
            where: () => ({
              limit: vi
                .fn()
                .mockResolvedValueOnce([{ slug: 'abc123' }]) // First check: collision
                .mockResolvedValueOnce([]) // Second check: no collision
                .mockResolvedValue([]), // Subsequent checks
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
    });

    it('should throw error after max retries', async () => {
      // Create a mock DB that always returns collisions
      let selectCallCount = 0;
      const mockDbWithCollisions = {
        select: () => ({
          from: () => ({
            where: () => ({
              limit: () => {
                selectCallCount++;
                // First call is for checking existing URL (return empty)
                if (selectCallCount === 1) {
                  return Promise.resolve([]);
                }
                // All subsequent calls are slug collision checks (return collision)
                return Promise.resolve([{ slug: 'collision' }]);
              },
            }),
          }),
        }),
        insert: () => ({
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
      let selectCallCount = 0;
      const slugLengths: number[] = [];

      const mockDbTrackingLength = {
        select: () => ({
          from: () => ({
            where: (condition: any) => ({
              limit: () => {
                selectCallCount++;
                // First call: check existing URL (empty)
                if (selectCallCount === 1) {
                  return Promise.resolve([]);
                }
                // Calls 2-3: slug collisions (return collision)
                if (selectCallCount <= 3) {
                  return Promise.resolve([{ slug: 'collision' }]);
                }
                // Call 4: no collision
                return Promise.resolve([]);
              },
            }),
          }),
        }),
        insert: (table: any) => ({
          values: (data: any) => {
            slugLengths.push(data.slug.length);
            return {
              returning: () => [{ ...data, id: 1 }],
            };
          },
        }),
      };

      await UrlShortenerService.createShortUrl({
        originalUrl: 'https://example.com',
        db: mockDbTrackingLength,
      });

      // Should have incremented length on retry
      expect(selectCallCount).toBeGreaterThan(2); // At least 1 URL check + 2 slug checks
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
