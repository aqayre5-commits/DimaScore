# Fallback crests (2026-11)

Inline SVG crest when a team or competition logo is missing, broken, or API-Sports' generic placeholder. Local evidence only; production counts need Infra Desk's scan.

## Detection

- Migration `0009_logo_status.sql` adds nullable `logo_status` (`ok` | `missing` | `placeholder`) on `teams` and `competitions`. Existing `logo_url` is left in place so a later scan can recover if a real file appears.
- `scripts/scan-logo-status.ts` GETs each public CDN URL (concurrency 4, max 8, 8s timeout, in-process URL cache), SHA-256s the bytes, and classifies. Dry-run by default; `--apply` writes only rows where `logo_status IS DISTINCT FROM` the new value (idempotent). `--csv <path>` writes fallbacks.
- Stored relative assets (`/competitions/...`) are display-`ok`. The script still hashes the canonical `media.api-sports.io` file for the census.
- Ingestion (`src/lib/ingestion/teams.ts`, `reference-data.ts`) classifies new/updated logos the same way.

### Placeholder hashes (reviewed from the local seed)

| Hash | What | Examples |
| --- | --- | --- |
| `72f0bbb253ab54961cd5d66148e55aceb3e6bc9823da43e57a6e0812e5427430` | Grey camera "image not available", 29,416-byte 150×150 PNG | Amal Tiznit (18753) |
| `78e6132b4b2566fbab177137480d0f883aee9c2370bd9a668787263c1a2d9138` | Grey "OFFICIAL LOGO SOON" disc, 6,746-byte 150×150 PNG | Widad Témara (3458), USM Oujda (17716) |

Both are in `KNOWN_PLACEHOLDER_SHA256`. A repeated hash that is **not** a placeholder: Bayern München men (157) and women (1860) share a real crest (`909d7704e49a2d04e57695a9f1030f8b30f01fb82e632b773d897ce2bf5a8d4b`). Do not add it.

### Competition placeholders

On the local seed, all 17 competition API files returned HTTP 200 with **unique** hashes. None matched either known team placeholder. World Cup (1) and AFCON (6) use curated local trophies (`/competitions/wc-2026-trophy.png`, `/competitions/afcon-trophy.svg`); their API league files are distinct real graphics, not the camera/disc. Production may still have a different competition placeholder — Infra's dry-run will list any new repeated hashes.

## Fallback icon

`FallbackMark` is an inline SVG (no network request), sized by `size` or 100% of the existing `.mark` box so layout matches a real crest (no CLS).

- Teams: shield/crest path. Competitions: rounded badge of the same 24×24 viewBox.
- Initials (2–3 letters): `teams.code` → Latin `shortName` → Latin name initials → Arabic initials (skip ال / سيدات) → `•`. "Club" is kept so "Raja Club Athletic Women" → RCA. Amal Tiznit (no code) → **AT** from the Latin name. An Arabic-only name such as أمل تزنيت → **أت**.
- Fill: `teams.primaryColor` / `secondaryColor` when set (and lineup/kit colours when the page already passes them). These three local-seed clubs have null colours, so they use neutral tokens: light fill `#2c4f3f` / ink `#f4f7f5`; dark fill `#9eb5a9` / ink `#101512`. Contrast for initials is kept ≥ 4.5:1 (AA). The season-kit catalog is not imported into the client bundle.
- `TeamMark` (client) shows the real crest or national flag when `usableLogoUrl` is set, and swaps to `FallbackMark` when status ≠ ok or `onError` fires. Wired through Flag, Logo, competition `Crest`, match-centre `Mark`, team headers, lineups, and the competition rail.

## Local fallback list

Path: `docs/reviews/fallback-crests-2026-11/local-fallback-logos.csv` (copy also at `/workspace/site-revamps/dimascore.ma/fallback-crests-2026-11/local-fallback-logos.csv`).

**Local seed only — 3 rows, all teams, 0 competitions.** Do not treat these as production counts.

- team 3458 Widad Témara — placeholder (logo-soon disc)
- team 17716 USM Oujda — placeholder (logo-soon disc)
- team 18753 Amal Tiznit — placeholder (camera graphic)

Local totals: 155 teams + 17 competitions scanned; 169 ok, 3 placeholder, 0 missing.

## Infra (in this order)

1. Apply migration `0009_logo_status` (adds `logo_status` on `teams` and `competitions`). Do not null out `logo_url`.
2. Dry-run: `pnpm tsx --env-file=.env.local scripts/scan-logo-status.ts --csv /tmp/logo-fallbacks.csv`. Review counts, new repeated hashes, and competition hashes. Add a hash to `KNOWN_PLACEHOLDER_SHA256` only after confirming it is a generic placeholder.
3. Write: `pnpm tsx --env-file=.env.local scripts/scan-logo-status.ts --apply` (safe to re-run).
4. Deploy the app (the UI reads `logo_status` and renders the fallback).

No production DB or hosting from this PR. Navbar and logo unchanged.

## Checks

`check-table-alignment.py --long-names` against the local seed (80 views: PL en/ar, LaLiga en, Botola en/ar × standings+stats × 1440/1024/390/360 × light/dark).

- Botola en/ar, LaLiga en, and PL ar: overflow **0**, `tablePastPx` 0, `docOverflowPx` 0.
- PL en Stats at 390/360 (light+dark only): 4 overflow fails, `docOverflowPx` 26 / 56, `.pl-stats-board` 402px. This is the pre-existing origin/main Stats mobile overflow fixed in open PR #76, out of scope here (this branch is off `origin/main`, separate from #76).
- Match hero / events / rails (local capture walker): document overflow 0 after the fallback size fix (`width: var(--m, 24px)` instead of `100%`, which had blown up standings cells).

Evidence screenshots (local only): `/workspace/site-revamps/dimascore.ma/fallback-crests-2026-11/{before,after}/`.
