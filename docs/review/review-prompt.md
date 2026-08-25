# DimaScore — season-rollover parity review + full-site audit

## Context
Repo: `atlaskings-v2` (DimaScore) — Morocco-focused football data site.
Stack: Next.js 16 App Router (RSC, `cacheComponents` ON), TypeScript strict, Tailwind 4,
Drizzle ORM + Neon Postgres, next-intl (fr/en/ar + RTL), Vercel. Data from API-Football.

Timing: it is end-July 2026. WC 2026 is finished, WAFCON 2026 starts 25 July, and
**domestic leagues (Botola Pro/Botola 2, EPL, LaLiga, Serie A, Bundesliga, Ligue 1) roll over to
the 2026/27 season starting ~August 2026.**

Operating rules are in `CLAUDE.md` (phase gating, propose-then-implement, pnpm only, no
betting/odds UI, coverage-gated tabs). **This is a REVIEW — do not modify code.** Findings only.

## Part 1 — PRIMARY: parity between last season and the upcoming season
Goal: when leagues roll to 2026/27 in August, every surface must work as well as it does for the
finished 2025/26 season — and last season must stay viewable. Find hardcoded info. The website should be scalable with zero or very little hardcoded.

1. **Season resolution.** How is "current season" chosen? Trace `seasons.is_current`,
   `getCurrentSeasonYear`, `season_year` filters, and edition constants in
   `src/lib/constants/tournament-metadata.ts` (`editionYear`, `METADATA_BY_SEASON`,
   `METADATA_REGISTRY`). Find anything hardcoded to a year that won't roll over.
2. **Pre-season (zero-data) states.** A season that exists in the schedule but has 0 played
   matches: standings, top scorers/assists, form pills, team stats, mini-standings, homepage
   rail widgets, "no matches" states. Do they render sensibly, or blank/break?
3. **Known symptom — chase this.** The EPL 2026/27 page currently shows **"6 Teams"** (should be
   20) and fixtures with missing opponents ("Arsenal vs —", "— vs Manchester United").
   Diagnose the root cause: incomplete fixtures/teams ingest for the new season, or a
   standings-derived team list, or a query bug. Check whether other leagues have the same.
4. **Historical access.** Can users still view the *previous* season via the edition/season
   selector? Do standings, fixtures, scorers, and squads resolve correctly for a past season?
5. **Ingest readiness.** Fixtures/standings/squads sync, `league_coverage` flags, and the
   top-scorers cron are gated on `is_current` seasons. What goes stale or breaks during the
   rollover, and in the gap between seasons?
6. **Team/player surfaces.** `getTeamTournamentScorers` resolves competition+season from
   `tournament_squads` (most recent season) — confirm it picks the right season at rollover.
   Check team page tabs (matches / standings / statistics / squad) for old vs new season.
7. **Explicit parity matrix.** For one Moroccan league (Botola Pro) and one foreign league (EPL),
   enumerate every surface — competition overview/fixtures/standings/stats/teams, team page,
   match page, homepage widgets — and state whether 2025/26 (finished) and 2026/27 (upcoming)
   render at parity. Flag every asymmetry.

## Part 2 — Whole-site audit
Sweep: homepage, competition pages (league / cup / generic-cup renderers), team, player, coach,
match, WC26 / AFCON / WAFCON, search, and global chrome (topbar, drawer, ticker, bottom bar).

Report issues across:
- **Correctness/data** — wrong or missing values, duplicate rows (there's history of duplicate
  standings), stale data, timezone/date bugs, status edge cases (HT / AET / PEN / postponed).
- **Empty & error states** — anything that blanks, crashes, or shows a broken skeleton.
- **i18n** — missing/untranslated strings in fr/en/ar; RTL layout breakage in Arabic.
- **Responsive** — mobile (<768), tablet (768–1279), desktop (≥1280). A tablet 2-column tier was
  added recently; verify no regressions.
- **Build/prerender health** — `cacheComponents` is ON, so dynamic access outside `<Suspense>`
  fails `next build` (this already broke one deploy). Flag risky patterns; run `next build`.
- **Performance** — N+1 / slow queries, missing caching, oversized images, client bundle weight.
- **Accessibility** — alt text, contrast, keyboard nav, aria on interactive widgets.
- **SEO/metadata** — titles, descriptions, canonicals, OG images per route and locale.
- **Consistency/dead code** — leftover duplication (`TeamLogo`/`CompetitionLogo`), and the two
  remaining emoji-flag holdouts (`TeamPageHeader`, `TournamentPageHeader` host flags) after the
  site-wide `<Flag>` refactor.
- Read `BACKLOG.md` and confirm which entries are still real.

## Output
One prioritized report:
- Severity: **P0 blocker / P1 major / P2 minor / P3 polish**
- Per finding: what's wrong, where (`file:line` and/or route/URL), how to reproduce, why it
  matters, and a suggested fix in 1–3 lines.
- **Season-rollover parity findings first**, then the general audit.
- Finish with a **"Top 5 to fix before the August season start"** list.

Do not change code — review only.
