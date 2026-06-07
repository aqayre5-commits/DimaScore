import type { MetadataRoute } from 'next';
import { isNotNull, asc, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import { locales, defaultLocale, type Locale } from '@/lib/i18n/config';
import { ALL_ENTRIES, buildCompetitionHref } from '@/lib/constants/competitions-mega-menu';
import { BASE_URL } from '@/lib/constants/site';

const baseUrl = BASE_URL;

/** hreflang alternates map (all locales + x-default) for a localized path builder. */
function hreflangLanguages(pathFor: (locale: Locale) => string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const loc of locales) languages[loc] = `${baseUrl}${pathFor(loc)}`;
  languages['x-default'] = `${baseUrl}${pathFor(defaultLocale)}`;
  return languages;
}

// Google caps a single sitemap at 50,000 URLs. Every row expands to one URL per
// locale, so keep (rows-per-sitemap × locales) comfortably under that ceiling.
// generateSitemaps() below partitions all URLs into chunks; Next serves the index
// at /sitemap.xml and each chunk at /sitemap/<id>.xml.
const ROWS_PER_SITEMAP = 10_000;

// Sitemap match window — keep matches from the last 12 months + all upcoming, plus every
// featured-tournament match (WC 1, AFCON 6, WAFCON 922, Botola Pro 200, Botola 2 201,
// Coupe du Trône 822) regardless of age. Old non-featured league fixtures are excluded so
// crawl budget isn't spent on the deep archive. Applied to BOTH the count in buildSegments()
// and the matches select so chunk offsets stay aligned.
const SITEMAP_MATCH_FILTER = sql`(kickoff_at >= NOW() - INTERVAL '12 months' OR competition_id IN (1, 6, 922, 200, 201, 822))`;

type Segment =
  | { kind: 'static' }
  | { kind: 'teams' | 'players' | 'matches'; offset: number; limit: number };

/**
 * Deterministic partition of every sitemap URL into <50k-URL chunks. Called by both
 * generateSitemaps() (to enumerate ids) and sitemap() (to render one id), so it must
 * return the same ordered list both times — entity slices use a stable orderBy(id).
 */
async function buildSegments(): Promise<Segment[]> {
  const res = await db.execute(
    sql`SELECT
          (SELECT count(*) FROM teams) AS teams,
          (SELECT count(*) FROM players WHERE slug IS NOT NULL) AS players,
          (SELECT count(*) FROM fixtures WHERE ${SITEMAP_MATCH_FILTER}) AS fixtures`,
  );
  const counts = res.rows[0] as { teams: string; players: string; fixtures: string };

  const segments: Segment[] = [{ kind: 'static' }];
  const addChunks = (kind: 'teams' | 'players' | 'matches', total: number) => {
    for (let offset = 0; offset < total; offset += ROWS_PER_SITEMAP) {
      segments.push({ kind, offset, limit: ROWS_PER_SITEMAP });
    }
  };
  addChunks('teams', Number(counts.teams));
  addChunks('players', Number(counts.players));
  addChunks('matches', Number(counts.fixtures));
  return segments;
}

export async function generateSitemaps(): Promise<{ id: number }[]> {
  const segments = await buildSegments();
  return segments.map((_, id) => ({ id }));
}

// ── Curated priority for the static sitemap ──
// World Cup first, then Morocco, then headline competitions; every other competition in
// ALL_ENTRIES follows at 0.8. Sourced from ALL_ENTRIES so no competition page is dropped
// (the old MEGA_MENU_SECTIONS source silently excluded the primary pages, incl. the WC).
const COMPETITION_TIERS: { priority: number; ids: number[] }[] = [
  { priority: 1.0, ids: [1] }, // World Cup 2026
  { priority: 0.95, ids: [200, 201, 822] }, // Morocco — Botola Pro, Botola 2, Coupe du Trône
  { priority: 0.9, ids: [6, 922] }, // AFCON, WAFCON
  { priority: 0.85, ids: [2, 3, 848, 39, 140, 78, 135, 61] }, // UEFA cups + top European leagues
];

/** Morocco national team — surfaced into the priority block (also present in the teams chunk). */
const FEATURED_TEAM_SLUG = 'morocco-31';

