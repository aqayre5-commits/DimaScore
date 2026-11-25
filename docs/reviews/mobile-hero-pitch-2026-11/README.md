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
- Desktop 1440 no-change check: the original pair (commit e39fda7) was pixel-identical. The later after shots include named full-time scorers from a fuller local seed, so they differ in text only. Desktop CSS (≥768) is unchanged.

## Follow-up: scorer names (2026-11-25 01:32 GMT / Europe/London)

Abdilahi noted the first after-hero 390 shot showed minutes only (`50′ 60′ 64′`,
PSV `32′ (P)`), with 84′ and 87′ missing.

Cause: local `fixture_events` for 1635715 had `player_id` NULL (so `nameOf`
returned nothing and the board rendered minutes only) and only the mid-match
goals. This was not CSS clipping or a #62 grouping regression. The same
minutes-only hero appeared on `origin/main` with that seed.

Local seed only (not in this PR): Valverde 50′, Bellingham 60′, Mbappé 64′ 84′,
Vinícius Júnior 87′, Perisic 32′ (P), with player ids set.

Typography: mobile `.mc .mc-team small` is **12px** (was 11px). Colour is
`--muted` `#afbab5` on the board `#131817`, contrast **8.98:1** (AA). Names
stay centred under each team and fit on one line at 390 and 360. Desktop
scorer type stays 14px.

The kicker wrap (“UEFA Champions League” / “League Stage - 5”) is already
present on the before-390 shot and is not a #64 regression, so it was left
alone.

## Follow-up: hide the mobile round label (2026-11-25 01:36 GMT / Europe/London)

Abdilahi: “remove that so champions league can take one line.” On viewports
≤767px, `.mc-round` (and its `·` separator) is `display: none`, so “UEFA
Champions League” sits on one line next to the logo and star at 390 and 360.
The span stays in the HTML. Desktop is unchanged (1440 hero/line-ups are
pixel-identical to the previous after shots).

The round label does not feed JSON-LD (`buildSportsEventMatch` has no round
field). On the match page, the hero kicker is the only visible place for it;
it still shows at 768px and up.
