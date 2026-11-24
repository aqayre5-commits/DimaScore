# Match hero alignment + larger event/stats crests — Nov 2026

Evidence for the PR that follows #61. `before-*` = `origin/main` (f3863b7 / #61), `after-*` = this branch. The 8-0 Brighton v Crystal Palace shots use a local copy of fixture 1557429 padded from 5-0 to 8 goals so the cap can be shown; Chelsea 5-1 Bournemouth (1557419) is unaltered local data.

## Hero: stable names and crests

The scoreline is top-aligned. Each team is a two-column grid: the crest is top-anchored in a fixed `--hero-crest` box; the team name sits on a shared baseline, optically centred with the crest; scorer lines grow downward immediately under the name and never move it. Checked with 0, 1, 5 and 8+ scorers per side, long names, own-goal and penalty labels, en and ar, at 1440, 1000, 390 and 360.

Scorer lists longer than 5 collapse to a quiet `+N` link (`href="#events"`, 44px target). The Events tab still lists every goal.

## Crest sizes in Overview, Events and Key stats

New `--event-crest` token (Upcoming cards keep `--coming-crest` unchanged):

| | Before | After |
|---|---|---|
| Desktop (≥1101px) | 28px | **36px** |
| Compact 768–1100 | 20px | **28px** |
| Phone (≤767px) | 21px | **28px** |

Hero crests are unchanged from #61 (107px at 1440, 74px at 1000, 64px at 390/360, 56px under 360).
