/**
 * Group-stage tournaments on the cup template (reference "finals" and "groups" profiles):
 * World Cup, AFCON, WAFCON, EURO, CAF club cups, the women's UEFA cups and the qualifiers.
 * Pure model: which rounds are group rounds, the groups and their tables, the best third-placed
 * teams, the advancement key and the fixed knockout path that the draw lays out.
 */
import type { StandingRow } from '@/lib/db/queries';
import type { FixtureWithTeams } from '@/lib/db/queries';
import type { CupRound } from '@/lib/competitions/domestic-ties';
import type { EditionFormat } from '@/lib/competitions/formats';
import { layoutRounds, type DrawRound } from '@/lib/competitions/bracket';
import { slugifyRound } from '@/lib/competitions/paths';
import { dedupeStandingsByTeam } from '@/lib/standings/dedupe';

/** Stage-menu slugs (reference profile order keys). */
export const GROUPS_SLUG = 'group-stage';
export const BEST_THIRDS_SLUG = 'best-thirds';
export const THIRD_PLACE_SLUG = 'third-place-match';
/** `/bracket` opens the draw on the first knockout round. */
export const KNOCKOUT_OPEN_SLUG = 'knockout';

/** Knockout path in order, with the API-Football names that map to each slot. */
export const KNOCKOUT_PATH: { slug: string; label: string; re: RegExp }[] = [
  {
    slug: 'knockout-play-offs',
    label: 'Knockout play-offs',
    re: /^(knockout-)?(round-)?play-?offs?$/,
  },
  { slug: 'round-of-32', label: 'Round of 32', re: /^round-of-32$/ },
  { slug: 'round-of-16', label: 'Round of 16', re: /^round-of-16$/ },
  { slug: 'quarter-finals', label: 'Quarter-finals', re: /^quarter-?finals?$/ },
  { slug: 'semi-finals', label: 'Semi-finals', re: /^semi-?finals?$/ },
  { slug: 'final', label: 'Final', re: /^final$/ },
];

const GROUP_ROUND_RE = /group|league[ -](stage|phase)|regular season/i;
const THIRD_PLACE_RE = /^(3rd|third)[- ]place|^3rd-place|third-place/i;

export function isGroupRound(label: string): boolean {
  return GROUP_ROUND_RE.test(label);
}
export function isThirdPlaceRound(slugOrLabel: string): boolean {
  return THIRD_PLACE_RE.test(slugOrLabel.replace(/\s+/g, '-'));
}
/** Knockout-path slot for a round slug, or null (group, third place or a preliminary round). */
export function pathSlot(slug: string): string | null {
  return KNOCKOUT_PATH.find((p) => p.re.test(slug))?.slug ?? null;
}

export interface GroupTable {
  /** Feed group label ("Group A", "League A - Group 1", "UEFA Women's Champions League"). */
  label: string;
  slug: string;
  /** Nations League division letter when the label carries one ("League A - Group 1" → "A"). */
  division: string | null;
  rows: StandingRow[];
  teamIds: Set<number>;
}

export interface ThirdRow {
  row: StandingRow;
  group: string;
  rank: number;
  qualifies: boolean;
}

export interface GroupRule {
  range: string;
  key: 'advance' | 'third' | 'out' | 'playoff' | 'promotion' | 'relegation' | 'stay';
  /** Message key in `tournament` plus its values. */
  text: { key: string; values?: Record<string, string | number> };
}

function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function divisionOf(label: string): string | null {
  return /league\s+([a-d])\b/i.exec(label)?.[1]?.toUpperCase() ?? null;
}

/** Feed tables split by group, in label order (Group A, B, …). */
export function buildGroups(standings: StandingRow[]): GroupTable[] {
  const by = new Map<string, StandingRow[]>();
  for (const row of standings) {
    const label = (row.groupLabel || '').trim() || 'Group';
    const list = by.get(label) ?? [];
    list.push(row);
    by.set(label, list);
  }
  return [...by.entries()]
    .sort(([a], [b]) => a.localeCompare(b, 'en', { numeric: true }))
    .map(([label, rows]) => {
      const sorted = dedupeStandingsByTeam(rows)
        .slice()
        .sort((a, b) => a.rank - b.rank);
      return {
        label,
        // getStandings strips "Group " ("A"); the URL keeps the reference form (group-a).
        slug: /^group\b/i.test(label) ? slugify(label) : `group-${slugify(label) || 'x'}`,
        division: divisionOf(label),
        rows: sorted,
        teamIds: new Set(sorted.map((r) => r.teamId).filter((id): id is number => id != null)),
      };
    });
}

