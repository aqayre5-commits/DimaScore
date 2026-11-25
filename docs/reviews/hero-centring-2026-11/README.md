# Match hero: equal padding and a centred score

Abdilahi (via Chief of Staff): on desktop the hero score block sat off-centre to the right — a large gap left of the home crest, the away crest tight to the right edge (Liverpool 4–0 Manchester United).

## Changes

Desktop only (the ≤767px PR #64 stack is untouched: centred columns, 12px scorers, `.mc-round` hidden). Header, footer, and scorer lines are unchanged.

- `.mc-scoreline` stays `minmax(0, 1fr) auto minmax(0, 1fr)` so the score is geometrically centred. Horizontal inset is now `padding-inline: 0`; equal small padding comes from the card itself.
- Each side fills its column: home `auto minmax(0, 1fr)` packed to the start, away `minmax(0, 1fr) auto` packed to the end. Long names wrap inside the column and cannot shift the score.
- `cardtop` / navbar / logo are unchanged. Local seed fixtures used for evidence were not committed.

## Gap measurements (board border → crest, px)

Liverpool–United (`9000002`, local seed). Score offset from the board midpoint was 0 before and after; the off-centre look was the unequal crest gaps.

| Width | Before left / right (Δ) | After left / right (Δ) |
|---|---|---|
| 1440 en | 128.9 / 63.0 (**+65.9**) | **22.6 / 22.6 (0)** |
| 1024 en | 78.5 / 40.5 (**+38.0**) | **16.4 / 16.4 (0)** |
| 390 en | 44.1 / 44.2 (−0.1) | 44.1 / 44.2 (−0.1) unchanged |
| 1440 ar | 133.5 / 98.8 (**+34.7**) | **22.6 / 22.6 (0)** |
| 1024 ar | 78.5 / 67.1 (**+11.4**) | **16.4 / 16.4 (0)** |
| 390 ar | 44.1 / 44.2 (−0.1) | 44.1 / 44.2 (−0.1) unchanged |

Gladbach–United (`9000003`) after is also 22.6 / 22.6 at 1440 and 16.4 / 16.4 at 1024 (en and ar). “Borussia Mönchengladbach” and `نادي بوروسيا مونشنغلادباخ لكرة القدم` wrap to two lines; the score does not move.

CLS ≤ 0.0008. Name and score contrast 18.45:1 (AA).

## Shots

Primary (Liverpool–United): `shots/{before,after}-liv-{en,ar}-{d1440,d1024,m390}.png`. Long names: `shots/{before,after}-glad-{en,ar}-{d1440,d1024}.png`. Dark check: `shots/{before,after}-liv-en-d1440-dark.png`.
