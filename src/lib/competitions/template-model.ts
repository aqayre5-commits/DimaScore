import type { FixtureWithTeams, StandingRow } from '@/lib/db/queries';
import { isLive, getMatchState } from '@/lib/match-status';
import { overlayLiveStandings } from '@/lib/standings/overlay-live';
import { applyResult } from '@/lib/standings/apply-result';
import { toSiteDateKey, SITE_TZ } from '@/lib/utils/date';
import type { Locale } from '@/lib/i18n/config';

const FINISHED = new Set(['FT', 'AET', 'PEN', 'WO', 'AWD']);
const SKIP = new Set(['PST', 'CANC', 'ABD']);

export type TableSplit = 'overall' | 'home' | 'away';
export type FixtureFilter = 'all' | 'upcoming' | 'results';

export function asDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

export function fixtureDayKey(fixture: { kickoffAt: Date | string }, timeZone = SITE_TZ): string {
  return toSiteDateKey(asDate(fixture.kickoffAt), timeZone);
}

export function isFinishedStatus(statusCode: string): boolean {
  return FINISHED.has(statusCode);
}

export function isListedFixture(statusCode: string): boolean {
  return !SKIP.has(statusCode);
}

/** Two or three key pairings: live/today first, then the next dates. */
export function pickKeyMatches<T extends FixtureWithTeams>(fixtures: T[], limit = 3, now = new Date()): T[] {
  const today = toSiteDateKey(now);
  const listed = fixtures
    .filter((f) => isListedFixture(f.statusCode) && f.homeTeam && f.awayTeam)
    .slice()
    .sort((a, b) => asDate(a.kickoffAt).getTime() - asDate(b.kickoffAt).getTime());

  const live = listed.filter((f) => isLive(f.statusCode));
  const todayRest = listed.filter(
    (f) => fixtureDayKey(f) === today && !isLive(f.statusCode) && !isFinishedStatus(f.statusCode),
  );
  const later = listed.filter(
    (f) => fixtureDayKey(f) > today && !isFinishedStatus(f.statusCode) && !isLive(f.statusCode),
  );
  const picked: T[] = [];
  const seen = new Set<string>();
  for (const f of [...live, ...todayRest, ...later]) {
    const key = [f.homeTeamId, f.awayTeamId].sort().join('-');
    if (seen.has(key)) continue;
    seen.add(key);
    picked.push(f);
    if (picked.length >= limit) break;
  }
  return picked;
}

/** Featured match: a live game if one exists, else the next kick-off, else the latest result. */
export function pickFeaturedMatch<T extends FixtureWithTeams>(fixtures: T[], now = new Date()): T | null {
  const listed = fixtures.filter((f) => isListedFixture(f.statusCode) && f.homeTeam && f.awayTeam);
  const live = listed.filter((f) => isLive(f.statusCode));
  if (live.length > 0) {
    return live.slice().sort((a, b) => asDate(a.kickoffAt).getTime() - asDate(b.kickoffAt).getTime())[0];
  }
  const upcoming = listed
    .filter((f) => !isFinishedStatus(f.statusCode) && asDate(f.kickoffAt).getTime() >= now.getTime() - 15 * 60_000)
    .sort((a, b) => asDate(a.kickoffAt).getTime() - asDate(b.kickoffAt).getTime());
  if (upcoming[0]) return upcoming[0];
  const finished = listed
    .filter((f) => isFinishedStatus(f.statusCode))
    .sort((a, b) => asDate(b.kickoffAt).getTime() - asDate(a.kickoffAt).getTime());
  return finished[0] ?? null;
}

export function uniqueDayKeys(fixtures: FixtureWithTeams[]): string[] {
  const keys = new Set<string>();
  for (const f of fixtures) {
    if (!isListedFixture(f.statusCode)) continue;
    keys.add(fixtureDayKey(f));
  }
  return [...keys].sort();
}

export function defaultDayKey(fixtures: FixtureWithTeams[], now = new Date()): string {
  const today = toSiteDateKey(now);
  const keys = uniqueDayKeys(fixtures);
  if (keys.includes(today)) return today;
  const next = keys.find((k) => k >= today);
  return next ?? keys[keys.length - 1] ?? today;
}

export interface MatchweekOption {
  roundNumber: number;
  round: string;
  rangeLabel: string;
  openLabel: string;
  fixtureIds: number[];
}

const DATE_LOCALE: Record<Locale, string> = { fr: 'fr-FR', en: 'en-GB', ar: 'ar-MA' };

function formatRange(keys: string[], locale: Locale): string {
  if (keys.length === 0) return '';
  const intl = DATE_LOCALE[locale] ?? 'en-GB';
  const fmt = (key: string, withMonth: boolean) =>
    new Intl.DateTimeFormat(intl, {
      day: 'numeric',
      month: withMonth ? 'short' : undefined,
    }).format(new Date(key + 'T12:00:00Z'));
  const first = keys[0];
  const last = keys[keys.length - 1];
  if (first === last) return fmt(first, true);
  const sameMonth = first.slice(0, 7) === last.slice(0, 7);
  return sameMonth ? `${fmt(first, false)}–${fmt(last, true)}` : `${fmt(first, true)} – ${fmt(last, true)}`;
}

