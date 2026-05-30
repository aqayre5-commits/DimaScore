import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { locales, defaultLocale, type Locale } from '@/lib/i18n/config';
import { WebSiteJsonLd } from '@/components/seo/WebSiteJsonLd';
import { OrganizationJsonLd } from '@/components/seo/OrganizationJsonLd';
import { FaqPageJsonLd } from '@/components/seo/FaqPageJsonLd';
import { InnerPageShell } from '@/components/layout/InnerPageShell';
import { HomeFeaturedCarousel } from '@/components/homepage/HomeFeaturedCarousel';
import { HomeMatchTabs } from '@/components/homepage/HomeMatchTabs';
import { HomeTrendingPlayers } from '@/components/homepage/HomeTrendingPlayers';
import { HomeLeftRail } from '@/components/homepage/HomeLeftRail';
import { HomeNextMatch } from '@/components/homepage/HomeNextMatch';
import { HomeLiveGroupStandings } from '@/components/homepage/HomeLiveGroupStandings';
import { HomeTopMatches } from '@/components/homepage/HomeTodaysMatches';
import { HomeLionsAbroad } from '@/components/homepage/HomeLionsAbroad';
import { HomeStandingsMini } from '@/components/homepage/HomeStandingsMini';
import { HomeTopScorers } from '@/components/homepage/HomeTopScorers';
import { AboutCard } from '@/components/tournament/AboutCard';
import { getHomepageAboutContent } from '@/lib/constants/homepage-about-content';
import { db } from '@/lib/db/client';
import { getStandings, getCurrentSeasons } from '@/lib/db/queries';
import {
  getFeaturedMatches,
  getHomeMatchesByCategory,
  getHomeMatchCounts,
  getTrendingPlayers,
  getCompetitionsByIds,
} from '@/lib/db/queries/homepage';
import {
  getNextFeaturedMatch,
  getLiveGroupStandings,
  getTopMatchesThisWeek,
  getMoroccanPlayerPerformances,
  getRightRailTopScorers,
} from '@/lib/db/queries/right-rail';
import { getWcVenueByTeamCodes } from '@/lib/constants/wc2026-venues';
import { getCountrySlug } from '@/lib/constants/country-slugs';
import type { StandingRow } from '@/lib/db/queries';

interface PageProps {
  params: Promise<{ locale: string }>;
}

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// ── Per-locale metadata ──

