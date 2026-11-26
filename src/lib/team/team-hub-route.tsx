import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactElement } from 'react';
import { isPathLocale, kindOfSegment, tabOfSegment } from '@/lib/team/hub-paths';
import { TeamHubPage, teamHubMetadata, type TeamHubRoute } from '@/lib/team/team-hub-page';

export interface HubRouteParams {
  params: Promise<{ locale: string; slug: string; tab?: string[] }>;
}

/**
 * Shared page behind the en/fr folders (club, national-team, selection).
 * Arabic new routes are on hold — /ar/club and /ar/national-team 404, /ar/equipe stays.
 */
async function resolve(segment: string, { params }: HubRouteParams) {
  const { locale, slug, tab } = await params;
  if (!isPathLocale(locale)) notFound();
  const kind = kindOfSegment(locale, segment);
  if (!kind || (tab && tab.length > 1)) notFound();
  const tabKey = tabOfSegment(locale, tab?.[0] ? decodeURIComponent(tab[0]) : undefined);
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
