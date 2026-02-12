/**
 * Unit Tests: Device Type Detection
 */

import { describe, it, expect } from 'vitest';
import { detectDeviceType } from '@/lib/utils/device-detector';

describe('detectDeviceType', () => {
  describe('Mobile Devices', () => {
    it('should detect iPhone', () => {
      const userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15';
      expect(detectDeviceType(userAgent)).toBe('mobile');
    });

    it('should detect Android mobile', () => {
      const userAgent = 'Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 Mobile Safari/537.36';
      expect(detectDeviceType(userAgent)).toBe('mobile');
    });

    it('should detect iPod', () => {
      const userAgent = 'Mozilla/5.0 (iPod touch; CPU iPhone OS 12_0 like Mac OS X)';
      expect(detectDeviceType(userAgent)).toBe('mobile');
    });

    it('should detect Windows Phone', () => {
      const userAgent = 'Mozilla/5.0 (Windows Phone 10.0; Android 6.0.1)';
      expect(detectDeviceType(userAgent)).toBe('mobile');
    });

    it('should detect BlackBerry', () => {
      const userAgent = 'Mozilla/5.0 (BlackBerry; U; BlackBerry 9900)';
      expect(detectDeviceType(userAgent)).toBe('mobile');
    });
  });

  describe('Tablet Devices', () => {
    it('should detect iPad', () => {
      const userAgent = 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15';
      expect(detectDeviceType(userAgent)).toBe('tablet');
    });

    it('should detect Android tablet', () => {
      const userAgent = 'Mozilla/5.0 (Linux; Android 11; SM-T870) AppleWebKit/537.36';
      expect(detectDeviceType(userAgent)).toBe('tablet');
    });

    it('should detect Kindle', () => {
      const userAgent = 'Mozilla/5.0 (Linux; Android 4.4.3; KFTHWI Build/KTU84M)';
      expect(detectDeviceType(userAgent)).toBe('tablet');
    });

    it('should detect Nexus tablet', () => {
      const userAgent = 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 7 Build/MOB30X)';
      expect(detectDeviceType(userAgent)).toBe('tablet');
    });
  });

  describe('Desktop Devices', () => {
    it('should detect Windows desktop', () => {
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
      expect(detectDeviceType(userAgent)).toBe('desktop');
    });

    it('should detect macOS desktop', () => {
      const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
      expect(detectDeviceType(userAgent)).toBe('desktop');
    });

    it('should detect Linux desktop', () => {
      const userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36';
      expect(detectDeviceType(userAgent)).toBe('desktop');
    });

    it('should detect Ubuntu desktop', () => {
      const userAgent = 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64) AppleWebKit/537.36';
      expect(detectDeviceType(userAgent)).toBe('desktop');
    });
  });

  describe('Edge Cases', () => {
    it('should return unknown for null user agent', () => {
      expect(detectDeviceType(null)).toBe('unknown');
    });

    it('should return unknown for undefined user agent', () => {
      expect(detectDeviceType(undefined)).toBe('unknown');
    });

    it('should return unknown for empty string', () => {
      expect(detectDeviceType('')).toBe('unknown');
    });

    it('should return unknown for unrecognized user agent', () => {
      const userAgent = 'MyCustomBot/1.0';
      expect(detectDeviceType(userAgent)).toBe('unknown');
    });
  });

  describe('Case Insensitivity', () => {
    it('should detect device type regardless of case', () => {
      const userAgent = 'MOZILLA/5.0 (IPHONE; CPU IPHONE OS 15_0)';
      expect(detectDeviceType(userAgent)).toBe('mobile');
    });
  });

  describe('Priority Ordering', () => {
    it('should prioritize tablet over mobile (iPad contains both patterns)', () => {
      const userAgent = 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X)';
      expect(detectDeviceType(userAgent)).toBe('tablet');
    });

    it('should correctly identify Android tablet vs mobile', () => {
      const mobileUA = 'Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 Mobile';
      const tabletUA = 'Mozilla/5.0 (Linux; Android 12; SM-T870 Tablet) AppleWebKit/537.36';

      expect(detectDeviceType(mobileUA)).toBe('mobile');
      expect(detectDeviceType(tabletUA)).toBe('tablet');
    });
  });
});
