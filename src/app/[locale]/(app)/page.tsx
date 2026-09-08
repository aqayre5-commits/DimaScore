import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales, defaultLocale, type Locale } from '@/lib/i18n/config';
import { BASE_URL } from '@/lib/constants/site';
import { WebSiteJsonLd } from '@/components/seo/WebSiteJsonLd';
import { OrganizationJsonLd } from '@/components/seo/OrganizationJsonLd';
import { Suspense } from 'react';
import { HomeFeatured } from '@/components/homepage/HomeFeatured';
import { HomeMatchTabs } from '@/components/homepage/HomeMatchTabs';
import { LeagueLeftRail } from '@/components/league/LeagueLeftRail';
import { HomeRailWidgets } from '@/components/homepage/HomeRailWidgets';
import { HomeNextMatch } from '@/components/homepage/HomeNextMatch';
import { getHomeRailPrimary } from '@/lib/db/queries/home-rail';
import { db } from '@/lib/db/client';
import {
  getFeaturedMatches,
  getHomeMatchesByCategory,
  getCompetitionsByIds,
} from '@/lib/db/queries/homepage';
import { getWcVenueByTeamCodes } from '@/lib/constants/wc2026-venues';
import { cacheLife } from 'next/cache';
import { partitionHomeMatches, slimHomeFixture } from '@/lib/homepage/slim-payload';
import {
  HomeDeferredRail,
  HomeDeferredVideos,
  HomeSecondaryMatchTabs,
} from '@/components/homepage/HomeDeferred';

interface PageProps {
  params: Promise<{ locale: string }>;
}

const baseUrl = BASE_URL;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const typedLocale = locale as Locale;
  const t = await getTranslations({ locale, namespace: 'homepage' });
  const title = t('metaTitle');
  const description = t('metaDescription');
  const pageUrl = `${baseUrl}/${locale}`;

  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = `${baseUrl}/${loc}`;
  }
  languages['x-default'] = `${baseUrl}/${defaultLocale}`;

  return {
    title,
    description,
    alternates: { canonical: pageUrl, languages },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: 'DimaScore',
      locale: typedLocale === 'fr' ? 'fr_FR' : typedLocale === 'ar' ? 'ar_MA' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image' as const,
      title,
      description,
    },
  };
}

// ── Left rail competition sections ──

const LEFT_RAIL_SECTIONS = [
  {
    labelKey: 'morocco' as const,
    ids: [200, 201, 822],
  },
  {
    labelKey: 'tournaments' as const,
    ids: [1, 922, 6],
  },
  {
    labelKey: 'topLeagues' as const,
    ids: [39, 140, 78, 135, 61],
  },
  {
    labelKey: 'cupsAndContinental' as const,
    ids: [2, 3, 848],
  },
];

const ALL_LEFT_RAIL_IDS = LEFT_RAIL_SECTIONS.flatMap((s) => s.ids);

// ── Cached data ──

async function getCachedHomepagePrimary() {
  'use cache';
  cacheLife('minutes');
  const [featured, matchesByCategory, leftRailComps] = await Promise.all([
    getFeaturedMatches(db),
    getHomeMatchesByCategory(db),
    getCompetitionsByIds(db, ALL_LEFT_RAIL_IDS),
  ]);
  return { featured, matchesByCategory, leftRailComps };
}

