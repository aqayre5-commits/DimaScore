import { describe, it, expect, vi } from 'vitest';
import {
  createCompetitionAutoLoader,
  createCompetitionIdCache,
  missingCompetitionIds,
} from '../../../workers/live-poller/src/guards';

const COOLDOWN = 45 * 60_000;
const ALLOW = new Set([39, 587]);

function setup(load = vi.fn<(id: number) => Promise<void>>(async () => {})) {
  let t = 1_000_000;
  const log = vi.fn();
  const onLoaded = vi.fn();
  const run = createCompetitionAutoLoader({
    allowList: ALLOW,
    load,
    cooldownMs: COOLDOWN,
    now: () => t,
    log,
    onLoaded,
  });
  return {
    run,
    load,
    log,
    onLoaded,
    advance: (ms: number) => {
      t += ms;
    },
  };
}

describe('missingCompetitionIds', () => {
  it('returns each missing competition id once', () => {
    const fixtures = [
      { id: 1, league: { id: 587 } },
      { id: 2, league: { id: 587 } },
      { id: 3, league: { id: 39 } },
      { id: 4, league: { id: 950 } },
    ];
    expect(missingCompetitionIds(fixtures, new Set([39]))).toEqual([587, 950]);
    expect(missingCompetitionIds(fixtures, new Set([39, 587, 950]))).toEqual([]);
  });
});

describe('createCompetitionAutoLoader', () => {
  it('loads a missing allow-listed competition exactly once and reports it', async () => {
    const { run, load, log, onLoaded } = setup();
    const res = await run([587]);
    expect(load).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenCalledWith(587);
    expect(res.loaded).toEqual([587]);
    expect(onLoaded).toHaveBeenCalledWith(587);
    expect(log.mock.calls.map((c) => String(c[0])).join('\n')).toContain('competition=587');
  });

  it('loads the same id once even when it is passed several times in one call', async () => {
    const { run, load } = setup();
    await run([587, 587, 587]);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('does not load the same id again within the cooldown, and does after it', async () => {
    const { run, load, advance } = setup();
    await run([587]);
    advance(COOLDOWN - 1);
    const early = await run([587]);
    expect(early.cooling).toEqual([587]);
    expect(load).toHaveBeenCalledTimes(1);
    advance(1);
    await run([587]);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('does not throw when the load fails, and does not hammer the API afterwards', async () => {
    const load = vi.fn<(id: number) => Promise<void>>(async () => {
      throw new Error('API-Football 429');
    });
    const { run, log, onLoaded, advance } = setup(load);
    const res = await run([587]);
    expect(res.failed).toEqual([587]);
    expect(res.loaded).toEqual([]);
    expect(onLoaded).not.toHaveBeenCalled();
    expect(log.mock.calls.map((c) => String(c[0])).join('\n')).toContain('load failed');
    // a failed load is retried only after the cooldown
    advance(60_000);
    await run([587]);
    expect(load).toHaveBeenCalledTimes(1);
    advance(COOLDOWN);
    await run([587]);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('never loads an id that is not on the allow-list', async () => {
    const { run, load } = setup();
    const res = await run([128, 253, 1155]);
    expect(load).not.toHaveBeenCalled();
    expect(res.ignored).toEqual([128, 253, 1155]);
    expect(res.loaded).toEqual([]);
  });

  it('loads only the allow-listed ids of a mixed list', async () => {
    const { run, load } = setup();
    await run([128, 587, 253]);
    expect(load.mock.calls.map((c) => c[0])).toEqual([587]);
  });

  it('does not start a second load for an id that is still loading', async () => {
    let release!: () => void;
    const load = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );
    const { run } = setup(load);
    const first = run([587]);
    const second = await run([587]);
    expect(second.cooling).toEqual([587]);
    release();
    await first;
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('caps the number of loads started by one call and defers the rest', async () => {
    const allow = new Set([1, 2, 3, 4, 5]);
    const load = vi.fn<(id: number) => Promise<void>>(async () => {});
    const run = createCompetitionAutoLoader({
      allowList: allow,
      load,
      cooldownMs: COOLDOWN,
      maxPerRun: 2,
    });
    const res = await run([1, 2, 3, 4]);
    expect(load).toHaveBeenCalledTimes(2);
    expect(res.deferred).toEqual([3, 4]);
    // deferred ids were not stamped, so the next call can start them
    await run([3, 4]);
    expect(load.mock.calls.map((c) => c[0])).toEqual([1, 2, 3, 4]);
  });

  it('a throwing onLoaded hook or logger does not fail the load or throw', async () => {
    const load = vi.fn<(id: number) => Promise<void>>(async () => {});
    const run = createCompetitionAutoLoader({
      allowList: ALLOW,
      load,
      cooldownMs: COOLDOWN,
      onLoaded: () => {
        throw new Error('hook broke');
      },
    });
    const res = await run([587]);
    expect(res.loaded).toEqual([587]);
    expect(res.failed).toEqual([]);
  });
});

describe('createCompetitionIdCache.invalidate', () => {
  it('forces a reload on the next call so a freshly loaded competition is seen', async () => {
    let t = 0;
    const load = vi.fn().mockResolvedValueOnce([39]).mockResolvedValueOnce([39, 587]);
    const get = createCompetitionIdCache(load, 5 * 60_000, () => t);
    expect((await get()).has(587)).toBe(false);
    t = 1000;
    expect((await get()).has(587)).toBe(false); // still cached
    get.invalidate();
    expect((await get()).has(587)).toBe(true);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('invalidate before the first load is harmless', async () => {
    const load = vi.fn(async () => [39]);
    const get = createCompetitionIdCache(load, 1000);
    get.invalidate();
    expect((await get()).has(39)).toBe(true);
    expect(load).toHaveBeenCalledTimes(1);
  });
});
