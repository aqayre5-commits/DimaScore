# Stats mobile overflow fix (2026-11-25)

Follow-up to #74 (live). At 390px the Stats tab Goals column ran past the right edge of the screen (header clipped to “Go”). The earlier alignment check passed because it only measured column x-alignment, not whether the table or any other element overflowed its container or the viewport. With live-like long player names the table’s default `min-width: min-content` stretched the card and the document.

## Fix (CSS only)

- `.pl-stats-board`, `.pl-main`, `.stand-table`, `.pl-ranking`: `min-width: 0; max-width: 100%` so the table can shrink to the content column.
- Stats value column (`.pl-ranking .stand-num`): reserved `4.75rem` (76px) width, never clipped. “Goals” / “Assists” / “أهداف” stay fully visible.
- Player (and team) name cells: `min-width: 0; overflow: hidden` with existing `text-overflow: ellipsis` on `bdi`.
- Standings: `padding-inline-end: var(--card-inset)` now applies only to the last column, not every `.stand-num`. At desktop `--card-inset: 16px` that left ~23px of content in a 44px GD column, so the Arabic abbreviation “فارق” overflowed by 2px. Mobile `--card-inset: 12px` had been just wide enough to hide it.

No routes, SEO, `indexable.ts`, ad slots, or local shims in this PR.

## Root cause

1. A table’s automatic minimum size is its min-content width. Long names (`Francisco Evanilson de Lima Barbosa`, `Dominic Nathaniel Calvert-Lewin`) made the Stats table wider than the 390/360 viewport. The 44px Goals column was pushed past the right edge and the header clipped to “Go”.
2. The table and the container used for `tablePastPx` grew together, so “last column vs container” was 0px even while `document.documentElement.scrollWidth` exceeded `clientWidth` (26px at 390 en, 56px at 360 en).
3. `padding-inline-end: var(--card-inset)` was also applied to middle numeric standings headers.

## Right-edge measurements (long names, light; dark matched)

Values are CSS px. `doc` is `scrollWidth - clientWidth`. After the fix the value column is 76px and the table width equals the container.

| Page | Width | Lang | Before container / table / last / doc | After container / table / last / doc |
| --- | ---: | --- | --- | --- |
| PL | 390 | en | 402 / 402 / 44 / **26** | 362 / 362 / 76 / **0** |
| PL | 360 | en | 402 / 402 / 44 / **56** | 332 / 332 / 76 / **0** |
| PL | 390 | ar | 362 / 362 / 44 / 0 | 362 / 362 / 76 / **0** |
| PL | 360 | ar | 361 / 361 / 44 / **15** | 332 / 332 / 76 / **0** |
| Botola | 390 | en | 402 / 402 / 44 / **26** | 362 / 362 / 76 / **0** |
| Botola | 360 | en | 402 / 402 / 44 / **56** | 332 / 332 / 76 / **0** |
| PL / Botola / LaLiga (empty seed) | 1440, 1024 | en, ar | 0 overflow (tables that exist) | 0 overflow |

Arabic 390 did not document-overflow with the injected names (container already 362) but the value column is now the reserved 76px and is not clipped. 1440 / 1024 were already 0 on Stats.

## General overflow check (from this PR onward)

Implemented in `/workspace/site-revamps/dimascore.ma/check-table-alignment.py`:

- Walks every visible element; flags a bounding box that exceeds its parent’s content box by more than 1px, or `document.documentElement.scrollWidth > clientWidth`.
- Ignores visually hidden elements, children of intentional `overflow-x: auto|scroll|hidden|clip` (tickers, tab strips), SVG/MathML descendants (the host is still checked), closed `<details>` content, and Next.js / typo-squad debug widgets.
- `--long-names` injects live-like long player names before measuring Stats.
- Fails the run if any offender count, `tablePastPx`, or `docOverflowPx` is above 1px. Target: 0 offenders per page, width, and language.

### Offenders after this fix (target 0)

Run: PL en/ar, LaLiga, Botola × standings + stats × 1440/1024/390/360 × light/dark × `--long-names` (64 views). After: **pass**, overlaps 0, leaks 0, column variance 0, overflowFails 0.

| Page | Width | Lang | elementOverflowCount | docOverflowPx | tablePastPx |
| --- | ---: | --- | ---: | ---: | ---: |
| pl-en | 1440, 1024, 390, 360 | en | 0 | 0 | 0 |
| pl-ar | 1440, 1024, 390, 360 | ar | 0 | 0 | 0 |
| laliga-en | 1440, 1024, 390, 360 | en | 0 | 0 | 0 |
| botola-en | 1440, 1024, 390, 360 | en | 0 | 0 | 0 |

LaLiga standings/stats are empty in the local seed (`found: false`); the general overflow walk still ran and was 0.

Before (same matrix, #74 on port 3870): 14 overflow fails — Stats document overflow on PL en / Botola at 390 (26px) and 360 (56px), PL ar at 360 (15px), plus the 2px “فارق” overflow on PL ar standings at 1440 and 1024.

JSON: `/workspace/site-revamps/dimascore.ma/stats-mobile-fix-2026-11/alignment-{before,after}.json`.

## Amal Tiznit crest

Skipped in this PR. `https://media.api-sports.io/football/teams/18753.png` returns HTTP 200, 150×150 PNG, SHA-256 `72f0bbb253ab54961cd5d66148e55aceb3e6bc9823da43e57a6e0812e5427430`. The bytes are API-Sports’ generic “image not available” camera graphic, not a missing/404 URL (so the #74 `onError` fallback does not fire). The path is team-specific and 150×150 is also used for real crests, so a URL or dimension list would be unreliable. A clean fix is a content-hash check at ingestion against that SHA-256 (store `logo_url` as null, then the existing fallback circle renders) plus a production backfill. Client-side hashing is messy (canvas CORS). No crest was invented.

## Evidence

Before/after screenshots: `/workspace/site-revamps/dimascore.ma/stats-mobile-fix-2026-11/{before,after}/` (45 each, including pl-en/pl-ar/botola/laliga Stats at 390 and 360, light and dark where captured).

## Infra

No migration, no production DB, no secrets. Deploy the app. Re-run:

```
python3 /workspace/site-revamps/dimascore.ma/check-table-alignment.py \
  --base <preview> --long-names \
  --pages pl-en,pl-ar,laliga-en,botola-en \
  --tabs standings,stats --widths 1440,1024,390,360 --themes light,dark
```

Expect `pass: true`, `elementOverflowCount: 0` for every page/width/language.
