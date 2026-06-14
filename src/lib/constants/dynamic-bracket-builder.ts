/**
 * Dynamic bracket builder — transforms DB knockout fixtures into BracketMatch[]
 * for the bracket visualization. Works for any cup (UCL, UEL, AFCON, etc.).
 *
 * Handles two-leg ties (UCL/UEL) and single-leg matches (WC R32+).
 * Reuses the same BracketMatch type consumed by KnockoutBracket.
 */

import type { FixtureWithTeams } from '@/lib/db/queries';
import type { Locale } from '@/lib/i18n/config';
import type {
  BracketMatch,
  BracketSide,
  KnockoutPhase,
} from '@/components/tournament/BracketMatchCell';
import { ROUND_LABELS } from './wc2026-bracket-builder';
import { isLive as isLiveStatus } from '@/lib/match-status';

// ── Phase detection ─────────────────────────────────────────────────────────

const ROUND_TO_PHASE: Record<string, KnockoutPhase> = {
  'Round of 128': 'r32', // rare, map to r32 slot
  'Round of 64': 'r32',
  'Round of 32': 'r32',
  'Round of 16': 'r16',
  'Quarter-finals': 'qf',
  'Semi-finals': 'sf',
  'Semi-Finals': 'sf',
  '3rd Place Final': '3rd',
  '3rd place': '3rd',
  Final: 'final',
};

const PHASE_ORDER: KnockoutPhase[] = ['r32', 'r16', 'qf', 'sf', 'final'];

// ── Tie (two-leg aggregate or single match) ─────────────────────────────────

interface Tie {
  id: string;
  phase: KnockoutPhase;
  team1Id: number;
  team2Id: number;
  team1Code: string;
  team2Code: string;
  leg1: FixtureWithTeams;
  leg2: FixtureWithTeams | null;
  aggScore1: number | null;
  aggScore2: number | null;
  winnerId: number | null;
  firstKickoff: Date;
}

function resolveCode(team: FixtureWithTeams['homeTeam']): string {
  if (!team) return '?';
  return team.code ?? (team.name['en'] ?? '?').slice(0, 3).toUpperCase();
}

function buildTies(phase: KnockoutPhase, fixtures: FixtureWithTeams[]): Tie[] {
  const sorted = [...fixtures].sort((a, b) => a.kickoffAt.getTime() - b.kickoffAt.getTime());

  // Try to pair legs: same two teams with home/away swapped
  const used = new Set<number>();
  const ties: Tie[] = [];

  for (let i = 0; i < sorted.length; i++) {
    if (used.has(sorted[i].id)) continue;
    const f1 = sorted[i];
    const t1h = f1.homeTeamId;
    const t1a = f1.awayTeamId;
    if (!t1h || !t1a) continue;

    // Find the return leg (reversed home/away, later kickoff)
    let leg2: FixtureWithTeams | null = null;
    for (let j = i + 1; j < sorted.length; j++) {
      if (used.has(sorted[j].id)) continue;
      const f2 = sorted[j];
      if (
        (f2.homeTeamId === t1a && f2.awayTeamId === t1h) ||
        (f2.homeTeamId === t1h && f2.awayTeamId === t1a)
      ) {
        leg2 = f2;
        used.add(f2.id);
        break;
      }
    }
    used.add(f1.id);

    // Compute aggregate
    let agg1: number | null = null;
    let agg2: number | null = null;
    if (f1.homeScore != null && f1.awayScore != null) {
      agg1 = f1.homeScore;
      agg2 = f1.awayScore;
      if (leg2 && leg2.homeScore != null && leg2.awayScore != null) {
        // leg2 home = f1 away team, leg2 away = f1 home team
        if (leg2.homeTeamId === t1a) {
          agg1 += leg2.awayScore;
          agg2 += leg2.homeScore;
        } else {
          agg1 += leg2.homeScore;
          agg2 += leg2.awayScore;
        }
      }
    }

    let winnerId: number | null = null;
    if (agg1 != null && agg2 != null) {
      if (agg1 > agg2) winnerId = t1h;
      else if (agg2 > agg1) winnerId = t1a;
      // Tied on aggregate — away goals or penalties; we can't determine from scores alone
      // Leave winnerId null; feedsInto will use team presence in next round
    }

    const tieIdx = ties.length;
    ties.push({
      id: `tie-${phase}-${tieIdx}`,
      phase,
      team1Id: t1h,
      team2Id: t1a,
      team1Code: resolveCode(f1.homeTeam),
      team2Code: resolveCode(f1.awayTeam),
      leg1: f1,
      leg2,
      aggScore1: agg1,
      aggScore2: agg2,
      winnerId,
      firstKickoff: f1.kickoffAt,
    });
  }

  return ties;
}

