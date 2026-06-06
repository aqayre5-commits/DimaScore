import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });

/**
 * neon-http has no interactive transactions. The ingestion syncs that used
 * db.transaction() only do idempotent upserts (and delete+reinsert), so we run
 * the callback on the base connection — a partial run self-heals next cron.
 * Drop-in replacement for `db.transaction(fn)` → `runWrites(fn)`.
 */
export const runWrites = <T>(fn: (tx: typeof db) => Promise<T>): Promise<T> => fn(db);
