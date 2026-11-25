import Link from 'next/link';
import { cacheLife } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n/config';
import { CompetitionPage } from '@/components/league/template/CompetitionPage';
import { CURATED_LOGOS, DARK_LOGOS, countryFlag } from '@/lib/competitions/artwork';
import { SeoBreadcrumb, type BreadcrumbSegment } from '@/components/chrome/SeoBreadcrumb';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  buildGraph,
  buildWebPage,
  buildBreadcrumbList,
  buildFixtureItemList,
} from '@/lib/seo/jsonld';
import { BASE_URL } from '@/lib/constants/site';
import {
  getRelatedCompetitionIds,
  type MegaMenuEntry,
} from '@/lib/constants/competitions-mega-menu';
import { RelatedCompetitions } from '@/components/tournament/RelatedCompetitions';
import { CompetitionMediaSection } from '@/components/tournament/CompetitionMediaSection';
import { db } from '@/lib/db/client';
import { getStandings } from '@/lib/db/queries';
import {
  getCompetitionById,
  getLeagueCoverage,
  getLeagueRounds,
  getCurrentRound,
  getLeagueFixtures,
  getResolvedTopScorers,
  getResolvedTopAssists,
  getTopCardsForLeague,
  getCompetitionTeams,
} from '@/lib/db/queries/league';
import { resolveCompetitionSeason } from '@/lib/competitions/league-season-query';
import { formatSeasonLabel } from '@/lib/competitions/league-season';
import { toSiteDateKey } from '@/lib/utils/date';
import { competitionDisplayName, competitionHeading } from '@/lib/competitions/display-name';
import { getInjuriesForCompetition } from '@/lib/db/queries/injuries';
import { InjuriesTab } from '@/components/league/InjuriesTab';
import { LeagueAboutCard } from '@/components/league/LeagueAboutCard';
import { LeagueLeftRail } from '@/components/league/LeagueLeftRail';
import { getLeagueIntro, getLeagueCountryName } from '@/lib/constants/league-content';
import { BOTOLA_PRO_COMPETITION_ID, botolaClassementPath } from '@/lib/seo/botola-classement';
import { botolaMatchsPath } from '@/lib/seo/botola-matchs';
import { botolaSeasonOpenerPath } from '@/lib/seo/botola-season-opener';
import { MoroccoHubLinks } from '@/components/hubs/MoroccoHubLinks';
import { MOROCCO_HUB_COMPETITION_IDS, hubKeyForCompetition } from '@/lib/constants/morocco-hubs';
import { teamLabel } from '@/lib/i18n/localized-names';

