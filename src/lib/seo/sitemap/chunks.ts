/**
 * Sitemap chunking — pure helpers (no DB), unit-tested in tests/unit/seo/sitemap-chunks.test.ts.
 *
 * Google rejects any sitemap file with more than 50,000 <loc> URLs (the old single /sitemap.xml
 * had grown to 52,620 and stopped being read). The site is now split into small chunk files
 * served by `src/app/sitemaps/sitemap.ts` (generateSitemaps) and listed by the hand-written
 * index at /sitemap-index.xml (also served at /sitemap.xml for the URL already in Search Console).
 *
 * Chunk ids:
 *   static                 home, competition hubs, Botola landings, Morocco team, footer pages
 *   teams[-N]              team profiles, CHUNK_SIZE per file
 *   players[-N]            player profiles, CHUNK_SIZE per file
 *   matches-YYYY-MM[-N]    match pages grouped by UTC kickoff month, CHUNK_SIZE per file
 */

/** Hard cap per chunk file — well under Google's 50k limit (and keeps each file a few MB). */
export const CHUNK_SIZE = 10_000;

/** Path the chunk files are served under (see src/app/sitemaps/sitemap.ts). */
export const SITEMAP_CHUNK_PATH = '/sitemaps/sitemap';

export type SitemapChunk =
  | { kind: 'static'; id: 'static' }
  | { kind: 'teams'; id: string; page: number }
  | { kind: 'players'; id: string; page: number }
  | { kind: 'matches'; id: string; month: string; page: number };

export interface SitemapCounts {
  teams: number;
  players: number;
  /** `YYYY-MM` → match URL count in that month. */
  matchesByMonth: { month: string; count: number }[];
}

function pages(count: number): number {
  return Math.max(0, Math.ceil(count / CHUNK_SIZE));
}

function pagedId(base: string, page: number): string {
  return page === 0 ? base : `${base}-${page}`;
}

/** Expand entity counts into the ordered list of chunk ids. Empty groups produce no chunk. */
export function planChunks(counts: SitemapCounts): SitemapChunk[] {
  const out: SitemapChunk[] = [{ kind: 'static', id: 'static' }];
  for (let p = 0; p < pages(counts.teams); p++) {
    out.push({ kind: 'teams', id: pagedId('teams', p), page: p });
  }
  for (let p = 0; p < pages(counts.players); p++) {
    out.push({ kind: 'players', id: pagedId('players', p), page: p });
  }
  const months = [...counts.matchesByMonth]
    .filter((m) => /^\d{4}-\d{2}$/.test(m.month) && m.count > 0)
    .sort((a, b) => (a.month < b.month ? 1 : a.month > b.month ? -1 : 0)); // newest first
  for (const m of months) {
    for (let p = 0; p < pages(m.count); p++) {
      out.push({ kind: 'matches', id: pagedId(`matches-${m.month}`, p), month: m.month, page: p });
    }
  }
  return out;
}

/** Parse a chunk id back into its descriptor. Returns null for anything malformed. */
export function parseChunkId(id: string): SitemapChunk | null {
  if (id === 'static') return { kind: 'static', id };
  let m = /^(teams|players)(?:-(\d{1,4}))?$/.exec(id);
  if (m) {
    const page = m[2] ? Number(m[2]) : 0;
    if (m[2] === '0') return null; // page 0 is always the bare id
    return { kind: m[1] as 'teams' | 'players', id, page };
  }
  m = /^matches-(\d{4})-(\d{2})(?:-(\d{1,4}))?$/.exec(id);
  if (m) {
    const month = Number(m[2]);
    if (month < 1 || month > 12) return null;
    if (m[3] === '0') return null;
    return { kind: 'matches', id, month: `${m[1]}-${m[2]}`, page: m[3] ? Number(m[3]) : 0 };
  }
  return null;
}

/** First instant of a `YYYY-MM` month and of the following month, both UTC. */
export function monthRange(month: string): { start: Date; end: Date } {
  const [y, mo] = month.split('-').map(Number);
  return { start: new Date(Date.UTC(y, mo - 1, 1)), end: new Date(Date.UTC(y, mo, 1)) };
}

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Render a <sitemapindex>. `lastModified` per chunk is optional (omitted when unknown). */
export function renderSitemapIndex(
  baseUrl: string,
  chunks: { id: string; lastModified?: Date | null }[],
): string {
  const rows = chunks.map((c) => {
    const loc = `${baseUrl}${SITEMAP_CHUNK_PATH}/${encodeURIComponent(c.id)}.xml`;
    const lm =
      c.lastModified && !Number.isNaN(c.lastModified.getTime())
        ? `<lastmod>${c.lastModified.toISOString()}</lastmod>`
        : '';
    return `<sitemap><loc>${xmlEscape(loc)}</loc>${lm}</sitemap>`;
  });
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    rows.join('\n') +
    '\n</sitemapindex>\n'
  );
}
