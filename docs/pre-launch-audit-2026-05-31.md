# Atlas Kings v2 — Pre-Launch Security & Smoke Test Audit

**Date:** 2026-05-31
**Auditor:** External security review (Claude, acting as expert security manager)
**Scope:** Full codebase audit — security, code quality, data integrity, SEO, performance, accessibility, infrastructure
**Rule:** Read-only audit. No code was changed.
**Current phase:** Phase 7

---

## Executive Summary

The Atlas Kings v2 codebase has strong fundamentals — strict TypeScript, zero `as any` casts, clean component architecture, proper i18n/RTL support, and well-structured DB queries via Drizzle ORM. However, there are **3 critical security vulnerabilities** that must be fixed before any public deployment, along with several high-severity gaps in infrastructure (no error boundaries, no sitemap, no security headers) and data layer issues (no DB transactions, N+1 query patterns).

**Findings by severity:**

| Severity | Count |
|----------|-------|
| CRITICAL | 8 |
| HIGH | 13 |
| MEDIUM | 16 |
| LOW | 12 |
| **Total** | **49** |

---

## How to use this document

Each task below is structured for Claude Code to implement directly. Tasks are grouped by category and ordered by severity within each group. Each task includes:

- **ID** — for tracking in BACKLOG.md
- **Severity** — CRITICAL / HIGH / MEDIUM / LOW
- **File(s)** — exact paths
- **Problem** — what's wrong
- **Fix** — what to do

**Recommended execution order:** All CRITICALs first (security blockers), then HIGHs (launch blockers), then MEDIUMs (polish), then LOWs (tech debt).

---

## Category 1: Security (LAUNCH BLOCKERS)

### SEC-01 | CRITICAL | Middleware is not active — admin routes are unprotected

**File:** `src/proxy.ts`
**Problem:** The middleware is defined in `src/proxy.ts` but Next.js requires it at `src/middleware.ts` (or `middleware.ts` at project root). The exported function is named `proxy`, not `middleware`. The built middleware manifest confirms `"middleware": {}, "sortedMiddleware": []`. All admin pages (`/admin/media`, `/admin/media/new`) are accessible without authentication. The next-intl locale detection also does not run.
**Fix:** Rename `src/proxy.ts` to `src/middleware.ts`. Rename the exported function from `proxy` to `middleware`. Verify the `config.matcher` is applied. Test that unauthenticated requests to `/admin/*` are redirected.

---

### SEC-02 | CRITICAL | API key exposed as NEXT_PUBLIC_ environment variable

**File:** `.env.local` line 4
**Problem:** `NEXT_PUBLIC_API_FOOTBALL_KEY` is set with the `NEXT_PUBLIC_` prefix, meaning it is bundled into client-side JavaScript and visible to any visitor via browser DevTools or source maps. This is a paid API key (75k req/day plan).
**Fix:** Remove `NEXT_PUBLIC_API_FOOTBALL_KEY` from `.env.local` entirely. Verify no client-side code references it (grep for `NEXT_PUBLIC_API_FOOTBALL`). Only `API_FOOTBALL_KEY` (server-side) should exist.

---

### SEC-03 | CRITICAL | .env.local contains live credentials — verify not committed to git

**File:** `.env.local`
**Problem:** Contains the Neon database URL with username/password, the API-Football key, Pusher credentials, and the CRON_SECRET. Additionally, `ADMIN_SECRET=$(openssl rand -base64 32)` uses shell expansion syntax which `.env` files do not execute — the secret is the literal string `$(openssl rand -base64 32)`.
**Fix:** (a) Run `git ls-files .env.local` — if tracked, remove from git history immediately using `git filter-branch` or BFG Repo-Cleaner and rotate ALL credentials. (b) Replace the `ADMIN_SECRET` line with an actual random value: generate via `openssl rand -base64 32` in terminal, paste the output. (c) Verify `.env*.local` is in `.gitignore`.

---

### SEC-04 | HIGH | No security headers configured

