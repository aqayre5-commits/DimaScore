import { describe, it, expect, vi } from 'vitest';
import {
  createCompetitionIdCache,
  describePgError,
  filterKnownCompetitions,
} from '../../../workers/live-poller/src/guards';

const fx = (id: number, leagueId: number) => ({ id, league: { id: leagueId } });

describe('filterKnownCompetitions', () => {
  it('keeps fixtures in known competitions and skips the rest', () => {
    const logged = new Set<number>();
    const { kept, newlySkipped } = filterKnownCompetitions(
      [fx(1, 39), fx(2, 587), fx(3, 140)],
      new Set([39, 140]),
      logged,
    );
    expect(kept.map((f) => f.id)).toEqual([1, 3]);
    expect(newlySkipped.map((f) => f.id)).toEqual([2]);
  });

  it('reports a skipped fixture only once across ticks', () => {
    const logged = new Set<number>();
    const known = new Set([39]);
    const tick = () => filterKnownCompetitions([fx(2, 587), fx(4, 587)], known, logged);
    expect(tick().newlySkipped.map((f) => f.id)).toEqual([2, 4]);
    const second = tick();
    expect(second.newlySkipped).toEqual([]);
    expect(second.kept).toEqual([]);
  });

  it('starts keeping a fixture once its competition appears', () => {
    const logged = new Set<number>();
    expect(filterKnownCompetitions([fx(2, 587)], new Set([39]), logged).kept).toEqual([]);
    expect(filterKnownCompetitions([fx(2, 587)], new Set([39, 587]), logged).kept).toHaveLength(1);
  });
});

describe('createCompetitionIdCache', () => {
  it('queries once within the ttl and again after it', async () => {
    let t = 0;
    const load = vi.fn(async () => [39, 140]);
    const get = createCompetitionIdCache(load, 1000, () => t);
    expect((await get()).has(39)).toBe(true);
    t = 999;
    await get();
    expect(load).toHaveBeenCalledTimes(1);
    t = 1000;
    await get();
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('keeps the previous set when a refresh fails', async () => {
    let t = 0;
    const load = vi.fn().mockResolvedValueOnce([39]).mockRejectedValueOnce(new Error('neon down'));
    const get = createCompetitionIdCache(load, 10, () => t);
    await get();
    t = 20;
    expect((await get()).has(39)).toBe(true);
  });

  it('throws when the first load fails', async () => {
    const get = createCompetitionIdCache(async () => {
      throw new Error('neon down');
    }, 10);
    await expect(get()).rejects.toThrow('neon down');
  });
});

describe('describePgError', () => {
  it('surfaces the Postgres code, constraint and detail from err.cause', () => {
    const cause = Object.assign(new Error('insert or update violates foreign key constraint'), {
      code: '23503',
      severity: 'ERROR',
      constraint: 'fixtures_competition_id_competitions_id_fk',
      table: 'fixtures',
      detail: 'Key (competition_id)=(587) is not present in table "competitions".',
    });
    const err = new Error('Failed query: insert into "fixtures" ... params: 1,2,3', { cause });
    const out = describePgError(err);
    expect(out).toContain('code=23503');
    expect(out).toContain('constraint=fixtures_competition_id_competitions_id_fk');
    expect(out).toContain('detail=Key (competition_id)=(587)');
    expect(out).not.toContain('Failed query');
  });

  it('reads fields directly from a driver error with no cause', () => {
    const err = Object.assign(new Error('boom'), { code: '40001', detail: 'serialization' });
    expect(describePgError(err)).toBe('code=40001 detail=serialization');
  });

  it('falls back to a truncated message for plain errors and non-errors', () => {
    expect(describePgError(new Error('plain failure'))).toBe('plain failure');
    expect(describePgError('oops')).toBe('oops');
    expect(describePgError(new Error('x'.repeat(500))).length).toBe(200);
  });
});
