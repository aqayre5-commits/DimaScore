import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { locales, defaultLocale, type Locale } from '@/lib/i18n/config';
import { InnerPageShell } from '@/components/layout/InnerPageShell';
import { SeoBreadcrumb, type BreadcrumbSegment } from '@/components/chrome/SeoBreadcrumb';
import { getMetadataForCompetition, type CupMetadata } from '@/lib/constants/tournament-metadata';
import { MEGA_MENU_SECTIONS, type MegaMenuEntry } from '@/lib/constants/competitions-mega-menu';
import { getCupContent, findCupContentBySlug } from '@/lib/constants/cup-content';
import { TournamentPageHeader } from '@/components/tournament/TournamentPageHeader';
import { FeaturedMatchCard } from '@/components/tournament/FeaturedMatchCard';
import { MatchesList } from '@/components/tournament/MatchesList';
import { NewsletterCard } from '@/components/tournament/NewsletterCard';
import { CenterTabs } from '@/components/tournament/CenterTabs';
import { OverviewTab } from '@/components/tournament/OverviewTab';
import { StandingsTab } from '@/components/tournament/StandingsTab';
import { KnockoutTab } from '@/components/tournament/KnockoutTab';
import { BestThirdTab } from '@/components/tournament/BestThirdTab';
import { RightRail } from '@/components/tournament/RightRail';
import { CompetitionMediaSection } from '@/components/tournament/CompetitionMediaSection';
import { AboutCard } from '@/components/tournament/AboutCard';
import { SportsEventJsonLd } from '@/components/seo/SportsEventJsonLd';
import { FaqPageJsonLd } from '@/components/seo/FaqPageJsonLd';
import { HashScrollHighlight } from '@/components/shared/HashScrollHighlight';
import { getAboutContent } from '@/lib/constants/about-content';
import { computeBestThirdPlaced } from '@/lib/standings/best-third';
import type { TournamentPhase } from '@/components/tournament/StatusDescriptor';
import { db } from '@/lib/db/client';
import {
  getFeaturedMatch,
  getFixturesByRound,
  getStandings,
  getMoroccoTeamId,
} from '@/lib/db/queries';
import {
  getCompetitionById,
  getLeagueCoverage,
  getCurrentSeasonYear,
  getLeagueRounds,
  getCurrentRound,
  getLeagueFeaturedMatch,
  getLeagueFixtures,
  getTopScorersForLeague,
  getTopAssistsForLeague,
} from '@/lib/db/queries/league';
import { LeaguePageHeader } from '@/components/league/LeaguePageHeader';
import { LeagueStandingsTab } from '@/components/league/LeagueStandingsTab';
import { LeagueFixturesCard } from '@/components/league/LeagueFixturesCard';
import { LeagueRightRail } from '@/components/league/LeagueRightRail';
import { getLeagueIntro, getLeagueCountryName } from '@/lib/constants/league-content';

interface PageProps {
  params: Promise<{ locale: string; country: string; tournament: string }>;
}

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// Cup content is now in src/lib/constants/cup-content.ts, keyed by competitionId.

// ── Helpers ──

function resolveEntry(tournament: string, locale: Locale): MegaMenuEntry | undefined {
  for (const section of MEGA_MENU_SECTIONS) {
    for (const entry of section.entries) {
      if (entry.slugs[locale] === tournament) return entry;
    }
  }
  return undefined;
}

