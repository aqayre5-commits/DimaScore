import { db } from '@/lib/db/client';
import { cacheLife } from 'next/cache';
import { getStandings, getCurrentSeasons, type StandingRow } from '@/lib/db/queries';
import {
  getNextFeaturedMatches,
  getLiveGroupStandings,
  getTopMatchesThisWeek,
  getMoroccanPlayerPerformances,
  getRightRailTopScorers,
} from '@/lib/db/queries/right-rail';
import { timedQuery } from '@/lib/db/timing';
import type { Locale } from '@/lib/i18n/config';

/**
 * Leagues whose standings appear in the homepage rail (Botola first).
 * Moved here from HomeRightRailStreamed so the data fetch can be lifted out of
 * the rendering layer and shared between the desktop rail and the mobile flow.
 */
export const HOMEPAGE_LEAGUES = [
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

export interface HomeRailStandingsLeague {
  compId: number;
  compName: string;
  countryKey: string;
  slug: Record<string, string>;
  rows: StandingRow[];
}

export interface HomeRailData {
  nextFeaturedCandidates: Awaited<ReturnType<typeof getNextFeaturedMatches>>;
  liveGroupStandings: Awaited<ReturnType<typeof getLiveGroupStandings>>;
  topMatches: Awaited<ReturnType<typeof getTopMatchesThisWeek>>;
  moroccanPerformances: Awaited<ReturnType<typeof getMoroccanPlayerPerformances>>;
  topScorersData: Awaited<ReturnType<typeof getRightRailTopScorers>>;
  standingsLeagues: HomeRailStandingsLeague[];
}

/**
 * Aggregates every homepage-rail widget's data in one cached call, so the rail
 * can be rendered once and placed responsively (desktop column / mobile flow)
 * without double-querying. Cached for minutes, matching getCachedHomepageData.
 */
export async function getHomeRailData(locale: Locale): Promise<HomeRailData> {
  'use cache';
  cacheLife('minutes');

  const currentSeasons = await timedQuery('getCurrentSeasons', () => getCurrentSeasons(db));
  const seasonMap = new Map(currentSeasons.map((s) => [s.competitionId, s.year]));

  const [
    nextFeaturedCandidates,
    liveGroupStandings,
    topMatches,
    moroccanPerformances,
    topScorersData,
    standingsResults,
  ] = await Promise.all([
    timedQuery('getNextFeaturedMatches', () => getNextFeaturedMatches(db)),
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

  const standingsLeagues: HomeRailStandingsLeague[] = HOMEPAGE_LEAGUES.map((l, i) => ({
    compId: l.compId,
    compName: l.label[locale] ?? l.label['en'],
    countryKey: l.countryKey,
    slug: l.slugs,
    rows: standingsResults[i],
  })).filter((l) => l.rows.length > 0);

  return {
    nextFeaturedCandidates,
    liveGroupStandings,
    topMatches,
    moroccanPerformances,
    topScorersData,
    standingsLeagues,
  };
}
