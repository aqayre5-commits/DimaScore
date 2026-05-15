interface FifaRankingBadgeProps {
  ranking: number | null;
  label?: string;
}

/**
 * Inline FIFA ranking badge. Shows "FIFA: #14" or "FIFA: —" if ranking
 * not available. Used in FeaturedMatchCard and FixtureRow for national
 * team tournaments where fifaRankingApplicable = true.
 *
 * Per competition-cup.md Section 6 Card 1: FIFA ranking replaces
 * recent form (WWLDW) for national team tournaments.
 *
 * Ranking data not yet ingested — renders placeholder dashes at v1.
 */
export function FifaRankingBadge({ ranking, label = 'FIFA' }: FifaRankingBadgeProps) {
  return (
    <span className="text-xs tabular-nums text-text-tertiary">
      {label}: {ranking != null ? `#${ranking}` : '\u2014'}
    </span>
  );
}
