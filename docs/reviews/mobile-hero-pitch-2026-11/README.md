# Mobile hero alignment + full-width pitch (Nov 2026)

English-only evidence (Abdilahi, 25 Nov 01:04). CSS stays logical so RTL does
not break; no ar/fr review shots.

## 1. Hero card (≤767px)

Desktop `align-self: start` on the crest and name was winning over the mobile
`align-items: center` rule, so names sat at the start of each column while
scorers stayed centred, and both crests were pinned to the left of their
column (asymmetric).

Fix, mobile only:

- Each side is a centred column: crest, name, scorers, all on the same mid
  axis. Columns are equal `minmax(0, 1fr)` either side of a centred
  score/status column.
- A 3-row **subgrid** keeps crests, names and scorer lists on shared rows
  when one name wraps (e.g. “PSV Eindhoven” at 360px).
- Spacing tokens: `--hero-stack-gap: 6px` (crest→name, name→scorers) and
  `--hero-score-gap: 8px` (gutter between columns, and padding between the
  scoreline and the date row).
- “Full-time” + score sit in the crest band (`min-height: var(--hero-crest)`,
  64px; was `crest + 4px + 20px` = 88px). Crest size is unchanged (64px, 56px
  below 360px).
- Long names wrap inside the column (`width: 100%`, `text-align: center`).
- Empty scorer lists are `display: none` so a 0-scorer side does not leave a
  stray gap.

Desktop (768+) is untouched. A 1440px screenshot pair is pixel-identical.

## 2. Pitch width (≤767px)

The pitch was `min(100%, clamp(380px, 58svh, 464px) * 68 / 105)`, so at 390px
it was 300.5px inside a 362px card (~31px empty margin each side).

Fix, mobile only:

- Pitch `width: 100%`, `aspect-ratio: 68 / 105` kept, wrap padding 0. At 390px
  the pitch is 360px in a 362px card (1px border inset). At 360px: 330px in a
  332px card.
- Shirts and labels still scale with `#59` container queries (`14.6cqw`). The
  mobile shirt cap is 54px (was 47px) so they grow with the wider pitch:
  43.9→52.5px at 390, 42.8→48.2px at 360.
- Card head and bench use the full card width (they had been capped to the
  old narrow field width).

Desktop pitch (344.8px, 10px wrap padding, 50px shirts at 1440) is unchanged
(0 pixel delta).

## Screenshots

Full set under `/workspace/site-revamps/dimascore.ma/mobile-hero-pitch-2026-11/{before,after}/`.
Copies in `shots/`.

- Hero 390 before/after: `shots/before-hero-en-m390.png`, `shots/after-hero-en-m390.png`
- Hero 360 (name wrap): `shots/after-hero-en-m360.png`
- Line-ups 390 before/after: `shots/before-lineups-en-m390.png`, `shots/after-lineups-en-m390.png`
- Desktop 1440 no-change check: `shots/before-hero-en-d1440.png` / `after-hero-en-d1440.png` and the line-ups pair (0 px difference)