**File:** `next.config.ts`
**Problem:** No `headers()` function. Missing Content-Security-Policy, X-Frame-Options, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy. Site is vulnerable to clickjacking (iframing), MIME-type sniffing, and has no XSS mitigation at the browser level.
**Fix:** Add a `headers()` async function to `next.config.ts` returning security headers for all routes:
- `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' https://media.api-sports.io https://i.ytimg.com https://res.cloudinary.com data:; frame-src https://www.youtube.com; connect-src 'self' https://*.pusher.com wss://*.pusher.com; font-src 'self' https://fonts.gstatic.com;`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

---

### SEC-05 | HIGH | Cron secret uses non-constant-time comparison

**File:** `src/lib/cron/auth.ts` line 3
**Problem:** `return authHeader === 'Bearer ${process.env.CRON_SECRET}'` uses JavaScript `===` which is vulnerable to timing attacks. An attacker can progressively guess the CRON_SECRET character by character.
**Fix:** Use `crypto.timingSafeEqual()`:
```typescript
import { timingSafeEqual } from 'crypto';
const expected = Buffer.from(`Bearer ${process.env.CRON_SECRET}`);
const actual = Buffer.from(authHeader);
if (expected.length !== actual.length) return false;
return timingSafeEqual(expected, actual);
```

---

### SEC-06 | HIGH | No rate limiting on admin login endpoint

**File:** `src/app/api/admin/auth/route.ts`
**Problem:** The POST handler has zero rate limiting. An attacker can brute-force the ADMIN_SECRET with unlimited speed. Combined with SEC-01 (middleware inactive), there is no protection at any layer.
**Fix:** Add rate limiting using Upstash Ratelimit (already a dependency) with a sliding window of 5 attempts per minute per IP.

---

### SEC-07 | HIGH | Admin server components lack server-side auth checks

**Files:** `src/app/admin/media/page.tsx`, `src/app/admin/media/new/page.tsx`, `src/app/admin/layout.tsx`
**Problem:** Admin pages rely entirely on middleware for auth gating. Since middleware is inactive (SEC-01), these pages render full admin data to unauthenticated users. Even after SEC-01 is fixed, defense-in-depth requires server-side auth checks.
**Fix:** Add `getAdminSession()` check in the admin layout.tsx (or each admin page). Redirect to login page if no valid session. This ensures auth works even if middleware is bypassed.

---

### SEC-08 | MEDIUM | Error messages leak internal details

**Files:** `src/app/api/health/route.ts:10`, all `src/app/api/cron/*/route.ts`, `src/app/api/v1/media/oembed/route.ts:24`
**Problem:** Internal error messages from database drivers and HTTP clients are returned verbatim in 500 responses. These can reveal database hostnames, query structures, internal service URLs.
**Fix:** In all API route catch blocks, log the full error server-side (`console.error` + Sentry when configured), return a generic `{ error: 'Internal server error' }` to clients.

---

### SEC-09 | MEDIUM | SQL ILIKE wildcard injection

