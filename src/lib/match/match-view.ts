/**
 * Pure view helpers for the match page (header, Overview, Events, Stats, Line-ups, Table).
 * No React, no clock reads: everything is derived from the props passed in, so the same
 * output renders on the server and the client.
 */
import type {
  LineupPlayer,
  MatchEvent,
  MatchTeamStats,
  StatEntry,
} from '@/lib/db/queries/match-detail';

// ── Events ──────────────────────────────────────────────────────────────────

export type EventKind =
  | 'goal'
  | 'penaltyGoal'
  | 'ownGoal'
  | 'missedPenalty'
  | 'yellowCard'
  | 'secondYellow'
  | 'redCard'
  | 'substitution'
  | 'var'
  | 'other';

export type EventFilter = 'all' | 'goals' | 'cards' | 'subs';

export function eventKind(e: Pick<MatchEvent, 'type' | 'detail'>): EventKind {
  const type = (e.type ?? '').toLowerCase();
  const detail = (e.detail ?? '').toLowerCase();
  if (type === 'goal') {
    if (detail.includes('missed')) return 'missedPenalty';
    if (detail.includes('own goal')) return 'ownGoal';
    if (detail.includes('penalty')) return 'penaltyGoal';
    return 'goal';
  }
  if (type === 'card') {
    if (detail.includes('second yellow')) return 'secondYellow';
    if (detail.includes('red')) return 'redCard';
    return 'yellowCard';
  }
  if (type === 'subst') return 'substitution';
  if (type === 'var') return 'var';
  return 'other';
}

export const isGoalKind = (k: EventKind) => k === 'goal' || k === 'penaltyGoal' || k === 'ownGoal';
export const isCardKind = (k: EventKind) =>
  k === 'yellowCard' || k === 'secondYellow' || k === 'redCard';

/** Which filter chip(s) an event belongs to (besides "all"). */
export function eventGroup(k: EventKind): EventFilter | null {
  if (isGoalKind(k) || k === 'missedPenalty') return 'goals';
  if (isCardKind(k)) return 'cards';
  if (k === 'substitution') return 'subs';
  return null;
}

/** Shoot-out kicks are logged as goal events; they never change the match score. */
export const isShootout = (e: Pick<MatchEvent, 'comments'>) => /shoot-?out/i.test(e.comments ?? '');

/** Minute sort key: 45+2 sorts after 45 and before 46. */
export const minuteKey = (e: Pick<MatchEvent, 'minute' | 'extraMinute'>) =>
  e.minute * 100 + (e.extraMinute ?? 0);

export function minuteLabel(e: Pick<MatchEvent, 'minute' | 'extraMinute'>): string {
  return e.extraMinute ? `${e.minute}+${e.extraMinute}′` : `${e.minute}′`;
}

/** Events in chronological order (stable for equal minutes: feed order). */
export function chronological<T extends Pick<MatchEvent, 'minute' | 'extraMinute'>>(
  events: T[],
): T[] {
  return events
    .map((e, i) => ({ e, i }))
    .sort((a, b) => minuteKey(a.e) - minuteKey(b.e) || a.i - b.i)
    .map((x) => x.e);
}

/**
 * Running score after each goal, keyed by event id. The feed puts an own goal on the team that
 * is credited with it (checked against final scores), so every goal counts for `event.teamId`.
 */
export function runningScores(
  events: MatchEvent[],
  homeTeamId: number,
): Map<number, [number, number]> {
  const out = new Map<number, [number, number]>();
  let h = 0;
  let a = 0;
  for (const e of chronological(events)) {
    if (!isGoalKind(eventKind(e)) || isShootout(e)) continue;
    if (e.teamId === homeTeamId) h++;
    else a++;
    out.set(e.id, [h, a]);
  }
  return out;
}

/** Goals, missed penalties and cards, newest first. */
export function keyMoments(events: MatchEvent[]): MatchEvent[] {
  return chronological(events)
    .filter((e) => {
      const k = eventKind(e);
      return (isGoalKind(k) || k === 'missedPenalty' || isCardKind(k)) && !isShootout(e);
    })
    .reverse();
}

// ── Stats ───────────────────────────────────────────────────────────────────

export type StatKey =
  | 'xg'
  | 'totalShots'
  | 'shotsOnTarget'
  | 'shotsOffTarget'
  | 'blockedShots'
  | 'shotsInsideBox'
  | 'shotsOutsideBox'
  | 'corners'
  | 'possession'
  | 'totalPasses'
  | 'accuratePasses'
  | 'passAccuracy'
  | 'saves'
  | 'fouls'
  | 'offsides'
  | 'yellowCards'
  | 'redCards';

