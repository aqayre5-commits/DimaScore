# DimaScore — Season-Rollover Parity Review + Full-Site Audit

**Date:** 2026-07-24 · **Branch:** `main` @ `f08dae7` · **Phase:** 14 (Live data v2 + dedup)
**Mode:** Read-only review. No code was modified. Findings only.

**Method:** Static analysis of the full `src` tree (328 TS/TSX files) plus ingestion,
cron, schema, i18n catalogs, and `BACKLOG.md`. `next build` could not be executed in the
review sandbox (no DB/env), so build-health findings are from static inspection of
`cacheComponents` dynamic-access patterns — noted where relevant. Every finding cites
`file:line` relative to the repo root.

---

## TL;DR

The **data pipeline is genuinely rollover-safe in its design** — every cron and page keys off
`seasons.is_current`, written verbatim from API-Football's `current` flag, and there are **no
hardcoded domestic-league season numbers**. Historical access works: past seasons stay viewable
via the selector, and team-page resolvers correctly anchor to "most recent season with rows."

The rollover risk is concentrated in **three defects that all fire the moment 2026/27 becomes
current**, and they explain the EPL "6 Teams / missing opponents" symptom exactly:

1. **Team identity is derived from `standings`** — empty pre-season → "6 Teams" (P0).
2. **`syncTeams` is never called** and `syncFixtures` never upserts teams → promoted clubs have
   no `teams` row → "Arsenal vs —" (and possibly an aborted fixtures cron via FK violation) (P0).
3. **No fallback when upstream flags _no_ current season** — in the inter-season gap a fully
   data-rich league vanishes from its default page and drops out of all crons (P1).

Everything else is quality/polish. Season-rollover findings are listed first, then the general
audit. A **Top 5 before August** list closes the report.

---

# Part 1 — Season-Rollover Parity Findings

## P0-1 — "N Teams" count and the Teams tab are derived from `standings` (the "6 Teams" symptom)

**What's wrong.** The teams count is computed as the number of distinct team IDs in the
**standings** result, not from fixture participants or a teams-in-competition table:

- `src/app/[locale]/(app)/competition/[country]/[tournament]/render-league-page.tsx:275`
  `teamsCount={new Set(standings.map((s) => s.teamId).filter(Boolean)).size}`
- Same pattern in the generic-cup renderer: `render-generic-cup-page.tsx:223`.
- The Teams tab itself renders one card per standings row: `render-league-page.tsx:256`
  (`<LeagueTeamsTab standings={standings} .../>`) → `src/components/league/LeagueTeamsTab.tsx:22-32`
  maps over `dedupeStandingsByTeam(standings)`.
- `standings` comes from `getStandings(db, competitionId, seasonYear)` (`render-league-page.tsx:57`).

**Why 6, not 20.** In late July / early August, API-Football's `/standings` for 2026/27 is empty
or a partial snapshot (a handful of rows once pre-season data trickles in). `getStandings` returns
~6 rows → the header pill (`LeaguePageHeader.tsx:91-93`, shown only when `teamsCount > 0`) and the
Teams tab both show 6.

**Reproduce.** Point any league at a season whose `standings` has < 20 rows → header shows
"6 Teams", Teams tab shows 6 crests.

**Why it matters.** Hits **every** rolling league (EPL, Botola Pro/2, LaLiga, Serie A, Bundesliga,
Ligue 1) the instant 2026/27 is current. Worse for leagues where `league_coverage.standings=false`
(the standings cron skips them — `api/cron/standings/route.ts:16`) → `teamsCount=0` → the Teams pill
disappears and the Teams tab is blank all season.

**Fix.** Derive the team set from the season's fixtures (distinct `homeTeamId ∪ awayTeamId` for the
competition+season), or from a dedicated teams-in-competition table populated by `syncTeams`. Never
source team identity from `standings`.

## P0-2 — Teams are never ingested before their fixtures (the "Arsenal vs —" symptom)

**What's wrong.**
- `syncFixtures` upserts fixtures (+ venues) but **never upserts teams** — it only writes the team
  foreign keys: `src/lib/ingestion/fixtures.ts` (venue upsert present; team IDs via
  `mapFixtureToInsert`; no `schema.teams` insert anywhere).
