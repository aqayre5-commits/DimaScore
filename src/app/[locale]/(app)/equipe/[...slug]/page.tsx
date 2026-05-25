import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, defaultLocale, type Locale } from '@/lib/i18n/config';
import { InnerPageShell } from '@/components/layout/InnerPageShell';
import { SeoBreadcrumb, type BreadcrumbSegment } from '@/components/chrome/SeoBreadcrumb';
import { TeamPageHeader } from '@/components/team/TeamPageHeader';
import { TeamSquadTable } from '@/components/team/TeamSquadTable';
import { TeamStandingsSection } from '@/components/team/TeamStandingsSection';
import { FeaturedMatchCard } from '@/components/tournament/FeaturedMatchCard';
import { MatchesList } from '@/components/tournament/MatchesList';
import { NewsletterCard } from '@/components/tournament/NewsletterCard';
import { CenterTabs } from '@/components/tournament/CenterTabs';
import { TeamMediaSection } from '@/components/team/TeamMediaSection';
import { db } from '@/lib/db/client';
import {
  getTeamBySlug,
  getTeamFixtures,
  getTeamSquad,
  getTeamStandings,
} from '@/lib/db/queries/team';

interface PageProps {
  params: Promise<{ locale: string; slug: string[] }>;
}

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// ── Tab hash fragments per locale ──

const TAB_HASHES: Record<Locale, { squad: string; standings: string }> = {
  fr: { squad: 'effectif', standings: 'classement' },
  en: { squad: 'squad', standings: 'standings' },
  ar: { squad: 'التشكيلة', standings: 'الترتيب' },
};

// ── Metadata ──

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug: rawSlug } = await params;
  const typedLocale = locale as Locale;
  const teamSlug = rawSlug.map(decodeURIComponent).pop() ?? '';
  const team = await getTeamBySlug(db, teamSlug);

  if (!team) {
    return { title: 'Team | Atlas Kings' };
  }

  const name = team.name[typedLocale] ?? team.name['en'] ?? teamSlug;
  const title = `${name} | Atlas Kings`;
  const description = `${name} — fixtures, squad, standings and statistics.`;
  const pageUrl = `${baseUrl}/${locale}/equipe/${rawSlug.join('/')}`;

  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = `${baseUrl}/${loc}/equipe/${rawSlug.join('/')}`;
  }
  languages['x-default'] = `${baseUrl}/${defaultLocale}/equipe/${rawSlug.join('/')}`;

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

export default async function TeamPage({ params }: PageProps) {
  const { locale, slug: rawSlug } = await params;
  const typedLocale = locale as Locale;
  const teamSlug = rawSlug.map(decodeURIComponent).pop() ?? '';

  const team = await getTeamBySlug(db, teamSlug);
  if (!team) notFound();

  const t = await getTranslations({ locale, namespace: 'teamPage' });
  const tBc = await getTranslations({ locale, namespace: 'breadcrumb' });
  const teamName = team.name[typedLocale] ?? team.name['en'] ?? teamSlug;

  // Parallel data fetching
  const [fixtures, squad, standingsData] = await Promise.all([
    getTeamFixtures(db, team.id, 20),
    getTeamSquad(db, team.id),
    getTeamStandings(db, team.id),
  ]);

  // Featured match: first upcoming fixture, or most recent
  const now = new Date();
  const upcomingFixture = fixtures.find((f) => f.kickoffAt > now) ?? fixtures[0] ?? null;

  // Breadcrumbs
  const breadcrumbs: BreadcrumbSegment[] = [
    { label: tBc('football'), href: `/${locale}` },
    { label: teamName },
  ];

  // Center tabs — use CenterTabs interface: { key, hash, labelKey, content }
  const hashes = TAB_HASHES[typedLocale];
  const tabs = [
    {
      key: 'squad',
      hash: hashes.squad,
      labelKey: 'squad',
      content: <TeamSquadTable players={squad} locale={typedLocale} />,
    },
    {
      key: 'standings',
      hash: hashes.standings,
      labelKey: 'standings',
      content: standingsData ? (
        <TeamStandingsSection
          standings={standingsData.standings}
          highlightTeamId={team.id}
          locale={typedLocale}
        />
      ) : (
        <div className="rounded-lg border border-border-subtle bg-bg-surface px-4 py-8 text-center">
          <p className="text-sm text-text-tertiary">{t('noStandingsData')}</p>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="mx-auto w-full max-w-[1280px] px-4 pt-4">
        <SeoBreadcrumb segments={breadcrumbs} />
      </div>

      <InnerPageShell
        pageHeader={<TeamPageHeader team={team} locale={typedLocale} />}
        leftRail={
          <div className="space-y-4">
            {upcomingFixture && (
              <FeaturedMatchCard
                fixture={upcomingFixture}
                locale={typedLocale}
                cardTitle={teamName}
              />
            )}
            <NewsletterCard tournamentName={teamName} />
          </div>
        }
        center={<CenterTabs tabs={tabs} />}
        rightRail={
          <div className="space-y-4">
            <MatchesList fixtures={fixtures} locale={typedLocale} />
          </div>
        }
        belowCenter={
          <div className="mt-6 space-y-6">
            <TeamMediaSection teamId={team.id} locale={typedLocale} />
          </div>
        }
      />
    </>
  );
}
