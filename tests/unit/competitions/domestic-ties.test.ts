import { describe, expect, it } from 'vitest';
import {
  buildCupRounds,
  defaultCupRound,
  fixtureLegLabel,
} from '@/lib/competitions/domestic-ties';
import type { FixtureWithTeams } from '@/lib/db/queries';

function fx(
  id: number,
  round: string,
  home: number,
  away: number,
  kickoff: string,
  score?: [number, number],
): FixtureWithTeams {
  return {
    id,
    round,
    roundNumber: null,
    kickoffAt: new Date(kickoff),
    statusCode: score ? 'FT' : 'NS',
    homeTeamId: home,
    awayTeamId: away,
    homeScore: score ? score[0] : null,
    awayScore: score ? score[1] : null,
    homeScoreHt: null,
    awayScoreHt: null,
    homeScorePen: null,
    awayScorePen: null,
    venueId: null,
    homeTeam: null,
    awayTeam: null,
    venue: null,
  };
}

describe('buildCupRounds', () => {
  it('treats Copa del Rey semi-finals as two-legged ties', () => {
    const rounds = buildCupRounds(143, 2025, [
      fx(1, 'Semi-finals', 10, 20, '2025-02-25T20:00:00Z'),
      fx(2, 'Semi-finals', 20, 10, '2025-04-01T19:00:00Z'),
      fx(3, 'Final', 10, 30, '2025-04-26T19:00:00Z'),
    ]);
    const semis = rounds.find((r) => r.slug === 'semi-finals');
    expect(semis?.twoLegged).toBe(true);
    expect(semis?.ties).toHaveLength(1);
    expect(semis?.ties[0].fixtures.map((f) => f.id)).toEqual([1, 2]);
    const final = rounds.find((r) => r.slug === 'final');
    expect(final?.twoLegged).toBe(false);
  });

  it('keeps FA Cup ties as single matches', () => {
    const rounds = buildCupRounds(45, 2025, [
      fx(1, 'Semi-finals', 1, 2, '2025-04-26T16:00:00Z', [1, 0]),
    ]);
    expect(rounds[0].twoLegged).toBe(false);
    expect(rounds[0].ties[0].fixtures).toHaveLength(1);
  });

  it('groups unverified Coupe du Trône names under Earlier rounds', () => {
    const rounds = buildCupRounds(822, 2025, [
      fx(1, 'Regional 1', 1, 2, '2025-09-01T00:00:00Z'),
      fx(2, 'Quarter-finals', 1, 3, '2026-03-01T00:00:00Z'),
    ]);
    expect(rounds[0].slug).toBe('earlier-rounds');
    expect(rounds[0].fixtures).toHaveLength(1);
    expect(rounds.some((r) => r.slug === 'quarter-finals')).toBe(true);
  });

  it('picks a live or upcoming round as the default', () => {
    const now = new Date('2025-03-01T12:00:00Z');
    const rounds = buildCupRounds(143, 2025, [
      fx(1, 'Quarter-finals', 1, 2, '2025-02-06T00:00:00Z', [0, 5]),
      fx(2, 'Semi-finals', 3, 4, '2025-04-01T00:00:00Z'),
    ]);
    expect(defaultCupRound(rounds, now)?.slug).toBe('semi-finals');
  });

  it('labels a second fixture in a single-leg tie as a replay', () => {
    const rounds = buildCupRounds(45, 2025, [
      fx(1, 'Third Round', 1, 2, '2026-01-10T15:00:00Z', [1, 1]),
      fx(2, 'Third Round', 2, 1, '2026-01-21T19:45:00Z', [2, 0]),
    ]);
    const tie = rounds[0].ties[0];
    expect(fixtureLegLabel(tie, tie.fixtures[0])).toBe(null);
    expect(fixtureLegLabel(tie, tie.fixtures[1])).toBe('replay');
  });
});
