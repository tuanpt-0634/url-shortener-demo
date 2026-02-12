# Research: URL Shortener with Analytics

**Feature**: 001-url-shortener
**Date**: 2026-02-12
**Phase**: 0 - Technology Research & Best Practices

## Technology Decisions

### Next.js on Cloudflare Workers

**Decision**: Use Next.js 14+ with App Router, deployed to Cloudflare Workers using `@cloudflare/next-on-pages`

**Rationale**:
- Next.js provides unified full-stack framework (frontend + API routes in one codebase)
- App Router (app directory) offers better performance with React Server Components
- Cloudflare Workers provide edge deployment with <200ms global latency
- `@cloudflare/next-on-pages` adapter enables Next.js on Workers with minimal changes

**Alternatives Considered**:
- **Remix on Cloudflare**: Strong edge support but smaller ecosystem than Next.js
- **Standalone Workers + React SPA**: More control but requires managing two separate codebases
- **Vercel Edge Functions**: Vendor lock-in, Next.js is designed for Vercel but we need Cloudflare

**Implementation Notes**:
- Use `next dev` for local development with SQLite
- Use `wrangler` CLI for local Workers testing with Miniflare
- Configure `next.config.js` with Cloudflare adapter
- API routes must be stateless (no session storage, use tokens)

**References**:
- https://developers.cloudflare.com/pages/framework-guides/deploy-a-nextjs-site/
- https://github.com/cloudflare/next-on-pages

---

### Database: SQLite (local) + D1 (production)

**Decision**: Use Cloudflare D1 (serverless SQLite) for production, local SQLite for development, with Drizzle ORM

**Rationale**:
- D1 is Cloudflare's serverless SQLite offering, perfect for edge deployment
- SQLite file-based database works identically locally and on D1
- Drizzle ORM provides type-safe queries with TypeScript
- No connection pooling needed (D1 is serverless)
- Sub-50ms query performance at edge

**Alternatives Considered**:
- **Cloudflare KV**: Key-value store, not suitable for relational queries (joins, aggregations)
- **Cloudflare R2 + JSON**: Object storage, poor query performance for analytics
- **Planetscale**: MySQL edge database, but adds external dependency and costs
- **Supabase**: PostgreSQL, not supported on Cloudflare Workers

**Schema Design Considerations**:
- Index on `slug` column for O(1) redirects
- Index on `short_url_id` + `timestamp` for analytics queries
- Separate tables: `short_urls`, `click_events`, `analytics_summary` (pre-aggregated)
- Use DATETIME for timestamps (stored as UTC strings or ISO 8601)

**Implementation Notes**:
- Use `wrangler d1 create` to create D1 database
- Use `drizzle-kit generate` for migrations
- Use `wrangler d1 migrations apply` to run migrations
- Local dev uses `better-sqlite3` package

**References**:
- https://developers.cloudflare.com/d1/
- https://orm.drizzle.team/docs/get-started-sqlite

---

### URL Slug Generation

**Decision**: Base62 encoding of cryptographically random bytes (6-8 characters)

**Rationale**:
- Base62 (A-Z, a-z, 0-9) is URL-safe and readable
- Crypto.randomBytes provides cryptographic randomness
- 6 characters = 62^6 = 56 billion combinations (collision-free for MVP)
- 8 characters if collision occurs (62^8 = 218 trillion combinations)

**Alternatives Considered**:
- **UUIDv4**: Too long (36 characters with hyphens)
- **Nanoid**: Good option but similar to custom base62 implementation
- **Sequential**: Predictable, exposes business metrics
- **Hash-based (SHA256)**: Deterministic (same URL = same hash), privacy concern

**Implementation**:
```typescript
import crypto from 'crypto';

function generateSlug(length: number = 6): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % 62];
  }
  return result;
}
```

**Collision Handling**:
- Check uniqueness against database before saving
- Retry with length+1 if collision detected (max 3 retries)
- Log collision events for monitoring

**References**:
- https://www.baeldung.com/cs/url-shortening-design
- https://github.com/ai/nanoid

---

### Analytics Token Generation

**Decision**: Cryptographically random 32-character base62 string

**Rationale**:
- 32 characters = 62^32 combinations (astronomically large, infeasible to guess)
- Base62 keeps tokens URL-friendly
- Crypto.randomBytes ensures unpredictability
- No time-based expiration (tokens are permanent)

**Implementation**:
```typescript
function generateAnalyticsToken(): string {
  return generateSlug(32); // Reuse slug generator with 32 chars
}
```

