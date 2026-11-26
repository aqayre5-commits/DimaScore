/**
 * Home (the reference "Overall" page): pure selection rules, shared by the server page and the
 * client view. See Overall-Logic.txt → MATCHDAY PROGRESSION.
 */
import type { FixtureWithTeams } from '@/lib/db/queries';
import { getMatchState, isLive } from '@/lib/match-status';
import { toSiteDateKey, SITE_TZ } from '@/lib/utils/date';

export interface HomeFixture extends FixtureWithTeams {
  competitionId: number;
  seasonYear: number;
  minute: number | null;
}

export interface HomeCompetition {
  id: number;
  slug: string;
  name: Record<string, string>;
  type: string | null;
  countryCode: string | null;
  logoUrl: string | null;
  displayPriority: number;
}

export type HomeFilter = 'all' | 'live' | 'upcoming' | 'finished';

export interface HomePrefs {
  /** Starred match ids. */
  starred: ReadonlySet<number>;
  /** Pinned competition ids. */
  pinned: ReadonlySet<number>;
}

const asDate = (v: Date | string) => (v instanceof Date ? v : new Date(v));
const time = (f: { kickoffAt: Date | string }) => asDate(f.kickoffAt).getTime();
const SKIP = new Set(['PST', 'CANC', 'ABD']);

export function homeDayKey(f: { kickoffAt: Date | string }): string {
  return toSiteDateKey(asDate(f.kickoffAt), SITE_TZ);
}

/** YYYY-MM-DD ± n days (calendar arithmetic on the key itself, no time zone involved). */
export function shiftDayKey(key: string, n: number): string {
  const d = new Date(`${key}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function homeState(
  f: HomeFixture,
  now: Date,
): 'live' | 'upcoming' | 'finished' | 'interrupted' {
  return getMatchState(f.statusCode, asDate(f.kickoffAt), now) as
    | 'live'
    | 'upcoming'
    | 'finished'
    | 'interrupted';
}

/** Lower is more preferred: starred match, then pinned competition, then editorial order. */
function preference(f: HomeFixture, prefs: HomePrefs, rank: (id: number) => number): number[] {
  return [
    prefs.starred.has(f.id) ? 0 : 1,
    prefs.pinned.has(f.competitionId) ? 0 : 1,
    rank(f.competitionId),
  ];
}

function cmp(a: number[], b: number[]): number {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
}

/**
 * The hero: a live fixture (starred → pinned → editorial), else the earliest upcoming kick-off
 * among equally preferred matches, else the latest completed result.
 */
export function pickHero(
  fixtures: HomeFixture[],
  now: Date,
  prefs: HomePrefs,
  rank: (id: number) => number,
): HomeFixture | null {
  const listed = fixtures.filter((f) => !SKIP.has(f.statusCode) && f.homeTeam && f.awayTeam);
  const live = listed.filter((f) => homeState(f, now) === 'live');
  if (live.length) {
    return live
      .slice()
      .sort(
        (a, b) => cmp(preference(a, prefs, rank), preference(b, prefs, rank)) || time(a) - time(b),
      )[0];
  }
  const upcoming = listed.filter((f) => homeState(f, now) === 'upcoming');
  if (upcoming.length) {
    // Most preferred group first, then the earliest kick-off within it.
    return upcoming
      .slice()
      .sort(
        (a, b) => cmp(preference(a, prefs, rank), preference(b, prefs, rank)) || time(a) - time(b),
      )[0];
  }
  const done = listed.filter((f) => homeState(f, now) === 'finished');
  return done.sort((a, b) => time(b) - time(a))[0] ?? null;
}

/**
 * Up to two upcoming cards besides the hero: one from the selected day and one from the following
 * matchday when available; otherwise filled from whichever has more.
 */
export function pickComingUp(
  fixtures: HomeFixture[],
  day: string,
  heroId: number | null,
  now: Date,
  limit = 2,
): HomeFixture[] {
  const upcoming = fixtures
    .filter(
      (f) =>
        f.id !== heroId &&
        !SKIP.has(f.statusCode) &&
        f.homeTeam &&
        f.awayTeam &&
        homeState(f, now) === 'upcoming',
    )
    .sort((a, b) => time(a) - time(b));
  const sameDay = upcoming.filter((f) => homeDayKey(f) === day);
  const nextKey = upcoming.map(homeDayKey).find((k) => k > day);
  const nextDay = nextKey ? upcoming.filter((f) => homeDayKey(f) === nextKey) : [];
  const picked: HomeFixture[] = [];
  if (sameDay[0]) picked.push(sameDay[0]);
  if (nextDay[0]) picked.push(nextDay[0]);
  for (const f of [...sameDay, ...nextDay]) {
    if (picked.length >= limit) break;
    if (!picked.includes(f)) picked.push(f);
  }
  return picked.slice(0, limit).sort((a, b) => time(a) - time(b));
}

export function filterHome(fixtures: HomeFixture[], filter: HomeFilter, now: Date): HomeFixture[] {
  if (filter === 'all') return fixtures;
  return fixtures.filter((f) => {
    const s = homeState(f, now);
    if (filter === 'live') return s === 'live';
    if (filter === 'upcoming') return s === 'upcoming';
    return s === 'finished' || s === 'interrupted';
  });
}

export interface HomeGroup {
  competitionId: number;
  fixtures: HomeFixture[];
}

/**
 * Every competition on the day, one group each: pinned competitions first, then the editorial
 * order (`rank`), then the competition's display priority, then id. Matches by kick-off.
 */
export function groupByCompetition(
  fixtures: HomeFixture[],
  pinned: ReadonlySet<number>,
  rank: (id: number) => number,
  priority: (id: number) => number,
): HomeGroup[] {
  const map = new Map<number, HomeFixture[]>();
  for (const f of fixtures) {
    const list = map.get(f.competitionId) ?? [];
    list.push(f);
    map.set(f.competitionId, list);
  }
  return [...map.entries()]
    .map(([competitionId, list]) => ({
      competitionId,
      fixtures: list.slice().sort((a, b) => time(a) - time(b) || a.id - b.id),
    }))
    .sort(
      (a, b) =>
        (pinned.has(a.competitionId) ? 0 : 1) - (pinned.has(b.competitionId) ? 0 : 1) ||
        rank(a.competitionId) - rank(b.competitionId) ||
        priority(a.competitionId) - priority(b.competitionId) ||
        a.competitionId - b.competitionId,
    );
}

/** Default league for "Live standings": one with a live match, else one playing that day. */
export function pickStandingsLeague(
  options: number[],
  dayFixtures: HomeFixture[],
  now: Date,
): number | null {
  const live = new Set(dayFixtures.filter((f) => isLive(f.statusCode)).map((f) => f.competitionId));
  const playing = new Set(dayFixtures.map((f) => f.competitionId));
  void now;
  return (
    options.find((id) => live.has(id)) ??
    options.find((id) => playing.has(id)) ??
    options[0] ??
    null
  );
}

/** Editorial rank from an ordered id list; unknown ids sort after it. */
export function rankFrom(order: readonly number[]): (id: number) => number {
  const at = new Map(order.map((id, i) => [id, i]));
  return (id) => at.get(id) ?? order.length + 1;
}
