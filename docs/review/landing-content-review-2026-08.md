# DimaScore — landing-page CONTENT review

**Donor benchmark:** sofascore.com · **Repo:** `atlaskings-v2` @ Phase 14 (Live data v2 + dedup)
**Date:** 16 August 2026 · **Scope:** content of `src/app/[locale]/(app)/page.tsx` and how it changes over time/match state
**Constraint compliance:** no layout/visual recommendations, no odds/betting of any kind, football-only. Review only — no code modified.

---

## 0. Grounding — confirmed against the tree

Everything in the brief's "homepage today" section checks out, with three corrections worth carrying into the findings:

| Brief said | Reality |
|---|---|
| Day picker + "today" use UTC in `HomeMatchTabs` | Confirmed — `HomeMatchTabs.tsx:179-185` (`isSameDay` via `getUTC*`) and `:259-260` (`setUTCDate`). Also `getLiveGroupStandings` (`right-rail.ts:412-414`) and `getTopMatchesThisWeek` (`right-rail.ts:631-633`). |
| No personalization anywhere | Confirmed in the UI — **but** a `user_favorites` table already exists (`schema.ts:532-541`), and the i18n bundle already ships `followYourTeams` / `followDescription` / `browseTeams` (`en.json`, unused). The intent is half-built at both ends. |
| `EditorialHero` is dead code | Confirmed (`EditorialHero.tsx` + `editorial-hero.ts` imported by nothing). BACKLOG:220 already leans toward *deleting* it. See A5 — I agree with deleting the component, not the idea. |
| — | The homepage renders **no `<h1>`** at all. Every other page type has one (`TeamPageHeader:71`, `LeaguePageHeader:158`, `TournamentPageHeader:159`, `PlayerPageHeader:140`, `edition/maroc:203`). |

Also confirmed: `getHomeMatchesByCategory` (`homepage.ts:152-197`) has **no competition filter** — it returns every fixture across every seeded competition in a −7d/+30d window, and the whole set is serialised into the client bundle for `HomeMatchTabs`. That single fact drives both the biggest content opportunity (A2) and the biggest correctness risk (B5).

---

# Part 1 — Content parity & gaps vs the donor

Findings are ranked by *content value for a Moroccan audience*, not by implementation cost.

---

### A1 — Personalization / follow · **P2**

**DimaScore:** nothing. No favourite, no follow, no pinned competition. Grep-confirmed: the only `localStorage` use in the app is the theme toggle (`ThemeToggle.tsx:14`).

**Donor:** favourites are the *second* of three primary tabs, every competition group has a pin, every match row has a star, and the list re-orders itself around what you pin.

**Gap.** DimaScore's left rail is a curated editorial opinion of what matters (`page.tsx:87-104` → Morocco / Tournaments / Top Leagues / Cups). It is a good opinion, but it is the *same* opinion for a Raja ultra, a Hakimi-follower in Amsterdam, and a Premier League casual. Returning visitors get zero accumulated value.

**Why it matters here specifically.** The Moroccan football audience is unusually bimodal: domestic Botola loyalty (club-level: Raja, Wydad, FAR, RSB) and diaspora attachment to individual Lions abroad. Neither is served by a fixed rail. A Wydad fan currently has to scan a competition-grouped global list to find one match.

**Content recommendation.** A `localStorage`-only follow (no auth — the `user_favorites` table can stay dormant until accounts exist), scoped to **teams and competitions only**, changing exactly three pieces of content:

1. A **"Your matches"** group pinned to the top of the All tab, above the competition groups, listing today's fixtures for followed teams/competitions. Empty → the group doesn't render (never an empty shell).
2. Followed competitions **sort to the top** of `groupByCompetition` (`HomeMatchTabs.tsx:219-249`) by overriding `displayPriority`, rather than adding any new UI region.
3. The hero carousel's ordering gets a followed-team boost (see A6).

Note the pre-existing strings (`followYourTeams`, `followDescription`, `browseTeams`) — the copy was written and then the feature was dropped. If follow isn't going to ship, delete those keys; a dead promise in the message bundle is how "Get the app" (`getTheApp`, `appDescription`, also unused, and there is no app) ends up shipped by accident.

