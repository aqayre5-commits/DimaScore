import { describe, it, expect, vi } from 'vitest';
import {
  DroppedFixtureTracker,
  finalizeDroppedFixtures,
  MAX_FINALIZE_ATTEMPTS,
} from '../../../workers/live-poller/src/finalize-dropped';
import type { FixtureStatus, NormalizedFixture } from '@/lib/data/types';

function makeFixture(id: number, short: FixtureStatus, home = 2, away = 1): NormalizedFixture {
  return {
    id,
    referee: null,
    date: '2026-11-04T20:00:00+00:00',
    timestamp: 1793822400,
    venue: { id: null, name: null, city: null },
    status: { short, long: short, elapsed: 90 },
    league: {
      id: 200,
      name: 'Botola Pro',
      logo: null,
      country: 'Morocco',
      round: 'R1',
      season: 2026,
    },
    homeTeam: { id: 100, name: 'Raja', logo: null, winner: null },
    awayTeam: { id: 200, name: 'Wydad', logo: null, winner: null },
    goals: { home, away },
    score: {
      halftime: { home: 1, away: 0 },
      fulltime: { home, away },
      extratime: { home: null, away: null },
      penalty: { home: null, away: null },
    },
  };
}

function fakeDb() {
  const writes: { values: Record<string, unknown>; set: Record<string, unknown> }[] = [];
  const db = {
    insert: () => ({
      values: (values: Record<string, unknown>) => ({
        onConflictDoUpdate: async ({ set }: { set: Record<string, unknown> }) => {
          writes.push({ values, set });
        },
      }),
    }),
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { db: db as any, writes };
}

describe('DroppedFixtureTracker', () => {
  it('returns nothing until a tracked fixture leaves the live feed', () => {
    const t = new DroppedFixtureTracker();
    expect(t.update([1, 2, 3])).toEqual([]);
    expect(t.update([1, 2, 3])).toEqual([]);
    expect(t.update([1, 3])).toEqual([2]);
  });

  it('forgets a fixture once settled', () => {
    const t = new DroppedFixtureTracker();
    t.update([1, 2]);
    const ids = t.update([]);
    expect(ids.sort()).toEqual([1, 2]);
    t.settle(ids, [1, 2]);
    expect(t.update([])).toEqual([]);
    expect(t.pendingCount).toBe(0);
  });

  it('re-checks an unsettled fixture on later ticks, up to MAX_FINALIZE_ATTEMPTS', () => {
    const t = new DroppedFixtureTracker();
    t.update([7]);
    let checks = 0;
    for (let i = 0; i < MAX_FINALIZE_ATTEMPTS + 3; i++) {
      const ids = t.update([]);
      if (ids.length === 0) break;
      checks++;
      t.settle(ids, []); // API still says live
    }
    expect(checks).toBe(MAX_FINALIZE_ATTEMPTS);
  });

  it('drops a pending fixture that comes back onto the live feed', () => {
    const t = new DroppedFixtureTracker();
    t.update([5]);
    expect(t.update([])).toEqual([5]);
    t.settle([5], []);
    expect(t.update([5])).toEqual([]);
    expect(t.pendingCount).toBe(0);
  });

  it('caps a single fetch at 20 ids', () => {
    const t = new DroppedFixtureTracker();
    t.update(Array.from({ length: 25 }, (_, i) => i + 1));
    expect(t.update([])).toHaveLength(20);
  });
});

describe('finalizeDroppedFixtures', () => {
  it('fetches a single dropped fixture by id in one call and writes the final result', async () => {
    const getFixtures = vi.fn().mockResolvedValue([makeFixture(42, 'FT', 3, 2)]);
    const { db, writes } = fakeDb();

    const res = await finalizeDroppedFixtures({ getFixtures }, db, [42]);

    expect(getFixtures).toHaveBeenCalledTimes(1);
    expect(getFixtures).toHaveBeenCalledWith({ id: 42 });
    expect(res.settled.map((f) => f.id)).toEqual([42]);
    expect(res.stillLive).toEqual([]);
    expect(writes).toHaveLength(1);
    expect(writes[0].set).toMatchObject({ statusCode: 'FT', homeScore: 3, awayScore: 2 });
  });

  it('batches several dropped fixtures into one ids= call', async () => {
    const getFixtures = vi
      .fn()
      .mockResolvedValue([makeFixture(1, 'FT'), makeFixture(2, 'AET'), makeFixture(3, '2H')]);
    const { db, writes } = fakeDb();

    const res = await finalizeDroppedFixtures({ getFixtures }, db, [1, 2, 3]);

    expect(getFixtures).toHaveBeenCalledTimes(1);
    expect(getFixtures).toHaveBeenCalledWith({ ids: [1, 2, 3] });
    expect(res.settled.map((f) => f.id)).toEqual([1, 2]);
    expect(res.stillLive.map((f) => f.id)).toEqual([3]);
    expect(writes).toHaveLength(3);
  });

  it('makes no call when nothing dropped', async () => {
    const getFixtures = vi.fn();
    const { db } = fakeDb();
    await finalizeDroppedFixtures({ getFixtures }, db, []);
    expect(getFixtures).not.toHaveBeenCalled();
  });
});
