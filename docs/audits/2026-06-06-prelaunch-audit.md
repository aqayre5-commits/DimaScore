# DimaScore — Pre-launch behavioural audit

**Date:** 2026-06-06 · **Phase context:** 13 (Live data and coverage fixes) · **Scope:** dimascore.com live site + repo (atlaskings-v2) · **Format:** observation-only — no code changes.

The audit walks the homepage, WC 2026 competition page, a match page (Mexico vs South Africa) and the Morocco team page on desktop (1440×900) and mobile (390×844), then cross-references findings against the current repo to identify root causes. No HTTP errors, no console errors, no failed network requests were observed — the bugs below are all behavioural / content / rendering issues.

Issues are ranked P0 (broken before launch), P1 (visible defect users will notice on day 1), P2 (polish), P3 (latent / known).

---

## P0 — Blockers for launch

### P0-1. Footer "Resources" and "About" columns are not clickable
**Where:** Every page (`src/components/chrome/Footer.tsx` lines 207–227).
**Behaviour:** "Legal notice", "Privacy policy", "Contact", "About us", "FAQ" render as `<span>` elements with no `href`. The DOM accessibility tree confirms they're plain `generic` nodes, not links. Clicking does nothing.
**Root cause:** `Footer.tsx` uses `<span className="text-base text-text-tertiary">{t(link.key)}</span>` for the legal/about column instead of `<Link>`. The Competitions column right next to it uses `<Link>` correctly — the asymmetry is intentional in the code (no target pages exist) but ships visible non-functional UI.
**Fix:** Either (a) build the underlying pages (`/[locale]/legal`, `/[locale]/privacy`, `/[locale]/about`, `/[locale]/faq`, `/[locale]/contact`) and replace `<span>` with `<Link>`, or (b) remove the columns entirely until those pages exist. **Loi 09-08 line in the sub-footer references "personal data protection" — shipping with a non-clickable Privacy policy is a compliance smell** even if not strictly illegal.
**Effort:** 1 day for stub markdown pages (recommended), 15 min to remove columns.

### P0-2. Homepage links to `/[locale]/matches` and `/[locale]/competitions` — both 404
**Where:**
- `src/components/homepage/HomeTodaysMatches.tsx:35` → "See all" link.
- `src/components/homepage/HomeLeftRail.tsx:80` → "View all competitions" link.

**Behaviour:** Both routes return Next.js 404 pages. No route files exist under `src/app/[locale]/(app)/matches/` or `.../competitions/`.
**Root cause:** Routes were never built. The "See all" affordance pre-dates the matches index page being descoped.
**Fix:**
- For `/matches`: either build a dated-matches index page (probably highest user value), or remove the "See all" link until built.
- For `/competitions`: build a competitions hub page (uses `MEGA_MENU_SECTIONS` data), or remove the link.

The visible CTAs invite traffic into 404s — both must resolve before launch.
**Effort:** "See all" / "View all" removed = 5 min × 2; basic listing pages = ~1 day each.

### P0-3. Mobile bottom nav has dead actions (Search / Favorites / Settings)
**Where:** Mobile navigation (Mobile viewport, every page).
**Behaviour:**
- "Search" links to `href="#"` — clicking jumps to top of page, no overlay opens.
- "Favorites" and "Settings" render as `<generic>` elements with no link/button — non-interactive.

The mobile bottom-nav is the only navigation surface mobile users see after scrolling; three of four items are non-functional.
**Root cause:** Search modal/overlay component wired to desktop header but not mobile; Favorites and Settings are placeholder UI from an earlier phase.
**Fix:** Either (a) make Search open the same dialog as the desktop header search button (preferred — search exists on desktop), (b) hide the non-functional items behind a feature flag until ready, or (c) remove from the mobile nav entirely. Settings/Favorites should be cut for v1.
**Effort:** Hide non-functional items: 30 min. Wire mobile search to existing modal: 2–3 h.

### P0-4. AFCON label says "2027" but URL slug is `afcon-2025`
**Where:**
- Labels: `src/lib/i18n/messages/en.json:60` (`"afcon": "AFCON 2027"`), `:602`; same in `fr.json` (`"CAN 2027"`) and `ar.json`.
- Slug: `src/lib/constants/competitions-mega-menu.ts:133` (`slugs: { fr: 'can-2025', en: 'afcon-2025', ar: '…-2025' }`).

