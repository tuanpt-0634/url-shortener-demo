import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SecurityService } from '@/lib/services/security';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('SecurityService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('checkMaliciousUrl', () => {
    it('should return true for safe URLs', async () => {
      process.env.GOOGLE_SAFE_BROWSING_API_KEY = 'test-api-key';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}), // Empty response = no threats
      });

      const result = await SecurityService.checkMaliciousUrl('https://example.com');

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('safebrowsing.googleapis.com'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should return false for malicious URLs', async () => {
      process.env.GOOGLE_SAFE_BROWSING_API_KEY = 'test-api-key';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          matches: [
            {
              threatType: 'MALWARE',
              platformType: 'ANY_PLATFORM',
              threat: { url: 'http://malicious.com' },
            },
          ],
        }),
      });

      const result = await SecurityService.checkMaliciousUrl('http://malicious.com');

      expect(result).toBe(false);
    });

    it('should include all required threat types in API request', async () => {
      process.env.GOOGLE_SAFE_BROWSING_API_KEY = 'test-api-key';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await SecurityService.checkMaliciousUrl('https://example.com');

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody.threatInfo.threatTypes).toContain('MALWARE');
      expect(requestBody.threatInfo.threatTypes).toContain('SOCIAL_ENGINEERING');
      expect(requestBody.threatInfo.threatTypes).toContain('UNWANTED_SOFTWARE');
    });

    it('should return true when API key is not configured (dev mode)', async () => {
      delete process.env.GOOGLE_SAFE_BROWSING_API_KEY;

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await SecurityService.checkMaliciousUrl('https://example.com');

      expect(result).toBe(true);
      expect(mockFetch).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('not configured')
      );

      consoleSpy.mockRestore();
    });

    it('should fail open (return true) on API errors', async () => {
      process.env.GOOGLE_SAFE_BROWSING_API_KEY = 'test-api-key';

      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await SecurityService.checkMaliciousUrl('https://example.com');

      expect(result).toBe(true); // Fail open - don't block users on API errors
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should fail open on network errors', async () => {
      process.env.GOOGLE_SAFE_BROWSING_API_KEY = 'test-api-key';

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await SecurityService.checkMaliciousUrl('https://example.com');

      expect(result).toBe(true); // Fail open
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle multiple threat matches', async () => {
      process.env.GOOGLE_SAFE_BROWSING_API_KEY = 'test-api-key';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          matches: [
            {
              threatType: 'MALWARE',
              platformType: 'ANY_PLATFORM',
              threat: { url: 'http://malicious.com' },
            },
            {
              threatType: 'SOCIAL_ENGINEERING',
              platformType: 'ANY_PLATFORM',
              threat: { url: 'http://malicious.com' },
            },
          ],
        }),
      });

      const result = await SecurityService.checkMaliciousUrl('http://malicious.com');

      expect(result).toBe(false);
    });

    it('should send correct client information', async () => {
      process.env.GOOGLE_SAFE_BROWSING_API_KEY = 'test-api-key';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await SecurityService.checkMaliciousUrl('https://example.com');

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody.client.clientId).toBe('url-shortener');
      expect(requestBody.client.clientVersion).toBeDefined();
    });

    it('should include API key in request URL', async () => {
      const apiKey = 'my-test-api-key-123';
      process.env.GOOGLE_SAFE_BROWSING_API_KEY = apiKey;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await SecurityService.checkMaliciousUrl('https://example.com');

      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toContain(`key=${apiKey}`);
    });
  });

  describe('validateUrlSafety', () => {
    it('should not throw for safe URLs', async () => {
      process.env.GOOGLE_SAFE_BROWSING_API_KEY = 'test-api-key';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await expect(
        SecurityService.validateUrlSafety('https://example.com')
      ).resolves.not.toThrow();
    });

    it('should throw error for malicious URLs', async () => {
      process.env.GOOGLE_SAFE_BROWSING_API_KEY = 'test-api-key';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          matches: [
            {
              threatType: 'MALWARE',
              platformType: 'ANY_PLATFORM',
              threat: { url: 'http://malicious.com' },
            },
          ],
        }),
      });

      await expect(
        SecurityService.validateUrlSafety('http://malicious.com')
      ).rejects.toThrow('potentially harmful');
    });

    it('should throw error with security message', async () => {
      process.env.GOOGLE_SAFE_BROWSING_API_KEY = 'test-api-key';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          matches: [{ threatType: 'MALWARE' }],
        }),
      });

      await expect(
        SecurityService.validateUrlSafety('http://malicious.com')
      ).rejects.toThrow('cannot be shortened for security reasons');
    });

    it('should not throw on API errors (fail open)', async () => {
      process.env.GOOGLE_SAFE_BROWSING_API_KEY = 'test-api-key';

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(
        SecurityService.validateUrlSafety('https://example.com')
      ).resolves.not.toThrow();

      consoleSpy.mockRestore();
    });
  });
});
