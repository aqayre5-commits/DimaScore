import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales, defaultLocale, type Locale } from '@/lib/i18n/config';
import { BASE_URL } from '@/lib/constants/site';
import { WebSiteJsonLd } from '@/components/seo/WebSiteJsonLd';
import { OrganizationJsonLd } from '@/components/seo/OrganizationJsonLd';
import { HomeFeaturedCarousel } from '@/components/homepage/HomeFeaturedCarousel';
import { HomeMatchTabs } from '@/components/homepage/HomeMatchTabs';
import { LeagueLeftRail } from '@/components/league/LeagueLeftRail';
import { HomeRailWidgets } from '@/components/homepage/HomeRailWidgets';
import { HomeNextMatch } from '@/components/homepage/HomeNextMatch';
import { getHomeRailData } from '@/lib/db/queries/home-rail';
import { HomeFeaturedVideos } from '@/components/homepage/HomeFeaturedVideos';
import { db } from '@/lib/db/client';
import { getMediaVideos } from '@/lib/db/queries/media';
import {
  getFeaturedMatches,
  getHomeMatchesByCategory,
  getCompetitionsByIds,
} from '@/lib/db/queries/homepage';
import { getWcVenueByTeamCodes } from '@/lib/constants/wc2026-venues';
import { cacheLife } from 'next/cache';

interface PageProps {
  params: Promise<{ locale: string }>;
}

const baseUrl = BASE_URL;

// ── Per-locale metadata ──

const HOME_META: Record<Locale, { title: string; description: string }> = {
  fr: {
    title:
      'DimaScore \u2014 Football marocain : scores en direct, calendrier, classements et couverture des matchs',
    description:
      "Scores en direct, calendrier, classements et couverture des matchs pour la Botola, les Lions de l'Atlas, les comp\u00e9titions de la CAF et les Marocains de l'\u00e9tranger.",
  },
  en: {
    title: 'DimaScore \u2014 Moroccan Football Live Scores, Fixtures, Standings & Match Coverage',
    description:
      'Live scores, fixtures, standings and match coverage for Botola, the Atlas Lions, CAF competitions and Moroccan players abroad.',
  },
  ar: {
    title:
      '\u062f\u064a\u0645\u0627 \u0633\u0643\u0648\u0631 \u2014 \u0643\u0631\u0629 \u0627\u0644\u0642\u062f\u0645 \u0627\u0644\u0645\u063a\u0631\u0628\u064a\u0629: \u0646\u062a\u0627\u0626\u062c \u0645\u0628\u0627\u0634\u0631\u0629\u060c \u0645\u0628\u0627\u0631\u064a\u0627\u062a\u060c \u062a\u0631\u062a\u064a\u0628 \u0648\u062a\u063a\u0637\u064a\u0629 \u0634\u0627\u0645\u0644\u0629',
    description:
      '\u0646\u062a\u0627\u0626\u062c \u0645\u0628\u0627\u0634\u0631\u0629 \u0648\u0645\u0648\u0627\u0639\u064a\u062f \u0627\u0644\u0645\u0628\u0627\u0631\u064a\u0627\u062a \u0648\u0627\u0644\u062a\u0631\u062a\u064a\u0628 \u0648\u062a\u063a\u0637\u064a\u0629 \u0634\u0627\u0645\u0644\u0629 \u0644\u0643\u0631\u0629 \u0627\u0644\u0642\u062f\u0645 \u0627\u0644\u0645\u063a\u0631\u0628\u064a\u0629: \u0627\u0644\u0628\u0637\u0648\u0644\u0629 \u0627\u0644\u0627\u062d\u062a\u0631\u0627\u0641\u064a\u0629\u060c \u0623\u0633\u0648\u062f \u0627\u0644\u0623\u0637\u0644\u0633\u060c \u0645\u0633\u0627\u0628\u0642\u0627\u062a \u0627\u0644\u0643\u0627\u0641\u060c \u0648\u0627\u0644\u0644\u0627\u0639\u0628\u0648\u0646 \u0627\u0644\u0645\u063a\u0627\u0631\u0628\u0629 \u0627\u0644\u0645\u062d\u062a\u0631\u0641\u0648\u0646 \u0641\u064a \u0627\u0644\u062e\u0627\u0631\u062c.',
  },
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const typedLocale = locale as Locale;
  const meta = HOME_META[typedLocale];
  const pageUrl = `${baseUrl}/${locale}`;

  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = `${baseUrl}/${loc}`;
  }
  languages['x-default'] = `${baseUrl}/${defaultLocale}`;

  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: pageUrl, languages },
    robots: { index: true, follow: true },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: pageUrl,
      siteName: 'DimaScore',
      locale: typedLocale === 'fr' ? 'fr_FR' : typedLocale === 'ar' ? 'ar_MA' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: meta.title,
      description: meta.description,
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