type ChangeFreq = MetadataRoute.Sitemap[number]['changeFrequency'];

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: ChangeFreq }[] = [
  { path: 'edition/maroc', priority: 0.8, changeFrequency: 'daily' },
  { path: 'about', priority: 0.5, changeFrequency: 'monthly' },
  { path: 'faq', priority: 0.5, changeFrequency: 'monthly' },
  { path: 'contact', priority: 0.4, changeFrequency: 'yearly' },
  { path: 'privacy', priority: 0.3, changeFrequency: 'yearly' },
  { path: 'legal', priority: 0.3, changeFrequency: 'yearly' },
];

function staticEntries(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  // One <url> per locale, each declaring the full hreflang alternate set (+ x-default).
  const push = (
    pathFor: (locale: Locale) => string,
    opts: { priority: number; changeFrequency: ChangeFreq },
  ) => {
    const languages: Record<string, string> = {};
    for (const loc of locales) languages[loc] = `${baseUrl}${pathFor(loc)}`;
    languages['x-default'] = `${baseUrl}${pathFor(defaultLocale)}`;
    for (const loc of locales) {
      entries.push({
        url: `${baseUrl}${pathFor(loc)}`,
        lastModified: now,
        changeFrequency: opts.changeFrequency,
        priority: opts.priority,
        alternates: { languages },
      });
    }
  };

  // Homepage
  push((l) => `/${l}`, { priority: 1.0, changeFrequency: 'daily' });

  // Competitions — priority tiers first (WC → Morocco → headline), then the long tail.
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
    const entry = ALL_ENTRIES.find((e) => e.competitionId === id);
    if (!entry) continue;
    push((l) => buildCompetitionHref(entry, l), {
      priority: tierMap.get(id) ?? 0.8,
      changeFrequency: 'daily',
    });
  }

  // Morocco national team — into the priority block.
  push((l) => `/${l}/equipe/${FEATURED_TEAM_SLUG}`, { priority: 0.95, changeFrequency: 'weekly' });

  // Static + edition pages.
  for (const r of STATIC_ROUTES) {
    push((l) => `/${l}/${r.path}`, { priority: r.priority, changeFrequency: r.changeFrequency });
  }

  return entries;
}

async function entityEntries(
  segment: Extract<Segment, { kind: 'teams' | 'players' | 'matches' }>,
): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  if (segment.kind === 'teams') {
    const rows = await db
      .select({ slug: schema.teams.slug })
      .from(schema.teams)
      .orderBy(asc(schema.teams.id))
      .limit(segment.limit)
      .offset(segment.offset);
    for (const r of rows) {
      const path = (loc: Locale) => `/${loc}/equipe/${encodeURIComponent(r.slug)}`;
      const languages = hreflangLanguages(path);
      for (const locale of locales) {
        entries.push({
          url: `${baseUrl}${path(locale)}`,
          changeFrequency: 'weekly',
          priority: 0.7,
          alternates: { languages },
        });
      }
    }
    return entries;
  }

  if (segment.kind === 'players') {
    const rows = await db
      .select({ slug: schema.players.slug })
      .from(schema.players)
      .where(isNotNull(schema.players.slug))
      .orderBy(asc(schema.players.id))
      .limit(segment.limit)
      .offset(segment.offset);
    for (const r of rows) {
      if (!r.slug) continue;
      const slug = r.slug;
      const path = (loc: Locale) => `/${loc}/joueur/${encodeURIComponent(slug)}`;
      const languages = hreflangLanguages(path);
      for (const locale of locales) {
        entries.push({
          url: `${baseUrl}${path(locale)}`,
          changeFrequency: 'weekly',
          priority: 0.6,
          alternates: { languages },
        });
      }
    }
    return entries;
  }

  // matches — trimmed to SITEMAP_MATCH_FILTER (recent + upcoming + featured-tournament history)
  const rows = await db
    .select({ id: schema.fixtures.id })
    .from(schema.fixtures)
    .where(SITEMAP_MATCH_FILTER)
    .orderBy(asc(schema.fixtures.id))
    .limit(segment.limit)
    .offset(segment.offset);
  for (const r of rows) {
    const id = r.id;
    const path = (loc: Locale) => `/${loc}/match/${id}`;
    const languages = hreflangLanguages(path);
    for (const locale of locales) {
      entries.push({
        url: `${baseUrl}${path(locale)}`,
        changeFrequency: 'weekly',
        priority: 0.5,
        alternates: { languages },
      });
    }
  }
  return entries;
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  const segments = await buildSegments();
  const segment = segments[id];
  if (!segment) return [];
  return segment.kind === 'static' ? staticEntries() : entityEntries(segment);
}