- `syncTeams()` — the only code that populates `teams` from `/teams?league&season` — is at
  `src/lib/ingestion/teams.ts:45` and **has zero callers** in `src/` (verified: only its own
  definition; the sole non-test caller anywhere is `scripts/backfill-friendly-countries.ts`).
  There is **no `/api/cron/teams` route** (`ls src/app/api/cron/` → finalize-stale, fixture-details,
  fixtures-schedule, reference-data, squads-refresh, squads-targeted, standings, top-scorers).
- The fixtures cron just loops `getCurrentSeasons` → `syncFixtures`, with no team prerequisite:
  `src/app/api/cron/fixtures-schedule/route.ts:19-29`.

**Consequence at rollover.** When `reference-data` marks 2026/27 current, `fixtures-schedule`
ingests the full 2026/27 schedule including newly-promoted clubs whose team IDs are absent from
`teams`. Fixture hydration resolves a missing team to `null`
(`src/lib/db/queries-hydrate.ts:66-67`) and the UI renders `null` as "—"
(`LeagueTeamsTab.tsx:14 resolveTeamName → '—'`; fixture cards likewise; global ticker
`queries.ts:377-378`).

**FK nuance.** There is an enforced FK on `fixtures.(home|away)_team_id → teams.id`
(`drizzle/0000_init.sql:301-302`, never dropped). So depending on DB state you get **either**:
(a) the fixture insert throws an FK violation, and since `runWrites` isn't transactional
(`src/lib/db/client.ts:14`) and the cron has no per-row/per-competition try/catch, the whole run
aborts (500) leaving 2026/27 fixtures partially ingested; **or** (b) where dangling rows exist,
hydration renders "—" exactly as observed. Either way the root cause is identical: teams are never
ingested before their fixtures. (The validator guarantees fixture team IDs are non-null numbers —
`validators.ts:33-34` — so "—" is always a missing `teams` row, never a null feed value.)

**Reproduce.** Ingest fixtures for a season containing a team ID not in `teams` (any promoted club
never previously ingested).

**Fix.** Add a teams sync that runs **before** fixtures for every current season (a `/api/cron/teams`
calling `syncTeams` over `getCurrentSeasons`, scheduled ahead of `fixtures-schedule`), and/or have
`syncFixtures` upsert stub team rows (id, name, logo are on the fixture payload) before inserting the
fixture, mirroring the existing venue upsert.

## P1-3 — No fallback when upstream flags no current season → a data-rich league disappears

**What's wrong.** `getCurrentSeasonYear` (`src/lib/db/queries/league.ts:89-100`) and
`getCurrentSeasons` (`src/lib/db/queries.ts:390-414`) both simply `WHERE is_current = true` and
return `null` / `[]` otherwise — **no fallback.** API-Football routinely leaves a domestic league
with **no** `current:true` season during the changeover (old ended, new not yet flagged).

When that state syncs in:
- `getCurrentSeasonYear(200)` → `null` → `render-league-page.tsx:140` renders the **"coming soon"
  shell** for Botola even though 2025/26 has a full season of data in the DB.
- `getCurrentSeasons()` returns nothing → `fixtures-schedule`, `standings`, and `top-scorers` crons
  **all skip that league** (they iterate `getCurrentSeasons` — `fixtures-schedule/route.ts:15`,
  `standings/route.ts:15`, `top-scorers/route.ts:31`), and the homepage `RightRail.tsx:59` +
  `edition/maroc/page.tsx:133` drop its standings.

**Reproduce.** `UPDATE seasons SET is_current=false WHERE competition_id=200;` → load
`/en/competition/morocco/botola-pro` → "coming soon" despite populated data; crons stop touching
comp 200.

**Fix.** In `getCurrentSeasonYear`, fall back to the most-recent season that has fixtures when no
row is current; apply the analogous fallback in `getCurrentSeasons` (or have crons union in
"most-recent-with-fixtures" per competition).

## P1-4 — League "Teams" tab renders a completely blank panel pre-season

**What's wrong.** `LeagueTeamsTab` derives its list only from `standings` and has **no empty-state
guard** — with 0 rows it renders an empty grid (blank white panel, no message).
`src/components/league/LeagueTeamsTab.tsx:22-78` (no `length === 0` branch). Fed empty standings
from `render-league-page.tsx:256`.

