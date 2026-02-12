# Data Model: URL Shortener with Analytics

**Feature**: 001-url-shortener
**Date**: 2026-02-12
**Phase**: 1 - Data Model Design

## Overview

The data model supports URL shortening with analytics tracking. It consists of three main entities: Short URLs (core mappings), Click Events (individual clicks), and Analytics Summary (pre-aggregated statistics). All timestamps stored in UTC for consistency.

## Entity Relationships

```
┌─────────────────┐
│   short_urls    │
│  (Core Entity)  │
└────────┬────────┘
         │
         │ 1:N
         │
         ▼
┌─────────────────┐      ┌──────────────────────┐
│  click_events   │──────│ analytics_summary    │
│ (Raw Tracking)  │ N:1  │  (Aggregated Stats)  │
└─────────────────┘      └──────────────────────┘
```

## Entities

### 1. Short URL

**Purpose**: Represents a shortened URL mapping with its analytics token

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique identifier |
| slug | TEXT | UNIQUE, NOT NULL, INDEX | Short code (6-8 chars, base62) |
| original_url | TEXT | NOT NULL | Original long URL |
| analytics_token | TEXT | UNIQUE, NOT NULL, INDEX | Secret token for analytics access (32 chars) |
| created_at | TEXT | NOT NULL | ISO 8601 timestamp (UTC) |
| updated_at | TEXT | NOT NULL | ISO 8601 timestamp (UTC) |

**Indexes**:
- PRIMARY KEY on `id`
- UNIQUE INDEX on `slug` (for O(1) redirect lookups)
- UNIQUE INDEX on `analytics_token` (for analytics access)

**Validation Rules**:
- `slug`: Must match `/^[A-Za-z0-9]{6,8}$/`
- `original_url`: Must be valid HTTP/HTTPS URL
- `analytics_token`: Must match `/^[A-Za-z0-9]{32}$/`
- `created_at`, `updated_at`: Must be ISO 8601 format

**Example**:
```json
{
  "id": 1,
  "slug": "abc123",
  "original_url": "https://example.com/very/long/url/with/many/parameters",
  "analytics_token": "k7Jx9pQm2wR5nY8tL3vB1zC6fH4sD0gA",
  "created_at": "2026-02-12T10:30:00.000Z",
  "updated_at": "2026-02-12T10:30:00.000Z"
}
```

---

### 2. Click Event

**Purpose**: Records each individual click/access of a short URL for analytics

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique identifier |
| short_url_id | INTEGER | NOT NULL, FOREIGN KEY, INDEX | Reference to short_urls.id |
| timestamp | TEXT | NOT NULL, INDEX | ISO 8601 timestamp (UTC) |
| referrer | TEXT | NULL | HTTP Referer header (source of click) |
| user_agent | TEXT | NULL | User-Agent header |
| device_type | TEXT | NULL | Detected device type (mobile/desktop/tablet) |
| ip_address | TEXT | NULL | Client IP (optional, for geo-tracking) |

**Indexes**:
- PRIMARY KEY on `id`
- INDEX on `short_url_id` (for filtering by URL)
- COMPOSITE INDEX on `(short_url_id, timestamp)` (for time-series queries)

**Validation Rules**:
- `short_url_id`: Must reference valid short_urls.id
- `timestamp`: Must be ISO 8601 format
- `device_type`: ENUM ('mobile', 'desktop', 'tablet', 'unknown')

**Example**:
```json
{
  "id": 1001,
  "short_url_id": 1,
  "timestamp": "2026-02-12T14:45:23.123Z",
  "referrer": "https://twitter.com",
  "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)...",
  "device_type": "mobile",
  "ip_address": "203.0.113.42"
}
```

---

### 3. Analytics Summary

**Purpose**: Pre-aggregated statistics for faster dashboard queries (hourly/daily rollups)

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique identifier |
| short_url_id | INTEGER | NOT NULL, FOREIGN KEY, INDEX | Reference to short_urls.id |
| period_start | TEXT | NOT NULL, INDEX | Period start (ISO 8601, UTC) |
| period_end | TEXT | NOT NULL | Period end (ISO 8601, UTC) |
| period_type | TEXT | NOT NULL | Granularity (hour/day/week) |
| total_clicks | INTEGER | NOT NULL DEFAULT 0 | Total clicks in period |
| clicks_by_device | TEXT | NULL | JSON object: {"mobile": 10, "desktop": 5} |
| clicks_by_referrer | TEXT | NULL | JSON object: {"twitter.com": 8, "direct": 7} |
| created_at | TEXT | NOT NULL | ISO 8601 timestamp (UTC) |

