import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const shortUrls = sqliteTable(
  'short_urls',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    slug: text('slug').notNull().unique(),
    originalUrl: text('original_url').notNull(),
    analyticsToken: text('analytics_token').notNull().unique(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex('slug_idx').on(table.slug),
    tokenIdx: uniqueIndex('analytics_token_idx').on(table.analyticsToken),
  })
);

export const clickEvents = sqliteTable(
  'click_events',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    shortUrlId: integer('short_url_id')
      .notNull()
      .references(() => shortUrls.id),
    timestamp: text('timestamp').notNull(),
    referrer: text('referrer'),
    userAgent: text('user_agent'),
    deviceType: text('device_type'),
    browser: text('browser'),
    os: text('os'),
    ipAddress: text('ip_address'),
  },
  (table) => ({
    shortUrlIdx: index('click_events_short_url_idx').on(table.shortUrlId),
    timeseriesIdx: index('click_events_timeseries_idx').on(table.shortUrlId, table.timestamp),
  })
);

export const analyticsSummary = sqliteTable(
  'analytics_summary',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    shortUrlId: integer('short_url_id')
      .notNull()
      .references(() => shortUrls.id),
    periodStart: text('period_start').notNull(),
    periodEnd: text('period_end').notNull(),
    periodType: text('period_type').notNull(),
    totalClicks: integer('total_clicks').notNull().default(0),
    clicksByDevice: text('clicks_by_device'),
    clicksByReferrer: text('clicks_by_referrer'),
    createdAt: text('created_at').notNull(),
  },
  (table) => ({
    uniquePeriod: uniqueIndex('analytics_summary_unique_period').on(
      table.shortUrlId,
      table.periodStart,
      table.periodType
    ),
    periodTypeIdx: index('analytics_summary_period_type_idx').on(table.periodType),
  })
);