---

### A2 — Competition breadth & discovery · **P1**

**DimaScore:** ~46 competitions exist in the mega-menu catalogue (`competitions-mega-menu.ts`), and `LeagueLeftRail` can expand to browse all of them by country (`LeagueLeftRail.tsx:64-77`). Every one of those links navigates **away** to a competition page.

**Donor:** the landing page *is* the competition list. Groups collapse, groups pin, and you never leave home to see a league's day.

**Gap — and this is the important one.** DimaScore already fetches **every competition's fixtures for the selected day** and ships them to the client (`homepage.ts:160-197`, no competition predicate). The data is sitting in the browser. But the list is then truncated to **8 rows** (`HomeMatchTabs.tsx:307`), collapsed behind a single "View full schedule" toggle that expands to *everything at once*, and there is no way to filter to one competition, collapse one, or jump to one.

So on a Saturday in the Botola/Premier-League season, the homepage's 8 visible rows are whatever the two or three highest-`displayPriority` competitions happen to fill, and a user wanting "just La Liga today" must either expand the entire global list and scroll, or leave the page.

**Content recommendation.**
- Make the competition separator row (`HomeMatchTabs.tsx:413-434`) a **collapse/expand toggle** for its group, with the collapsed state remembered per session. Content-only change: same rows, user-controlled density.
- Change the 8-row cap from a global truncation to **per-competition** (show ~5 per competition, "+N more in Botola Pro"). Today a busy Premier League matchday can push Botola entirely below the fold *within the truncated 8* — the exact inversion of the product's premise.
- Add a **competition filter chip row** driven by the competitions actually present in the selected day's fixture set. This is derivable client-side from data already loaded; nothing new is fetched.
- The left rail's competition links should be able to *filter the homepage list* (`#matches` anchor + filter state) as an alternative to navigating away — keeps the day's context.

---

### A3 — Date navigation & "today" correctness · **P1**

**DimaScore:** three-state relative picker — ‹ prev / **Today** / next › (`HomeMatchTabs.tsx:355-389`), re-slicing an already-loaded window.

**Donor:** ‹ Today › with a real calendar, backed by a genuine per-day fetch, unbounded in both directions.

**Gap 1 — the window is a cliff, silently.** The arrows are unbounded (`:356-364`, `:379-388` — no clamp, no `disabled`), but the data behind them is not: results reach back 7 days and NS fixtures forward 30 (`homepage.ts:156-158`). Day −8 renders "No matches" (`:445-449`) — indistinguishable from a genuinely empty day. Worse, the SQL bounds are *timestamps, not day boundaries*, so day −7 and day +30 are half-populated: on day −7 you see only matches that kicked off after the current wall-clock time.

**Gap 2 — no month/date jump.** For an August 2026 audience the natural queries are "when does Morocco play in the WC group stage", "what's the Botola fixture list this month". The homepage can only answer them one arrow-click at a time.

**Content recommendation.**
- Add a horizontal **7-day date strip** (a `dateStrip` i18n namespace already exists and is fully used elsewhere) with a per-day match count, so the user can see where the content is before clicking.
- Beyond the loaded window, either fetch the day properly — `getFixturesByDay` **already exists and is unused** (`fixtures-by-day.ts:44-128`; only `getFixturesMultiDay` is referenced, by the also-unmounted `FixtureList.tsx`) — or clamp the arrows and label the boundary ("Schedule available to 15 Sep"). Silent emptiness is the one option that misinforms.
- Widen the results window from 7 days to at least 14 so "last matchday" is always reachable.

**Gap 3 — the "today" bug.** See **B1** — it's a correctness defect, not a parity gap.

---

### A4 — Filters & live counts · **P2**

**DimaScore:** four tabs — All / Live / Upcoming / Results — with per-tab counts for the **selected day** (`HomeMatchTabs.tsx:291-296`), rendered only after mount (`:336`).

**Donor:** Live / Finished / Upcoming filters *plus* a persistent global live-match total, visible regardless of which day you're on.

