import { db } from '@/lib/db/client';
import { sql } from 'drizzle-orm';
import { cacheLife } from 'next/cache';
import { getStandings, getCurrentSeasons, type StandingRow } from '@/lib/db/queries';
import { getNextFeaturedMatches } from '@/lib/db/queries/right-rail';
import { getResolvedTopScorers, type TopPlayerRow } from '@/lib/db/queries/league';
import { getFifaRankingTop, type ResolvedFifaRankingRow } from '@/lib/constants/fifa-ranking';
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

export interface LeagueSnapshot {
  compId: number;
  compName: string;
  countryKey: string;
  slug: Record<string, string>;
  rows: StandingRow[];
  scorers: TopPlayerRow[];
}

export interface TopPerformance {
  playerId: number;
  playerSlug: string;
  playerName: string;
  playerPhoto: string | null;
  teamName: string;
  teamLogo: string | null;
  position: string | null;
  rating: number;
}

/** Highest match-rated players from recent finished games, deduped to each player's best rating. */
export async function getTopPerformances(locale: string, limit = 5): Promise<TopPerformance[]> {
  const result = await db.execute(sql`
    SELECT fps.player_id, p.slug AS player_slug,
           COALESCE(p.name->>${locale}, p.name->>'en') AS player_name,
           p.photo_url,
           COALESCE(t.name->>${locale}, t.name->>'en') AS team_name,
           t.logo_url AS team_logo,
           fps.position, fps.rating
    FROM fixture_player_stats fps
    JOIN fixtures f ON f.id = fps.fixture_id
    JOIN players p ON p.id = fps.player_id
    LEFT JOIN teams t ON t.id = fps.team_id
    WHERE f.status_code IN ('FT', 'AET', 'PEN')
      AND f.kickoff_at >= NOW() - INTERVAL '7 days'
      AND fps.rating IS NOT NULL
      AND fps.minutes_played >= 60
    ORDER BY fps.rating DESC
    LIMIT 30`);

  const rows = result.rows as {
    player_id: number;
    player_slug: string;
    player_name: string | null;
    photo_url: string | null;
    team_name: string | null;
    team_logo: string | null;
    position: string | null;
    rating: string | null;
  }[];

  const seen = new Set<number>();
  const out: TopPerformance[] = [];
  for (const r of rows) {
    const id = Number(r.player_id);
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({
      playerId: id,
      playerSlug: r.player_slug,
      playerName: r.player_name ?? '',
      playerPhoto: r.photo_url,
      teamName: r.team_name ?? '',
      teamLogo: r.team_logo,
      position: r.position,
      rating: Number(r.rating),
    });
    if (out.length >= limit) break;
  }
  return out;
}

export interface HomeRailData {
  nextFeaturedCandidates: Awaited<ReturnType<typeof getNextFeaturedMatches>>;
  liveGroupStandings: [];
  topMatches: [];
  moroccanPerformances: [];
  leagueSnapshots: LeagueSnapshot[];
  topPerformances: TopPerformance[];
  fifaRanking: ResolvedFifaRankingRow[];
}

async function buildLeagueSnapshots(
  locale: Locale,
  leagues: typeof HOMEPAGE_LEAGUES,
): Promise<LeagueSnapshot[]> {
  const currentSeasons = await timedQuery('getCurrentSeasons', () => getCurrentSeasons(db));
  const seasonMap = new Map(currentSeasons.map((s) => [s.competitionId, s.year]));
  const [standingsResults, scorersResults] = await Promise.all([
    Promise.all(
      leagues.map((l) => {
        const year = seasonMap.get(l.compId);
        if (!year) return Promise.resolve([] as StandingRow[]);
        return timedQuery(`getStandings(${l.compId})`, () => getStandings(db, l.compId, year));
      }),
    ),
    Promise.all(
      leagues.map((l) => {
        const year = seasonMap.get(l.compId);
        if (!year) return Promise.resolve([] as TopPlayerRow[]);
        return timedQuery(`getResolvedTopScorers(${l.compId})`, () =>
          getResolvedTopScorers(db, l.compId, year, locale, 5),
        );
      }),
    ),
  ]);
  return leagues
    .map((l, i) => ({
      compId: l.compId,
      compName: l.label[locale] ?? l.label['en'],
      countryKey: l.countryKey,
      slug: l.slugs,
      rows: standingsResults[i],
      scorers: scorersResults[i],
    }))
    .filter((l) => l.rows.length > 0 || l.scorers.length > 0);
}

/**
 * Above-the-fold rail: next match only.
 * TABLE|SCORERS lives entirely in the secondary rail so the homepage does not
 * stack a Botola-only widget on top of the multi-league widget.
 */
export async function getHomeRailPrimary(locale: Locale): Promise<HomeRailData> {
  'use cache';
  cacheLife('minutes');
  void locale; // cache key; primary payload is locale-agnostic (next match only)

  const nextFeaturedCandidates = await timedQuery('getNextFeaturedMatches', () =>
    getNextFeaturedMatches(db),
  );

  return {
    nextFeaturedCandidates,
    liveGroupStandings: [],
    topMatches: [],
    moroccanPerformances: [],
    leagueSnapshots: [],
    topPerformances: [],
    fifaRanking: [],
  };
}

/**
 * Below-the-fold rail: one multi-league TABLE|SCORERS widget (Botola included
 * in the dropdown alongside world leagues), FIFA ranking, top performances.
 */
export async function getHomeRailSecondary(locale: Locale): Promise<HomeRailData> {
  'use cache';
  cacheLife('minutes');

  const [leagueSnapshots, topPerformances] = await Promise.all([
    buildLeagueSnapshots(locale, HOMEPAGE_LEAGUES),
    timedQuery('getTopPerformances', () => getTopPerformances(locale, 10)),
  ]);

  return {
    nextFeaturedCandidates: [],
    liveGroupStandings: [],
    topMatches: [],
    moroccanPerformances: [],
    leagueSnapshots,
    topPerformances,
    fifaRanking: getFifaRankingTop(locale, { limit: 10 }),
  };
}

/** @deprecated Prefer getHomeRailPrimary + getHomeRailSecondary */
export async function getHomeRailData(locale: Locale): Promise<HomeRailData> {
  const [primary, secondary] = await Promise.all([
    getHomeRailPrimary(locale),
    getHomeRailSecondary(locale),
  ]);
  return {
    nextFeaturedCandidates: primary.nextFeaturedCandidates,
    liveGroupStandings: [],
    topMatches: [],
    moroccanPerformances: [],
    leagueSnapshots: [...primary.leagueSnapshots, ...secondary.leagueSnapshots],
    topPerformances: secondary.topPerformances,
    fifaRanking: secondary.fifaRanking,
  };
}