async function getCachedLeagueData(competitionId: number, seasonYear: number, locale: Locale) {
  'use cache';
  cacheLife('minutes');
  const [
    coverage,
    standings,
    rounds,
    currentRound,
    fixtures,
    topScorers,
    topAssists,
    topCards,
    injuries,
    competitionTeams,
  ] = await Promise.all([
    getLeagueCoverage(db, competitionId, seasonYear),
    getStandings(db, competitionId, seasonYear),
    getLeagueRounds(db, competitionId, seasonYear),
    getCurrentRound(db, competitionId, seasonYear),
    getLeagueFixtures(db, competitionId, seasonYear),
    getResolvedTopScorers(db, competitionId, seasonYear, locale, 200),
    getResolvedTopAssists(db, competitionId, seasonYear, locale, 200),
    getTopCardsForLeague(db, competitionId, seasonYear, 200, locale),
    getInjuriesForCompetition(db, competitionId, seasonYear, 30, locale),
    getCompetitionTeams(db, competitionId, seasonYear),
  ]);
  return {
    coverage,
    standings,
    rounds,
    currentRound,
    fixtures,
    topScorers,
    topAssists,
    topCards,
    injuries,
    competitionTeams,
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
  competitionLogos?: Record<number, string | null>,
) {
  const tBc = await getTranslations({ locale: rawLocale, namespace: 'breadcrumb' });
  const tL = await getTranslations({ locale: rawLocale, namespace: 'leaguePage' });
  const tMenu = await getTranslations({ locale: rawLocale, namespace: 'megaMenu' });
  const tLandings =
    competition.id === BOTOLA_PRO_COMPETITION_ID
      ? await getTranslations({ locale: rawLocale, namespace: 'botolaMatchs' })
      : null;

  const requestedYear = seasonParam ? Number(seasonParam) : null;
  const {
    seasonYear,
    seasons: availableSeasons,
    currentSeasonYear,
  } = await resolveCompetitionSeason(
    competition.id,
    requestedYear != null && Number.isFinite(requestedYear) ? requestedYear : null,
  );

  if (!seasonYear) {
    // No season data — show coming soon
    // Same translated name as the populated hub (AR/FR coming-soon pages got the English name).
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

  // Cached parallel data fetch
  const {
    coverage,
    standings,
    rounds,
    currentRound,
    fixtures,
    topScorers,
    topAssists,
    topCards,
    injuries,
    competitionTeams,
  } = await getCachedLeagueData(competition.id, seasonYear, locale);
  const todayKey = await getSiteTodayKey();

  // Translated name (e.g. "الدوري الإنجليزي الممتاز") when the provider only stored English.
  const competitionName = competitionDisplayName(
    competition.name,
    locale,
    tMenu.has(entry.labelKey) ? tMenu(entry.labelKey) : null,
    competition.slug,
  );
  const seasonLabel = formatSeasonLabel(seasonYear);
  const countryName = getLeagueCountryName(competition.countryCode, locale);
  const introText = getLeagueIntro(competition.id, locale);

  // Breadcrumbs
  const breadcrumbs: BreadcrumbSegment[] = [
    { label: tBc('football'), href: `/${rawLocale}` },
    // Morocco links to its landing page so the crumb is clickable + present in the JSON-LD;
    // other countries have no landing, so they stay a plain (non-linked) label.
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
  const logoSrc = CURATED_LOGOS[competition.id] ?? competition.logoUrl;
  const invertLogo = DARK_LOGOS.has(competition.id);
  const flag = countryFlag(competition.countryCode);
  const basePath = `/${rawLocale}/competition/${rawCountry}/${rawTournament}`;
  const clubs = competitionTeams.map((team) => ({
    id: team.id,
    slug: team.slug,
    name: teamLabel(team, locale),
    logoUrl: team.logoUrl,
  }));

  return (
    <>
      <div className="mx-auto w-full max-w-[1280px] px-4 pt-px">
        <SeoBreadcrumb segments={breadcrumbs} compact emitJsonLd={false} />
        <JsonLd
          graph={buildGraph(
            buildWebPage({
              url: `${BASE_URL}/${locale}/competition/${rawCountry}/${rawTournament}`,
              // Matches the H1 and <title>: "Premier League 2026/27".
              name: competitionHeading(competitionName, seasonLabel),
              locale,
              baseUrl: BASE_URL,
              type: 'CollectionPage',
              hasBreadcrumb: true,
              mainEntityId: `${BASE_URL}/${locale}/competition/${rawCountry}/${rawTournament}#fixtures`,
            }),
            buildBreadcrumbList(
              breadcrumbs,
              `${BASE_URL}/${locale}/competition/${rawCountry}/${rawTournament}`,
              BASE_URL,
            ),
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
              pageUrl: `${BASE_URL}/${locale}/competition/${rawCountry}/${rawTournament}`,
            }),
          )}
        />
        {tLandings && (
          <nav className="mt-2 mb-1 flex flex-wrap gap-3 text-sm">
            <Link href={botolaMatchsPath(locale)} className="text-accent-azure hover:underline">
              {tLandings('ctaFixtures')}
            </Link>
            <Link href={botolaClassementPath(locale)} className="text-accent-azure hover:underline">
              {tLandings('ctaClassementLanding')}
            </Link>
            <Link
              href={botolaSeasonOpenerPath(locale)}
              className="text-accent-azure hover:underline"
            >
              {tLandings('ctaCalendar')}
            </Link>
          </nav>
        )}
      </div>

      <div className="mx-auto w-full max-w-[1280px] px-4 pt-4">
        <div className="flex flex-col gap-2.5 xl:grid xl:grid-cols-[256px_minmax(0,1fr)] xl:items-start xl:gap-2.5">
          <aside className="order-2 xl:order-none xl:col-start-1 xl:row-start-1 xl:block xl:sticky xl:top-[104px] xl:max-h-[calc(100vh-120px)] xl:overflow-y-auto lg:hidden xl:flex xl:flex-col">
            <LeagueLeftRail
              locale={locale}
              activeCompetitionId={competition.id}
              competitionLogos={competitionLogos}
            />
          </aside>
          <div className="order-1 min-w-0 xl:col-start-2 xl:row-start-1">
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
              tableCaption={tL('tableCaption', { competition: competitionName, season: seasonLabel })}
              todayKey={todayKey}
            />
            <div className="mt-2.5">
              <LeagueAboutCard competition={competition} seasonYear={seasonYear} locale={locale} />
              {coverage?.injuries && <InjuriesTab injuries={injuries} />}
              <RelatedCompetitions
                competitionIds={getRelatedCompetitionIds(competition.id)}
                locale={locale}
              />
              <CompetitionMediaSection competitionId={competition.id} locale={locale} />
            </div>
          </div>
        </div>
      </div>
            {MOROCCO_HUB_COMPETITION_IDS.has(competition.id) && (
        <MoroccoHubLinks locale={locale} current={hubKeyForCompetition(competition.id)} />
      )}
    </>
  );
}
