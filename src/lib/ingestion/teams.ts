import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import type { DataProvider } from '@/lib/data/provider';
import type { NormalizedTeam, NormalizedVenue } from '@/lib/data/types';
import * as schema from '@/lib/db/schema';
import type { SyncStats } from './types';
import { slugify } from './slug';

// ─── Mappers (exported for testing) ───

export function mapVenueToInsert(v: NormalizedVenue) {
  return {
    id: v.id,
    name: v.name,
    city: v.city,
    countryCode: v.country,
    capacity: v.capacity,
    imageUrl: v.image,
  };
}

export function mapTeamToInsert(t: NormalizedTeam, isWomen: boolean) {
  return {
    id: t.id,
    slug: slugify(t.name),
    name: { en: t.name } as Record<string, string>,
    shortName: { en: t.code ?? t.name } as Record<string, string>,
    code: t.code,
    countryCode: t.country,
    founded: t.founded,
    logoUrl: t.logo,
    venueId: t.venue?.id ?? null,
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
  const teams = await provider.getTeams({ league: params.leagueId, season: params.season });
  const inserted = 0;
  let updated = 0;

  for (const t of teams) {
    // Upsert venue first (side-effect)
    if (t.venue) {
      const venueRow = mapVenueToInsert(t.venue);
      await db
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
    const teamRow = mapTeamToInsert(t, params.isWomen);
    await db
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

  return { inserted, updated };
}