// ── Side assignment + feedsInto ─────────────────────────────────────────────

function assignSides(tiesByPhase: Map<KnockoutPhase, Tie[]>, presentPhases: KnockoutPhase[]): void {
  // Strategy: trace backwards from final to assign sides consistently.
  // For each phase, split ties into left/right halves by kickoff order.
  // Then refine: if we know which team advanced to the next round's left/right,
  // assign the feeding tie to the same side.

  for (const phase of presentPhases) {
    const ties = tiesByPhase.get(phase);
    if (!ties || ties.length === 0) continue;

    if (phase === 'final') continue; // Final has no side

    // Default: first half left, second half right
    const half = Math.ceil(ties.length / 2);
    for (let i = 0; i < ties.length; i++) {
      // Mark side on the tie object via id suffix (we'll read it later)
      ties[i].id = `tie-${phase}-${i < half ? 'l' : 'r'}-${i}`;
    }
  }
}

function getSide(tie: Tie): BracketSide {
  if (tie.phase === 'final' || tie.phase === '3rd') return 'center';
  return tie.id.includes('-l-') ? 'left' : 'right';
}

function computeFeedsInto(
  tiesByPhase: Map<KnockoutPhase, Tie[]>,
  presentPhases: KnockoutPhase[],
): Map<string, string> {
  const feedMap = new Map<string, string>();

  for (let p = 0; p < presentPhases.length - 1; p++) {
    const currentPhase = presentPhases[p];
    const nextPhase = presentPhases[p + 1];
    const currentTies = tiesByPhase.get(currentPhase) ?? [];
    const nextTies = tiesByPhase.get(nextPhase) ?? [];

    // Try to match by team presence: winner of current tie appears in next tie
    for (const curTie of currentTies) {
      const candidateTeams = [curTie.team1Id, curTie.team2Id];
      if (curTie.winnerId) {
        // Prefer winner
        const nextTie = nextTies.find(
          (nt) => nt.team1Id === curTie.winnerId || nt.team2Id === curTie.winnerId,
        );
        if (nextTie) {
          feedMap.set(curTie.id, nextTie.id);
          continue;
        }
      }
      // Fallback: any team from current tie found in next round
      const nextTie = nextTies.find(
        (nt) => candidateTeams.includes(nt.team1Id) || candidateTeams.includes(nt.team2Id),
      );
      if (nextTie) {
        feedMap.set(curTie.id, nextTie.id);
      }
    }
  }

  return feedMap;
}

// ── Grid config ─────────────────────────────────────────────────────────────

export interface BracketGridConfig {
  columns: Array<{
    col: number;
    phase: KnockoutPhase;
    side: BracketSide;
    rowSpan: number;
  }>;
  headerColumns: Array<{ col: number; phase: KnockoutPhase }>;
  totalCols: number;
  dataRows: number;
  finalCol: number;
}

function computeGridConfig(
  tiesByPhase: Map<KnockoutPhase, Tie[]>,
  presentPhases: KnockoutPhase[],
): BracketGridConfig {
  // Phases that appear on left+right (everything except final and 3rd)
  const bracketPhases = presentPhases.filter((p) => p !== 'final' && p !== '3rd');
  const totalCols = bracketPhases.length * 2 + 1; // left + center + right
  const finalCol = bracketPhases.length + 1;

  // Outermost phase determines row count
  const outerPhase = bracketPhases[0];
  const outerTies = tiesByPhase.get(outerPhase) ?? [];
  const tiesPerSide = Math.ceil(outerTies.length / 2);
  const dataRows = Math.max(tiesPerSide * 2, 2);

  const columns: BracketGridConfig['columns'] = [];
  const headerColumns: BracketGridConfig['headerColumns'] = [];

  for (let i = 0; i < bracketPhases.length; i++) {
    const phase = bracketPhases[i];
    const leftCol = i + 1;
    const rightCol = totalCols - i;
    const ties = tiesByPhase.get(phase) ?? [];
    const perSide = Math.ceil(ties.length / 2);
    const rowSpan = perSide > 0 ? Math.floor(dataRows / perSide) : dataRows;

    columns.push({ col: leftCol, phase, side: 'left', rowSpan });
    columns.push({ col: rightCol, phase, side: 'right', rowSpan });

    headerColumns.push({ col: leftCol, phase });
    headerColumns.push({ col: rightCol, phase });
  }

  headerColumns.push({ col: finalCol, phase: 'final' });

  // Sort headers by column
  headerColumns.sort((a, b) => a.col - b.col);

  return { columns, headerColumns, totalCols, dataRows, finalCol };
}

