# dimascore-poller (Cloudflare) — shadow of the Railway live poller

Step 1 of `RAILWAY-MOVE-PLAN.md`. A single Durable Object (`LivePoller`, `idFromName('poller')`) runs an alarm loop with
the Railway cadence (15 s while a tracked match is live, else 60 s; ticks never closer than 14.5 s → ≤ 4 API-Football
calls/min, one per tick). The `* * * * *` cron is only a watchdog that re-arms a missing alarm.

`POLLER_MODE=shadow`: one `fixtures?live=all` call per tick plus Neon SELECTs; logs per tick

    [<iso>] [shadow] live=… tracked=… would_update=… would_details=… api_calls=1 total_calls=… next_tick=…s ms=… writes=0 pushes=0
      [shadow-delta] fixture=… changes=[…] score=… status=… min=… would_write=fixtures.upsert{…} would_push=live-scores,fixture-<id>:score-update payload={…}
      [shadow-details] fixture=… would_sync events=… lineups=… stats=…
      [shadow-ft-details] fixture=… would_sync full details

No INSERT/UPDATE code path exists in shadow mode, and `DB_READ_ONLY=1` makes every Neon query a READ ONLY transaction.
No Pusher/Soketi client is imported. `POLLER_MODE=off` stops ticking (alarm not re-armed, watchdog deletes it).

Deploy (workers.dev only, from the Mac): `npx wrangler deploy` in this folder; secrets DATABASE_URL, API_FOOTBALL_KEY.
`GET /status` returns the last tick summary (no secrets).
