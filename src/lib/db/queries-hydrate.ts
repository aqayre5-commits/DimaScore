/**
 * Shared batch hydration helpers for fixtures.
 * Extracted so multiple query modules can reuse without duplication.
 */
import { inArray } from 'drizzle-orm';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import type { FixtureWithTeams } from './queries';

export type TeamSnapshot = {
  id: number;
  slug: string;
  name: Record<string, string>;
  shortName: Record<string, string>;
  code: string | null;
  countryCode: string | null;
  logoUrl: string | null;
  isNational: boolean | null;
};

export type VenueSnapshot = {
  id: number;
  name: string | null;
  city: string | null;
};

/**
 * Hydrate an array of raw fixture rows with team + venue data in batch.
 * Collects all distinct team IDs and venue IDs, runs ONE team query and
 * ONE venue query, then assembles in memory. Total: fixtures query + 2.
 */
export async function hydrateFixtures(
  db: NeonHttpDatabase<typeof schema>,
  fixtures: (typeof schema.fixtures.$inferSelect)[],
): Promise<FixtureWithTeams[]> {
  if (fixtures.length === 0) return [];

  const teamIdSet = new Set<number>();
  const venueIdSet = new Set<number>();
  for (const f of fixtures) {
    if (f.homeTeamId != null) teamIdSet.add(f.homeTeamId);
    if (f.awayTeamId != null) teamIdSet.add(f.awayTeamId);
    if (f.venueId != null) venueIdSet.add(f.venueId);
  }

  const [teamsMap, venuesMap] = await Promise.all([
    getTeamsMap(db, [...teamIdSet]),
    getVenuesMap(db, [...venueIdSet]),
  ]);

  return fixtures.map((f) => ({
    id: f.id,
    round: f.round,
    roundNumber: f.roundNumber,
    kickoffAt: f.kickoffAt,
    statusCode: f.statusCode,
    homeTeamId: f.homeTeamId,
    awayTeamId: f.awayTeamId,
    homeScore: f.homeScore,
    awayScore: f.awayScore,
    homeScoreHt: f.homeScoreHt,
    awayScoreHt: f.awayScoreHt,
    homeScorePen: f.homeScorePen,
    awayScorePen: f.awayScorePen,
    venueId: f.venueId,
    homeTeam: f.homeTeamId ? (teamsMap.get(f.homeTeamId) ?? null) : null,
    awayTeam: f.awayTeamId ? (teamsMap.get(f.awayTeamId) ?? null) : null,
    venue: f.venueId ? (venuesMap.get(f.venueId) ?? null) : null,
  }));
}

export async function getTeamsMap(
  db: NeonHttpDatabase<typeof schema>,
  teamIds: number[],
): Promise<Map<number, TeamSnapshot>> {
  if (teamIds.length === 0) return new Map();

  const teams = await db
    .select({
      id: schema.teams.id,
      slug: schema.teams.slug,
      name: schema.teams.name,
      shortName: schema.teams.shortName,
      code: schema.teams.code,
      countryCode: schema.teams.countryCode,
      logoUrl: schema.teams.logoUrl,
      isNational: schema.teams.isNational,
    })
    .from(schema.teams)
    .where(inArray(schema.teams.id, teamIds));

  const map = new Map<number, TeamSnapshot>();
  for (const t of teams) map.set(t.id, t);
  return map;
}

export async function getVenuesMap(
  db: NeonHttpDatabase<typeof schema>,
  venueIds: number[],
): Promise<Map<number, VenueSnapshot>> {
  if (venueIds.length === 0) return new Map();

  const venues = await db
    .select({
      id: schema.venues.id,
      name: schema.venues.name,
      city: schema.venues.city,
    })
    .from(schema.venues)
    .where(inArray(schema.venues.id, venueIds));

  const map = new Map<number, VenueSnapshot>();
  for (const v of venues) map.set(v.id, v);
  return map;
}

/** Convenience wrapper accepting a Set (used by right-rail, homepage). */
export async function hydrateTeams(
  db: NeonHttpDatabase<typeof schema>,
  teamIds: Set<number>,
): Promise<Map<number, TeamSnapshot>> {
  return getTeamsMap(db, [...teamIds]);
}
