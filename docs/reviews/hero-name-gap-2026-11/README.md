# Hero: equal name-to-score gaps

Follow-up to #71. Crest edge padding was already equal, but the home name sat against its crest, so Liverpool ended far from the score while Manchester United sat much closer (CoS: ~210px vs ~95px on desktop).

## Changes

Crests stay at the outer edges (desktop) or centred in their columns (≤767px #64 stack). Names and scorers stretch in the free column and align toward the score (`text-align: end` at home, `start` at away), so both sides share the same name-to-score gap whatever the name length. Header, footer, and scorer grouping/cap are unchanged. 12px mobile scorers and the hidden `.mc-round` stay.

## Measurements (CSS px)

Gaps are board-border→crest and name ink-box→score. Score offset from the board midpoint is 0 throughout.

**Liverpool–United** (local seed `9000002`)

| Width | Edge L/R before → after (Δ) | Name-to-score L/R before → after (Δ) |
|---|---|---|
| 1440 en | 22.6 / 22.6 (0) → **22.6 / 22.6 (0)** | 234.2 / 102.6 (**+131.6**) → **43.2 / 43.2 (0)** |
| 1024 en | 16.4 / 16.4 (0) → **16.4 / 16.4 (0)** | 161.9 / 63.8 (**+98.1**) → **30.7 / 30.7 (0)** |
| 390 en | 44.1 / 44.2 (−0.1) → **44.1 / 44.2 (−0.1)** | 37.5 / 26.7 (**+10.8**) → **8.0 / 8.0 (0)** |
| 1440 ar | 22.6 / 22.6 (0) → **22.6 / 22.6 (0)** | 270.7 / 174.0 (**+96.7**) → **43.2 / 43.2 (0)** |
| 1024 ar | 16.4 / 16.4 (0) → **16.4 / 16.4 (0)** | 189.1 / 117.0 (**+72.1**) → **30.7 / 30.7 (0)** |
| 390 ar | 44.1 / 44.2 (−0.1) → **44.1 / 44.2 (−0.1)** | 48.0 / 20.2 (**+27.8**) → **8.0 / 8.0 (0)** |

**Borussia Mönchengladbach–United** (`9000003`) after is also 43.2 / 43.2 at 1440 and 30.7 / 30.7 at 1024 (en and ar). Long names wrap toward the score; the score does not move.

CLS ≤ 0.0005. Navbar and logo unchanged.

## Shots

Primary: `shots/{before,after}-liv-{en,ar}-{d1440,d1024,m390}.png`. Long names: `shots/{before,after}-glad-{en,ar}-{d1440,d1024}.png`. Dark: `shots/{before,after}-liv-en-d1440-dark.png`.
