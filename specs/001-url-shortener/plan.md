# Implementation Plan: URL Shortener with Analytics

**Branch**: `001-url-shortener` | **Date**: 2026-02-12 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-url-shortener/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a URL shortening service with click analytics that allows users to create short URLs, tracks click events with metadata (referrer, device type, timestamp), and provides a dashboard for viewing statistics. The system uses random slug generation with collision detection, secret token-based analytics access, and integrates with public blocklist APIs for security. All data stored in UTC with client-side timezone conversion for display.

**Technical Approach**: Next.js full-stack application (App Router) with TypeScript, deployed to Cloudflare Workers. SQLite for local development, Cloudflare D1 for production. UI generated using ui-ux-pro-max-skill tool for consistent, accessible design. Analytics processed asynchronously to meet <200ms redirect SLA.

## Technical Context

**Language/Version**: TypeScript 5.3+, Node.js 20+ (local dev), Cloudflare Workers runtime (production)
**Primary Dependencies**: Next.js 14+ (App Router), React 18+, Cloudflare Workers SDK, Drizzle ORM, ui-ux-pro-max-skill (UI generation)
**Storage**: SQLite (local development), Cloudflare D1 (production - serverless SQLite)
**Testing**: Vitest (unit tests), Playwright (integration/E2E), Miniflare (local Workers simulation)
**Target Platform**: Cloudflare Workers (edge compute), modern browsers (Chrome, Firefox, Safari, Edge)
**Project Type**: Web application (full-stack Next.js)
**Performance Goals**:
  - <200ms p95 latency for redirects
  - <2s URL creation (including malicious URL check)
  - <3s dashboard load time
  - 1000 concurrent requests/second
  - <50ms database queries

**Constraints**:
  - Cloudflare Workers 128MB memory limit per request
  - D1 database 100k reads/day (free tier), unlimited (paid)
  - Workers CPU time limit: 10ms (free), 50ms (paid)
  - Must work at edge (no persistent connections)
  - Client-side rendering for dashboard (no SSR for analytics)

**Scale/Scope**:
  - Support 10,000+ short URLs
  - Handle 1M+ clicks per URL
  - Global edge deployment (low latency worldwide)
  - 3 main pages (create, redirect, analytics dashboard)
  - ~15 API routes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Code Quality Standards ✅ PASS

- TypeScript provides static typing for self-documenting code
- ESLint + Prettier configured for automated linting/formatting
- Next.js follows established conventions and best practices
- Code review required (enforced via GitHub/GitLab branch protection)

### Testing Discipline ✅ PASS

- Vitest for unit tests (business logic, utilities, services)
- Playwright for integration/E2E tests (API routes, user flows)
- Miniflare for testing Cloudflare Workers locally
- Target: 80% code coverage minimum
- Test-first approach enforced: write failing tests → implement → verify passing

### User Experience Consistency ✅ PASS

- ui-ux-pro-max-skill tool ensures consistent design system
- Next.js App Router provides consistent routing patterns
- Responsive design built-in (mobile-first approach)
- Loading states with React Suspense
- Error boundaries for graceful error handling
- WCAG 2.1 AA compliance (semantic HTML, ARIA labels, keyboard navigation)

### Performance Requirements ✅ PASS

