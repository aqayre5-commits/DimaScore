# Provenance (not part of the build)

Python used on 2026-11-25 to read the Wikipedia kit templates and write `src/lib/match/season-kits/*.ts`.
`teams.json` is the 112-team roster (API-Football ids, from DimaScore's live competition pages); `revids.json` holds
the Wikipedia revision ids cited by each entry. Run order: `parse.py` (season-article kits), `club.py` (infobox kits),
`revids.py`, then `emit.py` and `emit2.py`. Paths are absolute to the evidence box; adjust before re-running.
