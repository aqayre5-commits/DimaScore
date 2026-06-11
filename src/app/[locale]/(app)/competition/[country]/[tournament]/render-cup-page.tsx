import Link from 'next/link';
import { cacheLife } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n/config';
import { InnerPageShell } from '@/components/layout/InnerPageShell';
import { SeoBreadcrumb, type BreadcrumbSegment } from '@/components/chrome/SeoBreadcrumb';
import {
  getMetadataForCompetitionSeason,
  type CupMetadata,
} from '@/lib/constants/tournament-metadata';
import { getRelatedCompetitionIds } from '@/lib/constants/competitions-mega-menu';
import { RelatedCompetitions } from '@/components/tournament/RelatedCompetitions';
import { getCupContent, getCupContentForSeason } from '@/lib/constants/cup-content';
import { TournamentPageHeader } from '@/components/tournament/TournamentPageHeader';
import { CenterTabs } from '@/components/tournament/CenterTabs';
import { OverviewTab } from '@/components/tournament/OverviewTab';
import { StandingsTab } from '@/components/tournament/StandingsTab';
import { KnockoutTab } from '@/components/tournament/KnockoutTab';
import { GenericKnockoutList } from '@/components/tournament/GenericKnockoutList';
import { CupFixturesByRound } from '@/components/tournament/CupFixturesByRound';
import { DynamicKnockoutBracket } from '@/components/tournament/DynamicKnockoutBracket';
import { buildDynamicBracket } from '@/lib/constants/dynamic-bracket-builder';
import { WCFixturesTab } from '@/components/tournament/WCFixturesTab';
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
import { getKnockoutFixtures, getStandings, type FixtureWithTeams } from '@/lib/db/queries';
import {
  getLeagueFeaturedMatches,
  getLeagueFixtures,
  getAvailableSeasons,
} from '@/lib/db/queries/league';
import { LeagueLeftRail } from '@/components/league/LeagueLeftRail';
import { LeagueRightRailCard } from '@/components/league/LeagueRightRailCard';

async function getCachedCupData(competitionId: number, seasonYear: number, metadata: CupMetadata) {
  'use cache';
  cacheLife('minutes');
  const [standings, knockoutFixtures, cupFeaturedMatches, allCupFixtures, availableSeasons] =
    await Promise.all([
      getStandings(db, competitionId, seasonYear),
      getKnockoutFixtures(db, competitionId, seasonYear),
      getLeagueFeaturedMatches(db, competitionId, seasonYear, 2),
      getLeagueFixtures(db, competitionId, seasonYear),
      getAvailableSeasons(db, competitionId),
    ]);
  // Computed inside the cache boundary: computeTournamentPhase reads new Date(),
  // which is forbidden in a static prerender unless TTL-bounded by 'use cache'.
  const tournamentPhase = computeTournamentPhase(metadata, allCupFixtures);
  return {
    standings,
    knockoutFixtures,
    cupFeaturedMatches,
    allCupFixtures,
    availableSeasons,
    tournamentPhase,
  };
}

// ── Status sets ──

const TERMINAL_STATUSES = new Set(['FT', 'AET', 'PEN', 'AWD', 'WO', 'CANC', 'ABD', 'PST']);
const LIVE_STATUSES = new Set(['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE']);

function phaseFromRound(round: string | null): TournamentPhase['phase'] {
  if (!round) return 'group-stage';
  if (round.startsWith('Group')) return 'group-stage';
  if (round === 'Final') return 'final';
  return 'knockout';
}

