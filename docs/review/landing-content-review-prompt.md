# DimaScore — landing-page CONTENT review (donor: sofascore.com)

## Context
Repo: `atlaskings-v2` (DimaScore) — Morocco-focused football data site.
Stack: Next.js 16 App Router (RSC, `cacheComponents` ON), TypeScript strict, Tailwind 4,
Drizzle ORM + Neon Postgres, next-intl (fr default / en / ar + RTL), Vercel. Data from API-Football.
Timing: August 2026 — WC/AFCON/WAFCON context; domestic leagues on the 2026/27 season.
Operating rules live in `CLAUDE.md` (phase gating, propose-then-implement, no betting/odds UI,
coverage-gated tabs). **This is a REVIEW — findings only, do not modify code.**

## Scope — what this review IS
The **content** of the homepage (`src/app/[locale]/(app)/page.tsx`) and **how it changes** over
time and match state: which content is shown, when, why, how it updates, what's missing, and what
exists in the codebase/data but isn't surfaced. Benchmark against the donor, sofascore.com.

## Non-goals — what this review is NOT (do not raise these)
- **No card layout / visual / styling changes.** The homepage cards were just redesigned; treat
  their look, spacing, and structure as fixed. Comment only on *what content* they carry, never how
  they look.
- **No odds / betting / gambling content of any kind.** SofaScore shows bookmaker odds and an
  odds-flavoured layout — DimaScore must not (Loi 09-08 + `CLAUDE.md` Rule 11). Do not recommend
  odds, an odds toggle, or bet-adjacent features. (An editorial, no-odds "Atlas Kings prediction"
  or fan poll is acceptable to *discuss* as an engagement idea, but never with odds.)
- **No multi-sport.** SofaScore spans many sports; DimaScore is football-only by design. Ignore.

## Donor benchmark — sofascore.com landing model (for comparison only)
Observed content model (not to be copied visually):
1. **Trending strip** of curated big matches with live countdowns, pinned at the top.
2. Primary organiser = three tabs: **All / Favourites / Competitions**.
3. Filters: **Live (count) / Finished / Upcoming**, plus a live-match total.
4. **Full-day date navigation** (‹ Today › with a calendar), not just a small window.
5. An **exhaustive, competition-grouped match list** (every league globally), each group collapsible
   with a per-competition **pin/star** and each match a **follow/star** — the list personalises to
   what the user pins/follows.
6. Inline live states everywhere (minute, HT score, FT, Postponed).
7. A featured-match panel with a **"Who will win?" fan vote** (engagement) [odds omitted per our rules].
8. An SEO context line ("Football today — livescore and schedule for …").

## DimaScore homepage today (grounding — confirm while reviewing)
- Sections: left comp-nav rail (curated, static — `LeagueLeftRail.tsx`), center **hero carousel**
  (`HomeFeaturedCarousel`, upcoming-only, `displayPriority`-ordered — `getFeaturedMatches`),
  **match tabs** All/Live/Upcoming/Results with a prev/today/next **day picker** (`HomeMatchTabs`),
  a **trending players** strip, and a right rail (next match, top matches this week, live group
  standings, mini-standings, top scorers, "Lions abroad").
- Live: single shared `['live-fixtures']` poll → `/api/v1/live`, 15s active / 60s idle
  (`useLiveFixtures`).
- "Today"/dates: labels use `Africa/Casablanca` (`toSiteDateKey`), but several selectors compute
  "today" with **UTC** midnight (`HomeMatchTabs`, `getLiveGroupStandings`, `getTopMatchesThisWeek`)
  — verify this doesn't misbucket around midnight Casablanca.
- **No personalization anywhere** (no favourites / follow / pinned competitions — grep-confirmed).
- **Dead/unsurfaced content**: `EditorialHero.tsx` + `getEditorialHero` (rich modes A–E) are
  imported by nothing; media/news exist in the data model + admin but aren't on the homepage.
- Some rail content renders **English-only** names regardless of locale (`getRightRailTopScorers`,
  `getMoroccanPlayerPerformances`, live-goal scorers).

## Part 1 — content parity & gaps vs the donor
For each axis: state what DimaScore does, what the donor does, the gap, and a concrete *content*
recommendation that fits a Morocco-first, no-odds product. Rank P1/P2/P3.
1. **Personalization / follow.** Favourites, followed teams/competitions, pinned leagues. Is a
   lightweight `localStorage`-based "follow" worth it (no auth)? What content would it change?
2. **Competition breadth & discovery.** Static curated nav vs a browsable/pinnable competition list.
   Can users reach any competition's day's matches from the homepage? What's missing?
3. **Date navigation & "today" correctness.** Depth of the day picker (window re-slice vs true
   per-day fetch) and the UTC-vs-Casablanca "today" question above.
4. **Filters & live counts.** Do we show a live count? Are Live/Finished/Upcoming states clear and
   correct across match transitions (NS→live→HT→FT→AET→PEN→postponed)?
5. **Content types present vs absent.** The dead `EditorialHero` (should it be wired up?), media/news
   surfacing, a "player of the day", Atlas-Lions-abroad prominence, editorial (no-odds) prediction
   or fan-poll engagement. Recommend what to surface, Morocco-first.
6. **Match prioritization / featuring.** Hero is pure `displayPriority`+soonest with no Morocco-first
   and ignores `isFeatured`; other widgets use `isFeatured` + knockout boost + Morocco filters. Is
   the hero featuring the *right* matches for a Moroccan audience?
7. **Localization of dynamic content.** English-only player/team names in rails; knockout context
   codes; anything untranslated for fr/ar. RTL correctness of dynamic content.

## Part 2 — "how things change" (dynamic-behavior audit)
Trace content changes over time/state and flag anything stale, wrong, or jarring:
- Live polling and local minute extrapolation; what updates vs what stays a stale SSR snapshot.
- Day rollover (crossing midnight Casablanca), matchday rollover, off-season / no-matches-today,
  no-live, empty scorers/standings — what does the homepage show in each? (There's an unused
  `emptyState` string; `noMatches` is what actually renders.)
- Kickoff/finish transitions: does a match move cleanly NS→live→result across hero, tabs, rails?
- Season rollover interactions with homepage widgets (mini-standings/scorers on a fresh season).

## Deliverable
Prioritized findings (P1/P2/P3). For each: **what**, **where** (file:line), **why it matters for a
Morocco-first audience**, and a **content recommendation** (never a layout or odds change). Keep
"content gaps vs donor" separate from "bugs in current behavior." End with a short shortlist of the
3–5 highest-leverage content changes.
