import { CompetitionSkeleton } from './CompetitionSkeleton';

/**
 * The boundary that actually swaps when the visitor moves between competitions of one country
 * (e.g. La Liga → Copa del Rey keeps the [country] segment, so only this level re-suspends).
 */
export default function CompetitionTournamentLoading() {
  return <CompetitionSkeleton />;
}