async function getCachedHomepageData() {
  'use cache';
  cacheLife('minutes');
  const [featured, matchesByCategory, leftRailComps, featuredVideos] = await Promise.all([
    getFeaturedMatches(db),
    getHomeMatchesByCategory(db),
    getCompetitionsByIds(db, ALL_LEFT_RAIL_IDS),
    getMediaVideos(db, { isFeatured: true, limit: 12 }),
  ]);
  return { featured, matchesByCategory, leftRailComps, featuredVideos: featuredVideos.videos };
}

// ── Page ──

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const typedLocale = locale as Locale;
  const [{ featured, matchesByCategory, leftRailComps, featuredVideos }, railData, t] =
    await Promise.all([
      getCachedHomepageData(),
      getHomeRailData(typedLocale),
      getTranslations({ locale, namespace: 'homepage' }),
    ]);

  // Enrich featured matches: WC venues + team form
  const WC_COMP_ID = 1;
  for (const m of featured) {
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

  // Left-rail competition logos — LeagueLeftRail builds its own sections + curated names
  // from the mega-menu (single source of truth, shared with every other page).
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

  return (
    <>
      <div className="mx-auto w-full max-w-[1280px] px-4 pt-4">
        <div className="mx-auto flex max-w-4xl flex-col gap-2.5 lg:grid lg:max-w-[930px] lg:grid-cols-[minmax(0,1fr)_320px] lg:grid-rows-[auto] lg:items-start xl:mx-0 xl:grid xl:max-w-none xl:grid-cols-[256px_minmax(0,1fr)_320px] xl:grid-rows-[auto] xl:items-start xl:gap-2.5">
          {/* Left rail — competition nav. Desktop only: the drawer + bottom tab bar cover mobile. */}
          <aside className="hidden xl:col-start-1 xl:row-start-1 xl:block xl:sticky xl:top-[104px] xl:max-h-[calc(100vh-120px)] xl:overflow-y-auto">
            <LeagueLeftRail locale={typedLocale} competitionLogos={competitionLogos} />
          </aside>

          {/* Center column */}
          <div className="order-1 min-w-0 lg:order-none lg:col-start-1 lg:row-start-1 xl:col-start-2 xl:row-start-1">
            <div className="space-y-2.5">
              <h1 className="px-1 text-sm font-medium text-text-secondary">{t('pageHeading')}</h1>
              <HomeFeaturedCarousel
                matches={featured}
                locale={typedLocale}
                labels={{
                  featuredMatch: t('featured'),
                  kicksOffIn: t('kicksOffIn'),
                  stadium: t('stadium'),
                  expectedAttendance: t('expectedAttendance'),
                }}
              />

              {/* Live Now / next-match card — above the tabs on mobile; desktop shows it in the rail. */}
              {railData.nextFeaturedCandidates.length > 0 && (
                <div className="lg:hidden">
                  <HomeNextMatch
                    candidates={railData.nextFeaturedCandidates}
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
                <HomeMatchTabs
                  live={matchesByCategory.live}
                  upcoming={matchesByCategory.upcoming}
                  results={matchesByCategory.results}
                  locale={typedLocale}
                  labels={matchTabLabels}
                />
              </div>

              <HomeFeaturedVideos
                videos={featuredVideos}
                labels={{ featuredVideos: t('featuredVideos') }}
              />

              {/* Rail data surfaced in the mobile flow (value-ordered); hidden on desktop. */}
              <div className="lg:hidden">
                <HomeRailWidgets data={railData} locale={typedLocale} variant="mobile" />
              </div>
            </div>
          </div>

          {/* Right rail — shown from lg (tablet 2-col) and desktop (mobile gets the value-ordered block above) */}
          <aside className="hidden lg:col-start-2 lg:row-start-1 lg:block lg:sticky lg:top-[104px] lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto xl:col-start-3 xl:row-start-1">
            <HomeRailWidgets data={railData} locale={typedLocale} variant="desktop" />
          </aside>
        </div>
      </div>

      <WebSiteJsonLd baseUrl={baseUrl} locale={typedLocale} />
      <OrganizationJsonLd baseUrl={baseUrl} />
    </>
  );
}
