/**
 * Group domestic-cup fixtures into ties and ordered rounds.
 * Uses the format registry (two-legged rounds) and the shared tie key from PR 1.
 */

import { getCompetitionFormat } from '@/lib/competitions/formats';
import { slugifyRound } from '@/lib/competitions/paths';
import { normalizeTieRound, tieKey } from '@/lib/competitions/tie';
import { isFinished, isLive } from '@/lib/match-status';
import type { FixtureWithTeams } from '@/lib/db/queries';
import type { RoundInfo } from '@/lib/db/queries/league';

export const EARLIER_ROUNDS_SLUG = 'earlier-rounds';

const NAMED_KNOCKOUT = [
  'final',
  'semi-finals',
  'semifinals',
  'semi-final',
  'quarter-finals',
  'quarterfinals',
  'quarter-final',
  'round-of-16',
  'round-of-32',
  'round-of-64',
  'fifth-round',
  'fourth-round',
  'third-round',
  'second-round',
  'first-round',
  'first-round-proper',
  'third-round-proper',
  'qualifying-round',
  'preliminary-round',
];

export interface CupTie {
  key: string;
  round: string;
  roundSlug: string;
  twoLegged: boolean;
  /** Chronological; a third fixture in a single-leg round is treated as a replay. */
  fixtures: FixtureWithTeams[];
  homeTeamId: number;
  awayTeamId: number;
}

export interface CupRound {
  label: string;
  slug: string;
  earlier: boolean;
  twoLegged: boolean;
  ties: CupTie[];
  fixtures: FixtureWithTeams[];
}

function kickoffTime(f: FixtureWithTeams): number {
  const v = f.kickoffAt;
  return v instanceof Date ? v.getTime() : new Date(v).getTime();
}

function isTwoLeggedRound(competitionId: number, seasonYear: number, roundLabel: string): boolean {
  const format = getCompetitionFormat(competitionId, seasonYear);
  const listed = format?.twoLeggedRounds ?? [];
  const key = normalizeTieRound(roundLabel);
  return listed.some((name) => normalizeTieRound(name) === key);
}

function isNamedKnockout(label: string): boolean {
  const slug = slugifyRound(label);
  return NAMED_KNOCKOUT.includes(slug) || /round-of-\d+|semi|quarter|final|qualifying|preliminary/.test(slug);
}

/** Stable display order: configured format order, else later knockout rounds last. */
const FALLBACK_ORDER = [
  'qualifying-round',
  'preliminary-round',
  'first-round',
  'first-round-proper',
  'second-round',
  'third-round',
  'third-round-proper',
  'fourth-round',
  'fifth-round',
  'round-of-64',
  'round-of-32',
  'round-of-16',
  'quarter-finals',
  'quarterfinals',
  'semi-finals',
  'semifinals',
  'final',
];

function rankRound(label: string): number {
  const slug = slugifyRound(label);
  const i = FALLBACK_ORDER.indexOf(slug);
  return i === -1 ? 50 : i;
}

export function buildCupRounds(
  competitionId: number,
  seasonYear: number,
  fixtures: FixtureWithTeams[],
  roundInfos: RoundInfo[] = [],
): CupRound[] {
  const byLabel = new Map<string, FixtureWithTeams[]>();
  for (const f of fixtures) {
    const label = (f.round ?? '').trim() || 'Round';
    const list = byLabel.get(label) ?? [];
    list.push(f);
    byLabel.set(label, list);
  }
  for (const info of roundInfos) {
    const label = (info.round ?? '').trim();
    if (label && !byLabel.has(label)) byLabel.set(label, []);
  }

  const labels = [...byLabel.keys()].sort((a, b) => rankRound(a) - rankRound(b) || a.localeCompare(b));

  // Coupe du Trône and similar: fold unverified preliminary/regional names together.
  const format = getCompetitionFormat(competitionId, seasonYear);
  const groupEarlier = format?.unverified?.some((u) => /round/i.test(u)) ?? false;

  const earlierFixtures: FixtureWithTeams[] = [];
  const earlierLabels: string[] = [];
  const rounds: CupRound[] = [];

  for (const label of labels) {
    const list = (byLabel.get(label) ?? []).slice().sort((a, b) => kickoffTime(a) - kickoffTime(b));
    if (groupEarlier && !isNamedKnockout(label)) {
      earlierLabels.push(label);
      earlierFixtures.push(...list);
      continue;
    }
    rounds.push(makeRound(competitionId, seasonYear, label, slugifyRound(label), false, list));
  }

  if (earlierFixtures.length > 0 || earlierLabels.length > 0) {
    rounds.unshift(
      makeRound(competitionId, seasonYear, 'Earlier rounds', EARLIER_ROUNDS_SLUG, true, earlierFixtures),
    );
  }

  return rounds;
}

