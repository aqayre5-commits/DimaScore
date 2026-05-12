import { describe, it, expect } from 'vitest';
import { mapFixtureToInsert } from '@/lib/ingestion/fixtures';
import type { NormalizedFixture } from '@/lib/data/types';

function makeFixture(overrides: Partial<NormalizedFixture> = {}): NormalizedFixture {
  return {
    id: 1001,
    referee: 'F. Letexier',
    date: '2026-06-13T22:00:00+00:00',
    timestamp: 1781539200,
    venue: { id: 200, name: 'MetLife Stadium', city: 'East Rutherford' },
    status: { short: 'NS', long: 'Not Started', elapsed: null },
    league: {
      id: 1,
      name: 'World Cup',
      logo: null,
      country: 'World',
      round: 'Group C - 1',
      season: 2026,
    },
    homeTeam: { id: 6, name: 'Brazil', logo: null, winner: null },
    awayTeam: { id: 31, name: 'Morocco', logo: null, winner: null },
    goals: { home: null, away: null },
    score: {
      halftime: { home: null, away: null },
      fulltime: { home: null, away: null },
      extratime: { home: null, away: null },
      penalty: { home: null, away: null },
    },
    ...overrides,
  };
}

describe('mapFixtureToInsert', () => {
  it('maps a not-started fixture', () => {
    const result = mapFixtureToInsert(makeFixture());
    expect(result.id).toBe(1001);
    expect(result.competitionId).toBe(1);
    expect(result.seasonYear).toBe(2026);
    expect(result.round).toBe('Group C - 1');
    expect(result.roundNumber).toBe(1);
    expect(result.kickoffAt).toEqual(new Date('2026-06-13T22:00:00+00:00'));
    expect(result.statusCode).toBe('NS');
    expect(result.minute).toBeNull();
    expect(result.homeTeamId).toBe(6);
    expect(result.awayTeamId).toBe(31);
    expect(result.venueId).toBe(200);
    expect(result.referee).toBe('F. Letexier');
  });

  it('maps a finished fixture with scores', () => {
    const result = mapFixtureToInsert(
      makeFixture({
        status: { short: 'FT', long: 'Match Finished', elapsed: 90 },
        goals: { home: 1, away: 2 },
        score: {
          halftime: { home: 0, away: 1 },
          fulltime: { home: 1, away: 2 },
          extratime: { home: null, away: null },
          penalty: { home: null, away: null },
        },
      }),
    );
    expect(result.statusCode).toBe('FT');
    expect(result.minute).toBe(90);
    expect(result.homeScore).toBe(1);
    expect(result.awayScore).toBe(2);
    expect(result.homeScoreHt).toBe(0);
    expect(result.awayScoreHt).toBe(1);
    expect(result.homeScoreFt).toBe(1);
    expect(result.awayScoreFt).toBe(2);
    expect(result.homeScoreEt).toBeNull();
    expect(result.homeScorePen).toBeNull();
  });

  it('maps a live fixture', () => {
    const result = mapFixtureToInsert(
      makeFixture({
        status: { short: '1H', long: 'First Half', elapsed: 34 },
        goals: { home: 0, away: 0 },
      }),
    );
    expect(result.statusCode).toBe('1H');
    expect(result.minute).toBe(34);
  });

  it('parses knockout round numbers', () => {
    const result = mapFixtureToInsert(
      makeFixture({
        league: {
          id: 1,
          name: 'World Cup',
          logo: null,
          country: 'World',
          round: 'Quarter-finals',
          season: 2026,
        },
      }),
    );
    expect(result.roundNumber).toBe(34);
  });

  it('sets roundNumber null for unknown rounds', () => {
    const result = mapFixtureToInsert(
      makeFixture({
        league: {
          id: 1,
          name: 'World Cup',
          logo: null,
          country: 'World',
          round: 'Preliminary',
          season: 2026,
        },
      }),
    );
    expect(result.roundNumber).toBeNull();
  });

  it('handles null venue id', () => {
    const result = mapFixtureToInsert(
      makeFixture({ venue: { id: null, name: 'TBD', city: null } }),
    );
    expect(result.venueId).toBeNull();
  });
});
