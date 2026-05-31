import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { locales, defaultLocale, type Locale } from '@/lib/i18n/config';
import { InnerPageShell } from '@/components/layout/InnerPageShell';
import { SeoBreadcrumb, type BreadcrumbSegment } from '@/components/chrome/SeoBreadcrumb';
import {
  getMetadataForCompetition,
  getMetadataForCompetitionSeason,
  type CupMetadata,
} from '@/lib/constants/tournament-metadata';
import {
  ALL_ENTRIES,
  getRelatedCompetitionIds,
  type MegaMenuEntry,
} from '@/lib/constants/competitions-mega-menu';
import { RelatedCompetitions } from '@/components/tournament/RelatedCompetitions';
import {
  getCupContent,
  getCupContentForSeason,
  findCupContentBySlug,
  findEditionYearBySlug,
} from '@/lib/constants/cup-content';
import { TournamentPageHeader } from '@/components/tournament/TournamentPageHeader';
import { MatchesList } from '@/components/tournament/MatchesList';

import { CenterTabs } from '@/components/tournament/CenterTabs';
import { OverviewTab } from '@/components/tournament/OverviewTab';
import { StandingsTab } from '@/components/tournament/StandingsTab';
import { KnockoutTab } from '@/components/tournament/KnockoutTab';
import { GenericKnockoutList } from '@/components/tournament/GenericKnockoutList';
import { CupFixturesByRound } from '@/components/tournament/CupFixturesByRound';
import { CupOverviewTab } from '@/components/tournament/CupOverviewTab';
import { CupFixturesTab } from '@/components/tournament/CupFixturesTab';
import { DynamicKnockoutBracket } from '@/components/tournament/DynamicKnockoutBracket';
import { buildDynamicBracket } from '@/lib/constants/dynamic-bracket-builder';
import { WCFixturesTab } from '@/components/tournament/WCFixturesTab';
import { CupGroupsSummary } from '@/components/tournament/CupGroupsSummary';
import { BestThirdTab } from '@/components/tournament/BestThirdTab';
import { RightRail } from '@/components/tournament/RightRail';
import { CompetitionMediaSection } from '@/components/tournament/CompetitionMediaSection';
import { AboutCard } from '@/components/tournament/AboutCard';
import { TournamentInfoStrip } from '@/components/tournament/TournamentInfoStrip';
import { SportsEventJsonLd } from '@/components/seo/SportsEventJsonLd';
import { FaqPageJsonLd } from '@/components/seo/FaqPageJsonLd';
import { HashScrollHighlight } from '@/components/shared/HashScrollHighlight';
import { getAboutContent } from '@/lib/constants/about-content';
import { computeBestThirdPlaced } from '@/lib/standings/best-third';
import type { TournamentPhase } from '@/components/tournament/StatusDescriptor';
import { db } from '@/lib/db/client';
import { competitions } from '@/lib/db/schema';
import { inArray } from 'drizzle-orm';
import {
  getFeaturedMatch,
  getFixturesByRound,
  getKnockoutFixtures,
  getStandings,
  getMoroccoTeamId,
  type FixtureWithTeams,
} from '@/lib/db/queries';
import {
  getCompetitionById,
  getLeagueCoverage,
  getCurrentSeasonYear,
  getLeagueRounds,
  getCurrentRound,
  getLeagueFeaturedMatch,
  getLeagueFeaturedMatches,
  getLeagueFixtures,
  getTopScorersForLeague,
  getTopAssistsForLeague,
  getTopCardsForLeague,
  getAvailableSeasons,
} from '@/lib/db/queries/league';
import { getInjuriesForCompetition } from '@/lib/db/queries/injuries';
import { InjuriesTab } from '@/components/league/InjuriesTab';
import { LeagueStatsTab } from '@/components/league/LeagueStatsTab';
import { LeagueAboutCard } from '@/components/league/LeagueAboutCard';
import { LeaguePageHeader } from '@/components/league/LeaguePageHeader';
import { LeagueStandingsTab } from '@/components/league/LeagueStandingsTab';
import { LeagueFixturesCard } from '@/components/league/LeagueFixturesCard';
import { LeagueRightRail } from '@/components/league/LeagueRightRail';
import { LeagueRightRailCard } from '@/components/league/LeagueRightRailCard';
import { LeagueLeftRail } from '@/components/league/LeagueLeftRail';
import { LeagueOverviewTab } from '@/components/league/LeagueOverviewTab';
import { LeagueFixturesTab } from '@/components/league/LeagueFixturesTab';
import { LeaguePlayersTab } from '@/components/league/LeaguePlayersTab';
import { LeagueTeamsTab } from '@/components/league/LeagueTeamsTab';
import { getLeagueIntro, getLeagueCountryName } from '@/lib/constants/league-content';
import { BASE_URL } from '@/lib/constants/site';

