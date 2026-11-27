import type { NormalizedFixture } from '@/lib/data/types';

export interface FixtureRow {
  id: number;
  homeScore: number | null;
  awayScore: number | null;
  statusCode: string;
  minute: number | null;
}

export interface FixtureDelta {
  fixtureId: number;
  changes: string[];
}

export function computeDeltas(
  liveFixtures: NormalizedFixture[],
  dbMap: Map<number, FixtureRow>,
): FixtureDelta[] {
  const deltas: FixtureDelta[] = [];

  for (const fixture of liveFixtures) {
    const dbRow = dbMap.get(fixture.id);
    const changes: string[] = [];

    if (!dbRow) {
      changes.push('new');
    } else {
      if (dbRow.homeScore !== fixture.goals.home) changes.push('homeScore');
      if (dbRow.awayScore !== fixture.goals.away) changes.push('awayScore');
      if (dbRow.statusCode !== fixture.status.short) changes.push('statusCode');
      if (dbRow.minute !== fixture.status.elapsed) changes.push('minute');
    }

    if (changes.length > 0) {
      deltas.push({ fixtureId: fixture.id, changes });
    }
  }

  return deltas;
}

/**
 * A delta that must refetch events/statistics promptly: anything other than the minute ticking
 * ('new' fixture, a score change, a status change such as HT/FT). A minute-only change happens on
 * every live fixture roughly once a minute and says nothing new about events, so on its own it must
 * not defeat the events/statistics throttle.
 */
export function isDetailTriggerDelta(changes: readonly string[] | undefined): boolean {
  return !!changes && changes.some((c) => c !== 'minute');
}

/**
 * Whether a live fixture's events/statistics are due: a real delta triggers a fetch immediately;
 * otherwise (no delta, or a minute-only delta) at most one fetch per `throttleMs`.
 */
export function areDetailsDue(opts: {
  changes: readonly string[] | undefined;
  lastSyncAt: number | undefined;
  now: number;
  throttleMs: number;
}): boolean {
  if (isDetailTriggerDelta(opts.changes)) return true;
  return opts.now - (opts.lastSyncAt ?? 0) > opts.throttleMs;
}
