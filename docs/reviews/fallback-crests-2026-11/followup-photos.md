# Follow-up to #77 — player photos and two more team placeholders

Approved by Abdilahi, 19:58 Europe/London, 25 Nov 2026: "Yes, fix the remaining logos".

## What Infra Desk found after #77

1. Two Amal Tiznit players on Botola Stats still showed the grey camera. The events-based scorer/assist path (`getEditionTopScorers` / `getEditionTopAssists`) returned a raw team `logo_url` without `logo_status`, so `TeamMark` never hid the known camera graphic. Independently, both players' headshots (Y. Zraa 407309, Z. Essalhi 668819) are the API-Sports grey silhouette.
2. The USM Oujda squad page showed one small placeholder. It is not a player photo: Key Players renders a 12×12 club crest for A. El Hmidi (player 140662, real photo). The crest is Oujda's official-logo-soon disc (`TEAM_LOGO_SOON_SHA256`, already in the #77 hash list). `getTeamKeyPlayers` did not pass `logo_status`, and the card used a raw `<Image>`.
3. Fourteen more production teams use two placeholder PNGs that were not in the hash list. They are not in the local 158-team seed. They were identified from the public sitemap (`https://dimascore.ma/sitemaps/sitemap/teams.xml`) plus GET `https://media.api-sports.io/football/teams/{id}.png`. The production DB was not touched.

## New hashes

Team placeholders (added to `KNOWN_PLACEHOLDER_SHA256`, so `scan-logo-status --apply` will pick them up):

| Constant | SHA-256 | What it looks like | Bytes | Teams (14) |
| --- | --- | --- | --- | --- |
| `TEAM_CAMERA_DARK_SHA256` | `7670cc2d08b0b4a846ac6ec076c99d3767c4d2b9322e2d31cd05871422ddbbda` | Grey camera on a **black** square (different file from the 29,416-byte light camera already listed) | 90,381 | Tempete Mocaf 6436, Kitara 15562, ASAS 16194, NEC 22699, El Merriekh Bentiu 24352, La Cure Waves 25405, Olympique Marrakech 25725, EJS Casablanca 25726, Etoile Marrakech 25727 |
| `TEAM_SHIELD_OUTLINE_SHA256` | `a2cea5dc38d2802f6f45317809cba250357b375cd3ba0373754fa9b4938f453b` | Empty outline shield on a black square | 90,381 | Scotland Mabvuku 25735, Tunisia U18 27791, Hajduk Split W 27869, Seasters Odesa W 27875, TSC W 27879 |

Player photo placeholder (separate set, `KNOWN_PHOTO_PLACEHOLDER_SHA256` — not a team-logo hash):

| Constant | SHA-256 | What it looks like | Bytes |
| --- | --- | --- | --- |
| `PLAYER_SILHOUETTE_SHA256` | `2ff7d52a628fce5d954c58480dde4e47396db4bb405b7b7d6a6567134bf86422` | Grey person silhouette, 150×150 PNG | 5,192 |
| `COACH_NO_PHOTO_SHA256` | `575e4487e3942dd820fe682e8b81f9c59b0b0d60265433ce5bd1884db4004035` | Grey bust with “NO PHOTO YET” | 8,624 |
| `COACH_SHIELD_OUTLINE_SHA256` | `b602abdd01273f6dd29855a6aed585747243148768da4a5a54e3cebd9989fd36` | Empty outline shield on black (coach CDN) | 12,934 |

The last two were found on a local photo scan of canonical `media.api-sports.io/football/coachs/{id}.png` URLs (16 and 3 local coaches). They are generic placeholders, not shared real portraits. A player/coach pair sharing hash `a83d5ed6…` is a real headshot and was not added. Coach images that are the already-known team camera (`72f0bbb2…`) are already classified as placeholders via the team hash set.

`photo_url` / `logo_url` are never nulled. Display uses `usableLogoUrl` + inline SVG fallbacks.

## What changed