**Gap.** There is no site-wide "N matches live now" anywhere on the homepage. The Live tab's count is day-scoped and disappears when you page to another date, and the top ticker (`AdaptiveTopStrip` → `TickerStrip`) shows live matches but not a count. The single most re-visit-worthy number on a livescore site — "is anything on right now" — is never stated as a number.

Also note: `fixtureList.filterAll` / `filterLive` / `filterFinished` / `filterUpcoming` exist in the message bundle and are unused — a donor-shaped filter row was translated and then not built.

**Content recommendation.**
- Put a **global live count** in the Live tab label (not day-scoped), sourced from the `['live-fixtures']` poll that is already running on the page — zero new requests. When it's zero, the tab reads "Live" with no badge, exactly as now.
- Make the Live tab **day-independent**: "Live" should always mean "live now", not "live among the fixtures of the day I happened to select". Selecting Live currently resets `dateOffset` to 0 (`:326`), which half-acknowledges this.
- Status coverage is incomplete — see **B2** (postponed/abandoned).

---

### A5 — Content types present vs absent · **P1**

This is where DimaScore has the most *already-built* value going unsurfaced.

| Content type | Exists? | On the homepage? |
|---|---|---|
| Video / media | Yes — full model, admin at `/admin/media`, `MediaGrid` shipped | **No.** Rendered only on team / competition / player pages. `homepage.featuredVideos` string exists, unused. |
| Editorial hero (Morocco live → Lions ≤7d → Botola → milestone → fallback) | Yes — `editorial-hero.ts:43-…`, modes A–E | **No.** Imported by nothing. |
| Lions abroad | Yes — `getMoroccanPlayerPerformances` | Yes, but **last** in both rail sequences (`HomeRailWidgets.tsx:24-27`). |
| Trending players | Yes | Yes — and broken (**B3**). |
| Player of the day | No | No |
| Editorial prediction / fan poll | No | No |
| Standings, scorers, group tables | Yes | Yes |

**Gap 1 — media is invisible on the front door.** A Morocco-first football site with a curated video library that doesn't show a single video on its homepage is under-using its one genuinely differentiated asset (the donor has no editorial video at all — this is white space, not parity). `getMediaVideos` already supports `isFeatured` (`media.ts`).

**Gap 2 — Lions Abroad is buried.** For the diaspora audience this is arguably the highest-affinity content on the site, and it renders below Botola standings, top scorers, and group tables on both desktop and mobile.

**Gap 3 — no Morocco-first editorial voice.** `EditorialHero`'s mode ladder is exactly the right *logic* — Morocco live beats Lions-within-7-days beats Botola beats tournament milestone. That logic is currently dead while the live hero uses none of it (A6).

**Content recommendation, Morocco-first, in priority order.**
1. **Port the mode ladder, delete the component.** Fold the A→E priority from `editorial-hero.ts` into `getFeaturedMatches`' ordering (see A6). The component itself has known debt (BACKLOG:127, :220) and should go; the ranking logic should not.
2. **Promote Lions Abroad** to position 2 in the desktop rail and position 1 on mobile (`HomeRailWidgets.tsx:24-27`) whenever it has entries from the last 48h. It is time-sensitive content sitting below evergreen tables.
3. **Add a featured-video strip** below the match tabs, filtered `isFeatured` + last 7 days, Morocco-tagged first. Renders nothing when empty. The string already exists.
4. **Fan poll — yes, with care.** An editorial "Who will win?" vote on the hero match is the donor's engagement mechanic minus the odds, and Rule 11 permits it. Ship it only with a no-odds, no-stake framing and no percentage-to-implied-probability conversion anywhere in the copy. It is genuinely the highest-engagement content item on the donor's landing page.
5. **"Player of the day"** — defer. The trending-players data is already unreliable (B3, and BACKLOG:18/:34 on `player_season_stats`); building a second surface on the same source multiplies a known data problem.

---

### A6 — Match prioritization / featuring · **P1**

**DimaScore hero:** `getFeaturedMatches` (`homepage.ts:225-288`) selects `statusCode = 'NS' AND kickoff ∈ [now, now+30d]`, ordered by `competitions.displayPriority ASC, kickoffAt ASC`, limit 8.

