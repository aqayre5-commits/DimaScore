/** Seasons snapshot for the middleware redirect (short in-memory cache; throws if the DB is down). */

import { db } from '@/lib/db/client';
import { getAvailableSeasons, getCurrentSeasonYear } from '@/lib/db/queries/league';
import type { SeasonSnapshot } from '@/lib/seo/competition-season-redirect';

const TTL_MS = 60_000;
const cache = new Map<number, { at: number; value: SeasonSnapshot }>();

export async function lookupSeasonSnapshot(competitionId: number): Promise<SeasonSnapshot> {
  const hit = cache.get(competitionId);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;
  const [availableSeasons, currentSeasonYear] = await Promise.all([
    getAvailableSeasons(db, competitionId),
    getCurrentSeasonYear(db, competitionId),
  ]);
  const value = { availableSeasons, currentSeasonYear };
  cache.set(competitionId, { at: Date.now(), value });
  return value;
}
