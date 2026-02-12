/**
 * Device Type Detection Utility
 * Parses User-Agent headers to detect device type, browser, and OS
 */

export type DeviceType = 'mobile' | 'desktop' | 'tablet' | 'unknown';

export interface UserAgentInfo {
  deviceType: DeviceType;
  browser: string;
  os: string;
}

/**
 * Detects browser from User-Agent string
 * @param userAgent - The User-Agent header string
 * @returns Browser name
 */
export function detectBrowser(userAgent: string | null | undefined): string {
  if (!userAgent) return 'Unknown';

  const ua = userAgent.toLowerCase();

  // Order matters: check more specific browsers first
  if (ua.includes('edg/')) return 'Edge';
  if (ua.includes('opr/') || ua.includes('opera')) return 'Opera';
  if (ua.includes('chrome/')) return 'Chrome';
  if (ua.includes('safari/') && !ua.includes('chrome')) return 'Safari';
  if (ua.includes('firefox/')) return 'Firefox';
  if (ua.includes('msie') || ua.includes('trident/')) return 'Internet Explorer';
  if (ua.includes('brave')) return 'Brave';
  if (ua.includes('vivaldi')) return 'Vivaldi';
  if (ua.includes('samsungbrowser')) return 'Samsung Internet';
  if (ua.includes('ucbrowser')) return 'UC Browser';

  return 'Other';
}

/**
 * Detects operating system from User-Agent string
 * @param userAgent - The User-Agent header string
 * @returns OS name
 */
export function detectOS(userAgent: string | null | undefined): string {
  if (!userAgent) return 'Unknown';

  const ua = userAgent.toLowerCase();

  // Mobile OS
  if (ua.includes('android')) return 'Android';
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) return 'iOS';
  if (ua.includes('windows phone')) return 'Windows Phone';
  if (ua.includes('blackberry')) return 'BlackBerry';
  if (ua.includes('kindle')) return 'Kindle';

  // Desktop OS
  if (ua.includes('win')) return 'Windows';
  if (ua.includes('mac')) return 'macOS';
  if (ua.includes('linux')) return 'Linux';
  if (ua.includes('ubuntu')) return 'Ubuntu';
  if (ua.includes('fedora')) return 'Fedora';
  if (ua.includes('chromeos')) return 'Chrome OS';
  if (ua.includes('x11')) return 'Unix';

  return 'Other';
}

/**
 * Parses User-Agent to extract all device information
 * @param userAgent - The User-Agent header string
 * @returns UserAgentInfo object with device type, browser, and OS
 */
export function parseUserAgent(userAgent: string | null | undefined): UserAgentInfo {
  return {
    deviceType: detectDeviceType(userAgent),
    browser: detectBrowser(userAgent),
    os: detectOS(userAgent),
  };
}

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