**Why it matters.** The teams demonstrably exist for 2026/27 (fixtures reference them) but the
default-reachable tab is empty _and_ silent — every other league tab shows fixtures or a
"coming soon". **Same root cause as P0-1** (standings-as-team-source); fixing P0-1 by sourcing teams
from fixtures resolves both. Interim: guard with a "coming soon" empty state.

## P1-5 — `getTeamTournamentScorers` flips to the empty new edition at rollover, hiding real data

**What's wrong.** The competition/season for a team's scorer widget is resolved as the single
most-recent `tournament_squads` row (`ORDER BY season_year DESC LIMIT 1`):
`src/lib/db/queries/team.ts:444-448`. When a pre-season 2026/27 squad row appears, `compId/season`
flip to the new edition whose `fixture_events` count is 0, so `scorers`/`assisters` return `[]` —
even though the prior edition (e.g. World Cup 2026, or last league season) has full data. Consumed
at `src/app/[locale]/(app)/equipe/[...slug]/page.tsx:94,348,357` via `TournamentScorersCard`.

**Why it matters.** Silent data regression: a populated, high-value widget becomes an empty
"pending" card the moment a future squad is ingested, while the correct data still exists one season
back. This is the one team resolver that _fails_ the "anchor to a season that actually has rows"
pattern used correctly by `getTeamStandings` / `getTeamsInSameCompetition` / `getTeamSeasonStats`.
It degrades to `TournamentScorersCard`'s `statsPending` state (no crash), so P1 for correctness.

**Fix.** Resolve to the most-recent squad season that actually has `fixture_events` (or fall back to
the previous edition when the newest has 0 events).

## P2-6 — `getCurrentSeasonYear` is nondeterministic if two seasons are ever current

`src/lib/db/queries/league.ts:93-97` uses `.limit(1)` with **no `ORDER BY`**, and the `seasons`
table (`schema.ts:74-86`) has **no partial unique index on `is_current`**. If the API (or a partial
sync) briefly marks both old and new season `current`, `limit(1)` can return the **older** year,
pinning the whole site to last season. **Fix.** Add `.orderBy(desc(schema.seasons.year))` before
`.limit(1)`, and add a partial unique index `... ON seasons(competition_id) WHERE is_current`.

## P2-7 — League "Overview" tab collapses to an empty shell if fixtures lack round numbers

`src/components/league/LeagueOverviewTab.tsx:47-59` gates its only pre-season-visible block (the
fixtures card) on `rounds.length > 0`, and `getLeagueRounds` returns only rounds where
`roundNumber IS NOT NULL` (`league.ts:137-163`). A season whose fixtures are ingested without round
numbers → `rounds=[]` → the **default** tab renders an empty `<div>`. Standard leagues carry round
numbers so this is conditional, but oddly-ingested comps are exposed. **Fix.** Render the fixtures
card whenever `fixtures.length > 0` (fall back to date grouping), or add a "season hasn't started"
empty state.

## P2-8 — Homepage standings + top-scorers rails can vanish entirely at coordinated rollover

`getHomeRailData` filters standings leagues to `rows.length > 0`
(`src/lib/db/queries/home-rail.ts:121`) and `getRightRailTopScorers` skips comps with 0 goals
(`right-rail.ts:976`). When all six homepage leagues flip to 2026/27 before results exist, every
league drops out and both rails render nothing (`HomeStandingsMini.tsx:30`,
`HomeTopScorers.tsx:17` both `return null`). Survivable (clean hide), and a live summer tournament
usually keeps the scorers rail populated — but the homepage can look sparse during the exact
rollover window. **Fix.** Fall back to the most recent season with data (labelled "final table")
rather than hiding.

## P2/P3 — Cup-edition metadata is manual (by design, but needs a hand-edit per new edition)

`METADATA_REGISTRY` "latest edition" (`tournament-metadata.ts:295-299`) and per-edition `editionYear`
constants are hardcoded (`tournament-metadata.ts:64,112,140,…`); cup default season comes from them
(`render-cup-page.tsx:250`), and editorial copy is edition-keyed (`cup-content.ts:442-446`). This is
fine for fixed cups (WC/AFCON/WAFCON) but **does not auto-roll** — the next AFCON/WC/WAFCON edition
needs a manual entry. **No domestic-league year is hardcoded anywhere.** Track as a release checklist
item, not a bug.

## P3 — Minor season-resolution polish