**Indexes**:
- PRIMARY KEY on `id`
- COMPOSITE UNIQUE INDEX on `(short_url_id, period_start, period_type)` (prevent duplicates)
- INDEX on `period_type` (for filtering by granularity)

**Validation Rules**:
- `period_type`: ENUM ('hour', 'day', 'week')
- `clicks_by_device`, `clicks_by_referrer`: Valid JSON objects

**Example**:
```json
{
  "id": 501,
  "short_url_id": 1,
  "period_start": "2026-02-12T00:00:00.000Z",
  "period_end": "2026-02-12T23:59:59.999Z",
  "period_type": "day",
  "total_clicks": 127,
  "clicks_by_device": "{\"mobile\": 78, \"desktop\": 45, \"tablet\": 4}",
  "clicks_by_referrer": "{\"twitter.com\": 52, \"facebook.com\": 31, \"direct\": 44}",
  "created_at": "2026-02-13T01:00:00.000Z"
}
```

---

## Database Schema (SQL)

### Drizzle ORM Schema (TypeScript)

```typescript
// src/lib/db/schema.ts
import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const shortUrls = sqliteTable('short_urls', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  originalUrl: text('original_url').notNull(),
  analyticsToken: text('analytics_token').notNull().unique(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => ({
  slugIdx: uniqueIndex('slug_idx').on(table.slug),
  tokenIdx: uniqueIndex('analytics_token_idx').on(table.analyticsToken),
}));

export const clickEvents = sqliteTable('click_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  shortUrlId: integer('short_url_id').notNull().references(() => shortUrls.id),
  timestamp: text('timestamp').notNull(),
  referrer: text('referrer'),
  userAgent: text('user_agent'),
  deviceType: text('device_type'),
  ipAddress: text('ip_address'),
}, (table) => ({
  shortUrlIdx: index('click_events_short_url_idx').on(table.shortUrlId),
  timeseriesIdx: index('click_events_timeseries_idx').on(table.shortUrlId, table.timestamp),
}));

export const analyticsSummary = sqliteTable('analytics_summary', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  shortUrlId: integer('short_url_id').notNull().references(() => shortUrls.id),
  periodStart: text('period_start').notNull(),
  periodEnd: text('period_end').notNull(),
  periodType: text('period_type').notNull(),
  totalClicks: integer('total_clicks').notNull().default(0),
  clicksByDevice: text('clicks_by_device'),
  clicksByReferrer: text('clicks_by_referrer'),
  createdAt: text('created_at').notNull(),
}, (table) => ({
  uniquePeriod: uniqueIndex('analytics_summary_unique_period').on(
    table.shortUrlId,
    table.periodStart,
    table.periodType
  ),
  periodTypeIdx: index('analytics_summary_period_type_idx').on(table.periodType),
}));
```

### Raw SQL Migration

```sql
-- Migration: 001_create_tables.sql

CREATE TABLE IF NOT EXISTS short_urls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  original_url TEXT NOT NULL,
  analytics_token TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX idx_short_urls_slug ON short_urls(slug);
CREATE UNIQUE INDEX idx_short_urls_analytics_token ON short_urls(analytics_token);

CREATE TABLE IF NOT EXISTS click_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  short_url_id INTEGER NOT NULL,
  timestamp TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  device_type TEXT,
  ip_address TEXT,
  FOREIGN KEY (short_url_id) REFERENCES short_urls(id) ON DELETE CASCADE
);

CREATE INDEX idx_click_events_short_url_id ON click_events(short_url_id);
CREATE INDEX idx_click_events_timeseries ON click_events(short_url_id, timestamp);

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
  FOREIGN KEY (short_url_id) REFERENCES short_urls(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_analytics_summary_unique_period
  ON analytics_summary(short_url_id, period_start, period_type);
CREATE INDEX idx_analytics_summary_period_type ON analytics_summary(period_type);
```

---

## Query Patterns

### Common Queries

