# Season-kit catalog: Botola Pro and the top 5 leagues, 2026/27 (Nov 2026)

#67 added the season-kit fallback (home/away/third chosen by a labelled convention) but the catalog only
had Manchester City and Fulham, so every other team with no API-Football colours stayed grey. This PR
extends the catalog to the Premier League, LaLiga, Serie A, Bundesliga, Ligue 1 and Botola Pro.

**Branch base.** #67 (`match-season-kits`, 3816eb6) is not merged yet, so this branch is on top of it and the
PR diff against `main` includes #67. Merge #67 first, then this one (or retarget this PR to `main` after #67 lands).

## What changes

- `src/lib/match/season-kits/<league>.ts`: one file per league (90 teams in total, City and Fulham stay hand-curated in `season-kits.ts`).
- `src/lib/match/season-kits/coverage.ts`: the 112-team rosters (API-Football `team.id`) and `KIT_COVERAGE_GAPS`, the reason each missing or partial team is left out.
- `src/lib/match/season-kits.ts`: `SEASON_KITS` is now the hand-curated entries plus the league files. Slots and the goalkeeper set are optional (`home?`, `away?`, `third?`, `goalkeeper?`) so a team can have only the slots a source confirms. Merge with same-season API inference now fills any missing slot.
- `tests/unit/match/season-kits-catalog.test.ts`: validates every entry (hex format, number contrast at least 4.5:1, source URL present, `team.id` unique, rosters, coverage reasons) plus the fallback rules.
- No migration, no worker change, no change to `kit-colours.ts`, the navbar or the logo.

## Sourcing rules applied