export function buildMatchweekOptions(
  fixtures: FixtureWithTeams[],
  rounds: { roundNumber: number; round: string }[],
  locale: Locale,
  matchweekWord: (n: number, round: string) => string,
): MatchweekOption[] {
  return rounds
    .map((r) => {
      const inRound = fixtures.filter(
        (f) => isListedFixture(f.statusCode) && (f.roundNumber === r.roundNumber || f.round === r.round),
      );
      const keys = uniqueDayKeys(inRound);
      const rangeLabel = formatRange(keys, locale);
      return {
        roundNumber: r.roundNumber,
        round: r.round,
        rangeLabel,
        openLabel: rangeLabel ? `${matchweekWord(r.roundNumber, r.round)} · ${rangeLabel}` : matchweekWord(r.roundNumber, r.round),
        fixtureIds: inRound.map((f) => f.id),
      };
    })
    .filter((opt) => opt.fixtureIds.length > 0 || rounds.length <= 1);
}

export function filterFixtures(
  fixtures: FixtureWithTeams[],
  filter: FixtureFilter,
  now = new Date(),
): FixtureWithTeams[] {
  return fixtures.filter((f) => {
    if (!isListedFixture(f.statusCode)) return filter === 'all';
    const state = getMatchState(f.statusCode, asDate(f.kickoffAt), now);
    if (filter === 'upcoming') return state === 'live' || state === 'upcoming';
    if (filter === 'results') return state === 'finished' || state === 'interrupted';
    return true;
  });
}

export function groupFixturesByDay(fixtures: FixtureWithTeams[]): { key: string; fixtures: FixtureWithTeams[] }[] {
  const map = new Map<string, FixtureWithTeams[]>();
  const order: string[] = [];
  for (const f of fixtures.slice().sort((a, b) => asDate(a.kickoffAt).getTime() - asDate(b.kickoffAt).getTime())) {
    const key = fixtureDayKey(f);
    if (!map.has(key)) {
      map.set(key, []);
      order.push(key);
    }
    map.get(key)!.push(f);
  }
  return order.map((key) => ({ key, fixtures: map.get(key)! }));
}

function blankRow(row: StandingRow): StandingRow {
  return {
    ...row,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDiff: 0,
    points: 0,
    form: null,
    rank: 0,
  };
}

/** Overall uses the official table plus a live overlay. Home/Away are rebuilt from fixtures. */
export function standingsForSplit(
  rows: StandingRow[],
  fixtures: FixtureWithTeams[],
  split: TableSplit,
): { rows: StandingRow[]; liveTeamIds: Set<number> } {
  if (split === 'overall') {
    return overlayLiveStandings(rows, fixtures);
  }

  const clone = rows.map(blankRow);
  const byTeam = new Map<number, StandingRow>();
  for (const r of clone) if (r.teamId != null) byTeam.set(r.teamId, r);
  const liveTeamIds = new Set<number>();

  const countable = fixtures.filter((f) => {
    if (f.homeTeamId == null || f.awayTeamId == null) return false;
    if (f.homeScore == null || f.awayScore == null) return false;
    return isFinishedStatus(f.statusCode) || isLive(f.statusCode);
  });

  for (const f of countable.slice().sort((a, b) => asDate(a.kickoffAt).getTime() - asDate(b.kickoffAt).getTime())) {
    const home = byTeam.get(f.homeTeamId!);
    const away = byTeam.get(f.awayTeamId!);
    if (split === 'home' && home) applyResult(home, f.homeScore!, f.awayScore!);
    if (split === 'away' && away) applyResult(away, f.awayScore!, f.homeScore!);
    if (isLive(f.statusCode)) {
      if (split === 'home' && home) liveTeamIds.add(f.homeTeamId!);
      if (split === 'away' && away) liveTeamIds.add(f.awayTeamId!);
    }
  }

  clone.sort(
    (a, b) =>
      (b.points ?? 0) - (a.points ?? 0) ||
      (b.goalDiff ?? 0) - (a.goalDiff ?? 0) ||
      (b.goalsFor ?? 0) - (a.goalsFor ?? 0),
  );
  clone.forEach((r, i) => {
    r.rank = i + 1;
  });
  return { rows: clone, liveTeamIds };
}

/** Live score from this club's perspective, e.g. "LIVE 0-1". */
export function liveScoreLabel(
  teamId: number,
  fixtures: FixtureWithTeams[],
): string | null {
  const f = fixtures.find(
    (x) =>
      isLive(x.statusCode) &&
      x.homeScore != null &&
      x.awayScore != null &&
      (x.homeTeamId === teamId || x.awayTeamId === teamId),
  );
  if (!f || f.homeScore == null || f.awayScore == null) return null;
  const scored = f.homeTeamId === teamId ? f.homeScore : f.awayScore;
  const conceded = f.homeTeamId === teamId ? f.awayScore : f.homeScore;
  return `LIVE ${scored}-${conceded}`;
}

export function uniqueGroups(rows: StandingRow[]): string[] {
  const labels = [...new Set(rows.map((r) => r.groupLabel).filter(Boolean))];
  return labels.filter((g) => !/^league$/i.test(g));
}
