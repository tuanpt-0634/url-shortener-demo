import { eq } from 'drizzle-orm';
import { shortUrls } from '@/lib/db/schema';
import { generateSlug } from '@/lib/utils/slug-generator';
import { generateAnalyticsToken } from '@/lib/utils/token-generator';
import { validateAndNormalizeUrl } from '@/lib/utils/validators';
import type { ShortUrl } from '@/lib/types';

interface CreateShortUrlParams {
  originalUrl: string;
  db: any; // Database instance from getDb() or getCloudflareDb()
}

interface CreateShortUrlResult {
  shortUrl: ShortUrl;
  isNewUrl: boolean;
}

const MAX_RETRIES = 3;
const INITIAL_SLUG_LENGTH = 6;

/**
 * URL Shortener Service
 * Handles creation and management of short URLs
 */
export class UrlShortenerService {
  /**
   * Creates a new short URL with unique slug and analytics token
   * Per FR-006: Always creates new short URL even if same original URL submitted
   * Implements collision retry logic: max 3 retries, incrementing length by 1
   */
  static async createShortUrl({
    originalUrl,
    db,
  }: CreateShortUrlParams): Promise<CreateShortUrlResult> {
    // Validate and normalize the URL
    const normalizedUrl = validateAndNormalizeUrl(originalUrl);
    if (!normalizedUrl) {
      throw new Error('Invalid URL format. Please provide a valid HTTP or HTTPS URL.');
    }

    // FR-006: Always create new short URL, even for duplicate original URLs
    // This allows separate analytics tracking per submission

    // Generate unique slug with collision retry
    let slug: string | null = null;
    let slugLength = INITIAL_SLUG_LENGTH;
    let retryCount = 0;

    while (!slug && retryCount < MAX_RETRIES) {
      const candidateSlug = generateSlug(slugLength);

      // Check for collision
      const collision = await db
        .select()
        .from(shortUrls)
        .where(eq(shortUrls.slug, candidateSlug))
        .limit(1);

      if (!collision || collision.length === 0) {
        slug = candidateSlug;
        break;
      }

      // Collision detected, increment length and retry
      retryCount++;
      slugLength = Math.min(slugLength + 1, 8); // Max 8 chars

      if (retryCount >= MAX_RETRIES) {
        throw new Error(
          'Unable to generate unique slug after multiple retries. Please try again.'
        );
      }
    }

    // Generate analytics token
    const analyticsToken = generateAnalyticsToken();

    // Create timestamp
    const now = new Date().toISOString();

    // Insert into database
    const newUrl = await db
      .insert(shortUrls)
      .values({
        slug,
        originalUrl: normalizedUrl,
        analyticsToken,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return {
      shortUrl: newUrl[0],
      isNewUrl: true,
    };
  }

  /**
   * Retrieves a short URL by its slug
   */
  static async getBySlug(slug: string, db: any): Promise<ShortUrl | null> {
    const result = await db.select().from(shortUrls).where(eq(shortUrls.slug, slug)).limit(1);

    return result && result.length > 0 ? result[0] : null;
  }

  /**
   * Retrieves a short URL by its analytics token
   */
  static async getByToken(token: string, db: any): Promise<ShortUrl | null> {
    const result = await db
      .select()
      .from(shortUrls)
      .where(eq(shortUrls.analyticsToken, token))
      .limit(1);

    return result && result.length > 0 ? result[0] : null;
  }
}
