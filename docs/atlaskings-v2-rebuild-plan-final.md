# Atlas Kings v2 — FINAL Rebuild Plan (locked)

**Status:** All decisions locked. This is the plan you hand to Claude Code.
**Target:** Atlas Kings becomes Morocco's Sofascore. Built fresh for season 2026/27 and beyond.
**Posture:** Nothing from the v1 prototype is reused except the text-normalization engine.
**Launch date:** **20 July 2026** — day after the FIFA World Cup 2026 final, 5 days before WAFCON 2026 kicks off in Morocco. 10-week build starting 11 May 2026.

### Locked decisions

| # | Decision | Value |
|---|----------|-------|
| 1 | **Data provider** | API-Football v3, **Pro plan** (~75k req/day, 450 req/min) |
| 2 | **Languages at launch** | FR (default), EN, AR (RTL) |
| 3 | **Domain** | atlaskings.com (rebrand later if needed) |
| 4 | **Editorial model** | **No CMS, no editors, no writers.** Every league/cup/team/match page has a **Media tab** with embedded YouTube videos curated through a lightweight admin. |
| 5 | **Scope** | Men's + women's football. Botola Pro 1+2 and Coupe du Trône (M), Botola Féminine and Coupe du Trône Féminine (W), CAF club & national competitions (M+W), top-5 EU leagues + UCL/UEL/UECL + UWCL, **FIFA WC 2026 (launch priority)**, FIFA Women's WC 2027 + qualifiers, **WAFCON 2026 (Morocco, 25 July)**. |
| 6 | **Betting/odds UI** | None. Loi 09-08 + brand protection. Predictions surface as editorial ("Atlas Kings prediction"). |
| 7 | **Launch date & content priority** | **20 July 2026**. FIFA WC 2026 (men's) is the **content priority throughout the build** — seeded first, tested first, backfilled completely by launch day. See Part N. |

---

## Part A — What API-Football v3 gives us

Base URL: `https://v3.football.api-sports.io/`
Auth: header `x-apisports-key: <KEY>`
Method: GET-only
Health check: `/status` (does not count against quota)

### A.1 Reference data (low refresh — daily cron)

| Endpoint | Returns | Use |
|----------|---------|-----|
| `/timezone` | Supported TZs | Set Africa/Casablanca server-side |
| `/countries` | 200+ countries with flag URLs | Country pages, flag rendering |
| `/leagues` | All competitions + **coverage object** + seasons array | Master catalogue we sync from |
| `/leagues/seasons` | All years available | Season selectors |
| `/venues` | Stadium info | Match detail venue card |

### A.2 The coverage object — the most important data structure in the entire build

Returned per competition by `/leagues`. Tells us what API-Football actually has for that league:

```json
"coverage": {
  "fixtures": {
    "events": true, "lineups": true,
    "statistics_fixtures": true, "statistics_players": true
  },
  "standings": true, "players": true,
  "top_scorers": true, "top_assists": true, "top_cards": true,
  "injuries": true, "predictions": true, "odds": true
}
```

**Every UI tab in Atlas Kings is gated on its coverage flag.** No empty tabs ever ship.

### A.3 Teams, players, coaches

| Endpoint | Returns | Cadence |
|----------|---------|---------|
| `/teams` | Team info | Daily |
| `/teams/statistics` | Per-team season stats — form, played, W/D/L, GF/GA, biggest win, longest streak, lineups by formation, cards by minute | Daily / after each match |
| `/teams/seasons` | Seasons a team played in | Daily |
| `/players/seasons` | Available seasons per player | Once |
| `/players/profiles` | Player bio | Daily |
| `/players` | Player + per-season stats (games, goals, assists, shots, passes, dribbles, duels, fouls, cards, rating) | Daily / after each match |
| `/players/squads` | Current roster | Daily |
| `/players/teams` | Club history | Daily |
| `/players/topscorers` | Top 20 goals | Hourly in-season |
| `/players/topassists` | Top 20 assists | Hourly |
| `/players/topyellowcards` | Top 20 yellow cards | Hourly |
| `/players/topredcards` | Top 20 red cards | Hourly |
| `/transfers` | Transfer history | Daily during windows |
| `/trophies` | Player/coach trophies | Once per profile |
| `/sidelined` | Suspensions / long-term injuries | Daily |
| `/injuries` | Recent injuries | Hourly |
| `/coachs` | Coach profile + career | Daily |

### A.4 Standings

`/standings` returns rank, points, P/W/D/L, GF/GA/GD, form string ("WWDLW"), group label, description ("Promotion - Champions League", "Relegation", etc.), and home/away splits — all in one call.

Cadence: every 1h in active season; immediately after any FT event in that league.

### A.5 Fixtures — the core

| Endpoint | Returns | Cadence |
|----------|---------|---------|
| `/fixtures` | Fixtures by date/league/season/team/status, score, status code, referee, venue, timestamp | 15s live; 1/min in-progress meta; daily for scheduled |
| `/fixtures?id={id}` | **Single fixture full payload** with embedded `events`, `lineups`, `statistics`, `players` | 15s while live |
| `/fixtures?ids=id1-id2-...` | Up to 20 fixtures in one call | Batch processing |
| `/fixtures?live=all` | All currently live across all leagues | 15s |
| `/fixtures?live=39-140` | Live in specific leagues | 15s |
| `/fixtures/rounds` | Round labels for a league/season | Daily |
| `/fixtures/headtohead` | H2H between two teams | On-demand |
| `/fixtures/statistics` | Possession, shots, corners, fouls, offsides, cards, saves, passes, expected_goals (where covered) | 1/min while live |
| `/fixtures/events` | Goals/cards/subs/VAR timeline | 15s while live |
| `/fixtures/lineups` | Starting XI, formation, grid positions (line:column), bench, coach | 15 min; available 20–40min pre-kickoff |
| `/fixtures/players` | Per-player match stats: minutes, rating, captain, position, shots, goals, passes, tackles, duels, dribbles, fouls, cards, penalty events | 1/min while live |

### A.6 Status code map

Used as our internal `FixtureStatus` enum. Every code gets a defined UI treatment.

| Code | Meaning | UI treatment |
|------|---------|--------------|
| TBD | To be defined | "TBD" |
| NS | Not started | Kickoff time |
| 1H / 2H | First/second half | Live, minute counter |
| HT | Half time | Live, "HT" badge |
| ET | Extra time | Live, "ET" + minute |
| BT | Break time | "Break" |
| P | Penalty in progress | Live, "PEN" |
| SUSP / INT | Suspended / interrupted | Amber badge |
| FT | Full time | Final score |
| AET / PEN | After extra time / shootout | Badge + final |
| PST / CANC / ABD | Postponed / cancelled / abandoned | Grey badge |
| AWD / WO | Awarded / walkover | Grey badge |
| LIVE | In progress (half unknown) | Live, no minute |

### A.7 Predictions (NOT betting)

`/predictions?fixture={id}` — pre-match prediction: winner pct, advice, comparative stats, expected goals. We surface this as **"Atlas Kings prediction"**, editorial framing, no odds shown anywhere.

### A.8 Odds — ignored

We never call `/odds`, `/odds/live`, `/odds/bookmakers`, `/odds/bets`, or `/odds/mapping`. No betting UI.

### A.9 Rate-limit handling (Pro tier: 75k/day, 450/min)

Response headers we monitor in every call:
- `x-ratelimit-requests-limit` — daily cap (75,000)
- `x-ratelimit-requests-remaining` — daily remaining
- `X-RateLimit-Limit` — per-minute cap (450)
- `X-RateLimit-Remaining` — per-minute remaining

**Adapter rule:** every response writes remaining quota to Redis. At <10% daily we degrade non-essential crons (skip predictions, slow standings to 6h). At 0 per-minute, exponential backoff with jitter.

### A.10 Quota budget (Pro tier ~75k/day, very comfortable)

| Job | Frequency | Calls |
|-----|-----------|-------|
| Reference data sync | Daily | ~50 |
| Fixture schedule (60 tracked leagues × 7 days) | Hourly | 60 × 24 = 1,440 |
| Standings (60 leagues) | Hourly | 1,440 |
| Top scorers/assists/cards (3 × ~40 leagues with coverage) | Hourly | 2,880 |
| Injuries + transfers | Every 6h | ~150 |
| Player profiles (followed) | Daily | ~600 |
| Live polling (avg 8 live × 4 calls/min × 90 min) | While live | ~2,880/day |
| Match detail backfill | On each FT | ~250/day |
| Headroom for ad-hoc + retries | | ~2,000 |
| **Daily total estimate** | | **~11,700 / 75,000** (~15% of quota) |

That leaves 85% headroom. WAFCON week (huge spike in interest, all 32 group stage matches in 12 days) tested: ~22k calls/day at peak. Still within budget.

---

## Part B — Launch league list (locked, ordered by ingestion priority)

Sixty competitions. Ordered by **ingestion and content priority** for the build. Tier 1 gets seeded and validated first, Tier 5 last. Coverage flags gate UI per-league at runtime.

The ordering matters: it tells Claude Code which competitions to seed first in Phase 2, which match to use as the canonical UI test case in Phase 8, and which content must be backfilled before launch.

### Tier 1 — Launch priority (seed first, full backfill required by launch day)

| Competition | API-Football league_id | Why this tier |
|-------------|------------------------|---------------|
| **FIFA World Cup 2026** (USA/Mexico/Canada) | **1** | Running 11 June – 19 July 2026 — during the entire build. Morocco is in Group C with Brazil, Haiti, Scotland. Every match must be perfectly backfilled by launch day (20 July). **The canonical match for UI validation is Brazil vs Morocco, 13 June 2026 at MetLife Stadium.** |
| WC 2026 Qualifiers (CAF, UEFA, CONMEBOL, AFC, CONCACAF, OFC) | various | Historical context for the WC — already complete by build start. |

### Tier 2 — Morocco-focus, men's (always featured on homepage)

| Competition | API-Football league_id | Notes |
|-------------|------------------------|-------|
| Botola Pro 1 | 322 | Domestic top flight |
| Botola Pro 2 | 323 | Second tier |
| Coupe du Trône | 670 | Main domestic cup |
| Morocco national team (Atlas Lions) | via team_id 31 | Tied to WC 2026 and AFCON 2027 |

### Tier 3 — WAFCON 2026 + Morocco women's (second launch event)

| Competition | Notes |
|-------------|-------|
| **WAFCON 2026** | **25 July – 16 August 2026, Morocco — second launch event, 5 days after v2 goes live.** |
| WAFCON Qualifiers | Historical context |
| Botola Pro Féminine | Domestic women's top flight (coverage may be partial — gated by flag) |
| Coupe du Trône Féminine | Domestic women's cup (gated by flag) |
| Morocco women's national team (Atlas Lionesses) | Featured on homepage Morocco snapshot rail |

### Tier 4 — Top European leagues (men's + women's)

| Men's | API-Football id | Women's |
|-------|------------------|---------|
| Premier League (EPL) | 39 | Women's Super League (WSL) |
| La Liga | 140 | Liga F (Spain) |
| Serie A | 135 | Serie A Femminile |
| Bundesliga | 78 | Frauen-Bundesliga |
| Ligue 1 | 61 | Première Ligue (FR) |
| UEFA Champions League | 2 | UEFA Women's Champions League |
| UEFA Europa League | 3 | UEFA Women's Nations League |
| UEFA Conference League | 848 | |
| UEFA Nations League | various | |
| UEFA Euro Qualifiers | various | |

### Tier 5 — Other African + international

| Competition | Notes |
|-------------|-------|
| CAF Champions League | Men |
| CAF Confederation Cup | Men |
| **CAF Africa Cup of Nations (AFCON)** | Next edition 2027 |
| AFCON Qualifiers | |
| CAF Women's Champions League | |
| African Football League | New continental club super-league |
| FIFA Women's World Cup 2027 (Brazil) | Year-out coverage starts after WAFCON |
| Women's WC 2027 Qualifiers (all confederations) | |
| FIFA Club World Cup | Men's |
| FIFA Women's Club World Cup (new, 2026) | |
| Olympics — Football (M+W) | When in season |
| Arab Cup (M+W) | |

### Diaspora-relevant (Moroccan players abroad)

Tracked automatically through player-following: any player linked to a tracked Morocco team or who has played for Morocco at any level. Their club competitions are auto-added to the ingestion queue.

**Total: 60 competitions tracked on day one.** All gated through coverage flags — if API-Football doesn't have data for, say, Botola Pro Féminine standings, the Standings tab simply doesn't render for that league. Once their coverage extends, the tab appears automatically.

**Phase 2 seeding order is the tier order above:** WC 2026 (league_id=1) is the first competition Claude Code seeds, with all 12 groups, all 48 teams, and all 104 fixtures populated before any other league is touched. This is non-negotiable — see Part N.

---

## Part C — Premium colour palette: "Atlas Royal"

A deep editorial palette referencing zellige saturation, Atlas dusk, and Saadian gold — premium, distinct from Sofascore's tactical navy/lime.

### Dark mode (default — data pages)

| Token | Hex | Role |
|-------|-----|------|
| `--bg-canvas` | `#0B1220` | App background — deep midnight with indigo undertone |
| `--bg-surface` | `#111A2E` | Cards, panels |
| `--bg-surface-2` | `#18243D` | Elevated (modals, dropdowns, hover) |
| `--bg-surface-3` | `#1F2D4B` | Table row hover, selected state |
| `--border-subtle` | `#1F2D4B` | 1px row dividers |
| `--border-strong` | `#2A3B5F` | Card borders, section dividers |
| `--text-primary` | `#F5F7FA` | Body text — never pure white |
| `--text-secondary` | `#A8B3CC` | Meta, timestamps, headers |
| `--text-tertiary` | `#6B7894` | Disabled, captions |
| **`--accent-gold`** | `#D4A24C` | **Primary brand** — Saadian gold. Logo, CTAs, top-3, hero |
| `--accent-gold-bright` | `#E8B85A` | Hover |
| `--accent-gold-deep` | `#A37D32` | Pressed |
| **`--accent-crimson`** | `#C8102E` | Morocco red — live indicator, red cards, relegation zone |
| **`--accent-emerald`** | `#0B6E4F` | Morocco green — wins, qualification zones |
| `--accent-emerald-bright` | `#13A074` | Positive deltas, hover |
| `--accent-azure` | `#3B82C4` | Links, info, Champions League zone |
| `--accent-amber` | `#E8A23A` | Europa zone, yellow cards, draws |
| `--accent-violet` | `#7C5DC8` | Conference League zone, MOTM |
| `--score-live` | `#FF4D5E` | Live score number |
| `--score-live-bg` | `#2D1419` | Live row tint |

### Light mode (Media tab, About pages)

| Token | Hex |
|-------|-----|
| `--bg-canvas` | `#F7F5F0` (warm paper) |
| `--bg-surface` | `#FFFFFF` |
| `--text-primary` | `#0B1220` |
| `--text-secondary` | `#4A5468` |
| `--accent-gold` | `#A37D32` (deepened for AA contrast) |

All accent colours pass WCAG AA on `--bg-surface` at body sizes.

---

## Part D — Tech stack (locked)

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router, RSC) |
| Language | TypeScript strict |
| Styling | Tailwind CSS 4 + CSS variables |
| UI primitives | Radix UI + shadcn/ui |
| Icons | Lucide React |
| Fonts | Inter (FR/EN), IBM Plex Sans Arabic (AR), tabular numerals via `font-feature-settings: 'tnum'` |
| Charts | Recharts + D3 |
| State | Zustand (UI) + SWR (server-state polling) |
| Realtime | Realtime layer TBD — Pusher/Ably or LISTEN/NOTIFY (Phase 3 decision) (Postgres WAL → WebSocket) |
| Database | Neon Postgres |
| ORM | Drizzle |
| Cache | Vercel Data Cache + Upstash Redis (quota tracking + live state) |
| Cron | Vercel Cron (≥1min) + Railway worker (15s live poller) |
| i18n | next-intl (FR default, EN, AR) |
| Search | Meilisearch self-hosted on Railway, trilingual tokenization |
| Auth | Clerk or Auth.js for user auth (Phase 10 decision) (email magic link + Google) — only needed for Favorites and Admin |
| **Media admin** | Tiny in-app admin route (`/admin/media`) protected by Clerk or Auth.js for user auth (Phase 10 decision) + role check. **No Payload CMS, no Sanity, no editorial workflow.** Just paste-a-URL with oEmbed enrichment. |
| Analytics | Plausible + Vercel Analytics |
| Image CDN | Cloudinary |
| Hosting | Vercel (frontend) + Railway (live poller, Meilisearch) |
| Monitoring | Sentry + BetterStack uptime |
| CI | GitHub Actions — typecheck, lint, Vitest, Playwright |

