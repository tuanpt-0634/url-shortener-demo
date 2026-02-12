/**
 * Device Type Detection Utility
 * Parses User-Agent headers to detect device type (mobile/desktop/tablet/unknown)
 */

export type DeviceType = 'mobile' | 'desktop' | 'tablet' | 'unknown';

/**
 * Detects device type from User-Agent string
 * @param userAgent - The User-Agent header string
 * @returns DeviceType - One of: mobile, desktop, tablet, unknown
 */
export function detectDeviceType(userAgent: string | null | undefined): DeviceType {
  if (!userAgent) {
    return 'unknown';
  }

  const ua = userAgent.toLowerCase();

  // Check for tablet first (before mobile, as tablets may contain "mobile" keyword)
  const tabletPatterns = [
    /ipad/,
    /tablet/,
    /kindle/,
    /kfthwi/,  // Kindle Fire
    /kfapwi/,  // Kindle Fire
    /playbook/,
    /nexus 7|nexus 10/,
    /xoom/,
    /sm-t/,
    /tab/,
  ];

  if (tabletPatterns.some(pattern => pattern.test(ua))) {
    return 'tablet';
  }

  // Check for mobile devices
  const mobilePatterns = [
    /android.*mobile/,
    /iphone/,
    /ipod/,
    /blackberry/,
    /windows phone/,
    /opera mini/,
    /mobile/,
    /phone/,
  ];

  if (mobilePatterns.some(pattern => pattern.test(ua))) {
    return 'mobile';
  }

  // Check for desktop indicators
  const desktopPatterns = [
    /windows nt/,
    /macintosh/,
    /linux/,
    /x11/,
  ];

  if (desktopPatterns.some(pattern => pattern.test(ua))) {
    return 'desktop';
  }

  // Default to unknown if no patterns match
  return 'unknown';
}