1. **Source = Wikipedia kit templates for 2026–27.** Either the `{football kit}` templates in the club's 2026–27 season article, or the club article's infobox kit parameters. Each entry's `sourceUrl` is a permalink (`oldid=`) to the revision read on 2026-11-25.
2. **Season check.** An infobox kit is accepted only when its pattern file name carries the season (`_arsenal2627h`). `2526`, `21`, or a name with no season (`_kacm1`) is "not confirmed for 2026/27", so the slot is left out. Season-article templates count as 2026–27 unless the pattern says an older season. Last season's kit is never carried over.
3. **Flat primaries.** `primary` is the template's base (`body`) colour. Stripes, hoops, sleeve colours and trim in the pattern overlay are not drawn, and each entry's `notes` records the overlay file and any differing sleeve colour. A kit whose template has no base colour (the whole design is in the overlay: Juventus home, Napoli home, Lens, Leeds...) is left out, since choosing a flat colour would be a guess.
4. **Numbers.** Wikipedia has no number colour. The number is the kit's sock or shorts colour when that meets AA (4.5:1) against the primary, otherwise black/white (`#111111`/`#f5f5f5`, or pure `#000000`/`#ffffff` where the soft pair misses AA, e.g. mid red). Border equals the number.
5. **Placeholders rejected.** A template that repeats one colour for every kit (Alavés), uses another club's pattern file (Racing de Santander) or whose third/away equals the home colour is not trusted.
6. **Goalkeepers only where sourced.** Only season-article "Goalkeeper N" templates with a base colour (Arsenal, Real Madrid, Inter; City and Fulham from #67). They are mapped in listed order to home/away/third and any that match the outfield shirt are skipped. Which GK kit was worn is **not** verified. Everyone else keeps the API palette or grey.
7. **Worn kit.** Unchanged from #67: verified slot, else home/away/third-on-clash convention.

## Coverage (teams with at least one confirmed outfield slot / roster)

| League         | Teams   | Covered | Home + away | Partial | Missing | With GK | With third |
| -------------- | ------- | ------- | ----------- | ------- | ------- | ------- | ---------- |
| Premier League | 20      | 19      | 19          | 0       | 1       | 3       | 17         |
| LaLiga         | 20      | 14      | 11          | 3       | 6       | 1       | 6          |
| Serie A        | 20      | 20      | 11          | 9       | 0       | 1       | 15         |
| Bundesliga     | 18      | 18      | 16          | 2       | 0       | 0       | 13         |
| Ligue 1        | 18      | 16      | 13          | 3       | 2       | 0       | 8          |
| Botola Pro     | 16      | 3       | 2           | 1       | 13      | 0       | 0          |
| **Total**      | **112** | **90**  | **72**      | **18**  | **22**  | **5**   | **59**     |

Premier League includes Manchester City and Fulham from #67. "Partial" means only one of home/away is confirmed; the other slot stays grey.

## Team ids

All 112 ids appear in `src/lib/constants/team-names-ar.ts`; 69 of them are in the local PGlite seed `teams` table. The rosters (which teams are in each 2026/27 league) were read from the live DimaScore competition pages' standings (`/en/competition/...`) on 2026-11-25, which carry the API-Football ids (`media.api-sports.io/football/teams/<id>.png`). No id was guessed.

## Still missing, and why

**Premier League**

- Leeds (63), missing: home, away, third: pattern-only kit: the Wikipedia template carries no base colour, so a flat primary would be a guess

**LaLiga**

- Racing Santander (4665), missing: home, away: the infobox kit uses another club's pattern file, so it is not trusted; third: not confirmed for 2026/27: the only source is a club infobox whose kit pattern file is not a 2026–27 one (none)
- Alaves (542), missing: home, away, third: the template repeats one colour across kits (placeholder), so it is not trusted
- Espanyol (540), missing: home, away, third: pattern-only kit: the Wikipedia template carries no base colour, so a flat primary would be a guess
- Deportivo La Coruna (544), missing: home, away, third: pattern-only kit: the Wikipedia template carries no base colour, so a flat primary would be a guess
- Osasuna (727), missing: home, away, third: pattern-only kit: the Wikipedia template carries no base colour, so a flat primary would be a guess
- Celta Vigo (538), missing: home, away, third: pattern-only kit: the Wikipedia template carries no base colour, so a flat primary would be a guess
- Levante (539), partial: away: pattern-only kit: the Wikipedia template carries no base colour, so a flat primary would be a guess
- Elche (797), partial: home: pattern-only kit: the Wikipedia template carries no base colour, so a flat primary would be a guess
- Malaga (535), partial: away: pattern-only kit: the Wikipedia template carries no base colour, so a flat primary would be a guess

**Serie A**

- AC Milan (489), partial: away: pattern-only kit: the Wikipedia template carries no base colour, so a flat primary would be a guess
- Como (895), partial: away: pattern-only kit: the Wikipedia template carries no base colour, so a flat primary would be a guess
- Juventus (496), partial: home: pattern-only kit: the Wikipedia template carries no base colour, so a flat primary would be a guess
- Napoli (492), partial: home: pattern-only kit: the Wikipedia template carries no base colour, so a flat primary would be a guess
- Genoa (495), partial: away: pattern-only kit: the Wikipedia template carries no base colour, so a flat primary would be a guess
- Atalanta (499), partial: home: pattern-only kit: the Wikipedia template carries no base colour, so a flat primary would be a guess
- Torino (503), partial: away: pattern-only kit: the Wikipedia template carries no base colour, so a flat primary would be a guess
- Sassuolo (488), partial: away: pattern-only kit: the Wikipedia template carries no base colour, so a flat primary would be a guess
- Udinese (494), partial: home: pattern-only kit: the Wikipedia template carries no base colour, so a flat primary would be a guess

**Bundesliga**

- SC Freiburg (160), partial: away: pattern-only kit: the Wikipedia template carries no base colour, so a flat primary would be a guess
- FC Schalke 04 (174), partial: away: pattern-only kit: the Wikipedia template carries no base colour, so a flat primary would be a guess

**Ligue 1**

- Stade Brestois 29 (106), partial: away: pattern-only kit: the Wikipedia template carries no base colour, so a flat primary would be a guess
- Lorient (97), partial: home: pattern-only kit: the Wikipedia template carries no base colour, so a flat primary would be a guess
- Lens (116), missing: home, away, third: pattern-only kit: the Wikipedia template carries no base colour, so a flat primary would be a guess
- Estac Troyes (110), missing: home, third: not confirmed for 2026/27: the only source is a club infobox whose kit pattern file is not a 2026–27 one (\_troyes2526h, \_troyes2526t); away: pattern-only kit: the Wikipedia template carries no base colour, so a flat primary would be a guess
- Auxerre (108), partial: away: pattern-only kit: the Wikipedia template carries no base colour, so a flat primary would be a guess

**Botola Pro**

- Kawkab Marrakech (971), missing: home, away, third: not confirmed for 2026/27: the only source is a club infobox whose kit pattern file is not a 2026–27 one (\_kacm1, \_kacm2, \_kacm3)
- CODM Meknès (22218), missing: home, away, third: not confirmed for 2026/27: the only source is a club infobox whose kit pattern file is not a 2026–27 one (\_codm1, \_codm2, \_codm3)
- Raja Casablanca (976), missing: home, away, third: not confirmed for 2026/27: the only source is a club infobox whose kit pattern file is not a 2026–27 one (\_RajaCasablanca2526h, \_RajaCasablanca2526a, none)
- Maghreb Fès (3453), missing: home, away, third: not confirmed for 2026/27: the only source is a club infobox whose kit pattern file is not a 2026–27 one (\_aek1516h, \_nike_white, \_Nike_black_transparent)
- Ittihad Tanger (974), partial: home: the season article kit has no base colour or an older-season pattern; home: not confirmed for 2026/27: the only source is a club infobox whose kit pattern file is not a 2026–27 one (\_bluestripes)
- Hassania Agadir (973), missing: home, away, third: not confirmed for 2026/27: the only source is a club infobox whose kit pattern file is not a 2026–27 one (\_husa1, \_husa2, \_husa3)
- Renaissance Berkane (962), missing: home, away, third: not confirmed for 2026/27: the only source is a club infobox whose kit pattern file is not a 2026–27 one (\_rsberkane21h, \_rsberkane21a, \_rsberkane21t)
- FUS Rabat (977), missing: home, away, third: not confirmed for 2026/27: the only source is a club infobox whose kit pattern file is not a 2026–27 one (\_fus1, \_fus2, \_fus3)
- Difaa EL Jadida (964), missing: home, away, third: not confirmed for 2026/27: the only source is a club infobox whose kit pattern file is not a 2026–27 one (\_dhj1, \_dhj2, \_dhj3)
- UTS Rabat (14806), missing: home, away, third: no kit at all in the Wikipedia club infobox (and no 2026–27 season article with a kit section)
- Amal Tiznit (18753), missing: home, away, third: no kit at all in the Wikipedia club infobox (and no 2026–27 season article with a kit section)
- Widad Témara (3458), missing: home, away: not confirmed for 2026/27: the only source is a club infobox whose kit pattern file is not a 2026–27 one (\_redstripes2, none); third: no kit at all in the Wikipedia club infobox (and no 2026–27 season article with a kit section)
- Moghreb Tetouan (965), missing: home, away, third: not confirmed for 2026/27: the only source is a club infobox whose kit pattern file is not a 2026–27 one (\_mat1, \_mat2, \_mat3)
- CR Khemis Zemamra (3449), missing: home, away, third: no kit at all in the Wikipedia club infobox (and no 2026–27 season article with a kit section)

Botola Pro sources are thin: only Wydad AC and FAR Rabat have a 2026–27 pattern file in their Wikipedia infobox, and IR Tanger's season article has an away colour only. Raja, Berkane and others have 2026/27 kits described in press pages (Football Kit Archive and Footy Headlines list them) but those give names ("emerald green") and images, not hex values, and Football Kit Archive blocks automated fetches, so they were not used. Adding a Botola club later is a one-entry change in `botola-pro.ts` with a citation.

## What Infra Desk must run

No migration, no new worker. After merging #67 and then this PR:

1. Deploy the app. Match pages apply the season fallback at read time for any stored `null`/`neutral` row, so the display updates for newly covered teams without a data step.
2. (Read-only) count what moves: `pnpm tsx scripts/dry-run-season-kit-fallback.ts --days 14` and `--all`.
3. Persist it: `pnpm tsx scripts/backfill-fixture-kit-colours.ts --days 14` (the backfill refreshes any role that is still `neutral`; use the same window as the #63 backfill).

Local estimate only, from the PGlite seed (232 stored line-up rows, all grey/null there): #67's catalog would move 14, this PR moves **139**, 93 stay grey (no catalog entry for that team/season). These are not production numbers. Production counts need the dry-run above.

## Evidence

`/workspace/site-revamps/dimascore.ma/season-kits-catalog-2026-11/{before,after}/` (copies in `shots/`). Before = #67 (3816eb6), after = this branch, same local data with stored colours cleared (as if API-Football had none):

- Premier League, Arsenal v Chelsea (real seeded fixture 1557387): 1440 and 390, en and ar.
- Botola Pro, Wydad AC v FAR Rabat (local-only fixture 9100002, line-ups cloned from their real Botola fixtures): 1440 and 390, en and ar.
- LaLiga, Real Madrid v PSV (fixture 1635715, colours cleared): 1440 and 390, en. PSV is not in the catalog, so it stays grey on purpose.

Goalkeepers are grey where no GK kit is sourced (Chelsea, Wydad, FAR, PSV).

## Limits

- Wikipedia kit templates are editor-approximated hex values, and they disagree between season article and infobox in places (e.g. Barcelona 14266e vs 05003b). The season article wins when both exist.
- A flat base colour is not the visual identity of a striped or hooped kit (Barcelona's navy base, Alavés...). That is the "no patterns drawn" rule, not a claim about the real shirt.
- The catalog wins over same-season API inference in `mergeSeasonKits` (unchanged from #67). If API-verified colours for a team exist on other fixtures, preferring those would be more accurate; left as is to keep this PR to data.
- The league files were generated from `research/` (Python, network access to Wikipedia): `parse.py`/`club.py`/`gen.py`/`emit.py` in this folder reproduce the files; they are not part of the build.
