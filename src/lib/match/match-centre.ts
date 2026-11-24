/**
 * Pure model for the match centre (template "DimaScore Match Events"): incidents, stat rows,
 * the line-ups pitch and the live table. No React and no clock reads, so the server render and
 * the client (live) render produce the same output from the same props.
 */
import type {
  LineupPlayer,
  MatchEvent,
  MatchLineup,
  MatchTeamStats,
} from '@/lib/db/queries/match-detail';
import { eventKind, isShootout, minuteKey, parseFormation, statNumber } from './match-view';

export type Side = 0 | 1;
export type Phase = 'upcoming' | 'live' | 'halftime' | 'finished' | 'interrupted';

// ── Incidents (Events tab, Key moments, header scorers, pitch badges) ─────────────────────

export type IncidentKind =
  | 'goal'
  | 'penaltyGoal'
  | 'ownGoal'
  | 'missedPenalty'
  | 'yellow'
  | 'secondYellow'
  | 'red'
  | 'sub'
  | 'var';

export interface Incident {
  key: string;
  minute: number;
  extra: number | null;
  /** Side the incident belongs to (the team credited with a goal, the team of a booked player). */
  side: Side;
  kind: IncidentKind;
  playerId: number | null;
  player: string | null;
  /** Assist (goals). */
  assist: string | null;
  /** Substitutions: the player coming on / going off. */
  inId: number | null;
  inName: string | null;
  outId: number | null;
  outName: string | null;
  /** VAR: the feed's decision text ("Goal cancelled", "Penalty confirmed"…). */
  detail: string | null;
  /** Score after a counted goal. */
  score: [number, number] | null;
}

export type IncidentFilter = 'all' | 'goals' | 'cards' | 'sub';

export const isGoal = (k: IncidentKind) => k === 'goal' || k === 'penaltyGoal' || k === 'ownGoal';
export const isCard = (k: IncidentKind) => k === 'yellow' || k === 'secondYellow' || k === 'red';

export function incidentFilter(k: IncidentKind): IncidentFilter | null {
  if (isGoal(k) || k === 'missedPenalty' || k === 'var') return 'goals';
  if (isCard(k)) return 'cards';
  if (k === 'sub') return 'sub';
  return null;
}

const nameOf = (n: { name: Record<string, string> } | null, locale: string) =>
  n ? (n.name[locale] ?? n.name.en ?? Object.values(n.name)[0] ?? null) : null;

/**
 * Events in chronological order as incidents. The substitution feed is not consistent about which
 * of `player` / `assist` is the incoming player, so the line-up decides: the incoming player is
 * the one listed among the substitutes. Shoot-out kicks are left out (they are not match events).
 */
export function buildIncidents(
  events: MatchEvent[],
  homeTeamId: number,
  lineups: MatchLineup[],
  locale: string,
): Incident[] {
  const bench = new Set<number>();
  for (const l of lineups) for (const p of l.substitutes) bench.add(p.id);
  const sorted = events
    .map((e, i) => ({ e, i }))
    .sort((a, b) => minuteKey(a.e) - minuteKey(b.e) || a.i - b.i)
    .map((x) => x.e);
  let h = 0;
  let a = 0;
  const out: Incident[] = [];
  for (const e of sorted) {
    if (isShootout(e)) continue;
    const k = eventKind(e);
    if (k === 'other') continue;
    const side: Side = e.teamId === homeTeamId ? 0 : 1;
    const base: Incident = {
      key: String(e.id),
      minute: e.minute,
      extra: e.extraMinute,
      side,
      kind: 'goal',
      playerId: e.player?.id ?? null,
      player: nameOf(e.player, locale),
      assist: null,
      inId: null,
      inName: null,
      outId: null,
      outName: null,
      detail: null,
      score: null,
    };
    if (k === 'goal' || k === 'penaltyGoal' || k === 'ownGoal') {
      if (side === 0) h++;
      else a++;
      out.push({
        ...base,
        kind: k,
        assist: k === 'goal' ? nameOf(e.assist, locale) : null,
        score: [h, a],
      });
    } else if (k === 'missedPenalty') {
      out.push({ ...base, kind: 'missedPenalty' });
    } else if (k === 'yellowCard' || k === 'secondYellow' || k === 'redCard') {
      out.push({
        ...base,
        kind: k === 'yellowCard' ? 'yellow' : k === 'secondYellow' ? 'secondYellow' : 'red',
      });
    } else if (k === 'substitution') {
      const p = e.player ? { id: e.player.id, name: nameOf(e.player, locale) } : null;
      const q = e.assist ? { id: e.assist.id, name: nameOf(e.assist, locale) } : null;
      // Default (current feed): player = going off, assist = coming on.
      let on = q;
      let off = p;
      if (p && bench.has(p.id) && !(q && bench.has(q.id))) {
        on = p;
        off = q;
      }
      out.push({
        ...base,
        kind: 'sub',
        playerId: on?.id ?? null,
        player: on?.name ?? null,
        inId: on?.id ?? null,
        inName: on?.name ?? null,
        outId: off?.id ?? null,
        outName: off?.name ?? null,
      });
    } else if (k === 'var') {
      out.push({ ...base, kind: 'var', detail: e.detail });
    }
  }
  return out;
}

