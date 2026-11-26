import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { cacheLife } from 'next/cache';
import { notFound, permanentRedirect } from 'next/navigation';
import { buildTeamMeta } from '@/lib/seo/hub-metadata';
import { isTeamIndexable } from '@/lib/seo/indexable';
import { locales, defaultLocale, type Locale } from '@/lib/i18n/config';
import type { BreadcrumbSegment } from '@/components/chrome/SeoBreadcrumb';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildGraph, buildWebPage, buildSportsTeam, buildBreadcrumbList } from '@/lib/seo/jsonld';
import { sameAsForTeam } from '@/lib/constants/entity-links';
import { db } from '@/lib/db/client';
import { getTeamBySlug } from '@/lib/db/queries/team';
import { BASE_URL } from '@/lib/constants/site';
import { getTeamDisplayName } from '@/lib/utils/team-name';
import { loadTeamHub } from '@/lib/team/load-team-hub';
import { TeamHub } from '@/components/team-hub/TeamHub';
import { CompetitionRail } from '@/components/match/centre/CompetitionRail';
import { getRailProps } from '@/components/match/centre/rail-props';
import { NavCompetitionRegister } from '@/components/chrome/NavCompetitionRegister';
import { mcFont } from '@/components/match/centre/font';
import '@/components/match/centre/match-centre.css';

interface PageProps {
  params: Promise<{ locale: string; slug: string[] }>;
}

const baseUrl = BASE_URL;

async function getCachedTeam(teamSlug: string) {
  'use cache';
  cacheLife('minutes');
  return getTeamBySlug(db, teamSlug);
}

// ── Metadata ──

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug: rawSlug } = await params;
  const typedLocale = locale as Locale;
  const teamSlug = rawSlug.map(decodeURIComponent).pop() ?? '';
  const team = await getCachedTeam(teamSlug);

  // Unknown team → noindex. Middleware returns the real 404 (or 503 if the DB is down) before
  // this runs; the body still notFound()s so a request that skips middleware gets the 404 UI.
  if (!team) return { title: 'Team | DimaScore', robots: { index: false, follow: false } };

  const name = getTeamDisplayName(team, typedLocale);
  // Data-gate: only index teams with real data (fixtures / squad / standings). Mirrors
  // teamIndexableSitemapCondition so the page and sitemap agree.
  const indexable = await isTeamIndexable(db, team.id);
  const { title, description } = buildTeamMeta({ team: name, locale });
  // Canonical uses the resolved stored slug (not the requested one) so a soft-rendered variant
  // still declares the true URL — the SEO consolidation signal, alongside the self-heal redirect.
  const pageUrl = `${baseUrl}/${locale}/equipe/${team.slug}`;

  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = `${baseUrl}/${loc}/equipe/${team.slug}`;
  }
  languages['x-default'] = `${baseUrl}/${defaultLocale}/equipe/${team.slug}`;

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

export default async function TeamPage({ params }: PageProps) {
  const { locale, slug: rawSlug } = await params;
  setRequestLocale(locale);
  const typedLocale = locale as Locale;
  const teamSlug = rawSlug.map(decodeURIComponent).pop() ?? '';

  const [data, tBc] = await Promise.all([
    loadTeamHub(teamSlug, typedLocale),
    getTranslations({ locale, namespace: 'breadcrumb' }),
  ]);
  if (!data) notFound();
  const { team } = data;
  // Canonical URL uses the stored slug; 301 any stale/variant name-part (resolution was by ID).
  if (team.slug !== teamSlug) {
    permanentRedirect(`/${locale}/equipe/${team.slug}`);
  }
  const railId = data.primaryCompetitionId ?? data.competitions[0]?.id ?? 0;
  const { rail, current } = await getRailProps(typedLocale, railId);

  const breadcrumbs: BreadcrumbSegment[] = [{ label: tBc('football'), href: `/${locale}` }];
  const crumbComp =
    data.competitions.find((c) => c.id === data.primaryCompetitionId) ?? data.competitions[0];
  if (crumbComp) breadcrumbs.push({ label: crumbComp.name, href: crumbComp.href ?? undefined });
  breadcrumbs.push({ label: team.name });
  const pageUrl = `${baseUrl}/${typedLocale}/equipe/${encodeURIComponent(team.slug)}`;

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
            <TeamHub data={data} locale={typedLocale} />
          </div>
        </div>
      </div>
    </>
  );
}
