# Tasks: URL Shortener with Analytics

**Input**: Design documents from `/specs/001-url-shortener/`
**Prerequisites**: plan.md (✅), spec.md (✅), research.md (✅), data-model.md (✅), contracts/ (✅)

**Tests**: MANDATORY per Constitution Principle II (Testing Discipline - NON-NEGOTIABLE). Minimum 80% code coverage required. All tasks follow test-first development (Red-Green-Refactor cycle).

**Organization**: Tasks grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

**Single project structure** (Next.js full-stack):
- `src/` - Source code at repository root
- `tests/` - Test files at repository root
- Database schema in `src/lib/db/schema.ts`
- API routes in `src/app/api/`
- Pages in `src/app/`

---

## Phase 1: Setup (Shared Infrastructure) ✅ COMPLETE

**Purpose**: Project initialization and basic structure

- [X] T001 Initialize Next.js 14 project with TypeScript and App Router in repository root
- [X] T002 [P] Install dependencies: drizzle-orm, @opennextjs/cloudflare, better-sqlite3, react, next
- [X] T003 [P] Configure TypeScript with path aliases (@/*) in tsconfig.json
- [X] T004 [P] Setup ESLint and Prettier with Next.js recommended configs
- [X] T005 [P] Configure Vitest for unit testing in vitest.config.ts
- [X] T006 [P] Configure Playwright for integration tests in playwright.config.ts
- [X] T007 [P] Install and configure K6 for load/performance testing
- [X] T008 Create wrangler.toml for Cloudflare Workers deployment
- [X] T009 Setup environment variables template in .env.example

---

## Phase 2: Foundational (Blocking Prerequisites) ✅ COMPLETE

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T010 Create Drizzle ORM schema for short_urls table in src/lib/db/schema.ts
- [X] T011 Create Drizzle ORM schema for click_events table in src/lib/db/schema.ts
- [X] T012 Create Drizzle ORM schema for analytics_summary table in src/lib/db/schema.ts
- [X] T013 Generate SQL migration files in src/lib/db/migrations/ using drizzle-kit
- [X] T014 Create D1 database client wrapper in src/lib/db/client.ts
- [X] T015 Configure drizzle.config.ts for SQLite (local) and D1 (production)
- [X] T016 [P] Implement slug generator utility in src/lib/utils/slug-generator.ts (base62, 6-8 chars)
- [X] T017 [P] Implement analytics token generator in src/lib/utils/token-generator.ts (32 chars)
- [X] T018 [P] Implement URL validator in src/lib/utils/validators.ts (HTTP/HTTPS format check)
- [X] T019 [P] Define TypeScript types in src/lib/types/index.ts (ShortUrl, ClickEvent, AnalyticsData)
- [X] T020 Create root layout in src/app/layout.tsx with metadata and global styles
- [X] T021 Create global error boundary in src/app/error.tsx

**✅ Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Create Short URL (Priority: P1) 🎯 MVP ✅ COMPLETE

**Goal**: Users can create short URLs that redirect to original destinations

**Independent Test**: Submit a long URL → receive short URL → access short URL → redirects correctly

### Implementation for User Story 1

- [X] T022 [P] [US1] Implement UrlShortenerService.createShortUrl in src/lib/services/url-shortener.ts
- [X] T023 [P] [US1] Implement SecurityService.checkMaliciousUrl in src/lib/services/security.ts (Google Safe Browsing API)
- [X] T024 [US1] Create POST /api/shorten route in src/app/api/shorten/route.ts
- [X] T025 [US1] Implement collision retry logic in UrlShortenerService (max 3 retries, length +1)
- [X] T026 [P] [US1] Generate UI components in src/components/ui/ (Button, Input, Card, Alert)
- [X] T027 [US1] Create UrlShortenerForm component in src/components/UrlShortenerForm.tsx
- [X] T028 [US1] Create home page with URL shortener form in src/app/page.tsx
- [X] T029 [US1] Create redirect handler in src/app/[slug]/page.tsx (GET /:slug → 302 redirect)
- [X] T030 [US1] Add URL validation error handling with user-friendly messages
- [X] T031 [US1] Add malicious URL detection error handling with clear rejection message
- [X] T032 [US1] Display short URL and analytics token to user after creation

**✅ Checkpoint**: User Story 1 is fully functional and testable independently - MVP COMPLETE!

---

## Phase 4: User Story 2 - Track Click Analytics (Priority: P2)

**Goal**: System automatically tracks clicks with metadata (timestamp, referrer, device type)

**Independent Test**: Create short URL → click from different sources → verify click events recorded with correct metadata

### Implementation for User Story 2

- [ ] T033 [P] [US2] Implement device type detection utility in src/lib/utils/device-detector.ts (parse User-Agent)
- [ ] T034 [P] [US2] Implement AnalyticsService.recordClick in src/lib/services/analytics.ts
- [ ] T035 [US2] Add async click tracking to redirect handler in src/app/[slug]/page.tsx
- [ ] T036 [US2] Extract referrer from request headers in redirect handler
- [ ] T037 [US2] Extract User-Agent and detect device type in redirect handler
- [ ] T038 [US2] Store click timestamp in UTC format (ISO 8601)
- [ ] T039 [US2] Ensure redirect completes in <200ms (async analytics, non-blocking)
- [ ] T040 [US2] Add error handling for analytics failures (log but don't block redirect)
- [ ] T041 [US2] Create K6 load test script for 1000+ concurrent clicks in tests/load/click-tracking.k6.js
- [ ] T042 [US2] Verify redirect performance <200ms p95 under 1000 req/s load (FR-014)
- [ ] T043 [US2] Validate analytics tracking accuracy under high load (zero data loss)

**Checkpoint**: At this point, User Story 2 should be fully functional - clicks are tracked with metadata

---

## Phase 5: User Story 3 - View Analytics Dashboard (Priority: P3)

**Goal**: Users can view analytics dashboard with visualizations using analytics token

**Independent Test**: Create URLs with clicks → access dashboard with token → verify accurate visualizations

### Implementation for User Story 3

- [ ] T044 [P] [US3] Implement AnalyticsService.getAnalyticsByToken in src/lib/services/analytics.ts
- [ ] T045 [P] [US3] Implement analytics aggregation queries (daily/weekly) in AnalyticsService
- [ ] T046 [P] [US3] Implement device breakdown aggregation in AnalyticsService
- [ ] T047 [P] [US3] Implement referrer breakdown aggregation in AnalyticsService
- [ ] T048 [US3] Create GET /api/analytics/:token route in src/app/api/analytics/[token]/route.ts
- [ ] T049 [US3] Add token validation and unauthorized access handling (FR-016, FR-022)
- [ ] T050 [US3] Add query params support (period, startDate, endDate) to analytics API
- [ ] T051 [P] [US3] Create ClickChart component for time-series visualization in src/components/ClickChart.tsx
- [ ] T052 [P] [US3] Create DeviceBreakdown component in src/components/DeviceBreakdown.tsx
- [ ] T053 [P] [US3] Create ReferrerBreakdown component in src/components/ReferrerBreakdown.tsx
- [ ] T054 [US3] Create AnalyticsDashboard component in src/components/AnalyticsDashboard.tsx
- [ ] T055 [US3] Create analytics dashboard page in src/app/analytics/[token]/page.tsx
- [ ] T056 [US3] Implement client-side timezone conversion for timestamps (FR-023)
- [ ] T057 [US3] Add date range selector (daily/weekly) to dashboard
- [ ] T058 [US3] Add loading states with React Suspense
- [ ] T059 [US3] Add error handling for invalid/missing token
- [ ] T060 [US3] Ensure dashboard loads in <3s with real data

**Checkpoint**: At this point, User Story 3 should be fully functional - complete analytics dashboard

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements and production readiness

- [ ] T061 [P] Create health check endpoint in src/app/api/health/route.ts
- [ ] T062 [P] Add rate limiting middleware in src/middleware.ts (prevent abuse)
- [ ] T063 [P] Add loading spinner component in src/components/LoadingSpinner.tsx
- [ ] T064 [P] Implement proper logging for all API routes
- [ ] T065 [P] Add analytics summary pre-aggregation job (scheduled worker)
- [ ] T066 [P] Configure CORS headers for API routes
- [ ] T067 Add 404 page for unknown slugs in src/app/not-found.tsx
- [ ] T068 Add accessibility labels (ARIA) to all interactive elements
- [ ] T069 Test responsive design on mobile/tablet/desktop
- [ ] T070 Add meta tags and OG tags for SEO in layout.tsx
- [ ] T071 Create K6 load test for URL creation endpoint in tests/load/url-creation.k6.js
- [ ] T072 Verify URL creation completes <2s under concurrent load (SC-001)
- [ ] T073 Setup Cloudflare Pages deployment configuration
- [ ] T074 Create D1 database migration commands in package.json
- [ ] T075 Add performance monitoring (track p95 latency for all endpoints)
- [ ] T076 Write README with setup and deployment instructions

---

## Dependencies

### User Story Completion Order

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundation)
    ↓
Phase 3 (US1: Create Short URL) ← MVP COMPLETE HERE
    ↓
Phase 4 (US2: Track Analytics) ← Depends on US1 redirect handler
    ↓
Phase 5 (US3: View Dashboard) ← Depends on US2 analytics data
    ↓
Phase 6 (Polish)
```

**Critical Path**: Setup → Foundation → US1 → US2 → US3 → Polish

**Parallel Opportunities**:
- Within Phase 2: T015-T018 (utilities) can run in parallel
- Within US1: T021-T022, T025-T026 can run in parallel
- Within US2: T032-T033 can run in parallel
- Within US3: T040-T043 can run in parallel, T047-T049 can run in parallel

---

## Parallel Execution Examples

### Phase 2 Foundation (After T014)
**Can work simultaneously on**:
- Developer A: Slug & token generators (T015, T016)
- Developer B: URL validator (T017)
- Developer C: TypeScript types (T018)

### User Story 1 (After T020)
**Can work simultaneously on**:
- Developer A: Backend service (T021, T022)
- Developer B: UI components (T025, T026)
- Both merge for: API route and integration (T023, T027, T028)

### User Story 3 (After T043)
**Can work simultaneously on**:
- Developer A: Backend API (T044-T046)
- Developer B: Chart components (T047-T049)
- Both merge for: Dashboard integration (T050-T051)

---

## Implementation Strategy

### MVP First (Recommended)

**Minimum Viable Product** = Phase 1 + Phase 2 + Phase 3 (User Story 1)

This delivers core value:
- ✅ Users can create short URLs
- ✅ Short URLs redirect to original destinations
- ✅ Malicious URL protection
- ✅ Unique slug generation with collision handling

**Deploy MVP first**, then incrementally add:
- Phase 4 (US2) - Click analytics tracking
- Phase 5 (US3) - Analytics dashboard
- Phase 6 - Production polish

### Test-First Development

For each task, follow TDD cycle:
1. **Write failing test** for the functionality
2. **Implement minimal code** to pass the test
3. **Refactor** while keeping tests green
4. **Verify** 80% coverage target

Example workflow for T021:
```
1. Write test: UrlShortenerService.createShortUrl should generate unique slug
2. Implement: Basic slug generation without collision check
3. Test passes ✅
4. Add test: Should retry on collision
5. Implement: Collision retry logic
6. Test passes ✅
7. Refactor: Extract magic numbers, improve naming
8. All tests still pass ✅
```

---

## Task Statistics

**Total Tasks**: 76
- Phase 1 (Setup): 9 tasks (includes K6 setup)
- Phase 2 (Foundation): 12 tasks
- Phase 3 (US1): 11 tasks
- Phase 4 (US2): 11 tasks (includes K6 load tests)
- Phase 5 (US3): 17 tasks
- Phase 6 (Polish): 16 tasks (includes K6 load tests)

**Parallel Opportunities**: 24 tasks marked [P] (34% can run in parallel)

**Independent Test Criteria**:
- US1: Submit URL → receive short URL → redirect works
- US2: Click short URL → verify click event recorded with metadata
- US3: Access dashboard with token → verify accurate visualizations

**Suggested MVP Scope**: Phase 1-3 (32 tasks, ~42% of total work)

**Constitution Compliance**:
- ✅ Test-first development workflow defined
- ✅ Code quality gates (ESLint, Prettier, TypeScript)
- ✅ Performance targets specified (<200ms, <3s, 80% coverage)
- ✅ UX consistency (ui-ux-pro-max-skill, accessibility, responsive)

---

## Format Validation

✅ All tasks follow checklist format: `- [ ] [ID] [P?] [Story?] Description with file path`
✅ Task IDs sequential (T001-T070)
✅ [P] marker only on parallelizable tasks
✅ [Story] label on user story tasks (US1, US2, US3)
✅ Setup/Foundation/Polish have NO story labels
✅ File paths specified in task descriptions
✅ Tasks organized by phase and user story

**Status**: Ready for implementation 🚀

**Next Command**: Start implementing from Phase 1, following the TDD workflow