- `joueur/[...slug]/page.tsx:114` — `maxSeasonYear = month >= 7 ? year : year-1` self-rolls but
  applies a single Europe-centric "season starts in August" rule to all competitions (magic `>= 7`).
- A requested season **not** in `availableSeasons` silently falls back to the current season instead
  of 404-ing (`render-league-page.tsx:134-138`) — mildly confusing, not data loss.

## Confirmed robust (no action needed)

`getAvailableSeasons` correctly shows both 2025/26 and 2026/27 at rollover (`league.ts:102-135`);
historical access is sound (all data queries are season-parameterized); `getLeagueFeaturedMatches`
correctly falls through live→upcoming→recent so pre-season it surfaces future fixtures
(`league.ts:240-311`); `FormPills` and the standings-anchored team resolvers all degrade cleanly to
last season's data; `league_coverage` rows _are_ written for the new season by `reference-data`
(`reference-data.ts:147-183`), so tabs don't blank purely for a missing coverage row.

---

## Parity matrix — Botola Pro (id 200) vs EPL (id 39)

Legend: ✅ parity · ⚠️ degraded/asymmetric · ❌ broken. "Upcoming" = 2026/27 pre-season (fixtures
scheduled, 0 played). "Finished" = 2025/26 full data.

| Surface | 2025/26 (finished) | 2026/27 (upcoming) | Notes / finding |
|---|---|---|---|
| Competition → Overview (default tab) | ✅ | ⚠️ | Empty if fixtures lack round numbers (P2-7); featured-match block works. |
| Competition → "N Teams" header pill | ✅ 20/16 | ❌ "6 Teams" / hidden | **P0-1** standings-derived count. |
| Competition → Teams tab | ✅ | ❌ blank panel | **P0-1 / P1-4**. |
| Competition → Fixtures | ✅ | ⚠️/❌ "Team vs —" | **P0-2** missing team rows for promoted clubs; possible aborted fixtures cron. |
| Competition → Standings tab | ✅ | ✅ "coming soon" | Guarded on `standings.length>0` — correct. |
| Competition → Stats / scorers / assists / cards | ✅ | ✅ "coming soon" | Coverage-gated + `length>0` guards hold. |
| Team page → Matches / Standings / Squad | ✅ | ✅ | Standings/stats anchor to last season with rows. |
| Team page → Statistics tab | ✅ | ✅ omitted | Tab hidden when empty (`equipe/page.tsx:275-284`). |
| Team page → Tournament scorers card | ✅ | ⚠️ hides real data | **P1-5** flips to empty new edition. |
| Match page | ✅ | ✅ | Scheduled-state rendering is fine. |
| Homepage → standings rail | ✅ | ⚠️ may vanish | **P2-8** coordinated-rollover hide. |
| Homepage → top-scorers rail | ✅ | ⚠️ may vanish | **P2-8**; also reads sparse `player_season_stats` (BACKLOG L34, still open). |
| Homepage → featured / today's matches | ✅ | ✅ | Upcoming fixtures surface correctly. |
| Season selector (historical access) | ✅ | ✅ | Both seasons listed; past seasons resolve fully. |
| Ingest (fixtures/standings/squads/scorers) | ✅ | ⚠️ | Gated on `is_current`; **P1-3** gap risk + **P0-2** no teams step. |

**Asymmetry summary:** Botola and EPL behave identically — nothing is EPL-specific. Botola Pro/2 is
likely **worse** at rollover: promoted lower-league clubs are less likely to pre-exist in `teams`
(amplifies P0-2), and if a Botola tier has `standings` coverage off, its Teams tab is blank all
season (amplifies P0-1). WAFCON 2026 is a separate manual-seed case (BACKLOG L44/L46).

---

# Part 2 — Whole-Site Audit

## Correctness / data

- **P1 — Postponed/cancelled/suspended/abandoned render as "Full Time" on list surfaces.**
  `src/lib/match-status.ts:11-30` `getMatchState` only returns `live|finished|upcoming`; `PST`/`SUSP`
  are in neither set so they fall through to `kickoffAt<=now → 'finished'` (`:28`), and list
  renderers show `t('fullTime')` with a blank score (`FixtureRow.tsx:58,82-88`; `MatchRow.tsx:36-38`).
  The match **detail** page handles these correctly (`LiveScoreDisplay.tsx:10,20-28`), so list and
  detail disagree. **Fix.** Add an `interrupted` state for `PST/SUSP/INT/CANC/ABD` and render it in
  `FixtureRow`/`MatchRow`, mirroring `LiveScoreDisplay`.