**What that means in content terms:**
- **`isFeatured` is ignored.** Every other featuring surface honours it — `FEATURED_ORDER` in `right-rail.ts:260-274` and `getTopMatchesThisWeek`'s ordering (`:659`) both lead with `is_featured DESC`. The hero, the single most prominent content slot on the site, is the *only* place an editor's explicit feature flag does nothing.
- **No knockout boost.** The same two surfaces add +30 for a Final, +20 semi, +10 quarter (`right-rail.ts:262-272`). The hero doesn't, so a Botola regular-season fixture outranks a CAF Champions League final if Botola's `displayPriority` is lower.
- **No Morocco-first rule.** `getTopMatchesThisWeek` explicitly includes `MOROCCO_TEAM_IDS` (`right-rail.ts:653-662`); the hero has no Morocco condition at all. Morocco surfaces in the hero only as a side-effect of WC/AFCON `displayPriority`.
- **The hero can never show a live match.** Verified: an already-live fixture fails both `statusCode = 'NS'` and `kickoff >= now`, and the carousel only patches fixtures already in its prop array (`HomeFeaturedCarousel.tsx:85-97`) — it never adds one. So the only path to a live hero slide is an NS match in the fetched 8 kicking off while you watch. **During a live Atlas Lions match, a visitor arriving at that moment sees a countdown to some other fixture.** That is the single worst content moment on the site.

**Content recommendation.** One ranking function, shared by hero / next-match / top-matches:

```
live now  >  Morocco (national or Botola club)  >  isFeatured  >  knockout boost  >  displayPriority  >  soonest kickoff
```

Concretely: extend `getFeaturedMatches` to union in currently-live fixtures, add `is_featured DESC` and the `FEATURED_ORDER` round-boost CASE, and add a Morocco tier above `displayPriority`. `HomeNextMatch` already demonstrates the correct client pattern for this — a ranked *candidate list* that advances when the leader finishes (`HomeNextMatch.tsx:44-46`). The hero should use the same technique instead of a fixed slide array.

---

### A7 — Localization of dynamic content · **P2**

**Confirmed English-only regardless of locale:**

| Surface | Cause |
|---|---|
| Right-rail top scorers — player *and* team names | `right-rail.ts:880,883,905,908` — `p.name->>'en'`, `t.name->>'en'` |
| Lions Abroad — player + both team names | `right-rail.ts:783, 806-807` |
| Live-match goal scorers | `homepage.ts:296` — `COALESCE(p.name->>'en', p.name->>'fr', 'Unknown')` |
| Hero countdown units — `DAYS` / `HOURS` / `MINS` | `HomeFeaturedCarousel.tsx:302-306`, hardcoded literals |
| Knockout context codes — `R32` / `QF` / `SF` / `F` / `MD 12` | `right-rail.ts:139-168`, documented as intentional |

For an Arabic reader, a rail that says «هدافو البطولة» over a list of Latin-script names is a jarring half-translation; for a French reader the countdown reading "DAYS / HOURS / MINS" under French copy is simply wrong. Team names have a working locale resolver (`getTeamDisplayName`, fallback chain `name[locale] → name.en → shortName…`) — these queries bypass it by flattening JSONB in SQL.

**Content recommendation.** Select the full `name` JSONB in these five queries (as `getTrendingPlayers` *attempts* to — see B3) and resolve locale at render, matching every other surface. Translate the three countdown units. Leave the knockout codes as-is — they're conventional in all three locales — but add an `aria-label` with the expanded round name for screen readers. **RTL note:** no RTL-specific content defect found; the dynamic surfaces use logical properties (`start-`/`end-`) consistently.

---

# Part 2 — "How things change": dynamic-behaviour bugs

Separate from the parity gaps above. These are defects in what DimaScore does today.

---

### B1 — "Today" is wrong for the first hour of every Moroccan day · **P1**

`HomeMatchTabs` buckets by **UTC** day (`:179-185`, `:259-260`) while the site's editorial timezone is `Africa/Casablanca` = UTC+1 (`date.ts:14`).

