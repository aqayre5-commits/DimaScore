import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import type { DataProvider } from '@/lib/data/provider';
import type { NormalizedTeam, NormalizedVenue } from '@/lib/data/types';
import * as schema from '@/lib/db/schema';
import { runWrites } from '@/lib/db/client';
import type { SyncStats } from './types';
import { slugify } from './slug';
import { buildCountryLookup, resolveCountryCode } from './country-lookup';

// ─── Mappers (exported for testing) ───

export function mapVenueToInsert(v: NormalizedVenue, countryLookup?: Map<string, string>) {
  return {
    id: v.id,
    name: v.name,
    city: v.city,
    countryCode: countryLookup ? resolveCountryCode(countryLookup, v.country) : null,
    capacity: v.capacity,
    imageUrl: v.image,
  };
}

export function mapTeamToInsert(
  t: NormalizedTeam,
  isWomen: boolean,
  countryLookup?: Map<string, string>,
) {
  return {
    id: t.id,
    slug: `${slugify(t.name)}-${t.id}`,
    name: { en: t.name } as Record<string, string>,
    shortName: { en: t.name } as Record<string, string>,
    code: t.code,
    countryCode: countryLookup ? resolveCountryCode(countryLookup, t.country) : null,
    founded: t.founded,
    logoUrl: t.logo,
    venueId: t.venue?.id || null,
    isNational: t.national,
    isWomen,
  };
}

// ─── Sync ───

export async function syncTeams(
  provider: DataProvider,
  db: NeonHttpDatabase<typeof schema>,
  params: { leagueId: number; season: number; isWomen: boolean },
): Promise<SyncStats> {
  const countryLookup = await buildCountryLookup(db);
  const teams = await provider.getTeams({ league: params.leagueId, season: params.season });
  const inserted = 0;
  let updated = 0;

  await runWrites(async (tx) => {
    for (const t of teams) {
      // Upsert venue first (side-effect) — skip if venue id is null
      if (t.venue?.id) {
        const venueRow = mapVenueToInsert(t.venue, countryLookup);
        await tx
          .insert(schema.venues)
          .values(venueRow)
          .onConflictDoUpdate({
            target: schema.venues.id,
            set: {
              name: venueRow.name,
              city: venueRow.city,
              countryCode: venueRow.countryCode,
              capacity: venueRow.capacity,
              imageUrl: venueRow.imageUrl,
            },
          });
      }

      // Upsert team
      const teamRow = mapTeamToInsert(t, params.isWomen, countryLookup);
      await tx
        .insert(schema.teams)
        .values(teamRow)
        .onConflictDoUpdate({
          target: schema.teams.id,
          set: {
            slug: teamRow.slug,
            name: teamRow.name,
            shortName: teamRow.shortName,
            code: teamRow.code,
            countryCode: teamRow.countryCode,
            founded: teamRow.founded,
            logoUrl: teamRow.logoUrl,
            venueId: teamRow.venueId,
            isNational: teamRow.isNational,
            isWomen: teamRow.isWomen,
          },
        });
      updated++;
    }
  });

  return { inserted, updated };
}
