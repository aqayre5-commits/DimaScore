import type { Metadata } from 'next';
import type { ReactElement } from 'react';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound, permanentRedirect } from 'next/navigation';
import { buildTeamMeta } from '@/lib/seo/hub-metadata';
import { isTeamIndexable } from '@/lib/seo/indexable';
import { locales, defaultLocale, type Locale } from '@/lib/i18n/config';
import type { BreadcrumbSegment } from '@/components/chrome/SeoBreadcrumb';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildGraph, buildWebPage, buildSportsTeam, buildBreadcrumbList } from '@/lib/seo/jsonld';
import { sameAsForTeam } from '@/lib/constants/entity-links';
import { db } from '@/lib/db/client';
import { BASE_URL } from '@/lib/constants/site';
import { loadTeamHub, tabHasContent, type TeamHubData } from '@/lib/team/load-team-hub';
import {
  hubPath,
  isPathLocale,
  type HubKind,
  type HubTab,
  type PathLocale,
} from '@/lib/team/hub-paths';
import { resolveHubTeam } from '@/lib/team/resolve-hub-team';
import { TeamHub } from '@/components/team-hub/TeamHub';
import { CompetitionRail } from '@/components/match/centre/CompetitionRail';
import { getRailProps } from '@/components/match/centre/rail-props';
import { NavCompetitionRegister } from '@/components/chrome/NavCompetitionRegister';
import { mcFont } from '@/components/match/centre/font';
import '@/components/match/centre/match-centre.css';

/**
 * `legacy`: the earlier single-URL page (/equipe/{slug}, hash tabs).
 * `path`: /{club|national-team}/{slug}[/{tab}] with the tab in the URL.
 */
export type TeamHubRoute = { mode: 'legacy' } | { mode: 'path'; kind: HubKind; tab: HubTab };

const baseUrl = BASE_URL;

/** Localised path of each tab that has content (en/fr new routes only). */
export function tabPathsOf(
  locale: PathLocale,
  kind: HubKind,
  data: TeamHubData,
): Partial<Record<HubTab, string>> {
  const out: Partial<Record<HubTab, string>> = {};
  for (const tab of ['overview', 'matches', 'squad', 'stats', 'transfers'] as const)
    if (tabHasContent(data, tab)) out[tab] = hubPath(locale, kind, data.publicSlug, tab);
  return out;
}

/**
 * Canonical / hreflang URL for a locale.
 * en/fr use the new club/national-team path; ar points at the existing /ar/equipe page
 * (new Arabic routes are on hold).
 */
export function teamPagePath(
  locale: Locale,
  kind: HubKind,
  publicSlug: string,
  storedSlug: string,
  tab: HubTab = 'overview',
): string {
  if (isPathLocale(locale)) return hubPath(locale, kind, publicSlug, tab);
  return `/${locale}/equipe/${encodeURIComponent(storedSlug)}`;
}

// ── Metadata ──