interface PageProps {
  params: Promise<{ locale: string; country: string; tournament: string }>;
  searchParams: Promise<{ season?: string }>;
}

const baseUrl = BASE_URL;

// Cup content is now in src/lib/constants/cup-content.ts, keyed by competitionId.

// ── Helpers ──

function resolveEntry(tournament: string, locale: Locale): MegaMenuEntry | undefined {
  // Try current locale first, then fall back to any locale match
  return (
    ALL_ENTRIES.find((entry) => entry.slugs[locale] === tournament) ??
    ALL_ENTRIES.find((entry) => Object.values(entry.slugs).some((slug) => slug === tournament))
  );
}

const LEFT_RAIL_COMP_IDS = [200, 201, 822, 1, 922, 6, 39, 140, 78, 135, 61, 2, 3, 848];

async function getLeftRailLogos(): Promise<Record<number, string | null>> {
  const rows = await db
    .select({ id: competitions.id, logoUrl: competitions.logoUrl })
    .from(competitions)
    .where(inArray(competitions.id, LEFT_RAIL_COMP_IDS));
  return Object.fromEntries(rows.map((r) => [r.id, r.logoUrl]));
}

const TERMINAL_STATUSES = new Set(['FT', 'AET', 'PEN', 'AWD', 'WO', 'CANC', 'ABD', 'PST']);
const LIVE_STATUSES = new Set(['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE']);

function phaseFromRound(round: string | null): TournamentPhase['phase'] {
  if (!round) return 'group-stage';
  if (round.startsWith('Group')) return 'group-stage';
  if (round === 'Final') return 'final';
  return 'knockout';
}