**Files:** `src/app/api/v1/media/tags/teams/route.ts:16`, `src/lib/db/queries/media.ts:65`, `src/lib/db/queries/search.ts:56`
**Problem:** `%` and `_` characters in user search input are not escaped before use in LIKE patterns. A search for `%` returns all rows. Crafted patterns like `%a%b%c%` can cause expensive scans.
**Fix:** Create a `escapeLikePattern(input: string)` utility that escapes `%`, `_`, and `\` before interpolating into LIKE patterns.

---

### SEC-10 | MEDIUM | No input validation on media API query params

**File:** `src/app/api/v1/media/route.ts:14-45`
**Problem:** `Number()` on query params without `NaN` checks. `limit` and `offset` accept negative numbers. No upper bound on `limit` at the route level.
**Fix:** Validate all numeric params with `parseInt` + `isNaN` + range clamping. Limit `limit` to max 50, `offset` to min 0.

---

### SEC-11 | MEDIUM | Admin session cookie `secure` flag conditional on NODE_ENV

**File:** `src/lib/auth/admin.ts:145`
**Problem:** `secure: process.env.NODE_ENV === 'production'` — Vercel preview deployments use HTTPS but may not set `NODE_ENV=production`.
**Fix:** Set `secure: true` unconditionally, or default to `true` with an explicit `localhost` exception.

---

### SEC-12 | MEDIUM | No CORS configuration on API routes

**Files:** All `src/app/api/` route handlers
**Problem:** No explicit CORS headers. If a reverse proxy or CDN strips default protections, API routes become cross-origin accessible.
**Fix:** Add a shared CORS middleware or `Access-Control-Allow-Origin` header to API routes. At minimum, restrict to the site's own domain.

---

### SEC-13 | LOW | oEmbed endpoint has no rate limiting

**File:** `src/app/api/v1/media/oembed/route.ts`
**Problem:** No rate limiting. Could be used as a proxy to make unlimited requests to YouTube's oEmbed API.
**Fix:** Add rate limiting (10 req/min per IP).

---

## Category 2: Infrastructure (LAUNCH BLOCKERS)

### INF-01 | CRITICAL | No error.tsx files exist anywhere

**Problem:** Zero `error.tsx` files in the entire `src/app/` tree. Unhandled runtime errors in any server component show the default Next.js error overlay in dev or a blank page in production. Users have no recovery path.
**Fix:** Create at minimum:
- `src/app/[locale]/error.tsx` — catches all locale-scoped errors
- `src/app/global-error.tsx` — catches root layout errors
Each should render a branded error page with "Go back" / "Go home" actions. Must be `'use client'` components.

---

### INF-02 | CRITICAL | No loading.tsx files exist anywhere

**Problem:** No Suspense loading states. Navigation between pages shows no visual feedback — the browser appears to hang until the server component finishes.
**Fix:** Create `loading.tsx` at key route segments:
- `src/app/[locale]/(app)/loading.tsx` — main app skeleton
- `src/app/[locale]/(app)/competition/[country]/[tournament]/loading.tsx`
- `src/app/[locale]/(app)/match/[...slug]/loading.tsx`
- `src/app/[locale]/(app)/equipe/[...slug]/loading.tsx`
- `src/app/[locale]/(app)/joueur/[...slug]/loading.tsx`

---

### INF-03 | CRITICAL | No not-found.tsx exists

**Problem:** No custom 404 page. Users hitting invalid URLs see the unbranded Next.js 404.
**Fix:** Create `src/app/[locale]/not-found.tsx` with branded design and navigation links.

---

### INF-04 | CRITICAL | No sitemap.ts exists

**Problem:** No dynamic sitemap for search engines. A site with thousands of dynamic match/team/player/competition pages needs a sitemap for Google to discover them.
**Fix:** Create `src/app/sitemap.ts` that generates URLs for all locales and all entity types (competitions, teams, players, matches). Use `generateSitemaps()` for index/split if >50,000 URLs.

---

### INF-05 | CRITICAL | No robots.ts exists

**Problem:** No `robots.txt` served. Crawl behavior is undefined. Admin and API paths are not disallowed.
**Fix:** Create `src/app/robots.ts`:
```typescript
export default function robots() {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin/', '/api/', '/dev/'] },
    sitemap: 'https://atlaskings.com/sitemap.xml',
  };
}
```

---

### INF-06 | HIGH | Next.js version mismatch with plan

**File:** `package.json`
**Problem:** The plan locks Next.js 15 but `package.json` has Next.js 16.2.6. This may not be a bug (natural upgrade during development), but the plan says "Next.js 15 (App Router, RSC)" as a locked decision.
**Fix:** Confirm with the user whether Next.js 16 is intentional. If so, update the plan reference. If not, pin to Next.js 15.

---

### INF-07 | HIGH | Dev style-guide page is indexable

**File:** `src/app/[locale]/(app)/dev/style-guide/page.tsx`
**Problem:** No `noindex` robots directive. This development page will be indexed by search engines.
**Fix:** Add `export const metadata = { robots: { index: false, follow: false } }` or add `/dev/` to robots.ts disallow list (covered in INF-05).

---

## Category 3: SEO

### SEO-01 | HIGH | Match pages lack canonical URLs, hreflang, and Open Graph

**File:** `src/app/[locale]/(app)/match/[...slug]/page.tsx:69-72`
**Problem:** `generateMetadata` returns only `title` and `description`. No `canonical`, no `alternates.languages`, no `openGraph`, no `twitter` card. Every other major page has these.
**Fix:** Add full metadata including canonical URL, hreflang alternates for FR/EN/AR, openGraph object, and twitter card.

---

### SEO-02 | HIGH | Coach pages lack canonical URLs, hreflang, and Open Graph

**File:** `src/app/[locale]/(app)/entraineur/[...slug]/page.tsx:37-41`
**Problem:** Same gap as SEO-01 — only `title` and `description` returned.
**Fix:** Same as SEO-01.

---

### SEO-03 | HIGH | No Open Graph images configured anywhere

**Problem:** No `opengraph-image.tsx` or `opengraph-image.png` files exist. Pages that set `openGraph` metadata do not include an `images` property (except cup content pages). Social sharing will render without preview images.
**Fix:** Create dynamic OG images using Vercel OG (`@vercel/og`). At minimum, create a default OG image and reference it in root layout metadata.

---

## Category 4: Data Integrity

### DATA-01 | HIGH | No transactions in any ingestion sync function

**Files:** All files in `src/lib/ingestion/`
**Problem:** All ingestion functions (`syncFixtures`, `syncStandings`, `syncTeams`, etc.) perform multiple sequential upserts without wrapping in a transaction. If the process crashes mid-sync, the database is left in a partial state.
**Fix:** Wrap each sync function's write operations in `db.transaction(async (tx) => { ... })`.

---

### DATA-02 | HIGH | syncFixtureDetails delete+insert is not atomic

**File:** `src/lib/ingestion/fixture-details.ts:96-104`
**Problem:** Events are deleted then re-inserted one by one. If the process crashes after deletion, events are lost.
**Fix:** Wrap the delete+insert sequence in a single transaction.

---

### DATA-03 | HIGH | N+1 query loop in getTeamAllStandings

**File:** `src/lib/db/queries/team.ts:394-429`
**Problem:** For each `{competitionId, seasonYear}` pair, runs separate standings + getTeamsMap queries inside a `for` loop. A team in 5 competitions across 3 seasons = 30 queries.
**Fix:** Batch all standings into one query with `WHERE (competition_id, season_year) IN (...)` and hydrate teams once.

---

### DATA-04 | HIGH | N+1 query loop in getLiveGroupStandings

**File:** `src/lib/db/queries/right-rail.ts:304-426`
**Problem:** Three nested levels of sequential queries. A competition with 8 groups generates 17+ queries. Multiple active competitions = 50+ queries.
**Fix:** Restructure as a single query that fetches all active competition standings in one pass, then group in JavaScript.

---

### DATA-05 | HIGH | N+1 loop in getRightRailTopScorers

**File:** `src/lib/db/queries/right-rail.ts:646-719`
**Problem:** Iterates through `priorityComps` array, running raw SQL per competition until one returns results.
**Fix:** Query all priority competitions in one SQL statement using window functions or `UNION ALL` with `LIMIT` per group.

---

### DATA-06 | HIGH | No API response validation in adapter

**File:** `src/lib/data/adapters/api-football/adapter.ts`
**Problem:** All normalizer functions directly destructure API response objects without validation. If API-Football changes a field name or returns nulls, the adapter throws cryptic errors. No Zod schema, no runtime checks.
**Fix:** Add Zod schemas for critical API response types (fixture, team, standings). Validate before normalization. Log and skip malformed entries instead of crashing.

---

### DATA-07 | HIGH | Missing FK on leagueCoverage.leagueId

**File:** `src/lib/db/schema.ts:91`
**Problem:** `leagueId` has no `.references(() => competitions.id)`. Orphaned coverage rows can exist.
**Fix:** Add the foreign key reference.

---

### DATA-08 | MEDIUM | Missing indexes on injuries, transfers, coaches tables

**Files:** `src/lib/db/schema.ts`
**Problem:** `injuries` has no indexes at all. `transfers.playerId` is queried directly but unindexed. `coaches.currentTeamId` is queried in team page but unindexed. These will cause full table scans at scale.
**Fix:** Add indexes:
- `injuries(fixtureId)`
- `injuries(playerId)`
- `transfers(playerId)`
- `coaches(currentTeamId)`

---

### DATA-09 | MEDIUM | syncTopAssists overwrites synTopScorers data

**File:** `src/lib/ingestion/top-scorers.ts:63-96`
**Problem:** When `syncTopScorers` runs first, it writes complete stats JSONB. When `syncTopAssists` runs next for the same player, it replaces the entire `stats` column instead of merging. Comment says "Merge with existing stats" but implementation does `SET stats = row.stats`.
**Fix:** Use a JSONB merge strategy: `SET stats = existing.stats || new_stats` or read-modify-write.

---

### DATA-10 | MEDIUM | Unbounded query in getLeagueFixtures

**File:** `src/lib/db/queries/league.ts:312-329`
**Problem:** Returns ALL fixtures for a league season with no LIMIT. A league with 380 fixtures returns all of them with hydrated team+venue data.
**Fix:** Add pagination (LIMIT + OFFSET) or implement cursor-based pagination.

---

### DATA-11 | MEDIUM | Empty API key silently accepted

**File:** `src/lib/data/adapters/api-football/client.ts:12`
**Problem:** `'x-apisports-key': process.env.API_FOOTBALL_KEY ?? ''` — if the env var is missing, sends empty key. API returns 401 but failure is obscured.
**Fix:** Fail fast at client creation if `API_FOOTBALL_KEY` is undefined: `throw new Error('API_FOOTBALL_KEY is required')`.

---

### DATA-12 | MEDIUM | No retry logic in API adapter

**File:** `src/lib/data/adapters/api-football/client.ts:14`
**Problem:** 15-second timeout set but no retry mechanism for transient failures (5xx, timeouts, network drops). During live polling, a single timeout skips all updates for that 15-second window.
**Fix:** Add retry with exponential backoff (1s, 2s, 4s) for 5xx and timeout errors. Max 3 retries.

---

### DATA-13 | MEDIUM | Live poller has no quota enforcement

**File:** `workers/live-poller/src/quota.ts`
**Problem:** `trackCall()` increments counters but never enforces a limit. No circuit breaker. The poller calls API every 15s during live matches (240 calls/hour). If the daily limit is close, the poller will exceed it.
**Fix:** Add a check in `trackCall()` that throws or returns false when daily remaining < 100 or per-minute remaining < 10.

---

### DATA-14 | MEDIUM | Pusher trigger errors not caught independently

**File:** `workers/live-poller/src/poller.ts:99-100`
**Problem:** If `pusher.trigger()` fails, the DB update has already committed. Real-time clients never receive the score update but DB shows the new score.
**Fix:** Wrap Pusher calls in their own try/catch with a retry queue or at minimum log the failure distinctly.

---

### DATA-15 | LOW | `inserted` counter never incremented in sync functions

**Files:** `src/lib/ingestion/fixtures.ts:48`, `standings.ts:44`, `teams.ts:52`
**Problem:** `const inserted = 0` (not `let`) is declared but never assigned. Sync stats always show `inserted: 0`.
**Fix:** Change to `let inserted = 0` and increment on insert operations.

---

### DATA-16 | LOW | Duplicated hydration helpers across 8+ query files

**Files:** `queries.ts`, `queries-hydrate.ts`, `team.ts`, `player.ts`, `homepage.ts`, `right-rail.ts`, `top-matches.ts`, `fixtures-by-day.ts`, `editorial-hero.ts`
**Problem:** `getTeamsMap`, `getVenuesMap`, `hydrateFixtures`, `TeamSnapshot` type are duplicated. `queries-hydrate.ts` was created to centralize but only `league.ts` uses it.
**Fix:** Migrate all files to use the centralized `queries-hydrate.ts` exports. Remove duplicate definitions.

---

## Category 5: Code Quality

### CQ-01 | HIGH | Missing error boundaries (error.tsx / global-error.tsx)

See INF-01. Duplicated here for completeness in code quality tracking.

---

### CQ-02 | MEDIUM | 24 unused component/library files

**Dead homepage components (7):** `HomeFooterStrip.tsx`, `HomeLiveMatchCard.tsx`, `HomeTeamsTab.tsx`, `EditorialCards.tsx`, `HomeStatsTab.tsx`, `HomeStandingsTab.tsx`, `HomeUpcomingWeek.tsx`
**Dead tournament components (8):** `EditionSelector.tsx`, `DynamicDesktopBracket.tsx`, `FifaRankingBadge.tsx`, `KnockoutMatchCell.tsx`, `MoreMatchesTodayWidget.tsx`, `MoroccoContextLine.tsx`, `MeetTheTeamsCard.tsx`, `OverviewFeaturedPair.tsx`
**Dead other (4):** `TeamStandingsMini.tsx`, `DateStrip.tsx`, `PlayerSeasonHighlights.tsx`, `FeaturedVideosStrip.tsx`
**Dead library (5):** `club-team-names.ts`, `refresh-intervals.ts`, `wc2026-team-names.ts`, `cache-headers.ts`, `pusher-server.ts`

**Fix:** For each file, determine if it's planned for a future phase (move to backlog) or truly dead (delete). At minimum, add a `// @planned-phase-X` comment or remove.

