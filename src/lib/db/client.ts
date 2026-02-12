import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

// For Cloudflare Workers (production)
export function getCloudflareDb(d1Database: D1Database) {
  return drizzle(d1Database, { schema });
}

// For local development with better-sqlite3
let localDbInstance: any = null;

export async function getLocalDb() {
  if (localDbInstance) {
    return localDbInstance;
  }

  const { drizzle: drizzleSqlite } = await import('drizzle-orm/better-sqlite3');
  const Database = (await import('better-sqlite3')).default;

  const sqlite = new Database(process.env.DATABASE_URL || 'local.db');
  localDbInstance = drizzleSqlite(sqlite, { schema });

  return localDbInstance;
}

// Helper to get the appropriate database instance
export async function getDb() {
  // In Cloudflare Workers/production, use getCloudflareContext
  if (typeof process !== 'undefined' && process.env.RUNTIME_PLATFORM === 'cloudflare') {
    try {
      const { getCloudflareContext } = await import('@opennextjs/cloudflare');
      const { env } = getCloudflareContext();
      return getCloudflareDb(env.DB);
    } catch (error) {
      throw new Error(
        'Failed to access Cloudflare D1 binding. Make sure you are running in Cloudflare Workers context.'
      );
    }
  }

  // Local development
  return getLocalDb();
}