function computeTournamentPhase(
  metadata: CupMetadata,
  fixtures: FixtureWithTeams[],
): TournamentPhase {
  const now = new Date();
  const kickoff = new Date(metadata.kickoffDate);
  const daysUntil = Math.ceil((kickoff.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // 1. No fixtures or tournament hasn't started
  if (fixtures.length === 0 || daysUntil > 0) {
    const kickoffFormatted = kickoff.toLocaleDateString('fr', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return {
      phase: 'pre-tournament',
      daysUntilKickoff: Math.max(0, daysUntil),
      kickoffDateFormatted: kickoffFormatted,
    };
  }

  // 2. All fixtures terminal → post-tournament
  const allTerminal = fixtures.every((f) => TERMINAL_STATUSES.has(f.statusCode));
  if (allTerminal) {
    const finalMatch = fixtures.find((f) => f.round === 'Final');
    let winnerName = '';
    const titleNumber: number | null = null;
    if (finalMatch) {
      const homeWon = (finalMatch.homeScore ?? 0) > (finalMatch.awayScore ?? 0);
      const winner = homeWon ? finalMatch.homeTeam : finalMatch.awayTeam;
      winnerName = winner?.name?.en ?? '';
    }
    return { phase: 'post-tournament', winnerName, titleNumber };
  }

  // 3. Any live fixture → phase from that fixture's round
  const liveFixture = fixtures.find((f) => LIVE_STATUSES.has(f.statusCode));
  if (liveFixture) {
    const p = phaseFromRound(liveFixture.round);
    if (p === 'group-stage') {
      const groupFixtures = fixtures.filter((f) => f.round?.startsWith('Group'));
      const played = groupFixtures.filter((f) => TERMINAL_STATUSES.has(f.statusCode)).length;
      const total = groupFixtures.length;
      const currentRound = total > 0 ? Math.ceil(played / (total / 3) + 0.01) : 1;
      const todayLive = fixtures.filter((f) => LIVE_STATUSES.has(f.statusCode)).length;
      return {
        phase: 'group-stage',
        currentRound: Math.min(currentRound, 3),
        totalRounds: 3,
        matchesToday: todayLive,
      };
    }
    if (p === 'final') {
      return { phase: 'final', matchLabel: liveFixture.round ?? 'Final', kickoffFormatted: '' };
    }
    return { phase: 'knockout', roundLabel: liveFixture.round ?? '', isLive: true };
  }

  // 4. Next upcoming fixture → phase from that fixture's round
  const upcoming = fixtures
    .filter((f) => !TERMINAL_STATUSES.has(f.statusCode) && !LIVE_STATUSES.has(f.statusCode))
    .sort((a, b) => a.kickoffAt.getTime() - b.kickoffAt.getTime());
  const nextFixture = upcoming[0];
  if (nextFixture) {
    const p = phaseFromRound(nextFixture.round);
    if (p === 'group-stage') {
      const groupFixtures = fixtures.filter((f) => f.round?.startsWith('Group'));
      const played = groupFixtures.filter((f) => TERMINAL_STATUSES.has(f.statusCode)).length;
      const total = groupFixtures.length;
      const currentRound = total > 0 ? Math.ceil(played / (total / 3) + 0.01) : 1;
      const todayUpcoming = upcoming.filter((f) => {
        const fDate = f.kickoffAt;
        return (
          fDate.getUTCFullYear() === now.getUTCFullYear() &&
          fDate.getUTCMonth() === now.getUTCMonth() &&
          fDate.getUTCDate() === now.getUTCDate()
        );
      }).length;
      return {
        phase: 'group-stage',
        currentRound: Math.min(currentRound, 3),
        totalRounds: 3,
        matchesToday: todayUpcoming,
      };
    }
    if (p === 'final') {
      const kickoffFormatted = nextFixture.kickoffAt.toLocaleDateString('fr', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      return { phase: 'final', matchLabel: nextFixture.round ?? 'Final', kickoffFormatted };
    }
    return { phase: 'knockout', roundLabel: nextFixture.round ?? '', isLive: false };
  }

  // 5. Fallback: latest completed fixture
  const completed = fixtures
    .filter((f) => TERMINAL_STATUSES.has(f.statusCode))
    .sort((a, b) => b.kickoffAt.getTime() - a.kickoffAt.getTime());
  const latest = completed[0];
  if (latest) {
    const p = phaseFromRound(latest.round);
    if (p === 'group-stage') {
      return { phase: 'group-stage', currentRound: 3, totalRounds: 3, matchesToday: 0 };
    }
    return { phase: 'knockout', roundLabel: latest.round ?? '', isLive: false };
  }

  // Should not reach here, but safe fallback
  return {
    phase: 'pre-tournament',
    daysUntilKickoff: 0,
    kickoffDateFormatted: '',
  };
}

// ── Metadata ──

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, country: rawCountry, tournament: rawTournament } = await params;
  const country = decodeURIComponent(rawCountry);
  const tournament = decodeURIComponent(rawTournament);
  const typedLocale = locale as Locale;

  const cupContent = findCupContentBySlug(tournament);
  if (cupContent) {
    const meta = cupContent.meta[typedLocale];
    const pageUrl = cupContent.urls[typedLocale];
    const languages: Record<string, string> = {};
    for (const loc of locales) {
      languages[loc] = cupContent.urls[loc as Locale];
    }
    languages['x-default'] = cupContent.urls[defaultLocale];

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
        images: [
          {
            url: `${baseUrl}/og/${cupContent.titles.en.toLowerCase().replace(/\s+/g, '-')}.png`,
            alt: cupContent.titles[typedLocale],
          },
        ],
      },
      twitter: {
        card: 'summary_large_image' as const,
        title: meta.title,
        description: meta.description,
      },
    };
  }

  // Try to resolve a proper name from mega menu + DB
  const entry = resolveEntry(tournament, typedLocale);
  let displayName = tournament.replace(/-/g, ' ');
  let description = `${displayName} — DimaScore`;

  if (entry) {
    const competition = await getCompetitionById(db, entry.competitionId);
    if (competition) {
      displayName = competition.name[typedLocale] ?? competition.name['en'] ?? displayName;
      const seasonYear = await getCurrentSeasonYear(db, competition.id);
      const season = seasonYear ? `${seasonYear}/${(seasonYear + 1) % 100}` : '';
      displayName = season ? `${displayName} ${season}` : displayName;
      description = `${displayName} — standings, matches, and statistics | DimaScore`;
    }
  }

  const languages: Record<string, string> = {};
  for (const loc of locales) {
    const locEntry = resolveEntry(tournament, loc as Locale) ?? entry;
    const locSlug = locEntry?.slugs[loc as Locale] ?? tournament;
    languages[loc] = `${baseUrl}/${loc}/competition/${country}/${locSlug}`;
  }
  languages['x-default'] = languages[defaultLocale];

  return {
    title: `${displayName} | DimaScore`,
    description,
    alternates: { languages },
    robots: { index: true, follow: true },
  };
}

// ── Page ──