---

### CQ-03 | MEDIUM | Duplicate `formatDate`/`formatTime`/`formatSeason` functions

**Problem:** `src/lib/utils/date.ts` exports format helpers, but 6+ components define their own local versions.
**Fix:** Consolidate all date/time formatting into `src/lib/utils/date.ts`. Update all components to import from there.

---

### CQ-04 | MEDIUM | Duplicated Morocco team IDs

**File:** `src/lib/db/queries/right-rail.ts:435`
**Problem:** Defines `const MOROCCO_TEAM_IDS = [31, 14461]` locally instead of importing from `src/lib/constants/canonical-ids.ts`.
**Fix:** Import from canonical-ids.ts.

---

### CQ-05 | MEDIUM | Silent search failure with no user feedback

**File:** `src/components/chrome/SearchModal.tsx:72`
**Problem:** `catch { // silently fail }` on search fetch. If the search API is down, the user sees nothing — no error, no "search unavailable" message.
**Fix:** Set an error state and display a message to the user.

---

### CQ-06 | LOW | 7 duplicate `baseUrl` definitions

**Files:** 7 page files and `cup-content.ts`
**Problem:** `const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'` repeated independently in each file.
**Fix:** Extract to a shared constant in `src/lib/constants/site.ts`.

---

### CQ-07 | LOW | Empty catch block in layout.tsx

