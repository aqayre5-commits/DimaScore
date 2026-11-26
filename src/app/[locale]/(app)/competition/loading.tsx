import { CompetitionSkeleton } from './[country]/[tournament]/CompetitionSkeleton';

/** Client nav between competitions: the competition page's own skeleton, not the old app skeleton. */
export default function CompetitionLoading() {
  return <CompetitionSkeleton />;
}
