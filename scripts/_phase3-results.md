# Phase 3 Results — Live data pipeline + realtime layer

**Date:** 2026-05-12
**Exit criterion (§J.3):** "Subscribe from a test client → write a fake live row → push received within 2s."

## Exit Criteria Test

| Metric | Value |
|--------|-------|
| Pusher event latency (run 1) | **143ms** |
| Pusher event latency (run 2) | **102ms** |
| Threshold | < 2,000ms |
| Verdict | **PASS** |

Test: `tsx --env-file=.env.local scripts/test-realtime.ts`

Sentinel fixture id=9000001, competition=Botola Pro 1 (200), Wydad (968) vs Raja (976). Inserted into Neon, Pusher event triggered from server, received by subscribed client in ~100-150ms. Cleanup confirmed.

## API Quota

| Metric | Value |
|--------|-------|
| Plan | Ultra (75,000/day) |
| Calls used today (post-test) | 2,531 |
| Calls used by Phase 3 testing | ~10 (live-poller test ticks + status checks) |

## Sub-task Summary

### 3.1 — Realtime layer (commit 3c02f2e)

- Pusher Channels (eu cluster) chosen over Ably / LISTEN+NOTIFY
- Created: `pusher-server.ts`, `pusher-client.ts`, `channels.ts` (channel names + event payload types)
- Created: `refresh-intervals.ts` (SWR intervals by status), `cache-headers.ts` (Cache-Control by endpoint)
- Unit tests for both constants modules
- Dependencies added: `pusher` (server), `pusher-js` (client)

### 3.2 — Live poller worker (commit 2221ce6)

- Created `workers/live-poller/` — standalone Node process, runs from project root via `tsx`
- Polls `/fixtures?live=all` every 15s (tracked matches live) or 60s (idle)
- Filters to 36 VERIFIED_COMPETITIONS (FK safety — discovered during first live test)
- Diffs API response against Neon rows, writes only deltas
- Triggers Pusher `score-update` on `live-scores` + `fixture-{id}` channels
- Structured logging: live count, tracked count, updated count, API calls, total calls
- Graceful shutdown on SIGINT/SIGTERM
- Unit tests for diff engine (8 cases)

### 3.3 — Exit criteria verification

- `scripts/test-realtime.ts`: end-to-end Pusher push latency test
- Pusher latency: ~100-150ms (eu cluster, tested from local machine)
- `pusher-js` CJS/ESM interop: default import works in Next.js bundler, named export via `require()` needed for tsx scripts

## Anomalies

1. **pusher-js import interop**: `pusher-js` declares `export default class Pusher` in types but ships CJS with `module.exports = { Pusher }`. Default import works in Next.js (bundler handles interop), but fails in tsx (raw Node CJS). Test script uses `require('pusher-js').Pusher`. App module uses `import PusherClient from 'pusher-js'` (bundler context). No action needed.

2. **Competition filtering**: First live poller run hit FK constraint violations — `/fixtures?live=all` returns globally live matches from leagues not in our DB. Fixed by filtering to `VERIFIED_COMPETITIONS` IDs before diffing/writing.

## Files Created/Modified (Phase 3 total)

| Sub-task | Files created | Files modified |
|----------|---------------|----------------|
| 3.1 | 7 (3 realtime, 2 constants, 2 tests) | 1 (package.json — deps) |
| 3.2 | 8 (7 worker, 1 test) | 2 (package.json — script, BACKLOG.md) |
| 3.3 | 2 (test script, this doc) | 1 (pusher-client.ts — import fix) |
| **Total** | **17** | **4** |

## Test Suite

- 176 tests passing (167 baseline + 9 Phase 3)
- Build clean
- Worker runs and polls correctly
