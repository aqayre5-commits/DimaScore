import { describe, expect, it } from 'vitest';
import { parseRoundNumber } from '@/lib/ingestion/round';
import {
  filterCupFixtures,
  listFixtureRounds,
  resolveSelectedRound,
  selectDefaultRound,
  type RoundSelectableFixture,
} from '@/lib/competitions/select-default-round';

/** BUG-015 repro clock: day before UCL League Stage MD1. */
const NOW = new Date('2026-09-07T12:00:00.000Z');

function fx(round: string, kickoffIso: string, statusCode: string): RoundSelectableFixture {
  return {
    round,
    roundNumber: parseRoundNumber(round),
    statusCode,
    kickoffAt: new Date(kickoffIso),
  };
}

/** UCL 2026/27 league-stage shape: 8 matchdays, MD1 near, MD8 in January. */
function leagueStageSeason(overrides?: {
  md1Status?: string;
  md2Status?: string;
  includeQualifying?: boolean;
}): RoundSelectableFixture[] {
  const md1 = overrides?.md1Status ?? 'NS';
  const md2 = overrides?.md2Status ?? 'NS';
  const rows: RoundSelectableFixture[] = [
    fx('League Stage - 1', '2026-09-08T19:00:00.000Z', md1), // Real Madrid–Inter 1635714
    fx('League Stage - 1', '2026-09-08T19:00:00.000Z', md1),
    fx('League Stage - 1', '2026-09-09T19:00:00.000Z', md1),
    fx('League Stage - 2', '2026-09-16T19:00:00.000Z', md2),
    fx('League Stage - 3', '2026-10-21T19:00:00.000Z', 'NS'),
    fx('League Stage - 8', '2027-01-27T20:00:00.000Z', 'NS'),
  ];
  if (overrides?.includeQualifying) {
    rows.push(fx('Play-offs', '2026-08-26T19:00:00.000Z', 'FT'));
  }
  return rows;
}

describe('selectDefaultRound — UCL league stage (BUG-015)', () => {
  it('defaults to League Stage 1 when MD1–MD8 are all NS (not January MD8)', () => {
    const selected = selectDefaultRound(leagueStageSeason(), NOW);
    expect(selected?.label).toBe('League Stage - 1');
    expect(selected?.roundNumber).toBe(1);
    expect(selected?.key).toBe('n:1');
  });

  it('does not pick League Stage 8 when earlier NS rounds exist', () => {
    const selected = selectDefaultRound(leagueStageSeason(), NOW);
    expect(selected?.roundNumber).not.toBe(8);
    expect(selected?.label).not.toMatch(/League Stage - 8/);
  });

  it('picks the next unfinished matchday after earlier rounds are complete', () => {
    const selected = selectDefaultRound(
      leagueStageSeason({ md1Status: 'FT', md2Status: 'NS' }),
      NOW,
    );
    expect(selected?.label).toBe('League Stage - 2');
    expect(selected?.roundNumber).toBe(2);
  });

  it('prefers a live matchday over upcoming later rounds', () => {
    const selected = selectDefaultRound(
      leagueStageSeason({ md1Status: '1H', md2Status: 'NS' }),
      NOW,
    );
    expect(selected?.label).toBe('League Stage - 1');
    expect(selected?.roundNumber).toBe(1);
  });

  it('falls back to the most recent completed round when nothing is upcoming', () => {
    const finished = [
      fx('League Stage - 1', '2026-09-08T19:00:00.000Z', 'FT'),
      fx('League Stage - 2', '2026-09-16T19:00:00.000Z', 'FT'),
      fx('League Stage - 8', '2027-01-27T20:00:00.000Z', 'FT'),
    ];
    const afterSeason = new Date('2027-02-01T12:00:00.000Z');
    const selected = selectDefaultRound(finished, afterSeason);
    expect(selected?.label).toBe('League Stage - 8');
    expect(selected?.roundNumber).toBe(8);
  });

  it('skips finished qualifying and still lands on League Stage 1', () => {
    const selected = selectDefaultRound(leagueStageSeason({ includeQualifying: true }), NOW);
    expect(selected?.label).toBe('League Stage - 1');
    expect(selected?.roundNumber).toBe(1);
  });

  it('returns null for an empty list', () => {
    expect(selectDefaultRound([], NOW)).toBeNull();
  });
});

describe('listFixtureRounds', () => {
  it('lists League Stage rounds in matchday order, not last-first', () => {
    const rounds = listFixtureRounds(leagueStageSeason());
    expect(rounds.map((r) => r.roundNumber)).toEqual([1, 2, 3, 8]);
    expect(rounds[0]?.label).toBe('League Stage - 1');
  });
});

describe('filterCupFixtures — Matches tab default round + Upcoming (UCL league stage)', () => {
  it('All defaults to League Stage 1 chronological, not January Stage 8 newest-first', () => {
    const fixtures = leagueStageSeason();
    const selected = selectDefaultRound(fixtures, NOW);
    const filtered = filterCupFixtures(fixtures, {
      selectedRound: resolveSelectedRound(listFixtureRounds(fixtures), selected, null),
      statusFilter: 'all',
      now: NOW,
    });

    expect(selected?.label).toBe('League Stage - 1');
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((f) => f.round === 'League Stage - 1')).toBe(true);
    expect(filtered[0]?.kickoffAt.toISOString()).toBe('2026-09-08T19:00:00.000Z');
    expect(filtered.some((f) => f.round === 'League Stage - 8')).toBe(false);
  });

  it('Upcoming + League Stage 1 includes NS Sep 8–9 fixtures (not empty)', () => {
    const fixtures = leagueStageSeason();
    const rounds = listFixtureRounds(fixtures);
    const stage1 = rounds.find((r) => r.label === 'League Stage - 1') ?? null;
    expect(stage1).not.toBeNull();

    const filtered = filterCupFixtures(fixtures, {
      selectedRound: stage1,
      statusFilter: 'upcoming',
      now: NOW,
    });

    expect(filtered.length).toBe(3);
    expect(filtered.every((f) => f.statusCode === 'NS')).toBe(true);
    expect(filtered.every((f) => f.round === 'League Stage - 1')).toBe(true);
    expect(filtered.map((f) => f.kickoffAt.toISOString())).toEqual([
      '2026-09-08T19:00:00.000Z',
      '2026-09-08T19:00:00.000Z',
      '2026-09-09T19:00:00.000Z',
    ]);
  });

  it('Upcoming + Stage 1 still lists NS when kickoffAt arrives as an ISO string', () => {
    const fixtures = leagueStageSeason().map((f) => ({
      ...f,
      kickoffAt: f.kickoffAt.toISOString() as unknown as Date,
    }));
    const selected = selectDefaultRound(fixtures, NOW);
    const filtered = filterCupFixtures(fixtures, {
      selectedRound: selected,
      statusFilter: 'upcoming',
      now: NOW,
    });

    expect(selected?.label).toBe('League Stage - 1');
    expect(filtered).toHaveLength(3);
    expect(filtered.every((f) => f.round === 'League Stage - 1')).toBe(true);
  });

  it('user-selected League Stage 1 + Upcoming does not leak Stage 8 January fixtures', () => {
    const fixtures = leagueStageSeason();
    const stage1 = listFixtureRounds(fixtures).find((r) => r.key === 'n:1') ?? null;
    const filtered = filterCupFixtures(fixtures, {
      selectedRound: stage1,
      statusFilter: 'upcoming',
      now: NOW,
    });
    expect(filtered.some((f) => f.roundNumber === 8)).toBe(false);
  });
});