export const minuteText = (i: Pick<Incident, 'minute' | 'extra'>) =>
  i.extra ? `${i.minute}+${i.extra}′` : `${i.minute}′`;

/** Goals per side for the header lines under the team names ("Neto 46′"). */
export function scorers(incidents: Incident[], side: Side): Incident[] {
  return incidents.filter((i) => isGoal(i.kind) && i.side === side);
}

// ── Stats ─────────────────────────────────────────────────────────────────────────────────

export type MetricKey =
  | 'xg'
  | 'shots'
  | 'onTarget'
  | 'corners'
  | 'possession'
  | 'passes'
  | 'accurate'
  | 'yellow'
  | 'reds';

export interface Metric {
  key: MetricKey;
  home: number;
  away: number;
  homeText: string;
  awayText: string;
  /** Home share of the bar in %, or null when both are 0 (the template draws no bar). */
  share: number | null;
}

export type MetricGroup = 'attack' | 'passing' | 'discipline';

const FEED: Record<Exclude<MetricKey, 'yellow' | 'reds'>, Parameters<typeof statNumber>[1]> = {
  xg: 'xg',
  shots: 'totalShots',
  onTarget: 'shotsOnTarget',
  corners: 'corners',
  possession: 'possession',
  passes: 'totalPasses',
  accurate: 'accuratePasses',
};

export const METRIC_GROUPS: Array<{ id: MetricGroup; keys: MetricKey[] }> = [
  { id: 'attack', keys: ['xg', 'shots', 'onTarget', 'corners'] },
  { id: 'passing', keys: ['possession', 'passes', 'accurate'] },
  { id: 'discipline', keys: ['yellow', 'reds'] },
];
export const KEY_METRICS: MetricKey[] = ['xg', 'shots', 'possession'];

