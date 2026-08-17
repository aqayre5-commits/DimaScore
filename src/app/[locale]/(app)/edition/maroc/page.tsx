import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { locales, type Locale } from '@/lib/i18n/config';
import { BASE_URL } from '@/lib/constants/site';
import { InnerPageShell } from '@/components/layout/InnerPageShell';
import { HomeMatchTabs } from '@/components/homepage/HomeMatchTabs';
import { HomeTrendingPlayers } from '@/components/homepage/HomeTrendingPlayers';
import { LeagueLeftRail } from '@/components/league/LeagueLeftRail';
import { HomeNextMatch } from '@/components/homepage/HomeNextMatch';
import { HomeLionsAbroad } from '@/components/homepage/HomeLionsAbroad';
import { HomeStandingsMini } from '@/components/homepage/HomeStandingsMini';
import { HomeTopScorers } from '@/components/homepage/HomeTopScorers';
import { db } from '@/lib/db/client';
import { getStandings, getCurrentSeasons } from '@/lib/db/queries';
import {
  getHomeMatchesByCategory,
  getTrendingPlayers,
  getCompetitionsByIds,
} from '@/lib/db/queries/homepage';
import {
  getNextFeaturedMatches,
  getMoroccanPlayerPerformances,
  getRightRailTopScorers,
} from '@/lib/db/queries/right-rail';
import type { StandingRow } from '@/lib/db/queries';

interface PageProps {
  params: Promise<{ locale: string }>;
}

// ── Morocco-focused league definitions ──

const MOROCCO_LEAGUES = [
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
    compId: 201,
    countryKey: 'maroc',
    slugs: { fr: 'botola-2', en: 'botola-2', ar: 'بطولة-القسم-الثاني' } as Record<string, string>,
    label: { fr: 'Botola 2', en: 'Botola 2', ar: 'بطولة القسم الثاني' },
  },
  {
    compId: 822,
    countryKey: 'maroc',
    slugs: { fr: 'coupe-du-trone', en: 'coupe-du-trone', ar: 'كأس-العرش' } as Record<
      string,
      string
    >,
    label: { fr: 'Coupe du Trône', en: 'Coupe du Trône', ar: 'كأس العرش' },
  },
];

const LEFT_RAIL_SECTIONS = [
  {
    labelKey: 'morocco' as const,
    ids: [200, 201, 822],
  },
  {
    labelKey: 'tournaments' as const,
    ids: [1, 922, 6],
  },
];

const ALL_LEFT_RAIL_IDS = LEFT_RAIL_SECTIONS.flatMap((s) => s.ids);

// ── Metadata ──

const EDITION_META: Record<Locale, { title: string; description: string }> = {
  fr: {
    title: 'DimaScore Maroc — Botola Pro, Atlas Lions, Coupe du Trône en direct',
    description:
      "Édition Maroc de DimaScore : scores en direct Botola Pro, Botola 2, Coupe du Trône, Atlas Lions, AFCON, WAFCON et joueurs marocains à l'étranger.",
  },
  en: {
    title: 'DimaScore Morocco — Botola Pro, Atlas Lions, Coupe du Trône live',
    description:
      'Morocco edition of DimaScore: live scores for Botola Pro, Botola 2, Coupe du Trône, Atlas Lions, AFCON, WAFCON and Moroccan players abroad.',
  },
  ar: {
    title: 'ديماسكور المغرب — البطولة الاحترافية، أسود الأطلس، كأس العرش مباشر',
    description:
      'النسخة المغربية من ديماسكور: نتائج مباشرة للبطولة الاحترافية، القسم الثاني، كأس العرش، أسود الأطلس، كأس أمم إفريقيا والمحترفين المغاربة بالخارج.',
  },
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const typedLocale = locale as Locale;
  const meta = EDITION_META[typedLocale];
  const pageUrl = `${BASE_URL}/${locale}/edition/maroc`;

  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = `${BASE_URL}/${loc}/edition/maroc`;
  }
  languages['x-default'] = `${BASE_URL}/fr/edition/maroc`;

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
      locale: typedLocale === 'fr' ? 'fr_MA' : typedLocale === 'ar' ? 'ar_MA' : 'en',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
    },
  };
}

// ── Page ──

export default async function MoroccoEditionPage({ params }: PageProps) {
  const { locale } = await params;
  const typedLocale = locale as Locale;
  const t = await getTranslations({ locale, namespace: 'homepage' });

  const currentSeasons = await getCurrentSeasons(db);
  const seasonMap = new Map(currentSeasons.map((s) => [s.competitionId, s.year]));

  const [
    matchesByCategory,
    trendingPlayers,
    leftRailComps,
    standingsResults,
    nextFeaturedCandidates,
    moroccanPerformances,
    topScorersData,
  ] = await Promise.all([
    getHomeMatchesByCategory(db),
    getTrendingPlayers(db, 6),
    getCompetitionsByIds(db, ALL_LEFT_RAIL_IDS),
    Promise.all(
      MOROCCO_LEAGUES.map((l) => {
        const year = seasonMap.get(l.compId);
        if (!year) return Promise.resolve([] as StandingRow[]);
        return getStandings(db, l.compId, year);
      }),
    ),
    getNextFeaturedMatches(db),
    getMoroccanPlayerPerformances(db),
    getRightRailTopScorers(db),
  ]);

  // Standings: Morocco leagues only
  const standingsLeagues = MOROCCO_LEAGUES.map((l, i) => ({
    compId: l.compId,
    compName: l.label[typedLocale] ?? l.label['en'],
    countryKey: l.countryKey,
    slug: l.slugs,
    rows: standingsResults[i],
  })).filter((l) => l.rows.length > 0);

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
    <InnerPageShell
      leftRail={<LeagueLeftRail locale={typedLocale} competitionLogos={competitionLogos} />}
      center={
        <div className="space-y-4">
          <div className="rounded-xl border border-border-subtle bg-bg-surface p-4">
            <h1 className="text-lg font-semibold text-text-primary">
              {typedLocale === 'ar'
                ? 'ديماسكور المغرب'
                : typedLocale === 'fr'
                  ? 'DimaScore Maroc'
                  : 'DimaScore Morocco'}
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              {typedLocale === 'ar'
                ? 'تابعوا كرة القدم المغربية مباشرة'
                : typedLocale === 'fr'
                  ? 'Suivez le football marocain en direct'
                  : 'Follow Moroccan football live'}
            </p>
          </div>
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
          {nextFeaturedCandidates.length > 0 && (
            <HomeNextMatch
              candidates={nextFeaturedCandidates}
              locale={typedLocale}
              labels={{
                nextMatch: t('nextMatch'),
                liveNow: t('liveNow'),
                viewMatch: t('viewMatch'),
              }}
            />
          )}

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
    />
  );
}
