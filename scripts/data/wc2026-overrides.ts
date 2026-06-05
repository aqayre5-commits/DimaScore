/**
 * Manual name -> player_id pins for WC2026 squad players the resolver can't
 * safely auto-match: name collisions (two same-initial same-surname players),
 * players absent from the national pool, or freshly ingested players.
 *
 * Keyed by dbName (teams.name->>'en'), then the exact FIFA name as written in
 * data/wc2026-squads.ts. The resolver applies these before any heuristic match.
 * Every ID here was verified by firstname/lastname against the players table.
 */
export const WC2026_OVERRIDES: Record<string, Record<string, number>> = {
  Mexico: {
    'Santiago Gimenez': 94562, // Santiago Tomás Giménez (AC Milan) — collided with "G. Gimenez"
    'Edson Alvarez': 2869, // ingested — distinct from #51068 (Efraín Álvarez)
    'Luis Chavez': 35690, // ingested — Luis Gerardo Chávez, distinct from #390002 Mateo
  },
  'Czech Republic': {
    'David Zima': 128772, // Slavia Praha — common first name "David"
    'Adam Hlozek': 66019, // Adam Hložek (Hoffenheim) — accent + not in pool
    'David Doudera': 66214, // ingested (API "Douděra")
  },
  // South Korea — Cho Wije not located (fresh call-up, absent from API season list) → backlogged
};