**Two distinct failures:**

1. **Kickoffs at 23:00–23:59 UTC** (= 00:00–00:59 Moroccan) are filed under the *previous* Moroccan day. In August 2026 this band is not hypothetical: it is where US-hosted World Cup evening kickoffs land (19:00 ET = 23:00 UTC = 00:00 Casablanca).
2. **Between 00:00 and 00:59 local, the "Today" pill shows yesterday.** `today = new Date()` is the viewer's real clock but the bucket is its UTC date, still on the previous day. For that hour every Moroccan visitor sees a completed day labelled "Today", and that day's actual fixtures are hidden one click to the right.

It also self-contradicts *within one row*: the bucket is UTC, but the competition separator's date string (`:404-408`), the group key (`:409`), and the kickoff time (`LocalTime`, `:109`) are all viewer-local. A 23:30 UTC match therefore sits in the "Today" group under a separator printing tomorrow's date.

Third-order: for a diaspora viewer at UTC−5, the UTC date rolls at 19:00 local, so "Today" shows *tomorrow's* card for five hours every evening — right through European prime time.

Same UTC-midnight assumption in `getLiveGroupStandings` (`right-rail.ts:412-414`) and `getTopMatchesThisWeek` (`:631-633`), so "matches today" and the week window inherit it. BACKLOG:218 already tracks the server-side half; the client-side half in `HomeMatchTabs` is not tracked.

**Recommendation.** Bucket on `toSiteDateKey()` (`date.ts:79-87`) everywhere — it exists and is already the standard on the tournament/league fixture surfaces. Decide once whether "today" means Casablanca or viewer-local (Casablanca is the right editorial answer for a Morocco-first product) and apply it to the bucket, the label, and the separator identically.

---

### B2 — Postponed and abandoned matches: invisible, then mislabelled · **P2**

`getHomeMatchesByCategory` selects only live codes, `NS`, and `SCORED_STATUSES` (`homepage.ts:57-60`, `:182-196`). `PST`, `SUSP`, `CANC`, `ABD` match none of them.

- **A postponed match simply vanishes** from the homepage. A user who saw Raja–Wydad on the schedule yesterday finds no row and no explanation today. The donor shows "Postponed" inline. `getMatchStatusLabelKey` (`match-status.ts:22-35`) and the `matchDetail.postponed/suspended/cancelled/abandoned` strings already exist — the labels are built, nothing on the homepage can reach a fixture that needs one.
- **Worse when it happens mid-session.** `/api/v1/live` *does* return `CANC` and `ABD` (`route.ts:31-37`, using the wider `FINISHED_CODES_ARRAY`), and `applyLivePatches` overwrites `statusCode` unconditionally (`HomeMatchTabs.tsx:202`). So a match abandoned while you watch becomes state `'interrupted'` (`match-status.ts:44-49`) and then:
  - it appears in **All** but in **none** of Live / Upcoming / Results — the All count stops equalling the sum of the other three;
  - `MatchRow` computes `isLive = false, isFinished = false` and falls through to the *else* branch (`:107-111`), **rendering the original kickoff time as if the match were still to come** — while still printing whatever partial score it had (`:132`, `:153`).

An abandoned 1–1 that displays "1 1 · 20:00" is worse than not showing it.

**Recommendation.** Include `INTERRUPTED_CODES` in the homepage query; render the existing status label in the status slot; count interrupted fixtures under Results (they belong to a concluded day). Pin the All-count invariant with a test.

---

### B3 — Trending players renders a JSONB object as a name · **P1 (verify, then fix or delete)**

`getTrendingPlayers` selects `p.name AS player_name` (`homepage.ts:316`) — `players.name` is **jsonb** (`schema.ts:153`) — and types the result `player_name: string` (`:333`), passing it straight through (`:341`). Every sibling query in the file and its neighbours uses `p.name->>'en'`; this one doesn't.

`HomeTrendingPlayers.tsx` then does `alt={p.playerName}` (`:41`), `p.playerName[0]` (`:47`), and `{p.playerName}` (`:51`). With neon-http parsing jsonb into an object, that last one is "Objects are not valid as a React child" — thrown inside a `<Suspense>` with **no fallback** (`page.tsx:221-223`), so it escalates to the route error boundary. The same pattern is duplicated at `edition/maroc/page.tsx:146,225`.

