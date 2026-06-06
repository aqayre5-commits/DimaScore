/**
 * Seed every WC2026 team's official 26-man squad straight from API-Football.
 *
 * The provider's squad endpoint now returns the finalized 26 per national team,
 * so this pulls them by team id — no FIFA lists, no name-matching. Authoritative
 * and idempotent: per team, fetch the squad, upsert the players (WITHOUT touching
 * currentTeamId so club links survive), then replace that team's tournament_squads
 * rows with the API's 26. A failed/empty fetch leaves the team untouched.
 *
 * Supersedes the FIFA-list + resolver + overrides path for the bulk.
 *
 * Run: pnpm tsx --env-file=.env.local scripts/seed-wc2026-squads-from-api.ts [--dry-run]
 */
import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import { getDataProvider } from '@/lib/data';
import { slugify } from '@/lib/ingestion/slug';

const DRY = process.argv.includes('--dry-run');
const COMPETITION_ID = 1; // World Cup
const SEASON_YEAR = 2026;

async function main(): Promise<void> {
  // 48 WC2026 participating teams (from standings).
  const teamRows = await db.execute(
    sql`SELECT DISTINCT s.team_id, t.name->>'en' AS name
        FROM standings s JOIN teams t ON t.id = s.team_id
        WHERE s.competition_id = ${COMPETITION_ID} AND s.season_year = ${SEASON_YEAR}
          AND s.team_id IS NOT NULL
        ORDER BY name`,
  );
  const teams = (teamRows.rows as { team_id: string; name: string }[]).map((r) => ({
    id: Number(r.team_id),
    name: r.name,
  }));
  console.log(`[wc-api] ${teams.length} WC2026 teams${DRY ? ' (dry run)' : ''}`);

  const provider = getDataProvider();
  let totalPlayers = 0;
  let totalRows = 0;
  let apiCalls = 0;
  let seededTeams = 0;

  for (const team of teams) {
    let squad;
    try {
      squad = await provider.getPlayerSquads({ team: team.id });
      apiCalls++;
    } catch (err) {
      console.error(
        `[wc-api] ${team.name} (${team.id}) fetch failed:`,
        err instanceof Error ? err.message : err,
      );
      continue;
    }
    if (!squad || squad.length === 0) {
      console.warn(`[wc-api] ${team.name} (${team.id}): empty squad, skipping`);
      continue;
    }

    console.log(`[wc-api] ${team.name} (${team.id}): ${squad.length} players`);
    totalPlayers += squad.length;
    if (DRY) continue;

    // Upsert players — do NOT touch currentTeamId (preserve club links).
    for (const p of squad) {
      const name = p.name ?? 'Unknown';
      const photoUrl = p.photo ?? `https://media.api-sports.io/football/players/${p.id}.png`;
      await db
        .insert(schema.players)
        .values({
          id: p.id,
          slug: `${slugify(name)}-${p.id}`,
          name: { en: name },
          photoUrl,
          position: p.position,
          shirtNumber: p.number,
          isWomen: false,
        })
        .onConflictDoUpdate({
          target: schema.players.id,
          set: { name: { en: name }, photoUrl, position: p.position, shirtNumber: p.number },
        });
    }

    // Replace this team's curated rows with the API's authoritative 26.
    await db
      .delete(schema.tournamentSquads)
      .where(
        and(
          eq(schema.tournamentSquads.competitionId, COMPETITION_ID),
          eq(schema.tournamentSquads.seasonYear, SEASON_YEAR),
          eq(schema.tournamentSquads.teamId, team.id),
        ),
      );
    await db
      .insert(schema.tournamentSquads)
      .values(
        squad.map((p) => ({
          competitionId: COMPETITION_ID,
          seasonYear: SEASON_YEAR,
          teamId: team.id,
          playerId: p.id,
        })),
      )
      .onConflictDoNothing();
    totalRows += squad.length;
    seededTeams++;
  }

  console.log(
    `[wc-api] done${DRY ? ' (dry run)' : ''} — ${totalPlayers} players seen, ${totalRows} squad rows across ${seededTeams} teams, ${apiCalls} API calls`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error('[wc-api] fatal:', err);
  process.exit(1);
});
