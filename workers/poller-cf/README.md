# dimascore-poller (Cloudflare)

Replacement for the Railway `workers/live-poller`. A single Durable Object (`LivePoller`,
`idFromName('poller')`) runs an alarm loop with the Railway cadence (15 s while a tracked match
is live, else 60 s; ticks never closer than 14.5 s). On an API-Football 429 (HTTP or a 200 body
with a rate-limit error) the next tick is 60 s, then it recovers to 15 s after a clean tick with
tracked matches. The `* * * * *` cron is only a watchdog that re-arms a missing alarm.

`POLLER_MODE`:

- `off` — stop ticking (alarm not re-armed; watchdog deletes it).
- `shadow` — one `fixtures?live=all` plus Neon SELECTs; logs what it would write/push. No INSERT/UPDATE
  and no Pusher. Run with `DB_READ_ONLY=1` so Postgres also rejects writes.
- `live` — the same `fixtures` upserts as `workers/live-poller/src/poller.ts` and the same Pusher
  events (`live-scores` and `fixture-<id>`, event `score-update`, same payload) to Railway Soketi.
  `DB_READ_ONLY` must not be `1`. Secrets: `DATABASE_URL`, `API_FOOTBALL_KEY`, `PUSHER_APP_ID`,
  `PUSHER_SECRET`, `PUSHER_HOST`, `NEXT_PUBLIC_PUSHER_KEY` (names only; pipe values from Railway,
  never print them).

Deploy (workers.dev only): `npx wrangler deploy` in this folder. `GET /status` returns the last
tick summary (no secrets).
