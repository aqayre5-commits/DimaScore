import { getTranslations } from 'next-intl/server';
import { db } from '@/lib/db/client';
import { getStandings, getCurrentSeasons } from '@/lib/db/queries';
import {
  getNextFeaturedMatch,
  getLiveGroupStandings,
  getTopMatchesThisWeek,
  getMoroccanPlayerPerformances,
  getRightRailTopScorers,
} from '@/lib/db/queries/right-rail';
import { HomeNextMatch } from './HomeNextMatch';
import { HomeLiveGroupStandings } from './HomeLiveGroupStandings';
import { HomeTopMatches } from './HomeTodaysMatches';
import { HomeLionsAbroad } from './HomeLionsAbroad';
import { HomeStandingsMini } from './HomeStandingsMini';
import { HomeTopScorers } from './HomeTopScorers';
import type { StandingRow } from '@/lib/db/queries';
import { timedQuery } from '@/lib/db/timing';
import type { Locale } from '@/lib/i18n/config';

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

interface Props {
  locale: Locale;
}

export async function HomeRightRailStreamed({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: 'homepage' });

  const currentSeasons = await timedQuery('getCurrentSeasons', () => getCurrentSeasons(db));
  const seasonMap = new Map(currentSeasons.map((s) => [s.competitionId, s.year]));

  const [
    nextFeatured,
    liveGroupStandings,
    topMatches,
    moroccanPerformances,
    topScorersData,
    standingsResults,
  ] = await Promise.all([
    timedQuery('getNextFeaturedMatch', () => getNextFeaturedMatch(db)),
    timedQuery('getLiveGroupStandings', () => getLiveGroupStandings(db)),
    timedQuery('getTopMatchesThisWeek', () => getTopMatchesThisWeek(db)),
    timedQuery('getMoroccanPlayerPerformances', () => getMoroccanPlayerPerformances(db)),
    timedQuery('getRightRailTopScorers', () => getRightRailTopScorers(db)),
    Promise.all(
      HOMEPAGE_LEAGUES.map((l) => {
        const year = seasonMap.get(l.compId);
        if (!year) return Promise.resolve([] as StandingRow[]);
        return timedQuery(`getStandings(${l.compId})`, () => getStandings(db, l.compId, year));
      }),
    ),
  ]);

  const standingsLeagues = HOMEPAGE_LEAGUES.map((l, i) => ({
    compId: l.compId,
    compName: l.label[locale] ?? l.label['en'],
    countryKey: l.countryKey,
    slug: l.slugs,
    rows: standingsResults[i],
  })).filter((l) => l.rows.length > 0);

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
    <div className="space-y-4">
      {nextFeatured && (
        <HomeNextMatch
          match={nextFeatured.match}
          goals={nextFeatured.goals}
          locale={locale}
          labels={{
            nextMatch: t('nextMatch'),
            liveNow: t('liveNow'),
            viewMatch: t('viewMatch'),
          }}
        />
      )}

      {liveGroupStandings.length > 0 && (
        <HomeLiveGroupStandings
          groups={liveGroupStandings}
          locale={locale}
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

      {topMatches.length > 0 && (
        <HomeTopMatches
          groups={topMatches}
          locale={locale}
          labels={{
            topMatches: t('topMatches'),
            seeAll: t('seeAll'),
            today: t('today'),
          }}
        />
      )}

      {moroccanPerformances.length > 0 && (
        <HomeLionsAbroad
          performances={moroccanPerformances}
          locale={locale}
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
          locale={locale}
          labels={standingsLabels}
        />
      )}

      {topScorersData.scorers.length > 0 && (
        <HomeTopScorers
          competitionName={topScorersData.competitionName}
          scorers={topScorersData.scorers}
          locale={locale}
          labels={{
            topScorers: t('topScorers'),
          }}
        />
      )}
    </div>
  );
}
