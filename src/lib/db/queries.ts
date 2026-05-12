import { eq, and } from 'drizzle-orm';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

export async function getCurrentSeasons(db: NeonHttpDatabase<typeof schema>): Promise<
  {
    competitionId: number;
    year: number;
    isWomen: boolean;
    hasStandingsCoverage: boolean;
  }[]
> {
  const rows = await db
    .select({
      competitionId: schema.seasons.competitionId,
      year: schema.seasons.year,
      isWomen: schema.competitions.isWomen,
      hasStandingsCoverage: schema.leagueCoverage.standings,
    })
    .from(schema.seasons)
    .innerJoin(schema.competitions, eq(schema.seasons.competitionId, schema.competitions.id))
    .leftJoin(
      schema.leagueCoverage,
      and(
        eq(schema.leagueCoverage.leagueId, schema.seasons.competitionId),
        eq(schema.leagueCoverage.season, schema.seasons.year),
      ),
    )
    .where(eq(schema.seasons.isCurrent, true));

  return rows.map((r) => ({
    competitionId: r.competitionId,
    year: r.year,
    isWomen: r.isWomen ?? false,
    hasStandingsCoverage: r.hasStandingsCoverage ?? false,
  }));
}