**1. Redirect (Get URL by slug)**
```typescript
const url = await db
  .select()
  .from(shortUrls)
  .where(eq(shortUrls.slug, slug))
  .limit(1);
```

**2. Record Click Event**
```typescript
await db.insert(clickEvents).values({
  shortUrlId: url.id,
  timestamp: new Date().toISOString(),
  referrer: request.headers.get('referer'),
  userAgent: request.headers.get('user-agent'),
  deviceType: detectDevice(userAgent),
  ipAddress: request.headers.get('cf-connecting-ip'),
});
```

**3. Get Analytics by Token**
```typescript
const analytics = await db
  .select({
    slug: shortUrls.slug,
    originalUrl: shortUrls.originalUrl,
    createdAt: shortUrls.createdAt,
    totalClicks: sql<number>`COUNT(${clickEvents.id})`,
  })
  .from(shortUrls)
  .leftJoin(clickEvents, eq(shortUrls.id, clickEvents.shortUrlId))
  .where(eq(shortUrls.analyticsToken, token))
  .groupBy(shortUrls.id);
```

**4. Get Daily Stats (from summary)**
```typescript
const dailyStats = await db
  .select()
  .from(analyticsSummary)
  .where(
    and(
      eq(analyticsSummary.shortUrlId, urlId),
      eq(analyticsSummary.periodType, 'day'),
      gte(analyticsSummary.periodStart, startDate),
      lte(analyticsSummary.periodEnd, endDate)
    )
  )
  .orderBy(desc(analyticsSummary.periodStart));
```

---

## Performance Considerations

**Indexing Strategy**:
- `slug` and `analytics_token` have UNIQUE indexes for O(1) lookups
- Composite index on `(short_url_id, timestamp)` optimizes time-series analytics queries
- Separate indexes on frequently filtered columns

**Scalability**:
- `click_events` table can grow large (1M+ rows per popular URL)
- Pre-aggregated `analytics_summary` table reduces query load
- Scheduled job runs hourly to aggregate raw events into summaries
- Consider partitioning `click_events` by month if volume exceeds 10M rows

**Data Retention**:
- Raw `click_events` retained for 90 days (configurable)
- `analytics_summary` retained indefinitely (aggregated, smaller footprint)
- Implement cleanup job to delete old raw events

**Optimization**:
- Use `EXPLAIN QUERY PLAN` to verify index usage
- Monitor D1 query performance metrics
- Consider caching frequently accessed URLs in Cloudflare KV (read-through cache)

---

## State Transitions

**Short URL Lifecycle**:
```
Created → Active → (No terminal state, URLs never expire)
```

**Click Event Lifecycle**:
```
Created → Aggregated (into summary) → Archived (after 90 days)
```

**Analytics Summary Lifecycle**:
```
Created (hourly) → Updated (if late data arrives) → Permanent
```

---

## Validation & Constraints

**Data Integrity**:
- Foreign key constraints ensure click events reference valid short URLs
- UNIQUE constraints prevent duplicate slugs and tokens
- NOT NULL constraints enforce required fields

**Application-Level Validation**:
- URL format validation before insert (regex, scheme check)
- Slug format validation (6-8 alphanumeric chars)
- Token format validation (32 alphanumeric chars)
- Device type ENUM validation
- Timestamp ISO 8601 format validation

**Error Handling**:
- Duplicate slug: Retry generation with new slug
- Duplicate token: Retry generation with new token
- Invalid URL: Return 400 Bad Request with clear error message
- Missing required field: Return 400 Bad Request

---

## Summary

| Entity | Purpose | Key Fields | Indexes | Est. Size |
|--------|---------|------------|---------|-----------|
| short_urls | Core URL mappings | slug, original_url, analytics_token | slug, analytics_token | 10K rows |
| click_events | Raw click tracking | short_url_id, timestamp, device_type | short_url_id, (short_url_id, timestamp) | 1M+ rows |
| analytics_summary | Aggregated stats | period_start, total_clicks, clicks_by_* | (short_url_id, period_start, period_type) | 50K rows |

**Design Principles**:
- Normalized schema (3NF) for data integrity
- Denormalized summary table for query performance
- UTC timestamps throughout for consistency
- Indexes optimized for read-heavy workload
- JSON columns for flexible analytics breakdowns
