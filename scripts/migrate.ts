/**
 * Apply pending Drizzle migrations to the configured DATABASE_URL.
 *
 * Run: pnpm tsx --env-file=.env.local scripts/migrate.ts
 * Requires: .env.local with DATABASE_URL
 *
 * Idempotent — drizzle-orm's migrator tracks applied migrations via the
 * `drizzle.__drizzle_migrations` table and skips ones it's already run.
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');

  const sql = neon(url);
  const db = drizzle(sql);

  console.log('[migrate] Applying pending migrations from ./drizzle ...');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('[migrate] Done.');
}

main().catch((err) => {
  console.error('[migrate] Fatal error:', err);
  process.exit(1);
});