// ── Page ──

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const typedLocale = locale as Locale;
  const [{ featured, matchesByCategory, leftRailComps }, railPrimary, t] = await Promise.all([
    getCachedHomepagePrimary(),
    getHomeRailPrimary(typedLocale),
    getTranslations({ locale, namespace: 'homepage' }),
  ]);
  const { primary } = partitionHomeMatches(matchesByCategory, typedLocale);
  const featuredSlim = featured.map((m) => slimHomeFixture(m, typedLocale));

  const WC_COMP_ID = 1;
  for (const m of featuredSlim) {
    if (m.competition.id === WC_COMP_ID && !m.venueName) {
      const wcVenue = getWcVenueByTeamCodes(
        m.homeTeam?.code ?? null,
        m.awayTeam?.code ?? null,
        m.homeTeam?.name['en'],
        m.awayTeam?.name['en'],
      );
      if (wcVenue) {
        m.venueName = wcVenue.stadium;
        m.venueCity = wcVenue.city;
        m.venueCapacity = wcVenue.capacity;
      }
    }
  }

  const competitionLogos = Object.fromEntries(leftRailComps.map((c) => [c.id, c.logoUrl]));

  const matchTabLabels = {
    all: t('all'),
    live: t('live'),
    upcoming: t('upcoming'),
    results: t('resultsTab'),
    today: t('today'),
    yesterday: t('yesterday'),
    tomorrow: t('tomorrow'),
    viewFullSchedule: t('viewFullSchedule'),
    showLess: t('showLess'),
    noMatches: t('noMatches'),
    noMatchesToday: t('noMatchesToday'),
    emptyState: t('emptyState'),
    yourMatches: t('yourMatches'),
  };

  const featuredLabels = {
    matchOfDay: t('matchOfDay'),
    featured: t('featured'),
    kicksOffIn: t('kicksOffIn'),
    live: t('live'),
    tags: {
      atlasLions: t('tagAtlasLions'),
      atlasClub: t('tagAtlasClub'),
      derby: t('tagDerby'),
      knockout: t('tagKnockout'),
      opener: t('tagOpener'),
    },
  };

  return (
    <>
      <div className="mx-auto w-full max-w-[1280px] px-4 pt-4">
        <div className="mx-auto flex max-w-4xl flex-col gap-2.5 lg:grid lg:max-w-[930px] lg:grid-cols-[minmax(0,1fr)_320px] lg:grid-rows-[auto] lg:items-start xl:mx-0 xl:grid xl:max-w-none xl:grid-cols-[256px_minmax(0,1fr)_320px] xl:grid-rows-[auto] xl:items-start xl:gap-2.5">
          <aside className="hidden xl:col-start-1 xl:row-start-1 xl:block xl:sticky xl:top-[104px] xl:max-h-[calc(100vh-120px)] xl:overflow-y-auto">
            <LeagueLeftRail locale={typedLocale} competitionLogos={competitionLogos} />
          </aside>

          <div className="order-1 min-w-0 lg:order-none lg:col-start-1 lg:row-start-1 xl:col-start-2 xl:row-start-1">
            <div className="space-y-2.5">
              <h1 className="px-1 text-sm font-medium text-text-secondary">{t('pageHeading')}</h1>
              <HomeFeatured matches={featuredSlim} locale={typedLocale} labels={featuredLabels} />

              {railPrimary.nextFeaturedCandidates.length > 0 && (
                <div className="lg:hidden">
                  <HomeNextMatch
                    candidates={railPrimary.nextFeaturedCandidates}
                    locale={typedLocale}
                    labels={{
                      nextMatch: t('nextMatch'),
                      liveNow: t('liveNow'),
                      viewMatch: t('viewMatch'),
                    }}
                  />
                </div>
              )}

              <div id="matches" className="scroll-mt-24">
                <Suspense
                  fallback={
                    <HomeMatchTabs
                      live={primary.live}
                      upcoming={primary.upcoming}
                      results={primary.results}
                      locale={typedLocale}
                      labels={matchTabLabels}
                    />
                  }
                >
                  <HomeSecondaryMatchTabs locale={typedLocale} primary={primary} />
                </Suspense>
              </div>

              <Suspense fallback={null}>
                <HomeDeferredVideos locale={typedLocale} />
              </Suspense>

              <div className="lg:hidden">
                <HomeRailWidgets data={railPrimary} locale={typedLocale} variant="mobile" />
                <Suspense fallback={null}>
                  <HomeDeferredRail locale={typedLocale} variant="mobile" />
                </Suspense>
              </div>
            </div>
          </div>

          <aside className="hidden lg:col-start-2 lg:row-start-1 lg:block lg:sticky lg:top-[104px] lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto xl:col-start-3 xl:row-start-1">
            <HomeRailWidgets data={railPrimary} locale={typedLocale} variant="desktop" />
            <Suspense fallback={null}>
              <HomeDeferredRail locale={typedLocale} variant="desktop" />
            </Suspense>
          </aside>
        </div>
      </div>

      <WebSiteJsonLd baseUrl={baseUrl} locale={typedLocale} />
      <OrganizationJsonLd baseUrl={baseUrl} />
    </>
  );
}
