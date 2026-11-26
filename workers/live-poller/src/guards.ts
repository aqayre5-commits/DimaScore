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
 * competition added later (e.g. by a backfill) is picked up without restarting the worker.
 * If a refresh fails, the previous set is kept when there is one.
 */
export function createCompetitionIdCache(
  load: () => Promise<number[]>,
  ttlMs: number,
  now: () => number = Date.now,
): () => Promise<ReadonlySet<number>> {
  let cached: { at: number; ids: Set<number> } | null = null;
  return async () => {
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
