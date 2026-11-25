/**
 * Classify every player and coach photo as ok | missing | placeholder.
 *
 * Fetches public CDN images (media.api-sports.io), hashes the bytes, and
 * compares them to known API-Sports silhouette files. Dry-run by default;
 * pass --apply to write `photo_status`. Idempotent (only updates changed rows).
 *
 *   pnpm tsx --env-file=.env.local scripts/scan-photo-status.ts
 *   pnpm tsx --env-file=.env.local scripts/scan-photo-status.ts --csv /tmp/photos.csv
 *   pnpm tsx --env-file=.env.local scripts/scan-photo-status.ts --apply
 *
 * Production counts need Infra Desk to run this against production after
 * migration 0010. This environment only has the local seed.
 */
import { writeFileSync } from 'node:fs';
import { neon, neonConfig } from '@neondatabase/serverless';
import { classifyPhotoUrl, type ClassifyCache } from '../src/lib/logos/classify';
import {
  KNOWN_PHOTO_PLACEHOLDER_SHA256,
  PLAYER_SILHOUETTE_SHA256,
  type LogoStatus,
} from '../src/lib/logos/status';

if (process.env.LOCAL_NEON_FETCH_ENDPOINT) {
  neonConfig.fetchEndpoint = process.env.LOCAL_NEON_FETCH_ENDPOINT;
}

const apply = process.argv.includes('--apply');
const csvIdx = process.argv.indexOf('--csv');
const csvPath = csvIdx >= 0 ? process.argv[csvIdx + 1] : '';
const concIdx = process.argv.indexOf('--concurrency');
const concurrency = Math.max(
  1,
  Math.min(8, Number(concIdx >= 0 ? process.argv[concIdx + 1] : 4) || 4),
);

type Kind = 'player' | 'coach';
type Row = {
  kind: Kind;
  id: number;
  name: string;
  slug: string | null;
  url: string | null;
  previous: LogoStatus | null;
};

function displayName(name: unknown): string {
  if (typeof name === 'string') return name;
  if (name && typeof name === 'object') {
    const o = name as Record<string, string>;
    return o.en || o.fr || o.ar || Object.values(o)[0] || '';
  }
  return '';
}

function reasonOf(r: {
  status: LogoStatus;
  sha256: string | null;
  url: string | null;
  httpStatus: number | null;
}): string {
  if (r.status === 'placeholder') return `placeholder:${r.sha256?.slice(0, 12)}`;
  if (r.status === 'missing' && !r.url) return 'empty-url';
  if (r.status === 'missing' && r.httpStatus) return `http-${r.httpStatus}`;
  if (r.status === 'missing') return 'fetch-failed';
  return 'ok';
}

