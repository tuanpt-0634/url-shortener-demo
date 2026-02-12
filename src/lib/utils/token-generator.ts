/**
 * Base62 character set for token generation
 * Uses alphanumeric characters only (A-Z, a-z, 0-9)
 */
const BASE62_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Generates a cryptographically random analytics token
 * @param length - Length of the token (default: 32)
 * @returns Random base62 token
 */
export function generateAnalyticsToken(length: number = 32): string {
  if (length !== 32) {
    throw new Error('Analytics token must be exactly 32 characters');
  }

  const randomBytes =
    typeof crypto !== 'undefined' && crypto.getRandomValues
      ? crypto.getRandomValues(new Uint8Array(length))
      : Buffer.from(
          Array.from({ length }, () => Math.floor(Math.random() * 256))
        );

  let token = '';
  for (let i = 0; i < length; i++) {
    token += BASE62_CHARS[randomBytes[i] % BASE62_CHARS.length];
  }

  return token;
}

/**
 * Validates if a string is a valid analytics token format
 * @param token - The token to validate
 * @returns True if valid, false otherwise
 */
export function isValidAnalyticsToken(token: string): boolean {
  return /^[A-Za-z0-9]{32}$/.test(token);
}
