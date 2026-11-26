import { and, asc, gte, inArray, lt } from 'drizzle-orm';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '../schema';
import { hydrateTeams } from '../queries-hydrate';
import { isDisplayableFixture } from './homepage';
import { resolveCompetitionLogo } from '@/lib/constants/competition-logos';
import type { HomeCompetition, HomeFixture } from '@/lib/home/model';

/**
 * Every fixture from every competition (friendlies included) that kicks off in [from, to), with
 * its teams and competition. Home shows the whole day, so nothing is filtered by competition;
 * only rows the rest of the site also hides are dropped (an unresolved "TBD" team, youth sides in
 * the Friendlies feed — see isDisplayableFixture). 3 queries: fixtures + competitions, teams.
 */
export async function getHomeWindowFixtures(
  db: NeonHttpDatabase<typeof schema>,
  from: Date,
  to: Date,
): Promise<{ fixtures: HomeFixture[]; competitions: HomeCompetition[] }> {
  const rows = await db
    .select({
      id: schema.fixtures.id,
      competitionId: schema.fixtures.competitionId,
      seasonYear: schema.fixtures.seasonYear,
      round: schema.fixtures.round,
      roundNumber: schema.fixtures.roundNumber,
      kickoffAt: schema.fixtures.kickoffAt,
      statusCode: schema.fixtures.statusCode,
      minute: schema.fixtures.minute,
      homeTeamId: schema.fixtures.homeTeamId,
      awayTeamId: schema.fixtures.awayTeamId,
      homeScore: schema.fixtures.homeScore,
      awayScore: schema.fixtures.awayScore,
      homeScoreHt: schema.fixtures.homeScoreHt,
      awayScoreHt: schema.fixtures.awayScoreHt,
      homeScorePen: schema.fixtures.homeScorePen,
      awayScorePen: schema.fixtures.awayScorePen,
    })
    .from(schema.fixtures)
    .where(and(gte(schema.fixtures.kickoffAt, from), lt(schema.fixtures.kickoffAt, to)))
    .orderBy(asc(schema.fixtures.kickoffAt), asc(schema.fixtures.id));
  if (rows.length === 0) return { fixtures: [], competitions: [] };

  const teamIds = new Set<number>();
  const compIds = new Set<number>();
  for (const r of rows) {
    if (r.homeTeamId != null) teamIds.add(r.homeTeamId);
    if (r.awayTeamId != null) teamIds.add(r.awayTeamId);
    if (r.competitionId != null) compIds.add(r.competitionId);
  }
  const [teams, comps] = await Promise.all([
    hydrateTeams(db, teamIds),
    db
      .select({
        id: schema.competitions.id,
        slug: schema.competitions.slug,
        name: schema.competitions.name,
        type: schema.competitions.type,
        countryCode: schema.competitions.countryCode,
        logoUrl: schema.competitions.logoUrl,
        displayPriority: schema.competitions.displayPriority,
      })
      .from(schema.competitions)
      .where(inArray(schema.competitions.id, [...compIds])),
  ]);

  const fixtures: HomeFixture[] = [];
  for (const r of rows) {
    const competitionId = r.competitionId;
    if (competitionId == null) continue;
    const homeTeam = r.homeTeamId != null ? (teams.get(r.homeTeamId) ?? null) : null;
    const awayTeam = r.awayTeamId != null ? (teams.get(r.awayTeamId) ?? null) : null;
    if (!isDisplayableFixture({ competition: { id: competitionId }, homeTeam, awayTeam })) continue;
    fixtures.push({
      ...r,
      competitionId,
      venueId: null,
      venue: null,
      homeTeam,
      awayTeam,
    });
  }
  const competitions: HomeCompetition[] = comps.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name as Record<string, string>,
    type: c.type,
    countryCode: c.countryCode,
    logoUrl: resolveCompetitionLogo(c.id, c.logoUrl),
    displayPriority: c.displayPriority ?? 100,
  }));
  return { fixtures, competitions };
}
