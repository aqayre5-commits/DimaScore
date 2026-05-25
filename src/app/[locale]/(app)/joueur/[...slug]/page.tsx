import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, defaultLocale, type Locale } from '@/lib/i18n/config';
import { InnerPageShell } from '@/components/layout/InnerPageShell';
import { SeoBreadcrumb, type BreadcrumbSegment } from '@/components/chrome/SeoBreadcrumb';
import { PlayerPageHeader } from '@/components/player/PlayerPageHeader';
import { PlayerInfoCard } from '@/components/player/PlayerInfoCard';
import { PlayerSeasonStats } from '@/components/player/PlayerSeasonStats';
import { PlayerTransfers } from '@/components/player/PlayerTransfers';
import { FeaturedMatchCard } from '@/components/tournament/FeaturedMatchCard';
import { NewsletterCard } from '@/components/tournament/NewsletterCard';
import { CenterTabs } from '@/components/tournament/CenterTabs';
import { PlayerMediaSection } from '@/components/player/PlayerMediaSection';
import { db } from '@/lib/db/client';
import {
  getPlayerBySlug,
  getPlayerTeamFixtures,
  getPlayerSeasonStats,
  getPlayerTransfers,
} from '@/lib/db/queries/player';

interface PageProps {
  params: Promise<{ locale: string; slug: string[] }>;
}

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// ── Tab hash fragments per locale ──

const TAB_HASHES: Record<Locale, { season: string; career: string }> = {
  fr: { season: 'saison', career: 'carriere' },
  en: { season: 'season', career: 'career' },
  ar: { season: 'الموسم', career: 'المسيرة' },
};

// ── Metadata ──

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug: rawSlug } = await params;
  const typedLocale = locale as Locale;
  const playerSlug = rawSlug.map(decodeURIComponent).pop() ?? '';
  const player = await getPlayerBySlug(db, playerSlug);

  if (!player) {
    return { title: 'Player | Atlas Kings' };
  }

  const name = player.name[typedLocale] ?? player.name['en'] ?? playerSlug;
  const title = `${name} | Atlas Kings`;
  const description = `${name} — season stats, career, transfers and more.`;
  const pageUrl = `${baseUrl}/${locale}/joueur/${rawSlug.join('/')}`;

  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = `${baseUrl}/${loc}/joueur/${rawSlug.join('/')}`;
  }
  languages['x-default'] = `${baseUrl}/${defaultLocale}/joueur/${rawSlug.join('/')}`;

  return {
    title,
    description,
    alternates: { canonical: pageUrl, languages },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: 'Atlas Kings',
      locale: typedLocale === 'fr' ? 'fr_FR' : typedLocale === 'ar' ? 'ar_MA' : 'en_US',
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

// ── Page ──

export default async function PlayerPage({ params }: PageProps) {
  const { locale, slug: rawSlug } = await params;
  const typedLocale = locale as Locale;
  const playerSlug = rawSlug.map(decodeURIComponent).pop() ?? '';

  const player = await getPlayerBySlug(db, playerSlug);
  if (!player) notFound();

  const t = await getTranslations({ locale, namespace: 'playerPage' });
  const tBc = await getTranslations({ locale, namespace: 'breadcrumb' });
  const playerName =
    player.name[typedLocale] ??
    player.name['en'] ??
    [player.firstname, player.lastname].filter(Boolean).join(' ') ??
    playerSlug;

  // Parallel data fetching
  const [fixtures, seasonStats, transfers] = await Promise.all([
    player.currentTeam ? getPlayerTeamFixtures(db, player.currentTeam.id, 20) : [],
    getPlayerSeasonStats(db, player.id),
    getPlayerTransfers(db, player.id),
  ]);

  // Featured match: first upcoming fixture from the player's team
  const now = new Date();
  const upcomingFixture = fixtures.find((f) => f.kickoffAt > now) ?? fixtures[0] ?? null;

  // Breadcrumbs
  const breadcrumbs: BreadcrumbSegment[] = [
    { label: tBc('football'), href: `/${locale}` },
    { label: playerName },
  ];

  // Center tabs — Statistics shows current season stats, Career shows transfers
  const hashes = TAB_HASHES[typedLocale];
  const tabs = [
    {
      key: 'season',
      hash: hashes.season,
      labelKey: 'season',
      content: <PlayerSeasonStats stats={seasonStats} locale={typedLocale} />,
    },
    {
      key: 'career',
      hash: hashes.career,
      labelKey: 'career',
      content: <PlayerTransfers transfers={transfers} locale={typedLocale} />,
    },
  ];

  return (
    <>
      <div className="mx-auto w-full max-w-[1280px] px-4 pt-4">
        <SeoBreadcrumb segments={breadcrumbs} />
      </div>

      <InnerPageShell
        pageHeader={<PlayerPageHeader player={player} locale={typedLocale} />}
        leftRail={
          <div className="space-y-4">
            <PlayerInfoCard player={player} locale={typedLocale} />
            {upcomingFixture && (
              <FeaturedMatchCard
                fixture={upcomingFixture}
                locale={typedLocale}
                cardTitle={playerName}
              />
            )}
            <NewsletterCard tournamentName={playerName} />
          </div>
        }
        center={<CenterTabs tabs={tabs} />}
        rightRail={
          <div className="space-y-4">
            <PlayerTransfers transfers={transfers} locale={typedLocale} />
          </div>
        }
        belowCenter={
          <div className="mt-6 space-y-6">
            <PlayerMediaSection playerId={player.id} locale={typedLocale} />
          </div>
        }
      />
    </>
  );
}