**File:** `src/app/[locale]/layout.tsx:66`
**Problem:** `} catch (e) {}` in theme detection script.
**Fix:** Add comment: `catch { /* localStorage unavailable in SSR/privacy mode */ }`.

---

### CQ-08 | LOW | 10 commented-out code blocks across 5 files

**Files:** `BracketConnectors.tsx`, `schema.ts`, `right-rail.ts`, `competitions-mega-menu.ts`
**Fix:** Remove commented-out code. If needed later, it's in git history.

---

## Category 6: Performance

### PERF-01 | HIGH | 17 raw `<img>` tags instead of next/image

**Files:** `TickerStrip.tsx`, `HomeLiveMatchCard.tsx` (3), `NextMatchCard.tsx`, `HomeFooterStrip.tsx`, `FixtureRow.tsx`, `LeagueRightRailCard.tsx` (2), `WCFixturesTab.tsx`, `CupOverviewTab.tsx`, `TeamStatistics.tsx`, `LeagueLeftRail.tsx`, `CupFixturesTab.tsx`, `FeaturedMatchCard.tsx` (2), `TeamCompetitionTeams.tsx`
**Problem:** Bypasses Next.js image optimization (no WebP/AVIF, no srcset, no automatic lazy loading).
**Fix:** Replace with `next/image` using `width`, `height`, and `alt` props. For external images, ensure remote patterns are configured in `next.config.ts` (they already are for media.api-sports.io and i.ytimg.com).

