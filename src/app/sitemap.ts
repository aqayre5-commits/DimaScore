import type { MetadataRoute } from 'next';
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import { locales } from '@/lib/i18n/config';
import type { Locale } from '@/lib/i18n/config';
import { MEGA_MENU_SECTIONS, buildCompetitionHref } from '@/lib/constants/competitions-mega-menu';
import { BASE_URL } from '@/lib/constants/site';
import { isNotNull } from 'drizzle-orm';

const baseUrl = BASE_URL;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // 1. Static pages — homepage per locale
  for (const locale of locales) {
    entries.push({
      url: `${baseUrl}/${locale}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    });
  }

  // 2. Competition pages — from mega menu entries
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

  // 3. Team pages
  const teams = await db.select({ slug: schema.teams.slug }).from(schema.teams);

  for (const team of teams) {
    for (const locale of locales) {
      entries.push({
        url: `${baseUrl}/${locale}/equipe/${encodeURIComponent(team.slug)}`,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  }

  // 4. Player pages
  const players = await db
    .select({ slug: schema.players.slug })
    .from(schema.players)
    .where(isNotNull(schema.players.slug));

  for (const player of players) {
    for (const locale of locales) {
      entries.push({
        url: `${baseUrl}/${locale}/joueur/${encodeURIComponent(player.slug)}`,
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    }
  }

  // 5. Match pages — all fixtures
  const matches = await db.select({ id: schema.fixtures.id }).from(schema.fixtures);

  for (const match of matches) {
    for (const locale of locales) {
      entries.push({
        url: `${baseUrl}/${locale}/match/${match.id}`,
        changeFrequency: 'weekly',
        priority: 0.5,
      });
    }
  }

  return entries;
}