**Behaviour:** Every page shows AFCON nav item / sidebar link reading "AFCON 2027" but the URL the user sees on hover or after click is `/competition/caf/afcon-2025`. Search-engine indexing will be split between the wrong slug and the wrong label.
**Root cause:** Editorial change of the upcoming edition year was made on the labels but not the slug. AFCON 2025 was the delayed edition (postponed by CAF), so the data in DB is the 2025 edition; if the next edition shown is 2027, the entire `MEGA_MENU_SECTIONS` entry needs reconciliation with the seeded DB seasons.
**Fix:** Decide whether you're showing AFCON 2025 (completed/in progress) or AFCON 2027 (future). Either rename the slug to match the label, or rename the label to match the slug. Do not ship the inconsistency. Same applies to WAFCON: left rail says "WAFCON 2024" with `/wafcon-2024`, top nav says "WAFCON" with `/wafcon-2026`. See P0-5.
**Effort:** 30 min once the editorial decision is made.

### P0-5. WAFCON year inconsistency between top nav and side rail
**Where:**
- Top nav: `WAFCON` → `/en/competition/caf/wafcon-2026` (label, ID 922).
- Left rail of inner pages: `WAFCON 2024` → `/en/competition/caf/wafcon-2024` (label, ID 922 reused).

Both entries use the same competition ID 922 with different slugs. Hitting `/wafcon-2026` shows the same data as `/wafcon-2024` (because both resolve to comp 922). This is exactly what BACKLOG line 103 flagged on 2026-05-20 ("data correction needed"), still live.
**Fix:** Pick one canonical edition for v1. Either (a) ship only `wafcon-2024` (completed edition) and add `wafcon-2026` when the next tournament's data arrives, or (b) keep `wafcon-2026` as a pre-tournament placeholder card. Don't ship both pointing at the same data.
**Effort:** 15 min config change.

### P0-6. Ticker (AdaptiveTopStrip) shows raw 3-letter slug fragments instead of team names
**Where:** Every page, bottom of the layout. Component: `src/components/chrome/TickerStrip.tsx`, label helper: `src/lib/utils/team-name.ts:53–61`.
**Behaviour:** Algerian Ligue 1 teams and Botola 2 teams render as opaque codes — `RAJ`, `ORA`, `ALG`, `MOG`, `WYD`, `MOU`, `USM`, `KEN`, `RAC`, `JEU`, `CAK`, `RAB`, `DIF`, `BER`, `OLY`, `HAS`, `YEM`, `CODM`. Meanwhile in the same ticker, Riadi Salmi, Olympique Akbou, Union Sportive Boujaad, Widad Témara, Chabab Ben Guerir, Amal Tiznit, Chabab Mohammédia render as full team names. The mix looks broken and many codes are unrecognisable even to Moroccan football fans (`CODM`? `JEU`? `OD`?).
**Root cause:** `getCompactTeamLabel` does `team.code ?? team.shortName[locale] ?? …`. For DB rows where `team.code` is set (most Algerian + many Botola 2 sides), the code wins, regardless of how cryptic it is. For rows where `code` is `null` (Riadi Salmi, Olympique Akbou, etc.), it falls through to `shortName` / `name`. The current behaviour rewards data-completeness with worse UX.
**Secondary bug — ticker row "OD vs HAS"**: the home team label is empty in the rendered output (only "20:00 HAS" appears). Looking at TickerStrip code, the fallback chain ends at `'TBD'` but the page tree shows neither "OD" nor "TBD" in the home slot — there is some other render-time exclusion happening. Probably one team object has `code=null` AND empty shortName/name maps, so `isRenderable` should have filtered it but didn't because the away team has data.
**Fix:**
1. Reverse the priority: prefer `shortName[locale]` → `shortName.en` → `name[locale]` truncated → `code` → `name.en` truncated. Codes only as last resort.
2. Tighten `isRenderable` to require BOTH teams to have a non-code label, or fall back the full name truncated for both sides.
3. Audit `teams.code` in DB: drop or null out codes that aren't real well-known short forms (Algerian league codes like `ORA`, `MOG`, `CAK` should not be presented to a Moroccan/international audience).
**Effort:** Logic flip in `getCompactTeamLabel`: 15 min. Visual verification on ticker across all locales: 30 min. Data cleanup of bad `teams.code` values: 1–2 h script.

---

## P1 — Visible day-one defects