---

### PERF-02 | MEDIUM | No dynamic imports / code-splitting

**Problem:** Zero `next/dynamic` or `React.lazy` usage. Heavy components (bracket views ~365 lines, search modal, about sections) are loaded eagerly.
**Fix:** Use `next/dynamic` for:
- Knockout bracket components (only loaded on bracket tab)
- Search modal (only loaded on search interaction)
- About/FAQ sections (below the fold)

---

### PERF-03 | MEDIUM | Competition page is 1,105 lines

**File:** `src/app/[locale]/(app)/competition/[country]/[tournament]/page.tsx`
**Problem:** Monolithic file handling both cup and league views. Hard to maintain.
**Fix:** Extract into separate files: `CupCompetitionPage.tsx` and `LeagueCompetitionPage.tsx`, orchestrated by the route's `page.tsx`.

---

## Category 7: Accessibility

### A11Y-01 | HIGH | text-tertiary color fails WCAG AA contrast

**Problem:** `--text-tertiary: #627080` on dark mode backgrounds fails WCAG AA (needs 4.5:1, gets 3.04-3.74:1). Used **348 times** across the codebase for captions, labels, timestamps.
**Fix:** Lighten `--text-tertiary` to at least `#8B96A9` (4.5:1 on `--bg-surface-2`) or `#95A0B3` (4.5:1 on `--bg-canvas`). Verify with a contrast checker.

