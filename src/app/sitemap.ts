import type { MetadataRoute } from 'next';
import { isNotNull, asc, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import { locales, defaultLocale, type Locale } from '@/lib/i18n/config';
import { ALL_ENTRIES, buildCompetitionHref } from '@/lib/constants/competitions-mega-menu';
import { BASE_URL } from '@/lib/constants/site';

const baseUrl = BASE_URL;

type ChangeFreq = MetadataRoute.Sitemap[number]['changeFrequency'];

/**
 * One <url> entry per page, listing every locale as an hreflang alternate (+ x-default). Using a
 * single entry per page (instead of one per locale) keeps the whole site under Google's 50k-URL
 * limit, so it fits in a single /sitemap.xml — no generateSitemaps() chunking, whose
 * auto-generated index route 500s under this Next.js setup.
 */
function entry(
  pathFor: (locale: Locale) => string,
  opts: { priority: number; changeFrequency: ChangeFreq; lastModified?: Date },
): MetadataRoute.Sitemap[number] {
  const languages: Record<string, string> = {};
  for (const loc of locales) languages[loc] = `${baseUrl}${pathFor(loc)}`;
  languages['x-default'] = `${baseUrl}${pathFor(defaultLocale)}`;
  return {
    url: `${baseUrl}${pathFor(defaultLocale)}`,
    lastModified: opts.lastModified,
    changeFrequency: opts.changeFrequency,
    priority: opts.priority,
    alternates: { languages },
  };
}

// Matches kept in the sitemap: last 12 months + all upcoming, plus every featured-tournament
// match (WC 1, AFCON 6, WAFCON 922, Botola Pro 200, Botola 2 201, Coupe du Trône 822) regardless
// of age — old non-featured league fixtures are excluded to keep crawl budget off the deep archive.
const SITEMAP_MATCH_FILTER = sql`(kickoff_at >= NOW() - INTERVAL '12 months' OR competition_id IN (1, 6, 922, 200, 201, 822))`;

// Curated competition priority for crawlers — global relevance order, locale-agnostic.
// (User-visible Morocco-first ordering lives in the mega menu, not in the sitemap, which is
// consumed by international search engines that don't know our editorial slant.)
const COMPETITION_TIERS: { priority: number; ids: number[] }[] = [
  { priority: 1.0, ids: [1] }, // World Cup 2026
  { priority: 0.9, ids: [6, 922] }, // AFCON, WAFCON (continental)
  { priority: 0.85, ids: [2, 3, 848, 39, 140, 78, 135, 61] }, // UEFA cups + top European leagues
  { priority: 0.8, ids: [200, 201, 822] }, // Morocco — Botola Pro, Botola 2, Coupe du Trône
];

/** Morocco national team — surfaced into the priority block (also present in the teams list). */
const FEATURED_TEAM_SLUG = 'morocco-31';

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: ChangeFreq }[] = [
  { path: 'edition/maroc', priority: 0.8, changeFrequency: 'daily' },
  { path: 'about', priority: 0.5, changeFrequency: 'monthly' },
  { path: 'faq', priority: 0.5, changeFrequency: 'monthly' },
  { path: 'contact', priority: 0.4, changeFrequency: 'yearly' },
  { path: 'privacy', priority: 0.3, changeFrequency: 'yearly' },
  { path: 'legal', priority: 0.3, changeFrequency: 'yearly' },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  // ── Homepage → competitions (WC/Morocco/headline first) → Morocco team → footer pages ──
  entries.push(
    entry((l) => `/${l}`, { priority: 1.0, changeFrequency: 'daily', lastModified: now }),
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
    entries.push(
      entry((l) => buildCompetitionHref(e, l), {
        priority: tierMap.get(id) ?? 0.8,
        changeFrequency: 'daily',
        lastModified: now,
      }),
    );
  }

  entries.push(
    entry((l) => `/${l}/equipe/${FEATURED_TEAM_SLUG}`, {
      priority: 0.95,
      changeFrequency: 'weekly',
      lastModified: now,
    }),
  );
  for (const r of STATIC_ROUTES) {
    entries.push(
      entry((l) => `/${l}/${r.path}`, {
        priority: r.priority,
        changeFrequency: r.changeFrequency,
        lastModified: now,
      }),
    );
  }

  // ── Teams ──
  const teams = await db
    .select({ slug: schema.teams.slug })
    .from(schema.teams)
    .orderBy(asc(schema.teams.id));
  for (const t of teams) {
    entries.push(
      entry((l) => `/${l}/equipe/${encodeURIComponent(t.slug)}`, {
        priority: 0.7,
        changeFrequency: 'weekly',
      }),
    );
  }

  // ── Players ──
  const players = await db
    .select({ slug: schema.players.slug })
    .from(schema.players)
    .where(isNotNull(schema.players.slug))
    .orderBy(asc(schema.players.id));
  for (const p of players) {
    if (!p.slug) continue;
    const slug = p.slug;
    entries.push(
      entry((l) => `/${l}/joueur/${encodeURIComponent(slug)}`, {
        priority: 0.6,
        changeFrequency: 'weekly',
      }),
    );
  }

  // ── Matches (trimmed window) ──
  const matches = await db
    .select({ id: schema.fixtures.id })
    .from(schema.fixtures)
    .where(SITEMAP_MATCH_FILTER)
    .orderBy(asc(schema.fixtures.id));
  for (const m of matches) {
    const id = m.id;
    entries.push(entry((l) => `/${l}/match/${id}`, { priority: 0.5, changeFrequency: 'weekly' }));
  }

  return entries;
}
