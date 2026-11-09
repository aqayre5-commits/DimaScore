import type { MetadataRoute } from 'next';
import { sql, type SQL } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { buildMatchSlug } from '@/lib/seo/match-slug';
import {
  playerIndexableSitemapCondition,
  teamIndexableSitemapCondition,
  matchIndexableSitemapCondition,
} from '@/lib/seo/indexable';
import { locales, defaultLocale, type Locale } from '@/lib/i18n/config';
import { ALL_ENTRIES, buildCompetitionHref } from '@/lib/constants/competitions-mega-menu';
import { BASE_URL } from '@/lib/constants/site';
import { botolaSeasonOpenerPath } from '@/lib/seo/botola-season-opener';
import { botolaClassementPath } from '@/lib/seo/botola-classement';
import { botola2ClassementPath } from '@/lib/seo/botola-2-classement';
import { botolaMatchsPath } from '@/lib/seo/botola-matchs';
import { CHUNK_SIZE, monthRange, planChunks, type SitemapChunk } from './chunks';

/**
 * Sitemap data layer. Inclusion rules are unchanged from the old single-file sitemap
 * (same SITEMAP_MATCH_FILTER + indexable.ts data-gates) — only the file layout and lastmod change.
 *
 * lastmod is a real data timestamp, never "now":
 *   - match:   GREATEST(updated_at, details_synced_at), capped at NOW()
 *   - team:    lastmod of the team's latest kicked-off fixture
 *   - player:  lastmod of their current team's latest kicked-off fixture (omitted if no team)
 *   - hubs:    lastmod of the latest kicked-off fixture in that competition (home: any fixture)
 *   - footer/legal pages: omitted (no reliable change date)
 */

type ChangeFreq = MetadataRoute.Sitemap[number]['changeFrequency'];
type Entry = MetadataRoute.Sitemap[number];

const baseUrl = BASE_URL;

// Matches kept in the sitemap: last 12 months + all upcoming, plus every featured-tournament
// match (WC 1, AFCON 6, WAFCON 922, Botola Pro 200, Botola 2 201, Coupe du Trône 822) regardless
// of age — old non-featured league fixtures are excluded to keep crawl budget off the deep archive.
export const SITEMAP_MATCH_FILTER = sql`(kickoff_at >= NOW() - INTERVAL '12 months' OR competition_id IN (1, 6, 922, 200, 201, 822))`;

/** Real per-fixture change time, never in the future. Unqualified columns → FROM fixtures. */
const FIXTURE_LASTMOD = sql`LEAST(GREATEST(updated_at, COALESCE(details_synced_at, updated_at)), NOW())`;

const COMPETITION_TIERS: { priority: number; ids: number[] }[] = [
  { priority: 1.0, ids: [1] }, // World Cup 2026
  { priority: 0.95, ids: [200, 201, 822] }, // Morocco — Botola Pro, Botola 2, Coupe du Trône
  { priority: 0.9, ids: [6, 922] }, // AFCON, WAFCON
  { priority: 0.85, ids: [2, 3, 848, 39, 140, 78, 135, 61] }, // UEFA cups + top European leagues
];

const FEATURED_TEAM_SLUG = 'morocco-31';
const FEATURED_TEAM_ID = 31;

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: ChangeFreq }[] = [
  { path: 'lions-abroad', priority: 0.85, changeFrequency: 'hourly' },
  { path: 'edition/maroc', priority: 0.8, changeFrequency: 'daily' },
  { path: 'about', priority: 0.5, changeFrequency: 'monthly' },
  { path: 'faq', priority: 0.5, changeFrequency: 'monthly' },
  { path: 'contact', priority: 0.4, changeFrequency: 'yearly' },
  { path: 'privacy', priority: 0.3, changeFrequency: 'yearly' },
  { path: 'legal', priority: 0.3, changeFrequency: 'yearly' },
  { path: 'terms', priority: 0.3, changeFrequency: 'yearly' },
  { path: 'cookies', priority: 0.3, changeFrequency: 'yearly' },
];

/** Percent-encode non-ASCII path segments (Arabic competition slugs), preserving '/'. */
function encodePath(path: string): string {
  return path
    .split('/')
    .map((seg) => (seg ? encodeURIComponent(seg) : seg))
    .join('/');
}