- **P1/P2 — Cross-timezone day mislabeling on homepage top-matches.**
  `src/lib/db/queries/right-rail.ts:757` sets `dateKey = kickoffAt.toISOString().slice(0,10)` (UTC
  day) while `formatDateLabel` computes "today" in Africa/Casablanca (`src/lib/utils/date.ts:78-86`).
  Any kickoff 23:00–23:59 UTC (00:00–00:59 local) is bucketed/labelled on the wrong day for the whole
  audience. Same class in `getLiveGroupStandings` (`right-rail.ts:411-413`) and `fixtures-by-day.ts`.
  **Fix.** Derive `dateKey` in `SITE_TZ` so grouping and the "today" test share one calendar.
- **P2 — Two-leg tie declares a winner after only leg 1.**
  `src/lib/constants/dynamic-bracket-builder.ts:88-112` assigns `winnerId` whenever `agg` is non-null
  without requiring leg 2 to exist/finish → a 2–0 first leg advances that team mid-tie. Affects AFCON
  (6) and WAFCON (922), which still use the dynamic builder (WC uses its own). **Fix.** Only compute
  `winnerId` when the tie is complete (both legs finished).
- **P2 — `INT` classified inconsistently** — live on lists (`match-status.ts:11`) vs interrupted on
  the match page (`LiveScoreDisplay.tsx:10`, which redefines its own status sets). Matches BACKLOG L35
  (still open: also missing from the `schema.ts:268` partial index). **Fix.** Single source of truth
  in `match-status.ts`; delete `LiveScoreDisplay`'s local sets.
- **Standings duplication — DEFENDED (no action).** Three layers present and wired: DB unique
  constraint `standings_unique` (`schema.ts:374`), in-query normalize+dedupe in `getStandings`
  (`queries.ts:107-121`), and `dedupeStandingsByTeam` on every flat render path. Group surfaces
  correctly partition by group rather than flat-dedupe. Gap: `HomeStandingsMini.tsx:27` slices without
  the helper (safe today only due to row ordering — P3, apply for defense in depth). BACKLOG L15's
  ingest-level root fix (`trim`/canonicalize `group_label` in `syncStandings`) is **still open**.

## Empty & error states

No shared `EmptyState`/`ComingSoon` component exists — each surface rolls its own. Coverage is good
(standings/stats/squad/matches all show localized "coming soon"/"no data") **except** the gaps called
out above: `LeagueTeamsTab` (P1-4), `MiniStandingsPreview` (latent — currently masked by an Overview
guard, `MiniStandingsPreview.tsx:47-69`), and the cup `StandingsTab` which builds empty group tables
from `metadata.groups` regardless of data (`StandingsTab.tsx:36,44`). **Fix.** Introduce one shared
`EmptyState` and apply it to these three.

## i18n (fr/en/ar)

- **Catalogs are complete** — all three locales have identical key sets (668 keys each, verified by
  flattened-JSON diff). AR is fully translated bar legitimate Latin brand tokens (VAR, xG, league
  proper nouns).
- **P2 — Hardcoded English in `TournamentPageHeader`.** `HOST_NAMES` is an English country-name map
  rendered directly (`src/components/tournament/TournamentPageHeader.tsx:19-35,163`) and the stat
  label `'Host Nations'` is hardcoded (`:109`). On the Arabic/French WC/AFCON page this shows
  "🇺🇸 USA 🇨🇦 Canada …" and an English label. A `country-names-i18n` lookup already exists. **Fix.**
  Map `hostCountryCodes` through it and move the label into the catalogs.
- **P3 — Hardcoded strings:** skip-link `Skip to content` (`(app)/layout.tsx:27`); OG-image subtitle
  `Match Details` (`match/[id]/opengraph-image.tsx:207`). Localize both.

## RTL (Arabic)

Chrome is **clean** — topbar/drawer/ticker/bottom bar use logical props; `dir` is set correctly on
`<html>` (`[locale]/layout.tsx:140`). Breakage is in **content widgets** using physical utilities
that don't mirror:

