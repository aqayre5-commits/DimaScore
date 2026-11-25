import { describe, it, expect } from 'vitest';
import { tieKey, isSameTie, tieTeamPair } from '@/lib/competitions/tie';

describe('tieKey', () => {
  const base = { competitionId: 2, seasonYear: 2025, round: 'Semi-finals' };

  it('is stable across legs (home/away swapped)', () => {
    const first = tieKey({ ...base, homeTeamId: 85, awayTeamId: 50 });
    const second = tieKey({ ...base, homeTeamId: 50, awayTeamId: 85 });
    expect(first).toBe(second);
    expect(isSameTie({ ...base, homeTeamId: 85, awayTeamId: 50 }, { ...base, homeTeamId: 50, awayTeamId: 85 })).toBe(
      true,
    );
  });

  it('normalises Semi-finals vs Semi-Finals', () => {
    expect(tieKey({ ...base, round: 'Semi-Finals', homeTeamId: 1, awayTeamId: 2 })).toBe(
      tieKey({ ...base, round: 'Semi-finals', homeTeamId: 1, awayTeamId: 2 }),
    );
  });

  it('differs across rounds and competitions', () => {
    const a = tieKey({ ...base, homeTeamId: 1, awayTeamId: 2 });
    const b = tieKey({ ...base, round: 'Final', homeTeamId: 1, awayTeamId: 2 });
    const c = tieKey({ ...base, competitionId: 3, homeTeamId: 1, awayTeamId: 2 });
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
  });

  it('orders the pair numerically', () => {
    expect(tieTeamPair(50, 10)).toBe('10-50');
  });
});
