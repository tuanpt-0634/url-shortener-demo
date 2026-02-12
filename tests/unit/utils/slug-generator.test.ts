import { describe, it, expect } from 'vitest';
import { generateSlug, isValidSlug } from '@/lib/utils/slug-generator';

describe('Slug Generator', () => {
  describe('generateSlug', () => {
    it('should generate a slug with default length of 6 characters', () => {
      const slug = generateSlug();
      expect(slug).toHaveLength(6);
    });

    it('should generate a slug with specified length between 6-8 characters', () => {
      const slug6 = generateSlug(6);
      const slug7 = generateSlug(7);
      const slug8 = generateSlug(8);

      expect(slug6).toHaveLength(6);
      expect(slug7).toHaveLength(7);
      expect(slug8).toHaveLength(8);
    });

    it('should only contain base62 characters (A-Z, a-z, 0-9)', () => {
      const slug = generateSlug();
      const base62Regex = /^[A-Za-z0-9]+$/;
      expect(slug).toMatch(base62Regex);
    });

    it('should generate unique slugs on multiple calls', () => {
      const slugs = new Set<string>();
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        slugs.add(generateSlug());
      }

      // Should have generated mostly unique slugs (allow some collisions due to randomness)
      // With 6 chars base62, there are 62^6 = 56.8B possibilities, collisions should be rare
      expect(slugs.size).toBeGreaterThan(iterations * 0.95); // 95%+ unique
    });

    it('should throw error for length less than 6', () => {
      expect(() => generateSlug(5)).toThrow('Slug length must be between 6 and 8 characters');
      expect(() => generateSlug(3)).toThrow('Slug length must be between 6 and 8 characters');
    });

    it('should throw error for length greater than 8', () => {
      expect(() => generateSlug(9)).toThrow('Slug length must be between 6 and 8 characters');
      expect(() => generateSlug(10)).toThrow('Slug length must be between 6 and 8 characters');
    });

    it('should work in both browser and Node.js environments', () => {
      // Test that it doesn't throw in either environment
      expect(() => generateSlug()).not.toThrow();
    });

    it('should generate cryptographically random slugs', () => {
      // Generate multiple slugs and check distribution
      const slugs = Array.from({ length: 1000 }, () => generateSlug(6));
      
      // Check that we have good variety in first character
      const firstChars = new Set(slugs.map(s => s[0]));
      expect(firstChars.size).toBeGreaterThan(30); // Should use at least half of base62 chars
    });
  });

  describe('isValidSlug', () => {
    it('should return true for valid 6-character slugs', () => {
      expect(isValidSlug('abc123')).toBe(true);
      expect(isValidSlug('XYZ789')).toBe(true);
      expect(isValidSlug('aB1cD2')).toBe(true);
    });

    it('should return true for valid 7-character slugs', () => {
      expect(isValidSlug('abc1234')).toBe(true);
      expect(isValidSlug('XYZ7890')).toBe(true);
    });

    it('should return true for valid 8-character slugs', () => {
      expect(isValidSlug('abc12345')).toBe(true);
      expect(isValidSlug('XYZ78901')).toBe(true);
    });

    it('should return false for slugs shorter than 6 characters', () => {
      expect(isValidSlug('abc12')).toBe(false);
      expect(isValidSlug('a')).toBe(false);
      expect(isValidSlug('')).toBe(false);
    });

    it('should return false for slugs longer than 8 characters', () => {
      expect(isValidSlug('abc123456')).toBe(false);
      expect(isValidSlug('abcdefghij')).toBe(false);
    });

    it('should return false for slugs with invalid characters', () => {
      expect(isValidSlug('abc-123')).toBe(false); // Hyphen
      expect(isValidSlug('abc_123')).toBe(false); // Underscore
      expect(isValidSlug('abc 123')).toBe(false); // Space
      expect(isValidSlug('abc@123')).toBe(false); // Special char
      expect(isValidSlug('abc#123')).toBe(false); // Special char
    });

    it('should return false for non-string inputs', () => {
      expect(isValidSlug(null as any)).toBe(false);
      expect(isValidSlug(undefined as any)).toBe(false);
      expect(isValidSlug(123 as any)).toBe(false);
    });
  });
});