- **P2 — `src/components/team/TeamStatistics.tsx:100,106`** home/away comparison bars pinned
  `left-0/right-1/2` don't swap sides in Arabic → bar belongs to the wrong team. Use `start-`/`end-`.
- **P2 — `src/components/league/LeagueFixturesCard.tsx:117,129,137,150`** absolutely-positioned
  filter icons/chevrons overlap mirrored text. Use logical insets.
- **P2/P3 — `LeagueStandingsTab.tsx:94`** promotion/relegation zone bar `left-0` sits on the wrong
  side; table headers using `text-left` don't flip (`CoachCareerTable.tsx:39-41`,
  `CupOverviewTab.tsx:54-55`, `HomeLiveGroupStandings.tsx:171`). Use `text-start`.
- **P3** — `PlayerPageHeader.tsx:115` scroll-fade, `LeagueTeamsTab.tsx:43` badge `right-2`, shadcn
  defaults.

## Responsive

No regressions found from the recent tablet 2-column tier in static inspection. The RTL physical-util
issues above also manifest as layout drift on narrow Arabic viewports. (A live device pass at <768 /
768–1279 / ≥1280 is worth doing but couldn't run in this sandbox.)

## Build / prerender health (`cacheComponents` ON)

**No build-breakers found in static inspection.** All dynamic-access sites are inside a Suspense
boundary: `admin/media/layout.tsx:7` (`await cookies()` inside `<Suspense><AuthGate>`); bracket
`searchParams` and `[season]` params covered by segment `loading.tsx`; every chrome element and
`MetaPixel` wrapped in `<Suspense>` (the referenced commit). No `headers()`/`draftMode()` misuse.
`competition-content.tsx:60` documents that it reads no `searchParams` so the default page stays
static. **Caveat:** `next build` was not executed here — run it in CI before deploy to confirm.

## Performance

- **P3 — N+1 in `getNextFeaturedMatches`** (`right-rail.ts:372-400`): per-row `await` of
  `resolveGroupLabel` and a per-fixture goals query (up to ~10 sequential round-trips). Batch with
  `inArray` / `Promise.all`. Bounded and on a cached path, so low impact.
- **P3 — `getStandings` scans all season fixtures on every call** (`queries.ts:147-165`) even when
  the API table is complete — 6 full-season scans per homepage cache refresh. Gate the fixtures fetch
  on the same "feed looks stale" heuristic `applyComputedStandings` already uses.
- **Images/bundle — clean.** `next/image` with explicit dimensions everywhere; `remotePatterns`
  cover all logo/photo hosts; hot pages use `'use cache'` + `cacheLife`. No raw `<img>` on data paths
  (one admin-only exception, BACKLOG L130).

## Stale data / live

- **P3 — `finalize-stale` can't rescue a genuinely stuck-live match.**
  `src/lib/ingestion/finalize-stale.ts` keys on `updated_at < now-5min`, but its no-op branch
  (`:86-99`) doesn't touch `updated_at`, so a fixture the API keeps reporting as `2H` is re-fetched
  every run forever and stays "live" to users. Add a hard-finalize: if a live row is older than N
  hours past kickoff and the snapshot is unchanged, force `FT` with the last score. Cadence
  (every 2 min, `staleAfterMinutes:5`) is fine.

## Accessibility

Strong overall. `CenterTabs` (`:96-132`) is a reference-quality tablist (roles, `aria-selected`,
`aria-controls`, roving `tabIndex`, arrow-key handling). Only one clickable non-button (a modal
backdrop, correctly `aria-hidden`). **P3** — verify standalone logos aren't left with default
`alt=""` (`shared/Logo.tsx:10` + ~45 sites) where no adjacent text label exists. Ticker still needs a
pause control for WCAG 2.2.2 (BACKLOG L120, open).

## SEO / metadata

- **P2 — `[season]/page.tsx` has no `generateMetadata`.** The per-season competition page
  (`/en/competition/morocco/botola-pro/2024`) inherits the generic root layout metadata: title
  becomes plain "DimaScore" and `alternates.languages` points every hreflang at the **homepage**, not
  the season page — for every indexable historical season. **Fix.** Add `generateMetadata` mirroring
  the sibling `[tournament]/page.tsx` with season-scoped title/canonical/languages.
- **P3 — robots `/dev/` disallow is ineffective** (`src/app/robots.ts:11`) — the route is
  `/{locale}/dev/style-guide`, which `/dev/` doesn't match, and the dev page has no `NODE_ENV`
  guard (`dev/style-guide/page.tsx`). Guard the route or fix the pattern to `/*/dev/`.

## Consistency / dead code

- **Both logo components are live** — `TeamLogo` and `CompetitionLogo` (`shared/Logo.tsx`) each have
  multiple importers; neither is dead. `<Flag>` is used in 32 files.
- **P3 — emoji-flag holdouts CONFIRMED** still using `codeToFlag()` regional-indicator emoji instead
  of `<Flag>`: `TeamPageHeader.tsx:49,66` (fallback path) and `TournamentPageHeader.tsx:162` (host
  flags). Emoji flags render inconsistently on Windows/some Androids. Migrate to `<Flag>`.
- **P3 — 18 team-logo `<Image>` sites bypass `getTeamFlagUrl()`** (BACKLOG L32, still open) → gray
  boxes for null-logo placeholder teams.
- **Stack note (not a bug):** `CLAUDE.md` locks the font stack to Inter + IBM Plex Sans Arabic, but
  `[locale]/layout.tsx:10` loads IBM Plex Sans + Fraunces (no Inter). This is an intentional, logged
  deviation (BACKLOG L90/L92) — flagging only for the record.

## BACKLOG.md — which entries are still real

Confirmed **still live** against current code: L15 (duplicate-standings ingest root fix — read-layer
defense is in place, ingest-level `group_label` canonicalization is not), L16/L18/L20 (top-scorers
cron unreliable for Botola / cup comps; events-fallback covers pages but not the homepage rail),
L34 (`getRightRailTopScorers` bypasses the events-fallback — Phase 14, still open), L35 (`INT`
missing from `LiveScoreDisplay` + `schema.ts:268` partial index — matches the P2 status finding),
L36 (SCORED_STATUSES drift), L61 (Algeria L1 / Tunisia L1 `statistics_fixtures=false` — coverage
guards needed), L44/L46 (WAFCON 2026 manual seed — swap to API-Football when published), L120
(ticker pause for a11y). Confirmed **closed/superseded**: L112 (timezone — but see the _new_
homepage-grouping bug above, which is a distinct code path), L42 (cacheComponents migration complete,
matches the build-health finding), the WC-hosts/Group-C factual fixes (L104/L105).

---

# Top 5 to fix before the August season start

1. **Stop deriving team identity from `standings`** — source the team count and Teams tab from the
   season's fixtures (or a teams-in-competition table). Fixes the "6 Teams" symptom and the blank
   Teams tab for every rolling league. *(P0-1 / P1-4 — `render-league-page.tsx:275`,
   `render-generic-cup-page.tsx:223`, `LeagueTeamsTab.tsx`.)*
2. **Ingest teams before fixtures** — wire `syncTeams` into a `/api/cron/teams` that runs ahead of
   `fixtures-schedule` for every current season, and/or upsert stub team rows inside `syncFixtures`.
   Fixes "Arsenal vs —" and the latent FK-abort of the fixtures cron. *(P0-2 — `ingestion/teams.ts:45`
   orphaned, `ingestion/fixtures.ts`, `cron/fixtures-schedule/route.ts`.)*
3. **Add a "most-recent-season-with-fixtures" fallback** to `getCurrentSeasonYear` /
   `getCurrentSeasons` so the inter-season gap (no `current` flag upstream) doesn't blank a
   data-rich league and freeze its crons. *(P1-3 — `queries/league.ts:99`, `queries.ts:414`.)*
4. **Add per-competition error isolation to `fixtures-schedule`** (try/catch per season, matching the
   standings cron) so one league's FK/provider failure can't abort ingestion for all leagues at the
   exact moment six leagues roll over. *(P1 — `cron/fixtures-schedule/route.ts:19-29`.)*
5. **Anchor `getTeamTournamentScorers` to a season that has events** so a freshly-ingested 2026/27
   squad row doesn't replace a populated scorer card with an empty one. *(P1-5 — `queries/team.ts:444-448`.)*

*Runner-up (cheap, high-visibility): give `getMatchState` an `interrupted` state so postponed/
cancelled matches stop showing "Full Time" on lists — P1, `match-status.ts:11-30`.*
