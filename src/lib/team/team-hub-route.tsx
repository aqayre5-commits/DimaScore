import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactElement } from 'react';
import { locales, type Locale } from '@/lib/i18n/config';
import { kindOfSegment, tabOfSegment } from '@/lib/team/hub-paths';
import { TeamHubPage, teamHubMetadata, type TeamHubRoute } from '@/lib/team/team-hub-page';

export interface HubRouteParams {
  params: Promise<{ locale: string; slug: string; tab?: string[] }>;
}

/**
 * One implementation behind the five localised folders (club, national-team, selection, نادي,
 * منتخب). The folder's segment must be the one of the request's locale and the tab segment one
 * of that locale's tabs; anything else is a 404.
 */
async function resolve(segment: string, { params }: HubRouteParams) {
  const { locale, slug, tab } = await params;
  if (!(locales as readonly string[]).includes(locale)) notFound();
  const kind = kindOfSegment(locale as Locale, segment);
  if (!kind || (tab && tab.length > 1)) notFound();
  const tabKey = tabOfSegment(locale as Locale, tab?.[0] ? decodeURIComponent(tab[0]) : undefined);
  if (!tabKey) notFound();
  const route: TeamHubRoute = { mode: 'path', kind, tab: tabKey };
  return { locale, teamSlug: decodeURIComponent(slug), route };
}

export async function hubRouteMetadata(segment: string, p: HubRouteParams): Promise<Metadata> {
  const { locale, teamSlug, route } = await resolve(segment, p);
  return teamHubMetadata(locale, teamSlug, route);
}

export async function HubRoutePage(segment: string, p: HubRouteParams): Promise<ReactElement> {
  const { locale, teamSlug, route } = await resolve(segment, p);
  return TeamHubPage({ locale, teamSlug, route });
}
