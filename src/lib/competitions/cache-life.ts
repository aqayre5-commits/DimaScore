import { cacheLife } from 'next/cache';

/**
 * Cache lifetime for a competition page's data bundle (standings, fixtures, leaders, teams).
 * Call it inside a `'use cache'` function.
 *
 * - Running season: revalidated in the background at most once a minute (same freshness as the
 *   old `minutes` profile), but a cached copy may be served for up to 6 h while that refresh runs.
 *   `minutes` expired after 1 h, so a competition nobody opened for an hour (LaLiga, UEL, domestic
 *   cups outside match week) paid a blocking nine-query rebuild on the visitor's click. Live scores
 *   do not depend on this bundle: the client overlays them from the live feed.
 * - Finished season: nothing changes except rare corrections, so revalidate hourly and keep a week.
 */
export function cacheCompetitionData(finishedSeason: boolean): void {
  if (finishedSeason) {
    cacheLife({ stale: 3600, revalidate: 3600, expire: 604800 });
  } else {
    cacheLife({ stale: 300, revalidate: 60, expire: 21600 });
  }
}
