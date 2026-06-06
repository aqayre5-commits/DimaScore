import type { MetadataRoute } from 'next';
import { isNotNull, asc, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import { locales } from '@/lib/i18n/config';
import { MEGA_MENU_SECTIONS, buildCompetitionHref } from '@/lib/constants/competitions-mega-menu';
import { BASE_URL } from '@/lib/constants/site';

const baseUrl = BASE_URL;

// Google caps a single sitemap at 50,000 URLs. Every row expands to one URL per
// locale, so keep (rows-per-sitemap × locales) comfortably under that ceiling.
// generateSitemaps() below partitions all URLs into chunks; Next serves the index
// at /sitemap.xml and each chunk at /sitemap/<id>.xml.
const ROWS_PER_SITEMAP = 10_000;

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
          (SELECT count(*) FROM fixtures) AS fixtures`,
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

function staticEntries(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  // Homepage per locale
  for (const locale of locales) {
    entries.push({
      url: `${baseUrl}/${locale}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    });
  }

  // Competition pages — from mega menu entries
  const allMegaMenuEntries = MEGA_MENU_SECTIONS.flatMap((s) => s.entries);
  for (const entry of allMegaMenuEntries) {
    for (const locale of locales) {
      entries.push({
        url: `${baseUrl}${buildCompetitionHref(entry, locale)}`,
        changeFrequency: 'daily',
        priority: 0.9,
      });
    }
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
      for (const locale of locales) {
        entries.push({
          url: `${baseUrl}/${locale}/equipe/${encodeURIComponent(r.slug)}`,
          changeFrequency: 'weekly',
          priority: 0.7,
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
      for (const locale of locales) {
        entries.push({
          url: `${baseUrl}/${locale}/joueur/${encodeURIComponent(r.slug)}`,
          changeFrequency: 'weekly',
          priority: 0.6,
        });
      }
    }
    return entries;
  }

  // matches
  const rows = await db
    .select({ id: schema.fixtures.id })
    .from(schema.fixtures)
    .orderBy(asc(schema.fixtures.id))
    .limit(segment.limit)
    .offset(segment.offset);
  for (const r of rows) {
    for (const locale of locales) {
      entries.push({
        url: `${baseUrl}/${locale}/match/${r.id}`,
        changeFrequency: 'weekly',
        priority: 0.5,
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
