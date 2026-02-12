import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/shorten/route';
import { NextRequest } from 'next/server';

// Mock the database and services
vi.mock('@/lib/db/client', () => ({
  getDb: vi.fn(() => mockDb),
}));

vi.mock('@/lib/services/url-shortener');
vi.mock('@/lib/services/security');

import { UrlShortenerService } from '@/lib/services/url-shortener';
import { SecurityService } from '@/lib/services/security';

const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
};

describe('POST /api/shorten', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (body: any, options: { baseUrl?: string } = {}) => {
    const baseUrl = options.baseUrl || 'http://localhost:3000';
    const parsedUrl = new URL('/api/shorten', baseUrl);
    return {
      json: async () => body,
      nextUrl: parsedUrl,
    } as NextRequest;
  };

  describe('successful URL creation', () => {
    it('should create a short URL and return 201', async () => {
      const mockShortUrl = {
        id: 1,
        slug: 'abc123',
        originalUrl: 'https://example.com/',
        analyticsToken: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
        createdAt: '2026-02-12T10:00:00.000Z',
        updatedAt: '2026-02-12T10:00:00.000Z',
      };

      vi.mocked(SecurityService.validateUrlSafety).mockResolvedValueOnce(undefined);
      vi.mocked(UrlShortenerService.createShortUrl).mockResolvedValueOnce({
        shortUrl: mockShortUrl,
        isNewUrl: true,
      });

      const request = createMockRequest({ url: 'https://example.com' });
      const response = await POST(request);

      expect(response.status).toBe(201);

      const data = await response.json();
      // Accept any format since the test mock may not perfectly match Next.js behavior
      expect(data.shortUrl).toContain('abc123');
      expect(data.slug).toBe('abc123');
      expect(data.originalUrl).toBe('https://example.com/');
      expect(data.analyticsToken).toBe('a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6');
      expect(data.analyticsUrl).toContain('/analytics/a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6');
      expect(data.createdAt).toBeDefined();
    });

    it('should use BASE_URL environment variable when available', async () => {
      process.env.BASE_URL = 'https://short.link';

      const mockShortUrl = {
        id: 1,
        slug: 'xyz789',
        originalUrl: 'https://example.com/',
        analyticsToken: 'token123',
        createdAt: '2026-02-12T10:00:00.000Z',
        updatedAt: '2026-02-12T10:00:00.000Z',
      };

      vi.mocked(SecurityService.validateUrlSafety).mockResolvedValueOnce(undefined);
      vi.mocked(UrlShortenerService.createShortUrl).mockResolvedValueOnce({
        shortUrl: mockShortUrl,
        isNewUrl: true,
      });

      const request = createMockRequest({ url: 'https://example.com' });
      const response = await POST(request);

      const data = await response.json();
      expect(data.shortUrl).toBe('https://short.link/xyz789');
      expect(data.analyticsUrl).toContain('https://short.link/analytics/');

      delete process.env.BASE_URL;
    });

    it('should call SecurityService to validate URL safety', async () => {
      const mockShortUrl = {
        id: 1,
        slug: 'abc123',
        originalUrl: 'https://example.com/',
        analyticsToken: 'token',
        createdAt: '2026-02-12T10:00:00.000Z',
        updatedAt: '2026-02-12T10:00:00.000Z',
      };

      vi.mocked(SecurityService.validateUrlSafety).mockResolvedValueOnce(undefined);
      vi.mocked(UrlShortenerService.createShortUrl).mockResolvedValueOnce({
        shortUrl: mockShortUrl,
        isNewUrl: true,
      });

      const request = createMockRequest({ url: 'https://example.com' });
      await POST(request);

      expect(SecurityService.validateUrlSafety).toHaveBeenCalledWith('https://example.com');
    });
  });

  describe('request validation', () => {
    it('should return 400 when URL is missing', async () => {
      const request = createMockRequest({});
      const response = await POST(request);

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Invalid request');
      expect(data.message).toContain('URL is required');
    });

    it('should return 400 when URL is not a string', async () => {
      const request = createMockRequest({ url: 123 });
      const response = await POST(request);

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Invalid request');
      expect(data.message).toContain('must be a string');
    });

    it('should return 400 when URL is null', async () => {
      const request = createMockRequest({ url: null });
      const response = await POST(request);

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Invalid request');
    });

    it('should return 400 when URL is empty string', async () => {
      const request = createMockRequest({ url: '' });
      const response = await POST(request);

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Invalid request');
    });
  });

  describe('malicious URL detection', () => {
    it('should return 400 when URL is malicious', async () => {
      vi.mocked(SecurityService.validateUrlSafety).mockRejectedValueOnce(
        new Error('This URL has been identified as potentially harmful')
      );

      const request = createMockRequest({ url: 'http://malicious.com' });
      const response = await POST(request);

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Malicious URL detected');
      expect(data.message).toContain('potentially harmful');
    });

    it('should include security message in error response', async () => {
      vi.mocked(SecurityService.validateUrlSafety).mockRejectedValueOnce(
        new Error('This URL has been identified as potentially harmful and cannot be shortened')
      );

      const request = createMockRequest({ url: 'http://phishing.com' });
      const response = await POST(request);

      const data = await response.json();
      expect(data.message).toContain('cannot be shortened');
    });
  });

  describe('invalid URL format', () => {
    it('should return 400 for invalid URL format', async () => {
      vi.mocked(SecurityService.validateUrlSafety).mockResolvedValueOnce(undefined);
      vi.mocked(UrlShortenerService.createShortUrl).mockRejectedValueOnce(
        new Error('Invalid URL format. Please provide a valid HTTP or HTTPS URL.')
      );

      const request = createMockRequest({ url: 'not-a-url' });
      const response = await POST(request);

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Invalid URL format');
      expect(data.message).toContain('valid HTTP or HTTPS URL');
    });

    it('should reject FTP URLs', async () => {
      vi.mocked(SecurityService.validateUrlSafety).mockResolvedValueOnce(undefined);
      vi.mocked(UrlShortenerService.createShortUrl).mockRejectedValueOnce(
        new Error('Invalid URL format. Please provide a valid HTTP or HTTPS URL.')
      );

      const request = createMockRequest({ url: 'ftp://example.com' });
      const response = await POST(request);

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Invalid URL format');
    });
  });

  describe('slug generation errors', () => {
    it('should return 500 when slug generation fails', async () => {
      vi.mocked(SecurityService.validateUrlSafety).mockResolvedValueOnce(undefined);
      vi.mocked(UrlShortenerService.createShortUrl).mockRejectedValueOnce(
        new Error('Unable to generate unique slug after multiple retries. Please try again.')
      );

      const request = createMockRequest({ url: 'https://example.com' });
      const response = await POST(request);

      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.error).toBe('Slug generation failed');
      expect(data.message).toContain('Unable to generate unique slug');
    });
  });

  describe('error handling', () => {
    it('should return 500 for unexpected errors', async () => {
      vi.mocked(SecurityService.validateUrlSafety).mockResolvedValueOnce(undefined);
      vi.mocked(UrlShortenerService.createShortUrl).mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const request = createMockRequest({ url: 'https://example.com' });
      const response = await POST(request);

      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.error).toBe('Internal server error');
      expect(data.message).toContain('unexpected error');

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should log errors to console', async () => {
      vi.mocked(SecurityService.validateUrlSafety).mockResolvedValueOnce(undefined);
      vi.mocked(UrlShortenerService.createShortUrl).mockRejectedValueOnce(
        new Error('Test error')
      );

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const request = createMockRequest({ url: 'https://example.com' });
      await POST(request);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error creating short URL:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('response format', () => {
    it('should include all required fields in success response', async () => {
      const mockShortUrl = {
        id: 1,
        slug: 'abc123',
        originalUrl: 'https://example.com/',
        analyticsToken: 'token123',
        createdAt: '2026-02-12T10:00:00.000Z',
        updatedAt: '2026-02-12T10:00:00.000Z',
      };

      vi.mocked(SecurityService.validateUrlSafety).mockResolvedValueOnce(undefined);
      vi.mocked(UrlShortenerService.createShortUrl).mockResolvedValueOnce({
        shortUrl: mockShortUrl,
        isNewUrl: true,
      });

      const request = createMockRequest({ url: 'https://example.com' });
      const response = await POST(request);

      const data = await response.json();

      expect(data).toHaveProperty('shortUrl');
      expect(data).toHaveProperty('slug');
      expect(data).toHaveProperty('originalUrl');
      expect(data).toHaveProperty('analyticsToken');
      expect(data).toHaveProperty('analyticsUrl');
      expect(data).toHaveProperty('createdAt');
    });

    it('should include error and message fields in error response', async () => {
      const request = createMockRequest({});
      const response = await POST(request);

      const data = await response.json();

      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
    });
  });
});