- Migration `drizzle/0010_photo_status.sql`: `players.photo_status` and `coaches.photo_status` (`ok` / `missing` / `placeholder`).
- `classifyPhotoUrl` + `scripts/scan-photo-status.ts` (dry-run default, `--apply`, `--csv`, `--concurrency`, `LOCAL_NEON_FETCH_ENDPOINT` opt-in). Idempotent. Does not write production by itself.
- Ingestion (`syncSquad`) classifies and stores `photo_status`.
- `PlayerPhoto` / `PlayerPhotoCircle`: real photo when usable; otherwise a circular (or rectangular hero) inline SVG initials avatar, AA neutrals, sized like a photo, no network request on fallback. `onError` also flips to the fallback.
- Wired everywhere a player or coach photo actually rendered (stats/right-rail boards, rankings, squads, key players, search, homepage rails, injuries, cup overview, player/coach headers). Match line-ups and events still use kit numbers / team marks, not headshots; remaining raw team logos in those query paths are sanitized.
- USM Oujda 12px club mark: `KeyPlayersCard` now uses `TeamLogo`/`TeamMark` with `logo_status`, so the logo-soon disc becomes a 12px fallback crest.
- Remaining unsanitized team-logo query paths (edition scorers/assists, key players, search, injuries, homepage, right-rail, coach current team) now pass status through `usableLogoUrl`.

## Infra Desk (order)

Do not touch the production DB except through these scripts, in this order:

1. Run migration `0010_photo_status` (and `0009_logo_status` first if that environment never received it).
2. `npx tsx scripts/scan-logo-status.ts` dry-run — should reclassify the 14 teams on the two new hashes, plus any previously unscanned rows.
3. `npx tsx scripts/scan-logo-status.ts --apply`
4. `npx tsx scripts/scan-photo-status.ts` dry-run (optionally `--csv path.csv`)
5. `npx tsx scripts/scan-photo-status.ts --apply`
6. Deploy this PR.

Production counts come from those runs, not from the local seed (the 14 teams are not in the seed; local photo counts also differ from production).


## Checks (25 Nov 2026, Europe/London)

`check-table-alignment.py --long-names` on the local seed at `http://127.0.0.1:3900`, 64 views (Botola en/ar standings+stats, USM Oujda equipe, UTS Rabat–Amal Tiznit match; 1440/1024/390/360; light/dark).

- All 64 views completed. Overlaps 0, table leaks 0, column-variance fails 0, **document overflow 0**.
- **Botola standings and Stats: 32/32, element overflow 0** (including `--long-names`).
- USM Oujda equipe (local squad is empty — no `squad_members` in the seed): official walk flags a pre-existing 16px tab underline (`span.absolute.inset-x-0.bottom-0` on the team tabs) and a tight identity/follow row at 390/360. Same underline is visible on production before-shots. Navbar and logo were not changed. `docOverflowPx` 0.
- Match page: 1440 is 0; at 1024/390/360 the walk flags two pre-existing `svg` event icons in `li.mc-incident` (8px past the parent). Not introduced by photo/crest wiring (line-ups still use kit numbers). `docOverflowPx` 0.
- Evidence: `/workspace/site-revamps/dimascore.ma/fallback-crests-2026-11/followup/{before,after}/` (before from production after #77; after from this branch on the local seed). Report: `alignment-report.json`.
- Local photo scan (seed only, not production): 1695 rows (1651 players, 44 coaches) → 1455 ok, 240 placeholder, 0 missing. CSV: `/workspace/site-revamps/dimascore.ma/fallback-crests-2026-11/followup/local-photo-status.csv`.

### Re-check after rebasing on main (#78, #79), 25 Nov 2026

Same command, 64 views, local seed: overlaps 0, table leaks 0, column-variance fails 0, document overflow 0 in every view. Botola standings and Stats: 32/32 with element overflow 0.
The USM Oujda team header (h1/follow button/form row, 16px tab underline) and two 36px crest SVGs in match event rows are still flagged at 390/360 (and 1024 for the match). They are not caused by this PR: the same check on production before this change (https://dimascore.ma, `--long-names`, 390 and 360, light) reports the same offenders (Oujda 4 and 6, match 2 and 2). Left unchanged (team header is the old design; no unrequested layout changes). Report: `prod-baseline-report.json`, `recheck-report.json`.
Unit tests: failures are only the suites that need `API_FOOTBALL_KEY` / a database URL (same on main); `tsc` clean apart from stale `.next` validator types.
