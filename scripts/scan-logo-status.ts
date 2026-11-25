/**
 * Classify every team and competition logo as ok | missing | placeholder.
 *
 * Fetches public CDN images (media.api-sports.io), hashes the bytes, and compares
 * them to known API-Sports "image not available" files. Dry-run by default;
 * pass --apply to write `logo_status`. Idempotent (only updates changed rows).
 *
 *   pnpm tsx --env-file=.env.local scripts/scan-logo-status.ts
 *   pnpm tsx --env-file=.env.local scripts/scan-logo-status.ts --csv /tmp/logos.csv
 *   pnpm tsx --env-file=.env.local scripts/scan-logo-status.ts --apply
 *
 * Production counts need Infra Desk to run this against production after
 * migration 0009. This environment only has the local seed.
 */
import { writeFileSync } from 'node:fs';
import { neon, neonConfig } from '@neondatabase/serverless';
import { classifyLogoUrl, type ClassifyCache } from '../src/lib/logos/classify';
import {
  KNOWN_PLACEHOLDER_SHA256,
  TEAM_PLACEHOLDER_SHA256,
  type LogoClassification,
  type LogoStatus,
} from '../src/lib/logos/status';
import { COMPETITION_LOGO_OVERRIDES } from '../src/lib/constants/competition-logos';

if (process.env.LOCAL_NEON_FETCH_ENDPOINT) {
  neonConfig.fetchEndpoint = process.env.LOCAL_NEON_FETCH_ENDPOINT;
}

function isHttpUrl(url: string | null | undefined): boolean {
  return !!url && /^https?:\/\//i.test(url);
}

function isLocalAsset(url: string | null | undefined): boolean {
  return !!url && url.startsWith('/');
}

/** Prefer the stored HTTP URL; otherwise the canonical API-Sports CDN path (for census). */
function canonicalApiUrl(kind: Kind, id: number, stored: string | null): string {
  if (isHttpUrl(stored)) return stored!;
  return kind === 'team'
    ? `https://media.api-sports.io/football/teams/${id}.png`
    : `https://media.api-sports.io/football/leagues/${id}.png`;
}

const apply = process.argv.includes('--apply');
const csvIdx = process.argv.indexOf('--csv');
const csvPath = csvIdx >= 0 ? process.argv[csvIdx + 1] : '';
const concIdx = process.argv.indexOf('--concurrency');
const concurrency = Math.max(
  1,
  Math.min(8, Number(concIdx >= 0 ? process.argv[concIdx + 1] : 4) || 4),
);

type Kind = 'team' | 'competition';
type Row = {
  kind: Kind;
  id: number;
  name: string;
  slug: string;
  url: string | null;
  displayUrl: string | null;
  previous: LogoStatus | null;
};

type Result = Row & LogoClassification & { displayStatus: LogoStatus; reason: string };

function displayName(name: unknown): string {
  if (!name) return '';
  if (typeof name === 'string') return name;
  const rec = name as Record<string, string>;
  return rec.en || rec.fr || rec.ar || Object.values(rec)[0] || '';
}