### P1-1. Hero countdown card uses string-sliced 3-letter "codes" instead of real codes
**Where:** WC 2026 page, hero card next to standings preview. Same pattern shows on team page (`Morocco` → `MOR`, `Brazil` → `BRA`, `Scotland` → `SCO`). Match cells in the ticker on inner pages.
**Behaviour:** "South Africa" renders as `SOU` (substring of "South Africa", not the standard FIFA code `RSA` or `SAF`). Reads as a typo. Same fallback shows `BOS`/`CZE`/`KOR` correctly but breaks on multi-word countries.
**Root cause:** `getCompactTeamLabel` `truncate(value, maxLen)` falls through to `name.en.slice(0, maxLen)` when no proper short label exists. For South Africa the code is missing or wrong in DB.
**Fix:** Apply the priority flip from P0-6 — but also seed proper national-team codes in DB (`RSA` for South Africa, `BIH` for Bosnia, etc.). Use FIFA tri-code where available, ISO where not.
**Effort:** Script to set `teams.code` from FIFA tri-code table: 1–2 h. List of 48 WC 2026 codes is small.

### P1-2. WC 2026 Overview "Upcoming" fixtures are sorted reverse-chronologically
**Where:** `/en/competition/fifa/world-cup-2026` → Overview tab → upcoming matches list.
**Behaviour:** First date shown is `Sun, 28 June 2026`, then `Sat, 27 June 2026`, and within each date the matches descend from 23:30 down to 00:00. The most relevant upcoming match (Mexico vs South Africa on 11 June — 5 days away from "today" 6 June) does NOT appear in the upcoming list at all.
**Root cause:** Sort order is `kickoffAt DESC` when it should be ASC, and the list appears to be windowed to a later range rather than starting from "now". Without code paths verified live, the symptom suggests the wrong `orderBy` direction in the query that backs the Overview "Upcoming" mode.
**Fix:** Verify the `WCFixturesTab` / Overview "Upcoming" query — `orderBy(asc(fixtures.kickoffAt))` with `kickoffAt >= NOW()`. Hide today's date label if no fixtures match.
**Effort:** 30 min.

### P1-3. Team page right-rail "World Cup teams" list shows ~12 duplicate teams
**Where:** `/en/equipe/morocco-31` (and presumably any national team), left rail "World Cup" list.
**Behaviour:** 60+ team tiles render, with Qatar, Haiti, South Korea, Australia, Ivory Coast, Sweden, Iran, Saudi Arabia, Iraq, Austria, Uzbekistan and Ghana each rendered twice. WC 2026 has 48 unique teams — this widget should show 48 tiles, not 60+.
**Root cause:** `getTeamsInSameCompetition` in `src/lib/db/queries/team.ts:547` selects `teamId` from `standings` rows ordered by rank. If the team appears in standings for more than one logical sub-group (Best Third-Placed standings + group standings, or duplicate seed rows), the same `teamId` appears twice. The query has no `DISTINCT` on `teamId`.
**Fix:** Either `SELECT DISTINCT teamId` or accumulate into a `Set<number>` after the query. Confirm by querying `standings` for `competition_id=1, season_year=2026` grouped by `teamId having count(*) > 1`.
**Effort:** 20 min query change + verification.

### P1-4. Cape Verde missing flag emoji in standings tables
**Where:** WC 2026 Group H standings preview, team page right-rail tiles.
**Behaviour:** All other Group H teams render a flag emoji preceding the name; Cape Verde shows the name without a flag. Same for the right-rail competition-teams tile.
**Root cause:** Either `teams.countryCode` is `null` for Cape Verde (ID 1533), or `teams.isNational` is `false`. `codeToFlag('CV')` would correctly emit 🇨🇻 — function works, the input is missing.
**Fix:** Backfill `teams.country_code = 'CV'` and `is_national = true` for team 1533 (and audit other unflagged teams). Probably a 1–5 row data fix.
**Effort:** 15 min.

### P1-5. Edition selector on WC 2026 missing 2014
**Where:** WC 2026 page → Edition combobox (top of center column).
**Behaviour:** Options shown: 2026, 2022, 2018, 2010. The "Titles" section right below lists 2014 (Germany) and 2006 (Italy) — so the data exists, but the selector skips them. Users will read this as either incomplete data or as 2014 being unavailable.
**Root cause:** The edition list is hardcoded (not queried) and 2014/2006 entries are missing. Verify in `tournament-metadata.ts` or wherever the editions array lives.
**Fix:** Either compute the editions list from `seasons` table for `competition_id = 1`, or update the hardcoded list to include 2014, 2006, 2002, 1998... — pick a depth.
**Effort:** 30 min if querying; 5 min if list edit.