function fmtMetric(key: MetricKey, n: number, numberLocale: string) {
  if (key === 'xg')
    return n.toLocaleString(numberLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${Math.round(n).toLocaleString(numberLocale)}${key === 'possession' ? '%' : ''}`;
}

/**
 * One stat row. Feed stats come from the team statistics; the discipline rows count the cards in
 * the events (as the template does), falling back to the feed totals when there are no events.
 * Null when the value is not known for either side (xG and possession need both sides).
 */
export function metric(
  key: MetricKey,
  stats: { home: MatchTeamStats | null; away: MatchTeamStats | null },
  incidents: Incident[] | null,
  numberLocale: string,
): Metric | null {
  let h: number | null;
  let a: number | null;
  if (key === 'yellow' || key === 'reds') {
    if (incidents && incidents.length > 0) {
      const count = (side: Side) =>
        incidents.filter(
          (i) =>
            i.side === side &&
            (key === 'yellow'
              ? i.kind === 'yellow'
              : i.kind === 'red' || i.kind === 'secondYellow'),
        ).length;
      h = count(0);
      a = count(1);
    } else {
      const feedKey = key === 'yellow' ? 'yellowCards' : 'redCards';
      h = stats.home ? statNumber(stats.home.stats, feedKey) : null;
      a = stats.away ? statNumber(stats.away.stats, feedKey) : null;
      if (h == null && a == null) return null;
    }
  } else {
    h = stats.home ? statNumber(stats.home.stats, FEED[key]) : null;
    a = stats.away ? statNumber(stats.away.stats, FEED[key]) : null;
    if (h == null && a == null) return null;
    if ((key === 'xg' || key === 'possession') && (h == null || a == null)) return null;
  }
  const hv = h ?? 0;
  const av = a ?? 0;
  const both = hv + av;
  return {
    key,
    home: hv,
    away: av,
    homeText: fmtMetric(key, hv, numberLocale),
    awayText: fmtMetric(key, av, numberLocale),
    share: both > 0 ? (100 * hv) / both : null,
  };
}

// ── Line-ups pitch ───────────────────────────────────────────────────────────────────────

export interface PitchPlayer {
  id: number;
  name: string;
  short: string;
  num: number | null;
  /** 0 keeper, 1 defender, 2 midfielder, 3 forward (null for substitutes). */
  role: 0 | 1 | 2 | 3 | null;
}

export interface PitchSide {
  formation: string;
  /** Starting XI ids in pitch order: row by row from the keeper, left to right. */
  xi: number[];
  /** Row sizes including the keeper row ([1, 4, 2, 3, 1]); null when no pitch can be drawn. */
  rows: number[] | null;
  bench: number[];
  players: Record<number, PitchPlayer>;
}

/** "A. Maitland-Niles" → "Maitland-Niles"; keeps one-word names. For the small pitch labels. */
export function shortName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return name;
  const last = parts[parts.length - 1];
  return last.length <= 3 ? parts.slice(-2).join(' ') : last;
}

const gridOf = (p: LineupPlayer) => {
  const m = /^(\d+):(\d+)$/.exec(p.grid ?? '');
  return m ? { line: Number(m[1]), col: Number(m[2]) } : null;
};

/**
 * Pitch order for one team. Uses the feed's "line:column" grid when every starter has one (line 1
 * is the keeper; columns run left to right as seen from the team's own goal), otherwise the
 * formation string in feed order. `rows` is null when neither adds up to the XI (the template
 * then lists the XI instead of drawing the pitch).
 */
export function pitchSide(l: MatchLineup): PitchSide {
  const players: Record<number, PitchPlayer> = {};
  const add = (p: Omit<LineupPlayer, 'grid'>, role: PitchPlayer['role']) => {
    players[p.id] = {
      id: p.id,
      name: p.name,
      short: shortName(p.name),
      num: Number.isFinite(p.number) ? p.number : null,
      role,
    };
  };
  const starters = l.starters;
  const grids = starters.map(gridOf);
  let xi: number[] = starters.map((p) => p.id);
  let rows: number[] | null = null;
  if (starters.length === 11 && grids.every(Boolean)) {
    const placed = starters
      .map((p, i) => ({ p, ...grids[i]! }))
      .sort((a, b) => a.line - b.line || a.col - b.col);
    const lines = [...new Set(placed.map((s) => s.line))];
    rows = lines.map((ln) => placed.filter((s) => s.line === ln).length);
    xi = placed.map((s) => s.p.id);
    for (const s of placed) {
      const line = lines.indexOf(s.line);
      add(s.p, line === 0 ? 0 : line === 1 ? 1 : line === lines.length - 1 ? 3 : 2);
    }
  } else {
    const shape = parseFormation(l.formation);
    if (starters.length === 11 && shape.reduce((s, n) => s + n, 0) === 10) {
      rows = [1, ...shape];
      let i = 0;
      rows.forEach((count, line) => {
        for (let c = 0; c < count; c++)
          add(starters[i++], line === 0 ? 0 : line === 1 ? 1 : line === rows!.length - 1 ? 3 : 2);
      });
    } else {
      for (const p of starters) add(p, null);
    }
  }
  for (const p of l.substitutes) if (!players[p.id]) add(p, null);
  const formation = l.formation ?? (rows && rows.length > 1 ? rows.slice(1).join('-') : '');
  return { formation, xi, rows, bench: l.substitutes.map((p) => p.id), players };
}

export type BadgeKind = 'goal' | 'own' | 'yellow' | 'red' | 'on' | 'off';

export interface HistoryEntry {
  kind: BadgeKind;
  minute: number;
  extra: number | null;
  /** Substitution partner id. */
  partner: number | null;
}

/** A player's incidents in order: goals (own goals included), cards and substitutions. */
export function playerHistory(incidents: Incident[], id: number): HistoryEntry[] {
  const out: HistoryEntry[] = [];
  for (const i of incidents) {
    const at = { minute: i.minute, extra: i.extra };
    if (i.kind === 'sub') {
      if (i.outId === id) out.push({ kind: 'off', ...at, partner: i.inId });
      else if (i.inId === id) out.push({ kind: 'on', ...at, partner: i.outId });
      continue;
    }
    if (i.playerId !== id) continue;
    if (i.kind === 'goal' || i.kind === 'penaltyGoal')
      out.push({ kind: 'goal', ...at, partner: null });
    else if (i.kind === 'ownGoal') out.push({ kind: 'own', ...at, partner: null });
    else if (i.kind === 'yellow') out.push({ kind: 'yellow', ...at, partner: null });
    else if (i.kind === 'red' || i.kind === 'secondYellow')
      out.push({ kind: 'red', ...at, partner: null });
  }
  return out;
}

export interface PitchSlot {
  id: number;
  dismissed: boolean;
}

/**
 * The XI slots; in the "On pitch" view each substitution replaces the player who went off and a
 * red card leaves the slot vacant (template rule).
 */
export function pitchSlots(side: PitchSide, incidents: Incident[], onPitch: boolean): PitchSlot[] {
  const slots = side.xi.map((id) => ({ id, dismissed: false }));
  if (!onPitch) return slots;
  for (const i of incidents) {
    if (i.kind === 'sub' && i.outId != null && i.inId != null) {
      const s = slots.find((x) => x.id === i.outId && !x.dismissed);
      if (s) s.id = i.inId;
    }
    if ((i.kind === 'red' || i.kind === 'secondYellow') && i.playerId != null) {
      const s = slots.find((x) => x.id === i.playerId);
      if (s) s.dismissed = true;
    }
  }
  return slots;
}

/** Template pitch geometry: x = (col + .5) · 100 / count %, y = 91 − 82 · line / (rows − 1) %. */
export function slotPosition(rows: number[], index: number) {
  let line = 0;
  let pos = index;
  while (line < rows.length && pos >= rows[line]) {
    pos -= rows[line];
    line++;
  }
  const count = rows[line] ?? 1;
  return {
    line,
    x: ((pos + 0.5) * 100) / count,
    y: 91 - (82 * line) / Math.max(1, rows.length - 1),
    cell: 97 / count,
  };
}

// ── Table ────────────────────────────────────────────────────────────────────────────────

export interface TableTeam {
  teamId: number;
  name: string;
  logo: string | null;
  href: string | null;
}

export interface TableBase extends TableTeam {
  rank: number;
  played: number;
  goalDiff: number;
  points: number;
}

export interface TableResult {
  homeTeamId: number;
  awayTeamId: number;
  homeScore: number;
  awayScore: number;
}

export interface LiveFixture extends TableResult {
  fixtureId: number;
}

export type TableScope = 'overall' | 'home' | 'away';

export interface TableRow extends TableTeam {
  played: number;
  goalDiff: number;
  points: number;
  /** Live score from this club's side ([for, against]) while one of its matches is in play. */
  live: [number, number] | null;
}

/**
 * Table rows for a scope. Overall starts from the provider table (which only counts finished
 * matches) and adds every fixture still in play; Home and Away are built from the finished
 * results of this group plus the live fixtures. Sorted by points, goal difference, then the
 * provider rank.
 */
export function tableRows(
  base: TableBase[],
  results: TableResult[],
  live: LiveFixture[],
  scope: TableScope,
): TableRow[] {
  const rows = new Map<number, TableRow & { order: number; gf: number }>();
  for (const b of base) {
    rows.set(b.teamId, {
      teamId: b.teamId,
      name: b.name,
      logo: b.logo,
      href: b.href,
      played: scope === 'overall' ? b.played : 0,
      goalDiff: scope === 'overall' ? b.goalDiff : 0,
      points: scope === 'overall' ? b.points : 0,
      live: null,
      order: b.rank,
      gf: 0,
    });
  }
  const apply = (f: TableResult, isLive: boolean) => {
    for (const [teamId, which, gf, ga] of [
      [f.homeTeamId, 'home', f.homeScore, f.awayScore],
      [f.awayTeamId, 'away', f.awayScore, f.homeScore],
    ] as const) {
      const r = rows.get(teamId);
      if (!r) continue;
      if (isLive) r.live = [gf, ga];
      if (scope !== 'overall' && scope !== which) continue;
      r.played += 1;
      r.goalDiff += gf - ga;
      r.gf += gf;
      r.points += gf > ga ? 3 : gf === ga ? 1 : 0;
    }
  };
  if (scope !== 'overall') for (const f of results) apply(f, false);
  for (const f of live) apply(f, true);
  const keepProviderOrder = scope === 'overall' && live.length === 0;
  return [...rows.values()]
    .sort((x, y) =>
      keepProviderOrder
        ? x.order - y.order
        : y.points - x.points || y.goalDiff - x.goalDiff || y.gf - x.gf || x.order - y.order,
    )
    .map((r) => ({
      teamId: r.teamId,
      name: r.name,
      logo: r.logo,
      href: r.href,
      played: r.played,
      goalDiff: r.goalDiff,
      points: r.points,
      live: r.live,
    }));
}
