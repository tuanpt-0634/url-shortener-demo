/**
 * Base62 character set for slug generation
 * Uses alphanumeric characters only (A-Z, a-z, 0-9)
 */
const BASE62_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Generates a random slug using base62 encoding
 * @param length - Length of the slug (default: 6)
 * @returns Random base62 slug
 */
export function generateSlug(length: number = 6): string {
  if (length < 6 || length > 8) {
    throw new Error('Slug length must be between 6 and 8 characters');
  }

  const randomBytes =
    typeof crypto !== 'undefined' && crypto.getRandomValues
      ? crypto.getRandomValues(new Uint8Array(length))
      : Buffer.from(
          Array.from({ length }, () => Math.floor(Math.random() * 256))
        );

  let slug = '';
  for (let i = 0; i < length; i++) {
    slug += BASE62_CHARS[randomBytes[i] % BASE62_CHARS.length];
  }

  return slug;
}

/**
 * Validates if a string is a valid slug format
 * @param slug - The slug to validate
 * @returns True if valid, false otherwise
 */
export function isValidSlug(slug: string): boolean {
  return /^[A-Za-z0-9]{6,8}$/.test(slug);
}
