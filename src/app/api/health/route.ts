import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { shortUrls } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';

/**
 * Health check endpoint
 * Returns service status and database connectivity
 *
 * GET /api/health
 *
 * @returns {Object} Health status
 * @returns {string} status - "ok" or "error"
 * @returns {string} timestamp - ISO 8601 timestamp
 * @returns {Object} checks - Individual health checks
 * @returns {boolean} checks.database - Database connectivity status
 */
export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    // Check database connectivity
    const dbCheck = await checkDatabase();

    if (!dbCheck) {
      return NextResponse.json(
        {
          status: 'error',
          timestamp,
          checks: {
            database: false,
          },
          message: 'Database connectivity check failed',
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: 'ok',
      timestamp,
      checks: {
        database: true,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp,
        checks: {
          database: false,
        },
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}

/**
 * Check database connectivity
 * Performs a simple query to verify database is responsive
 */
async function checkDatabase(): Promise<boolean> {
  try {
    const db = await getDb();
    // Use a simple count query on existing table instead of raw SQL
    // This works consistently across both better-sqlite3 and D1
    await db.select({ count: sql`count(*)` }).from(shortUrls).limit(1);
    return true;
  } catch (error) {
    logger.error('Database health check failed', error instanceof Error ? error : undefined, {
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}
