import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { locales, defaultLocale, type Locale } from '@/lib/i18n/config';
import { WebSiteJsonLd } from '@/components/seo/WebSiteJsonLd';
import { OrganizationJsonLd } from '@/components/seo/OrganizationJsonLd';
import { InnerPageShell } from '@/components/layout/InnerPageShell';
import { CenterTabs } from '@/components/tournament/CenterTabs';
import { FixtureList } from '@/components/homepage/FixtureList';
import { HomeStandingsTab } from '@/components/homepage/HomeStandingsTab';
import { HomeStatsTab } from '@/components/homepage/HomeStatsTab';
import { HomeTeamsTab } from '@/components/homepage/HomeTeamsTab';
import { RightRail } from '@/components/homepage/RightRail';
import { LeagueLeftRail } from '@/components/league/LeagueLeftRail';
import { LeagueRightRailCard } from '@/components/league/LeagueRightRailCard';
import { AboutCard } from '@/components/tournament/AboutCard';
import { FaqPageJsonLd } from '@/components/seo/FaqPageJsonLd';
import { FeaturedVideosStrip } from '@/components/media/FeaturedVideosStrip';
import { getHomepageAboutContent } from '@/lib/constants/homepage-about-content';
import { db } from '@/lib/db/client';
import { getStandings, getCurrentSeasons } from '@/lib/db/queries';
import { getTopScorersForLeague } from '@/lib/db/queries/league';
import { getTopMatches } from '@/lib/db/queries/top-matches';
import { getCountrySlug } from '@/lib/constants/country-slugs';
import type { FixtureWithTeams } from '@/lib/db/queries';

interface PageProps {
  params: Promise<{ locale: string }>;
}

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// ── Per-locale metadata (homepage.md §3) ──

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

// ── Metadata ──

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

// ── League definitions for standings / stats / teams tabs ──

const HOMEPAGE_LEAGUES = [
  {
    compId: 200,
    countryKey: 'maroc',
    slugs: { fr: 'botola-pro', en: 'botola-pro', ar: 'البطولة-الاحترافية' } as Record<
      Locale,
      string
    >,
    labelKey: 'botolaStandings' as const,
  },
  {
    compId: 39,
    countryKey: 'angleterre',
    slugs: { fr: 'premier-league', en: 'premier-league', ar: 'الدوري-الإنجليزي-الممتاز' } as Record<
      Locale,
      string
    >,
    labelKey: 'eplStandings' as const,
  },
  {
    compId: 140,
    countryKey: 'espagne',
    slugs: { fr: 'la-liga', en: 'la-liga', ar: 'الدوري-الإسباني' } as Record<Locale, string>,
    labelKey: 'laLigaStandings' as const,
  },
  {
    compId: 78,
    countryKey: 'allemagne',
    slugs: { fr: 'bundesliga', en: 'bundesliga', ar: 'الدوري-الألماني' } as Record<Locale, string>,
    labelKey: 'bundesligaStandings' as const,
  },
  {
    compId: 135,
    countryKey: 'italie',
    slugs: { fr: 'serie-a', en: 'serie-a', ar: 'الدوري-الإيطالي' } as Record<Locale, string>,
    labelKey: 'serieAStandings' as const,
  },
  {
    compId: 61,
    countryKey: 'france',
    slugs: { fr: 'ligue-1', en: 'ligue-1', ar: 'الدوري-الفرنسي' } as Record<Locale, string>,
    labelKey: 'ligue1Standings' as const,
  },
] as const;