---

### A11Y-02 | MEDIUM | Limited aria-label coverage on interactive elements

**Problem:** Only 20 `aria-label`/`aria-labelledby` across 70+ client components. Match cards, competition nav links, filter tabs likely lack screen reader context.
**Fix:** Audit all interactive elements (buttons, links, tabs, filters) and add descriptive `aria-label` attributes where the visual context is not sufficient for screen readers.

---

### A11Y-03 | MEDIUM | CenterTabs keyboard navigation incomplete

**Problem:** Uses `role="tablist"/"tab"/"tabpanel"` but lacks keyboard arrow-key handling and visible `aria-selected` state.
**Fix:** Implement arrow-key navigation per WAI-ARIA Tabs pattern. Add `aria-selected="true"` on the active tab.

---

## Category 8: i18n

### I18N-01 | LOW | Missing EN translation key

**File:** `src/lib/i18n/messages/en.json`
**Problem:** Missing `leaguePage.viewStandings` (present in `fr.json` and `ar.json`).
**Fix:** Add the missing key with the English translation.

---

## Recommended Implementation Order

**Phase A — Security blockers (do before any deployment):**
1. SEC-01 (rename proxy.ts to middleware.ts)
2. SEC-02 (remove NEXT_PUBLIC_ API key)
3. SEC-03 (fix ADMIN_SECRET, verify .env not in git, rotate credentials)
4. SEC-07 (add server-side auth to admin layout)
5. SEC-04 (add security headers)
6. SEC-05 (timing-safe cron comparison)
7. SEC-06 (rate limit admin login)

**Phase B — Infrastructure blockers (do before soft launch):**
1. INF-01 (error.tsx)
2. INF-02 (loading.tsx)
3. INF-03 (not-found.tsx)
4. INF-04 (sitemap.ts)
5. INF-05 (robots.ts)

**Phase C — Data integrity (do before live matches):**
1. DATA-01 + DATA-02 (transactions in ingestion)
2. DATA-03 + DATA-04 + DATA-05 (fix N+1 queries)
3. DATA-06 (API response validation)
4. DATA-11 (fail fast on missing API key)
5. DATA-13 (quota enforcement in poller)

**Phase D — SEO + Performance (do before public launch):**
1. SEO-01 + SEO-02 (match/coach metadata)
2. SEO-03 (OG images)
3. PERF-01 (replace raw img tags)
4. A11Y-01 (text-tertiary contrast)

**Phase E — Polish (post-launch acceptable):**
1. All MEDIUMs and LOWs not covered above
2. Dead code cleanup (CQ-02)
3. Code consolidation (CQ-03, CQ-06, DATA-16)

---

## End of Audit

This document is intended to be read by Claude Code as a task list. Each task ID (SEC-XX, INF-XX, etc.) can be referenced in BACKLOG.md entries and commit messages. No code was modified during this audit.