function toDate(v: unknown): Date | undefined {
  if (v == null) return undefined;
  const d = v instanceof Date ? v : new Date(String(v));
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** One <url> per page (default-locale loc) with every locale + x-default as hreflang alternates. */
export function entry(
  pathFor: (locale: Locale) => string,
  opts: { priority: number; changeFrequency: ChangeFreq; lastModified?: Date },
): Entry {
  const languages: Record<string, string> = {};
  for (const loc of locales) languages[loc] = `${baseUrl}${pathFor(loc)}`;
  languages['x-default'] = `${baseUrl}${pathFor(defaultLocale)}`;
  const e: Entry = {
    url: `${baseUrl}${pathFor(defaultLocale)}`,
    changeFrequency: opts.changeFrequency,
    priority: opts.priority,
    alternates: { languages },
  };
  if (opts.lastModified) e.lastModified = opts.lastModified;
  return e;
}

async function rows<T>(query: SQL): Promise<T[]> {
  const res = await db.execute(query);
  return res.rows as T[];
}

/**
 * team_id → lastmod of its latest kicked-off fixture (~1.5k rows). Joined in JS: a SQL join of
 * this aggregate onto players was planned as a nested loop (~3 s for one 10k chunk).
 */
async function getTeamLastmodMap(): Promise<Map<number, Date | undefined>> {
  const list = await rows<{ team_id: number | string; lm: string | Date | null }>(sql`
    SELECT team_id, MAX(lm) AS lm FROM (
      SELECT home_team_id AS team_id, ${FIXTURE_LASTMOD} AS lm FROM fixtures WHERE kickoff_at <= NOW()
      UNION ALL
      SELECT away_team_id AS team_id, ${FIXTURE_LASTMOD} AS lm FROM fixtures WHERE kickoff_at <= NOW()
    ) x WHERE team_id IS NOT NULL GROUP BY team_id`);
  return new Map(list.map((r) => [Number(r.team_id), toDate(r.lm)]));
}

// ── Counts → chunk plan ──

export async function getSitemapChunks(): Promise<SitemapChunk[]> {
  const [teamRows, playerRows, monthRows] = await Promise.all([
    rows<{ n: number | string }>(
      sql`SELECT COUNT(*) AS n FROM teams WHERE ${teamIndexableSitemapCondition}`,
    ),
    rows<{ n: number | string }>(
      sql`SELECT COUNT(*) AS n FROM players WHERE slug IS NOT NULL AND ${playerIndexableSitemapCondition}`,
    ),
    rows<{ month: string; n: number | string }>(sql`
      SELECT to_char(kickoff_at AT TIME ZONE 'UTC', 'YYYY-MM') AS month, COUNT(*) AS n
      FROM fixtures
      WHERE ${SITEMAP_MATCH_FILTER} AND ${matchIndexableSitemapCondition}
      GROUP BY 1`),
  ]);
  return planChunks({
    teams: Number(teamRows[0]?.n ?? 0),
    players: Number(playerRows[0]?.n ?? 0),
    matchesByMonth: monthRows.map((r) => ({ month: r.month, count: Number(r.n) })),
  });
}

/** Chunk list + a real lastmod per chunk, for the sitemap index. */
export async function getSitemapIndexEntries(): Promise<{ id: string; lastModified?: Date }[]> {
  const [chunks, monthLm, globalLm] = await Promise.all([
    getSitemapChunks(),
    rows<{ month: string; lm: string | Date | null }>(sql`
      SELECT to_char(kickoff_at AT TIME ZONE 'UTC', 'YYYY-MM') AS month, MAX(${FIXTURE_LASTMOD}) AS lm
      FROM fixtures
      WHERE ${SITEMAP_MATCH_FILTER} AND ${matchIndexableSitemapCondition}
      GROUP BY 1`),
    rows<{ lm: string | Date | null }>(
      sql`SELECT MAX(${FIXTURE_LASTMOD}) AS lm FROM fixtures WHERE kickoff_at <= NOW()`,
    ),
  ]);
  const byMonth = new Map(monthLm.map((r) => [r.month, toDate(r.lm)]));
  const global = toDate(globalLm[0]?.lm);
  return chunks.map((c) => ({
    id: c.id,
    // Paged match months share the month's lastmod; static/teams/players move with live data.
    lastModified: c.kind === 'matches' ? byMonth.get(c.month) : global,
  }));
}

// ── Chunk bodies ──

async function staticEntries(): Promise<Entry[]> {
  const [compLm, globalLm, moroccoLm] = await Promise.all([
    rows<{ competition_id: number | string; lm: string | Date | null }>(sql`
      SELECT competition_id, MAX(${FIXTURE_LASTMOD}) AS lm
      FROM fixtures WHERE kickoff_at <= NOW() AND competition_id IS NOT NULL
      GROUP BY competition_id`),
    rows<{ lm: string | Date | null }>(
      sql`SELECT MAX(${FIXTURE_LASTMOD}) AS lm FROM fixtures WHERE kickoff_at <= NOW()`,
    ),
    rows<{ lm: string | Date | null }>(sql`
      SELECT MAX(${FIXTURE_LASTMOD}) AS lm FROM fixtures
      WHERE kickoff_at <= NOW() AND (home_team_id = ${FEATURED_TEAM_ID} OR away_team_id = ${FEATURED_TEAM_ID})`),
  ]);
  const comp = new Map(compLm.map((r) => [Number(r.competition_id), toDate(r.lm)]));
  const global = toDate(globalLm[0]?.lm);
  const botolaPro = comp.get(200) ?? global;
  const botola2 = comp.get(201) ?? global;

  const out: Entry[] = [];
  out.push(
    entry((l) => `/${l}`, { priority: 1.0, changeFrequency: 'daily', lastModified: global }),
  );

  const tierMap = new Map<number, number>();
  for (const t of COMPETITION_TIERS) for (const id of t.ids) tierMap.set(id, t.priority);
  const orderedIds = [
    ...COMPETITION_TIERS.flatMap((t) => t.ids),
    ...ALL_ENTRIES.map((e) => e.competitionId).filter((id) => !tierMap.has(id)),
  ];
  const seen = new Set<number>();
  for (const id of orderedIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    const e = ALL_ENTRIES.find((x) => x.competitionId === id);
    if (!e) continue;
    out.push(
      entry((l) => encodePath(buildCompetitionHref(e, l)), {
        priority: tierMap.get(id) ?? 0.8,
        changeFrequency: 'daily',
        lastModified: comp.get(id),
      }),
    );
  }

  out.push(
    entry((l) => `/${l}/equipe/${FEATURED_TEAM_SLUG}`, {
      priority: 0.95,
      changeFrequency: 'weekly',
      lastModified: toDate(moroccoLm[0]?.lm),
    }),
  );
  for (const r of STATIC_ROUTES) {
    const live = r.path === 'lions-abroad' || r.path === 'edition/maroc';
    out.push(
      entry((l) => `/${l}/${r.path}`, {
        priority: r.priority,
        changeFrequency: r.changeFrequency,
        lastModified: live ? global : undefined,
      }),
    );
  }
  out.push(
    entry((l) => botolaSeasonOpenerPath(l), {
      priority: 0.9,
      changeFrequency: 'daily',
      lastModified: botolaPro,
    }),
    entry((l) => botolaClassementPath(l), {
      priority: 0.9,
      changeFrequency: 'hourly',
      lastModified: botolaPro,
    }),
    entry((l) => botola2ClassementPath(l), {
      priority: 0.9,
      changeFrequency: 'hourly',
      lastModified: botola2,
    }),
    entry((l) => botolaMatchsPath(l), {
      priority: 0.9,
      changeFrequency: 'hourly',
      lastModified: botolaPro,
    }),
  );
  return out;
}

async function teamEntries(page: number): Promise<Entry[]> {
  const [list, lastmod] = await Promise.all([
    rows<{ id: number | string; slug: string }>(sql`
      SELECT teams.id AS id, teams.slug AS slug
      FROM teams
      WHERE ${teamIndexableSitemapCondition}
      ORDER BY teams.id
      LIMIT ${CHUNK_SIZE} OFFSET ${page * CHUNK_SIZE}`),
    getTeamLastmodMap(),
  ]);
  return list.map((t) =>
    entry((l) => `/${l}/equipe/${encodeURIComponent(t.slug)}`, {
      priority: 0.7,
      changeFrequency: 'weekly',
      lastModified: lastmod.get(Number(t.id)),
    }),
  );
}

async function playerEntries(page: number): Promise<Entry[]> {
  const [list, lastmod] = await Promise.all([
    rows<{ slug: string; team_id: number | string | null }>(sql`
      SELECT players.slug AS slug, players.current_team_id AS team_id
      FROM players
      WHERE players.slug IS NOT NULL AND ${playerIndexableSitemapCondition}
      ORDER BY players.id
      LIMIT ${CHUNK_SIZE} OFFSET ${page * CHUNK_SIZE}`),
    getTeamLastmodMap(),
  ]);
  return list.map((p) =>
    entry((l) => `/${l}/joueur/${encodeURIComponent(p.slug)}`, {
      priority: 0.6,
      changeFrequency: 'weekly',
      lastModified: p.team_id == null ? undefined : lastmod.get(Number(p.team_id)),
    }),
  );
}

async function matchEntries(month: string, page: number): Promise<Entry[]> {
  const { start, end } = monthRange(month);
  const list = await rows<{
    id: number | string;
    home_slug: string | null;
    away_slug: string | null;
    lm: string | Date | null;
  }>(sql`
    SELECT fixtures.id AS id, ht.slug AS home_slug, aw.slug AS away_slug, ${FIXTURE_LASTMOD} AS lm
    FROM fixtures
    LEFT JOIN teams ht ON ht.id = fixtures.home_team_id
    LEFT JOIN teams aw ON aw.id = fixtures.away_team_id
    WHERE fixtures.kickoff_at >= ${start.toISOString()}::timestamptz
      AND fixtures.kickoff_at < ${end.toISOString()}::timestamptz
      AND ${SITEMAP_MATCH_FILTER} AND ${matchIndexableSitemapCondition}
    ORDER BY fixtures.id
    LIMIT ${CHUNK_SIZE} OFFSET ${page * CHUNK_SIZE}`);
  return list.map((m) => {
    const slug = buildMatchSlug(m.home_slug, m.away_slug, Number(m.id));
    return entry((l) => `/${l}/match/${slug}`, {
      priority: 0.5,
      changeFrequency: 'weekly',
      lastModified: toDate(m.lm),
    });
  });
}

export async function getChunkEntries(chunk: SitemapChunk): Promise<Entry[]> {
  switch (chunk.kind) {
    case 'static':
      return staticEntries();
    case 'teams':
      return teamEntries(chunk.page);
    case 'players':
      return playerEntries(chunk.page);
    case 'matches':
      return matchEntries(chunk.month, chunk.page);
  }
}
