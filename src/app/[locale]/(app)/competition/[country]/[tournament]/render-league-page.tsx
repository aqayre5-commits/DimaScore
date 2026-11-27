import { cacheLife } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n/config';
import { CompetitionPage } from '@/components/league/template/CompetitionPage';
import { DARK_LOGOS, countryFlag } from '@/lib/competitions/artwork';
import { resolveCompetitionHeaderLogo } from '@/lib/constants/competition-logos';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  buildGraph,
  buildWebPage,
  buildBreadcrumbList,
  buildFixtureItemList,
} from '@/lib/seo/jsonld';
import { BASE_URL } from '@/lib/constants/site';
import { type MegaMenuEntry } from '@/lib/constants/competitions-mega-menu';
import { db } from '@/lib/db/client';
import { getStandings } from '@/lib/db/queries';
import {
  getCompetitionById,
  getLeagueRounds,
  getCurrentRound,
  getLeagueFixtures,
  getResolvedTopScorers,
  getResolvedTopAssists,
  getTopCardsForLeague,
  getCompetitionTeams,
  getLeagueStatsMeta,
} from '@/lib/db/queries/league';
import { resolveCompetitionSeason } from '@/lib/competitions/league-season-query';
import { cacheCompetitionData } from '@/lib/competitions/cache-life';
import { formatSeasonLabel } from '@/lib/competitions/league-season';
import { toSiteDateKey, INTL_LOCALE, SITE_TZ } from '@/lib/utils/date';
import { competitionDisplayName, competitionHeading } from '@/lib/competitions/display-name';
import { getLeagueIntro, getLeagueCountryName } from '@/lib/constants/league-content';
import { teamLabel } from '@/lib/i18n/localized-names';
import { CompetitionRail } from '@/components/match/centre/CompetitionRail';
import { getRailProps } from '@/components/match/centre/rail-props';
import { NavCompetitionRegister } from '@/components/chrome/NavCompetitionRegister';
import { mcFont } from '@/components/match/centre/font';
import type { BreadcrumbSegment } from '@/components/chrome/SeoBreadcrumb';
import '@/components/match/centre/match-centre.css';

async function getCachedLeagueData(
  competitionId: number,
  seasonYear: number,
  locale: Locale,
  finishedSeason: boolean,
) {
  'use cache';
  cacheCompetitionData(finishedSeason);
  const [
    standings,
    rounds,
    currentRound,
    fixtures,
    topScorers,
    topAssists,
    topCards,
    competitionTeams,
    statsMeta,
  ] = await Promise.all([
    getStandings(db, competitionId, seasonYear),
    getLeagueRounds(db, competitionId, seasonYear),
    getCurrentRound(db, competitionId, seasonYear),
    getLeagueFixtures(db, competitionId, seasonYear),
    getResolvedTopScorers(db, competitionId, seasonYear, locale, 200),
    getResolvedTopAssists(db, competitionId, seasonYear, locale, 200),
    getTopCardsForLeague(db, competitionId, seasonYear, 200, locale),
    getCompetitionTeams(db, competitionId, seasonYear),
    getLeagueStatsMeta(db, competitionId, seasonYear),
  ]);
  return {
    standings,
    rounds,
    currentRound,
    fixtures,
    topScorers,
    topAssists,
    topCards,
    competitionTeams,
    statsMeta,
  };
}

async function getSiteTodayKey() {
  'use cache';
  cacheLife('minutes');
  return toSiteDateKey(new Date());
}

const LEAGUE_TAB_HASHES: Record<
  Locale,
  { overview: string; standings: string; fixtures: string; stats: string; teams: string }
> = {
  fr: {
    overview: 'apercu',
    standings: 'classement',
    fixtures: 'matchs',
    stats: 'statistiques',
    teams: 'equipes',
  },
  en: {
    overview: 'overview',
    standings: 'standings',
    fixtures: 'fixtures',
    stats: 'stats',
    teams: 'teams',
  },
  ar: {
    overview: 'نظرة-عامة',
    standings: 'الترتيب',
    fixtures: 'المباريات',
    stats: 'الإحصائيات',
    teams: 'الفرق',
  },
};