### What we explicitly do NOT use

- ❌ `pages` router — App Router only
- ❌ CSS-in-JS — Tailwind only
- ❌ Prisma — Drizzle is faster on edge
- ❌ Redux — Zustand
- ❌ Material UI / Chakra — fight Tailwind
- ❌ **Payload / Sanity / any CMS** — your decision, the Media tab replaces the editorial layer
- ❌ Betting/odds UI

---

## Part E — The Media tab (NEW — replaces editorial)

This is the most important architectural change from the previous draft. Sofascore has a video tab on every league/match page. We do the same with YouTube embeds.

### E.1 The model

Every **competition**, **team**, **match**, and **player** has a Media tab. Inside the tab: a curated list of YouTube videos with a category filter.

**Video categories** (pre-defined enum):

| Category | Examples |
|----------|----------|
| `highlights` | Match highlight reels |
| `goals` | Goal-of-the-week, individual goal clips |
| `interview` | Press conferences, player interviews |
| `analysis` | Tactical breakdowns, post-match analysis |
| `preview` | Pre-match preview shows |
| `documentary` | Long-form behind-the-scenes |
| `news` | Brief news clips |
| `training` | Training-session clips |

### E.2 Adding videos (the admin)

A single page at `/admin/media` (Clerk or Auth.js for user auth (Phase 10 decision) + role=`editor` required, gated by middleware):

