import { NextResponse } from 'next/server';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { getDataProvider } from '@/lib/data';
import { verifyCronSecret } from '@/lib/cron/auth';
import { syncTransfersForTeam } from '@/lib/ingestion/transfers';
import { getCurrentSeasons } from '@/lib/db/queries';
import * as schema from '@/lib/db/schema';

/**
 * Weekly club-transfer sync. Restricted to teams in current *League*
 * competitions (not cup participants) to keep quota near ~128 clubs.
 *
 * Infra: register this route on a weekly schedule. Not in vercel.json.
 */
export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const provider = getDataProvider();
    const currentSeasons = await getCurrentSeasons(db);
    if (currentSeasons.length === 0) {
      return NextResponse.json({ ok: true, synced: 0, results: [] });
    }

    const leagueRows = await db
      .select({ id: schema.competitions.id })
      .from(schema.competitions)
      .where(
        and(
          inArray(
            schema.competitions.id,
            currentSeasons.map((s) => s.competitionId),
          ),
          eq(schema.competitions.type, 'League'),
        ),
      );
    const leagueIds = new Set(leagueRows.map((r) => r.id));
    const seasons = currentSeasons.filter((s) => leagueIds.has(s.competitionId));

    const teamIdRows =
      seasons.length === 0
        ? []
        : await db
            .selectDistinct({ teamId: schema.standings.teamId })
            .from(schema.standings)
            .innerJoin(schema.teams, eq(schema.standings.teamId, schema.teams.id))
            .where(
              and(
                inArray(
                  schema.standings.competitionId,
                  seasons.map((s) => s.competitionId),
                ),
                inArray(
                  schema.standings.seasonYear,
                  [...new Set(seasons.map((s) => s.year))],
                ),
                eq(schema.teams.isNational, false),
              ),
            );

    const teamIds = [...new Set(teamIdRows.map((r) => r.teamId).filter((id): id is number => id != null))];

    const results: { teamId: number; inserted: number; error?: string }[] = [];
    for (const teamId of teamIds) {
      try {
        const stats = await syncTransfersForTeam(provider, db, teamId);
        results.push({ teamId, inserted: stats.inserted });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Cron transfers: team ${teamId} failed:`, error);
        results.push({ teamId, inserted: 0, error: message });
      }
    }

    return NextResponse.json({
      ok: true,
      synced: results.filter((r) => !r.error).length,
      failed: results.filter((r) => r.error).length,
      results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Cron transfers failed:', error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
