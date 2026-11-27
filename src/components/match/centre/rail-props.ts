import { cache } from 'react';
import { cacheLife } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import { db } from '@/lib/db/client';
import { getRailCompetitionData } from '@/lib/db/queries/match-centre';
import {
  directoryEntries,
  directoryTree,
  ALWAYS_POPULAR_IDS,
  POPULAR_ORDER,
  POPULAR_VISIBLE,
  TOURNAMENT_IDS,
} from '@/lib/constants/competition-directory';
import { resolveCompetitionLogo } from '@/lib/constants/competition-logos';
import type { Locale } from '@/lib/i18n/config';
import type { CompetitionRailProps, RailEntry } from './CompetitionRail';

async function getCachedRailData() {
  'use cache';
  cacheLife('hours');
  const ids = [...new Set(directoryEntries('en').map((e) => e.competitionId))];
  return getRailCompetitionData(db, ids);
}

export interface RailCurrent {
  id: number;
  /** Full competition name (rail label). */
  label: string;
  /** Short name for the mobile navbar picker (template: "PL"); falls back to the full name. */
  short: string;
}

/**
 * Props for the template's competition rail (desktop left rail and the mobile navbar picker):
 * Overall, Favourites, Tournament editions, Popular (active competitions in editorial order),
 * Browse (zones → countries → competitions). Shared by the match page and competition pages.
 */
async function buildRailProps(
  locale: Locale,
  currentId: number,
): Promise<{ rail: CompetitionRailProps; current: RailCurrent | null }> {
  const [data, t, tMenu] = await Promise.all([
    getCachedRailData(),
    getTranslations({ locale, namespace: 'matchCentre' }),
    getTranslations({ locale, namespace: 'megaMenu' }),
  ]);
  const bcp = locale === 'ar' ? 'ar-MA' : locale === 'en' ? 'en-GB' : 'fr-MA';
  const entries = directoryEntries(locale);
  const railEntry = (e: (typeof entries)[number]): RailEntry => ({
    id: e.competitionId,
    label: tMenu(e.labelKey),
    href: e.href,
    logo: resolveCompetitionLogo(
      e.competitionId,
      data.logos[e.competitionId] ?? null,
      data.logoStatus[e.competitionId] ?? null,
    ),
  });
  const byId = new Map(entries.map((e) => [e.competitionId, railEntry(e)]));
  const active = new Set(data.activeIds);
  const alwaysPopular = new Set<number>(ALWAYS_POPULAR_IDS);
  const popular = POPULAR_ORDER.filter(
    (id) => (active.has(id) || alwaysPopular.has(id)) && byId.has(id),
  ).map((id) => byId.get(id)!);
  const zones = directoryTree(entries, locale, t('rail.continental')).map((z) => ({
    id: z.id,
    label: t(`rail.zone.${z.id}`),
    countries: z.countries.map((c) => ({
      key: c.key,
      label: c.label,
      entries: [...c.entries].map(railEntry).sort((a, b) => a.label.localeCompare(b.label, locale)),
    })),
  }));

  const currentEntry = entries.find((e) => e.competitionId === currentId);
  const current: RailCurrent | null = currentEntry
    ? {
        id: currentId,
        label: tMenu(currentEntry.labelKey),
        short: t.has(`rail.short.${currentEntry.labelKey}`)
          ? t(`rail.short.${currentEntry.labelKey}`)
          : tMenu(currentEntry.labelKey),
      }
    : null;

  return {
    current,
    rail: {
      homeHref: `/${locale}`,
      favouritesHref: `/${locale}#matches`,
      currentId,
      popular,
      popularVisible: POPULAR_VISIBLE,
      all: [...byId.values()],
      zones,
      tournaments: TOURNAMENT_IDS.filter((id) => byId.has(id)).map((id) => byId.get(id)!),
      labels: {
        nav: t('rail.browse'),
        overall: t('rail.overall'),
        favourites: t('rail.favourites'),
        tournaments: t('rail.tournaments'),
        pinned: t('rail.pinned'),
        popular: t('rail.popular'),
        showMore: t.raw('rail.showMore') as string,
        showFewer: t('rail.showFewer'),
        browse: t('rail.browse'),
        find: t('rail.find'),
        count: t('rail.count', { n: entries.length.toLocaleString(bcp) }),
        open: t.raw('rail.open') as string,
        close: t('rail.close'),
      },
    },
  };
}

/**
 * Request-level dedupe (React `cache`): the competition page asks for the rail from the nav
 * registration, the body and the renderer; they now share one call instead of each awaiting its
 * own, and the body can start it early without a second lookup.
 */
export const getRailProps = cache(buildRailProps);