/** The third-placed team of every group, ranked points → goal difference → goals for. */
export function rankThirds(groups: GroupTable[], advance: number): ThirdRow[] {
  const thirds = groups
    .map((g) => ({ row: g.rows.find((r) => r.rank === 3), group: g.label }))
    .filter((x): x is { row: StandingRow; group: string } => !!x.row);
  thirds.sort(
    (a, b) =>
      b.row.points - a.row.points ||
      (b.row.goalDiff ?? 0) - (a.row.goalDiff ?? 0) ||
      (b.row.goalsFor ?? 0) - (a.row.goalsFor ?? 0) ||
      a.group.localeCompare(b.group),
  );
  return thirds.map((t, i) => ({ ...t, rank: i + 1, qualifies: i < advance }));
}

/** Matches of one group: group-round fixtures between two of its teams. */
export function groupFixtures(fixtures: FixtureWithTeams[], group: GroupTable): FixtureWithTeams[] {
  return fixtures.filter(
    (f) =>
      isGroupRound(f.round ?? '') &&
      f.homeTeamId != null &&
      f.awayTeamId != null &&
      group.teamIds.has(f.homeTeamId) &&
      group.teamIds.has(f.awayTeamId),
  );
}

/**
 * Knockout path from the entry round to the final. The entry comes from the format (teams that
 * leave the groups) when it is known, else from the earliest path round that has fixtures.
 */
export function knockoutPath(rounds: CupRound[], format: EditionFormat | null): string[] {
  let entryTies: number | null = null;
  if (format?.groups) {
    const teams = format.groups.count * 2 + (format.bestThirdsAdvance ?? 0);
    entryTies = Math.max(1, Math.floor(teams / 2));
  }
  const present = rounds.map((r) => pathSlot(r.slug)).filter((s): s is string => !!s);
  const order = KNOCKOUT_PATH.map((p) => p.slug);
  let start = present.length ? Math.min(...present.map((s) => order.indexOf(s))) : -1;
  if (entryTies != null) {
    const bySize: Record<number, string> = {
      16: 'round-of-32',
      8: 'round-of-16',
      4: 'quarter-finals',
      2: 'semi-finals',
      1: 'final',
    };
    const fromFormat = bySize[entryTies];
    if (fromFormat) {
      const i = order.indexOf(fromFormat);
      start = start < 0 ? i : Math.min(start, i);
    }
  }
  // A single-table phase names the rounds it feeds (UWCL: play-offs and quarter-finals); the path
  // is those rounds and everything after the last of them.
  const fed = (format?.tableRules ?? [])
    .map((r) => r.round)
    .filter((s): s is string => !!s && order.includes(s));
  if (fed.length) {
    const last = Math.max(...fed.map((s) => order.indexOf(s)));
    return order.filter((s, i) => fed.includes(s) || i > last);
  }
  if (start < 0) return [];
  // Play-offs only belong to the path when the feed has them; otherwise skip the slot.
  return order.slice(start).filter((s) => s !== 'knockout-play-offs' || present.includes(s));
}

/** Draw columns for the knockout path; rounds without fixtures keep empty (TBD) slots. */
export function knockoutDraw(
  rounds: CupRound[],
  path: string[],
  labelOf: (slug: string, round: CupRound | undefined) => string,
  /** Path slots the edition plays over two legs: a round with no fixtures yet keeps the right card. */
  twoLeggedSlots: ReadonlySet<string> = new Set(),
): DrawRound[] {
  if (path.length === 0) return [];
  const bySlot = new Map<string, CupRound>();
  for (const r of rounds) {
    const slot = pathSlot(r.slug);
    if (slot && !bySlot.has(slot)) bySlot.set(slot, r);
  }
  // Sizes halve towards the final; play-offs feed a round of the same size (UWCL: 4 → QF 4).
  const sizes: number[] = new Array(path.length);
  for (let i = path.length - 1; i >= 0; i--) {
    const next = i === path.length - 1 ? 0.5 : sizes[i + 1];
    const base = path[i] === 'knockout-play-offs' ? next : next * 2;
    sizes[i] = Math.max(base, bySlot.get(path[i])?.ties.length ?? 0, 1);
  }
  return layoutRounds(
    path.map((slug) => {
      const r = bySlot.get(slug);
      return {
        slug,
        label: labelOf(slug, r),
        earlier: false,
        twoLegged: r ? r.twoLegged : twoLeggedSlots.has(slug),
        ties: r?.ties ?? [],
      };
    }),
    sizes,
  );
}

/** Preliminary knockout rounds before the groups (CAF club cups' 1st / 2nd round, qualifier play-offs). */
export function extraKnockoutRounds(rounds: CupRound[]): CupRound[] {
  return rounds.filter(
    (r) => !isGroupRound(r.label) && !pathSlot(r.slug) && !isThirdPlaceRound(r.slug),
  );
}

