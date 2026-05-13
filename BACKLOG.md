# Backlog — observations not actioned in the current task

Claude Code is required by `CLAUDE.md` Rule 5 to deposit observations here instead of acting on them mid-task. The user triages this list between phases.

## Format

```
- [YYYY-MM-DD][phase N] {one-line observation}
```

## Entries

<!-- Entries are appended below. Keep them one line each. -->
- [2026-05-12][phase 0] Deferred §J.0 task 14 (Vercel deploy). Will be picked up when there's a meaningful deployment to test, or as part of Phase 12 launch readiness. v1 Vercel project remains untouched for now.
- [2026-05-12][phase 1] API_FOOTBALL_KEY must be in .env.local before integration tests can run. User-managed (protected path).
- [2026-05-12][phase 2] Player seeding strategy: seed by SQUAD (GET /players/squads?team=) not by league enumeration. Squad-first is atomic and ~10% of daily quota. Lazy-fetch full player profiles only when needed.
- [2026-05-12][phase 2] Phase 2 player scope: Morocco men/women + all Botola clubs + WC 2026 48 nations + WAFCON 2026 ~12 nations + top-5 EU leagues (M+W). Estimated 6,000-7,000 unique players after deduplication.
- [2026-05-12][phase 2] Weekly cron job to refresh squads (transfer windows, new caps). Player stats refresh derives from /fixtures/players per played fixture, not /players bulk.
- [2026-05-12][phase 1 retrospective] Plan Part B had wrong API-Football league IDs (claimed Botola=322, real=200; Wydad=967, real=968; Raja=968, real=976; Coupe du Trône=670, real=822). Code now imports canonical IDs from src/lib/constants/canonical-ids.ts. Update Part B of plan to match verified IDs when convenient.
- [2026-05-12][phase 2] Première Ligue (France women's top flight) not surfaced in initial canonical-ID lookup. Discover via API during Phase 2 reference-data seed or in Phase 4 cleanup.
- [2026-05-12][phase 2] WC 2026 Qualification Africa (id=29) shows year=2023 in API. Investigate during seeding: may need different ID for the 2026 qualifier cycle, or API may not yet have populated the 2026 season.
- [2026-05-12][phase 2] Vary upgrade decision: stay on current plan (limit_day=7500) until Phase 2 seeding tells us if 7500 is enough. Upgrade to higher-tier (75k/day) only if real seeding hits the cap.
- [2026-05-12][phase 2.2 retro] drizzle-kit migrate does not auto-load .env.local. Future cron jobs or CI scripts must explicitly `set -a && source .env.local && set +a` before invoking drizzle-kit commands. Document in scripts/README.md or seed.ts header when those land.
- [2026-05-12][phase 2 retro] API-Football upgraded from Pro to Ultra. New daily limit: 75,000 requests/day (verify with /status). Previous concern about 7,500 limit is resolved. Phase 2 player seeding can run in single passes without throttling.
- [2026-05-12][phase 4] At Phase 4 start, read docs/research/atlaskings-v2-navigation-supplement.md and decide which Sofascore conventions to adopt: URL patterns, tab state via hash, slug ordering, breadcrumb structure, SWR refresh intervals, cache TTLs. Document decisions inline in the Phase 4 proposal.
- [2026-05-12][phase 5] Featured-match selection algorithm for homepage carousel. Sofascore uses (homeTeam.userCount + awayTeam.userCount) — we have no equivalent signal from API-Football. Default candidate: tier-based ranking (Tier 1 WC > Tier 2 Morocco > Tier 3 WAFCON > Tier 4 top-5 EU > Tier 5 other), with secondary sort by kickoff proximity (closest upcoming first). Decide at Phase 5 proposal time.
- [2026-05-12][phase 3+] Saudi Premier League Women (id=1227, season 2026 active) discovered during Tier 6 verification. Consider adding to VERIFIED_COMPETITIONS as Tier 5 (women's) addition.
- [2026-05-12][phase 2.4] Algeria Ligue 1 (186) and Tunisia Ligue 1 (202) have statistics_fixtures=false in coverage. Phase 8 UI must check coverage flags before rendering the Statistics tab for these leagues.
- [2026-05-12][phase 11+] Upstash Redis quota tracking deferred. Currently dead code (no-op when unconfigured). v2 scale (~600 calls/day) does not require it. Revisit if API-Football rate limiting becomes a real issue or if quota dashboard is needed for ops.
- [2026-05-12][phase 2.3 retro] Country-name-to-code resolution was missing across ingestion mappers (teams, venues). Caused FK violation on first real seed attempt. Fixed via buildCountryLookup() + resolveCountryCode() helper with alias map for API-Football quirks (England→GB-ENG, South-Korea→KR, etc). Future ingestion mappers MUST use this pattern for any country reference.
- [2026-05-12][phase 12] Optimize workers/live-poller/Dockerfile: add .dockerignore, multi-stage build, only copy what the worker actually needs from src/lib/. Current Dockerfile is functional but bloated for Railway production deployment.
- [2026-05-12][phase 4] shadcn style is "base-nova" (Base UI primitives), not the older "new-york" (Radix) preset referenced in some plan/research docs. Component APIs are similar but imports come from @base-ui/react. Document any deviations as encountered.
- [2026-05-13][phase 5] Live-poller worker must populate homeName/awayName in ScoreUpdatePayload when pushing to Pusher. Currently sends fixtureId + scores only. LiveTicker component falls back to "Team" when names are absent.

- [2026-05-13][phase 4.5] Visual richness pass. Sofascore visual analysis at docs/research/sofascore-analysis-atlas-kings-phase4-5.md is the authoritative reference. Three product decisions to lock before implementation: (a) LeftRail scope at current data state, (b) LiveTicker integration vs row-level live styling, (c) homepage hero philosophy. Target 8-12 writes across 2-3 sub-tasks.
