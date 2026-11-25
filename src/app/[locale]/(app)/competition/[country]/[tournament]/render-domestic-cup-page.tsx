import { usableLogoUrl } from '@/lib/logos/status';
import { cacheLife } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n/config';
import { DomesticCupPage } from '@/components/league/template/DomesticCupPage';
import { CURATED_LOGOS, DARK_LOGOS, countryFlag } from '@/lib/competitions/artwork';
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
import {
  getCompetitionById,
  getLeagueRounds,
  getLeagueFixtures,
  getResolvedTopScorers,
  getResolvedTopAssists,
  getTopCardsForLeague,
  getCompetitionTeams,
  getLeagueStatsMeta,
} from '@/lib/db/queries/league';
import { resolveCompetitionSeason } from '@/lib/competitions/league-season-query';
import { formatSeasonLabel } from '@/lib/competitions/league-season';
import { toSiteDateKey, INTL_LOCALE, SITE_TZ } from '@/lib/utils/date';
import { competitionDisplayName, competitionHeading } from '@/lib/competitions/display-name';
import { getLeagueCountryName } from '@/lib/constants/league-content';
import { teamLabel } from '@/lib/i18n/localized-names';
import { localizeRound } from '@/lib/i18n/feed-labels';
import { CompetitionRail } from '@/components/match/centre/CompetitionRail';
import { getRailProps } from '@/components/match/centre/rail-props';
import { NavCompetitionRegister } from '@/components/chrome/NavCompetitionRegister';
import { mcFont } from '@/components/match/centre/font';
import type { BreadcrumbSegment } from '@/components/chrome/SeoBreadcrumb';
import '@/components/match/centre/match-centre.css';

async function getCachedCupData(competitionId: number, seasonYear: number, locale: Locale) {
  'use cache';
  cacheLife('minutes');
  const [rounds, fixtures, topScorers, topAssists, topCards, competitionTeams, statsMeta] =
    await Promise.all([
      getLeagueRounds(db, competitionId, seasonYear),
      getLeagueFixtures(db, competitionId, seasonYear),
      getResolvedTopScorers(db, competitionId, seasonYear, locale, 200),
      getResolvedTopAssists(db, competitionId, seasonYear, locale, 200),
      getTopCardsForLeague(db, competitionId, seasonYear, 200, locale),
      getCompetitionTeams(db, competitionId, seasonYear),
      getLeagueStatsMeta(db, competitionId, seasonYear),
    ]);
  return { rounds, fixtures, topScorers, topAssists, topCards, competitionTeams, statsMeta };
}

async function getSiteTodayKey() {
  'use cache';
  cacheLife('minutes');
  return toSiteDateKey(new Date());
}

const CUP_TAB_HASHES: Record<
  Locale,
  { overview: string; fixtures: string; stages: string; stats: string }
> = {
  fr: { overview: 'apercu', fixtures: 'matchs', stages: 'phases', stats: 'statistiques' },
  en: { overview: 'overview', fixtures: 'fixtures', stages: 'stages', stats: 'stats' },
  ar: { overview: 'نظرة-عامة', fixtures: 'المباريات', stages: 'الأدوار', stats: 'الإحصائيات' },
};