- Cloudflare Workers edge deployment (<200ms global latency)
- D1 database optimized with proper indexing
- Analytics processing async (doesn't block redirects)
- Client-side rendering for dashboard (fast initial load)
- Meets all SLAs: <200ms redirects, <2s creation, <3s dashboard

**Overall Status**: ✅ ALL GATES PASSED - No constitution violations

**Notes**:
- Cloudflare Workers constraints align with performance goals (edge compute, low latency)
- Next.js on Cloudflare requires adapter but is officially supported
- D1 database is serverless SQLite, perfect for this use case

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # API routes
│   │   │   ├── shorten/          # POST /api/shorten - create short URL
│   │   │   ├── analytics/        # GET /api/analytics/:token - get stats
│   │   │   └── health/           # GET /api/health - health check
│   │   ├── [slug]/               # Dynamic route for redirects
│   │   │   └── page.tsx          # Redirect handler
│   │   ├── analytics/            # Analytics dashboard page
│   │   │   └── [token]/
│   │   │       └── page.tsx
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Home page (URL creation)
│   │   └── error.tsx             # Global error boundary
│   ├── components/               # React components
│   │   ├── ui/                   # UI components (generated via ui-ux-pro-max-skill)
│   │   ├── UrlShortenerForm.tsx
│   │   ├── AnalyticsDashboard.tsx
│   │   ├── ClickChart.tsx
│   │   └── LoadingSpinner.tsx
│   ├── lib/                      # Business logic & utilities
│   │   ├── db/                   # Database layer
│   │   │   ├── schema.ts         # Drizzle ORM schema
│   │   │   ├── client.ts         # D1 client wrapper
│   │   │   └── migrations/       # SQL migrations
│   │   ├── services/             # Business logic
│   │   │   ├── url-shortener.ts  # Slug generation, validation
│   │   │   ├── analytics.ts      # Click tracking, aggregation
│   │   │   └── security.ts       # Blocklist API integration
│   │   ├── utils/                # Utility functions
│   │   │   ├── slug-generator.ts # Random slug generation
│   │   │   ├── token-generator.ts# Analytics token generation
│   │   │   └── validators.ts     # URL validation
│   │   └── types/                # TypeScript types
│   │       └── index.ts
│   └── middleware.ts             # Edge middleware (rate limiting, etc.)
├── tests/
│   ├── unit/                     # Vitest unit tests
│   │   ├── services/
│   │   └── utils/
│   ├── integration/              # Playwright integration tests
│   │   ├── api/
│   │   └── pages/
│   └── contract/                 # API contract tests
│       └── openapi.test.ts
├── public/                       # Static assets
├── drizzle.config.ts             # Drizzle ORM config
├── wrangler.toml                 # Cloudflare Workers config
├── vitest.config.ts              # Vitest config
├── playwright.config.ts          # Playwright config
├── next.config.js                # Next.js config (Cloudflare adapter)
├── tsconfig.json                 # TypeScript config
├── package.json
└── README.md
```

**Structure Decision**: Web application structure (Option 2 variant). Next.js App Router handles both frontend (pages/components) and backend (API routes) in a unified codebase. This aligns with the "full-stack Next.js" tech stack requirement. The `src/app` directory follows Next.js 14+ App Router conventions, while `src/lib` contains reusable business logic separated from framework code.

## Complexity Tracking

**No constitution violations** - All complexity is justified and necessary:

| Aspect | Justification |
|--------|---------------|
| Next.js on Cloudflare | Official adapter exists, provides edge deployment + full-stack framework |
| D1 Database | Serverless SQLite, perfect for edge workers, no connection pooling needed |
| Async Analytics | Required to meet <200ms redirect SLA, prevents blocking user redirects |
| Pre-aggregated Summary | Performance optimization for dashboard queries on 1M+ clicks |

---

## Implementation Summary

### Phase 0: Research ✅ COMPLETE

**Artifact**: [research.md](research.md)

Key decisions finalized:
- Next.js 14 with App Router on Cloudflare Workers
- D1 (serverless SQLite) for database
- Base62 random slug generation (6-8 chars)
- Cryptographically random analytics tokens (32 chars)
- Google Safe Browsing API for malicious URL detection
- ui-ux-pro-max-skill for UI component generation
- Async analytics processing with Cloudflare Queues
- Vitest + Playwright + Miniflare for testing

### Phase 1: Design ✅ COMPLETE

**Artifacts**:
- [data-model.md](data-model.md) - Database schema with 3 tables (short_urls, click_events, analytics_summary)
- [contracts/openapi.yaml](contracts/openapi.yaml) - API specification with 4 endpoints
- [quickstart.md](quickstart.md) - Development setup guide
- [.github/agents/copilot-instructions.md](../../.github/agents/copilot-instructions.md) - AI agent context (updated)

**Database Schema**:
- `short_urls`: 6 fields, indexed on slug and analytics_token
- `click_events`: 7 fields, composite index on (short_url_id, timestamp)
- `analytics_summary`: 9 fields, pre-aggregated for performance

**API Endpoints**:
- `POST /api/shorten` - Create short URL
- `GET /{slug}` - Redirect to original URL
- `GET /api/analytics/{token}` - Retrieve analytics
- `GET /api/health` - Health check

**Re-evaluated Constitution Check**: ✅ ALL GATES STILL PASS

---

## Next Steps

**This plan stops here** as per `/speckit.plan` workflow. The next phase is `/speckit.tasks`:

```bash
/speckit.tasks
```

The tasks command will generate `tasks.md` with:
- Detailed implementation tasks organized by user story
- Test-first development tasks (write tests → implement → verify)
- Task dependencies and parallel execution opportunities
- Estimated effort and acceptance criteria

**Prerequisites for Tasks Phase**:
- ✅ Specification complete and clarified
- ✅ Technical stack decided
- ✅ Data model designed
- ✅ API contracts defined
- ✅ Development environment documented

**Ready to implement** - All planning artifacts are complete and validated.

---

**Plan Version**: 1.0.0
**Status**: Complete
**Last Updated**: 2026-02-12
