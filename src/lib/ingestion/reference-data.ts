import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import type { DataProvider } from '@/lib/data/provider';
import type { NormalizedCountry, NormalizedLeague } from '@/lib/data/types';
import * as schema from '@/lib/db/schema';
import type { SyncStats, CompetitionMeta } from './types';
import { slugify } from './slug';

// ─── Mappers (exported for testing) ───

export function mapCountryToInsert(c: NormalizedCountry) {
  return {
    code: c.code ?? c.name.toLowerCase().slice(0, 10),
    name: { en: c.name } as Record<string, string>,
    flagUrl: c.flag,
  };
}

export function mapCompetitionToInsert(league: NormalizedLeague, meta: CompetitionMeta) {
  return {
    id: league.id,
    slug: meta.slug || slugify(league.name),
    name: { en: league.name } as Record<string, string>,
    countryCode: league.country.code,
    type: league.type === 'league' ? 'League' : 'Cup',
    tier: meta.tier,
    isWomen: meta.isWomen,
    logoUrl: league.logo,
    isFeatured: meta.isFeatured,
    isMoroccoFocus: meta.isMoroccoFocus,
    displayPriority: meta.displayPriority,
  };
}

export function mapSeasonToInsert(
  leagueId: number,
  s: { year: number; start: string; end: string; current: boolean },
) {
  return {
    competitionId: leagueId,
    year: s.year,
    startDate: s.start,
    endDate: s.end,
    isCurrent: s.current,
  };
}

export function mapCoverageToInsert(
  leagueId: number,
  seasonYear: number,
  cov: NormalizedLeague['seasons'][number]['coverage'],
) {
  return {
    leagueId,
    season: seasonYear,
    events: cov.fixtures.events,
    lineups: cov.fixtures.lineups,
    statisticsFixtures: cov.fixtures.statisticsFixtures,
    statisticsPlayers: cov.fixtures.statisticsPlayers,
    standings: cov.standings,
    players: cov.players,
    topScorers: cov.topScorers,
    topAssists: cov.topAssists,
    topCards: cov.topCards,
    injuries: cov.injuries,
    predictions: cov.predictions,
    odds: false,
  };
}

// ─── Sync functions ───

export async function syncCountries(
  provider: DataProvider,
  db: NeonHttpDatabase<typeof schema>,
): Promise<SyncStats> {
  const countries = await provider.getCountries();
  let inserted = 0;
  let updated = 0;

  for (const c of countries) {
    if (!c.code) continue; // skip countries without a code
    const row = mapCountryToInsert(c);
    const result = await db
      .insert(schema.countries)
      .values(row)
      .onConflictDoUpdate({
        target: schema.countries.code,
        set: { name: row.name, flagUrl: row.flagUrl },
      });
    // neon-http returns NeonQueryResultHKT; count rows affected
    const affected = (result as unknown as { rowCount: number }).rowCount ?? 1;
    if (affected > 0) updated++;
    else inserted++;
  }

  return { inserted, updated };
}

export async function syncCompetitionsWithSeasons(
  provider: DataProvider,
  db: NeonHttpDatabase<typeof schema>,
  metas: CompetitionMeta[],
): Promise<{ competitions: SyncStats; seasons: SyncStats; coverage: SyncStats }> {
  const compStats: SyncStats = { inserted: 0, updated: 0 };
  const seasonStats: SyncStats = { inserted: 0, updated: 0 };
  const coverageStats: SyncStats = { inserted: 0, updated: 0 };

  for (const meta of metas) {
    const leagues = await provider.getLeagues({ id: meta.id });
    if (leagues.length === 0) continue;

    const league = leagues[0];

    // Upsert competition
    const compRow = mapCompetitionToInsert(league, meta);
    await db
      .insert(schema.competitions)
      .values(compRow)
      .onConflictDoUpdate({
        target: schema.competitions.id,
        set: {
          slug: compRow.slug,
          name: compRow.name,
          countryCode: compRow.countryCode,
          type: compRow.type,
          tier: compRow.tier,
          isWomen: compRow.isWomen,
          logoUrl: compRow.logoUrl,
          isFeatured: compRow.isFeatured,
          isMoroccoFocus: compRow.isMoroccoFocus,
          displayPriority: compRow.displayPriority,
        },
      });
    compStats.updated++;

    // Upsert seasons + coverage for each season
    for (const s of league.seasons) {
      const seasonRow = mapSeasonToInsert(league.id, s);
      await db
        .insert(schema.seasons)
        .values(seasonRow)
        .onConflictDoUpdate({
          target: [schema.seasons.competitionId, schema.seasons.year],
          set: {
            startDate: seasonRow.startDate,
            endDate: seasonRow.endDate,
            isCurrent: seasonRow.isCurrent,
          },
        });
      seasonStats.updated++;

      const covRow = mapCoverageToInsert(league.id, s.year, s.coverage);
      await db
        .insert(schema.leagueCoverage)
        .values(covRow)
        .onConflictDoUpdate({
          target: [schema.leagueCoverage.leagueId, schema.leagueCoverage.season],
          set: {
            events: covRow.events,
            lineups: covRow.lineups,
            statisticsFixtures: covRow.statisticsFixtures,
            statisticsPlayers: covRow.statisticsPlayers,
            standings: covRow.standings,
            players: covRow.players,
            topScorers: covRow.topScorers,
            topAssists: covRow.topAssists,
            topCards: covRow.topCards,
            injuries: covRow.injuries,
            predictions: covRow.predictions,
            odds: covRow.odds,
          },
        });
      coverageStats.updated++;
    }
  }

  return { competitions: compStats, seasons: seasonStats, coverage: coverageStats };
}
