import { describe, expect, it } from 'vitest';
import {
  BRACKET_ROUND_SLUGS,
  bracketSizes,
  isBracketRound,
  layoutBracket,
  layoutRounds,
  uefaBracketRounds,
  KNOCKOUT_SLUG,
} from '@/lib/competitions/bracket';
import { buildCupRounds, type CupRound, type CupTie } from '@/lib/competitions/domestic-ties';
import type { FixtureWithTeams } from '@/lib/db/queries';

let n = 0;
function tie(round: string, a: number, b: number, day: number): CupTie {
  const f = (h: number, aw: number, d: number) =>
    ({
      id: ++n,
      homeTeamId: h,
      awayTeamId: aw,
      kickoffAt: new Date(Date.UTC(2026, 2, d)),
      statusCode: 'FT',
    }) as unknown as FixtureWithTeams;
  return {
    key: `${round}-${a}-${b}`,
    round,
    roundSlug: round,
    twoLegged: true,
    fixtures: [f(a, b, day), f(b, a, day + 7)],
    homeTeamId: a,
    awayTeamId: b,
  };
}

function round(slug: string, ties: CupTie[]): CupRound {
  return {
    label: slug,
    slug,
    earlier: false,
    twoLegged: slug !== 'final',
    ties,
    fixtures: ties.flatMap((t) => t.fixtures),
  };
}

describe('UEFA bracket layout', () => {
  it('names the five bracket rounds and a reserved knockout slug', () => {
    expect(BRACKET_ROUND_SLUGS).toEqual([
      'knockout-play-offs',
      'round-of-16',
      'quarter-finals',
      'semi-finals',
      'final',
    ]);
    expect(isBracketRound('round-of-16')).toBe(true);
    expect(isBracketRound('league-stage-3')).toBe(false);
    expect(KNOCKOUT_SLUG).toBe('knockout');
    expect(bracketSizes(8)).toEqual([8, 8, 4, 2, 1]);
  });

  it('keeps empty slots (TBD) for rounds without fixtures', () => {
    const rounds = uefaBracketRounds([], (s) => s, 8);
    expect(rounds.map((r) => r.ties.length)).toEqual([8, 8, 4, 2, 1]);
    expect(rounds.every((r) => r.ties.every((t) => t === null))).toBe(true);
    expect(rounds.map((r) => r.twoLegged)).toEqual([true, true, true, true, false]);
  });

  it('places each tie beside the next-round tie its club advances into', () => {
    // Two R16 ties (1v2, 3v4) feed one QF (1v3); fed by play-offs 2/x and 4/y.
    const r16a = tie('r16', 1, 2, 10);
    const r16b = tie('r16', 3, 4, 10);
    const qf = tie('qf', 1, 3, 20);
    const r16Shuffled = [r16b, r16a];
    const out = layoutBracket([[], r16Shuffled, [qf]], [0, 2, 1]);
    expect(out[1][0]).toBe(r16a);
    expect(out[1][1]).toBe(r16b);
    expect(out[2][0]).toBe(qf);
  });

  it('orders a full 8-4-2-1 path by the draw, not by date', () => {
    const final = tie('final', 1, 5, 30);
    const sf = [tie('sf', 1, 3, 25), tie('sf', 5, 7, 25)];
    const qf = [tie('qf', 1, 2, 20), tie('qf', 3, 4, 20), tie('qf', 5, 6, 20), tie('qf', 7, 8, 20)];
    const shuffled = [qf[3], qf[1], qf[2], qf[0]];
    const out = layoutBracket([[], [], shuffled, sf, [final]], [0, 0, 4, 2, 1]);
    expect(out[2]).toEqual([qf[0], qf[1], qf[2], qf[3]]);
  });

  it('lays out domestic rounds with their real tie counts', () => {
    const rounds = layoutRounds([
      round('quarter-finals', [tie('qf', 1, 2, 1), tie('qf', 3, 4, 1)]),
      round('final', [tie('final', 1, 3, 9)]),
    ]);
    expect(rounds.map((r) => r.ties.length)).toEqual([2, 1]);
    expect(rounds[0].ties.every(Boolean)).toBe(true);
  });
});

describe('play-off column from production labels', () => {
  const f = (id: number, round: string, h: number, a: number, day: number) =>
    ({
      id,
      round,
      kickoffAt: new Date(Date.UTC(2026, 1, day)),
      statusCode: 'FT',
      homeTeamId: h,
      awayTeamId: a,
      homeScore: 1,
      awayScore: 0,
    }) as unknown as FixtureWithTeams;

  it.each(['Round of 32', 'Knockout Round Play-offs'])('fills the play-offs from "%s"', (label) => {
    const rounds = buildCupRounds(2, 2025, [
      f(1, label, 10, 11, 17),
      f(2, label, 11, 10, 24),
      f(3, 'Round of 16', 1, 10, 80),
    ]);
    const bracket = uefaBracketRounds(rounds, (s) => s, 8);
    expect(bracket[0].slug).toBe('knockout-play-offs');
    expect(bracket[0].ties.filter(Boolean)).toHaveLength(1);
    expect(bracket[0].ties.filter((t) => t == null)).toHaveLength(7);
    // …and sits beside the Round of 16 tie its winner joins.
    expect(bracket[0].ties[0]?.homeTeamId).toBe(10);
  });
});
