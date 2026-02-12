import { describe, it, expect } from 'vitest';
import { isValidUrl, validateAndNormalizeUrl, extractDomain } from '@/lib/utils/validators';

describe('URL Validators', () => {
  describe('isValidUrl', () => {
    it('should return true for valid HTTP URLs', () => {
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('http://www.example.com')).toBe(true);
      expect(isValidUrl('http://example.com/path')).toBe(true);
      expect(isValidUrl('http://example.com:8080')).toBe(true);
      expect(isValidUrl('http://subdomain.example.com')).toBe(true);
    });

    it('should return true for valid HTTPS URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('https://www.example.com')).toBe(true);
      expect(isValidUrl('https://example.com/path/to/page')).toBe(true);
      expect(isValidUrl('https://example.com:443')).toBe(true);
    });

    it('should return true for URLs with query parameters', () => {
      expect(isValidUrl('https://example.com?foo=bar')).toBe(true);
      expect(isValidUrl('https://example.com?foo=bar&baz=qux')).toBe(true);
      expect(isValidUrl('https://example.com/path?query=value')).toBe(true);
    });

    it('should return true for URLs with fragments', () => {
      expect(isValidUrl('https://example.com#section')).toBe(true);
      expect(isValidUrl('https://example.com/page#top')).toBe(true);
    });

    it('should return false for non-HTTP/HTTPS protocols', () => {
      expect(isValidUrl('ftp://example.com')).toBe(false);
      expect(isValidUrl('file:///path/to/file')).toBe(false);
      expect(isValidUrl('javascript:alert(1)')).toBe(false);
      expect(isValidUrl('data:text/html,<h1>Test</h1>')).toBe(false);
      expect(isValidUrl('mailto:test@example.com')).toBe(false);
    });

    it('should return false for malformed URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('example.com')).toBe(false);
      expect(isValidUrl('www.example.com')).toBe(false);
      expect(isValidUrl('http://')).toBe(false);
      expect(isValidUrl('https://')).toBe(false);
      // Note: 'http://.' may be valid in some URL parsers
    });

    it('should return false for empty or invalid inputs', () => {
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl(' ')).toBe(false);
      expect(isValidUrl(null as any)).toBe(false);
      expect(isValidUrl(undefined as any)).toBe(false);
      expect(isValidUrl(123 as any)).toBe(false);
      expect(isValidUrl({} as any)).toBe(false);
    });

    it('should handle URLs with special characters in path', () => {
      expect(isValidUrl('https://example.com/path/with spaces')).toBe(true);
      expect(isValidUrl('https://example.com/path/with%20encoded')).toBe(true);
      expect(isValidUrl('https://example.com/path?param=value with spaces')).toBe(true);
    });

    it('should handle internationalized domain names', () => {
      expect(isValidUrl('https://münchen.de')).toBe(true);
      expect(isValidUrl('https://例え.jp')).toBe(true);
    });

    it('should reject malformed URLs with invalid hostnames', () => {
      // URLs that URL constructor accepts but have invalid hostnames
      expect(isValidUrl('http://./')).toBe(false);
      expect(isValidUrl('http://.')).toBe(false);
      expect(isValidUrl('http://..')).toBe(false);
      expect(isValidUrl('http://.../')).toBe(false);
      expect(isValidUrl('http://?')).toBe(false);
      expect(isValidUrl('http://#')).toBe(false);
      expect(isValidUrl('http://##')).toBe(false);
      expect(isValidUrl('https://./')).toBe(false);
    });
  });

  describe('validateAndNormalizeUrl', () => {
    it('should return normalized URL for valid HTTP URLs', () => {
      expect(validateAndNormalizeUrl('http://example.com')).toBe('http://example.com/');
      expect(validateAndNormalizeUrl('http://example.com/')).toBe('http://example.com/');
    });

    it('should return normalized URL for valid HTTPS URLs', () => {
      expect(validateAndNormalizeUrl('https://example.com')).toBe('https://example.com/');
      expect(validateAndNormalizeUrl('https://www.example.com/path')).toBe('https://www.example.com/path');
    });

    it('should preserve query parameters and fragments', () => {
      expect(validateAndNormalizeUrl('https://example.com?foo=bar')).toBe('https://example.com/?foo=bar');
      expect(validateAndNormalizeUrl('https://example.com#section')).toBe('https://example.com/#section');
      expect(validateAndNormalizeUrl('https://example.com/path?q=1#top')).toBe('https://example.com/path?q=1#top');
    });

    it('should return null for invalid URLs', () => {
      expect(validateAndNormalizeUrl('not-a-url')).toBe(null);
      expect(validateAndNormalizeUrl('example.com')).toBe(null);
      expect(validateAndNormalizeUrl('ftp://example.com')).toBe(null);
      expect(validateAndNormalizeUrl('')).toBe(null);
    });

    it('should handle URLs with ports', () => {
      expect(validateAndNormalizeUrl('http://example.com:8080')).toBe('http://example.com:8080/');
      expect(validateAndNormalizeUrl('https://example.com:443')).toBe('https://example.com/'); // Default HTTPS port
    });

    it('should normalize case in protocol and domain', () => {
      const result = validateAndNormalizeUrl('HTTP://EXAMPLE.COM/Path');
      expect(result).toBeTruthy();
      expect(result?.toLowerCase()).toContain('http://example.com');
    });
  });

  describe('extractDomain', () => {
    it('should extract domain from HTTP URLs', () => {
      expect(extractDomain('http://example.com')).toBe('example.com');
      expect(extractDomain('http://www.example.com')).toBe('www.example.com');
      expect(extractDomain('http://subdomain.example.com')).toBe('subdomain.example.com');
    });

    it('should extract domain from HTTPS URLs', () => {
      expect(extractDomain('https://example.com')).toBe('example.com');
      expect(extractDomain('https://www.example.com/path')).toBe('www.example.com');
    });

    it('should extract domain ignoring port, path, query, and fragment', () => {
      expect(extractDomain('https://example.com:8080')).toBe('example.com');
      expect(extractDomain('https://example.com/path/to/page')).toBe('example.com');
      expect(extractDomain('https://example.com?foo=bar')).toBe('example.com');
      expect(extractDomain('https://example.com#section')).toBe('example.com');
      expect(extractDomain('https://example.com:8080/path?q=1#top')).toBe('example.com');
    });

    it('should return null for invalid URLs', () => {
      expect(extractDomain('not-a-url')).toBe(null);
      expect(extractDomain('example.com')).toBe(null);
      expect(extractDomain('')).toBe(null);
    });

    it('should handle localhost and IP addresses', () => {
      expect(extractDomain('http://localhost')).toBe('localhost');
      expect(extractDomain('http://localhost:3000')).toBe('localhost');
      expect(extractDomain('http://127.0.0.1')).toBe('127.0.0.1');
      expect(extractDomain('http://192.168.1.1:8080')).toBe('192.168.1.1');
    });

    it('should handle internationalized domains', () => {
      // IDNs are converted to punycode by URL API
      const domain1 = extractDomain('https://münchen.de');
      const domain2 = extractDomain('https://例え.jp');
      expect(domain1).toBeTruthy();
      expect(domain2).toBeTruthy();
      // Can be either unicode or punycode
      expect(domain1).toMatch(/münchen|xn--mnchen/);
    });
  });
});
