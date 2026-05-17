import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { locales, defaultLocale, type Locale } from '@/lib/i18n/config';
import { InnerPageShell } from '@/components/layout/InnerPageShell';
import { SeoBreadcrumb, type BreadcrumbSegment } from '@/components/chrome/SeoBreadcrumb';
import { getMetadataForCompetition, type CupMetadata } from '@/lib/constants/tournament-metadata';
import { MEGA_MENU_SECTIONS, type MegaMenuEntry } from '@/lib/constants/competitions-mega-menu';
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
import { VideosSection } from '@/components/tournament/VideosSection';
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

interface PageProps {
  params: Promise<{ locale: string; country: string; tournament: string }>;
}

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// ── Per-locale hand-written metadata (competition-cup.md Section 2) ──

const WC_2026_META: Record<Locale, { title: string; description: string }> = {
  fr: {
    title: 'Coupe du Monde 2026 — Calendrier, groupes, classement et phase finale | Atlas Kings',
    description:
      "Suivez la Coupe du Monde FIFA 2026 en direct : calendrier des 104 matchs, les 12 groupes, classement de chaque groupe, phase à élimination directe. Le Maroc dans le Groupe C avec le Brésil, Haïti et l'Écosse.",
  },
  en: {
    title: 'FIFA World Cup 2026 — Fixtures, groups, standings and knockout | Atlas Kings',
    description:
      'Follow the FIFA World Cup 2026 live: 104-match schedule, 12 groups, standings per group, knockout bracket. Morocco in Group C with Brazil, Haiti, and Scotland.',
  },
  ar: {
    title: 'كأس العالم 2026 — الجدول، المجموعات، الترتيب ومرحلة الإقصاء | أطلس كينغز',
    description:
      'تابعوا كأس العالم فيفا 2026 مباشرة: جدول 104 مباريات، 12 مجموعة، ترتيب كل مجموعة، الأدوار الإقصائية. المغرب في المجموعة C مع البرازيل وهايتي واسكتلندا.',
  },
};

const WC_2026_INTRO: Record<Locale, string> = {
  fr: 'La Coupe du Monde FIFA 2026 réunit 48 équipes nationales aux États-Unis, au Canada et au Mexique — la première édition à 48 équipes au lieu de 32. Suivez le calendrier complet, les 12 groupes, les classements et la phase à élimination directe en direct.',
  en: 'The FIFA World Cup 2026 brings 48 national teams to the United States, Canada, and Mexico — the first edition with 48 teams instead of 32. Follow the full schedule, 12 groups, standings, and knockout bracket live.',
  ar: 'يجمع كأس العالم فيفا 2026 ثمانية وأربعين منتخباً وطنياً في الولايات المتحدة وكندا والمكسيك — أول نسخة بمشاركة 48 منتخباً بدلاً من 32. تابعوا الجدول الكامل، 12 مجموعة، الترتيب ومرحلة الأدوار الإقصائية مباشرة.',
};

const WC_2026_TITLES: Record<Locale, string> = {
  fr: 'Coupe du Monde FIFA 2026',
  en: 'FIFA World Cup 2026',
  ar: 'كأس العالم فيفا 2026',
};

const WC_2026_SLUGS = ['coupe-du-monde-2026', 'world-cup-2026', 'كأس-العالم-2026'];

const WC_2026_URLS: Record<Locale, string> = {
  fr: `${baseUrl}/fr/competition/fifa/coupe-du-monde-2026`,
  en: `${baseUrl}/en/competition/fifa/world-cup-2026`,
  ar: `${baseUrl}/ar/competition/فيفا/كأس-العالم-2026`,
};

// Per-locale hash fragments (competition-cup.md Section 1)
const TAB_HASHES: Record<
  Locale,
  { overview: string; standings: string; bestThird: string; knockout: string }
> = {
  fr: {
    overview: 'vue-densemble',
    standings: 'classement',
    bestThird: 'meilleurs-3emes',
    knockout: 'elimination',
  },
  en: { overview: 'overview', standings: 'standings', bestThird: 'best-3rd', knockout: 'knockout' },
  ar: {
    overview: 'نظرة-عامة',
    standings: 'ترتيب',
    bestThird: 'افضل-الثالثة',
    knockout: 'إقصائيات',
  },
};

// Historical winner team code → locale name (static, small set)
const HISTORICAL_TEAM_NAMES: Record<Locale, Record<string, string>> = {
  fr: { AR: 'Argentine', FR: 'France', DE: 'Allemagne', ES: 'Espagne', IT: 'Italie' },
  en: { AR: 'Argentina', FR: 'France', DE: 'Germany', ES: 'Spain', IT: 'Italy' },
  ar: { AR: 'الأرجنتين', FR: 'فرنسا', DE: 'ألمانيا', ES: 'إسبانيا', IT: 'إيطاليا' },
};