### P1-6. Hero featured carousel uses 12-hour and 24-hour time on the same page
**Where:** Match page (`/en/match/1489369`).
**Behaviour:** Center hero shows `19:00 / 11 Jun 2026` (24-hour). Match Info card next to it shows `Kick-off: 07:00 PM` (12-hour with AM/PM). Same kickoff moment displayed two different ways within the same render.
**Root cause:** Two different date-formatting helpers in different components. One uses `formatMatchTime` (24-hour), the other uses an `Intl.DateTimeFormat` with `hour12: true` or a `toLocaleTimeString()` default.
**Fix:** Consolidate on one locale-aware formatter. `formatMatchTime` should be the single source for any time of day across the site. For EN locale, 24-hour without AM/PM is the right call (Sofascore convention, matches what the rest of the site does).
**Effort:** 1 h to find all formatters and migrate, including FR/AR locale outputs.

### P1-7. Match page "Next Match" widget shows "TBD vs Mexico"
**Where:** `/en/match/1489369` left rail.
**Behaviour:** Pre-tournament, the widget says "TBD vs Mexico" / "TBD vs South Africa" — pulling a future knockout fixture whose home team isn't determined yet. For a tournament match, "next match" is usually the next group fixture, not a hypothetical knockout slot.
**Fix:** For competitions with a group stage, prefer the team's next *group-stage* fixture in the current competition. Only show knockout fixtures once the team has clinched a slot. If both teams are TBD, hide the widget.
**Effort:** 1 h logic update.

### P1-8. Recent Form widget asymmetric — one team has 1 result, the other has 5
**Where:** Match page Recent Form section (Mexico vs South Africa).
**Behaviour:** Mexico shows `D` (1 result). South Africa shows `L W L W W` (5 results). The query likely fetched 5 most-recent results for each team independently and Mexico genuinely has only 1 ingested historical fixture — but rendering 1 dot next to 5 reads as a bug.
**Fix:** Either (a) hide the row for a team that has fewer than N results, (b) show "Insufficient data" badge with the partial row dimmed, or (c) extend the fixture ingestion to capture more history for sparsely-played national teams.
**Effort:** 30 min UI; data is a Phase 13 ingestion item.

### P1-9. Fixture tabs show empty counts: "All ()", "Live ()", "Upcoming ()", "Results ()"
**Where:** Homepage, central fixtures tabs.
**Behaviour:** Empty parentheses where counts should be (or where the affordance should be omitted). Reads as a broken template.
**Root cause:** Component is computing counts from an empty array (likely the date selector starts on "Today" 6 June with no fixtures in the visible window), but the rendering interpolates the empty number regardless.
**Fix:** Hide the parentheses when count is zero or undefined; or render `"0"` explicitly inside if the empty-state is what we want users to see. Also: when there are no fixtures on the selected day, the page collapses to the right rail and reads as "nothing happened" rather than offering "Try the World Cup tab" or similar.
**Effort:** 15 min for the empty-paren fix; 1–2 h for proper empty state.

### P1-10. Quick Filters left rail shows inconsistent counts
**Where:** Left rail, homepage.
**Behaviour:**
- "Live now" — no count.
- "Today's matches" — no count.
- "Upcoming" — **242**.
- "Results" — **14227**.

