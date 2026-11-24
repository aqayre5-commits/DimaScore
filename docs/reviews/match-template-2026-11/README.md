# Match page — template implementation (Nov 2026)

Spec: `DimaScore-Match-Events-Desktop.html`, `DimaScore-Match-Events-Mobile.html`, `Match-Page-Logic.txt`, `Match-Page-Icon-Dimensions.txt`.

Screens are from a local production build (`next build && next start`) against a seeded local database, light theme,
1440 desktop and 390 mobile. `side-by-side/` puts the template render (left) next to the DimaScore build (right).

| State | Fixture | Notes |
| --- | --- | --- |
| Pre-match | 1638286 Arsenal W – Lyon W (UWCL) | tabs: Overview, Line-ups (no standings for UWCL in the seed → no Table tab) |
| Live | 1638292 Austria Wien W – Bayern Munich W (UWCL) | Overview, Events, Stats, Line-ups |
| Finished | 1557430 Everton – Chelsea (PL) | Overview, Events, Stats, Line-ups, Table |

## Defaults where the template is silent

- **Competition rail (desktop ≥768px):** Overall · Favourites · Tournament editions, then *Popular competitions*
  (8 shown, "Show N more"; the current competition always stays visible), followed competitions are pinned above
  Popular, then *Browse competitions* — a zone → country → competition tree (Morocco first, then continental, then A–Z)
  with search (opens the site search). Only competitions with fixtures within ±10 days are listed, so the rail stays
  short as coverage grows.
- **Mobile:** no rail (as in the template). The template's "PL ▾" selector in the top bar is not built because the site
  navbar is unchanged — see open question.
- **Times** are shown in Africa/Casablanca with the zone suffix (site convention).
- **Stats:** only the "Match" period chip — the provider has no per-half stats. Discipline counts come from events.
- **Table:** shown for league/group matches with standings; knockout matches have no Table tab. The live overlay adds
  in-play results to the provider table.
- **Line-ups:** predicted XIs are not shown; only confirmed line-ups (the template only shows confirmed).
- **Mobile upcoming cards** scroll horizontally at a readable width (the template's own render squeezes them).
- **JSON-LD:** SportsEvent kept; `description` and `location.address` (city) dropped because neither is visible on the
  page any more. Venue name stays (it is shown in the header).

## Kept from the site (template differs)

Site navbar/logo, live ticker, footer and mobile bottom bar are unchanged — the template's top bar (logo, search,
theme, language, "PL ▾") differs; awaiting a decision.
