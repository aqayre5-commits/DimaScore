/**
 * Derive a stable key for a two-leg (or single-match) knockout tie.
 * Both legs share the key because team ids are sorted; the round label is
 * normalised to lower-case so "Semi-finals" and "Semi-Finals" match.
 */

export interface TieIdentity {
  competitionId: number;
  seasonYear: number;
  round: string | null | undefined;
  homeTeamId: number;
  awayTeamId: number;
}

export function normalizeTieRound(round: string | null | undefined): string {
  return (round ?? '').trim().toLowerCase();
}

export function tieTeamPair(homeTeamId: number, awayTeamId: number): string {
  const a = Math.min(homeTeamId, awayTeamId);
  const b = Math.max(homeTeamId, awayTeamId);
  return `${a}-${b}`;
}

export function tieKey(identity: TieIdentity): string {
  const round = normalizeTieRound(identity.round);
  const pair = tieTeamPair(identity.homeTeamId, identity.awayTeamId);
  return `${identity.competitionId}:${identity.seasonYear}:${round}:${pair}`;
}

export function isSameTie(a: TieIdentity, b: TieIdentity): boolean {
  return tieKey(a) === tieKey(b);
}
