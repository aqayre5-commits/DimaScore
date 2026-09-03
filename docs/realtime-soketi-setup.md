# Realtime — Soketi on Railway (self-hosted, free)

DimaScore's live layer (score/minute deltas) uses the **Pusher protocol**, but points at a
self-hosted **Soketi** server instead of hosted Pusher. The app code is already wired for this
(`src/lib/realtime/pusher-server.ts`, `pusher-client.ts`, and the Railway poller all use a custom
`PUSHER_HOST`). This runbook covers the infra that was never stood up.

> Nothing here puts secrets in the repo. Generate the credential triple yourself and paste it into
> the Railway/Vercel dashboards.

## 1. Generate an app credential triple

```bash
echo "APP_ID=$(openssl rand -hex 8)"
echo "APP_KEY=$(openssl rand -hex 16)"
echo "APP_SECRET=$(openssl rand -hex 24)"
```

Keep these three values — the same triple is used by Soketi, Vercel, and the poller.

## 2. Deploy Soketi on Railway

1. Railway → **New Service → Deploy a Docker Image**: `quay.io/soketi/soketi:1.6-16-alpine`.
2. Set the service variables:
   - `SOKETI_DEFAULT_APP_ID` = the APP_ID above
   - `SOKETI_DEFAULT_APP_KEY` = the APP_KEY above
   - `SOKETI_DEFAULT_APP_SECRET` = the APP_SECRET above
   - `SOKETI_DEFAULT_APP_ENABLE_CLIENT_MESSAGES` = `false`
   - `SOKETI_PORT` = `6001`  (Railway proxies this behind TLS on 443)
3. Railway → **Settings → Networking → Generate Domain**. Note the domain,
   e.g. `dimascore-soketi.up.railway.app` (used **without** protocol as the host below).

## 3. Wire the app (Vercel) and the poller (Railway)

Use the **host without protocol** (e.g. `dimascore-soketi.up.railway.app`).

**Vercel** (Production + Preview):

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_PUSHER_KEY` | APP_KEY |
| `NEXT_PUBLIC_PUSHER_HOST` | Soketi domain (no protocol) |
| `PUSHER_APP_ID` | APP_ID |
| `PUSHER_SECRET` | APP_SECRET |
| `PUSHER_HOST` | Soketi domain (no protocol) |

`NEXT_PUBLIC_PUSHER_HOST` is read at **build time** for both the client and the CSP
(`next.config.ts` allows `https://<host>` + `wss://<host>` in `connect-src`), so **redeploy Vercel**
after setting it.

**Railway — live-poller service:**

| Variable | Value |
|---|---|
| `PUSHER_APP_ID` | APP_ID |
| `NEXT_PUBLIC_PUSHER_KEY` | APP_KEY |
| `PUSHER_SECRET` | APP_SECRET |
| `PUSHER_HOST` | Soketi domain (no protocol) |

The poller (`workers/live-poller/src/poller.ts`) triggers `SCORE_UPDATE` on the `live-scores` and
`fixture-{id}` channels via `getPusherServer()`. It previously fell back to `api.pusherapp.com` with
an undefined key because `PUSHER_HOST`/credentials were unset — that is what these variables fix.

## 4. Verify

1. Open a page with live data (or the ticker). In DevTools → Network → WS, confirm a
   `wss://<soketi-domain>/app/<APP_KEY>` connection that stays open (no CSP violation in the console).
2. Force a delta: while a match is live (or by nudging a fixture's score in the DB on a Neon branch),
   confirm the score/minute updates without a reload.
3. Soketi health: `https://<soketi-domain>/` returns `OK`; `/usage` shows connections.

## Notes

- `pusher` / `pusher-js` remain the client/server SDKs — they speak Soketi's protocol; no dependency
  change is needed.
- Free tier: Soketi is lightweight and runs comfortably on Railway's hobby plan.
- To rotate credentials, regenerate the triple and update all three places (Soketi, Vercel, poller),
  then redeploy Vercel.
