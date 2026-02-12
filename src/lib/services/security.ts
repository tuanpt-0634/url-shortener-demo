/**
 * Security Service
 * Handles malicious URL detection and security checks
 */

interface SafeBrowsingResponse {
  matches?: Array<{
    threatType: string;
    platformType: string;
    threat: {
      url: string;
    };
  }>;
}

export class SecurityService {
  /**
   * Checks if a URL is malicious using Google Safe Browsing API
   * Returns true if URL is safe, false if malicious
   */
  static async checkMaliciousUrl(url: string): Promise<boolean> {
    const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;

    // If no API key is configured, skip the check (development mode)
    if (!apiKey) {
      console.warn('Google Safe Browsing API key not configured. Skipping malicious URL check.');
      return true;
    }

    try {
      const response = await fetch(
        `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client: {
              clientId: 'url-shortener',
              clientVersion: '1.0.0',
            },
            threatInfo: {
              threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE'],
              platformTypes: ['ANY_PLATFORM'],
              threatEntryTypes: ['URL'],
              threatEntries: [{ url }],
            },
          }),
        }
      );

      if (!response.ok) {
        console.error('Google Safe Browsing API error:', response.statusText);
        // On API error, allow the URL (fail open to not block legitimate users)
        return true;
      }

      const data: SafeBrowsingResponse = await response.json();

      // If matches found, URL is malicious
      if (data.matches && data.matches.length > 0) {
        console.log('Malicious URL detected:', url, data.matches);
        return false;
      }

      // No matches = URL is safe
      return true;
    } catch (error) {
      console.error('Error checking URL safety:', error);
      // On error, allow the URL (fail open)
      return true;
    }
  }

  /**
   * Validates if a URL is safe to shorten
   * Throws an error if URL is malicious
   */
  static async validateUrlSafety(url: string): Promise<void> {
    const isSafe = await this.checkMaliciousUrl(url);

    if (!isSafe) {
      throw new Error(
        'This URL has been identified as potentially harmful and cannot be shortened for security reasons.'
      );
    }
  }
}
