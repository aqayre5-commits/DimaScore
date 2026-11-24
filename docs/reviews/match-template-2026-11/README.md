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

## Mobile navbar competition picker (Abdilahi, 24 Nov: option a)

The navbar is otherwise unchanged (desktop untouched; mobile keeps the hamburger, logo and search). Below 768px, on
match and competition pages, a picker sits next to search (template top bar "PL ▾"):

- **Label:** the current competition's short name below 440px (PL, UCL, UWCL, Botola …; Arabic short forms in ar),
  full name from 440px (as the template). Elsewhere the picker is hidden — the hamburger drawer already lists
  competitions, and those pages have no competition context. On a competition page without a known competition it
  reads "Competitions".
- **Sheet:** a native modal dialog with the desktop rail inside (Overall, Favourites, Tournament editions, pinned,
  popular, browse tree with search) built from the same props as the rail (`rail-props.ts`). The page behind is inert
  (focus stays in the sheet), Escape/backdrop/× close it and focus returns to the button. Search closes the sheet and
  opens the site search.
- **No CLS:** fixed button width per breakpoint (96px / 128px from 380px / 192px from 440px), fixed label line box;
  the label fills in when the page registers its competition. Long names truncate with an ellipsis; the accessible
  name always carries the full name.
- **Checks:** 360/390/440 en/fr/ar — no wrapping or overlap (≥18px to the logo), 44px targets, axe clean on the
  button and the open sheet (light/dark), CLS ≤ 0.0012.

Screens: `mobile-picker/` (closed/open, en/fr/ar, 390 and 360, competition page, search from the sheet). The earlier
mobile screens in `screens/` and `side-by-side/` predate the picker.