const HOME_META: Record<Locale, { title: string; description: string }> = {
  fr: {
    title:
      "Football aujourd'hui \u2014 scores en direct, Botola Pro, WC 2026, Atlas Lions | Atlas Kings",
    description:
      'Suivez le football marocain et mondial en direct : scores Botola Pro, matchs Atlas Lions, qualifications Coupe du Monde 2026, AFCON, WAFCON, classements et statistiques mises \u00e0 jour en temps r\u00e9el.',
  },
  en: {
    title: 'Football today \u2014 live scores, Botola Pro, WC 2026, Atlas Lions | Atlas Kings',
    description:
      'Follow Moroccan and world football live: Botola Pro scores, Atlas Lions fixtures, World Cup 2026 qualifiers, AFCON, WAFCON, standings and statistics updated in real time.',
  },
  ar: {
    title:
      '\u0643\u0631\u0629 \u0627\u0644\u0642\u062f\u0645 \u0627\u0644\u064a\u0648\u0645 \u2014 \u0646\u062a\u0627\u0626\u062c \u0645\u0628\u0627\u0634\u0631\u0629\u060c \u0627\u0644\u0628\u0637\u0648\u0644\u0629 \u0627\u0644\u0627\u062d\u062a\u0631\u0627\u0641\u064a\u0629\u060c \u0643\u0623\u0633 \u0627\u0644\u0639\u0627\u0644\u0645 2026\u060c \u0623\u0633\u0648\u062f \u0627\u0644\u0623\u0637\u0644\u0633 | \u0623\u0637\u0644\u0633 \u0643\u064a\u0646\u063a\u0632',
    description:
      '\u062a\u0627\u0628\u0639\u0648\u0627 \u0643\u0631\u0629 \u0627\u0644\u0642\u062f\u0645 \u0627\u0644\u0645\u063a\u0631\u0628\u064a\u0629 \u0648\u0627\u0644\u0639\u0627\u0644\u0645\u064a\u0629 \u0645\u0628\u0627\u0634\u0631\u0629: \u0646\u062a\u0627\u0626\u062c \u0627\u0644\u0628\u0637\u0648\u0644\u0629 \u0627\u0644\u0627\u062d\u062a\u0631\u0627\u0641\u064a\u0629\u060c \u0645\u0628\u0627\u0631\u064a\u0627\u062a \u0623\u0633\u0648\u062f \u0627\u0644\u0623\u0637\u0644\u0633\u060c \u062a\u0635\u0641\u064a\u0627\u062a \u0643\u0623\u0633 \u0627\u0644\u0639\u0627\u0644\u0645 2026\u060c \u0643\u0623\u0633 \u0623\u0645\u0645 \u0625\u0641\u0631\u064a\u0642\u064a\u0627\u060c \u0643\u0623\u0633 \u0623\u0645\u0645 \u0625\u0641\u0631\u064a\u0642\u064a\u0627 \u0644\u0644\u0633\u064a\u062f\u0627\u062a\u060c \u0627\u0644\u062a\u0631\u062a\u064a\u0628 \u0648\u0627\u0644\u0625\u062d\u0635\u0627\u0626\u064a\u0627\u062a \u0645\u062d\u062f\u062b\u0629 \u0641\u064a \u0627\u0644\u0648\u0642\u062a \u0627\u0644\u0641\u0639\u0644\u064a.',
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
      siteName: 'Atlas Kings',
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

// ── League definitions for standings mini widget ──

const HOMEPAGE_LEAGUES = [
  {
    compId: 200,
    countryKey: 'maroc',
    slugs: { fr: 'botola-pro', en: 'botola-pro', ar: 'البطولة-الاحترافية' } as Record<
      string,
      string
    >,
    label: { fr: 'Botola Pro', en: 'Botola Pro', ar: 'البطولة الاحترافية' },
  },
  {
    compId: 39,
    countryKey: 'angleterre',
    slugs: { fr: 'premier-league', en: 'premier-league', ar: 'الدوري-الإنجليزي-الممتاز' } as Record<
      string,
      string
    >,
    label: { fr: 'Premier League', en: 'Premier League', ar: 'الدوري الإنجليزي' },
  },
  {
    compId: 140,
    countryKey: 'espagne',
    slugs: { fr: 'la-liga', en: 'la-liga', ar: 'الدوري-الإسباني' } as Record<string, string>,
    label: { fr: 'LaLiga', en: 'LaLiga', ar: 'الدوري الإسباني' },
  },
  {
    compId: 78,
    countryKey: 'allemagne',
    slugs: { fr: 'bundesliga', en: 'bundesliga', ar: 'الدوري-الألماني' } as Record<string, string>,
    label: { fr: 'Bundesliga', en: 'Bundesliga', ar: 'الدوري الألماني' },
  },
  {
    compId: 135,
    countryKey: 'italie',
    slugs: { fr: 'serie-a', en: 'serie-a', ar: 'الدوري-الإيطالي' } as Record<string, string>,
    label: { fr: 'Serie A', en: 'Serie A', ar: 'الدوري الإيطالي' },
  },
  {
    compId: 61,
    countryKey: 'france',
    slugs: { fr: 'ligue-1', en: 'ligue-1', ar: 'الدوري-الفرنسي' } as Record<string, string>,
    label: { fr: 'Ligue 1', en: 'Ligue 1', ar: 'الدوري الفرنسي' },
  },
];

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

const LEFT_RAIL_NAME_OVERRIDES: Record<number, Record<string, string>> = {
  1: { en: 'World Cup 2026', fr: 'Coupe du Monde 2026', ar: 'كأس العالم 2026' },
  6: { en: 'AFCON 2027', fr: 'AFCON 2027', ar: 'كأس أمم إفريقيا 2027' },
  922: { en: 'WAFCON 2026', fr: 'WAFCON 2026', ar: 'كأس أمم إفريقيا للسيدات 2026' },
};

const LEFT_RAIL_LOGO_OVERRIDES: Record<number, string> = {
  1: '/logos/world-cup-2026.png',
};

// ── Page ──

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  const typedLocale = locale as Locale;
  const t = await getTranslations({ locale, namespace: 'homepage' });

  // Parallel data fetch
  const currentSeasons = await getCurrentSeasons(db);
  const seasonMap = new Map(currentSeasons.map((s) => [s.competitionId, s.year]));

  const [
    featured,
    matchesByCategory,
    matchCounts,
    trendingPlayers,
    leftRailComps,
    standingsResults,
    // Right rail data
    nextFeatured,
    liveGroupStandings,
    topMatches,
    moroccanPerformances,
    topScorersData,
  ] = await Promise.all([
    getFeaturedMatches(db),
    getHomeMatchesByCategory(db),
    getHomeMatchCounts(db),
    getTrendingPlayers(db, 6),
    getCompetitionsByIds(db, ALL_LEFT_RAIL_IDS),
    Promise.all(
      HOMEPAGE_LEAGUES.map((l) => {
        const year = seasonMap.get(l.compId);
        if (!year) return Promise.resolve([] as StandingRow[]);
        return getStandings(db, l.compId, year);
      }),
    ),
    // Right rail queries
    getNextFeaturedMatch(db),
    getLiveGroupStandings(db),
    getTopMatchesThisWeek(db),
    getMoroccanPlayerPerformances(db),
    getRightRailTopScorers(db),
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

  // Standings mini data — keep first league (Botola Pro) for right rail mini table
  const standingsLeagues = HOMEPAGE_LEAGUES.map((l, i) => ({
    compId: l.compId,
    compName: l.label[typedLocale] ?? l.label['en'],
    countryKey: l.countryKey,
    slug: l.slugs,
    rows: standingsResults[i],
  })).filter((l) => l.rows.length > 0);

  // Build left rail sections
  const compMap = new Map(leftRailComps.map((c) => [c.id, c]));
  const leftRailSections = LEFT_RAIL_SECTIONS.map((s) => ({
    label: t(s.labelKey),
    items: s.ids
      .map((id) => {
        const c = compMap.get(id);
        if (!c) return null;
        const nameOverride = LEFT_RAIL_NAME_OVERRIDES[id];
        const logoOverride = LEFT_RAIL_LOGO_OVERRIDES[id];
        if (!nameOverride && !logoOverride) return c;
        return {
          ...c,
          ...(nameOverride && { name: { ...c.name, ...nameOverride } }),
          ...(logoOverride && { logoUrl: logoOverride }),
        };
      })
      .filter((c): c is NonNullable<typeof c> => c != null),
  })).filter((s) => s.items.length > 0);

  // Labels
  const leftRailLabels = {
    viewAllCompetitions: t('viewAllCompetitions'),
    liveNow: t('liveNow'),
    todaysMatches: t('todaysMatches'),
    upcoming: t('upcomingFilter'),
    results: t('resultsFilter'),
    quickFilters: t('quickFilters'),
  };

  const matchTabLabels = {
    all: t('all'),
    live: t('live'),
    upcoming: t('upcoming'),
    results: t('resultsTab'),
    today: t('today'),
    viewFullSchedule: t('viewFullSchedule'),
    showLess: t('showLess'),
    noMatches: t('noMatches'),
  };

  const standingsLabels = {
    viewFullStandings: t('viewFullStandings'),
    team: t('team'),
    played: t('played'),
    won: t('won'),
    drawn: t('drawn'),
    lost: t('lost'),
    goalDiff: t('goalDiff'),
    points: t('points'),
  };

  return (
    <>
      <InnerPageShell
        leftRail={
          <HomeLeftRail
            sections={leftRailSections}
            counts={matchCounts}
            locale={typedLocale}
            labels={leftRailLabels}
          />
        }
        center={
          <div className="space-y-4">
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
            <HomeMatchTabs
              live={matchesByCategory.live}
              upcoming={matchesByCategory.upcoming}
              results={matchesByCategory.results}
              locale={typedLocale}
              labels={matchTabLabels}
            />
            <HomeTrendingPlayers
              players={trendingPlayers}
              locale={typedLocale}
              labels={{
                trendingPlayers: t('trendingPlayers'),
                viewAll: t('viewAll'),
                goals: t('goals'),
              }}
            />
          </div>
        }
        rightRail={
          <div className="space-y-4">
            {/* Widget 1: Featured/Live match */}
            {nextFeatured && (
              <HomeNextMatch
                match={nextFeatured.match}
                goals={nextFeatured.goals}
                locale={typedLocale}
                labels={{
                  nextMatch: t('nextMatch'),
                  liveNow: t('liveNow'),
                  viewMatch: t('viewMatch'),
                }}
              />
            )}

            {/* Widget 2: Live group standings carousel */}
            {liveGroupStandings.length > 0 && (
              <HomeLiveGroupStandings
                groups={liveGroupStandings}
                locale={typedLocale}
                labels={{
                  liveGroupStandings: t('liveGroupStandings'),
                  matchesToday: t('matchesToday'),
                  viewFullGroup: t('viewFullGroup'),
                  team: t('team'),
                  played: t('played'),
                  won: t('won'),
                  drawn: t('drawn'),
                  lost: t('lost'),
                  goalDiff: t('goalDiff'),
                  points: t('points'),
                }}
              />
            )}

            {/* Widget 3: Top matches this week */}
            {topMatches.length > 0 && (
              <HomeTopMatches
                groups={topMatches}
                locale={typedLocale}
                labels={{
                  topMatches: t('topMatches'),
                  seeAll: t('seeAll'),
                  today: t('today'),
                }}
              />
            )}

            {/* Widget 4: Lions Abroad */}
            {moroccanPerformances.length > 0 && (
              <HomeLionsAbroad
                performances={moroccanPerformances}
                locale={typedLocale}
                labels={{
                  lionsAbroad: t('lionsAbroad'),
                  last48h: t('last48h'),
                  goal: t('goal'),
                  assist: t('assist'),
                  cleanSheet: t('cleanSheet'),
                  viewAll: t('viewAll'),
                }}
              />
            )}

            {/* Widget 5: Mini league table (Botola Pro) */}
            {standingsLeagues[0] && (
              <HomeStandingsMini
                compName={standingsLeagues[0].compName}
                countryKey={standingsLeagues[0].countryKey}
                slug={standingsLeagues[0].slug}
                rows={standingsLeagues[0].rows}
                locale={typedLocale}
                labels={standingsLabels}
              />
            )}

            {/* Widget 6: Top scorers */}
            {topScorersData.scorers.length > 0 && (
              <HomeTopScorers
                competitionName={topScorersData.competitionName}
                scorers={topScorersData.scorers}
                locale={typedLocale}
                labels={{
                  topScorers: t('topScorers'),
                }}
              />
            )}
          </div>
        }
        belowCenter={<AboutCard content={getHomepageAboutContent(typedLocale)} />}
      />

      <WebSiteJsonLd baseUrl={baseUrl} locale={typedLocale} />
      <OrganizationJsonLd baseUrl={baseUrl} />
      <FaqPageJsonLd faqs={getHomepageAboutContent(typedLocale).faqs} />
    </>
  );
}
