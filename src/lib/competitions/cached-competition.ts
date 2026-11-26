import { cache } from 'react';
import { cacheLife } from 'next/cache';
import { db } from '@/lib/db/client';
import { getCompetitionById } from '@/lib/db/queries/league';

async function loadCompetition(competitionId: number) {
  'use cache';
  // Name / type / logo of a competition: edited by hand, never live. `hours` still revalidates
  // hourly in the background, so an edit shows up without a blocking read for the visitor.
  cacheLife('hours');
  return getCompetitionById(db, competitionId);
}

/**
 * The competition row, shared by `generateMetadata` and the page body. Wrapped in React `cache`
 * so the metadata phase and the render (and any sibling component) share one lookup per request
 * instead of the metadata phase running its own uncached Neon query before the page can stream.
 */
export const getCachedCompetition = cache(loadCompetition);
