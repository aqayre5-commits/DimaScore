# Per-fixture shirt colours (Nov 2026)

Line-up shirts on the match pitch used a fixed Manchester City / Fulham sample
palette on every fixture. Colours now come from API-Football
`team.colors.player` / `team.colors.goalkeeper` (`primary`, `number`, `border`),
are resolved once at ingestion, and are stored with the fixture so every view
reads the same values.

## Design

- **Drawing:** the existing `#mc-jersey` symbol already matches Abdilahi’s
  `shirt.svg` (same viewBox and paths). One drawing is kept; fill, sleeves,
  outline and number are driven by CSS variables. Primary paints the body *and*
  the sleeves. No stripes, hoops or sleeve patterns are invented from `border`
  alone.
- **Storage:** `fixture_lineups.colors` jsonb on the existing
  `(fixture_id, team_id)` row:

  ```json
  {
    "player":     { "primary": "#ffffff", "number": "#1a1a1a", "border": "#1a1a1a", "source": "api" },
    "goalkeeper": { "primary": "#f5a623", "number": "#1a1a1a", "border": "#1a1a1a", "source": "api" }
  }
  ```

  `source` is `correction` | `api` | `season` | `neutral`.
- **Matching:** palettes are looked up by `team.id`, never by array order or
  home/away. Home/away only chooses the pitch side (and stays stable under
  Arabic mirroring).
- **Role:** outfield players and their substitutes use the `player` palette.
  Goalkeepers use the `goalkeeper` palette, decided by `pos` (`G` / `GK` /
  `Goalkeeper`) and never by shirt number (e.g. Kovář wears 32). If `pos` is
  missing, the first pitch row is used as a last resort.
- **Resolution, per team and role:** a verified fixture correction
  (`KIT_CORRECTIONS`) first, then the API fixture palette, then a season kit
  only when the worn kit is known, otherwise a neutral grey shirt (`#c8cdd1`)
  with a legible number. If only the number colour is missing, black or white
  is chosen for contrast and the shirt colour is kept. Missing border falls
  back to the number colour.
- **Refresh:** the Railway live poller, the Cloudflare shadow poller, and the
  Vercel live-details fallback re-fetch line-ups when they are missing *or*
  when a stored role is still `neutral`. Full-time `syncFixtureDetails` also
  rewrites colours. This is independent of the 15-second score refresh.
- **UI fallback:** `.lu-home` / `.lu-away` no longer hardcode City / Fulham.
  Unbackfilled rows render the neutral shirt until the worker or backfill
  writes real palettes.

## What must run for this to work live

Do **not** migrate or backfill production from a laptop as part of this PR.

1. **Migrate** — apply `drizzle/0007_fixture_lineup_colors.sql`
   (`ALTER TABLE fixture_lineups ADD COLUMN colors jsonb`).
2. **Deploy the app and the workers** (Railway live poller, Cloudflare shadow
   poller, and the Vercel app / fallback cron) so new and updated line-ups
   persist `colors`.
3. **Backfill recent fixtures** that already have line-ups:

   ```bash
   pnpm tsx scripts/backfill-fixture-kit-colours.ts --days 14
   ```

   Until that runs, existing rows show the neutral shirt, not the old sample
   kits.

Late colour corrections after a complete API palette is stored are picked up
by the full-time details sync, or by re-running the backfill.

## Tests

- Unit: `tests/unit/match/kit-colours.test.ts` — team.id matching with swapped
  order, GK by position, missing primary, missing number + contrast, correction
  precedence.
- Regression: `pnpm tsx tests/e2e/shirt-colours.spec.ts` against a running app
  (`BASE_URL`, `CITY_FULHAM_ID`, `MADRID_PSV_ID`). Opens City–Fulham, then
  Real Madrid–PSV, then Arabic and At full-time, and checks colours follow
  `team.id`.

## Evidence limits

No API-Football key was available in this environment (only a dummy). Real
Madrid–PSV (1635715) line-ups were seeded from cached live HTML/JSON, with
*realistic* palettes (Madrid white / dark numbers; PSV a dark kit) rather than
a live `/fixtures/lineups` colours payload. Manchester City–Fulham is not in
the local DB or a known live fixture id; it was seeded locally as **9000001**
with typical kits and XIs copied from other matches. Team 197 (PSV) was
inserted locally so the fixture could render. None of that seed belongs in
the PR.


## Screenshots

Full set (desktop 1440 + mobile 390, en + ar, Starting XI and At full-time) lives
outside the repo at `/workspace/site-revamps/dimascore.ma/shirt-colours-2026-11/{before,after}/`.
A representative subset is in `docs/reviews/shirt-colours-2026-11/shots/`.

- Before (every fixture uses the City sky-blue / Fulham white sample):
  `shots/before-madrid-psv-en-start-d1440.png`
- After Real Madrid–PSV (white / dark kit, Courtois orange, Kovář #32 in green):
  `shots/after-madrid-psv-en-start-d1440.png`
- After, Arabic (teams visually swap sides, colours stay with `team.id`):
  `shots/after-madrid-psv-ar-start-d1440.png`
- After City–Fulham (sky blue / white, different pair from Madrid–PSV):
  `shots/after-city-fulham-en-start-d1440.png`
- After mobile 390: `shots/after-madrid-psv-en-start-m390.png`
