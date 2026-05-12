import { describe, it, expect } from 'vitest';
import { mapStandingToInsert } from '@/lib/ingestion/standings';
import type { NormalizedStandingEntry } from '@/lib/data/types';

function makeEntry(overrides: Partial<NormalizedStandingEntry> = {}): NormalizedStandingEntry {
  return {
    rank: 1,
    team: { id: 31, name: 'Morocco', logo: null },
    points: 9,
    goalsDiff: 5,
    group: 'Group C',
    description: 'Qualified for Round of 16',
    form: 'WWW',
    all: { played: 3, win: 3, draw: 0, lose: 0, goalsFor: 7, goalsAgainst: 2 },
    home: { played: 1, win: 1, draw: 0, lose: 0, goalsFor: 3, goalsAgainst: 1 },
    away: { played: 2, win: 2, draw: 0, lose: 0, goalsFor: 4, goalsAgainst: 1 },
    ...overrides,
  };
}

describe('mapStandingToInsert', () => {
  it('maps all fields', () => {
    const result = mapStandingToInsert(makeEntry(), 1, 2026);
    expect(result.competitionId).toBe(1);
    expect(result.seasonYear).toBe(2026);
    expect(result.groupLabel).toBe('Group C');
    expect(result.teamId).toBe(31);
    expect(result.rank).toBe(1);
    expect(result.points).toBe(9);
    expect(result.played).toBe(3);
    expect(result.won).toBe(3);
    expect(result.drawn).toBe(0);
    expect(result.lost).toBe(0);
    expect(result.goalsFor).toBe(7);
    expect(result.goalsAgainst).toBe(2);
    expect(result.goalDiff).toBe(5);
    expect(result.form).toBe('WWW');
    expect(result.description).toBe('Qualified for Round of 16');
  });

  it('handles null form and description', () => {
    const result = mapStandingToInsert(makeEntry({ form: null, description: null }), 1, 2026);
    expect(result.form).toBeNull();
    expect(result.description).toBeNull();
  });
});