**Security Considerations**:
- Tokens stored as-is in database (no hashing needed since they're random)
- HTTPS required to prevent token interception
- Rate limiting on analytics endpoints to prevent brute force

---

### Malicious URL Detection

**Decision**: Integrate Google Safe Browsing API (v5)

**Rationale**:
- Free tier: 10,000 lookups/day (sufficient for MVP)
- Real-time protection against phishing/malware
- Well-maintained, comprehensive threat database
- Simple REST API

**Alternatives Considered**:
- **PhishTank**: Free but API is slower, less comprehensive
- **VirusTotal**: Requires paid API for reasonable limits
- **Manual blocklist**: Insufficient coverage, high maintenance
- **No validation**: Security risk, could be used for malicious purposes

**Implementation**:
```typescript
async function checkMaliciousUrl(url: string): Promise<boolean> {
  const response = await fetch(
    `https://safebrowsing.googleapis.com/v5/threatMatches:find?key=${API_KEY}`,
    {
      method: 'POST',
      body: JSON.stringify({
        client: { clientId: 'url-shortener', clientVersion: '1.0' },
        threatInfo: {
          threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING'],
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: [{ url }]
        }
      })
    }
  );
  const data = await response.json();
  return data.matches && data.matches.length > 0;
}
```

**Error Handling**:
- If API is down: log error, allow URL creation (fail open for availability)
- Cache negative results for 24h to reduce API calls
- Implement exponential backoff for retries

**References**:
- https://developers.google.com/safe-browsing/v4

---

### UI Generation with ui-ux-pro-max-skill

**Decision**: Use ui-ux-pro-max-skill tool to generate consistent, accessible UI components

**Rationale**:
- Ensures visual consistency across all pages
- Built-in accessibility (WCAG 2.1 AA compliance)
- Responsive design by default
- Reduces manual CSS/styling work

**Component Requirements**:
- URL input form with validation feedback
- Analytics dashboard with charts (click trends, device breakdown, referrer sources)
- Loading states (spinners, skeletons)
- Error states (error boundaries, toast notifications)
- Responsive layout (mobile-first)

**Implementation Notes**:
- Generate components during development phase
- Customize with Tailwind CSS for branding
- Use shadcn/ui compatible components
- Follow React best practices (hooks, composition)

**References**:
- https://github.com/nextlevelbuilder/ui-ux-pro-max-skill

---

### Analytics Processing

**Decision**: Asynchronous click tracking using Cloudflare Queues (or D1 batch inserts)

**Rationale**:
- Redirect must complete in <200ms (constitution requirement)
- Analytics writes should not block redirects
- Cloudflare Queues provide async processing at edge
- Batch inserts reduce D1 write operations

**Architecture**:
1. Redirect handler: Write click event to queue → immediate redirect (10ms)
2. Queue consumer: Batch process events → write to D1 (async)
3. Aggregation: Scheduled worker runs hourly to pre-aggregate stats

**Alternatives Considered**:
- **Synchronous writes**: Violates <200ms SLA (database writes add 50-100ms)
- **Client-side tracking**: Not reliable (ad blockers, privacy settings)
- **Third-party analytics**: Adds dependency, privacy concerns

**Implementation**:
```typescript
// Redirect handler
async function handleRedirect(slug: string) {
  const url = await getUrlBySlug(slug);

  // Queue click event (non-blocking)
  await env.ANALYTICS_QUEUE.send({
    slug,
    timestamp: Date.now(),
    referrer: request.headers.get('referer'),
    userAgent: request.headers.get('user-agent')
  });

  // Immediate redirect
  return Response.redirect(url.originalUrl, 302);
}
```

**References**:
- https://developers.cloudflare.com/queues/

---

### Testing Strategy

**Decision**: Multi-layer testing with Vitest (unit), Playwright (E2E), Miniflare (Workers)

**Test Layers**:

1. **Unit Tests (Vitest)**:
   - Slug generation (uniqueness, format)
   - Token generation (randomness, length)
   - URL validation (format, malicious check)
   - Analytics aggregation logic
   - Target: 80%+ coverage

2. **Integration Tests (Playwright)**:
   - API routes (POST /api/shorten, GET /api/analytics/:token)
   - End-to-end flows (create URL → redirect → view analytics)
   - Error scenarios (invalid URL, missing token, 404)

3. **Contract Tests**:
   - OpenAPI spec validation
   - Request/response schema verification
   - Breaking change detection

4. **Local Workers Testing (Miniflare)**:
   - Test Cloudflare-specific features locally
   - D1 database interactions
   - Environment bindings

**TDD Workflow**:
1. Write failing test for feature
2. Implement minimal code to pass test
3. Refactor while keeping tests green
4. Repeat

**CI/CD**:
- GitHub Actions: Run tests on every PR
- Block merge if tests fail or coverage drops below 80%
- Deploy to preview environment for manual testing

**References**:
- https://vitest.dev/
- https://playwright.dev/
- https://miniflare.dev/

---

## Summary of Research Findings

| Decision Point | Choice | Rationale |
|----------------|--------|-----------|
| Framework | Next.js 14 (App Router) | Full-stack, edge-compatible, large ecosystem |
| Deployment | Cloudflare Workers | <200ms latency, edge compute, cost-effective |
| Database | D1 (SQLite) | Serverless, edge-native, relational queries |
| ORM | Drizzle | Type-safe, lightweight, SQLite-optimized |
| Slug Generation | Base62 random (6-8 chars) | URL-safe, collision-resistant, unpredictable |
| Analytics Token | Base62 random (32 chars) | Cryptographically secure, infeasible to guess |
| Security | Google Safe Browsing API | Free, comprehensive, real-time protection |
| UI Components | ui-ux-pro-max-skill | Consistent design, accessible, responsive |
| Analytics Processing | Async via Queues | <200ms redirects, scalable, reliable |
| Testing | Vitest + Playwright + Miniflare | Comprehensive coverage, TDD-friendly |

**No NEEDS CLARIFICATION items remain** - All technical decisions finalized and justified.
