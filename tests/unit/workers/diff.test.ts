import { describe, it, expect } from 'vitest';
import { computeDeltas, type FixtureRow } from '../../../workers/live-poller/src/diff';
import type { NormalizedFixture } from '@/lib/data/types';

function makeFixture(overrides: Partial<NormalizedFixture> & { id: number }): NormalizedFixture {
  return {
    id: overrides.id,
    referee: null,
    date: '2026-06-13T22:00:00+00:00',
    timestamp: 1781636400,
    venue: { id: null, name: null, city: null },
    status: { short: '1H', long: 'First Half', elapsed: 25, ...overrides.status },
    league: { id: 1, name: 'WC', logo: null, country: null, round: 'Group C', season: 2026 },
    homeTeam: { id: 100, name: 'Brazil', logo: null, winner: null },
    awayTeam: { id: 200, name: 'Morocco', logo: null, winner: null },
    goals: { home: 0, away: 0, ...overrides.goals },
    score: {
      halftime: { home: null, away: null },
      fulltime: { home: null, away: null },
      extratime: { home: null, away: null },
      penalty: { home: null, away: null },
    },
  };
}

function makeDbRow(overrides: Partial<FixtureRow> & { id: number }): FixtureRow {
  return {
    homeScore: 0,
    awayScore: 0,
    statusCode: '1H',
    minute: 25,
    ...overrides,
  };
}

describe('computeDeltas', () => {
  it('returns delta for a new fixture not in DB', () => {
    const fixtures = [makeFixture({ id: 1 })];
    const dbMap = new Map<number, FixtureRow>();

    const deltas = computeDeltas(fixtures, dbMap);

    expect(deltas).toHaveLength(1);
    expect(deltas[0].fixtureId).toBe(1);
    expect(deltas[0].changes).toContain('new');
  });

  it('returns no delta when nothing changed', () => {
    const fixtures = [makeFixture({ id: 1 })];
    const dbMap = new Map([[1, makeDbRow({ id: 1 })]]);

    const deltas = computeDeltas(fixtures, dbMap);

    expect(deltas).toHaveLength(0);
  });

  it('detects homeScore change', () => {
    const fixtures = [makeFixture({ id: 1, goals: { home: 1, away: 0 } })];
    const dbMap = new Map([[1, makeDbRow({ id: 1, homeScore: 0, awayScore: 0 })]]);

    const deltas = computeDeltas(fixtures, dbMap);

    expect(deltas).toHaveLength(1);
    expect(deltas[0].changes).toContain('homeScore');
    expect(deltas[0].changes).not.toContain('awayScore');
  });

  it('detects awayScore change', () => {
    const fixtures = [makeFixture({ id: 1, goals: { home: 0, away: 1 } })];
    const dbMap = new Map([[1, makeDbRow({ id: 1, homeScore: 0, awayScore: 0 })]]);

    const deltas = computeDeltas(fixtures, dbMap);

    expect(deltas).toHaveLength(1);
    expect(deltas[0].changes).toContain('awayScore');
    expect(deltas[0].changes).not.toContain('homeScore');
  });

  it('detects statusCode change', () => {
    const fixtures = [
      makeFixture({
        id: 1,
        status: { short: 'HT', long: 'Half Time', elapsed: 45 },
        goals: { home: 0, away: 0 },
      }),
    ];
    const dbMap = new Map([[1, makeDbRow({ id: 1, statusCode: '1H', minute: 45 })]]);

    const deltas = computeDeltas(fixtures, dbMap);

    expect(deltas).toHaveLength(1);
    expect(deltas[0].changes).toContain('statusCode');
  });

  it('detects minute change', () => {
    const fixtures = [
      makeFixture({
        id: 1,
        status: { short: '1H', long: 'First Half', elapsed: 30 },
      }),
    ];
    const dbMap = new Map([[1, makeDbRow({ id: 1, minute: 25 })]]);

    const deltas = computeDeltas(fixtures, dbMap);

    expect(deltas).toHaveLength(1);
    expect(deltas[0].changes).toContain('minute');
  });

  it('detects multiple changes in one fixture', () => {
    const fixtures = [
      makeFixture({
        id: 1,
        status: { short: 'HT', long: 'Half Time', elapsed: 45 },
        goals: { home: 1, away: 1 },
      }),
    ];
    const dbMap = new Map([
      [1, makeDbRow({ id: 1, statusCode: '1H', minute: 44, homeScore: 1, awayScore: 0 })],
    ]);

    const deltas = computeDeltas(fixtures, dbMap);

    expect(deltas).toHaveLength(1);
    expect(deltas[0].changes).toContain('statusCode');
    expect(deltas[0].changes).toContain('minute');
    expect(deltas[0].changes).toContain('awayScore');
    expect(deltas[0].changes).not.toContain('homeScore');
  });

  it('handles mix of changed and unchanged fixtures', () => {
    const fixtures = [
      makeFixture({ id: 1 }),
      makeFixture({ id: 2, goals: { home: 2, away: 0 } }),
      makeFixture({ id: 3 }),
    ];
    const dbMap = new Map([
      [1, makeDbRow({ id: 1 })],
      [2, makeDbRow({ id: 2, homeScore: 1, awayScore: 0 })],
      [3, makeDbRow({ id: 3 })],
    ]);

    const deltas = computeDeltas(fixtures, dbMap);

    expect(deltas).toHaveLength(1);
    expect(deltas[0].fixtureId).toBe(2);
    expect(deltas[0].changes).toContain('homeScore');
  });

  it('returns empty array when no fixtures provided', () => {
    const deltas = computeDeltas([], new Map());
    expect(deltas).toHaveLength(0);
  });
});