The 14,227 number is meaningless to a user (it's every historical fixture in DB) and dramatically miscalibrated against "Today's matches" which has no count. Also: clicking these filters does not appear to filter the fixture list — they look interactive but aren't (or aren't obviously so).
**Fix:** Either (a) compute counts for all four states scoped to a sensible window (today / next 7 days / live now / yesterday's results), or (b) drop the numbers entirely. Wire the filters to the central fixtures list. Empty filter widgets that change nothing is a P1 trust issue.
**Effort:** 2–3 h to wire properly, 5 min to strip.

### P1-11. Mobile menu and search button visible on desktop nav but mobile menu button is also visible
**Where:** Top nav, all viewports.
**Behaviour:** The "Menu" button (mobile drawer) is present in the accessibility tree at desktop sizes as well. Likely hidden via CSS at `md:` breakpoint, but defensive screen-reader users / keyboard-only users would experience a duplicate menu affordance. Verify it has `aria-hidden` at desktop or is conditionally rendered.
**Effort:** 15 min audit.

### P1-12. "View all competitions" is a `<button>` on inner pages but a `<link>` on homepage
**Where:**
- Homepage left rail: `<a href="/en/competitions">View all competitions</a>` (link, 404 target — see P0-2).
- WC 2026 page (left rail) and Morocco team page (left rail): `<button>View all competitions</button>` (button with no click handler).

The same affordance is two different elements with two different broken behaviours.
**Fix:** Unify on `<Link>` and resolve to a real competitions index (or remove until P0-2 is fixed).
**Effort:** 30 min once P0-2 lands.

---

## P2 — Polish

### P2-1. Match page renders two empty `<aside>` (`complementary`) elements at the top of `<main>`
Visible in the accessibility tree as `complementary [ref_3]` and `complementary [ref_4]` immediately after `main`. They have no content. Probably a layout shell that's reserved for grid sidebars but rendered even when empty. Cosmetic at desktop, may push content on mobile.

### P2-2. Match Info card duplicated on match page
Both center column and right rail render an identical "Match Info" widget with Competition / Date / Kick-off / Stadium / Round. Either the right rail should drop it or the center column should.

### P2-3. Team page header shows national stadium for national teams
Morocco's page header reads `1955 · Complexe Sportif de Fès · 45,000` — but national teams play at multiple venues, not one. This is the API-Football "default venue". Either label as "Home venue" with a disclaimer, or omit for `is_national = true` teams.

### P2-4. Featured countdown carousel auto-rotates every 7s with 8 slides — can outrun a reader
A user reading the venue / countdown will get carried to the next match before finishing. Either (a) pause on focus / hover (hover is there but focus isn't tested), (b) increase to 10s, (c) reduce to 3–4 slides.

### P2-5. Breadcrumb segment "World Cup" on team page is a non-link plain text
`/en/equipe/morocco-31` breadcrumb shows `Football > World Cup > Morocco …`. "World Cup" is a destination that exists at `/en/competition/fifa/world-cup-2026` — should be a link. Same fix as the BACKLOG L102 season selector cross-cutter, but unrelated.

### P2-6. Sitemap has every locale × every entity = will exceed 50k URLs quickly
The sitemap is already 405 KB at this fixture count. Three locales × (~30k players + ~10k fixtures + ~5k teams) → 135k URLs. Google's per-sitemap limit is 50k. Need to split into a sitemap index with per-locale or per-entity sub-sitemaps before launch — or the late-priority entries will be silently truncated. `src/app/sitemap.ts` returns one giant array.

### P2-7. Top nav has 11 hardcoded competition links + "More" button — 12 surfaces
At narrow desktop widths (≤1200px) the row will wrap or overflow. Consider collapsing into "More" sooner, or adopt a marquee/scrolling pattern.

### P2-8. Ticker — every ticker entry uses `1548311`-style fixture-id paths but several rows have stale Algerian Ligue 1 matches from `1513486` / `1513487` (`Olympique Akbou` / `ORA`)
These are old fixtures repeatedly showing on the live ticker. BACKLOG L74 logs stale 2H fixtures: 1391175, 1513400. The 1513486/1513487 entries observed during this audit may be the same class — they should not appear if filtered to "today's upcoming OR live" — they were neither.

### P2-9. Featured hero shows competition name in ALL-CAPS small-caps for "WORLD CUP · GROUP A" — readable, but the time `THU 11 JUNE · 19:00` style differs from elsewhere
Mixed date formats throughout: `Sat 6 Jun · 16:00` (sentence-case, short), `THU 11 JUNE · 19:00` (uppercase, long), `Thursday, June 11, 2026` (long-form), `Sun, 28 June 2026` (medium). Pick 1 short and 1 long format per locale, use everywhere.

### P2-10. Right rail "Top scorers" / "Top assists" empty state across WC 2026 is correct, but lacks any CTA
"Available once the tournament begins" — could link to a historical edition's top scorers as proof-of-life ("See Argentina's 2022 golden boot run").

---

## P3 — Latent / already in BACKLOG

These were observed live and confirm BACKLOG entries:
- BACKLOG L98 "Ticker shortName overflow / truncation" — confirmed P0-6.
- BACKLOG L34 "LiveTicker fallback to 'Team'" — degraded to mixed codes/names rather than 'Team'; current behaviour is the bug Phase 5 retro flagged.
- BACKLOG L88 "Create proper 1200×630 OG image" — still using `wc-2026-trophy.png` which is square. Won't preview well on social.
- BACKLOG L84 "Cape Verde EN name 'Cape Verde Islands'" — confirmed; flag also missing (P1-4).
- BACKLOG L86 "Related Competitions only resolves AFCON Qualifiers" — but the WC 2026 page audit found all 7 WC qualifier links present, so this BACKLOG entry may be stale or already fixed.
- BACKLOG L103/L104 "WAFCON labeling / Coupe du Trône top scorers wrong year" — confirmed P0-5.
- BACKLOG L105/L106 "15 cups show coming soon despite data" / "10 competitions data with no menu routing" — confirmed; revisit after launch.
- BACKLOG L115 "Match page LiveScoreDisplay hydration #418 deferred to Phase 8" — could not reproduce on a static fixture, but pre-tournament. Watch when first live match starts (11 June).

---

## Pre-launch readiness assessment

| Area | Status |
|---|---|
| Build / typecheck | Working (last commit b7cda86 on 2026-06-04, `tsc + build clean` per BACKLOG L131). |
| `next.config.ts` | CSP, HSTS, X-Frame-Options, redirects for `www`, `dimascore.ma`, season query → path migration — all configured. `cacheComponents: true` + `cacheLife` is correct for PPR. |
| Vercel crons | 7 crons scheduled (reference-data, fixtures-schedule, standings, top-scorers, fixture-details, squads-refresh, finalize-stale). Coverage of the live-data pipeline matches Phase 13 scope. |
| Robots / Sitemap | `robots.ts` correctly blocks `/admin/`, `/api/`, `/dev/`. Sitemap exists but unsplit (P2-6). |
| OG / social previews | Default `opengraph-image.tsx` exists at root. Competition OG uses wrong-aspect trophy PNG (BACKLOG L88). |
| JSON-LD | `SportsEventJsonLd` shipped per BACKLOG L70 (Sub-task 6.4 retro). Per-fixture SportsEvent deferred. |
| Accessibility — ticker pause | Implemented (`WCAG 2.2.2` — `Pause ticker` button visible in tree). Honors `prefers-reduced-motion`. ✓ |
| Accessibility — focus | Not exhaustively tested; tab order through carousel + ticker + tabs should be walked with keyboard before launch. |
| Mobile (390 px) | Layout collapses to single column. Bottom nav has 3 broken affordances (P0-3). Featured carousel + content cards render. |
| RTL (`/ar`) | Not audited in this pass; ticker has `dir="rtl"` per locale, but the BACKLOG L89 entry says ticker still uses Latin codes on AR which is the same root cause as P0-6. |
| Pusher (live scores) | Wired in `TickerStrip.tsx`. Cannot verify until first live fixture (11 June). |
| Hydration warnings | Specific `suppressHydrationWarning` applied to time-of-day spans across shared components. Page-specific exceptions logged in BACKLOG L115 (Phase 8/9 deferred). |

---

## Recommended pre-launch fix order

1. **P0-1 / P0-2 / P0-3** — remove or wire the dead links. *Day-1 trust killers.*
2. **P0-6 / P1-1** — fix `getCompactTeamLabel` priority and seed proper national-team codes. *Most visible UX bug.*
3. **P0-4 / P0-5** — reconcile AFCON / WAFCON labels and slugs. *15 min config, ships consistency.*
4. **P1-3** — `DISTINCT` in `getTeamsInSameCompetition`. *20 min for 12 duplicate teams.*
5. **P1-4** — backfill Cape Verde + audit `is_national`/`country_code` for all teams in standings. *15 min data fix.*
6. **P1-2** — fix Upcoming sort direction on WC 2026 Overview. *30 min.*
7. **P1-6** — unify time-of-day formatting. *1 h.*
8. **P1-9 / P1-10** — fix empty-paren counts and Quick Filters. *2 h.*
9. **P2-6** — split sitemap before Google crawls. *2 h.*
10. **P0/P1 verification on mobile + RTL** — walk every fix in `/ar` viewport. *2 h.*

Total P0–P1 critical-path work: ~1.5–2 engineering days. P2 polish: another 1–2 days but ship-without is acceptable.

---

## What was NOT audited

- Admin UI (`/admin`) — gated, out of scope for pre-launch user-facing audit.
- Live-data flow under load — WC 2026 kicks off 11 June; first live match will be the real Pusher / poller test.
- French and Arabic locales — only EN reviewed. Many BACKLOG entries reference AR fallback gaps; deserves a focused per-locale pass.
- Browser-spread testing (Safari, Firefox); only Chrome session here.
- Lighthouse perf scores — no measurements run.
- A11y audit beyond DOM tree shape — no axe / screen reader walkthrough.
