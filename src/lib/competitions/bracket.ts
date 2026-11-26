/**
 * Fixed-shape knockout bracket for the UEFA league-phase cups (CL / EL / ECL):
 * knockout play-offs → round of 16 → quarter-finals → semi-finals → final.
 * Rounds without fixtures yet keep their slots (rendered as TBD), and each tie is placed beside
 * the tie its participants advance into, so the connectors follow the real draw.
 */
import type { CupRound, CupTie } from '@/lib/competitions/domestic-ties';

/** Retired /round/{slug} names for the play-offs; they now redirect to the canonical stage URL. */
export const KNOCKOUT_SLUG = 'knockout';
export const PLAYOFFS_ALIAS_SLUGS = [
  'knockout',
  'knockout-round-play-offs',
  'round-of-32',
] as const;

export const BRACKET_ROUND_SLUGS = [
  'knockout-play-offs',
  'round-of-16',
  'quarter-finals',
  'semi-finals',
  'final',
] as const;

/** API-Football round names for each bracket slot (used when a round has no fixtures yet). */
export const BRACKET_LABELS: Record<string, string> = {
  'knockout-play-offs': 'Knockout play-offs',
  'round-of-16': 'Round of 16',
  'quarter-finals': 'Quarter-finals',
  'semi-finals': 'Semi-finals',
  final: 'Final',
};

export function isBracketRound(slug: string): boolean {
  return (BRACKET_ROUND_SLUGS as readonly string[]).includes(slug);
}

/** Ties per bracket round: 8 play-offs (16 clubs), 8, 4, 2, 1. */
export function bracketSizes(playoffTies: number): number[] {
  return [playoffTies, 8, 4, 2, 1];
}

function participants(tie: CupTie): number[] {
  const ids = new Set<number>();
  for (const f of tie.fixtures) {
    if (f.homeTeamId != null) ids.add(f.homeTeamId);
    if (f.awayTeamId != null) ids.add(f.awayTeamId);
  }
  return [...ids];
}

function kickoff(tie: CupTie): number {
  const v = tie.fixtures[0]?.kickoffAt;
  return v instanceof Date ? v.getTime() : new Date(v as string).getTime();
}

/**
 * Place the ties of each round into fixed slots, working back from the final. A tie lands in the
 * slot group of the next-round tie that contains one of its clubs; the rest fill the free slots
 * in kick-off order. Missing ties stay `null`.
 */
export function layoutBracket(tiesByRound: CupTie[][], sizes: number[]): (CupTie | null)[][] {
  const out: (CupTie | null)[][] = sizes.map((n) => Array.from({ length: n }, () => null));
  for (let r = sizes.length - 1; r >= 0; r--) {
    const slots = out[r];
    const ties = (tiesByRound[r] ?? []).slice().sort((a, b) => kickoff(a) - kickoff(b));
    const next = r < sizes.length - 1 ? out[r + 1] : null;
    const span = next ? Math.max(1, Math.round(sizes[r] / sizes[r + 1])) : 1;
    const unplaced: CupTie[] = [];
    // Group by the next-round tie, then by which of its clubs (home first) this tie produced.
    const keyed = ties.map((tie) => {
      if (!next) return { tie, to: -1, rank: 0 };
      const ids = participants(tie);
      for (let k = 0; k < next.length; k++) {
        const nt = next[k];
        if (!nt) continue;
        const rank = participants(nt).findIndex((id) => ids.includes(id));
        if (rank >= 0) return { tie, to: k, rank };
      }
      return { tie, to: -1, rank: 0 };
    });
    keyed.sort((x, y) => (x.to < 0 ? 1 : 0) - (y.to < 0 ? 1 : 0) || x.to - y.to || x.rank - y.rank);
    for (const { tie, to } of keyed) {
      let placed = false;
      if (to >= 0) {
        for (let s = to * span; s < Math.min(to * span + span, slots.length); s++) {
          if (slots[s] == null) {
            slots[s] = tie;
            placed = true;
            break;
          }
        }
      }
      if (!placed) unplaced.push(tie);
    }
    for (const tie of unplaced) {
      const free = slots.findIndex((s) => s == null);
      if (free >= 0) slots[free] = tie;
      else slots.push(tie);
    }
  }
  return out;
}

/** A bracket column: a round with its ties placed in fixed slots (`null` = not known yet, shown as TBD). */
export interface DrawRound {
  slug: string;
  label: string;
  earlier: boolean;
  twoLegged: boolean;
  ties: (CupTie | null)[];
}

type RoundLike = Pick<CupRound, 'slug' | 'label' | 'earlier' | 'twoLegged' | 'ties'>;

/** Lay out any list of rounds (domestic cups use the real tie counts; UEFA passes the fixed shape). */
export function layoutRounds(rounds: RoundLike[], sizes?: number[]): DrawRound[] {
  const shape = sizes ?? rounds.map((r) => Math.max(1, r.ties.length));
  const slots = layoutBracket(
    rounds.map((r) => r.ties),
    shape,
  );
  return rounds.map((r, i) => ({
    slug: r.slug,
    label: r.label,
    earlier: r.earlier,
    twoLegged: r.twoLegged,
    ties: slots[i],
  }));
}

/** The UEFA bracket rounds in order, with an empty round standing in for any that has no fixtures yet. */
export function uefaBracketRounds(
  rounds: CupRound[],
  labelOf: (slug: string, round: CupRound | undefined) => string,
  playoffTies: number,
): DrawRound[] {
  const bySlug = new Map(rounds.map((r) => [r.slug, r]));
  const filled: RoundLike[] = BRACKET_ROUND_SLUGS.map((slug) => {
    const r = bySlug.get(slug);
    return {
      slug,
      label: labelOf(slug, r),
      earlier: false,
      twoLegged: slug !== 'final',
      ties: r?.ties ?? [],
    };
  });
  return layoutRounds(filled, bracketSizes(playoffTies));
}