// ── Page ──

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  const typedLocale = locale as Locale;
  const t = await getTranslations({ locale, namespace: 'homepage' });
  const tR = await getTranslations({ locale, namespace: 'rightRail' });
  const tL = await getTranslations({ locale, namespace: 'leaguePage' });

  // Parallel data fetch
  const currentSeasons = await getCurrentSeasons(db);
  const seasonMap = new Map(currentSeasons.map((s) => [s.competitionId, s.year]));

  const [standingsResults, scorersResults, topMatches] = await Promise.all([
    Promise.all(
      HOMEPAGE_LEAGUES.map((l) => {
        const year = seasonMap.get(l.compId);
        if (!year) return Promise.resolve([]);
        return getStandings(db, l.compId, year);
      }),
    ),
    Promise.all(
      HOMEPAGE_LEAGUES.map((l) => {
        const year = seasonMap.get(l.compId);
        if (!year) return Promise.resolve([]);
        return getTopScorersForLeague(db, l.compId, year, 5);
      }),
    ),
    getTopMatches(db, 2),
  ]);

  // Map top matches to FixtureWithTeams for LeagueRightRailCard
  const featuredMatches: FixtureWithTeams[] = topMatches.map((m) => ({
    id: m.id,
    round: null,
    roundNumber: null,
    kickoffAt: m.kickoffAt,
    statusCode: m.statusCode,
    homeTeamId: m.homeTeamId,
    awayTeamId: m.awayTeamId,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    homeScoreHt: null,
    awayScoreHt: null,
    venueId: null,
    homeTeam: m.homeTeam,
    awayTeam: m.awayTeam,
    venue: null,
  }));

  // Build data for tabs
  const standingsData = HOMEPAGE_LEAGUES.map((l, i) => ({
    compId: l.compId,
    countryKey: l.countryKey,
    slug: l.slugs,
    heading: tR(l.labelKey),
    rows: standingsResults[i],
  }));

  const statsData = HOMEPAGE_LEAGUES.map((l, i) => ({
    compName: tR(l.labelKey).replace(' standings', '').replace(' classement', ''),
    compHref: `/${typedLocale}/competition/${getCountrySlug(l.countryKey, typedLocale)}/${l.slugs[typedLocale]}#stats`,
    players: scorersResults[i],
  }));

  const teamsData = HOMEPAGE_LEAGUES.map((l, i) => ({
    compName: tR(l.labelKey).replace(' standings', '').replace(' classement', ''),
    compHref: `/${typedLocale}/competition/${getCountrySlug(l.countryKey, typedLocale)}/${l.slugs[typedLocale]}#teams`,
    standings: standingsResults[i],
  }));

  const standingsLabels = {
    viewAll: tR('viewAll'),
    rank: tR('rank'),
    team: tR('team'),
    played: tR('played'),
    points: tR('points'),
  };

  const tabs = [
    {
      key: 'overview',
      hash: 'overview',
      labelKey: 'overview',
      content: <FixtureList locale={typedLocale} />,
    },
    {
      key: 'standings',
      hash: 'standings',
      labelKey: 'standings',
      content: (
        <HomeStandingsTab leagues={standingsData} locale={typedLocale} labels={standingsLabels} />
      ),
    },
    {
      key: 'fixtures',
      hash: 'fixtures',
      labelKey: 'fixtures',
      content: <FixtureList locale={typedLocale} />,
    },
    {
      key: 'stats',
      hash: 'stats',
      labelKey: 'stats',
      content: (
        <HomeStatsTab
          leagues={statsData}
          locale={typedLocale}
          labels={{ goals: tL('goals'), viewAll: tR('viewAll') }}
        />
      ),
    },
    {
      key: 'teams',
      hash: 'teams',
      labelKey: 'teams',
      content: (
        <HomeTeamsTab
          leagues={teamsData}
          locale={typedLocale}
          labels={{ viewAll: tR('viewAll') }}
        />
      ),
    },
  ];

  return (
    <>
      <InnerPageShell
        pageHeader={
          <div className="rounded-xl border border-border-subtle bg-bg-surface p-4">
            <h1 className="text-xl font-semibold leading-tight text-text-primary">{t('h1')}</h1>
            <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">{t('intro')}</p>
          </div>
        }
        leftRail={<LeagueLeftRail locale={typedLocale} />}
        center={<CenterTabs tabs={tabs} />}
        rightRail={
          <div className="space-y-4">
            <LeagueRightRailCard
              featuredMatches={featuredMatches}
              topScorer={scorersResults[0]?.[0] ?? null}
              locale={typedLocale}
              competitionName="Atlas Kings"
            />
            <RightRail locale={typedLocale} />
          </div>
        }
        belowCenter={
          <>
            <FeaturedVideosStrip locale={typedLocale} />
            <AboutCard content={getHomepageAboutContent(typedLocale)} />
          </>
        }
      />

      {/* Structured data */}
      <WebSiteJsonLd baseUrl={baseUrl} locale={typedLocale} />
      <OrganizationJsonLd baseUrl={baseUrl} />
      <FaqPageJsonLd faqs={getHomepageAboutContent(typedLocale).faqs} />
    </>
  );
}