export async function renderDomesticCupPage(
  competition: NonNullable<Awaited<ReturnType<typeof getCompetitionById>>>,
  entry: MegaMenuEntry,
  locale: Locale,
  rawLocale: string,
  rawCountry: string,
  rawTournament: string,
  seasonParam?: string,
  initialRoundSlug?: string | null,
) {
  const tBc = await getTranslations({ locale: rawLocale, namespace: 'breadcrumb' });
  const tL = await getTranslations({ locale: rawLocale, namespace: 'leaguePage' });
  const tMenu = await getTranslations({ locale: rawLocale, namespace: 'megaMenu' });
  const tCup = await getTranslations({ locale: rawLocale, namespace: 'domesticCup' });

  const requestedYear = seasonParam ? Number(seasonParam) : null;
  const {
    seasonYear,
    seasons: availableSeasons,
    currentSeasonYear,
  } = await resolveCompetitionSeason(
    competition.id,
    requestedYear != null && Number.isFinite(requestedYear) ? requestedYear : null,
  );

  const competitionName = competitionDisplayName(
    competition.name,
    locale,
    tMenu.has(entry.labelKey) ? tMenu(entry.labelKey) : null,
    competition.slug,
  );

  if (!seasonYear) {
    return (
      <div className="mx-auto w-full max-w-[1280px] px-4 py-8">
        <div className="mt-8 flex flex-col items-center gap-4 text-center">
          <h1 className="text-xl font-semibold text-text-primary">{competitionName}</h1>
          <p className="text-sm text-text-tertiary">{tL('comingSoon')}</p>
        </div>
      </div>
    );
  }

  const { rounds, fixtures, topScorers, topAssists, topCards, competitionTeams, statsMeta } =
    await getCachedCupData(competition.id, seasonYear, locale);

  const statsThroughLabel = statsMeta.throughAt
    ? new Intl.DateTimeFormat(INTL_LOCALE[locale], {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: SITE_TZ,
      }).format(new Date(statsMeta.throughAt))
    : null;

  const firstRound = rounds[0]?.round ?? fixtures.find((f) => f.round)?.round ?? null;
  const statsFromLabel = firstRound
    ? tCup('recordsFrom', { round: localizeRound(firstRound, locale) || firstRound })
    : null;

  const hideStats =
    topScorers.length + topAssists.length + topCards.length === 0 && !statsMeta.playerCount;

  const todayKey = await getSiteTodayKey();
  const { rail, current: railCurrent } = await getRailProps(locale, competition.id);

  const seasonLabel = formatSeasonLabel(seasonYear);
  const countryName = getLeagueCountryName(competition.countryCode, locale);

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

  const hashes = CUP_TAB_HASHES[locale];
  const logoSrc =
    CURATED_LOGOS[competition.id] ?? usableLogoUrl(competition.logoUrl, competition.logoStatus);
  const invertLogo = DARK_LOGOS.has(competition.id);
  const flag = countryFlag(competition.countryCode);
  const basePath = `/${rawLocale}/competition/${rawCountry}/${rawTournament}`;
  const clubs = competitionTeams.map((team) => ({
    id: team.id,
    slug: team.slug,
    name: teamLabel(team, locale),
    logoUrl: team.logoUrl,
    logoStatus: team.logoStatus,
    code: team.code,
    primaryColor: team.primaryColor,
    secondaryColor: team.secondaryColor,
  }));
  const seasonSuffix =
    currentSeasonYear != null && seasonYear !== currentSeasonYear ? `/${seasonYear}` : '';
  const pageUrl = `${BASE_URL}${basePath}${seasonSuffix}${initialRoundSlug ? `/round/${initialRoundSlug}` : ''}`;

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
            <DomesticCupPage
              locale={locale}
              competitionId={competition.id}
              competitionName={competitionName}
              logoSrc={logoSrc}
              invertLogo={invertLogo}
              countryName={countryName}
              countryFlag={flag}
              seasonYear={seasonYear}
              seasonLabel={seasonLabel}
              availableSeasons={availableSeasons}
              currentSeasonYear={currentSeasonYear}
              basePath={basePath}
              hashes={hashes}
              fixtures={fixtures}
              rounds={rounds}
              topScorers={topScorers}
              topAssists={topAssists}
              topCards={topCards}
              clubs={clubs}
              todayKey={todayKey}
              statsPlayerCount={statsMeta.playerCount}
              statsThroughLabel={statsThroughLabel}
              statsFromLabel={hideStats ? null : statsFromLabel}
              hideStats={hideStats}
              initialRoundSlug={initialRoundSlug ?? null}
            />
          </div>
        </div>
      </div>
    </>
  );
}
