# Standings + Stats table fix (2026-11-25)

Pre-merge alignment check (`/workspace/site-revamps/dimascore.ma/check-table-alignment.py`) on PL (en/ar), LaLiga, Botola at 1440 / 1024 / 390 / 360 × light / dark:

- Overlaps: 0
- Caption / sr-only leak: 0
- Column x-alignment variance: 0px (visible rows)
- First column (`#`): center; numeric columns: end, `tabular-nums`, LTR
- Empty LaLiga tables (sparse local seed) reported as not found / empty — expected

## Stats reference vs after (CSS px, 1440 light)

| Token | Reference | After |
| --- | --- | --- |
| Thead height | 31 | 31 |
| Body row height | 40 | 43 |
| Cell padding (after) | — | 9px 4px |
| `#` column | centered, compact | center, 40px |
| Value column | right, tabular | end, tabular-nums |
| Even-row zebra | `#f5f5f5` | `rgb(245, 245, 245)` |
| Sub-tab underline | ~3px (ref crop) | 4px `var(--green)` (match-page tab token) |
| Main tab underline | ~5px (ref crop) | 4px `var(--green)` (match-page token) |
| Identity crest–title gap | (visual, no flag in ref) | 16px; country flag kept |
| Title / byline | — | 30.96px / 15px |

Side-by-side: `/workspace/site-revamps/dimascore.ma/standings-fix-2026-11/stats-compare/stats-ref-vs-after-1440.png`

## Data notes

- `player_season_stats` has no clean-sheet field and no `updatedAt`. Clean sheets sub-tab is always shown with an empty state. “Through \<date\>” is the last finished fixture kickoff (`FT`/`AET`/`PEN`/`WO`/`AWD`) in Africa/Casablanca. “\<N\> players” is `COUNT(DISTINCT player_id)` in `player_season_stats`, or distinct event players when that count is 0.
- Full names: `firstname` + `lastname`, then a non-abbreviated `players.name` jsonb value, then the stats-feed name. In the local seed, all 121 PL season-stat rows have null `firstname`/`lastname`; 74 names are abbreviated only (`E. Haaland`). Those are shown as stored — not invented.
- Amal Tiznit: `logo_url` is present (`…/teams/18753.png`, HTTP 200) but the asset is API-Sports’ generic “image not available” camera graphic. 404 / missing URLs use a neutral `.mark.fallback` circle. No crest was invented.