// Per-locale facts (competition-cup.md Section 7 Tab 1 Block 5)
const WC_2026_FACTS: Record<Locale, string[]> = {
  fr: [
    '48 équipes nationales',
    '12 groupes de 4 équipes',
    '104 matchs au total',
    '16 villes hôtes',
    '3 pays organisateurs (USA, Canada, Mexique)',
    '11 juin → 19 juillet 2026',
    'Format élargi : 1ère édition à 48 équipes',
  ],
  en: [
    '48 national teams',
    '12 groups of 4 teams',
    '104 total matches',
    '16 host cities',
    '3 host countries (USA, Canada, Mexico)',
    '11 June → 19 July 2026',
    'Expanded format: first 48-team edition',
  ],
  ar: [
    '48 منتخباً وطنياً',
    '12 مجموعة من 4 فرق',
    '104 مباريات إجمالاً',
    '16 مدينة مستضيفة',
    '3 دول مستضيفة (الولايات المتحدة، كندا، المكسيك)',
    '11 يونيو → 19 يوليو 2026',
    'صيغة موسعة: أول نسخة بـ48 منتخباً',
  ],
};

// ── Helpers ──

function resolveEntry(tournament: string, locale: Locale): MegaMenuEntry | undefined {
  for (const section of MEGA_MENU_SECTIONS) {
    for (const entry of section.entries) {
      if (entry.slugs[locale] === tournament) return entry;
    }
  }
  return undefined;
}

function isWc2026(tournament: string): boolean {
  return WC_2026_SLUGS.includes(tournament);
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

  if (isWc2026(tournament)) {
    const meta = WC_2026_META[typedLocale];
    const pageUrl = WC_2026_URLS[typedLocale];
    const ogImage = `${baseUrl}/competitions/wc-2026-trophy.png`;
    const languages: Record<string, string> = {};
    for (const loc of locales) {
      languages[loc] = WC_2026_URLS[loc as Locale];
    }
    languages['x-default'] = WC_2026_URLS[defaultLocale];

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
        images: [{ url: ogImage, alt: WC_2026_TITLES[typedLocale] }],
      },
      twitter: {
        card: 'summary_large_image' as const,
        title: meta.title,
        description: meta.description,
        images: [ogImage],
      },
    };
  }

  const displayName = tournament.replace(/-/g, ' ');
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = `${baseUrl}/${loc}/competition/${country}/${tournament}`;
  }
  languages['x-default'] = languages[defaultLocale];

  return {
    title: `${displayName} | Atlas Kings`,
    description: `${displayName} — Atlas Kings`,
    alternates: { languages },
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

  if (!metadata || metadata.type !== 'cup') {
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

  // ── WC 2026 full render — fetch real data ──

  const competitionId = metadata.competitionId;
  const seasonYear = metadata.editionYear;

  const [moroccoTeamId, standings, round1Fixtures] = await Promise.all([
    getMoroccoTeamId(db),
    getStandings(db, competitionId, seasonYear),
    getFixturesByRound(db, competitionId, seasonYear, 1),
  ]);

  const featuredMatch = moroccoTeamId
    ? await getFeaturedMatch(db, competitionId, seasonYear, moroccoTeamId)
    : null;

  const tournamentPhase = computeTournamentPhase(metadata);
  const pageTitle = WC_2026_TITLES[typedLocale];
  const introText = WC_2026_INTRO[typedLocale];

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
    { label: 'FIFA' },
    { label: pageTitle },
  ];

  const breadcrumb = <SeoBreadcrumb segments={breadcrumbSegments} />;

  // About card content
  const aboutContent = getAboutContent(competitionId, typedLocale);

  // Tab data
  const hashes = TAB_HASHES[typedLocale];
  const facts = WC_2026_FACTS[typedLocale];
  const historicalTeamNames = HISTORICAL_TEAM_NAMES[typedLocale];

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
          <VideosSection youtubeIds={metadata.mediaYoutubeIds} />
          {aboutContent && <AboutCard content={aboutContent} />}
          <SportsEventJsonLd
            metadata={metadata}
            tournamentName={pageTitle}
            alternateNames={Object.values(WC_2026_TITLES).filter((t) => t !== pageTitle)}
            canonicalUrl={WC_2026_URLS[typedLocale]}
          />
          {aboutContent && <FaqPageJsonLd faqs={aboutContent.faqs} />}
        </>
      }
    />
  );
}