async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  async function worker() {
    for (;;) {
      const idx = i++;
      if (idx >= items.length) return;
      out[idx] = await fn(items[idx]!);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return out;
}

function reasonOf(r: Result): string {
  if (r.displayStatus === 'ok' && (isLocalAsset(r.displayUrl) || isLocalAsset(r.url))) {
    return r.status !== 'ok' ? 'curated-override' : 'local-asset';
  }
  if (r.status === 'placeholder') return `placeholder:${r.sha256?.slice(0, 12)}`;
  if (r.status === 'missing' && !r.url) return 'empty-url';
  if (r.status === 'missing' && r.httpStatus) return `http-${r.httpStatus}`;
  if (r.status === 'missing') return 'fetch-failed';
  return 'ok';
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  const sql = neon(url);

  const teamRows = (await sql.query(
    `SELECT id, slug, name, logo_url AS url, logo_status AS previous
       FROM teams
      ORDER BY id`,
  )) as {
    id: number;
    slug: string;
    name: unknown;
    url: string | null;
    previous: LogoStatus | null;
  }[];

  const compRows = (await sql.query(
    `SELECT id, slug, name, logo_url AS url, logo_status AS previous
       FROM competitions
      ORDER BY id`,
  )) as {
    id: number;
    slug: string;
    name: unknown;
    url: string | null;
    previous: LogoStatus | null;
  }[];

  const rows: Row[] = [
    ...teamRows.map((r) => ({
      kind: 'team' as const,
      id: Number(r.id),
      name: displayName(r.name),
      slug: r.slug,
      url: r.url,
      displayUrl: r.url,
      previous: r.previous,
    })),
    ...compRows.map((r) => ({
      kind: 'competition' as const,
      id: Number(r.id),
      name: displayName(r.name),
      slug: r.slug,
      url: r.url,
      displayUrl: COMPETITION_LOGO_OVERRIDES[Number(r.id)] ?? r.url,
      previous: r.previous,
    })),
  ];

  const cache: ClassifyCache = new Map();
  console.log(
    `scanning ${rows.length} logos (teams ${teamRows.length}, competitions ${compRows.length}), concurrency ${concurrency}`,
  );

  const results = await mapPool(rows, concurrency, async (row): Promise<Result> => {
    const apiUrl = canonicalApiUrl(row.kind, row.id, row.url);
    const api = await classifyLogoUrl(apiUrl, { cache, timeoutMs: 8000 });
    let displayStatus: LogoStatus = api.status;
    // Bundled / curated assets (e.g. /competitions/wc-2026-trophy.png) are display-ok
    // even when the API file is a placeholder or the stored URL is a relative path.
    if (isLocalAsset(row.displayUrl) || isLocalAsset(row.url)) {
      displayStatus = 'ok';
    } else if (row.displayUrl && row.displayUrl !== apiUrl && isHttpUrl(row.displayUrl)) {
      const shown = await classifyLogoUrl(row.displayUrl, { cache, timeoutMs: 8000 });
      displayStatus = shown.status;
    }
    const base: Result = {
      ...row,
      ...api,
      displayStatus,
      reason: '',
    };
    base.reason = reasonOf(base);
    return base;
  });

  const byStatus = (s: LogoStatus) => results.filter((r) => r.displayStatus === s);
  const fallbacks = results.filter((r) => r.displayStatus !== 'ok');

  // Hash census: discover additional shared placeholder files (esp. competitions).
  const hashCounts = new Map<string, { n: number; kind: Kind; sample: string[] }>();
  for (const r of results) {
    if (!r.sha256) continue;
    const cur = hashCounts.get(r.sha256) ?? { n: 0, kind: r.kind, sample: [] };
    cur.n += 1;
    if (cur.sample.length < 5) cur.sample.push(`${r.kind}:${r.id}:${r.slug}`);
    hashCounts.set(r.sha256, cur);
  }
  const repeated = [...hashCounts.entries()]
    .filter(([, v]) => v.n > 1)
    .sort((a, b) => b[1].n - a[1].n);
  const newPlaceholders = repeated.filter(([h]) => !KNOWN_PLACEHOLDER_SHA256.has(h));

  console.log('\ncounts (display status):');
  console.log(`  ok           ${byStatus('ok').length}`);
  console.log(`  placeholder  ${byStatus('placeholder').length}`);
  console.log(`  missing      ${byStatus('missing').length}`);
  console.log(`  fallbacks    ${fallbacks.length}${apply ? '' : '  (dry-run; not written)'}`);

  console.log(`\nknown team placeholder hash:\n  ${TEAM_PLACEHOLDER_SHA256}`);
  console.log(`repeated content hashes (${repeated.length}):`);
  for (const [h, v] of repeated.slice(0, 20)) {
    const known = KNOWN_PLACEHOLDER_SHA256.has(h) ? '  [known placeholder]' : '';
    console.log(`  ${h}  n=${v.n}${known}  e.g. ${v.sample.join(', ')}`);
  }
  if (newPlaceholders.length) {
    console.log(
      '\nRepeated hashes not in KNOWN_PLACEHOLDER_SHA256 (add only if they are generic placeholders, not shared real crests):',
    );
    for (const [h, v] of newPlaceholders) console.log(`  ${h}  n=${v.n}  ${v.sample.join(', ')}`);
  } else {
    console.log('\nNo additional repeated hashes beyond the known team placeholder.');
  }

  const compHashes = new Map<string, number>();
  for (const r of results.filter((x) => x.kind === 'competition' && x.sha256)) {
    compHashes.set(r.sha256!, (compHashes.get(r.sha256!) ?? 0) + 1);
  }
  console.log('\ncompetition API hashes:');
  for (const [h, n] of [...compHashes.entries()].sort((a, b) => b[1] - a[1])) {
    const note = KNOWN_PLACEHOLDER_SHA256.has(h) ? ' [same as team camera placeholder]' : '';
    console.log(`  ${h}  n=${n}${note}`);
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
          esc(r.slug),
          esc(r.reason),
          r.displayStatus,
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
    const changed = results.filter((r) => r.previous !== r.displayStatus);
    let updates = 0;
    for (const r of changed) {
      const table = r.kind === 'team' ? 'teams' : 'competitions';
      await sql.query(
        `UPDATE ${table} SET logo_status = $1 WHERE id = $2 AND logo_status IS DISTINCT FROM $1`,
        [r.displayStatus, r.id],
      );
      updates += 1;
    }
    console.log(
      `\napplied: ${updates} row(s) updated (idempotent; skipped ${results.length - changed.length} unchanged)`,
    );
  } else {
    console.log('\n(dry-run — re-run with --apply to write logo_status)');
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