export default async function CompetitionPage({ params, searchParams }: PageProps) {
  const { locale, country: rawCountry, tournament: rawTournament } = await params;
  const { season: seasonParam } = await searchParams;
  const tournament = decodeURIComponent(rawTournament);
  const typedLocale = locale as Locale;
  const t = await getTranslations({ locale, namespace: 'breadcrumb' });
  const tP = await getTranslations({ locale, namespace: 'placeholder' });
  const tT = await getTranslations({ locale, namespace: 'tournament' });

  // Gate: only render full page for competitions with metadata.
  // Slug-aware: if slug matches a specific edition's cup content, use that edition's metadata.
  const entry = resolveEntry(tournament, typedLocale);
  const slugCupContent = findCupContentBySlug(tournament);
  let metadata = entry ? getMetadataForCompetition(entry.competitionId) : undefined;
  // If the slug resolves to a different edition than the default, override metadata
  if (slugCupContent && entry && metadata?.type === 'cup') {
    const editionYear = findEditionYearBySlug(entry.competitionId, tournament);
    if (editionYear != null && editionYear !== metadata.editionYear) {
      const seasonMeta = getMetadataForCompetitionSeason(entry.competitionId, editionYear);
      if (seasonMeta) metadata = seasonMeta;
    }
  }

  // Fetch left rail logos once (shared across all render paths)
  const competitionLogos = await getLeftRailLogos();

  // League or generic cup branch: competition exists in DB but no hardcoded cup metadata
  if (!metadata || metadata.type !== 'cup') {
    if (entry) {
      const competition = await getCompetitionById(db, entry.competitionId);
      if (competition && competition.type === 'League') {
        return renderLeaguePage(
          competition,
          entry,
          typedLocale,
          locale,
          rawCountry,
          rawTournament,
          seasonParam,
          competitionLogos,
        );
      }
      if (competition && competition.type === 'Cup') {
        return renderGenericCupPage(
          competition,
          entry,
          typedLocale,
          locale,
          rawCountry,
          seasonParam,
          competitionLogos,
        );
      }
    }

    // Fallback: coming soon
    const displayName = tournament.replace(/-/g, ' ');
    const breadcrumbs: BreadcrumbSegment[] = [
      { label: t('football'), href: `/${locale}` },
      { label: displayName },
    ];

    return (
      <div className="mx-auto w-full max-w-[1280px] px-4 py-8">
        <SeoBreadcrumb segments={breadcrumbs} />
        <div className="mt-8 flex flex-col items-center gap-4 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-bg-surface-2">
            <span className="text-2xl">🏆</span>
          </div>
          <h1 className="text-xl font-semibold capitalize text-text-primary">{displayName}</h1>
          <p className="text-sm text-text-tertiary">{tP('competitionComingSoon')}</p>
        </div>
      </div>
    );
  }

  // ── Cup full render — fetch real data ──

  const competitionId = metadata.competitionId;
  // Support ?season= param for edition switching
  const requestedYear = seasonParam ? Number(seasonParam) : null;
  if (requestedYear && requestedYear !== metadata.editionYear) {
    const seasonMeta = getMetadataForCompetitionSeason(competitionId, requestedYear);
    if (seasonMeta?.type === 'cup') metadata = seasonMeta;
  }
  // Use requested year for data fetching even if no CupMetadata exists for it
  const seasonYear = requestedYear ?? metadata.editionYear;
  const cupContent =
    getCupContentForSeason(competitionId, seasonYear) ??
    (requestedYear ? undefined : getCupContent(competitionId));

  const [
    moroccoTeamId,
    standings,
    round1Fixtures,
    knockoutFixtures,
    cupFeaturedMatches,
    allCupFixtures,
    availableSeasons,
  ] = await Promise.all([
    getMoroccoTeamId(db),
    getStandings(db, competitionId, seasonYear),
    getFixturesByRound(db, competitionId, seasonYear, 1),
    getKnockoutFixtures(db, competitionId, seasonYear),
    getLeagueFeaturedMatches(db, competitionId, seasonYear, 2),
    getLeagueFixtures(db, competitionId, seasonYear),
    getAvailableSeasons(db, competitionId),
  ]);

  const featuredMatch = moroccoTeamId
    ? await getFeaturedMatch(db, competitionId, seasonYear, moroccoTeamId)
    : null;

  const tournamentPhase = computeTournamentPhase(metadata, allCupFixtures);
  const fallbackName =
    { 1: 'FIFA World Cup', 6: 'AFCON', 922: 'WAFCON' }[competitionId] ?? `Cup ${competitionId}`;
  const pageTitle = cupContent?.titles[typedLocale] ?? `${fallbackName} ${seasonYear}`;
  const introText = cupContent?.intro[typedLocale] ?? '';

  // Morocco context: find Morocco's group and rivals
  const moroccoGroup = metadata.groups.find((g) => g.isMoroccoGroup);
  let moroccoContext: {
    label: string;
    rivals: Array<{ code: string; name: Record<string, string> }>;
  } | null = null;

  if (moroccoGroup) {
    const groupStandings = standings.filter((s) => s.groupLabel === moroccoGroup.label);
    const rivals = groupStandings
      .filter((s) => s.team?.code !== 'MA')
      .map((s) => ({
        code: s.team?.code ?? '',
        name: s.team?.shortName ?? s.team?.name ?? { en: s.team?.code ?? '—' },
      }));

    moroccoContext = { label: moroccoGroup.label, rivals };
  }

  // Breadcrumbs
  const breadcrumbSegments: BreadcrumbSegment[] = [
    { label: t('football'), href: `/${locale}` },
    { label: t('international') },
    { label: cupContent?.breadcrumbOrg ?? 'FIFA' },
    { label: pageTitle },
  ];

  const breadcrumb = <SeoBreadcrumb segments={breadcrumbSegments} />;

  // About card content
  const aboutContent = getAboutContent(competitionId, typedLocale);

  // Tab data
  const defaultHashes = {
    overview: 'overview',
    standings: 'standings',
    bestThird: 'best-3rd',
    knockout: 'knockout',
  };
  const hashes = cupContent?.tabHashes[typedLocale] ?? defaultHashes;
  const facts = cupContent?.facts[typedLocale] ?? [];
  const historicalTeamNames = cupContent?.historicalTeamNames[typedLocale] ?? {};

  // Best 3rd-placed teams (conditional on tournament format)
  const bestThird = metadata.hasBestThirdPlace ? computeBestThirdPlaced(standings) : null;

  const hasGroups = metadata.groups.length > 0;

  // Build team → group mapping from standings for fixtures filtering
  const teamGroupMap: Record<number, string> = {};
  if (hasGroups) {
    for (const s of standings) {
      if (s.teamId != null) teamGroupMap[s.teamId] = s.groupLabel;
    }
  }

  // Dynamic bracket from DB (replaces static schedule when knockout data exists)
  const cupBracket =
    knockoutFixtures.length > 0 ? buildDynamicBracket(knockoutFixtures, typedLocale) : null;

  const tabs = [
    {
      key: 'overview',
      hash: hashes.overview,
      labelKey: 'overview',
      icon: 'home',
      content: (
        <OverviewTab
          fixtures={allCupFixtures}
          standings={standings}
          metadata={metadata}
          locale={typedLocale}
          facts={facts}
          historicalTeamNames={historicalTeamNames}
          standingsHash={hashes.standings}
        />
      ),
    },
    {
      key: 'fixtures',
      hash: 'fixtures',
      labelKey: 'fixtures',
      icon: 'calendar',
      content: hasGroups ? (
        <WCFixturesTab
          fixtures={allCupFixtures}
          locale={typedLocale}
          groupLabels={metadata.groups.map((g) => g.label)}
          teamGroupMap={teamGroupMap}
        />
      ) : (
        <CupFixturesByRound fixtures={allCupFixtures} locale={typedLocale} />
      ),
    },
    {
      key: 'standings',
      hash: hashes.standings,
      labelKey: 'standings',
      icon: 'table',
      content: <StandingsTab standings={standings} metadata={metadata} locale={typedLocale} />,
    },
    ...(bestThird
      ? [
          {
            key: 'bestThird',
            hash: hashes.bestThird,
            labelKey: 'bestThird',
            icon: 'award',
            content: (
              <BestThirdTab
                rows={bestThird.rows}
                locale={typedLocale}
                qualifiedCount={8}
                hasTiesRequiringFallback={bestThird.hasTiesRequiringFallback}
              />
            ),
          },
        ]
      : []),
    {
      key: 'knockout',
      hash: hashes.knockout,
      labelKey: 'knockout',
      icon: 'swords',
      content:
        competitionId === 1 ? (
          <KnockoutTab
            locale={typedLocale}
            bracketHref={`/${locale}/competition/${rawCountry}/${rawTournament}/bracket`}
            matches={cupBracket?.matches}
            thirdPlaceMatch={cupBracket?.thirdPlaceMatch}
          />
        ) : cupBracket ? (
          <DynamicKnockoutBracket
            matches={cupBracket.matches}
            thirdPlaceMatch={cupBracket.thirdPlaceMatch}
            locale={typedLocale}
            gridConfig={cupBracket.gridConfig}
            competitionId={competitionId}
          />
        ) : (
          <GenericKnockoutList fixtures={knockoutFixtures} locale={typedLocale} />
        ),
    },
  ];

  return (
    <>
      <div className="mx-auto w-full max-w-[1280px] px-4 pt-4">{breadcrumb}</div>
      <InnerPageShell
        pageHeader={
          <TournamentPageHeader
            metadata={metadata}
            locale={typedLocale}
            pageTitle={pageTitle}
            introText={introText}
            tournamentPhase={tournamentPhase}
            moroccoGroup={moroccoContext}
            orgName={cupContent?.breadcrumbOrg}
            matchesCount={allCupFixtures.length}
            availableSeasons={availableSeasons}
            seasonYear={seasonYear}
          />
        }
        leftRail={
          <LeagueLeftRail
            locale={typedLocale}
            activeCompetitionId={competitionId}
            competitionLogos={competitionLogos}
          />
        }
        center={<CenterTabs tabs={tabs} />}
        rightRailTop={
          cupFeaturedMatches.length > 0 ? (
            <LeagueRightRailCard
              featuredMatches={cupFeaturedMatches.slice(0, 1)}
              locale={typedLocale}
              competitionName={pageTitle}
              stretch
            />
          ) : undefined
        }
        rightRail={
          <div className="space-y-4">
            <LeagueRightRailCard
              featuredMatches={cupFeaturedMatches.slice(1)}
              topScorer={null}
              locale={typedLocale}
              competitionName={pageTitle}
            />
            <RightRail
              metadata={metadata}
              standings={standings}
              locale={typedLocale}
              tournamentName={pageTitle}
            />
          </div>
        }
        belowCenter={
          <>
            <TournamentInfoStrip />
            <HashScrollHighlight />
            <RelatedCompetitions
              competitionIds={getRelatedCompetitionIds(competitionId)}
              locale={typedLocale}
            />
            <CompetitionMediaSection competitionId={competitionId} locale={typedLocale} />
            {aboutContent && <AboutCard content={aboutContent} />}
            <SportsEventJsonLd
              metadata={metadata}
              tournamentName={pageTitle}
              alternateNames={
                cupContent ? Object.values(cupContent.titles).filter((t) => t !== pageTitle) : []
              }
              canonicalUrl={cupContent?.urls[typedLocale] ?? ''}
            />
            {aboutContent && <FaqPageJsonLd faqs={aboutContent.faqs} />}
          </>
        }
      />
    </>
  );
}

