import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '@/lib/db/schema';
import { shortUrls, clickEvents, analyticsSummary } from '@/lib/db/schema';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

/**
 * Create a test database instance with migrations
 */
export async function getTestDb() {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });

  // Run migrations
  try {
    migrate(db, { migrationsFolder: './src/lib/db/migrations' });
  } catch (error) {
    // If migrations folder doesn't exist, create tables manually
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS short_urls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT NOT NULL UNIQUE,
        original_url TEXT NOT NULL,
        analytics_token TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS click_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        short_url_id INTEGER NOT NULL,
        timestamp TEXT NOT NULL,
        referrer TEXT,
        user_agent TEXT,
        device_type TEXT,
        ip_address TEXT,
        FOREIGN KEY (short_url_id) REFERENCES short_urls(id)
      );

      CREATE TABLE IF NOT EXISTS analytics_summary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        short_url_id INTEGER NOT NULL,
        period_start TEXT NOT NULL,
        period_end TEXT NOT NULL,
        period_type TEXT NOT NULL,
        total_clicks INTEGER NOT NULL DEFAULT 0,
        clicks_by_device TEXT,
        clicks_by_referrer TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (short_url_id) REFERENCES short_urls(id)
      );

      CREATE INDEX IF NOT EXISTS click_events_short_url_idx ON click_events(short_url_id);
      CREATE INDEX IF NOT EXISTS click_events_timeseries_idx ON click_events(short_url_id, timestamp);
    `);
  }

  // Insert a test short URL for foreign key constraints
  await db.insert(shortUrls).values({
    id: 1,
    slug: 'test123',
    originalUrl: 'https://example.com',
    analyticsToken: 'test-token-12345678901234567890',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return db;
}

/**
 * Clean up test database
 */
export async function cleanupTestDb(db: any) {
  if (db && db.run) {
    // Clear all tables
    await db.delete(clickEvents);
    await db.delete(analyticsSummary);
    await db.delete(shortUrls);
  }
}