1. Editor pastes a YouTube URL.
2. Backend parses the video id from the URL (`youtube.com/watch?v=X`, `youtu.be/X`, or `youtube.com/embed/X`).
3. Backend calls YouTube oEmbed (no API key needed): `https://www.youtube.com/oembed?url={url}&format=json` → returns title, author, thumbnail, embed HTML.
4. Editor picks category and tags (competition_id, team_id, match_id, player_id — multi-select).
5. Save → row in `media_videos` table.

That's the entire admin workflow. No rich text, no draft state, no review queue. Open page, paste URL, tag, save. **You can run the whole site solo without a single writer.**

### E.3 Display

Each entity's Media tab queries `media_videos` filtered by that entity's id and the selected category, ordered by `published_at DESC`. The grid is:

- Desktop: 3-column thumbnail grid with hover-play preview
- Mobile: 1-column with title, thumbnail, duration overlay, channel name
- Clicking a thumbnail opens the YouTube IFrame Player (lazy-loaded — `react-lite-youtube-embed`) inside a modal so the user stays on Atlas Kings

### E.4 Legal & ToS compliance

Confirmed legally clean:
- YouTube's ToS expressly permits embedding via the official embeddable player
- We only embed videos where the uploader has left embedding enabled (the player simply refuses videos with embedding disabled — no workaround needed)
- We never download, re-host, or modify video content
- The page is **not** primarily YouTube content — it's primarily live football data with video as a complement. This sidesteps the "advertising on a page where YouTube videos are the main draw" ToS clause
- Standard `oembed` calls don't need an API key (rate-limited but generous for our admin-only use)

### E.5 Schema for the media layer

```sql
CREATE TYPE video_category AS ENUM (
  'highlights','goals','interview','analysis',
  'preview','documentary','news','training'
);

CREATE TABLE media_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_id TEXT UNIQUE NOT NULL,           -- 'dQw4w9WgXcQ'
  title TEXT NOT NULL,                       -- from oEmbed
  channel_name TEXT,                         -- from oEmbed
  channel_url TEXT,
  thumbnail_url TEXT,                        -- maxres if available, fallback to hq
  duration INT,                              -- seconds, optional, from Data API if we ever upgrade
  category video_category NOT NULL,
  language TEXT DEFAULT 'fr',                -- 'fr'|'en'|'ar' best-guess for filtering
  -- Tags (multi-relation)
  competition_ids BIGINT[] DEFAULT '{}',
  team_ids BIGINT[] DEFAULT '{}',
  fixture_ids BIGINT[] DEFAULT '{}',
  player_ids BIGINT[] DEFAULT '{}',
  -- Metadata
  added_by UUID,                             -- editor user id
  published_at TIMESTAMPTZ DEFAULT now(),
  is_featured BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ON media_videos USING GIN (competition_ids);
CREATE INDEX ON media_videos USING GIN (team_ids);
CREATE INDEX ON media_videos USING GIN (fixture_ids);
CREATE INDEX ON media_videos USING GIN (player_ids);
CREATE INDEX ON media_videos (category, published_at DESC) WHERE is_archived = false;
```

GIN indexes on the array columns make the "all videos tagged to competition X" query fast even with thousands of rows.

### E.6 Lazy loading the YouTube iframe