function computeTournamentPhase(metadata: CupMetadata): TournamentPhase {
  const now = new Date();
  const kickoff = new Date(metadata.kickoffDate);
  const daysUntil = Math.ceil((kickoff.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntil > 0) {
    const kickoffFormatted = kickoff.toLocaleDateString('fr', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return {
      phase: 'pre-tournament',
      daysUntilKickoff: daysUntil,
      kickoffDateFormatted: kickoffFormatted,
    };
  }

  // TODO: compute live/knockout/post-tournament states from fixture data
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
        siteName: 'Atlas Kings',
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
  let description = `${displayName} — Atlas Kings`;

  if (entry) {
    const competition = await getCompetitionById(db, entry.competitionId);
    if (competition) {
      displayName = competition.name[typedLocale] ?? competition.name['en'] ?? displayName;
      const seasonYear = await getCurrentSeasonYear(db, competition.id);
      const season = seasonYear ? `${seasonYear}/${(seasonYear + 1) % 100}` : '';
      displayName = season ? `${displayName} ${season}` : displayName;
      description = `${displayName} — standings, matches, and statistics | Atlas Kings`;
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
    title: `${displayName} | Atlas Kings`,
    description,
    alternates: { languages },
    robots: { index: true, follow: true },
  };
}

// ── Page ──

export default async function CompetitionPage({ params }: PageProps) {
  const { locale, country: rawCountry, tournament: rawTournament } = await params;
  const tournament = decodeURIComponent(rawTournament);
  const typedLocale = locale as Locale;
  const t = await getTranslations({ locale, namespace: 'breadcrumb' });
  const tP = await getTranslations({ locale, namespace: 'placeholder' });
  const tT = await getTranslations({ locale, namespace: 'tournament' });

  // Gate: only render full page for competitions with metadata
  const entry = resolveEntry(tournament, typedLocale);
  const metadata = entry ? getMetadataForCompetition(entry.competitionId) : undefined;

  // League branch: competition exists in DB with type='League'
  if (!metadata || metadata.type !== 'cup') {
    if (entry) {
      const competition = await getCompetitionById(db, entry.competitionId);
      if (competition && competition.type === 'League') {
        return renderLeaguePage(competition, entry, typedLocale, locale, rawCountry, rawTournament);
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
  const seasonYear = metadata.editionYear;
  const cupContent = getCupContent(competitionId);

  const [moroccoTeamId, standings, round1Fixtures] = await Promise.all([
    getMoroccoTeamId(db),
    getStandings(db, competitionId, seasonYear),
    getFixturesByRound(db, competitionId, seasonYear, 1),
  ]);

  const featuredMatch = moroccoTeamId
    ? await getFeaturedMatch(db, competitionId, seasonYear, moroccoTeamId)
    : null;

  const tournamentPhase = computeTournamentPhase(metadata);
  const pageTitle = cupContent?.titles[typedLocale] ?? metadata.competitionId.toString();
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

  const tabs = [
    {
      key: 'overview',
      hash: hashes.overview,
      labelKey: 'overview',
      content: (
        <OverviewTab
          featuredFixtures={round1Fixtures.slice(0, 2)}
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
      key: 'standings',
      hash: hashes.standings,
      labelKey: 'standings',
      content: <StandingsTab standings={standings} metadata={metadata} locale={typedLocale} />,
    },
    ...(bestThird
      ? [
          {
            key: 'bestThird',
            hash: hashes.bestThird,
            labelKey: 'bestThird',
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
      content: (
        <KnockoutTab
          locale={typedLocale}
          bracketHref={`/${locale}/competition/${rawCountry}/${rawTournament}/bracket`}
        />
      ),
    },
  ];

  return (
    <InnerPageShell
      pageHeader={
        <TournamentPageHeader
          metadata={metadata}
          locale={typedLocale}
          pageTitle={pageTitle}
          introText={introText}
          tournamentPhase={tournamentPhase}
          moroccoGroup={moroccoContext}
          breadcrumb={breadcrumb}
        />
      }
      leftRail={
        <div className="space-y-4">
          {featuredMatch && (
            <FeaturedMatchCard
              fixture={featuredMatch}
              locale={typedLocale}
              cardTitle={tT('featured')}
              shareHash="featured"
            />
          )}

          <MatchesList fixtures={round1Fixtures} locale={typedLocale} />

          <NewsletterCard tournamentName={pageTitle} />
        </div>
      }
      center={<CenterTabs tabs={tabs} />}
      rightRail={
        <RightRail
          metadata={metadata}
          standings={standings}
          locale={typedLocale}
          tournamentName={pageTitle}
        />
      }
      belowCenter={
        <>
          <HashScrollHighlight />
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
  );
}

// ── League page renderer ──

const LEAGUE_TAB_HASHES: Record<Locale, { standings: string; media: string }> = {
  fr: { standings: 'classement', media: 'media' },
  en: { standings: 'standings', media: 'media' },
  ar: { standings: 'الترتيب', media: 'وسائط' },
};

async function renderLeaguePage(
  competition: NonNullable<Awaited<ReturnType<typeof getCompetitionById>>>,
  entry: MegaMenuEntry,
  locale: Locale,
  rawLocale: string,
  rawCountry: string,
  rawTournament: string,
) {
  const tBc = await getTranslations({ locale: rawLocale, namespace: 'breadcrumb' });
  const tL = await getTranslations({ locale: rawLocale, namespace: 'leaguePage' });

  const seasonYear = await getCurrentSeasonYear(db, competition.id);
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
    featuredMatch,
    fixtures,
    topScorers,
    topAssists,
  ] = await Promise.all([
    getLeagueCoverage(db, competition.id, seasonYear),
    getStandings(db, competition.id, seasonYear),
    getLeagueRounds(db, competition.id, seasonYear),
    getCurrentRound(db, competition.id, seasonYear),
    getLeagueFeaturedMatch(db, competition.id, seasonYear),
    getLeagueFixtures(db, competition.id, seasonYear),
    getTopScorersForLeague(db, competition.id, seasonYear),
    getTopAssistsForLeague(db, competition.id, seasonYear),
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

  // Center tabs
  const hashes = LEAGUE_TAB_HASHES[locale];
  const tabs = [
    {
      key: 'standings',
      hash: hashes.standings,
      labelKey: 'standings',
      content:
        coverage?.standings !== false && standings.length > 0 ? (
          <LeagueStandingsTab standings={standings} locale={locale} />
        ) : (
          <div className="rounded-lg border border-border-subtle bg-bg-surface px-4 py-8 text-center">
            <p className="text-sm text-text-tertiary">{tL('comingSoon')}</p>
          </div>
        ),
    },
    {
      key: 'media',
      hash: hashes.media,
      labelKey: 'media',
      content: <CompetitionMediaSection competitionId={competition.id} locale={locale} />,
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
          />
        }
        leftRail={
          <div className="space-y-4">
            {featuredMatch && (
              <FeaturedMatchCard
                fixture={featuredMatch}
                locale={locale}
                cardTitle={competitionName}
              />
            )}
            {rounds.length > 0 && currentRound != null && (
              <LeagueFixturesCard
                fixtures={fixtures}
                rounds={rounds}
                defaultRound={currentRound}
                locale={locale}
              />
            )}
            <NewsletterCard tournamentName={competitionName} />
          </div>
        }
        center={<CenterTabs tabs={tabs} />}
        rightRail={
          <LeagueRightRail
            competitionName={competitionName}
            coverage={coverage}
            topScorers={topScorers}
            topAssists={topAssists}
          />
        }
        belowCenter={<CompetitionMediaSection competitionId={competition.id} locale={locale} />}
      />
    </>
  );
}
