/**
 * Validates if a string is a valid HTTP/HTTPS URL
 * @param url - The URL to validate
 * @returns True if valid, false otherwise
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const urlObj = new URL(url);

    // Check protocol
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return false;
    }

    // Check hostname exists and is not just dots, empty, or invalid characters
    const hostname = urlObj.hostname;
    if (!hostname || hostname === '.' || hostname === '..' ||
        /^\.+$/.test(hostname) || /^[?#]/.test(hostname)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Validates and normalizes a URL
 * @param url - The URL to validate and normalize
 * @returns Normalized URL or null if invalid
 */
export function validateAndNormalizeUrl(url: string): string | null {
  if (!isValidUrl(url)) {
    return null;
  }

  try {
    const urlObj = new URL(url);
    return urlObj.toString();
  } catch {
    return null;
  }
}

/**
 * Extracts the domain from a URL
 * @param url - The URL to extract domain from
 * @returns Domain string or null if invalid
 */
export function extractDomain(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return null;
  }
}