It is presumably latent today because the strip returns nothing when `player_season_stats` has no rows with goals — which BACKLOG:18 confirms is the state of Botola Pro 2025. **That means this is armed to break the homepage the moment the top-scorers ingestion is fixed.** Verify with one query before acting; it is not safe to leave either way.

Two smaller defects on the same strip: the "View all" link points at `/${locale}/players`, which **does not exist** (no `players` segment under `src/app`, no redirect in `next.config.ts`; every other player link in the codebase uses `/joueur/…`) — a 404 from the homepage. And individual player cards aren't links at all (no `slug` is selected), so the strip is a dead end.

---

### B4 — What stays stale in a long-open tab · **P2**

The live poll (`useLiveFixtures`, 15s active / 60s idle, paused when hidden, one shared `['live-fixtures']` key) is well-built, and the minute extrapolation with half-caps (`useLiveFixtures.ts:17-20, 76-81`) is careful work. But it only patches **scores, minute, and status of fixtures already on the page**. Everything else is a frozen SSR snapshot for the life of the tab:

| Content | Behaviour in an open tab |
|---|---|
| The fixture set itself | Never refetched. A fixture added, rescheduled, or postponed after load never appears/updates. |
| Standings, top scorers, group tables | Frozen — except `HomeLiveGroupStandings`, which correctly overlays live results (`computeProvisional`). Mini-standings and scorers do **not** move when a match finishes. |
| Lions Abroad | Frozen. A Hakimi goal 10 minutes ago is absent until reload. |
| Trending players | Frozen. |
| Hero carousel | Rotates every 10s (`HomeFeaturedCarousel.tsx:65-71`) through a **fixed** array; a finished slide keeps showing "FT" in the featured slot indefinitely — unlike `HomeNextMatch`, which advances past finished candidates (`HomeNextMatch.tsx:44-46`). |

Compounding it, production has been observed serving the homepage `x-vercel-cache: STALE` with age up to ~22 minutes despite `cacheLife('minutes')` (BACKLOG:206) — so even a fresh load can be 20 minutes behind.

**Recommendation.** Two content changes, no architecture change: (a) let the hero skip candidates whose patched status is finished, reusing `HomeNextMatch`'s pattern; (b) when the shared poll reports a fixture transitioning to a finished state, invalidate the rail data (a single `router.refresh()` debounced to once per minute) so standings, scorers and Lions Abroad follow the match that just ended — that's the moment a user actually looks at them.

---

### B5 — Payload: every competition, every day, shipped to the browser · **P2**

`getHomeMatchesByCategory` has no competition filter, no limit, and a 37-day window; all three arrays are passed as props into the client component `HomeMatchTabs` (`page.tsx:207-213`), which then displays **8 rows**. On a full weekend across ~46 seeded competitions this is a large serialised payload for a page that shows a fraction of it — and it lands in the RSC flight data on mobile, where most of the Moroccan audience is.

Not a visual issue, a content-delivery one: it caps how much *more* content the homepage can carry.

**Recommendation.** Fetch the selected day (±1 for the picker) rather than 37 days, using the already-written `getFixturesByDay` (`fixtures-by-day.ts:44-128`), and fetch on date change. This is also the unlock for A3's unbounded date navigation — same change, two payoffs.

---

### B6 — Empty states and rollovers · **P3**