// ── League page renderer ──

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

async function renderLeaguePage(
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

  const [availableSeasons, currentSeasonYear] = await Promise.all([
    getAvailableSeasons(db, competition.id),
    getCurrentSeasonYear(db, competition.id),
  ]);

  // Use season from URL param if valid, otherwise fall back to current
  const requestedYear = seasonParam ? Number(seasonParam) : null;
  const seasonYear =
    requestedYear && availableSeasons.some((s) => s.year === requestedYear)
      ? requestedYear
      : currentSeasonYear;

  if (!seasonYear) {
    // No season data — show coming soon
    const name = competition.name[locale] ?? competition.name['en'] ?? competition.slug;
    return (
      <div className="mx-auto w-full max-w-[1280px] px-4 py-8">
        <div className="mt-8 flex flex-col items-center gap-4 text-center">
          <h1 className="text-xl font-semibold text-text-primary">{name}</h1>
          <p className="text-sm text-text-tertiary">{tL('comingSoon')}</p>
        </div>
      </div>
    );
  }

  // Parallel data fetch
  const [
    coverage,
    standings,
    rounds,
    currentRound,
    featuredMatches,
    fixtures,
    topScorers,
    topAssists,
    topCards,
    injuries,
  ] = await Promise.all([
    getLeagueCoverage(db, competition.id, seasonYear),
    getStandings(db, competition.id, seasonYear),
    getLeagueRounds(db, competition.id, seasonYear),
    getCurrentRound(db, competition.id, seasonYear),
    getLeagueFeaturedMatches(db, competition.id, seasonYear, 2),
    getLeagueFixtures(db, competition.id, seasonYear),
    getTopScorersForLeague(db, competition.id, seasonYear),
    getTopAssistsForLeague(db, competition.id, seasonYear),
    getTopCardsForLeague(db, competition.id, seasonYear),
    getInjuriesForCompetition(db, competition.id, seasonYear),
  ]);

  const competitionName = competition.name[locale] ?? competition.name['en'] ?? competition.slug;
  const countryName = getLeagueCountryName(competition.countryCode, locale);
  const introText = getLeagueIntro(competition.id, locale);

  // Breadcrumbs
  const breadcrumbs: BreadcrumbSegment[] = [
    { label: tBc('football'), href: `/${rawLocale}` },
    ...(countryName ? [{ label: countryName }] : []),
    { label: competitionName },
  ];

  // Center tabs — Overview / Matches / Standings / Stats / Teams
  const hashes = LEAGUE_TAB_HASHES[locale];
  const tabs = [
    {
      key: 'overview',
      hash: hashes.overview,
      labelKey: 'overview',
      icon: 'home',
      content: (
        <LeagueOverviewTab
          standings={standings}
          fixtures={fixtures}
          rounds={rounds}
          defaultRound={currentRound ?? 1}
          topScorers={topScorers}
          topAssists={topAssists}
          topCards={topCards}
          coverage={coverage}
          locale={locale}
        />
      ),
    },
    {
      key: 'fixtures',
      hash: hashes.fixtures,
      labelKey: 'fixtures',
      icon: 'calendar',
      content: (
        <LeagueFixturesTab
          fixtures={fixtures}
          rounds={rounds}
          defaultRound={currentRound ?? 1}
          locale={locale}
        />
      ),
    },
    {
      key: 'standings',
      hash: hashes.standings,
      labelKey: 'standings',
      icon: 'table',
      content:
        coverage?.standings !== false && standings.length > 0 ? (
          <LeagueStandingsTab standings={standings} locale={locale} />
        ) : (
          <div className="rounded-xl border border-border-subtle bg-bg-surface px-4 py-8 text-center">
            <p className="text-sm text-text-tertiary">{tL('comingSoon')}</p>
          </div>
        ),
    },
    {
      key: 'stats',
      hash: hashes.stats,
      labelKey: 'stats',
      icon: 'chart',
      content: (
        <LeaguePlayersTab
          coverage={coverage}
          topScorers={topScorers}
          topAssists={topAssists}
          topCards={topCards}
          locale={locale}
        />
      ),
    },
    {
      key: 'teams',
      hash: hashes.teams,
      labelKey: 'teams',
      icon: 'shield',
      content: <LeagueTeamsTab standings={standings} locale={locale} />,
    },
  ];

  return (
    <>
      <div className="mx-auto w-full max-w-[1280px] px-4 pt-4">
        <SeoBreadcrumb segments={breadcrumbs} />
      </div>

      <InnerPageShell
        pageHeader={
          <LeaguePageHeader
            competition={competition}
            seasonYear={seasonYear}
            locale={locale}
            countryName={countryName}
            introText={introText}
            availableSeasons={availableSeasons}
            teamsCount={new Set(standings.map((s) => s.teamId).filter(Boolean)).size}
            matchesCount={fixtures.length}
            totalRounds={rounds.length}
            currentRound={currentRound}
          />
        }
        leftRail={
          <LeagueLeftRail
            locale={locale}
            activeCompetitionId={competition.id}
            competitionLogos={competitionLogos}
          />
        }
        center={<CenterTabs tabs={tabs} />}
        rightRailTop={
          featuredMatches.length > 0 ? (
            <LeagueRightRailCard
              featuredMatches={featuredMatches.slice(0, 1)}
              locale={locale}
              competitionName={competitionName}
              stretch
            />
          ) : undefined
        }
        rightRail={
          <LeagueRightRailCard
            featuredMatches={featuredMatches.slice(1)}
            topScorers={topScorers.slice(0, 3)}
            locale={locale}
            competitionName={competitionName}
          />
        }
        belowCenter={
          <>
            <LeagueAboutCard competition={competition} seasonYear={seasonYear} locale={locale} />
            {coverage?.injuries && <InjuriesTab injuries={injuries} />}
            <RelatedCompetitions
              competitionIds={getRelatedCompetitionIds(competition.id)}
              locale={locale}
            />
            <CompetitionMediaSection competitionId={competition.id} locale={locale} />
          </>
        }
      />
    </>
  );
}

