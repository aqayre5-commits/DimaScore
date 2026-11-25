# Competition vs match page — typography, spacing and colour discrepancies

Date: 25 November 2026 (Europe/London). Base: `origin/main` at `418c5b1` (#72 merged; #70–#71 already on main).

Values are **measured** (Playwright `getComputedStyle` / `getBoundingClientRect` on the local build of that commit, port 3850, and on the live site) or **computed** from the declared CSS (reference HTML + the shared prototype stylesheet used by the match-page template). Nothing here is invented.

Sources:

- **Match page** — local `/en/match/liverpool-manchester-united-9000002` (commit includes #70–#72). Tokens read from `.mc`.
- **Live league page** — `https://dimascore.ma/en/competition/england/premier-league`.
- **Current league page** — local `/en/competition/england/premier-league` on the same commit. Live and local league computed styles matched for every typography and colour row below (same IBM Plex / Midnight Pitch values); only fixture scores in the ticker differed, as expected.
- **Reference league page** — `ref-a.html` / `ref-b.html` + prototype CSS (`all.pretty.css` and the reference inline sheets). The HTML shells load `assets-9fcc641a38/*.css` which were not in the handed folder; typography, spacing and colour values are therefore taken from those stylesheets (same pack already ported onto the match page) and computed at 1440 CSS px and 390 CSS px.

Proposed shared values follow the match-page token system (already the prototype palette, sizes and radii) so the two templates stay consistent, without changing the navbar or logo.

Viewport notes: desktop = 1440×1600; mobile = 390×844; theme forced via `data-theme` / `atlas-theme` before paint.

## Colour tokens (light / dark)

| Token / role | Match page (measured on `.mc`) | League page, live = local (measured on `:root`) | Reference league (CSS) | Proposed shared |
| --- | --- | --- | --- | --- |
| Page / template surface | light `#fff` (`--surface`); dark `#131817` | Not used. Canvas is `--bg-canvas` `#f3f6f9` / `#0d1117`; cards `--bg-surface` `#fff` / `#161b22` | `--surface` `#fff` / `#131817` | Match / reference `--surface` |
| Field (inputs) | `#fff` / `#1b2120` | n/a (inputs use `--bg-surface`) | `--field` `#fff` / `#1b2120` | `--field` |
| Primary text (`--ink`) | `#101512` / `#f0f3f1` → `rgb(16, 21, 18)` / `rgb(240, 243, 241)` | `--text-primary` `#0f1a24` / `#f0f4f8` → `rgb(15, 26, 36)` / `rgb(240, 244, 248)` | `--ink` `#101512` / `#f0f3f1` | `--ink` (match) |
| Secondary text (`--muted`) | `#52605b` / `#afbab5` | `--text-secondary` `#3d4f5f` / `#a8b8c8`; tertiary `#5a6676` / `#8b96a9` | `--muted` `#52605b` / `#afbab5` | `--muted` (match) |
| Accent / current tab | `--green` `#006b47` / `#71dbab` → `rgb(0, 107, 71)` / `rgb(113, 219, 171)` | `--accent-azure` `#3a56d4` / `#4361ee` (selected tab); `--accent-green` `#007a5e` / `#00d9a6` (unused on tabs) | `--green` `#006b47` / `#71dbab` | `--green` (match) |
| Hover | `#f4f8f5` / `#242f29` | Tailwind `hover:bg-bg-surface-2` `#eef3f7` / `#1e2530` | `--hover` `#f4f8f5` / `#242f29` | `--hover` |
| Line / divider | `--line` `#cdd5d2` / `#404946` | `--border-subtle` `#dce3ea` / `#2d3748` | `--line` `#cdd5d2` / `#404946` | `--line` |
| Card outline | `--border` `#a4b3ac` / `#67746d` | `--border-subtle` `#dce3ea` / `#2d3748` (and `--border-strong` `#b8c4d0` / `#4a5568`) | `--border` `#a4b3ac` / `#67746d` | `--border` |
| Chip / mint | `--mint` `#e2f4e7` / `#233d30` | Season chip `bg-accent-azure/15` (azure tint, not mint) | `--mint` `#e2f4e7` / `#233d30` | `--mint` |
| Header / rail / card bg | Template surface `#fff` / `#131817`; standings thead `#f5f5f5` / `#202625` | Header and tab card `#fff` / `#161b22`; header uses a blue gradient overlay (`via-blue-500/5` to `to-blue-500/15`) | Surface + thead `#f5f5f5` / `#202625`; no blue gradient | Match / reference surfaces; no azure gradient |
| Live score ink | `--live-ink` `#ab2037`; dark standing-live `#ff8c99` | `--score-live` `#cf2a3c` / `#ff4757` | `--live-ink` `#ab2037` (dark `#ff8c99` on standings) | Match live ink |
| Focus | `#176b51` / `#8be3ba` | `--accent-azure` ring | `#176b51` / `#8be3ba` | `--focus` |
| Page canvas (chrome, outside template) | Body remains `--bg-canvas` (IBM Plex chrome); `.mc` paints `--surface` | Body `--bg-canvas` throughout | Body `--surface` / page tokens | Leave site chrome on `--bg-canvas`; template root (`.pl` / `.mc`) uses `--surface` |

## Typography

| Role | Match page (measured) | League page, live = local (measured) | Reference league (computed from CSS) | Proposed shared |
| --- | --- | --- | --- | --- |
| Face (template) | Inter (variable `--mc-font`), Arial fallback. Arabic: Inter + IBM Plex Sans Arabic | IBM Plex Sans (`--font-sans` / `font-display`) site-wide | Inter, Arial, sans-serif (`--font`) | Inter via the existing `--mc-font` (navbar / ticker stay IBM Plex) |
| Page title / identity `h1` 1440 | `27.792px` / weight `780` / lh `31.96px` (1.15) / ls `-0.044em` (`-1.223px`); `--title-size: clamp(23px, 1.93vw, 30px)` — this is the match document title, not a competition identity heading | `30px` / `600` / lh `36px` / ls `normal`; color `--text-primary` | `clamp(25px, 2.15vw, 36px)` = **30.96px** at 1440; identity uses this, not `--title-size` | Reference identity: `clamp(25px, 2.15vw, 36px)`. Do not change the match-page title size. |
| Page title 390 | `21px` / `780` / lh `24.15px` / ls `-0.924px` (`--title-size: 21px` in the ≤767px block) | `18px` / `600` / lh `28px` / ls `normal` (`text-lg`) | `20px` / inherited weight; `.phone .pl-identity h1` | Reference `20px` on the competition identity; match title stays `21px` |
| Section heading (`--title-size` / `--ds-h2`) | Token `clamp(23px, 1.93vw, 30px)` → 27.792px at 1440; 21px at 390. `--ds-h2: 24px` (21px at 390) | Tailwind `text-lg`/`text-base`/`label-caps` (12px uppercase, ls `0.05em`, weight 600) | `--title-size` as on the match page; body `--ds-h2: 24px` | Shared `--title-size` / `--ds-h2` |
| Tabs 1440 | `17.568px` (`--row-size: clamp(16px, 1.22vw, 19px)`), weight `710` current / `580` idle, lh `1.2`, ls `normal`, padding `7px 28.8px`, min-height 44px, 4px green underline | `13px` / `600` / lh `19.5px` / ls `0.325px`, padding `12px 16px`, height `43.5px`, selected colour azure (no underline token; colour only) | Same as match: `--row-size`, weight 580 / 710, min-height 44px, padding `7px clamp(14px, 2vw, 32px)` = 7×28.8 at 1440, 4px `--green` underline | Match / reference tab type |
| Tabs 390 | `13px` / `710`, padding `5px 4px`, min-height 44px, 3px underline, flex 1 | `13px` / `600`, padding `12px 16px`, height `63px` (five tabs wrap in a `11.2px`-radius card) | `14px`, min-height 44px, padding `5px 4px`, 3px underline, flex 1 | Reference mobile tabs (`14px`, 44px, 3px) |
| Body / row text | `--row-size` 17.568px at 1440 / 15px at 390; body `16px` / lh `1.42` on `.mc` | `16px` / `400` / lh `24px` (1.5) IBM Plex | `--row-size` + body `16px` / 1.42 Inter | Match body + `--row-size` |
| Muted / meta | Match muted `#52605b` / `#afbab5` (12–14px depending on slot; e.g. `.mc-round` 14px) | `12px` / `400`, `--text-secondary` `#3d4f5f` / `#a8b8c8` (measured ticker/meta) | `--muted`, 12–13px in season / cutoff / thead | `--muted` + existing match meta sizes |
| Standings thead | `12px` / `650`, lh `15.36px`, padding `5px`, colour `#52565c` / `#afb7b5`, bg `#f5f5f5` / `#202625` | `12px` / `700`, lh `16px`, padding `8px 4px`, colour `--text-tertiary` `#5a6676` / `#8b96a9`, transparent bg | `12px` / `650`, height 31px, padding-block 5px, muted + `#f5f5f5` / `#202625` | Match / reference standings thead |
| Standings body | `15px` / lh `1.28`, team weight 620, points 750 (CSS) | `16px` body + `text-sm`/`font-medium` mix (Tailwind) | `15px` / lh `1.3`; team 620; last col 750; 14px at phone | Match / reference table type |
| Season control | n/a on the match identity (competition name + round in the hero kicker, 14px muted) | Azure tint chip or `<select>`: `12px` / `600` or `500`, height ~30px, radius `6–8px` | `.edition-menu summary`: min-height **44px**, 14px options, muted ink, radius 5px; open list radius 8px | Reference 44px season menu |
| Period / matchweek control | `.ds-period` (in prototype CSS, used on competition; min-height 44px, 15px / 13px phone, weight 580, radius 6px) | Round `<select>` height `30px`, `12px` / `500`, radius `8px`, padding `6px 24px 6px 32px` | `.ds-period`: 44px, `--ds-period-size` 15px (13px phone), radius 6px, 1px `--border` | Shared `.ds-period` (already specified for match + competition) |

## Spacing, radii, dividers, targets

| Role | Match page (measured / CSS) | League page, live = local (measured) | Reference league (CSS / spec) | Proposed shared |
| --- | --- | --- | --- | --- |
| Card radius | `--card-radius: 8px` | `11.2px` (`rounded-xl` = `calc(var(--radius) * 1.4)` with `--radius: 0.5rem`) | `8px` | `8px` |
| Card / fixture inset | `--card-inset: 16px` desktop, `12px` ≤767px | Header padding `8px`; fixture-row padding `4px 16px` (shared `FixtureRow`, all breakpoints) | 16px desktop, 12px mobile (spec and CSS) | 16 / 12 |
| Fixture gap | `--fixture-gap: 8px` | Tight stack inside date groups; no 8px outline-gap between outlined cards (rows are not individually outlined) | 8px between adjacent fixtures; each row has a continuous 1px outline | 8px + 1px `--border` outline |
| Fixture row min-height | `--fixture-clock: 64px` / 46px phone; row min-height 64 / 56 | Measured ticker/link rows 32px tall (not the centre list). Centre `FixtureRow` is a flex block with `py-2`, no 44px star column | min-height 64 / 56; 44px favourite target; clock column 64 / 46 | Reference matchrow metrics |
| Header crest | `--competition-header-size: 128px` / `84px` already declared on `.mc`, but the match hero uses a 30px (desktop) / 24px (mobile) league mark in the kicker, not the identity crest | **134.7 × 160 px** desktop (`md:max-h-[160px]`, not square); **101.0 × 120 px** mobile (`h-[120px]`) | **128 × 128** desktop, **84 × 84** mobile (spec and `--competition-header-size`) | 128 / 84, square, `object-fit: contain` |
| Header padding / height | n/a (no competition identity on the match page) | Card height 180px desktop / 138px mobile; padding 8px; crest bottom-aligned in a gradient card | Identity `padding-block: 4px 14px` (phone `6px 12px`); min-height 80 / 60 (early rule), crest 128 / 84 drives height | Reference identity; no min 180px gradient card |
| Tab list chrome | Bottom 1px `--line`, no card around the tabs, `margin-bottom: var(--section)` (12px when a panel follows) | Tabs sit in a `11.2px`-radius, 1px `--border-subtle` card, height 45.5 desktop / 65 mobile | 1px `--line` underline track, no wrapping card | Match / reference tab track |
| Hit target | `--hit: 44px` (tabs, stars, period, save) | Tabs 43.5px desktop; 63px mobile (wrapped). Season control ~30px. `FollowStar` default is a small icon (`size-3.5`) | 44px on tabs, season summary, pin, favourite, period, “View more” | 44px |
| Section / column gutter | `--section: clamp(24px, 2vw, 31px)` → 28.8px at 1440, 19px at 390; `--gutter: clamp(16px, 1.6vw, 26px)` → 23.04px / 12px | Shell gap `2.5` (10px) + `px-4` (16px) container; right rail fixed 320px | `--section` / `--gutter`; overview grid `minmax(0,1.64fr) minmax(0,1fr)` | Shared `--section` / `--gutter` / dashboard columns |
| Divider treatment | 1px `--line` inside cards; standings/ranking one outline (`8px` radius) | `1px` `--border-subtle` on cards; `w-px bg-border-subtle` inside fixture rows | One outline per fixture; one outline per standings or ranking table; day headings unbordered | Match / reference outlines |

## Contrast (AA) — measured text vs its used background

| Sample | Light | Dark | AA 4.5:1 body? |
| --- | --- | --- | --- |
| League `h1` vs canvas | 16.22 | 17.12 (vs `#0d1117`) | Yes |
| League selected tab (azure) vs canvas | 5.59 (`#3a56d4` on `#f3f6f9`) | azure `#4361ee` on `#0d1117` (tab colour measured `rgb(67, 97, 238)`) | Light passes; keep checking if azure-on-white chips are used |
| League standings thead vs canvas | 5.38 | 6.34 | Yes |
| Match `--ink` on `--surface` | `#101512` on `#fff` (template) | `#f0f3f1` on `#131817` | Yes (same pairs already used on the match page) |
| Match `--muted` on `--surface` | `#52605b` on `#fff` | `#afbab5` on `#131817` | Yes (existing match pairs) |
| Match current tab `--green` on surface | `#006b47` on `#fff` | `#71dbab` on `#131817` | Yes |

## Notes for the implementation

1. Live and local league pages agree; the gap to close is league (Midnight Pitch + IBM Plex + azure + 11.2px radii + 160/120 crests) versus the match/reference system (Inter + `--ink/--surface/--green` + 8px radii + 128/84 crests + 44px controls).
2. Shared tokens already exist inside `.mc` (including `--competition-header-size`). They will be extracted so `.pl` and `.mc` read the same custom properties. Match-page typography (hero names, score, `--title-size` on the match title) is left unchanged.
3. Proposed competition `h1` follows the **reference identity** (`clamp(25px, 2.15vw, 36px)` / `20px` phone), which is slightly larger than the match-page `--title-size`. That is a role difference (competition name vs match document title), not a token clash.
4. Navbar, wordmark and left-rail chrome stay on the site face (IBM Plex, `--bg-canvas`). Only the competition template root is brought onto the shared type/colour system.

Raw Playwright dumps: `before/measures-before.json`.