export async function renderLeaguePage(
  competition: NonNullable<Awaited<ReturnType<typeof getCompetitionById>>>,
  entry: MegaMenuEntry,
  locale: Locale,
  rawLocale: string,
  rawCountry: string,
  rawTournament: string,
  seasonParam?: string,
) {
  const requestedYear = seasonParam ? Number(seasonParam) : null;
  // Independent reads (translation bundles, season snapshot, rail, today key) run together; only the
  // league data below needs the resolved season year. This used to be six awaits in series.
  const [tBc, tL, tMenu, season, todayKey, railProps] = await Promise.all([
    getTranslations({ locale: rawLocale, namespace: 'breadcrumb' }),
    getTranslations({ locale: rawLocale, namespace: 'leaguePage' }),
    getTranslations({ locale: rawLocale, namespace: 'megaMenu' }),
    resolveCompetitionSeason(
      competition.id,
      requestedYear != null && Number.isFinite(requestedYear) ? requestedYear : null,
    ),
    getSiteTodayKey(),
    getRailProps(locale, competition.id),
  ]);
  const { seasonYear, seasons: availableSeasons, currentSeasonYear } = season;

  if (!seasonYear) {
    const name = competitionDisplayName(
      competition.name,
      locale,
      tMenu.has(entry.labelKey) ? tMenu(entry.labelKey) : null,
      competition.slug,
    );
    return (
      <div className="mx-auto w-full max-w-[1280px] px-4 py-8">
        <div className="mt-8 flex flex-col items-center gap-4 text-center">
          <h1 className="text-xl font-semibold text-text-primary">{name}</h1>
          <p className="text-sm text-text-tertiary">{tL('comingSoon')}</p>
        </div>
      </div>
    );
  }

  const {
    standings,
    rounds,
    currentRound,
    fixtures,
    topScorers,
    topAssists,
    topCards,
    competitionTeams,
    statsMeta,
  } = await getCachedLeagueData(
    competition.id,
    seasonYear,
    locale,
    currentSeasonYear != null && seasonYear < currentSeasonYear,
  );
  const statsThroughLabel = statsMeta.throughAt
    ? new Intl.DateTimeFormat(INTL_LOCALE[locale], {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: SITE_TZ,
      }).format(new Date(statsMeta.throughAt))
    : null;
  const { rail, current: railCurrent } = railProps;

  const competitionName = competitionDisplayName(
    competition.name,
    locale,
    tMenu.has(entry.labelKey) ? tMenu(entry.labelKey) : null,
    competition.slug,
  );
  const seasonLabel = formatSeasonLabel(seasonYear);
  const countryName = getLeagueCountryName(competition.countryCode, locale);
  const introText = getLeagueIntro(competition.id, locale);

  // Kept in JSON-LD only (the visible old-page breadcrumb is gone). Morocco still
  // has a linked country crumb in the graph so the landing URL is not dropped from structured data.
  const breadcrumbs: BreadcrumbSegment[] = [
    { label: tBc('football'), href: `/${rawLocale}` },
    ...(countryName
      ? [
          competition.countryCode === 'MA'
            ? { label: countryName, href: `/${rawLocale}/edition/maroc` }
            : { label: countryName },
        ]
      : []),
    { label: competitionName },
  ];

  const hashes = LEAGUE_TAB_HASHES[locale];
  const logoSrc = resolveCompetitionHeaderLogo(
    competition.id,
    competition.logoUrl,
    competition.logoStatus,
  );
  const invertLogo = DARK_LOGOS.has(competition.id);
  const flag = countryFlag(competition.countryCode);
  const basePath = `/${rawLocale}/competition/${rawCountry}/${rawTournament}`;
  const clubs = competitionTeams.map((team) => ({
    id: team.id,
    slug: team.slug,
    name: teamLabel(team, locale),
    logoUrl: team.logoUrl,
  }));
  const pageUrl = `${BASE_URL}/${locale}/competition/${rawCountry}/${rawTournament}`;

  return (
    <>
      <JsonLd
        graph={buildGraph(
          buildWebPage({
            url: pageUrl,
            name: competitionHeading(competitionName, seasonLabel),
            locale,
            baseUrl: BASE_URL,
            type: 'CollectionPage',
            hasBreadcrumb: true,
            mainEntityId: `${pageUrl}#fixtures`,
          }),
          buildBreadcrumbList(breadcrumbs, pageUrl, BASE_URL),
          buildFixtureItemList({
            fixtures: fixtures
              .filter((f) => f.homeTeam && f.awayTeam)
              .map((f) => ({
                id: f.id,
                kickoffAt: f.kickoffAt,
                statusCode: f.statusCode,
                homeName: teamLabel(f.homeTeam, locale),
                awayName: teamLabel(f.awayTeam, locale),
                homeSlug: f.homeTeam!.slug,
                awaySlug: f.awayTeam!.slug,
              })),
            locale,
            baseUrl: BASE_URL,
            pageUrl,
          }),
        )}
      />
      <NavCompetitionRegister current={railCurrent} rail={rail} />
      <div className={`mc ${mcFont.variable}`}>
        <div className="shell">
          <aside className="rail">
            <CompetitionRail {...rail} />
          </aside>
          <div className="mc-mainarea">
            <CompetitionPage
              locale={locale}
              competitionId={competition.id}
              competitionName={competitionName}
              logoSrc={logoSrc}
              invertLogo={invertLogo}
              countryName={countryName}
              countryFlag={flag}
              introText={introText}
              seasonYear={seasonYear}
              seasonLabel={seasonLabel}
              availableSeasons={availableSeasons}
              currentSeasonYear={currentSeasonYear}
              basePath={basePath}
              hashes={hashes}
              fixtures={fixtures}
              standings={standings}
              rounds={rounds}
              defaultRound={currentRound ?? 1}
              topScorers={topScorers}
              topAssists={topAssists}
              topCards={topCards}
              clubs={clubs}
              tableCaption={tL('tableCaption', {
                competition: competitionName,
                season: seasonLabel,
              })}
              todayKey={todayKey}
              statsPlayerCount={statsMeta.playerCount}
              statsThroughLabel={statsThroughLabel}
            />
          </div>
        </div>
      </div>
    </>
  );
}
