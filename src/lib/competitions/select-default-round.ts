import { getMatchListBucket } from '@/lib/match-status';

/**
 * Pick the competition Overview / Matches (and league round-picker) default matchday.
 *
 * Priority:
 *  1. Round that currently has live fixtures (earliest live kickoff if several)
 *  2. Round whose next upcoming kickoff is soonest — never a far-future
 *     matchday when an earlier NS round still exists
 *  3. Most recently completed round
 *  4. Chronologically first round
 */

/** Status pills on cup Overview + Matches (`CupFixturesTab`). */
export type CupStatusFilter = 'all' | 'live' | 'upcoming' | 'results';

/** RSC may pass kickoff as an ISO string; coerce before getTime / bucket checks. */
export function asKickoffDate(kickoffAt: Date | string | number): Date {
  return kickoffAt instanceof Date ? kickoffAt : new Date(kickoffAt);
}

export interface RoundSelectableFixture {
  round: string | null;
  roundNumber: number | null;
  statusCode: string;
  kickoffAt: Date;
}

export interface SelectedRound {
  /** `n:{roundNumber}` when numeric, otherwise `s:{round}`. */
  key: string;
  round: string | null;
  roundNumber: number | null;
  label: string;
}

export function fixtureRoundKey(f: { round: string | null; roundNumber: number | null }): string {
  if (f.roundNumber != null) return `n:${f.roundNumber}`;
  return `s:${f.round ?? ''}`;
}

export function matchesSelectedRound(
  f: { round: string | null; roundNumber: number | null },
  selected: SelectedRound,
): boolean {
  return fixtureRoundKey(f) === selected.key;
}

function labelForGroup(fixtures: RoundSelectableFixture[], roundNumber: number | null): string {
  const counts = new Map<string, number>();
  for (const f of fixtures) {
    if (!f.round) continue;
    counts.set(f.round, (counts.get(f.round) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const [round, count] of counts) {
    if (count > bestCount) {
      best = round;
      bestCount = count;
    }
  }
  if (best) return best;
  if (roundNumber != null) return `Round ${roundNumber}`;
  return 'Round';
}

function toSelectedRound(key: string, group: RoundSelectableFixture[]): SelectedRound {
  return {
    key,
    round: group.find((f) => f.round)?.round ?? null,
    roundNumber: group.find((f) => f.roundNumber != null)?.roundNumber ?? null,
    label: labelForGroup(group, group.find((f) => f.roundNumber != null)?.roundNumber ?? null),
  };
}

function groupByRound(fixtures: RoundSelectableFixture[]): Map<string, RoundSelectableFixture[]> {
  const groups = new Map<string, RoundSelectableFixture[]>();
  for (const f of fixtures) {
    const key = fixtureRoundKey(f);
    const list = groups.get(key);
    if (list) list.push(f);
    else groups.set(key, [f]);
  }
  return groups;
}

function minKickoff(fixtures: RoundSelectableFixture[]): number {
  let min = Infinity;
  for (const f of fixtures) {
    const t = asKickoffDate(f.kickoffAt).getTime();
    if (t < min) min = t;
  }
  return min;
}

function sortRoundEntries(
  entries: [string, RoundSelectableFixture[]][],
): [string, RoundSelectableFixture[]][] {
  return [...entries].sort((a, b) => {
    const aNum = a[1].find((f) => f.roundNumber != null)?.roundNumber;
    const bNum = b[1].find((f) => f.roundNumber != null)?.roundNumber;
    if (aNum != null && bNum != null && aNum !== bNum) return aNum - bNum;
    if (aNum != null && bNum == null) return -1;
    if (aNum == null && bNum != null) return 1;
    return minKickoff(a[1]) - minKickoff(b[1]);
  });
}

/** Unique rounds in display order (numeric matchday, then kickoff). */
export function listFixtureRounds(fixtures: RoundSelectableFixture[]): SelectedRound[] {
  const groups = groupByRound(fixtures);
  return sortRoundEntries([...groups.entries()]).map(([key, group]) => toSelectedRound(key, group));
}

export function selectDefaultRound(
  fixtures: RoundSelectableFixture[],
  now: Date = new Date(),
): SelectedRound | null {
  if (fixtures.length === 0) return null;

  const groups = groupByRound(fixtures);
  const entries = [...groups.entries()];

  let bestLiveKey: string | null = null;
  let bestLiveAt = Infinity;
  let bestUpcomingKey: string | null = null;
  let bestUpcomingAt = Infinity;
  let bestFinishedKey: string | null = null;
  let bestFinishedAt = -Infinity;

  for (const [key, group] of entries) {
    for (const f of group) {
      const kickoff = asKickoffDate(f.kickoffAt);
      const bucket = getMatchListBucket(f.statusCode, kickoff, now);
      const t = kickoff.getTime();
      if (bucket === 'live' && t < bestLiveAt) {
        bestLiveAt = t;
        bestLiveKey = key;
      } else if (bucket === 'upcoming' && t < bestUpcomingAt) {
        bestUpcomingAt = t;
        bestUpcomingKey = key;
      } else if (bucket === 'finished' && t > bestFinishedAt) {
        bestFinishedAt = t;
        bestFinishedKey = key;
      }
    }
  }

  const chosenKey = bestLiveKey ?? bestUpcomingKey ?? bestFinishedKey;
  if (chosenKey) {
    const group = groups.get(chosenKey);
    if (group) return toSelectedRound(chosenKey, group);
  }

  const ordered = sortRoundEntries(entries);
  const [fallbackKey, fallbackGroup] = ordered[0];
  return toSelectedRound(fallbackKey, fallbackGroup);
}

/**
 * Resolve the cup round dropdown: user choice if still present, else the
 * default matchday. Applies to Overview and Matches — not compact-only.
 */
export function resolveSelectedRound(
  rounds: SelectedRound[],
  defaultRound: SelectedRound | null,
  userRoundKey: string | null,
): SelectedRound | null {
  if (rounds.length === 0) return null;
  if (userRoundKey) return rounds.find((r) => r.key === userRoundKey) ?? defaultRound;
  return defaultRound;
}

/**
 * Filter + sort cup Overview / Matches lists.
 * Upcoming includes NS/TBD with kickoff still ahead (same bucket as Overview).
 * All / live / upcoming are chronological; results are newest-first.
 */
export function filterCupFixtures<T extends RoundSelectableFixture>(
  fixtures: T[],
  opts: {
    selectedRound: SelectedRound | null;
    statusFilter: CupStatusFilter;
    now?: Date;
  },
): T[] {
  const now = opts.now ?? new Date();
  const result = fixtures.filter((f) => {
    if (opts.selectedRound && !matchesSelectedRound(f, opts.selectedRound)) return false;
    if (opts.statusFilter === 'all') return true;
    const kickoff = asKickoffDate(f.kickoffAt);
    const bucket = getMatchListBucket(f.statusCode, kickoff, now);
    if (opts.statusFilter === 'live') return bucket === 'live';
    if (opts.statusFilter === 'upcoming') return bucket === 'upcoming';
    if (opts.statusFilter === 'results') return bucket === 'finished';
    return true;
  });

  const newestFirst = opts.statusFilter === 'results';
  return [...result].sort((a, b) => {
    const da = asKickoffDate(a.kickoffAt).getTime();
    const db = asKickoffDate(b.kickoffAt).getTime();
    return newestFirst ? db - da : da - db;
  });
}
