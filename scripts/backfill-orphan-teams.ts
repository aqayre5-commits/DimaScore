/**
 * Backfill team rows that fixtures reference but that are missing from the `teams` table.
 *
 * These orphans are why a handful of match pages canonicalize to a bare-number URL
 * (`/match/{id}` instead of `/match/{home}-{away}-{id}`): `buildMatchSlug` falls back to the id
 * when a team slug is null. Inserting the missing team (name + logo + slug) lets those URLs
 * self-heal — the match route resolves by trailing id and 301s to the named slug.
 *
 * Run:
 *   pnpm tsx scripts/backfill-orphan-teams.ts           # dry-run (default) — prints what it'd insert
 *   pnpm tsx scripts/backfill-orphan-teams.ts --apply    # fetch from API-Football + write to DB
 *
 * Requires: .env.local with DATABASE_URL and the API-Football credentials.
 * Cost: one API-Football call per orphaned id. onConflictDoNothing — never clobbers existing rows.
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';
import * as schema from '@/lib/db/schema';
import { getDataProvider } from '@/lib/data';
import { mapTeamToInsert, mapVenueToInsert } from '@/lib/ingestion/teams';
import { buildCountryLookup } from '@/lib/ingestion/country-lookup';
import type { NormalizedTeam } from '@/lib/data/types';

const db = drizzle(neon(process.env.DATABASE_URL!), { schema });
const apply = process.argv.includes('--apply');

interface OrphanRow {
  tid: number | string;
  is_women: boolean;
}

async function main() {
  // Orphaned team ids: referenced by a fixture but absent from `teams`. `is_women` is inferred from
  // the competition(s) the orphan appears in, so the inserted row gets the right women's flag.
  const res = await db.execute(sql`
    SELECT tid, bool_or(is_women) AS is_women
    FROM (
      SELECT f.home_team_id AS tid, c.is_women
      FROM fixtures f JOIN competitions c ON c.id = f.competition_id
      WHERE f.home_team_id IS NOT NULL
      UNION ALL
      SELECT f.away_team_id, c.is_women
      FROM fixtures f JOIN competitions c ON c.id = f.competition_id
      WHERE f.away_team_id IS NOT NULL
    ) x
    WHERE tid NOT IN (SELECT id FROM teams)
    GROUP BY tid
    ORDER BY tid
  `);
  const orphans = res.rows as unknown as OrphanRow[];
  console.log(`Orphaned team ids referenced by fixtures: ${orphans.length}`);
  if (orphans.length === 0) return;

  const provider = getDataProvider();
  const countryLookup = await buildCountryLookup(db);

  const resolved: { team: NormalizedTeam; row: ReturnType<typeof mapTeamToInsert> }[] = [];
  const unresolved: number[] = [];

  for (const o of orphans) {
    const id = Number(o.tid);
    const teams = await provider.getTeams({ id });
    const team = teams[0];
    if (!team) {
      unresolved.push(id);
      console.log(`  ✗ ${id} — API-Football returned nothing (dead/legacy id)`);
      continue;
    }
    const row = mapTeamToInsert(team, !!o.is_women, countryLookup);
    resolved.push({ team, row });
    console.log(
      `  ${apply ? '→ INSERT' : 'would insert'} ${row.id}  ${row.slug}  ${row.logoUrl ? 'logo✓' : 'NO LOGO'}${o.is_women ? '  (W)' : ''}`,
    );
  }

  if (apply && resolved.length > 0) {
    for (const { team, row } of resolved) {
      // Upsert the venue first (FK target) so the team insert can't fail on a missing venue.
      if (team.venue?.id) {
        const venueRow = mapVenueToInsert(team.venue, countryLookup);
        await db.insert(schema.venues).values(venueRow).onConflictDoNothing({
          target: schema.venues.id,
        });
      }
      await db.insert(schema.teams).values(row).onConflictDoNothing({ target: schema.teams.id });
    }
    console.log(`\nInserted ${resolved.length} team(s).`);
  }

  console.log(
    `\nDone. resolved=${resolved.length}  unresolved=${unresolved.length}${apply ? '' : '  (dry-run — re-run with --apply to write)'}`,
  );
  if (unresolved.length > 0) {
    console.log(
      `Unresolvable ids (consider a sitemap filter for their fixtures): ${unresolved.join(', ')}`,
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
