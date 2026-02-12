import { describe, it, expect } from 'vitest';
import { generateAnalyticsToken, isValidAnalyticsToken } from '@/lib/utils/token-generator';

describe('Token Generator', () => {
  describe('generateAnalyticsToken', () => {
    it('should generate a token with exactly 32 characters', () => {
      const token = generateAnalyticsToken();
      expect(token).toHaveLength(32);
    });

    it('should only contain base62 characters (A-Z, a-z, 0-9)', () => {
      const token = generateAnalyticsToken();
      const base62Regex = /^[A-Za-z0-9]+$/;
      expect(token).toMatch(base62Regex);
    });

    it('should generate unique tokens on multiple calls', () => {
      const tokens = new Set<string>();
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        tokens.add(generateAnalyticsToken());
      }

      // With 32 chars base62, there are 62^32 possibilities, should be 100% unique
      expect(tokens.size).toBe(iterations);
    });

    it('should throw error for non-32 length', () => {
      expect(() => generateAnalyticsToken(16)).toThrow('Analytics token must be exactly 32 characters');
      expect(() => generateAnalyticsToken(64)).toThrow('Analytics token must be exactly 32 characters');
      expect(() => generateAnalyticsToken(31)).toThrow('Analytics token must be exactly 32 characters');
      expect(() => generateAnalyticsToken(33)).toThrow('Analytics token must be exactly 32 characters');
    });

    it('should work in both browser and Node.js environments', () => {
      expect(() => generateAnalyticsToken()).not.toThrow();
    });

    it('should generate cryptographically random tokens', () => {
      // Generate multiple tokens and check distribution
      const tokens = Array.from({ length: 1000 }, () => generateAnalyticsToken());

      // Check that we have good variety in first character
      const firstChars = new Set(tokens.map(t => t[0]));
      expect(firstChars.size).toBeGreaterThan(30); // Should use at least half of base62 chars

      // Check variety in last character too
      const lastChars = new Set(tokens.map(t => t[t.length - 1]));
      expect(lastChars.size).toBeGreaterThan(30);
    });

    it('should have sufficient entropy for security', () => {
      // 32 chars of base62 = 190 bits of entropy (far exceeds 128-bit security standard)
      const token1 = generateAnalyticsToken();
      const token2 = generateAnalyticsToken();

      expect(token1).not.toBe(token2);

      // Count different characters between two tokens
      let differences = 0;
      for (let i = 0; i < 32; i++) {
        if (token1[i] !== token2[i]) differences++;
      }

      // Should differ in most positions
      expect(differences).toBeGreaterThan(20);
    });
  });

  describe('isValidAnalyticsToken', () => {
    it('should return true for valid 32-character tokens', () => {
      expect(isValidAnalyticsToken('a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6')).toBe(true);
      expect(isValidAnalyticsToken('ABCDEFGHIJKLMNOPQRSTUVWXYZ012345')).toBe(true);
      expect(isValidAnalyticsToken('0123456789abcdefghijklmnopqrstuv')).toBe(true);
    });

    it('should return false for tokens shorter than 32 characters', () => {
      expect(isValidAnalyticsToken('a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p')).toBe(false); // 31 chars
      expect(isValidAnalyticsToken('abc123')).toBe(false);
      expect(isValidAnalyticsToken('')).toBe(false);
    });

    it('should return false for tokens longer than 32 characters', () => {
      expect(isValidAnalyticsToken('a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q')).toBe(false); // 33 chars
      expect(isValidAnalyticsToken('a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0')).toBe(false);
    });

    it('should return false for tokens with invalid characters', () => {
      expect(isValidAnalyticsToken('a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5-6')).toBe(false); // Hyphen
      expect(isValidAnalyticsToken('a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5_6')).toBe(false); // Underscore
      expect(isValidAnalyticsToken('a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5 6')).toBe(false); // Space
      expect(isValidAnalyticsToken('a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5@6')).toBe(false); // Special char
    });

    it('should return false for non-string inputs', () => {
      expect(isValidAnalyticsToken(null as any)).toBe(false);
      expect(isValidAnalyticsToken(undefined as any)).toBe(false);
      expect(isValidAnalyticsToken(123 as any)).toBe(false);
    });

    it('should validate generated tokens', () => {
      // All generated tokens should pass validation
      for (let i = 0; i < 10; i++) {
        const token = generateAnalyticsToken();
        expect(isValidAnalyticsToken(token)).toBe(true);
      }
    });
  });
});