// ── Generic cup page renderer (no hardcoded metadata) ──

async function renderGenericCupPage(
  competition: NonNullable<Awaited<ReturnType<typeof getCompetitionById>>>,
  _entry: MegaMenuEntry,
  locale: Locale,
  rawLocale: string,
  _rawCountry: string,
  seasonParam?: string,
  competitionLogos?: Record<number, string | null>,
) {
  const tBc = await getTranslations({ locale: rawLocale, namespace: 'breadcrumb' });
  const tL = await getTranslations({ locale: rawLocale, namespace: 'leaguePage' });

  const [availableSeasons, currentSeasonYear] = await Promise.all([
    getAvailableSeasons(db, competition.id),
    getCurrentSeasonYear(db, competition.id),
  ]);

  const requestedYear = seasonParam ? Number(seasonParam) : null;
  const seasonYear =
    requestedYear && availableSeasons.some((s) => s.year === requestedYear)
      ? requestedYear
      : currentSeasonYear;

  if (!seasonYear) {
    const name = competition.name[locale] ?? competition.name['en'] ?? competition.slug;
    return (
      <div className="mx-auto w-full max-w-[1280px] px-4 py-8">
        <div className="mt-8 flex flex-col items-center gap-4 text-center">
          <h1 className="text-xl font-semibold text-text-primary">{name}</h1>
          <p className="text-sm text-text-tertiary">{tL('comingSoon')}</p>
        </div>
      </div>
    );
  }

  const [
    standings,
    knockoutFixtures,
    allFixtures,
    coverage,
    cupInjuries,
    topScorers,
    topAssists,
    genericFeaturedMatches,
  ] = await Promise.all([
    getStandings(db, competition.id, seasonYear),
    getKnockoutFixtures(db, competition.id, seasonYear),
    getLeagueFixtures(db, competition.id, seasonYear),
    getLeagueCoverage(db, competition.id, seasonYear),
    getInjuriesForCompetition(db, competition.id, seasonYear),
    getTopScorersForLeague(db, competition.id, seasonYear, 5),
    getTopAssistsForLeague(db, competition.id, seasonYear, 5),
    getLeagueFeaturedMatches(db, competition.id, seasonYear, 2),
  ]);

  const competitionName = competition.name[locale] ?? competition.name['en'] ?? competition.slug;
  const countryName = getLeagueCountryName(competition.countryCode, locale);

  const breadcrumbs: BreadcrumbSegment[] = [
    { label: tBc('football'), href: `/${rawLocale}` },
    ...(countryName ? [{ label: countryName }] : []),
    { label: competitionName },
  ];

  // Exclude qualifying rounds from hero match count (e.g. UCL 1st/2nd/3rd Qualifying + Play-offs)
  const mainFixturesCount = allFixtures.filter(
    (f) => !f.round?.includes('Qualifying') && f.round !== 'Play-offs',
  ).length;

  const hasStandings = standings.length > 0;
  const hasKnockout = knockoutFixtures.length > 0;

  // Build bracket data for knockout tab
  const bracketData = hasKnockout ? buildDynamicBracket(knockoutFixtures, locale) : null;

  const tabs = [
    {
      key: 'overview',
      hash: 'overview',
      labelKey: 'overview',
      icon: 'home',
      content: (
        <CupOverviewTab
          fixtures={allFixtures}
          standings={standings}
          topScorers={topScorers}
          topAssists={topAssists}
          coverage={coverage}
          locale={locale}
        />
      ),
    },
    ...(allFixtures.length > 0
      ? [
          {
            key: 'matches',
            hash: 'matches',
            labelKey: 'matches',
            icon: 'calendar',
            content: <CupFixturesTab fixtures={allFixtures} locale={locale} />,
          },
        ]
      : []),
    ...(hasStandings
      ? [
          {
            key: 'standings',
            hash: 'standings',
            labelKey: 'standings',
            icon: 'table',
            content: <LeagueStandingsTab standings={standings} locale={locale} />,
          },
        ]
      : []),
    ...(bracketData
      ? [
          {
            key: 'knockout',
            hash: 'knockout',
            labelKey: 'knockout',
            icon: 'swords',
            content: (
              <DynamicKnockoutBracket
                matches={bracketData.matches}
                thirdPlaceMatch={bracketData.thirdPlaceMatch}
                locale={locale}
                gridConfig={bracketData.gridConfig}
                competitionId={competition.id}
              />
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      <div className="mx-auto w-full max-w-[1280px] px-4 pt-4">
        <SeoBreadcrumb segments={breadcrumbs} />
      </div>

      <InnerPageShell
        pageHeader={
          <LeaguePageHeader
            competition={competition}
            seasonYear={seasonYear}
            locale={locale}
            countryName={countryName}
            introText={null}
            availableSeasons={availableSeasons}
            teamsCount={new Set(standings.map((s) => s.teamId).filter(Boolean)).size}
            matchesCount={mainFixturesCount}
          />
        }
        leftRail={
          <LeagueLeftRail
            locale={locale}
            activeCompetitionId={competition.id}
            competitionLogos={competitionLogos}
          />
        }
        center={<CenterTabs tabs={tabs} />}
        rightRailTop={
          genericFeaturedMatches.length > 0 ? (
            <LeagueRightRailCard
              featuredMatches={genericFeaturedMatches.slice(0, 1)}
              locale={locale}
              competitionName={competitionName}
              stretch
            />
          ) : undefined
        }
        rightRail={
          <LeagueRightRail
            competitionName={competitionName}
            coverage={coverage}
            topScorers={topScorers.slice(0, 3)}
            topAssists={topAssists.slice(0, 3)}
            locale={locale}
          />
        }
        belowCenter={
          <>
            <LeagueAboutCard competition={competition} seasonYear={seasonYear} locale={locale} />
            {coverage?.injuries && <InjuriesTab injuries={cupInjuries} />}
            <RelatedCompetitions
              competitionIds={getRelatedCompetitionIds(competition.id)}
              locale={locale}
            />
            <CompetitionMediaSection competitionId={competition.id} locale={locale} />
          </>
        }
      />
    </>
  );
}