const FEED_TYPE: Record<StatKey, string[]> = {
  xg: ['expected_goals', 'Expected Goals', 'expected goals'],
  totalShots: ['Total Shots'],
  shotsOnTarget: ['Shots on Goal'],
  shotsOffTarget: ['Shots off Goal'],
  blockedShots: ['Blocked Shots'],
  shotsInsideBox: ['Shots insidebox'],
  shotsOutsideBox: ['Shots outsidebox'],
  corners: ['Corner Kicks'],
  possession: ['Ball Possession'],
  totalPasses: ['Total passes'],
  accuratePasses: ['Passes accurate'],
  passAccuracy: ['Passes %'],
  saves: ['Goalkeeper Saves'],
  fouls: ['Fouls'],
  offsides: ['Offsides'],
  yellowCards: ['Yellow Cards'],
  redCards: ['Red Cards'],
};

/** Numeric value of a feed stat ("60%" → 60, "1.54" → 1.54); null when absent. */
export function statNumber(stats: StatEntry[], key: StatKey): number | null {
  for (const type of FEED_TYPE[key]) {
    const v = stats.find((s) => s.type === type)?.value;
    if (v == null || v === '') continue;
    const n = typeof v === 'number' ? v : parseFloat(String(v).replace('%', ''));
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export interface StatRow {
  key: StatKey;
  home: number;
  away: number;
  /** Displayed values ("60%", "1.54", "12"). */
  homeText: string;
  awayText: string;
  /** Home share of the bar, 0..1 (0.5 when both are 0). */
  homeShare: number;
  bar: boolean;
}

function fmt(key: StatKey, n: number): string {
  if (key === 'possession' || key === 'passAccuracy') return `${Math.round(n)}%`;
  if (key === 'xg') return n.toFixed(2);
  return String(Math.round(n));
}

/**
 * A stat row for both teams. Hidden (null) when neither team has the value. Counting stats
 * that are missing for one side count as 0 (the feed omits zero values); xG and the ratios do
 * not, because a missing xG is not 0.
 */
export function statRow(
  home: StatEntry[],
  away: StatEntry[],
  key: StatKey,
  bar: boolean,
): StatRow | null {
  let h = statNumber(home, key);
  let a = statNumber(away, key);
  if (key === 'passAccuracy') {
    // Derive from accurate/total when the feed left the percentage out.
    const derive = (s: StatEntry[]) => {
      const acc = statNumber(s, 'accuratePasses');
      const tot = statNumber(s, 'totalPasses');
      return acc != null && tot ? (acc / tot) * 100 : null;
    };
    h ??= derive(home);
    a ??= derive(away);
  }
  if (h == null && a == null) return null;
  const strict = key === 'xg' || key === 'possession' || key === 'passAccuracy';
  if (strict && (h == null || a == null)) return null;
  const hv = h ?? 0;
  const av = a ?? 0;
  const total = hv + av;
  return {
    key,
    home: hv,
    away: av,
    homeText: fmt(key, hv),
    awayText: fmt(key, av),
    homeShare: total > 0 ? hv / total : 0.5,
    bar,
  };
}

export const KEY_STATS: StatKey[] = ['xg', 'totalShots', 'shotsOnTarget', 'possession'];

/** The mockup's Match statistics rows: Attack (bars) and Passing (plain), nothing else. */
export const STAT_GROUPS: Array<{
  id: 'attack' | 'passing';
  rows: Array<[StatKey, boolean]>;
}> = [
  {
    id: 'attack',
    rows: [
      ['xg', true],
      ['totalShots', true],
      ['shotsOnTarget', true],
      ['corners', true],
    ],
  },
  {
    id: 'passing',
    rows: [
      ['possession', false],
      ['totalPasses', false],
      ['accuratePasses', false],
    ],
  },
];

export function statGroups(home: MatchTeamStats, away: MatchTeamStats) {
  return STAT_GROUPS.map((g) => ({
    id: g.id,
    rows: g.rows
      .map(([key, bar]) => statRow(home.stats, away.stats, key, bar))
      .filter((r): r is StatRow => r != null),
  })).filter((g) => g.rows.length > 0);
}

export function keyStatRows(home: MatchTeamStats, away: MatchTeamStats): StatRow[] {
  return KEY_STATS.map((k) => statRow(home.stats, away.stats, k, true)).filter(
    (r): r is StatRow => r != null,
  );
}

// ── Line-ups ────────────────────────────────────────────────────────────────

export interface PitchSpot {
  player: LineupPlayer;
  /** 0..100 from the left edge. */
  x: number;
  /** 0..100 from the top edge; the goalkeeper is at the bottom, attackers at the top. */
  y: number;
  isKeeper: boolean;
}

function parseGrid(grid: string | null): { line: number; col: number } | null {
  const m = /^(\d+):(\d+)$/.exec(grid ?? '');
  return m ? { line: Number(m[1]), col: Number(m[2]) } : null;
}

export function parseFormation(formation: string | null): number[] {
  return (formation ?? '')
    .split('-')
    .map((s) => parseInt(s, 10))
    .filter((n) => Number.isFinite(n) && n > 0);
}

/**
 * Vertical pitch positions for one team's starters. Uses the feed's "line:column" grid when every
 * starter has one (line 1 = goalkeeper), otherwise lays the XI out by the formation string in the
 * feed's player order. Returns [] when neither is usable.
 */
export function pitchSpots(starters: LineupPlayer[], formation: string | null): PitchSpot[] {
  const grids = starters.map((p) => parseGrid(p.grid));
  let placed: Array<{ p: LineupPlayer; line: number; col: number }>;
  if (starters.length > 0 && grids.every(Boolean)) {
    placed = starters.map((p, i) => ({ p, line: grids[i]!.line, col: grids[i]!.col }));
  } else {
    const rows = parseFormation(formation);
    if (rows.reduce((s, n) => s + n, 0) + 1 !== starters.length) return [];
    placed = [];
    let i = 0;
    placed.push({ p: starters[i++], line: 1, col: 1 });
    rows.forEach((count, r) => {
      for (let c = 1; c <= count; c++) placed.push({ p: starters[i++], line: r + 2, col: c });
    });
  }
  const lines = Math.max(...placed.map((s) => s.line));
  const colsIn = new Map<number, number>();
  for (const s of placed) colsIn.set(s.line, Math.max(colsIn.get(s.line) ?? 0, s.col));
  return placed.map(({ p, line, col }) => {
    const cols = colsIn.get(line) ?? 1;
    // As in the mockup: goalkeeper at 91% from the top (inside the box), the furthest line at 12%;
    // three or more players spread to the touchlines, a pair sits at the thirds.
    const y = lines > 1 ? 91 - ((line - 1) / (lines - 1)) * 79 : 50;
    const x = (cols <= 2 ? col / (cols + 1) : (col - 0.5) / cols) * 100;
    return { player: p, x, y, isKeeper: line === 1 };
  });
}

/** "A. Maitland-Niles" → "Maitland-Niles"; keeps one-word names. For the small pitch labels. */
export function shortPlayerName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return name;
  const last = parts[parts.length - 1];
  return last.length <= 3 && parts.length > 1 ? parts.slice(-2).join(' ') : last;
}

// ── Header / Overview ───────────────────────────────────────────────────────

/** "Regular Season - 7" → 7 (a league matchweek); null for other rounds. */
export function matchweekNumber(round: string | null | undefined): number | null {
  const m = /^Regular Season\s*-\s*(\d+)$/i.exec((round ?? '').trim());
  return m ? Number(m[1]) : null;
}

export type SummaryState = 'upcoming' | 'live' | 'halfTime' | 'finished';

export interface SummaryInput {
  state: SummaryState;
  locale: string;
  home: string;
  away: string;
  stats: { home: StatEntry[]; away: StatEntry[] } | null;
}

const WORDS: Record<string, string[]> = {
  en: ['none', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'],
  fr: ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix'],
};
const word = (n: number, locale: string) => WORDS[locale]?.[n] ?? String(n);

/**
 * The mockup's summary: two short plain sentences from the shot counts, e.g. "City have taken
 * nine shots to Fulham's two. Both sides have put two on target." Null before kick-off or when
 * the feed has no shot counts (the card is then hidden).
 */
export function matchSummary(input: SummaryInput): string | null {
  const { state, locale, home, away, stats } = input;
  if (state === 'upcoming' || !stats) return null;
  const sh = statNumber(stats.home, 'totalShots');
  const sa = statNumber(stats.away, 'totalShots');
  const oh = statNumber(stats.home, 'shotsOnTarget');
  const oa = statNumber(stats.away, 'shotsOnTarget');
  if (sh == null || sa == null) return null;
  const past = state === 'finished';
  const target = oh != null && oa != null;
  if (locale === 'ar') {
    const first = `عدد التسديدات ${sh} لـ${home} مقابل ${sa} لـ${away}.`;
    if (!target) return first;
    if (oh === 0 && oa === 0) return `${first} ولم يسدّد أي فريق على المرمى.`;
    return oh === oa
      ? `${first} وسدّد كل فريق ${oh} على المرمى.`
      : `${first} وعلى المرمى: ${oh} لـ${home} مقابل ${oa} لـ${away}.`;
  }
  if (locale === 'fr') {
    const first = `${home} a tenté ${word(sh, 'fr')} tir${sh === 1 ? '' : 's'} contre ${word(sa, 'fr')} pour ${away}.`;
    if (!target) return first;
    if (oh === 0 && oa === 0) return `${first} Aucune des deux équipes n'a cadré de tir.`;
    return oh === oa
      ? `${first} Les deux équipes en ont cadré ${word(oh, 'fr')}.`
      : `${first} ${home} en a cadré ${word(oh, 'fr')}, ${away} ${word(oa, 'fr')}.`;
  }
  const first = `${home} ${past ? 'took' : 'have taken'} ${word(sh, 'en')} shot${sh === 1 ? '' : 's'} to ${away}'s ${word(sa, 'en')}.`;
  if (!target) return first;
  if (oh === 0 && oa === 0)
    return `${first} Neither side ${past ? 'put' : 'has put'} a shot on target.`;
  return oh === oa
    ? `${first} Both sides ${past ? 'put' : 'have put'} ${word(oh, 'en')} on target.`
    : `${first} ${home} ${past ? 'put' : 'have put'} ${word(oh, 'en')} on target, ${away} ${word(oa, 'en')}.`;
}
