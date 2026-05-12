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
