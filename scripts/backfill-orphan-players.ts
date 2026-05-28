/**
 * Backfill missing players referenced in fixture_events / fixture_player_stats
 * but absent from the players table.
 *
 * Strategy: Extract player names from fixture_lineups JSONB (starters + substitutes)
 * which already contain { id, name, pos, number } per player. No API calls needed.
 *
 * Run:
 *   DOTENV_CONFIG_PATH=.env.local pnpm tsx scripts/backfill-orphan-players.ts            # dry-run
 *   DOTENV_CONFIG_PATH=.env.local pnpm tsx scripts/backfill-orphan-players.ts --apply     # write to DB
 *
 * Requires: .env.local with DATABASE_URL
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';
import * as schema from '@/lib/db/schema';
import { slugify } from '@/lib/ingestion/slug';

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlClient, { schema });

const dryRun = !process.argv.includes('--apply');

const POS_MAP: Record<string, string> = {
  G: 'Goalkeeper',
  D: 'Defender',
  M: 'Midfielder',
  F: 'Attacker',
};

async function main() {
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'APPLY'}\n`);

  // 1. Extract all players from lineup JSONB that are missing from players table
  console.log('Extracting orphan players from fixture_lineups JSONB...');
  const rows = await db.execute(sql`
    WITH lineup_players AS (
      SELECT DISTINCT ON ((elem->>'id')::bigint)
        (elem->>'id')::bigint AS id,
        elem->>'name' AS name,
        elem->>'pos' AS pos,
        (elem->>'number')::int AS shirt_number,
        fl.team_id
      FROM fixture_lineups fl,
        jsonb_array_elements(fl.starters) AS elem
      UNION ALL
      SELECT DISTINCT ON ((elem->>'id')::bigint)
        (elem->>'id')::bigint AS id,
        elem->>'name' AS name,
        elem->>'pos' AS pos,
        (elem->>'number')::int AS shirt_number,
        fl.team_id
      FROM fixture_lineups fl,
        jsonb_array_elements(fl.substitutes) AS elem
    )
    SELECT DISTINCT ON (lp.id)
      lp.id,
      lp.name,
      lp.pos,
      lp.shirt_number,
      lp.team_id
    FROM lineup_players lp
    LEFT JOIN players p ON p.id = lp.id
    WHERE p.id IS NULL AND lp.id IS NOT NULL
    ORDER BY lp.id
  `);

  type Row = {
    id: number;
    name: string | null;
    pos: string | null;
    shirt_number: number | null;
    team_id: number | null;
  };
  const players = rows.rows as Row[];
  console.log(`Found ${players.length} orphan players resolvable from lineups\n`);

  // 2. Also find orphan IDs NOT in lineups (will be inserted as stubs)
  console.log('Checking for orphans not resolvable from lineups...');
  const unresolvedRows = await db.execute(sql`
    WITH all_orphans AS (
      SELECT DISTINCT fe.player_id AS id FROM fixture_events fe
      LEFT JOIN players p ON p.id = fe.player_id
      WHERE fe.player_id IS NOT NULL AND p.id IS NULL
      UNION
      SELECT DISTINCT fe.assist_player_id AS id FROM fixture_events fe
      LEFT JOIN players p ON p.id = fe.assist_player_id
      WHERE fe.assist_player_id IS NOT NULL AND p.id IS NULL
      UNION
      SELECT DISTINCT fps.player_id AS id FROM fixture_player_stats fps
      LEFT JOIN players p ON p.id = fps.player_id
      WHERE fps.player_id IS NOT NULL AND p.id IS NULL
    ),
    lineup_ids AS (
      SELECT DISTINCT (elem->>'id')::bigint AS id
      FROM fixture_lineups, jsonb_array_elements(starters) AS elem
      UNION
      SELECT DISTINCT (elem->>'id')::bigint AS id
      FROM fixture_lineups, jsonb_array_elements(substitutes) AS elem
    )
    SELECT ao.id FROM all_orphans ao
    LEFT JOIN lineup_ids li ON li.id = ao.id
    WHERE li.id IS NULL
    ORDER BY ao.id
  `);
  const unresolved = (unresolvedRows.rows as { id: number }[]).map((r) => r.id);
  console.log(`Found ${unresolved.length} orphans NOT in lineups (will be stub rows)\n`);

  if (players.length === 0 && unresolved.length === 0) {
    console.log('Nothing to do.');
    return;
  }

  let inserted = 0;
  let stubs = 0;
  let errors = 0;

  // 3. Insert players from lineups
  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    const progress = `[${i + 1}/${players.length}]`;
    const safeName = p.name ?? 'Unknown';
    const values = {
      id: p.id,
      slug: `${slugify(safeName)}-${p.id}`,
      name: { en: safeName } as Record<string, string>,
      position: p.pos ? (POS_MAP[p.pos] ?? p.pos) : null,
      shirtNumber: p.shirt_number,
      currentTeamId: p.team_id,
    };

    if (dryRun) {
      console.log(`${progress} Would insert: ${safeName} (id=${p.id}, pos=${values.position})`);
    } else {
      try {
        await db
          .insert(schema.players)
          .values(values)
          .onConflictDoUpdate({
            target: schema.players.id,
            set: {
              slug: values.slug,
              name: values.name,
              position: values.position,
              shirtNumber: values.shirtNumber,
              currentTeamId: values.currentTeamId,
            },
          });
        if ((i + 1) % 200 === 0 || i === players.length - 1) {
          console.log(`${progress} Inserted: ${safeName} (id=${p.id})`);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`${progress} Error for ${p.id}: ${msg}`);
        errors++;
        continue;
      }
    }
    inserted++;
  }

  // 4. Insert stub rows for unresolved orphans
  if (unresolved.length > 0) {
    console.log(`\nInserting ${unresolved.length} stub players (no lineup data)...`);
    for (let i = 0; i < unresolved.length; i++) {
      const id = unresolved[i];

      if (dryRun) {
        console.log(`  Would insert stub: id=${id}`);
      } else {
        try {
          await db
            .insert(schema.players)
            .values({
              id,
              slug: `unknown-${id}`,
              name: { en: 'Unknown Player' } as Record<string, string>,
            })
            .onConflictDoNothing();
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`  Stub error for ${id}: ${msg}`);
          errors++;
          continue;
        }
      }
      stubs++;
    }
    if (!dryRun) console.log(`Inserted ${stubs} stubs`);
  }

  console.log('\n── Summary ──');
  console.log(`From lineups:     ${inserted}`);
  console.log(`Stub (unknown):   ${stubs}`);
  console.log(`Errors:           ${errors}`);
  console.log(`Total:            ${inserted + stubs}`);
  if (dryRun) console.log('\nDry run — no changes written. Use --apply to persist.');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
