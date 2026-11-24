# Match page fixes — Nov 2026

Evidence for the PR that follows #60 (blank match centre fix + Abdilahi's feedback). Shots are local production builds against a copy of the data; `before-*` = `origin/main` (388782c), `after-*` = this branch.

## 1. Blank match centre (useMemo errors)
Root cause: some events point at a player id that has no row in `players` (the left join returns `name = null`). `nameOf()` read `null.en`, which threw inside `useMemo(buildIncidents)` during SSR, and again on the client, so React dropped the whole match centre (no h1, no board). Fixed in `getMatchEvents` (null name → `{}`) and in `nameOf` (returns `null` for missing/non-object names → the row shows without a name). Regression test: `tests/unit/match/match-centre-partial-data.test.ts` (3 live shapes + missing events/line-ups/stats/venue/logos/table/upcoming/coverage).
- `before-blank-*`, `after-blank-*` (cup, women's, no-line-ups shapes; en + ar; 1440 + 390)

## 2. Feedback
- Row dividers (Overview, Events, Stats): 1px `--divider` (= `--light` token: #e8ecea light / #333d38 dark), one line style for feed rows, stat rows and stat-card section heads.
- Stat bars: two 6px segments with a 2px gap; leading side `--green` (site green #006b47 light / #71dbab dark), other side `--bar-rest` grey; ties = both grey.
- Crests in events rows, key moments and key stats = `--coming-crest` (Upcoming cards size): 28px desktop, 20px compact 768–1100, 21px phone.
- Hero crests: 72→112px clamp (106px at 1440, 74px at 1000), 64px on phones (was 84/81px desktop, 46px phone), 56px under 360px. `width/height=112` attributes + eager load; long names wrap inside their column (`after-hero-longname-*`).