Embedding YouTube iframes directly tanks Core Web Vitals (each iframe = ~500KB JS). We use the "facade" pattern: render a static thumbnail + play button; only swap to the real iframe on user click. Library: `react-lite-youtube-embed` (or write our own — it's ~50 lines).

---

## Part F — Feature map per page

### F.1 Homepage features

| Feature | Endpoints / source | Coverage gate |
|---------|---------------------|---------------|
| Today's fixtures grouped by competition | `/fixtures?date={today}&timezone=Africa/Casablanca` | Always |
| Live fixtures pinned + minute tickers | `/fixtures?live=all` polled 15s | Always |
| Date strip (yesterday + today + next 6 days) | `/fixtures?date={date}` | Always |
| Morocco snapshot rail (Botola top 3, Atlas Lions next match, Atlas Lions Women next match) | `/standings` + `/fixtures?team={id}&next=1` | `standings` |
| Top scorers in featured leagues | `/players/topscorers?league&season` | `top_scorers` |
| **Tournament hero banner** (dynamic, see below) | Hardcoded module with auto-rotation | N/A |
| Featured videos strip | `media_videos WHERE is_featured = true` | N/A |

**Tournament hero rotation rules:**
- **Until 19 July 2026** (WC final): show "FIFA World Cup 2026" hero with Morocco's next/last fixture, group standings snapshot, and countdown to the next Morocco match. This is the launch-day hero — must be polished.
- **20 July – 24 July 2026**: show "WAFCON 2026 starts in N days" countdown.
- **25 July – 16 August 2026** (WAFCON): show "WAFCON 2026" hero with Atlas Lionesses' next/last fixture, group standings, countdown to next match.
- **After 16 August**: rotate to the next major event (typically Botola Pro 2026/27 season kickoff in September).

The rotation is data-driven — the hero component reads from a small `featured_tournament` config that the user updates manually or via an admin route in a later phase.

### F.2 Competition page tabs

| Tab | Endpoints | Gate |
|-----|-----------|------|
| **Overview** | `/standings`, `/fixtures?last=5&next=5`, `/players/topscorers` | `standings` |
| **Matches** (round-by-round) | `/fixtures/rounds`, `/fixtures?round=X` | Always |
| **Standings** (All/Home/Away) | `/standings` | `standings` |
| **Top scorers** | `/players/topscorers` | `top_scorers` |
| **Top assists** | `/players/topassists` | `top_assists` |
| **Top cards** | `/players/topyellowcards`, `/players/topredcards` | `top_cards` |
| **Injuries** | `/injuries?league&season` | `injuries` |
| **Bracket** (cups only) | `/fixtures?round=X` parsed | League type = cup |
| **Media** | `media_videos WHERE competition_ids @> ARRAY[id]` | N/A — always available, empty state if no videos yet |

### F.3 Team page tabs

| Tab | Endpoints | Gate |
|-----|-----------|------|
| **Overview** | `/teams?id`, `/teams/statistics`, `/fixtures?team&last=5&next=5`, `/standings` highlighted | Always |
| **Matches** | `/fixtures?team&season` | Always |
| **Squad** | `/players/squads?team` + `/players?team&season` | `players` |
| **Stats** | `/teams/statistics` | Always; richer with `statistics_fixtures` |
| **Transfers** | `/transfers?team` | Always (depth varies) |
| **Injuries** | `/injuries?team` | `injuries` |
| **Media** | `media_videos WHERE team_ids @> ARRAY[id]` | N/A |

### F.4 Match detail tabs

| Tab | Endpoint | Gate |
|-----|----------|------|
| **Summary** | `/fixtures?id={id}` (single call returns everything) | Always |
| **Lineups** with formation pitch | embedded `lineups[]` | `lineups` |
| **Stats** | embedded `statistics[]` | `statistics_fixtures` |
| **Player ratings** | embedded `players[].rating` | `statistics_players` |
| **Events timeline** | embedded `events[]` | `events` |
| **H2H** | `/fixtures/headtohead?h2h={homeId}-{awayId}` | Always |
| **Standings snapshot** | `/standings` | `standings` |
| **Atlas Kings prediction** | `/predictions?fixture={id}` | `predictions` |
| **Media** | `media_videos WHERE fixture_ids @> ARRAY[id]` | N/A |

### F.5 Player page tabs

| Tab | Endpoint | Gate |
|-----|----------|------|
| **Overview** | `/players/profiles?player`, `/players?id&season` | `players` |
| **Career** | `/players/teams?player`, `/trophies?player` | Always |
| **Statistics** | `/players?id&season` | `players` |
| **Transfers** | `/transfers?player` | Always |
| **Sidelined / Injuries** | `/sidelined?player`, `/injuries?player` | `injuries` |
| **Media** | `media_videos WHERE player_ids @> ARRAY[id]` | N/A |

### F.6 Cross-cutting

- **Global search** (teams, players, competitions, videos) via Meilisearch with trilingual tokenization
- **Favorites** (followed teams, leagues, players) — Clerk or Auth.js for user auth (Phase 10 decision) + a `user_favorites` table
- **Push notifications** Phase 11 — Web Push API + service worker
- **Match calendar export (.ics)** — one route handler
- **Light/dark mode** — dark on data pages, light on media-heavy and About pages
- **RTL Arabic** — full layout mirror via Tailwind `dir-` variants

---

## Part G — Data architecture

```
┌─────────────────────────────────────────────────────────┐
│  CLIENT (Next.js App Router)                            │
│  - RSC for SEO pages                                    │
│  - Client components for live tickers and Realtime      │
│  - SWR polling fallback                                 │
└──────────────────────┬──────────────────────────────────┘
                       │ talks only to our /api/v1/*
                       ▼
┌─────────────────────────────────────────────────────────┐
│  EDGE: app/api/v1/* (Next.js route handlers)            │
│  - Reads from Neon                                  │
│  - NEVER calls api-football directly from the client    │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  NEON Postgres (Realtime layer TBD)                           │
│  - 13 tables (Part H schema)                            │
│  - Realtime: fixtures channel pushes in-play deltas     │
└──────────────────────┬──────────────────────────────────┘
                       ▲ writes only
┌──────────────────────┴──────────────────────────────────┐
│  INGESTION (two layers)                                 │
│                                                          │
│  Vercel Cron (≥1 min):                                  │
│   • reference-data        daily 03:00 Africa/Casablanca │
│   • fixtures-schedule     hourly                        │
│   • standings             hourly + on FT                │
│   • top-stats             hourly                        │
│   • injuries-transfers    every 6h                      │
│   • player-profiles       daily                         │
│                                                          │
│  Railway worker (sub-minute, only while LIVE>0):        │
│   • live-poller           every 15s                     │
│     → /fixtures?live=all                                │
│     → /fixtures?id={liveId} per live match              │
│     → diff vs Neon, write deltas                        │
│     → Realtime broadcasts automatically (Postgres WAL)  │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  DATA PROVIDER ADAPTER (interface-driven)               │
│  - ApiFootballAdapter (complete, current)               │
│  - SportmonksAdapter / OptaAdapter (future stubs)       │
│                                                          │
│  Rate-limit middleware on every call:                   │
│   - Read x-ratelimit-* headers                          │
│   - Write to Redis: api:quota:daily, api:quota:minute   │
│   - Throw RateLimitExceeded → caller backs off          │
└─────────────────────────────────────────────────────────┘
```

**The critical pattern:** the browser never talks to API-Football. 10,000 simultaneous users on a live WAFCON match = 0 API calls because all the data is in our DB and pushed via Realtime.

---

## Part H — Database schema (Drizzle / Postgres)

13 tables. Same as the previous iteration plus the `media_videos` table from Part E.5.

```sql
-- ───── Reference ─────

CREATE TABLE countries (
  code TEXT PRIMARY KEY,
  name JSONB NOT NULL,                       -- {fr, en, ar}
  flag_url TEXT
);

CREATE TABLE competitions (
  id BIGINT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name JSONB NOT NULL,
  country_code TEXT REFERENCES countries(code),
  type TEXT NOT NULL,                        -- 'League' | 'Cup'
  tier INT,
  is_women BOOLEAN DEFAULT false,            -- NEW: gender flag
  logo_url TEXT,
  primary_color TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_morocco_focus BOOLEAN DEFAULT false,
  display_priority INT DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ON competitions(country_code);
CREATE INDEX ON competitions(slug);
CREATE INDEX ON competitions(is_women);

CREATE TABLE seasons (
  competition_id BIGINT REFERENCES competitions(id),
  year INT NOT NULL,
  start_date DATE, end_date DATE,
  is_current BOOLEAN DEFAULT false,
  PRIMARY KEY (competition_id, year)
);

CREATE TABLE league_coverage (
  league_id BIGINT NOT NULL, season INT NOT NULL,
  events BOOLEAN, lineups BOOLEAN,
  statistics_fixtures BOOLEAN, statistics_players BOOLEAN,
  standings BOOLEAN, players BOOLEAN,
  top_scorers BOOLEAN, top_assists BOOLEAN, top_cards BOOLEAN,
  injuries BOOLEAN, predictions BOOLEAN, odds BOOLEAN,
  synced_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (league_id, season)
);

-- ───── Entities ─────

CREATE TABLE venues (
  id BIGINT PRIMARY KEY,
  name TEXT, city TEXT, country_code TEXT,
  capacity INT, surface TEXT, image_url TEXT
);

CREATE TABLE teams (
  id BIGINT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name JSONB NOT NULL, short_name JSONB NOT NULL,
  code TEXT, country_code TEXT REFERENCES countries(code),
  founded INT, logo_url TEXT,
  venue_id BIGINT REFERENCES venues(id),
  primary_color TEXT, secondary_color TEXT,
  is_national BOOLEAN DEFAULT false,
  is_women BOOLEAN DEFAULT false,            -- NEW
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ON teams(country_code);
CREATE INDEX ON teams(slug);
CREATE INDEX ON teams(is_women);

CREATE TABLE players (
  id BIGINT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name JSONB NOT NULL, firstname TEXT, lastname TEXT,
  birth_date DATE, birth_place TEXT, birth_country_code TEXT,
  nationality_code TEXT, height TEXT, weight TEXT,
  photo_url TEXT,
  current_team_id BIGINT REFERENCES teams(id),
  position TEXT, shirt_number INT,
  injured BOOLEAN DEFAULT false,
  is_women BOOLEAN DEFAULT false,            -- NEW
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ON players(current_team_id);
CREATE INDEX ON players(slug);
CREATE INDEX ON players(is_women);

CREATE TABLE coaches (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL, firstname TEXT, lastname TEXT,
  birth_date DATE, nationality_code TEXT, photo_url TEXT,
  current_team_id BIGINT REFERENCES teams(id),
  career JSONB
);

-- ───── Fixtures + live ─────

CREATE TABLE fixtures (
  id BIGINT PRIMARY KEY,
  competition_id BIGINT REFERENCES competitions(id),
  season_year INT NOT NULL,
  round TEXT, round_number INT,
  kickoff_at TIMESTAMPTZ NOT NULL,
  status_code TEXT NOT NULL,
  minute INT, extra_minute INT,
  home_team_id BIGINT REFERENCES teams(id),
  away_team_id BIGINT REFERENCES teams(id),
  home_score INT, away_score INT,
  home_score_ht INT, away_score_ht INT,
  home_score_ft INT, away_score_ft INT,
  home_score_et INT, away_score_et INT,
  home_score_pen INT, away_score_pen INT,
  venue_id BIGINT REFERENCES venues(id),
  referee TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ON fixtures(kickoff_at);
CREATE INDEX ON fixtures(status_code)
  WHERE status_code IN ('1H','HT','2H','ET','BT','P','LIVE');
CREATE INDEX ON fixtures(competition_id, season_year, round_number);
CREATE INDEX ON fixtures(home_team_id);
CREATE INDEX ON fixtures(away_team_id);

CREATE TABLE fixture_events (
  id BIGSERIAL PRIMARY KEY,
  fixture_id BIGINT REFERENCES fixtures(id) ON DELETE CASCADE,
  team_id BIGINT REFERENCES teams(id),
  player_id BIGINT REFERENCES players(id),
  assist_player_id BIGINT REFERENCES players(id),
  minute INT NOT NULL, extra_minute INT,
  type TEXT NOT NULL, detail TEXT, comments TEXT
);
CREATE INDEX ON fixture_events(fixture_id, minute);

CREATE TABLE fixture_lineups (
  fixture_id BIGINT REFERENCES fixtures(id) ON DELETE CASCADE,
  team_id BIGINT REFERENCES teams(id),
  coach_id BIGINT REFERENCES coaches(id),
  formation TEXT,
  starters JSONB NOT NULL, substitutes JSONB NOT NULL,
  PRIMARY KEY (fixture_id, team_id)
);

CREATE TABLE fixture_statistics (
  fixture_id BIGINT REFERENCES fixtures(id) ON DELETE CASCADE,
  team_id BIGINT REFERENCES teams(id),
  stats JSONB NOT NULL,
  PRIMARY KEY (fixture_id, team_id)
);

CREATE TABLE fixture_player_stats (
  fixture_id BIGINT REFERENCES fixtures(id) ON DELETE CASCADE,
  team_id BIGINT REFERENCES teams(id),
  player_id BIGINT REFERENCES players(id),
  minutes_played INT, rating NUMERIC(3,1),
  captain BOOLEAN, position TEXT, substitute BOOLEAN,
  stats JSONB NOT NULL,
  PRIMARY KEY (fixture_id, player_id)
);
CREATE INDEX ON fixture_player_stats(player_id);

-- ───── Standings ─────

CREATE TABLE standings (
  id BIGSERIAL PRIMARY KEY,
  competition_id BIGINT REFERENCES competitions(id),
  season_year INT NOT NULL,
  group_label TEXT NOT NULL,
  team_id BIGINT REFERENCES teams(id),
  rank INT NOT NULL, points INT NOT NULL, played INT NOT NULL,
  won INT, drawn INT, lost INT,
  goals_for INT, goals_against INT, goal_diff INT,
  form TEXT, description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(competition_id, season_year, group_label, team_id)
);
CREATE INDEX ON standings(competition_id, season_year, group_label, rank);

-- ───── Aggregates ─────

CREATE TABLE player_season_stats (
  player_id BIGINT REFERENCES players(id),
  team_id BIGINT REFERENCES teams(id),
  competition_id BIGINT REFERENCES competitions(id),
  season_year INT NOT NULL,
  stats JSONB NOT NULL,
  PRIMARY KEY (player_id, team_id, competition_id, season_year)
);
CREATE INDEX ON player_season_stats(competition_id, season_year);

CREATE TABLE transfers (
  id BIGSERIAL PRIMARY KEY,
  player_id BIGINT REFERENCES players(id),
  date DATE, type TEXT,
  from_team_id BIGINT REFERENCES teams(id),
  to_team_id BIGINT REFERENCES teams(id),
  fee TEXT
);

CREATE TABLE injuries (
  id BIGSERIAL PRIMARY KEY,
  player_id BIGINT REFERENCES players(id),
  team_id BIGINT REFERENCES teams(id),
  fixture_id BIGINT REFERENCES fixtures(id),
  type TEXT, reason TEXT, date DATE
);

CREATE TABLE predictions (
  fixture_id BIGINT PRIMARY KEY REFERENCES fixtures(id) ON DELETE CASCADE,
  winner_id BIGINT REFERENCES teams(id), winner_comment TEXT,
  win_or_draw BOOLEAN, under_over TEXT,
  goals_home TEXT, goals_away TEXT, advice TEXT,
  percent_home INT, percent_draw INT, percent_away INT,
  comparison JSONB,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ───── Media (NEW) ─────

CREATE TYPE video_category AS ENUM (
  'highlights','goals','interview','analysis',
  'preview','documentary','news','training'
);

CREATE TABLE media_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  channel_name TEXT, channel_url TEXT,
  thumbnail_url TEXT, duration INT,
  category video_category NOT NULL,
  language TEXT DEFAULT 'fr',
  competition_ids BIGINT[] DEFAULT '{}',
  team_ids BIGINT[] DEFAULT '{}',
  fixture_ids BIGINT[] DEFAULT '{}',
  player_ids BIGINT[] DEFAULT '{}',
  added_by UUID,
  published_at TIMESTAMPTZ DEFAULT now(),
  is_featured BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ON media_videos USING GIN (competition_ids);
CREATE INDEX ON media_videos USING GIN (team_ids);
CREATE INDEX ON media_videos USING GIN (fixture_ids);
CREATE INDEX ON media_videos USING GIN (player_ids);
CREATE INDEX ON media_videos (category, published_at DESC) WHERE is_archived = false;

-- ───── User layer ─────

CREATE TABLE user_favorites (
  user_id UUID NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, entity_type, entity_id)
);

-- Admin role for media editing
CREATE TABLE user_roles (
  user_id UUID PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'user'           -- 'user' | 'admin'
);
```

---

## Part I — Directory structure

```
atlaskings/
├── src/
│   ├── app/
│   │   ├── [locale]/                          # /fr, /en, /ar
│   │   │   ├── (app)/
│   │   │   │   ├── page.tsx                   # Homepage (data, dark)
│   │   │   │   ├── football/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [date]/page.tsx
│   │   │   │   ├── competition/
│   │   │   │   │   └── [slug]-[id]/
│   │   │   │   │       ├── page.tsx           # Overview
│   │   │   │   │       ├── matches/page.tsx
│   │   │   │   │       ├── standings/page.tsx
│   │   │   │   │       ├── top-scorers/page.tsx
│   │   │   │   │       ├── top-assists/page.tsx
│   │   │   │   │       ├── top-cards/page.tsx
│   │   │   │   │       ├── injuries/page.tsx
│   │   │   │   │       ├── bracket/page.tsx
│   │   │   │   │       └── media/page.tsx     # YouTube grid
│   │   │   │   ├── team/
│   │   │   │   │   └── [slug]-[id]/
│   │   │   │   │       ├── page.tsx
│   │   │   │   │       ├── matches/page.tsx
│   │   │   │   │       ├── squad/page.tsx
│   │   │   │   │       ├── stats/page.tsx
│   │   │   │   │       ├── transfers/page.tsx
│   │   │   │   │       ├── injuries/page.tsx
│   │   │   │   │       └── media/page.tsx
│   │   │   │   ├── match/
│   │   │   │   │   └── [slug]-[id]/
│   │   │   │   │       ├── page.tsx
│   │   │   │   │       ├── lineups/page.tsx
│   │   │   │   │       ├── stats/page.tsx
│   │   │   │   │       ├── h2h/page.tsx
│   │   │   │   │       ├── prediction/page.tsx
│   │   │   │   │       └── media/page.tsx
│   │   │   │   ├── player/
│   │   │   │   │   └── [slug]-[id]/
│   │   │   │   │       ├── page.tsx
│   │   │   │   │       ├── career/page.tsx
│   │   │   │   │       ├── stats/page.tsx
│   │   │   │   │       ├── transfers/page.tsx
│   │   │   │   │       └── media/page.tsx
│   │   │   │   ├── coach/[id]/page.tsx
│   │   │   │   ├── search/page.tsx
│   │   │   │   ├── favorites/page.tsx
│   │   │   │   └── trending/page.tsx
│   │   │   ├── admin/                         # Auth-gated (role=admin)
│   │   │   │   ├── page.tsx
│   │   │   │   └── media/
│   │   │   │       ├── page.tsx               # List/search/edit videos
│   │   │   │       ├── new/page.tsx           # Paste-URL form
│   │   │   │       └── [id]/page.tsx          # Edit
│   │   │   ├── about/page.tsx                 # Light mode
│   │   │   ├── layout.tsx
│   │   │   └── not-found.tsx
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── fixtures/route.ts
│   │   │   │   ├── fixtures/[id]/route.ts
│   │   │   │   ├── standings/route.ts
│   │   │   │   ├── competitions/[id]/route.ts
│   │   │   │   ├── teams/[id]/route.ts
│   │   │   │   ├── players/[id]/route.ts
│   │   │   │   ├── media/route.ts             # GET list, POST create (admin only)
│   │   │   │   ├── media/[id]/route.ts        # PATCH, DELETE
│   │   │   │   ├── media/oembed/route.ts      # Fetch YouTube oEmbed
│   │   │   │   └── search/route.ts
│   │   │   ├── webhooks/revalidate/route.ts
│   │   │   └── cron/
│   │   │       ├── reference-data/route.ts
│   │   │       ├── fixtures-schedule/route.ts
│   │   │       ├── standings/route.ts
│   │   │       ├── top-stats/route.ts
│   │   │       ├── injuries-transfers/route.ts
│   │   │       └── player-profiles/route.ts
│   │   ├── opengraph-image.tsx
│   │   ├── sitemap.ts
│   │   ├── robots.ts
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                                # shadcn
│   │   ├── chrome/
│   │   │   ├── TopNav.tsx
│   │   │   ├── SportNav.tsx                   # Football only at launch
│   │   │   ├── LangSwitcher.tsx
│   │   │   ├── DateStrip.tsx
│   │   │   ├── LeftRail.tsx
│   │   │   └── Footer.tsx
│   │   ├── match/
│   │   │   ├── MatchRow.tsx                   # Atom (18 status codes)
│   │   │   ├── MatchRowGroup.tsx
│   │   │   ├── LiveBadge.tsx
│   │   │   ├── ScoreHeader.tsx
│   │   │   ├── EventTimeline.tsx
│   │   │   ├── LineupPitch.tsx                # SVG, reads grid:'X:Y'
│   │   │   ├── StatsBars.tsx
│   │   │   ├── PlayerRatingBadge.tsx
│   │   │   └── PredictionCard.tsx
│   │   ├── competition/
│   │   │   ├── CompetitionHeader.tsx
│   │   │   ├── CompetitionTabs.tsx            # Reads coverage to gate tabs
│   │   │   ├── StandingsTable.tsx
│   │   │   ├── FormPills.tsx
│   │   │   ├── RoundSelector.tsx
│   │   │   ├── TopScorersTable.tsx
│   │   │   ├── TopAssistsTable.tsx
│   │   │   ├── TopCardsTable.tsx
│   │   │   └── BracketView.tsx
│   │   ├── team/
│   │   ├── player/
│   │   ├── media/                             # NEW
│   │   │   ├── MediaGrid.tsx                  # Grid of video cards
│   │   │   ├── VideoCard.tsx                  # Thumbnail + title + channel
│   │   │   ├── VideoPlayerModal.tsx           # Lazy iframe
│   │   │   ├── CategoryFilter.tsx             # Filter chip strip
│   │   │   └── FeaturedVideosStrip.tsx        # Homepage strip
│   │   ├── admin/
│   │   │   ├── PasteUrlForm.tsx
│   │   │   ├── VideoTagger.tsx                # Multi-select for competitions/teams/etc.
│   │   │   └── VideoTable.tsx
│   │   └── shared/
│   │       ├── TeamCrest.tsx
│   │       ├── CountryFlag.tsx
│   │       ├── PlayerPhoto.tsx
│   │       ├── EmptyState.tsx
│   │       └── CoverageGate.tsx               # <CoverageGate flag="standings">…</CoverageGate>
│   ├── lib/
│   │   ├── data/
│   │   │   ├── provider.ts
│   │   │   ├── adapters/
│   │   │   │   ├── api-football/
│   │   │   │   │   ├── client.ts              # axios + rate-limit middleware
│   │   │   │   │   ├── endpoints.ts           # ~30 endpoint wrappers
│   │   │   │   │   ├── types.ts               # raw API types
│   │   │   │   │   └── adapter.ts             # implements DataProvider
│   │   │   │   ├── sportmonks/                # future stub
│   │   │   │   └── opta/                      # future stub
│   │   │   ├── index.ts                       # factory
│   │   │   └── types.ts                       # normalized types
│   │   ├── db/
│   │   │   ├── schema.ts
│   │   │   ├── client.ts
│   │   │   └── queries/
│   │   │       ├── fixtures.ts
│   │   │       ├── standings.ts
│   │   │       ├── competitions.ts
│   │   │       ├── teams.ts
│   │   │       ├── players.ts
│   │   │       ├── coverage.ts
│   │   │       ├── media.ts                   # NEW
│   │   │       └── search.ts
│   │   ├── ingestion/
│   │   │   ├── reference-data.ts
│   │   │   ├── fixtures.ts
│   │   │   ├── standings.ts
│   │   │   ├── top-stats.ts
│   │   │   ├── injuries-transfers.ts
│   │   │   ├── player-profiles.ts
│   │   │   ├── live.ts
│   │   │   └── normalize/
│   │   │       ├── fixture.ts
│   │   │       ├── standings.ts
│   │   │       └── ...
│   │   ├── media/
│   │   │   ├── youtube-url.ts                 # Parse all YouTube URL formats
│   │   │   ├── oembed.ts                      # Fetch oEmbed metadata
│   │   │   └── thumbnail.ts                   # Resolve maxresdefault/hqdefault
│   │   ├── quota/
│   │   │   ├── tracker.ts                     # Redis-backed
│   │   │   └── middleware.ts
│   │   ├── i18n/
│   │   │   ├── config.ts                      # fr (default), en, ar
│   │   │   ├── routing.ts
│   │   │   └── messages/
│   │   │       ├── fr.json
│   │   │       ├── en.json
│   │   │       └── ar.json
│   │   ├── normalize.ts                       # Reuse trilingual engine, + EN
│   │   ├── slug.ts
│   │   ├── seo/
│   │   │   ├── jsonld.ts                      # SportsEvent, SportsTeam, Person
│   │   │   └── og-image.tsx                   # Vercel OG per entity
│   │   └── utils.ts
│   ├── styles/tokens.css                      # Atlas Royal palette CSS vars
│   ├── stores/
│   │   ├── favorites.ts
│   │   └── ui.ts
│   └── middleware.ts                          # Locale + auth + admin route guard
├── workers/
│   └── live-poller/
│       ├── src/
│       │   ├── index.ts
│       │   ├── poller.ts
│       │   ├── diff.ts
│       │   └── quota.ts
│       ├── Dockerfile
│       └── package.json
├── tests/
│   ├── e2e/                                   # Playwright
│   └── unit/                                  # Vitest
├── drizzle/                                   # Migrations
├── public/
├── scripts/
│   ├── seed-leagues.ts                        # All 60 launch competitions
│   ├── backfill-season.ts
│   └── verify-quota.ts
├── .env.example
├── drizzle.config.ts
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── CLAUDE.md
```

Note: **no `cms/` directory.** Editorial layer is replaced by the in-app `/admin` route and the Media tab on every entity.

---

## Part J — Phased build plan (13 phases, ~8–10 weeks)

Phase numbers updated. Editorial phase is gone; the Media admin slots in where it used to be.

### Phase 0 — Greenfield (1 day)

**Pre-conditions (handled by user before opening Claude Code):**
- The enforcement harness is already in the repo: `CLAUDE.md`, `CURRENT_PHASE.md`, `BACKLOG.md`, `.claude/settings.json`, `.claude/hooks/*.sh`, `docs/atlaskings-v2-rebuild-plan-final.md`, `verify-setup.sh`. `bash verify-setup.sh` returns 31/31.
- `git init` has been run and the harness is committed.

**Scaffolding into a non-empty directory.** The repo already contains `CLAUDE.md`, `.claude/`, `docs/`, etc. `pnpm create next-app .` will refuse to scaffold into a non-empty directory. Use this sequence instead:

```bash
# 1. Scaffold into a temporary subdirectory
mkdir _scaffold && cd _scaffold
pnpm create next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*" --use-pnpm

# 2. Move the scaffold contents up, NEVER overwriting harness files
cd ..
rsync -av --ignore-existing _scaffold/ ./
rm -rf _scaffold
```

`rsync --ignore-existing` is the key — it adds new files from the scaffold but never overwrites existing files. The harness (`CLAUDE.md`, `.claude/`, `docs/`, `verify-setup.sh`, `CURRENT_PHASE.md`, `BACKLOG.md`, `.gitignore`) stays untouched.

After the move, manually merge the scaffolded `.gitignore` additions into the existing `.gitignore` (preserving the `.claude/state/*` ignores from the harness).

**Tailwind v4 decision (locked):** Use **Tailwind CSS 4 with `@theme` in CSS**, not `tailwind.config.ts`. Reasons: it's the future direction, lets the palette live entirely in `src/styles/tokens.css` as one source of truth, and Next.js 15 + shadcn/ui both support it cleanly. The Atlas Royal palette tokens are declared inside an `@theme` block in `tokens.css`. There is no `tailwind.config.ts` in the final repo.

**Task list:**
1. Scaffold (per the rsync sequence above).
2. Install core dependencies: `next-intl`, Radix primitives (slot/dialog/dropdown-menu/tabs/accordion/tooltip/select/popover), `lucide-react`, `drizzle-orm`, `@neondatabase/serverless`, `zustand`, `swr`, `class-variance-authority`, `clsx`, `tailwind-merge`. Dev: `drizzle-kit`, `vitest`, `@vitejs/plugin-react`, `prettier`, `husky`, `lint-staged`.
3. Initialize shadcn/ui via `pnpm dlx shadcn@latest init` with Tailwind v4 settings.
4. Create `src/styles/tokens.css` with all Atlas Royal palette CSS variables (dark mode default, light mode override) inside an `@theme` block.
5. Import `tokens.css` from `src/app/globals.css`. Set dark mode as default on `:root`. Add `[data-theme="light"]` override.
6. Configure next-intl: `src/lib/i18n/config.ts`, `routing.ts`, `messages/{fr,en,ar}.json`, `src/middleware.ts`. FR is default, no locale prefix.
7. Move `src/app/layout.tsx` to `src/app/[locale]/layout.tsx` with `NextIntlClientProvider`. Configure `next/font/google` for Inter (Latin) and IBM Plex Sans Arabic, applied conditionally by locale. Set `font-feature-settings: 'tnum'` globally.
8. Drizzle config: `drizzle.config.ts`, `src/lib/db/client.ts`, `src/lib/db/schema.ts` (empty — populated in Phase 2).
9. `.env.example` with `DATABASE_URL`, `DIRECT_URL`, `NEON_DATABASE_URL` (deferred — Neon connection lives in `DATABASE_URL`), `API_FOOTBALL_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `MEILISEARCH_URL`, `MEILISEARCH_API_KEY`.
10. Build `/dev/style-guide` route — renders every palette token (swatch + hex + variable name), the 6-step typography scale, Radix primitives, in all three locales with switcher. Tabular numerals demo. RTL demo for AR.
11. ESLint + Prettier + Husky + lint-staged. `pnpm exec husky init`. Pre-commit runs `pnpm exec lint-staged` targeting `*.{ts,tsx}` with eslint + prettier.
12. Configure `next.config.ts` — wrap with `next-intl` plugin, add `images.remotePatterns` for API-Football media, YouTube thumbnails, Cloudinary.
13. Utility file `src/lib/utils.ts` — `cn()` helper.
14. Deploy blank shell to Vercel.

**Exit criteria:**
1. `pnpm build` succeeds with zero errors.
2. `pnpm lint` passes.
3. `/fr/dev/style-guide`, `/en/dev/style-guide`, `/ar/dev/style-guide` all render every token and primitive.
4. AR locale shows full RTL layout with IBM Plex Sans Arabic.
5. Palette tokens in `src/styles/tokens.css` match Part C exactly, declared inside an `@theme` block.
6. ESLint + Prettier + Husky pre-commit hook is functional.
7. `.env.example` documents all keys.
8. Drizzle config is present and importable (no migration run yet — that's Phase 2).
9. Vercel preview deployment succeeds for the main branch.

### Phase 1 — Data provider adapter (3–4 days)
1. `DataProvider` interface in `src/lib/data/provider.ts`.
2. `ApiFootballAdapter`:
   - `client.ts` with axios, key header, rate-limit middleware writing to Redis
   - `endpoints.ts` — typed wrappers for all ~30 endpoints
   - `adapter.ts` — translates raw → normalized types
3. Vitest with MSW-mocked responses for every endpoint.
4. `/api/health` route hitting `/status`.

**Exit:** integration test calling every endpoint against Botola returns parsed shape.

### Phase 2 — Database + ingestion (3 days)
1. Drizzle schema (Part H).
2. **Seed in tier order from Part B:** WC 2026 (league_id=1) **first** — all 12 groups, all 48 teams, all 104 fixtures populated and verified before moving to Tier 2. Then Morocco men's (Botola 1+2, Coupe du Trône, Atlas Lions). Then Tier 3 (WAFCON 2026 + Morocco women's). Then Tier 4 (top EU). Then Tier 5.
3. Ingestion functions — pure, testable.
4. Vercel cron handlers.
5. Coverage sync writes `league_coverage`.

**Exit:** `pnpm seed`, `cron:reference-data` populates `league_coverage`. **WC 2026 verification:** `SELECT COUNT(*) FROM fixtures WHERE competition_id=1 AND season_year=2026` returns 104. `SELECT COUNT(*) FROM teams WHERE id IN (SELECT DISTINCT home_team_id FROM fixtures WHERE competition_id=1) OR id IN (SELECT DISTINCT away_team_id FROM fixtures WHERE competition_id=1)` returns 48. Brazil vs Morocco (the canonical fixture) shows as kickoff_at = 2026-06-13 22:00 UTC with venue = MetLife Stadium. Botola verification: `SELECT * FROM standings WHERE competition_id=322` returns current table.

### Phase 3 — Live poller worker (2 days)
1. Railway service in `workers/live-poller`.
2. 15s loop: `/fixtures?live=all` → for each live, `/fixtures?id=X`.
3. Diff vs Neon, write deltas.
4. Idle: 60s sleep when no live matches.
5. Realtime layer TBD — Pusher/Ably or LISTEN/NOTIFY (Phase 3 decision) auto-broadcasts WAL changes.

**Exit:** subscribe from a test client → write a fake live row → push received within 2s.

### Phase 4 — Chrome + style guide hardening (3 days)
1. TopNav, SportNav (Football active; others greyed with "Coming soon").
2. LangSwitcher with `hreflang` and Arabic font swap.
3. DateStrip with keyboard nav.
4. LeftRail with Featured / Morocco / Country accordion.
5. Footer.
6. Full RTL pass.

**Exit:** style guide renders cleanly in FR, EN, AR.

### Phase 5 — Homepage + MatchRow (3 days)
1. `MatchRow` handling all 18 status codes.
2. `MatchRowGroup` collapsible by competition.
3. Homepage: today's fixtures grouped, live pinned at top.
4. Realtime subscription + SWR fallback.
5. Date navigation `/football/2026-08-15`.
6. Morocco snapshot rail (Botola top 3 + Atlas Lions M&W next match).
7. **Tournament hero banner** — implements the rotation rules from §F.1. Default state for the build is the FIFA World Cup 2026 hero: Morocco's next/last fixture, Group C standings snapshot, countdown to next Morocco match. Component must be data-driven so WAFCON variant slots in seamlessly on 20 July.

**Exit:** open homepage → see today's matches grouped. Fake live event → UI updates within 2s. **WC hero renders Brazil vs Morocco (or Morocco's next scheduled WC fixture) with correct kickoff time and Group C standings.**

### Phase 6 — Competition page (5 days)
1. `CompetitionHeader` (logo, name, season selector, follow button).
2. `CompetitionTabs` reads `league_coverage`, only renders covered tabs.
3. `StandingsTable` — All/Home/Away, form pills, qualification zone bands.
4. Round selector for Matches tab.
5. Top scorers / assists / cards.
6. Bracket view for cups.
7. Injuries tab.
8. Media tab (placeholder — implemented in Phase 9).
9. SEO: metadata, JSON-LD `SportsOrganization`, OG image per competition.

**Exit:** `/competition/botola-pro-322` renders all covered tabs with real data. Switching to a league with `injuries:false` hides that tab. Lighthouse 95+.

### Phase 7 — Team + Player pages (4 days)
1. Team header.
2. Tabs: Overview, Matches, Squad, Stats, Transfers, Injuries, Media (placeholder).
3. SquadList grouped by position.
4. Player hero + tabs: Overview, Career, Statistics, Transfers, Injuries, Media (placeholder).
5. Form sparkline (last-5 rating chart).
6. Coach pages.

**Exit:** Atlas Lions M+W team pages render. Hakimi player page renders. Coach page renders.

### Phase 8 — Match detail (5 days)
1. `ScoreHeader` pixel-perfect, all 18 statuses.
2. `EventTimeline` minute-keyed.
3. `LineupPitch` SVG from grid 'X:Y'. Handle 4-3-3, 4-4-2, 3-5-2, 5-3-2, 4-2-3-1, etc.
4. `StatsBars` divergent bars.
5. `PlayerRatingBadge` colour-coded.
6. H2H tab.
7. "Atlas Kings prediction" card.
8. Media tab placeholder.
9. Live mode: Realtime subscription, minute pulse, score-change flash.

**Exit:** **Brazil vs Morocco (13 June 2026, WC Group C) is the canonical test case.** All tabs (Summary, Lineups, Stats, Player Ratings, Events, H2H, Standings, Prediction, Media) render correctly for that fixture as a post-match page. If WC matches are still live during this phase, validate the live mode against a real live WC fixture (Realtime subscription, minute pulse, score-change flash). If no WC match is live during this phase, mock a live fixture via DB writes to verify the live mode.

### Phase 9 — Media tab + admin (5 days) ← NEW, replaces editorial phase
1. `media_videos` schema migration.
2. `/api/v1/media/oembed` — given a YouTube URL, parse the id, call YouTube oEmbed, return metadata.
3. `/admin/media/new` — paste URL → oEmbed enrichment → category dropdown → multi-select tagger for competitions/teams/fixtures/players → save.
4. `/admin/media` — list, search, edit, archive, feature.
5. Admin route protection via middleware checking `user_roles.role = 'admin'`.
6. `MediaGrid` + `VideoCard` + `VideoPlayerModal` (lazy iframe via facade pattern).
7. `CategoryFilter` chip strip.
8. Wire Media tabs on competition / team / match / player pages.
9. `FeaturedVideosStrip` on homepage.

**Exit:** paste a YouTube URL in `/admin/media/new` → save with tags → it appears on the relevant entity's Media tab within seconds. CLS = 0 on the grid (proper thumbnail dimensions).

### Phase 10 — Search + favorites + auth (3 days)
1. Meilisearch self-hosted on Railway.
2. Sync teams, players, competitions, videos via Drizzle hooks; trilingual tokenization via normalization engine.
3. `/search` page + nav autocomplete.
4. Clerk or Auth.js for user auth (Phase 10 decision) — magic link + Google.
5. Favorites schema (Part H). Star buttons everywhere.
6. Personalised homepage section: "Your fixtures."

### Phase 11 — Performance, SEO, accessibility (4 days)
1. Lighthouse 95+ on homepage, competition, match.
2. CLS = 0 (skeletons everywhere, fixed-dimension thumbnails).
3. Dynamic OG images via Vercel OG.
4. Sitemap with `hreflang` FR/EN/AR.
5. JSON-LD on all data pages.
6. Axe accessibility audit + keyboard nav.
7. CNDP cookie banner + privacy policy (adapt Zafaf template).

### Phase 12 — Launch readiness (3 days)
1. Production env vars, Vercel + Railway production deployments.
2. Sentry (frontend + worker) + BetterStack uptime.
3. Playwright smoke: homepage, competition, match, live update, all 3 locales, admin paste-URL flow.
4. k6 load test on live poller: 1,000 concurrent users on a fake live match.
5. Backfill: WC 2026 (every match played to date — almost certainly all 104 if launching 20 July), last 2 seasons of Botola + EPL + La Liga, WAFCON 2022 + 2024.
6. **WC 2026 content audit (mandatory):** every WC match played during the build renders perfectly as a finished match page. Specifically validate all three Morocco group stage matches (13 June Brazil-Morocco, 19 June Scotland-Morocco, 24 June Morocco-Haiti) plus any knockout matches Morocco played. The WC final (19 July) renders correctly. Group C standings final state correct.
7. **WAFCON 2026 readiness check:** all 16 qualified teams have team pages. WAFCON competition page renders with empty fixtures (kickoff is 25 July). Hero rotation flips from "WC final concluded" to "WAFCON in N days" countdown correctly on 20 July.
8. Soft launch on subdomain. 50 invited users. 5-day iteration window between 15–19 July.
9. **Public launch: 20 July 2026** (day after WC final).
10. **WAFCON kickoff readiness (25 July):** monitor live ingestion of the WAFCON opening match end-to-end. This is the first live tournament the site handles in production.

**Build schedule:** Phase 0 starts **11 May 2026**. 10 weeks of careful build hits the **20 July launch date** with a 5-day buffer before WAFCON. The men's WC is the content priority throughout the build (Part N). The launch window catches the post-WC traffic tail (everyone searching "WC final highlights" for a week) and feeds directly into WAFCON — the first tournament Atlas Kings handles live from kickoff.

---

## Part K — Things I'd push back on vs. Sofascore

After two full reads of Sofascore's pages and the API-Football surface, here's what we deliberately do differently:

1. **Nav restraint.** Sofascore puts 26 sports in the top nav. We start with Football only with a clean disabled state on others ("Coming 2027"). Premium products look like they know what they are.
2. **Stronger typography hierarchy.** Sofascore lives in 2 font sizes. We use a 6-step scale — display, headline, subhead, body, caption, micro.
3. **No betting UI.** Loi 09-08 + brand protection. Monetise via brand display (Royal Air Maroc, Inwi, Maroc Telecom, banks, BMCE) and sponsorship.
4. **Coverage-gated tabs.** Sofascore shows empty Stats tabs where they have no data. We read `league_coverage` and hide them.
5. **Player page narrative.** Form sparkline, recent goal streaks. Sofascore = numbers only.
6. **Search with proper FR/AR/Darija/EN tokenization.** Where your normalization engine plugs in. Sofascore's search is mid; ours can be excellent.
7. **Web personalisation.** Followed teams reorder the homepage. Sofascore does this only in the mobile app.
8. **"Atlas Kings prediction" widget.** Rebrand `/predictions` as editorial.
9. **Women's football as first-class.** Same tab structure, same depth as men's. Sofascore relegates women's leagues to deep navigation; we surface Atlas Lionesses fixtures on the Morocco snapshot rail. The homepage tournament hero rotates: men's WC 2026 through 19 July, WAFCON 2026 from 20 July through 16 August — equal-prominence treatment.
10. **Media tab on every entity.** Sofascore has video tabs but they're scattered and unreliable. Ours is curated, categorised, and one paste-URL away from publishing. Highlights reels for every Botola match by your hand, no newsroom needed.
11. **English diaspora layer.** Quality EN coverage of Botola + Atlas Lions/Lionesses is an unclaimed niche.

---

## Part L — The one piece of v1 worth keeping

Your **trilingual FR/AR/Darija text normalization engine**, extended for EN at Phase 0. Reuse it in:
- Meilisearch indexing (a user typing "wydad" / "وداد" / "WAC" finds the same team)
- Team/player/competition slug generation
- YouTube title language detection for video filtering
- URL canonical resolution for multi-language entry points

Everywhere else: clean slate.

---

## Part N — World Cup 2026 content priority during the build (mandatory)

The launch date is **20 July 2026**, the day after the FIFA World Cup 2026 final. The men's World Cup runs **11 June – 19 July 2026**, exactly during the build window. This is the single most important content event of the 10-week build and the primary content the site launches with.

This section sets non-negotiable rules for Claude Code. When any phase task has multiple competition options, the WC version comes first.

### N.1 Phase-by-phase content priority

| Phase | What "WC priority" means in practice |
|-------|--------------------------------------|
| Phase 0 | No competition data yet, no constraint. |
| Phase 1 | When testing the `ApiFootballAdapter` integration against a real league, use league_id=1 (WC 2026) as the canary, not Botola. The WC has the richest coverage flags. |
| Phase 2 | **Seed WC 2026 first.** All 12 groups, all 48 teams, all 104 fixtures populated and verified before any other Tier 2–5 league is touched. The Phase 2 exit criterion now requires `COUNT(*) FROM fixtures WHERE competition_id=1 AND season_year=2026` to return 104 before advancing. |
| Phase 3 | When testing the live poller end-to-end, the **first stress test is against a live WC match** if one is in progress. (WC group stage runs 11–24 June; knockouts 27 June – 19 July. There will be live WC matches during Phases 3–11.) |
| Phase 4 | The DateStrip and LeftRail must surface WC fixtures on the relevant dates without any special hardcoding — they should appear naturally because they're seeded. Verify this. |
| Phase 5 | The homepage tournament hero defaults to the FIFA WC 2026 module (Morocco's next/last WC fixture, Group C standings snapshot, countdown to next Morocco match). This is the launch-day hero — must be polished. |
| Phase 6 | The first competition page built end-to-end is `/competition/fifa-world-cup-2026-1`. All tabs validated against it: Overview, Matches (with group stage + knockout views), Standings (12 group tables), Top Scorers, Top Assists, Top Cards, Media. The 32-team Round of 32 bracket tests the bracket view. |
| Phase 7 | First team page built is the **Morocco national team** (`/team/morocco-...`). Squad, fixtures, stats, transfers, injuries, media — all tabs render. Brazil and Scotland team pages second (Morocco's group rivals). |
| Phase 8 | **The canonical match for UI validation is Brazil vs Morocco, 13 June 2026 at MetLife Stadium.** All match-detail tabs (Summary, Lineups, Stats, Player Ratings, Events, H2H, Standings snapshot, Prediction, Media) are validated against this fixture. If the match has already been played by the time Phase 8 begins (likely), use the real post-match data. If still upcoming, use the pre-match data and add live-mode validation against a different WC match. |
| Phase 9 | The Media admin's first test entries are WC-related YouTube videos: Morocco highlights, group-stage analysis, post-match interviews. Tag them to the WC competition and to Morocco-related fixture/team/player ids. |
| Phase 10 | Search index priority order: WC 2026 teams + Morocco squad players first, then everything else. Search for "hakimi" / "حكيمي" / "Hakimi" must return Achraf Hakimi as the top result. |
| Phase 11 | Lighthouse audits run against the WC competition page and Brazil vs Morocco match page first. SEO metadata and JSON-LD must be correct on these before any other page is audited. |
| Phase 12 | The "WC content audit" step is mandatory and gates launch — every WC match played during the build must render correctly as a finished match page. The final (19 July) renders correctly the night before launch. |

### N.2 The canonical match: Brazil vs Morocco

Throughout the build, **Brazil vs Morocco (13 June 2026, MetLife Stadium)** is the canonical fixture used to validate match-detail UI work. Reasons:

- It's the **opening match of Morocco's WC** — guaranteed maximum API-Football coverage (lineups, events, statistics, player stats all true).
- It involves the **most-tracked Moroccan player** (Hakimi) and a top-tier opposition squad — rich player-rating data.
- It's the **single most-searched Morocco fixture** of the build window and arguably the decade.
- It happens **early in the build** (13 June, week 5) — soon enough that Phase 8 (week 6–7) has post-match data to validate against.
- API-Football fixture id for this match is determinable after the WC draw was finalised (5 December 2025) and confirmed when API-Football publishes the WC schedule. **Look it up in Phase 1 and store it as a constant** in `src/lib/constants/canonical-fixtures.ts` for use in tests and seed scripts.

### N.3 What this priority does NOT mean

- It does **not** mean we skip other competitions. All 60 competitions in Part B still ship at launch. The priority is about **order of validation**, not exclusion.
- It does **not** mean WAFCON or Botola get neglected. They're Tier 3 and Tier 2 — built immediately after the WC layer is solid.
- It does **not** override the women's-football-is-first-class principle. Atlas Lions Women's national team page is built in Phase 7 alongside the men's. The hero rotation flips to WAFCON on 20 July automatically.

### N.4 Why this rule exists

A naive read of the plan would suggest building Botola first (it's the Moroccan domestic league, after all). That's wrong for two reasons:

1. **The WC is happening right now during the build.** Live data on a tournament Morocco is playing in is the most engaging possible content. Botola is on summer break — there are no Botola fixtures between 11 May and August.
2. **The WC has the richest data coverage in API-Football.** Building the UI against the league with the deepest data (events, lineups, statistics, player stats all true) means we discover the full UI scope early. Building against Botola first would mean discovering missing-data edge cases late.

Both reasons point the same way: **WC first, everything else after.**

Drop this into Claude Code the first time you open the new repo:

> Read `CLAUDE.md` and `docs/atlaskings-v2-rebuild-plan-final.md` at the repo root. Confirm you understand:
> 1. The Atlas Royal palette and that all colours come from CSS variables in `src/styles/tokens.css`.
> 2. The provider-agnostic `DataProvider` interface and the `ApiFootballAdapter` pattern.
> 3. The `coverage` flag system — UI tabs are gated on `league_coverage`, never hardcoded.
> 4. That we are NOT reusing anything from the v1 prototype except the text normalization engine, extended for EN.
> 5. The Phase 0 → Phase 12 sequence.
> 6. The directory structure in Part I — no CMS folder, editorial replaced by `/admin/media`.
> 7. Three locales: FR (default), EN, AR (RTL).
> 8. **No betting/odds UI ships, ever. Predictions surface as editorial only.**
> 9. **Every league/cup/team/match/player has a Media tab with embedded YouTube videos curated through `/admin/media`.**
> 10. **Women's football is first-class — same schema, same depth, same UI.**
> 11. **The launch date is 20 July 2026** (day after the FIFA WC 2026 final). **FIFA WC 2026 (men's, league_id=1) is the content priority throughout the build** per Part N — seeded first in Phase 2, validated against Brazil vs Morocco (13 June) as the canonical match test case in Phase 8, fully backfilled by launch day. **WAFCON 2026 (25 July, Morocco) is the second event, 5 days after launch.** The homepage tournament hero rotates between them per §F.1.
>
> Then propose Phase 0 as a step-by-step plan with file paths and commands. Do not write code yet.

---

## What's locked vs. what's open

**Locked (no more discussion):**
- Data provider, plan tier, languages, palette, tech stack, schema, directory structure, scope (60 competitions including women's), Media tab model, no editorial CMS, no betting UI, **20 July 2026 launch date with WC 2026 content priority (Part N)**.

**Still to confirm before Phase 0:**
1. **Logo + brand assets.** Do you have an SVG logo, wordmark, favicon set? If not, this is a parallel sprint with a designer — doesn't block code but is needed for Phase 4.
2. **Admin user list.** Who gets `role=admin` access to `/admin/media`? Email list — gets seeded into `user_roles` at Phase 9.
3. **Build start.** Phase 0 starts **11 May 2026** per the locked timeline. Confirm or push.
