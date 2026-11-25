# Season-kit fallback when API-Football has no colours (Nov 2026)

PR #63 stores per-fixture palettes on `fixture_lineups.colors` and falls back
to a neutral grey shirt when API-Football omits `team.colors`. A season-kit
step already existed in `resolveRolePalette`, but ingestion never passed a
season kit, there is no season-kit table, and `KIT_CORRECTIONS` is empty, so
the fallback never ran. Teams such as Manchester City and Fulham stayed grey
after the backfill.

## What this changes

When the API palette has no primary, the resolver may now use a **season kit**,
but only after a worn-kit slot (home / away / third) has been chosen.

### How “known kit” is decided

1. **Verified.** A row in `KIT_WORN_SLOTS` (`${fixtureId}:${teamId}` → `home` |
   `away` | `third`) or a colour in `KIT_CORRECTIONS`. Both start empty; add a
   row only when the worn kit has been confirmed.
2. **Convention (not verified — kept as a separate `basis` so it can be
   judged on its own):**
   - the **home** team wears its **home** kit;
   - the **away** team wears its **away** kit;
   - if the away shirt clashes with the home team’s worn shirt (contrast
     ratio below 2) and a **third** kit is catalogued, the away team wears
     third.
3. **Unknown.** No catalog or inferred palette for this team and season →
   stay grey.

Colours can also be **inferred** from that team’s own API-Football palettes
in other fixtures of the same season (home slot = most common primary when
the team was at home, away slot = most common when away). Those colours are
verified-from-API; the worn slot for a fixture that still has no colours
still uses the convention unless `KIT_WORN_SLOTS` has a row.

### Sources (curated 2026/27 catalog)

The catalog is in `src/lib/match/season-kits.ts` (`SEASON_KITS`). It currently
covers Manchester City (50) and Fulham (36) for season year 2026.

- City outfield: Wikipedia 2026–27 season kit template
  (https://en.wikipedia.org/wiki/2026–27_Manchester_City_F.C._season) —
  home body `#98C6EB`, away body `#000000`, sock navy `#1C214F` and flaxen
  `#FCCD10` used as number/border. Official club/PUMA pages confirm a
  sky-blue gradient home, a black-and-flaxen away with a bee motif, and a
  white “Blazing Blue” sash third. The pitch drawing is a **flat primary**;
  gradients, bees and the sash are not drawn.
- Fulham outfield: Wikipedia 2026–27 season infobox
  (https://en.wikipedia.org/wiki/2026–27_Fulham_F.C._season) — home body
  `#FFFFFF`, third body `#ADD8E6`. Away body is empty on Wikipedia because
  the official shirt is a Black/Red checkerboard
  (https://shop.fulhamfc.com/kit/awaykit/awayadult/6915_fulham-2627-adult-away-shirt.html);
  the stored primary is black, with red number/border from the same infobox
  socks (`#FF0000`). Patterns are not drawn.
- Goalkeepers: official shop / PUMA product photos, centre-crop average
  (near-white excluded). City: Vibrant Green–Varsity Green `#3c9d82`
  (https://eu.puma.com/ie/en/pd/manchester-city-26%2F27-goalkeeper-jersey-men/785650).
  Fulham home GK “Blue” `#48a8f0`, third GK “Green” `#63e693` (official shop
  product images). Away GK was not confirmed, so the home GK palette is
  reused. Orange and pink City GK shirts exist but are not assigned to a
  slot. Numbers are chosen for AA contrast (4.5:1), which on these mid-tone
  shirts means a dark number rather than `contrastNumber`’s default.

## What Infra Desk must run

No new migration. No new workers. Do **not** write to production from a laptop.

1. **Deploy** the app and the existing kit workers (Railway live poller,
   Cloudflare shadow poller, Vercel app / `live-details` fallback) so new
   and refreshed line-ups persist `source: "season"` when the fallback
   applies. The match page also applies the fallback at **read time** when a
   stored row is still null or `neutral`, so a deploy alone updates the
   display for catalogued or inferable teams.
2. **Dry-run (read-only)** against production, to get the real counts for
   the 438 backfilled line-ups (this environment has no production DB):

   ```bash
   pnpm tsx scripts/dry-run-season-kit-fallback.ts --days 14
   pnpm tsx scripts/dry-run-season-kit-fallback.ts --all
   ```

   Use the same `--days` as the #63 backfill if you want that window.
3. **Re-run the existing backfill** so stored rows pick up `source: "season"`
   (the backfill already refreshes any role that is still `neutral`):

   ```bash
   pnpm tsx scripts/backfill-fixture-kit-colours.ts --days 14
   ```

To close the remaining grey gap, add cited rows to `SEASON_KITS` (or verified
`KIT_WORN_SLOTS` / `KIT_CORRECTIONS`). Same-season API inference will already
cover teams that have colours on some fixtures but not others.

## Counts

**Production counts are not computed here.** There is no production (or
read-replica) `DATABASE_URL` in this environment. Do not invent numbers for
the 438 backfilled line-ups — run the dry-run script above.

**Local PGlite seed only** (labelled estimate, not production), as of
2026-11-25 02:40 London, after setting the local City–Fulham fixture
(9000001) to stored `neutral` so it matches production-like #63 output
when the API has no colours:

- All stored line-up rows: 232. Null colours: 228. Newly neutral
  (9000001): 2. Existing `source=api` (Real Madrid–PSV, 1635715): 2.
- Of the 230 grey/null rows, **16 would move** (Manchester City 50: 8,
  Fulham 36: 8) via the curated catalog + convention. **214 would stay
  grey** (no catalog row, no same-season API colours in this seed).
- In the default 14-day window: 18 rows, **2 would move** (City and
  Fulham on 9000001), **14 stay grey**, 2 stay `api` (Madrid–PSV).

The catalog can be extended with cited kits for the teams that remain grey.

## Evidence

Full set: `/workspace/site-revamps/dimascore.ma/season-kits-2026-11/{before,after}/`.
Copies in `shots/`.

City–Fulham is the local seed fixture **9000001** (22 Nov 2026, City at home),
the same id used for #63 evidence, now stored as `neutral` rather than a
hand-seeded “api” palette.

- Before 1440 en: `shots/before-city-fulham-en-start-d1440.png` (both sides grey)
- After 1440 en: `shots/after-city-fulham-en-start-d1440.png` (City sky blue, Fulham black)
- 390 and Arabic pairs are in the same folder.