function makeRound(
  competitionId: number,
  seasonYear: number,
  label: string,
  slug: string,
  earlier: boolean,
  fixtures: FixtureWithTeams[],
): CupRound {
  const twoLegged = !earlier && isTwoLeggedRound(competitionId, seasonYear, label);
  const ties = groupTies(competitionId, seasonYear, label, slug, twoLegged, fixtures);
  return { label, slug, earlier, twoLegged, ties, fixtures };
}

function groupTies(
  competitionId: number,
  seasonYear: number,
  label: string,
  slug: string,
  twoLegged: boolean,
  fixtures: FixtureWithTeams[],
): CupTie[] {
  const groups = new Map<string, FixtureWithTeams[]>();
  for (const f of fixtures) {
    if (f.homeTeamId == null || f.awayTeamId == null) continue;
    const key = tieKey({
      competitionId,
      seasonYear,
      round: label,
      homeTeamId: f.homeTeamId,
      awayTeamId: f.awayTeamId,
    });
    const list = groups.get(key) ?? [];
    list.push(f);
    groups.set(key, list);
  }

  const ties: CupTie[] = [];
  for (const [key, list] of groups) {
    const sorted = list.slice().sort((a, b) => kickoffTime(a) - kickoffTime(b));
    const first = sorted[0];
    ties.push({
      key,
      round: label,
      roundSlug: slug,
      twoLegged,
      fixtures: sorted,
      homeTeamId: first.homeTeamId!,
      awayTeamId: first.awayTeamId!,
    });
  }
  return ties.sort((a, b) => kickoffTime(a.fixtures[0]) - kickoffTime(b.fixtures[0]));
}

export function findCupRound(rounds: CupRound[], slug: string | null | undefined): CupRound | undefined {
  if (!slug) return undefined;
  return rounds.find((r) => r.slug === slug);
}

/** Active stage: live round, else next upcoming, else last completed. */
export function defaultCupRound(rounds: CupRound[], now: Date): CupRound | undefined {
  if (rounds.length === 0) return undefined;
  const nowMs = now.getTime();
  const live = rounds.find((r) => r.fixtures.some((f) => isLive(f.statusCode)));
  if (live) return live;
  const upcoming = rounds.find((r) =>
    r.fixtures.some((f) => !isFinished(f.statusCode) && kickoffTime(f) >= nowMs),
  );
  if (upcoming) return upcoming;
  for (let i = rounds.length - 1; i >= 0; i--) {
    if (rounds[i].fixtures.some((f) => isFinished(f.statusCode))) return rounds[i];
  }
  return rounds[rounds.length - 1];
}

export function fixtureLegLabel(tie: CupTie, fixture: FixtureWithTeams): 'first' | 'second' | 'replay' | null {
  if (tie.fixtures.length < 2) return null;
  const index = tie.fixtures.findIndex((f) => f.id === fixture.id);
  if (index < 0) return null;
  if (tie.twoLegged) {
    if (index === 0) return 'first';
    if (index === 1) return 'second';
    return 'replay';
  }
  return index > 0 ? 'replay' : null;
}