export function computeTournamentPhase(
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

// ── Cup page renderer ──

export async function renderCupPage(
  initialMetadata: CupMetadata,
  locale: Locale,
  rawLocale: string,
  rawCountry: string,
  rawTournament: string,
  seasonParam?: string,
  competitionLogos?: Record<number, string | null>,
) {
  const t = await getTranslations({ locale: rawLocale, namespace: 'breadcrumb' });
  const tTournament = await getTranslations({ locale: rawLocale, namespace: 'tournament' });

  let metadata = initialMetadata;
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

  const {
    standings,
    knockoutFixtures,
    cupFeaturedMatches,
    allCupFixtures,
    availableSeasons,
    tournamentPhase,
  } = await getCachedCupData(competitionId, seasonYear, metadata);

  // AFCON (6) has fragmentary early editions (2021/2019/2015) — hide them from the edition selector,
  // keeping only the current edition and seasons with a full tournament's worth of fixtures (a
  // complete edition is ~52; the fragments are ≤12). AFCON-only; other competitions are unaffected.
  const MIN_AFCON_EDITION_FIXTURES = 24;
  const visibleSeasons =
    competitionId === 6
      ? availableSeasons.filter((s) => s.isCurrent || s.fixtureCount >= MIN_AFCON_EDITION_FIXTURES)
      : availableSeasons;

  const fallbackName =
    { 1: 'FIFA World Cup', 6: 'AFCON', 922: 'WAFCON' }[competitionId] ?? `Cup ${competitionId}`;
  const pageTitle = cupContent?.titles[locale] ?? `${fallbackName} ${seasonYear}`;
  const introText = cupContent?.intro[locale] ?? '';

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
    { label: t('football'), href: `/${rawLocale}` },
    { label: t('international') },
    { label: cupContent?.breadcrumbOrg ?? 'FIFA' },
    { label: `${pageTitle}, ${t('sectionsCup')}` },
  ];

  const breadcrumb = <SeoBreadcrumb segments={breadcrumbSegments} compact />;

  // About card content
  const aboutContent = getAboutContent(competitionId, locale);

  // Tab data
  const defaultHashes = {
    overview: 'overview',
    standings: 'standings',
    bestThird: 'best-3rd',
    knockout: 'knockout',
  };
  const hashes = cupContent?.tabHashes[locale] ?? defaultHashes;
  const facts = cupContent?.facts[locale] ?? [];
  const historicalTeamNames = cupContent?.historicalTeamNames[locale] ?? {};

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
    knockoutFixtures.length > 0 ? buildDynamicBracket(knockoutFixtures, locale) : null;

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
          locale={locale}
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
          locale={locale}
          groupLabels={metadata.groups.map((g) => g.label)}
          teamGroupMap={teamGroupMap}
        />
      ) : (
        <CupFixturesByRound fixtures={allCupFixtures} locale={locale} />
      ),
    },
    {
      key: 'standings',
      hash: hashes.standings,
      labelKey: 'standings',
      icon: 'table',
      // Best 3rd-placed teams (WC/AFCON only — bestThird is null otherwise) render as a table
      // below the group standings instead of a separate tab, to declutter the tab bar.
      content: (
        <div className="space-y-6">
          <StandingsTab standings={standings} metadata={metadata} locale={locale} />
          {bestThird && (
            <BestThirdTab
              rows={bestThird.rows}
              locale={locale}
              qualifiedCount={8}
              hasTiesRequiringFallback={bestThird.hasTiesRequiringFallback}
            />
          )}
        </div>
      ),
    },
    {
      key: 'knockout',
      hash: hashes.knockout,
      labelKey: 'knockout',
      icon: 'swords',
      content:
        competitionId === 1 ? (
          <KnockoutTab
            locale={locale}
            bracketHref={`/${rawLocale}/competition/${rawCountry}/${rawTournament}/bracket`}
            matches={cupBracket?.matches}
            thirdPlaceMatch={cupBracket?.thirdPlaceMatch}
          />
        ) : cupBracket ? (
          <div className="space-y-4">
            {(competitionId === 6 || competitionId === 922) && (
              <Link
                href={`/${rawLocale}/competition/${rawCountry}/${rawTournament}/bracket?season=${seasonYear}`}
                className="inline-flex items-center gap-1 rounded-lg border border-accent-azure/30 bg-accent-azure/10 px-3 py-1.5 text-xs font-medium text-accent-azure transition-colors hover:bg-accent-azure/20"
              >
                {tTournament('viewFullBracket')} →
              </Link>
            )}
            <DynamicKnockoutBracket
              matches={cupBracket.matches}
              thirdPlaceMatch={cupBracket.thirdPlaceMatch}
              locale={locale}
              gridConfig={cupBracket.gridConfig}
              competitionId={competitionId}
            />
          </div>
        ) : (
          <GenericKnockoutList fixtures={knockoutFixtures} locale={locale} />
        ),
    },
  ];

  return (
    <>
      <div className="mx-auto w-full max-w-[1280px] px-4 pt-px">{breadcrumb}</div>
      <InnerPageShell
        pageHeader={
          <TournamentPageHeader
            metadata={metadata}
            locale={locale}
            pageTitle={pageTitle}
            introText={introText}
            tournamentPhase={tournamentPhase}
            moroccoGroup={moroccoContext}
            orgName={cupContent?.breadcrumbOrg}
            matchesCount={allCupFixtures.length}
            availableSeasons={visibleSeasons}
            seasonYear={seasonYear}
          />
        }
        leftRail={
          <LeagueLeftRail
            locale={locale}
            activeCompetitionId={competitionId}
            competitionLogos={competitionLogos}
          />
        }
        center={<CenterTabs tabs={tabs} />}
        rightRailTop={
          cupFeaturedMatches.length > 0 ? (
            <LeagueRightRailCard
              featuredMatches={cupFeaturedMatches.slice(0, 1)}
              locale={locale}
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
              locale={locale}
              competitionName={pageTitle}
            />
            <RightRail
              metadata={metadata}
              standings={standings}
              locale={locale}
              tournamentName={pageTitle}
            />
          </div>
        }
        belowCenter={
          <>
            {/* Mobile-only: surface the right-rail featured matches (hidden xl:block rail). */}
            {cupFeaturedMatches.length > 0 && (
              <div className="xl:hidden">
                <LeagueRightRailCard
                  featuredMatches={cupFeaturedMatches}
                  locale={locale}
                  competitionName={pageTitle}
                />
              </div>
            )}
            <TournamentInfoStrip />
            <HashScrollHighlight />
            <RelatedCompetitions
              competitionIds={getRelatedCompetitionIds(competitionId)}
              locale={locale}
            />
            <CompetitionMediaSection competitionId={competitionId} locale={locale} />
            {aboutContent && <AboutCard content={aboutContent} />}
            <SportsEventJsonLd
              metadata={metadata}
              tournamentName={pageTitle}
              alternateNames={
                cupContent ? Object.values(cupContent.titles).filter((t) => t !== pageTitle) : []
              }
              canonicalUrl={cupContent?.urls[locale] ?? ''}
            />
            {aboutContent && <FaqPageJsonLd faqs={aboutContent.faqs} />}
          </>
        }
      />
    </>
  );
}
