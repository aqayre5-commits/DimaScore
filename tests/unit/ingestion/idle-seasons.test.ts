import { describe, it, expect } from 'vitest';
import {
  idleKeysFromCounts,
  idleSyncDue,
  seasonKey,
  selectSeasonsToSync,
} from '@/lib/ingestion/idle-seasons';

const seasons = Array.from({ length: 48 }, (_, i) => ({ competitionId: 100 + i, year: 2026 }));
const allIdle = new Set(seasons.map(seasonKey));
const HALF_HOUR = 30 * 60 * 1000;
// 2026-11-26T00:00:00Z is a UTC day boundary
const DAY_START = Date.UTC(2026, 10, 26);

describe('idleKeysFromCounts', () => {
  it('marks a season idle only when it has fixtures but none inside the window', () => {
    const idle = idleKeysFromCounts([
      { competition_id: 1, year: 2026, total: '120', in_window: '0' }, // idle
      { competition_id: 2, year: 2026, total: '120', in_window: '3' }, // active
      { competition_id: 3, year: 2026, total: '0', in_window: '0' }, // just loaded: active
      { competition_id: 'x', year: 2026, total: '5', in_window: '0' }, // malformed: ignored
    ]);
    expect([...idle]).toEqual(['1-2026']);
  });

  it('returns an empty set for no rows (everything syncs)', () => {
    expect(idleKeysFromCounts([]).size).toBe(0);
  });
});

describe('selectSeasonsToSync', () => {
  it('always syncs seasons that are not idle (including unknown ones)', () => {
    const now = new Date(DAY_START);
    const { run, idleSkipped } = selectSeasonsToSync(seasons, new Set(), now);
    expect(run).toHaveLength(48);
    expect(idleSkipped).toHaveLength(0);
  });

  it('skips idle seasons on a normal run and keeps active ones', () => {
    const active = seasons[0];
    const idle = new Set(seasons.slice(1).map(seasonKey));
    // slot where nobody idle is due: competitionId % 48 === 4 -> 100 % 48 = 4 is season[0] (active);
    // pick the slot of season[0] so no idle season shares it
    const now = new Date(DAY_START + (active.competitionId % 48) * HALF_HOUR);
    const { run, idleSkipped } = selectSeasonsToSync(seasons, idle, now);
    expect(run).toEqual([active]);
    expect(idleSkipped).toHaveLength(47);
  });

  it('daily cadence: an idle season runs in exactly one of the 48 half-hour runs per day', () => {
    for (const s of seasons) {
      let runs = 0;
      for (let slot = 0; slot < 48; slot++) {
        const now = new Date(DAY_START + slot * HALF_HOUR + 7 * 60 * 1000);
        if (selectSeasonsToSync([s], allIdle, now).run.length) runs++;
      }
      expect(runs).toBe(1);
    }
  });

  it('daily cadence also works for jobs that run at :15/:45', () => {
    const s = seasons[5];
    let runs = 0;
    for (let slot = 0; slot < 48; slot++) {
      const now = new Date(DAY_START + slot * HALF_HOUR + 15 * 60 * 1000);
      if (selectSeasonsToSync([s], allIdle, now).run.length) runs++;
    }
    expect(runs).toBe(1);
  });

  it('idle seasons are spread across the day, not all in one run', () => {
    const perSlot: number[] = [];
    for (let slot = 0; slot < 48; slot++) {
      const now = new Date(DAY_START + slot * HALF_HOUR);
      perSlot.push(selectSeasonsToSync(seasons, allIdle, now).run.length);
    }
    expect(Math.max(...perSlot)).toBe(1);
    expect(perSlot.reduce((a, b) => a + b, 0)).toBe(48);
  });

  it('idleSyncDue is deterministic for the same instant', () => {
    const now = new Date(DAY_START + 5 * HALF_HOUR);
    expect(idleSyncDue(123, now)).toBe(idleSyncDue(123, now));
  });

  it('preserves the extra fields of each season', () => {
    const rich = [{ competitionId: 9, year: 2026, isWomen: true, hasStandingsCoverage: true }];
    const { run } = selectSeasonsToSync(rich, new Set(), new Date(DAY_START));
    expect(run[0]).toEqual(rich[0]);
  });
});