// ── Public builder ──────────────────────────────────────────────────────────

export interface DynamicBracketData {
  matches: BracketMatch[];
  thirdPlaceMatch?: BracketMatch;
  gridConfig: BracketGridConfig;
}

export function buildDynamicBracket(
  knockoutFixtures: FixtureWithTeams[],
  locale: Locale,
): DynamicBracketData | null {
  // Filter to known knockout rounds
  const relevant = knockoutFixtures.filter((f) => f.round && ROUND_TO_PHASE[f.round]);
  if (relevant.length === 0) return null;

  // Group by phase and build ties
  const byPhase = new Map<KnockoutPhase, FixtureWithTeams[]>();
  for (const f of relevant) {
    const phase = ROUND_TO_PHASE[f.round!];
    if (!byPhase.has(phase)) byPhase.set(phase, []);
    byPhase.get(phase)!.push(f);
  }

  const tiesByPhase = new Map<KnockoutPhase, Tie[]>();
  for (const [phase, fixtures] of byPhase) {
    if (phase === '3rd') continue; // Handle separately
    tiesByPhase.set(phase, buildTies(phase, fixtures));
  }

  const presentPhases = PHASE_ORDER.filter(
    (p) => tiesByPhase.has(p) && tiesByPhase.get(p)!.length > 0,
  );
  if (presentPhases.length === 0) return null;

  // Assign sides and compute progression
  assignSides(tiesByPhase, presentPhases);
  const feedMap = computeFeedsInto(tiesByPhase, presentPhases);

  // Grid config
  const gridConfig = computeGridConfig(tiesByPhase, presentPhases);

  // Build BracketMatch array
  const labels = ROUND_LABELS[locale] ?? ROUND_LABELS.en;
  const matches: BracketMatch[] = [];

  for (const phase of presentPhases) {
    const ties = tiesByPhase.get(phase) ?? [];
    for (const tie of ties) {
      const side = getSide(tie);
      const isFinished =
        tie.aggScore1 != null &&
        tie.aggScore2 != null &&
        (tie.leg2
          ? tie.leg2.statusCode === 'FT' ||
            tie.leg2.statusCode === 'AET' ||
            tie.leg2.statusCode === 'PEN'
          : tie.leg1.statusCode === 'FT' ||
            tie.leg1.statusCode === 'AET' ||
            tie.leg1.statusCode === 'PEN');

      const isLive = !isFinished && isLiveStatus(tie.leg2?.statusCode ?? tie.leg1.statusCode);

      const status: BracketMatch['status'] = isFinished ? 'finished' : isLive ? 'live' : 'upcoming';

      const dateStr = tie.firstKickoff.toISOString().slice(0, 10);
      const statusLabel = isFinished ? (tie.leg2 ? 'agg' : 'FT') : formatShortDate(dateStr, locale);

      const feedsIntoId = feedMap.get(tie.id);

      // Per-leg scores from each team's perspective
      let homeLeg1: number | null = null;
      let homeLeg2: number | null = null;
      let awayLeg1: number | null = null;
      let awayLeg2: number | null = null;

      if (tie.leg1.homeScore != null && tie.leg1.awayScore != null) {
        // team1 is always leg1 home
        homeLeg1 = tie.leg1.homeScore;
        awayLeg1 = tie.leg1.awayScore;
      }
      if (tie.leg2 && tie.leg2.homeScore != null && tie.leg2.awayScore != null) {
        if (tie.leg2.homeTeamId === tie.team2Id) {
          // leg2 home = team2, away = team1
          homeLeg2 = tie.leg2.awayScore;
          awayLeg2 = tie.leg2.homeScore;
        } else {
          homeLeg2 = tie.leg2.homeScore;
          awayLeg2 = tie.leg2.awayScore;
        }
      }

      matches.push({
        matchId: tie.id,
        phase: tie.phase,
        matchNumber: tie.leg1.id,
        homeLabel: tie.team1Code,
        awayLabel: tie.team2Code,
        homeScore: tie.aggScore1,
        awayScore: tie.aggScore2,
        // Pens only meaningful for single-leg ties (national-team cups); null for two-leg.
        homeScorePen: tie.leg2 ? null : (tie.leg1.homeScorePen ?? null),
        awayScorePen: tie.leg2 ? null : (tie.leg1.awayScorePen ?? null),
        statusCode: (tie.leg2 ?? tie.leg1).statusCode,
        kickoffISO: tie.firstKickoff.toISOString(),
        homeLeg1Score: homeLeg1,
        homeLeg2Score: homeLeg2,
        awayLeg1Score: awayLeg1,
        awayLeg2Score: awayLeg2,
        homeLogoUrl: tie.leg1.homeTeam?.logoUrl ?? null,
        awayLogoUrl: tie.leg1.awayTeam?.logoUrl ?? null,
        status,
        statusLabel,
        feedsInto: feedsIntoId,
        side,
        venue: tie.leg2 ? null : (tie.leg1.venue?.name ?? tie.leg1.venue?.city ?? null),
        date: dateStr,
        roundLabel: labels[tie.phase] ?? tie.phase,
        ariaLabel: `${tie.team1Code} vs ${tie.team2Code}`,
      });
    }
  }

  // 3rd place match (rare for club competitions, common for national team cups)
  let thirdPlaceMatch: BracketMatch | undefined;
  const thirdFixtures = byPhase.get('3rd');
  if (thirdFixtures && thirdFixtures.length > 0) {
    const f = thirdFixtures[0];
    const dateStr = f.kickoffAt.toISOString().slice(0, 10);
    const isFin = f.statusCode === 'FT' || f.statusCode === 'AET' || f.statusCode === 'PEN';
    thirdPlaceMatch = {
      matchId: 'tie-3rd-0',
      phase: '3rd',
      matchNumber: f.id,
      homeLabel: resolveCode(f.homeTeam),
      awayLabel: resolveCode(f.awayTeam),
      homeScore: f.homeScore,
      awayScore: f.awayScore,
      homeScorePen: f.homeScorePen ?? null,
      awayScorePen: f.awayScorePen ?? null,
      statusCode: f.statusCode,
      kickoffISO: f.kickoffAt.toISOString(),
      status: isFin ? 'finished' : 'upcoming',
      statusLabel: isFin ? 'FT' : formatShortDate(dateStr, locale),
      side: 'center',
      venue: f.venue?.name ?? f.venue?.city ?? null,
      date: dateStr,
      roundLabel: labels['3rd'] ?? '3rd place',
      ariaLabel: `${resolveCode(f.homeTeam)} vs ${resolveCode(f.awayTeam)}`,
    };
  }

  return { matches, thirdPlaceMatch, gridConfig };
}

// ── Date formatting (SSR-safe) ──────────────────────────────────────────────

const MONTHS: Record<string, string[]> = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  fr: [
    'janv.',
    'fevr.',
    'mars',
    'avr.',
    'mai',
    'juin',
    'juil.',
    'aout',
    'sept.',
    'oct.',
    'nov.',
    'dec.',
  ],
  ar: [
    'يناير',
    'فبراير',
    'مارس',
    'أبريل',
    'مايو',
    'يونيو',
    'يوليو',
    'أغسطس',
    'سبتمبر',
    'أكتوبر',
    'نوفمبر',
    'ديسمبر',
  ],
};

function formatShortDate(dateStr: string, locale: Locale): string {
  const [, mm, dd] = dateStr.split('-');
  const monthIdx = parseInt(mm, 10) - 1;
  const day = parseInt(dd, 10);
  const monthNames = MONTHS[locale] ?? MONTHS.en;
  return locale === 'en' ? `${monthNames[monthIdx]} ${day}` : `${day} ${monthNames[monthIdx]}`;
}