export async function teamHubMetadata(
  locale: string,
  teamSlug: string,
  route: TeamHubRoute,
): Promise<Metadata> {
  const typedLocale = locale as Locale;
  const resolved = await resolveHubTeam(teamSlug, route.mode === 'path' ? route.kind : undefined);

  // Unknown team → noindex. Middleware returns the real 404 (or 503 if the DB is down) before
  // this runs; the body still notFound()s so a request that skips middleware gets the 404 UI.
  if (!resolved) return { title: 'Team | DimaScore', robots: { index: false, follow: false } };

  const data = await loadTeamHub(resolved.storedSlug, typedLocale);
  if (!data) return { title: 'Team | DimaScore', robots: { index: false, follow: false } };
  const name = data.team.name;
  // Data-gate: only index teams with real data (fixtures / squad / standings). Mirrors
  // teamIndexableSitemapCondition so the page and sitemap agree.
  const indexable = await isTeamIndexable(db, data.team.id);
  const meta = buildTeamMeta({ team: name, locale });
  const { description } = meta;
  const tTab = await getTranslations({ locale, namespace: 'teamHub' });
  // Arabic (and any leftover /equipe) has no tab segment; en/fr tab URLs stay tab-specific.
  const tab: HubTab = route.mode === 'path' && isPathLocale(typedLocale) ? route.tab : 'overview';
  const title = tab === 'overview' ? meta.title : `${tTab(tab)} · ${meta.title}`;
  const kind = resolved.kind;
  const urlFor = (loc: Locale) =>
    `${baseUrl}${teamPagePath(loc, kind, resolved.publicSlug, resolved.storedSlug, tab)}`;
  // en/fr canonical is the new path; ar canonical is the existing /ar/equipe page.
  const pageUrl = urlFor(typedLocale);

  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = urlFor(loc);
  }
  languages['x-default'] = urlFor(defaultLocale);

  return {
    title,
    description,
    alternates: { canonical: pageUrl, languages },
    robots: { index: indexable, follow: true },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: 'DimaScore',
      locale: typedLocale === 'fr' ? 'fr_FR' : typedLocale === 'ar' ? 'ar_MA' : 'en_US',
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

// ── Page ──

export async function TeamHubPage({
  locale,
  teamSlug,
  route,
}: {
  locale: string;
  teamSlug: string;
  route: TeamHubRoute;
}): Promise<ReactElement> {
  setRequestLocale(locale);
  const typedLocale = locale as Locale;

  const resolved = await resolveHubTeam(teamSlug, route.mode === 'path' ? route.kind : undefined);
  if (!resolved) notFound();
  const [data, tBc] = await Promise.all([
    loadTeamHub(resolved.storedSlug, typedLocale),
    getTranslations({ locale, namespace: 'breadcrumb' }),
  ]);
  if (!data) notFound();
  const { team } = data;
  const kind = resolved.kind;
  const tabNow: HubTab = route.mode === 'path' ? route.tab : 'overview';
  if (route.mode === 'legacy') {
    // en/fr /equipe → the new page. Hash is kept by the browser and mapped on the client.
    // Arabic /equipe is unchanged (no redirect).
    if (isPathLocale(typedLocale)) {
      permanentRedirect(hubPath(typedLocale, kind, resolved.publicSlug));
    } else if (team.slug !== teamSlug) {
      permanentRedirect(`/${locale}/equipe/${team.slug}`);
    }
  } else {
    if (!isPathLocale(typedLocale)) notFound();
    if (route.kind !== kind || teamSlug !== resolved.publicSlug)
      permanentRedirect(hubPath(typedLocale, kind, resolved.publicSlug, tabNow));
    if (!tabHasContent(data, tabNow)) notFound();
  }
  const tabPaths =
    route.mode === 'path' && isPathLocale(typedLocale) ? tabPathsOf(typedLocale, kind, data) : null;
  const railId = data.primaryCompetitionId ?? data.competitions[0]?.id ?? 0;
  const { rail, current } = await getRailProps(typedLocale, railId);

  const breadcrumbs: BreadcrumbSegment[] = [{ label: tBc('football'), href: `/${locale}` }];
  const crumbComp =
    data.competitions.find((c) => c.id === data.primaryCompetitionId) ?? data.competitions[0];
  if (crumbComp) breadcrumbs.push({ label: crumbComp.name, href: crumbComp.href ?? undefined });
  breadcrumbs.push({ label: team.name });
  const pageUrl = `${baseUrl}${teamPagePath(typedLocale, kind, resolved.publicSlug, resolved.storedSlug, isPathLocale(typedLocale) ? tabNow : 'overview')}`;

  return (
    <>
      <JsonLd
        graph={buildGraph(
          buildWebPage({
            url: pageUrl,
            name: team.name,
            locale: typedLocale,
            baseUrl,
            hasBreadcrumb: true,
            primaryImage: team.logoUrl,
          }),
          buildSportsTeam({
            url: pageUrl,
            name: team.name,
            logo: team.logoUrl,
            competitionName: crumbComp?.name ?? null,
            sameAs: sameAsForTeam(team.id),
          }),
          buildBreadcrumbList(breadcrumbs, pageUrl, baseUrl),
        )}
      />
      <NavCompetitionRegister current={current} rail={rail} />
      <div className={`mc ${mcFont.variable}`}>
        <div className="shell">
          <aside className="rail">
            <CompetitionRail {...rail} />
          </aside>
          <div className="mc-mainarea">
            <TeamHub data={data} locale={typedLocale} initialTab={tabNow} tabPaths={tabPaths} />
          </div>
        </div>
      </div>
    </>
  );
}
