import { describe, expect, it } from 'vitest';
import {
  FINISHED_CODES_ARRAY,
  getMatchListBucket,
  getMatchState,
  getMatchStatusLabelKey,
  INTERRUPTED_CODES_ARRAY,
  LIVE_CODES_ARRAY,
  TERMINAL_NON_PLAYED_CODES_ARRAY,
  UPCOMING_CODES_ARRAY,
} from '@/lib/match-status';

/** Frozen "now" so CANC fixtures with past/future kickoffs don't depend on wall clock. */
const NOW = new Date('2026-09-07T12:00:00.000Z');

function bucket(statusCode: string, kickoffIso: string) {
  return getMatchListBucket(statusCode, new Date(kickoffIso), NOW);
}

describe('match list status sets', () => {
  it('Upcoming codes are only NS and TBD', () => {
    expect([...UPCOMING_CODES_ARRAY]).toEqual(['NS', 'TBD']);
  });

  it('terminal non-played statuses are excluded from Upcoming', () => {
    expect([...TERMINAL_NON_PLAYED_CODES_ARRAY]).toEqual(['CANC', 'ABD', 'PST', 'WO', 'AWD']);
    for (const code of TERMINAL_NON_PLAYED_CODES_ARRAY) {
      expect(bucket(code, '2026-10-08T19:00:00.000Z')).toBe('finished');
      expect(bucket(code, '2023-11-16T19:00:00.000Z')).toBe('finished');
    }
  });

  it('interrupted codes overlap CANC/ABD/PST and never bucket as upcoming', () => {
    expect([...INTERRUPTED_CODES_ARRAY]).toEqual(['PST', 'SUSP', 'CANC', 'ABD']);
    for (const code of INTERRUPTED_CODES_ARRAY) {
      expect(bucket(code, '2026-12-01T18:00:00.000Z')).toBe('finished');
    }
  });

  it('NS/TBD with future kickoff are upcoming; live codes are live; scored finishes are finished', () => {
    expect(bucket('NS', '2026-09-10T19:00:00.000Z')).toBe('upcoming');
    expect(bucket('TBD', '2026-09-10T19:00:00.000Z')).toBe('upcoming');
    for (const code of LIVE_CODES_ARRAY) {
      expect(bucket(code, '2026-09-07T11:00:00.000Z')).toBe('live');
    }
    for (const code of ['FT', 'AET', 'PEN'] as const) {
      expect(FINISHED_CODES_ARRAY).toContain(code);
      expect(bucket(code, '2026-09-06T19:00:00.000Z')).toBe('finished');
    }
  });
});

describe('BUG-014 / DATA-004 Morocco–Eritrea cancelled fixtures', () => {
  const moroccoEritreaCanc = [
    {
      id: 1125859,
      kickoffAt: '2023-11-16T19:00:00.000Z',
      statusCode: 'CANC',
      note: 'Morocco–Eritrea (FIFA/CAF withdrawal)',
    },
    {
      id: 1126074,
      kickoffAt: '2025-10-08T19:00:00.000Z',
      statusCode: 'CANC',
      note: 'Eritrea–Morocco (FIFA/CAF withdrawal)',
    },
  ];

  it('does not place either cancelled fixture in Upcoming', () => {
    const upcoming = moroccoEritreaCanc.filter(
      (f) => bucket(f.statusCode, f.kickoffAt) === 'upcoming',
    );
    expect(upcoming.map((f) => f.id)).toEqual([]);
  });

  it('buckets both cancelled fixtures into Completed/Results with a Cancelled label', () => {
    for (const f of moroccoEritreaCanc) {
      expect(bucket(f.statusCode, f.kickoffAt)).toBe('finished');
      expect(getMatchState(f.statusCode, new Date(f.kickoffAt), NOW)).toBe('interrupted');
      expect(getMatchStatusLabelKey(f.statusCode)).toBe('cancelled');
    }
  });

  it('a 6-NS + 2-CANC team list yields upcoming count 6, not 8', () => {
    const fixtures = [
      ...moroccoEritreaCanc,
      ...[1, 2, 3, 4, 5, 6].map((n) => ({
        id: n,
        kickoffAt: `2026-09-${10 + n}T19:00:00.000Z`,
        statusCode: 'NS',
      })),
    ];
    const counts = { upcoming: 0, live: 0, finished: 0 };
    for (const f of fixtures) {
      counts[bucket(f.statusCode, f.kickoffAt)] += 1;
    }
    expect(counts).toEqual({ upcoming: 6, live: 0, finished: 2 });
  });
});
