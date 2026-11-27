/**
 * Small, pure guards for the live poller so one unusable fixture can no longer
 * abort a whole tick. Kept free of DB/network imports so they are unit-testable.
 */

/** The fields of a fixture the guards need. */
export interface GuardFixture {
  id: number;
  league: { id: number };
}

/**
 * Drop fixtures whose competition is not in `competitions`. Writing one would hit the
 * `fixtures_competition_id_competitions_id_fk` foreign key and fail every tick.
 *
 * `loggedSkips` is the caller's long-lived set of fixture ids already reported, so a skipped
 * fixture is announced once, not on every 15 s tick. Returns the fixtures to keep and the
 * fixtures newly skipped this call (the ones to log).
 */
export function filterKnownCompetitions<T extends GuardFixture>(
  fixtures: T[],
  knownCompetitionIds: ReadonlySet<number>,
  loggedSkips: Set<number>,
): { kept: T[]; newlySkipped: T[] } {
  const kept: T[] = [];
  const newlySkipped: T[] = [];
  for (const f of fixtures) {
    if (knownCompetitionIds.has(f.league.id)) {
      kept.push(f);
      continue;
    }
    if (!loggedSkips.has(f.id)) {
      loggedSkips.add(f.id);
      newlySkipped.push(f);
    }
  }
  return { kept, newlySkipped };
}

/**
 * Cache the set of competition ids for `ttlMs` so a tick does not query on every pass, while a
 * competition added later (e.g. by a backfill or the auto-loader) is picked up without restarting
 * the worker. If a refresh fails, the previous set is kept when there is one.
 * `invalidate()` forces the next call to reload (used right after the auto-loader inserts a row).
 */
export type CompetitionIdCache = (() => Promise<ReadonlySet<number>>) & { invalidate: () => void };

export function createCompetitionIdCache(
  load: () => Promise<number[]>,
  ttlMs: number,
  now: () => number = Date.now,
): CompetitionIdCache {
  let cached: { at: number; ids: Set<number> } | null = null;
  const get = async () => {
    if (cached && now() - cached.at < ttlMs) return cached.ids;
    try {
      const ids = new Set(await load());
      cached = { at: now(), ids };
      return ids;
    } catch (err) {
      if (cached) return cached.ids;
      throw err;
    }
  };
  return Object.assign(get, {
    invalidate: () => {
      if (cached) cached = { at: -Infinity, ids: cached.ids };
    },
  });
}

/** Distinct competition ids of `fixtures` that are not in `known`. */
export function missingCompetitionIds<T extends GuardFixture>(
  fixtures: readonly T[],
  known: ReadonlySet<number>,
): number[] {
  const out = new Set<number>();
  for (const f of fixtures) if (!known.has(f.league.id)) out.add(f.league.id);
  return [...out];
}

export interface AutoLoadOptions {
  /** Only these competition ids may ever be loaded (the VERIFIED_COMPETITIONS allow-list). */
  allowList: ReadonlySet<number>;
  /** Loads ONE competition (league + seasons + coverage). May throw; the loader never does. */
  load: (competitionId: number) => Promise<void>;
  /** Minimum time between two attempts for the same id, whether the last one worked or not. */
  cooldownMs: number;
  /** Cap on loads started by one call, so a feed glitch cannot fan out into many API calls. */
  maxPerRun?: number;
  now?: () => number;
  log?: (message: string) => void;
  /** Called after a successful load (e.g. to invalidate the known-competitions cache). */
  onLoaded?: (competitionId: number) => void;
}

export interface AutoLoadResult {
  loaded: number[];
  failed: number[];
  /** Skipped: attempted within the cooldown, or already loading. */
  cooling: number[];
  /** Skipped: not on the allow-list. */
  ignored: number[];
  /** Skipped: over `maxPerRun`; they are retried by a later call. */
  deferred: number[];
}

/**
 * Loads an allow-listed competition that is missing from the database, so the live poller stops
 * skipping its fixtures. Safe to call every tick and to not await: it never throws, tries each id
 * at most once per `cooldownMs` (a failed load is not retried until the cooldown ends) and never
 * loads an id outside the allow-list.
 */
export function createCompetitionAutoLoader(opts: AutoLoadOptions) {
  const now = opts.now ?? Date.now;
  const log = opts.log ?? (() => {});
  const maxPerRun = opts.maxPerRun ?? 3;
  const lastAttempt = new Map<number, number>();
  const inFlight = new Set<number>();

  return async (ids: Iterable<number>): Promise<AutoLoadResult> => {
    const result: AutoLoadResult = {
      loaded: [],
      failed: [],
      cooling: [],
      ignored: [],
      deferred: [],
    };
    let started = 0;
    for (const id of new Set(ids)) {
      if (!opts.allowList.has(id)) {
        result.ignored.push(id);
        continue;
      }
      const last = lastAttempt.get(id);
      if (inFlight.has(id) || (last !== undefined && now() - last < opts.cooldownMs)) {
        result.cooling.push(id);
        continue;
      }
      if (started >= maxPerRun) {
        result.deferred.push(id);
        continue;
      }
      started++;
      lastAttempt.set(id, now());
      inFlight.add(id);
      try {
        log(
          `[autoload] competition=${id} is on the allow-list but not in competitions; loading it`,
        );
        await opts.load(id);
        result.loaded.push(id);
        log(`[autoload] competition=${id} loaded; its fixtures are picked up on the next tick`);
        try {
          opts.onLoaded?.(id);
        } catch {
          // a failing hook must not turn a successful load into a failure
        }
      } catch (err) {
        result.failed.push(id);
        try {
          log(
            `[autoload] competition=${id} load failed (no retry for ${Math.round(opts.cooldownMs / 60_000)} min): ${describePgError(err)}`,
          );
        } catch {
          // logging must never throw
        }
      } finally {
        inFlight.delete(id);
      }
    }
    return result;
  };
}

interface PgErrorFields {
  code?: unknown;
  severity?: unknown;
  constraint?: unknown;
  detail?: unknown;
  table?: unknown;
  column?: unknown;
  message?: unknown;
}

function pgFields(err: unknown): PgErrorFields | null {
  if (!err || typeof err !== 'object') return null;
  return err as PgErrorFields;
}

/**
 * One-line description of an error that keeps the Postgres diagnostics. Drizzle wraps the driver
 * error as `Failed query: <sql>` and hides the real reason in `.cause`; the SQL text and bound
 * params are not repeated here, only the code, constraint, table, column and detail.
 */
export function describePgError(err: unknown): string {
  const top = pgFields(err);
  const cause = pgFields(top && 'cause' in top ? (top as { cause?: unknown }).cause : null);
  const pg = cause && (cause.code || cause.constraint || cause.detail) ? cause : top;
  const parts: string[] = [];
  for (const key of ['code', 'severity', 'constraint', 'table', 'column', 'detail'] as const) {
    const v = pg?.[key];
    if (typeof v === 'string' && v) parts.push(`${key}=${v}`);
  }
  const reason = typeof cause?.message === 'string' ? cause.message : null;
  if (reason) parts.push(`reason=${reason.slice(0, 200)}`);
  if (parts.length === 0) {
    const m = err instanceof Error ? err.message : String(err);
    return m.slice(0, 200);
  }
  return parts.join(' ');
}
