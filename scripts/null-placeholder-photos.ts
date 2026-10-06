/**
 * Phase 16 · Task E (#2) — null player photo_url values that aren't a real photo.
 *
 * All players store photo_url = media.api-sports.io/football/players/{id}.png. For a player with no
 * real photo API-Football serves a byte-identical 5192-byte silhouette (sha256 2ff7d52a…), or 404s
 * for a dead id. Either way it's not a photo, so we null it and let the UI show our own silhouette
 * (and Task F's under-16 rule) instead of hotlinking the provider placeholder.
 *
 * Detection is a single HEAD per player (no body): status 404 → dead; 200 & content-length 5192 →
 * placeholder; otherwise a real photo (10k–27k). The 5192-byte image is unique, so content-length
 * alone is a safe signal. Any network error KEEPS the row (never null on uncertainty).
 *
 * Dry-run scans and writes the candidate list to a cache file; --apply reads that cache (no re-scan)
 * and nulls in batches, reporting before/after.
 *
 * Run:
 *   pnpm tsx --env-file=.env.local scripts/null-placeholder-photos.ts          # scan + report + cache
 *   pnpm tsx --env-file=.env.local scripts/null-placeholder-photos.ts --apply   # null cached candidates
 */
import { neon } from '@neondatabase/serverless';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const apply = process.argv.includes('--apply');
const PLACEHOLDER_BYTES = 5192;
const CONCURRENCY = 24;
const CACHE = join(tmpdir(), 'dimascore-placeholder-photos.json');

async function classify(
  id: number,
  url: string,
): Promise<'dead' | 'placeholder' | 'keep' | 'error'> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(10_000) });
      if (res.status === 404) return 'dead';
      if (res.status === 200) {
        const len = Number(res.headers.get('content-length'));
        return len === PLACEHOLDER_BYTES ? 'placeholder' : 'keep';
      }
      return 'keep'; // other status: don't touch
    } catch {
      if (attempt === 1) return 'error';
    }
  }
  return 'error';
}

async function scan(rows: { id: number; url: string }[]) {
  const candidates: { id: number; reason: 'dead' | 'placeholder' }[] = [];
  const tally = { dead: 0, placeholder: 0, keep: 0, error: 0 };
  let done = 0;
  let i = 0;
  async function worker() {
    while (i < rows.length) {
      const r = rows[i++];
      const verdict = await classify(r.id, r.url);
      tally[verdict]++;
      if (verdict === 'dead' || verdict === 'placeholder')
        candidates.push({ id: r.id, reason: verdict });
      if (++done % 2000 === 0)
        console.log(
          `  scanned ${done}/${rows.length}  (placeholder ${tally.placeholder}, dead ${tally.dead}, err ${tally.error})`,
        );
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return { candidates, tally };
}

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const q = (s: string, p: unknown[] = []) =>
    sql.query(s, p).then((r) => r as Record<string, unknown>[]);

  if (apply && existsSync(CACHE)) {
    const ids: number[] = JSON.parse(readFileSync(CACHE, 'utf8')).candidates.map(
      (c: { id: number }) => c.id,
    );
    console.log(`applying from cache: ${ids.length} candidates`);
    const [before] = await q(`SELECT count(*)::int AS n FROM players WHERE photo_url IS NOT NULL`);
    for (let j = 0; j < ids.length; j += 500) {
      await q(`UPDATE players SET photo_url = NULL WHERE id = ANY($1)`, [ids.slice(j, j + 500)]);
    }
    const [after] = await q(`SELECT count(*)::int AS n FROM players WHERE photo_url IS NOT NULL`);
    console.log(
      `photo_url NOT NULL: ${Number(before.n)} -> ${Number(after.n)} (nulled ${Number(before.n) - Number(after.n)})`,
    );
    return;
  }

  const rows = (await q(
    `SELECT id, photo_url AS url FROM players WHERE photo_url IS NOT NULL ORDER BY id`,
  )) as {
    id: number;
    url: string;
  }[];
  console.log(`scanning ${rows.length} player photos (HEAD, concurrency ${CONCURRENCY})…`);
  const { candidates, tally } = await scan(rows);
  writeFileSync(CACHE, JSON.stringify({ candidates }, null, 0));
  console.log(
    `\nplaceholder: ${tally.placeholder}  dead(404): ${tally.dead}  keep: ${tally.keep}  error: ${tally.error}`,
  );
  console.log(`candidates to null: ${candidates.length}  (cached → ${CACHE})`);
  console.log(
    apply
      ? '\n(no cache existed — re-run --apply to null)'
      : '\n(scan only — re-run with --apply to null the cached candidates)',
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
