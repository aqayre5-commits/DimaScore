import { describe, expect, it } from 'vitest';
import {
  buildCupRounds,
  defaultCupRound,
  fixtureLegLabel,
  canonicalUefaRound,
  isQualifyingRound,
  leaguePhaseMatchday,
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

describe('UEFA league-phase cups', () => {
  it('orders qualifying, league-phase matchdays, then knockout rounds', () => {
    const rounds = buildCupRounds(2, 2026, [
      fx(1, 'Final', 1, 2, '2027-06-05T19:00:00Z'),
      fx(2, 'Round of 16', 1, 3, '2027-03-09T20:00:00Z'),
      fx(3, 'Knockout Round Play-offs', 4, 5, '2027-02-16T20:00:00Z'),
      fx(4, 'Knockout Round Play-offs', 5, 4, '2027-02-24T20:00:00Z'),
      fx(5, 'League Stage - 2', 6, 7, '2026-10-01T19:00:00Z'),
      fx(6, 'League Stage - 1', 7, 8, '2026-09-16T19:00:00Z'),
      fx(7, 'Play-offs', 9, 10, '2026-08-19T19:00:00Z'),
      fx(8, '3rd Qualifying Round', 9, 11, '2026-08-05T19:00:00Z'),
      fx(9, '1st Qualifying Round', 12, 13, '2026-07-08T19:00:00Z'),
    ]);
    expect(rounds.map((r) => r.slug)).toEqual([
      '1st-qualifying-round',
      '3rd-qualifying-round',
      'play-offs',
      'league-stage-1',
      'league-stage-2',
      'knockout-play-offs',
      'round-of-16',
      'final',
    ]);
    const po = rounds.find((r) => r.slug === 'knockout-play-offs')!;
    expect(po.twoLegged).toBe(true);
    expect(po.ties).toHaveLength(1);
  });

  it('reads the matchday from a league-phase round label', () => {
    expect(leaguePhaseMatchday('League Stage - 5')).toBe(5);
    expect(leaguePhaseMatchday('Round of 16')).toBeNull();
    expect(isQualifyingRound('2nd Qualifying Round')).toBe(true);
    expect(isQualifyingRound('Semi-finals')).toBe(false);
  });
});

describe('knockout play-offs naming', () => {
  it('names the 2025/26 "Round of 32" and the older "Knockout Round Play-offs" the same stage', () => {
    for (const label of ['Round of 32', 'Knockout Round Play-offs', 'Knockout Play-offs']) {
      expect(canonicalUefaRound(label)).toBe('Knockout play-offs');
    }
    expect(canonicalUefaRound('Round of 16')).toBe('Round of 16');
  });

  it.each([2, 3, 848])('competition %i: Round of 32 is the two-leg knockout play-offs', (id) => {
    const rounds = buildCupRounds(id, 2025, [
      fx(1, 'Round of 32', 4, 5, '2026-02-17T20:00:00Z', [1, 0]),
      fx(2, 'Round of 32', 5, 4, '2026-02-24T20:00:00Z', [2, 2]),
      fx(3, 'Round of 16', 1, 4, '2026-03-10T20:00:00Z', [1, 1]),
    ]);
    expect(rounds.map((r) => r.slug)).toEqual(['knockout-play-offs', 'round-of-16']);
    expect(rounds[0].label).toBe('Knockout play-offs');
    expect(rounds[0].twoLegged).toBe(true);
    expect(rounds[0].ties).toHaveLength(1);
  });

  it('keeps one round when both labels appear in the same season', () => {
    const rounds = buildCupRounds(2, 2025, [
      fx(1, 'Round of 32', 4, 5, '2026-02-17T20:00:00Z'),
      fx(2, 'Knockout Round Play-offs', 6, 7, '2026-02-18T20:00:00Z'),
    ]);
    expect(rounds).toHaveLength(1);
    expect(rounds[0].ties).toHaveLength(2);
  });

  it('leaves a domestic cup Round of 32 alone', () => {
    const rounds = buildCupRounds(45, 2025, [fx(1, 'Round of 32', 4, 5, '2026-02-17T20:00:00Z')]);
    expect(rounds[0].slug).toBe('round-of-32');
  });
});