function canonicalPhotoUrl(kind: Kind, id: number, stored: string | null): string {
  if (stored && /^https?:\/\//i.test(stored)) return stored;
  return kind === 'player'
    ? `https://media.api-sports.io/football/players/${id}.png`
    : `https://media.api-sports.io/football/coachs/${id}.png`;
}

async function mapPool<T, R>(items: T[], n: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, worker));
  return out;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  const sql = neon(url);

  const playerRows = (await sql.query(
    `SELECT id, slug, name, firstname, lastname, photo_url AS url, photo_status AS previous
       FROM players
      ORDER BY id`,
  )) as {
    id: number;
    slug: string;
    name: unknown;
    firstname: string | null;
    lastname: string | null;
    url: string | null;
    previous: LogoStatus | null;
  }[];

  const coachRows = (await sql.query(
    `SELECT id, name, firstname, lastname, photo_url AS url, photo_status AS previous
       FROM coaches
      ORDER BY id`,
  )) as {
    id: number;
    name: unknown;
    firstname: string | null;
    lastname: string | null;
    url: string | null;
    previous: LogoStatus | null;
  }[];

  const rows: Row[] = [
    ...playerRows.map((r) => ({
      kind: 'player' as const,
      id: Number(r.id),
      name: [r.firstname, r.lastname].filter(Boolean).join(' ').trim() || displayName(r.name),
      slug: r.slug,
      url: r.url,
      previous: r.previous,
    })),
    ...coachRows.map((r) => ({
      kind: 'coach' as const,
      id: Number(r.id),
      name: [r.firstname, r.lastname].filter(Boolean).join(' ').trim() || displayName(r.name),
      slug: null,
      url: r.url,
      previous: r.previous,
    })),
  ];

  const cache: ClassifyCache = new Map();
  console.log(
    `scanning ${rows.length} photos (players ${playerRows.length}, coaches ${coachRows.length}), concurrency ${concurrency}`,
  );

  type Result = Row & {
    status: LogoStatus;
    sha256: string | null;
    httpStatus: number | null;
    bytes: number | null;
    reason: string;
  };

  const results = await mapPool(rows, concurrency, async (row): Promise<Result> => {
    const apiUrl = canonicalPhotoUrl(row.kind, row.id, row.url);
    const api = await classifyPhotoUrl(row.url && /^https?:/i.test(row.url) ? row.url : apiUrl, {
      cache,
      timeoutMs: 8000,
    });
    const base: Result = {
      ...row,
      status: api.status,
      sha256: api.sha256,
      httpStatus: api.httpStatus,
      bytes: api.bytes,
      reason: '',
    };
    base.reason = reasonOf(base);
    return base;
  });

  const byStatus = (s: LogoStatus) => results.filter((r) => r.status === s);
  const fallbacks = results.filter((r) => r.status !== 'ok');

  const hashCounts = new Map<string, { n: number; sample: string[] }>();
  for (const r of results) {
    if (!r.sha256) continue;
    const cur = hashCounts.get(r.sha256) ?? { n: 0, sample: [] };
    cur.n += 1;
    if (cur.sample.length < 5) cur.sample.push(`${r.kind}:${r.id}`);
    hashCounts.set(r.sha256, cur);
  }
  const repeated = [...hashCounts.entries()]
    .filter(([, v]) => v.n > 1)
    .sort((a, b) => b[1].n - a[1].n);
  const newRepeated = repeated.filter(([h]) => !KNOWN_PHOTO_PLACEHOLDER_SHA256.has(h));

  console.log('\ncounts:');
  console.log(`  ok           ${byStatus('ok').length}`);
  console.log(`  placeholder  ${byStatus('placeholder').length}`);
  console.log(`  missing      ${byStatus('missing').length}`);
  console.log(`  fallbacks    ${fallbacks.length}${apply ? '' : '  (dry-run; not written)'}`);

  console.log(`\nknown player silhouette hash:\n  ${PLAYER_SILHOUETTE_SHA256}`);
  if (repeated.length) {
    console.log(`repeated content hashes (${repeated.length}):`);
    for (const [h, v] of repeated.slice(0, 15)) {
      const known = KNOWN_PHOTO_PLACEHOLDER_SHA256.has(h) ? '  [known placeholder]' : '';
      console.log(`  ${h}  n=${v.n}${known}  e.g. ${v.sample.join(', ')}`);
    }
  }
  if (newRepeated.length) {
    console.log(
      '\nRepeated hashes not in KNOWN_PHOTO_PLACEHOLDER_SHA256 (add only if they are generic silhouettes, not shared real photos):',
    );
    for (const [h, v] of newRepeated) console.log(`  ${h}  n=${v.n}  ${v.sample.join(', ')}`);
  }

  if (fallbacks.length) {
    console.log('\nfallbacks (id, kind, name, reason):');
    for (const r of fallbacks.slice(0, 80)) {
      console.log(`  ${r.kind} ${r.id}  ${r.name}  ${r.reason}`);
    }
    if (fallbacks.length > 80) console.log(`  … +${fallbacks.length - 80} more`);
  }

  if (csvPath) {
    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const lines = [
      'kind,id,name,slug,reason,status,httpStatus,bytes,sha256,url',
      ...fallbacks.map((r) =>
        [
          r.kind,
          r.id,
          esc(r.name),
          esc(r.slug ?? ''),
          esc(r.reason),
          r.status,
          r.httpStatus ?? '',
          r.bytes ?? '',
          r.sha256 ?? '',
          esc(r.url ?? ''),
        ].join(','),
      ),
    ];
    writeFileSync(csvPath, lines.join('\n') + '\n');
    console.log(
      `\nwrote ${csvPath} (${fallbacks.length} rows; local-only if this was the local seed)`,
    );
  }

  if (apply) {
    const changed = results.filter((r) => r.previous !== r.status);
    let updates = 0;
    for (const r of changed) {
      const table = r.kind === 'player' ? 'players' : 'coaches';
      await sql.query(
        `UPDATE ${table} SET photo_status = $1 WHERE id = $2 AND photo_status IS DISTINCT FROM $1`,
        [r.status, r.id],
      );
      updates += 1;
    }
    console.log(
      `\napplied: ${updates} row(s) updated (idempotent; skipped ${results.length - changed.length} unchanged)`,
    );
  } else {
    console.log('\n(dry-run — re-run with --apply to write photo_status)');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
