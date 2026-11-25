# Season kits (2026/27)

One file per league, keyed by API-Football `team.id`. `coverage.ts` holds the rosters and, for every team or slot
left out, the reason. Rules and sources: `docs/reviews/season-kits-catalog-2026-11/README.md`.

To add or fix a team: edit its entry in the league file, cite a source in `sourceName`/`sourceUrl` (a revision
permalink for Wikipedia), store a flat primary with a number that meets 4.5:1, never draw patterns (describe them in
`notes`), then remove the team from `KIT_COVERAGE_GAPS`. `tests/unit/match/season-kits-catalog.test.ts` checks hex
format, contrast, source URL, unique ids and that every roster team is either covered or explained.
