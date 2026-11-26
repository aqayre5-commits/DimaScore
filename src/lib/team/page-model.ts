/**
 * Pure helpers for the redesigned team page (Arsenal / France references): the season window,
 * squad positions and the per-competition player tallies built from match sheets.
 */
import type { TeamLineupPlayer, TeamMatchEvent } from '@/lib/db/queries/team-page';

export type SquadPosition = 'GK' | 'DF' | 'MF' | 'FW';
export const SQUAD_POSITIONS: readonly SquadPosition[] = ['GK', 'DF', 'MF', 'FW'];
export const TALLY_METRICS = ['goals', 'assists', 'apps', 'starts', 'yellow', 'red'] as const;
export type TallyMetric = (typeof TALLY_METRICS)[number];

export function squadPosition(pos: string | null | undefined): SquadPosition | null {
  const p = (pos ?? '').trim().toLowerCase();
  if (!p) return null;
  if (p === 'g' || p.startsWith('goal')) return 'GK';
  if (p === 'd' || p.startsWith('def')) return 'DF';
  if (p === 'm' || p.startsWith('mid')) return 'MF';
  if (p === 'f' || p === 'a' || p.startsWith('att') || p.startsWith('for')) return 'FW';
  return null;
}

/**
 * The team's current season: the season of the latest fixture already played, moved on to the
 * next fixture's season when that one starts a newer season (summer rollover).
 */
export function currentSeasonOf(
  fixtures: { kickoffAt: Date | string; seasonYear: number }[],
  now: number,
): number | null {
  let past: number | null = null;
  let next: number | null = null;
  for (const f of fixtures) {
    const t = new Date(f.kickoffAt).getTime();
    if (t <= now) past = f.seasonYear;
    else if (next == null) next = f.seasonYear;
  }
  if (past == null) return next;
  if (next != null && next > past) return next;
  return past;
}

export interface PlayerTally {
  /** Stable key: the player id, or the name when the feed has no id. */
  key: string;
  playerId: number | null;
  name: string;
  competitionId: number;
  goals: number;
  assists: number;
  apps: number;
  starts: number;
  yellow: number;
  red: number;
}

/**
 * Per-competition tallies from the team's finished matches: goals (own goals and missed
 * penalties excluded), assists, cards, starts (XI) and appearances (XI + substitutes who came on).
 */
export function buildTallies(
  teamId: number,
  matches: { id: number; competitionId: number | null }[],
  events: TeamMatchEvent[],
  lineups: { fixtureId: number; starters: TeamLineupPlayer[]; substitutes: TeamLineupPlayer[] }[],
  nameOf: (id: number) => string | null,
): PlayerTally[] {
  const compOf = new Map(matches.map((m) => [m.id, m.competitionId ?? 0]));
  const lineupOf = new Map(lineups.map((l) => [l.fixtureId, l]));
  const names = new Map<number, string>();
  for (const l of lineups)
    for (const p of [...l.starters, ...l.substitutes])
      if (p.id != null && p.name) names.set(p.id, p.name);
  const tallies = new Map<string, PlayerTally>();
  const bump = (fixtureId: number, playerId: number | null, metric: TallyMetric) => {
    if (playerId == null) return;
    const comp = compOf.get(fixtureId);
    if (comp == null) return;
    const name = nameOf(playerId) ?? names.get(playerId);
    if (!name) return;
    const key = `${comp}:${playerId}`;
    let t = tallies.get(key);
    if (!t) {
      t = {
        key: String(playerId),
        playerId,
        name,
        competitionId: comp,
        goals: 0,
        assists: 0,
        apps: 0,
        starts: 0,
        yellow: 0,
        red: 0,
      };
      tallies.set(key, t);
    }
    t[metric] += 1;
  };
  for (const m of matches) {
    const l = lineupOf.get(m.id);
    if (!l) continue;
    for (const p of l.starters) {
      bump(m.id, p.id, 'starts');
      bump(m.id, p.id, 'apps');
    }
  }
  for (const e of events) {
    if (e.teamId !== teamId || !compOf.has(e.fixtureId)) continue;
    const detail = (e.detail ?? '').toLowerCase();
    if (e.type === 'Goal') {
      if (detail.includes('own') || detail.includes('missed')) continue;
      bump(e.fixtureId, e.playerId, 'goals');
      bump(e.fixtureId, e.assistPlayerId, 'assists');
    } else if (e.type === 'Card') {
      if (detail.includes('red')) bump(e.fixtureId, e.playerId, 'red');
      else if (detail.includes('yellow')) bump(e.fixtureId, e.playerId, 'yellow');
    } else if (e.type === 'subst') {
      // The feed is not consistent about which side is "in": the one on the bench came on.
      const bench = new Set((lineupOf.get(e.fixtureId)?.substitutes ?? []).map((p) => p.id));
      const on = bench.has(e.playerId)
        ? e.playerId
        : bench.has(e.assistPlayerId)
          ? e.assistPlayerId
          : null;
      bump(e.fixtureId, on, 'apps');
    }
  }
  return [...tallies.values()];
}

/** Ranked list for one metric over one competition (or all), competition ranking (1, 2, 2, 4). */
export function rankTallies(
  tallies: PlayerTally[],
  competitionId: number | 'all',
  metric: TallyMetric,
): { key: string; playerId: number | null; name: string; value: number; rank: number }[] {
  const sum = new Map<
    string,
    { key: string; playerId: number | null; name: string; value: number }
  >();
  for (const t of tallies) {
    if (competitionId !== 'all' && t.competitionId !== competitionId) continue;
    if (!t[metric]) continue;
    const cur = sum.get(t.key) ?? { key: t.key, playerId: t.playerId, name: t.name, value: 0 };
    cur.value += t[metric];
    sum.set(t.key, cur);
  }
  const list = [...sum.values()].sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
  let prev = -1;
  let rank = 0;
  return list.map((x, i) => {
    if (x.value !== prev) rank = i + 1;
    prev = x.value;
    return { ...x, rank };
  });
}

/** "Haaland 12′, 45+2′" lines for the hero, per team. */
export function scorerLines(
  events: TeamMatchEvent[],
  fixtureId: number,
  teamId: number | null,
  opponentId: number | null,
  nameOf: (id: number) => string | null,
): string[] {
  const by = new Map<string, string[]>();
  for (const e of events) {
    if (e.fixtureId !== fixtureId || e.type !== 'Goal') continue;
    const detail = (e.detail ?? '').toLowerCase();
    if (detail.includes('missed')) continue;
    const own = detail.includes('own');
    // An own goal is listed under the team it counted for.
    const side = own ? (e.teamId === teamId ? opponentId : teamId) : e.teamId;
    if (side !== teamId || e.playerId == null) continue;
    const full = nameOf(e.playerId);
    if (!full) continue;
    const name = full.split(' ').at(-1) ?? full;
    const minute = `${e.minute ?? ''}${e.extraMinute ? `+${e.extraMinute}` : ''}\u2032${own ? ' (OG)' : ''}`;
    by.set(name, [...(by.get(name) ?? []), minute]);
  }
  return [...by].map(([n, mins]) => `${n} ${mins.join(', ')}`);
}
