import { describe, it, expect } from 'vitest';
import {
  mapCountryToInsert,
  mapCompetitionToInsert,
  mapSeasonToInsert,
  mapCoverageToInsert,
} from '@/lib/ingestion/reference-data';
import type { NormalizedCountry, NormalizedLeague, Coverage } from '@/lib/data/types';
import type { CompetitionMeta } from '@/lib/ingestion/types';

describe('mapCountryToInsert', () => {
  it('maps a country with code', () => {
    const country: NormalizedCountry = {
      name: 'Morocco',
      code: 'MA',
      flag: 'https://flags.io/ma.svg',
    };
    const result = mapCountryToInsert(country);
    expect(result).toEqual({
      code: 'MA',
      name: { en: 'Morocco' },
      flagUrl: 'https://flags.io/ma.svg',
    });
  });

  it('falls back to name prefix when code is null', () => {
    const country: NormalizedCountry = { name: 'World', code: null, flag: null };
    const result = mapCountryToInsert(country);
    expect(result.code).toBe('world');
  });
});

describe('mapCompetitionToInsert', () => {
  const league: NormalizedLeague = {
    id: 1,
    name: 'World Cup',
    type: 'cup',
    logo: 'https://logo.io/wc.png',
    country: { name: 'World', code: null, flag: null },
    seasons: [],
  };

  const meta: CompetitionMeta = {
    id: 1,
    slug: 'fifa-world-cup',
    tier: 1,
    isWomen: false,
    isFeatured: true,
    isMoroccoFocus: false,
    displayPriority: 1,
  };

  it('merges API data with metadata', () => {
    const result = mapCompetitionToInsert(league, meta);
    expect(result.id).toBe(1);
    expect(result.slug).toBe('fifa-world-cup');
    expect(result.name).toEqual({ en: 'World Cup' });
    expect(result.type).toBe('Cup');
    expect(result.tier).toBe(1);
    expect(result.isWomen).toBe(false);
    expect(result.isFeatured).toBe(true);
    expect(result.logoUrl).toBe('https://logo.io/wc.png');
  });

  it('generates slug from name when meta.slug is empty', () => {
    const noSlugMeta = { ...meta, slug: '' };
    const result = mapCompetitionToInsert(league, noSlugMeta);
    expect(result.slug).toBe('world-cup');
  });
});

describe('mapSeasonToInsert', () => {
  it('maps season fields', () => {
    const result = mapSeasonToInsert(1, {
      year: 2026,
      start: '2026-06-11',
      end: '2026-07-19',
      current: true,
    });
    expect(result).toEqual({
      competitionId: 1,
      year: 2026,
      startDate: '2026-06-11',
      endDate: '2026-07-19',
      isCurrent: true,
    });
  });
});

describe('mapCoverageToInsert', () => {
  it('flattens coverage object', () => {
    const coverage: Coverage = {
      fixtures: {
        events: true,
        lineups: true,
        statisticsFixtures: true,
        statisticsPlayers: true,
      },
      standings: true,
      players: true,
      topScorers: true,
      topAssists: true,
      topCards: true,
      injuries: true,
      predictions: true,
    };
    const result = mapCoverageToInsert(1, 2026, coverage);
    expect(result.leagueId).toBe(1);
    expect(result.season).toBe(2026);
    expect(result.events).toBe(true);
    expect(result.lineups).toBe(true);
    expect(result.statisticsFixtures).toBe(true);
    expect(result.statisticsPlayers).toBe(true);
    expect(result.standings).toBe(true);
    expect(result.players).toBe(true);
    expect(result.topScorers).toBe(true);
    expect(result.injuries).toBe(true);
    expect(result.predictions).toBe(true);
    expect(result.odds).toBe(false); // always false — no betting
  });
});