- **No matches today:** renders `noMatches` = "No matches" (`en.json:177`) — bare, and identical whether the day is genuinely empty, off-season, or past the data window. `homepage.emptyState` ("Matches coming soon") and `homepage.noMatchesToday` ("No matches today") both exist unused. Recommend one honest sentence that points somewhere: nearest day with fixtures, or the next Morocco match.
- **Off-season / no-live:** the rail degrades gracefully — every widget returns `null` when empty (`HomeRailWidgets.tsx:51-130`). Good. But if enough return null the right rail can collapse to almost nothing with no fallback content; that's the case for a featured-video strip (A5) as the evergreen filler.
- **Season rollover:** `getHomeRailData` keys standings on `is_current` seasons (`home-rail.ts:90-113`) and drops leagues with zero rows (`:121`), so a fresh 2026/27 Botola shows a 0-played table rather than nothing — correct, but a 0-0-0 standings table as the rail's top content in August is low value. Consider suppressing mini-standings until matchday 3 and promoting Lions Abroad / top scorers in that window.
- **Only the first league's standings ever render** (`HomeRailWidgets.tsx:111-120` uses `standingsLeagues[0]`) — the other five in `HOMEPAGE_LEAGUES` (`home-rail.ts:19-62`) are fetched on every request and thrown away. Either surface them (a league switcher on the widget) or stop querying them.
- Mini-standings omits the draws column (BACKLOG:208, still open) — "15 3" hides D=11.

---

### B7 — No `<h1>`, no SEO context line · **P2**

The homepage has excellent per-locale `<title>`/description metadata (`page.tsx:32-83`) and both `WebSiteJsonLd` and `OrganizationJsonLd` — and **not one `<h1>`** in the page or any component it renders, chrome and layouts included. The donor closes its landing page with a plain context line ("Football today — livescore and schedule for …") that doubles as its H1.

For a site whose entire acquisition thesis is Moroccan football search intent in three languages, the front door has no heading. One localised H1 — «Football aujourd'hui : scores en direct et calendrier» / "Moroccan football today — live scores and fixtures" / «كرة القدم اليوم: نتائج مباشرة ومباريات» — is the cheapest content change on this list.

---

# Shortlist — the 8 highest-leverage content changes

Ordered by value ÷ effort. Every item is content-only: no card layout changes, no odds, football-only.

| # | Change | Type | P |
|---|---|---|---|
| 1 | **Fix the hero's featuring rule.** Live-first, then Morocco, then `isFeatured`, then knockout boost, then priority. Today the hero cannot show a live match at all and ignores the editorial feature flag that every other surface honours. | Gap A6 | P1 |
| 2 | **Bucket days on `Africa/Casablanca`, not UTC**, in `HomeMatchTabs`, `getLiveGroupStandings`, `getTopMatchesThisWeek`. "Today" currently shows yesterday for the first hour of every Moroccan day, and WC-2026 US evening kickoffs land on the wrong date. | Bug B1 | P1 |
| 3 | **Verify and fix `getTrendingPlayers`' JSONB→string bug** (and the `/players` 404 beside it). Armed to crash the homepage as soon as the scorers ingestion is repaired. | Bug B3 | P1 |
| 4 | **Add one localised `<h1>` / SEO context line.** The homepage has no heading element at all. | Gap B7 | P1 |
| 5 | **Make competition groups collapsible and cap per-competition, not globally.** The day's full fixture set is already in the browser; today 8 global rows can bury Botola under a busy Premier League slate. | Gap A2 | P1 |
| 6 | **Surface a global live count** in the Live tab, day-independent, from the poll already running. The defining number on a livescore site is currently never shown. | Gap A4 | P2 |
| 7 | **Promote Lions Abroad up the rail and add a featured-video strip.** The diaspora-affinity content is last in both sequences, and the curated media library — real differentiation the donor has no answer to — never appears on the front door. | Gap A5 | P2 |
| 8 | **Show postponed/abandoned matches with their existing status labels.** They currently vanish outright, or — if they change mid-session — render as upcoming with a stale kickoff time and a partial score. | Bug B2 | P2 |

**Deliberately not recommended:** odds or any bet-adjacent surface (Rule 11 / Loi 09-08); multi-sport; any change to card layout, spacing, or visual structure; a "player of the day" widget built on `player_season_stats` while that source is known-unreliable (BACKLOG:18, :34).

**Two decisions worth taking before the above:** (1) does follow/favourites ship, and if not, do the `followYourTeams` / `getTheApp` strings get deleted? (2) does "today" mean Casablanca or the viewer's timezone — the answer must then be applied to the bucket, the label, and the group separator identically, because they currently disagree with each other.