/** Advancement key beside a group table (reference ruleRows: finals and Nations League divisions). */
export function groupRules(
  format: EditionFormat | null,
  firstKnockoutSlug: string | null,
  division: string | null,
  groupSize: number,
): GroupRule[] {
  if (division) {
    if (division === 'A')
      return [
        {
          range: '1–2',
          key: 'advance',
          text: { key: 'ruleRound', values: { round: 'quarter-finals' } },
        },
        { range: '3', key: 'playoff', text: { key: 'rulePlayoff', values: { a: 'A', b: 'B' } } },
        { range: '4', key: 'relegation', text: { key: 'ruleRelegation', values: { to: 'B' } } },
      ];
    if (division === 'B')
      return [
        { range: '1', key: 'promotion', text: { key: 'rulePromotion', values: { to: 'A' } } },
        { range: '2', key: 'playoff', text: { key: 'rulePlayoff', values: { a: 'A', b: 'B' } } },
        { range: '3', key: 'playoff', text: { key: 'rulePlayoff', values: { a: 'B', b: 'C' } } },
        { range: '4', key: 'relegation', text: { key: 'ruleRelegation', values: { to: 'C' } } },
      ];
    if (division === 'C')
      return [
        { range: '1', key: 'promotion', text: { key: 'rulePromotion', values: { to: 'B' } } },
        { range: '2', key: 'playoff', text: { key: 'rulePlayoff', values: { a: 'B', b: 'C' } } },
        { range: '3', key: 'stay', text: { key: 'ruleStay', values: { league: 'C' } } },
        { range: '4', key: 'playoff', text: { key: 'rulePlayoff', values: { a: 'C', b: 'D' } } },
      ];
    return [
      { range: '1', key: 'promotion', text: { key: 'rulePromotion', values: { to: 'C' } } },
      { range: '2', key: 'playoff', text: { key: 'rulePlayoff', values: { a: 'C', b: 'D' } } },
      { range: '3', key: 'stay', text: { key: 'ruleStay', values: { league: 'D' } } },
    ];
  }
  if (format?.tableRules && groupSize > 0) {
    return format.tableRules
      .filter((r) => r.from <= groupSize)
      .map((r) => ({
        range: r.from === r.to ? String(r.from) : `${r.from}–${Math.min(r.to, groupSize)}`,
        key: r.key,
        text:
          r.key === 'out'
            ? { key: 'ruleOut' }
            : { key: 'ruleRound', values: { round: r.round ?? firstKnockoutSlug ?? '' } },
      }));
  }
  if (!format?.groups || !firstKnockoutSlug) return [];
  const thirds = format.bestThirdsAdvance ?? 0;
  const lastOut = groupSize > 3 ? `${thirds ? 4 : 3}–${groupSize}`.replace(/^(\d)–\1$/, '$1') : '3';
  return [
    {
      range: '1–2',
      key: 'advance',
      text: { key: 'ruleRound', values: { round: firstKnockoutSlug } },
    },
    ...(thirds
      ? [{ range: '3', key: 'third' as const, text: { key: 'ruleThirds', values: { n: thirds } } }]
      : []),
    { range: lastOut, key: 'out', text: { key: 'ruleOut' } },
  ];
}

/** Rank → rule band for the table's position colour. */
export function bandForRank(rules: GroupRule[], rank: number): GroupRule['key'] | null {
  for (const r of rules) {
    const [a, b] = r.range.split('–').map(Number);
    if (rank >= a && rank <= (b || a)) return r.key;
  }
  return null;
}

/**
 * Competitions on the group-stage cup template (PR A): World Cup 1, AFCON 6, WAFCON 922,
 * EURO 4, CAF Champions League 12, CAF Confederation Cup 20, UWCL 525, Women's Europa Cup 1191,
 * World Cup qualifiers (29–34, 37), AFCON qualifiers 36, EURO qualifiers 960, Nations League 5.
 */
export const GROUP_STAGE_TEMPLATE_IDS: ReadonlySet<number> = new Set([
  1, 6, 922, 4, 12, 20, 525, 1191, 1164, 29, 30, 31, 32, 33, 34, 37, 36, 960, 5,
]);

/** Finals tournaments played inside one calendar year: the edition reads "2026", not "2026/27". */
export const SINGLE_YEAR_EDITION_IDS: ReadonlySet<number> = new Set([1, 6, 922, 4]);

/** Knockout-path slots that the edition's format plays over two legs. */
export function twoLeggedSlots(format: EditionFormat | null): Set<string> {
  const out = new Set<string>();
  if (format?.allRoundsTwoLegged) return new Set(KNOCKOUT_PATH.map((p) => p.slug));
  for (const name of format?.twoLeggedRounds ?? []) {
    const slot = pathSlot(slugifyRound(name));
    if (slot) out.add(slot);
  }
  return out;
}

/** Where the provider's season year differs from the edition's name (WAFCON 2026 is filed under 2025). */
const EDITION_LABEL: Record<number, Record<number, string>> = { 922: { 2025: '2026' } };
export function editionYearLabel(competitionId: number, seasonYear: number): string {
  return EDITION_LABEL[competitionId]?.[seasonYear] ?? String(seasonYear);
}
