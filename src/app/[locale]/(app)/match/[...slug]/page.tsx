import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { db } from '@/lib/db/client';
import { getMatchDetail, getMatchCoverage } from '@/lib/db/queries/match-detail';
import { getLocalizedCompetitionName } from '@/lib/constants/competition-names-i18n';
import { getTeamDisplayName } from '@/lib/utils/team-name';
import { SeoBreadcrumb, type BreadcrumbSegment } from '@/components/chrome/SeoBreadcrumb';
import { ScoreHeader } from '@/components/match/ScoreHeader';
import type { Locale } from '@/lib/i18n/config';

interface PageProps {
  params: Promise<{ locale: string; slug: string[] }>;
}

function parseFixtureId(slug: string[]): number | null {
  const raw = slug[0];
  if (!raw) return null;
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug: rawSlug } = await params;
  const slug = rawSlug.map(decodeURIComponent);
  const fixtureId = parseFixtureId(slug);
  if (!fixtureId) return { title: 'Match | Atlas Kings' };

  const match = await getMatchDetail(db, fixtureId);
  if (!match) return { title: 'Match | Atlas Kings' };

  const home = getTeamDisplayName(match.homeTeam, locale);
  const away = getTeamDisplayName(match.awayTeam, locale);
  const compName = getLocalizedCompetitionName(
    { id: match.competition.id, name: match.competition.name, slug: match.competition.slug },
    locale,
  );

  return {
    title: `${home} vs ${away} | ${compName} | Atlas Kings`,
    description: `${home} vs ${away} — ${compName}${match.round ? `, ${match.round}` : ''}`,
  };
}

export default async function MatchDetailPage({ params }: PageProps) {
  const { locale, slug: rawSlug } = await params;
  const slug = rawSlug.map(decodeURIComponent);
  const fixtureId = parseFixtureId(slug);
  if (!fixtureId) notFound();

  const match = await getMatchDetail(db, fixtureId);
  if (!match) notFound();

  const [t, coverage] = await Promise.all([
    getTranslations({ locale, namespace: 'matchDetail' }),
    getMatchCoverage(db, match.competition.id, match.seasonYear),
  ]);

  const typedLocale = locale as Locale;

  const compName = getLocalizedCompetitionName(
    { id: match.competition.id, name: match.competition.name, slug: match.competition.slug },
    typedLocale,
  );

  const home = getTeamDisplayName(match.homeTeam, typedLocale);
  const away = getTeamDisplayName(match.awayTeam, typedLocale);

  const breadcrumbs: BreadcrumbSegment[] = [{ label: compName }, { label: `${home} vs ${away}` }];

  // Tab definitions — gated by coverage
  const tabs = [
    { key: 'summary', label: t('summary'), always: true },
    { key: 'events', label: t('events'), always: false, visible: coverage?.events },
    { key: 'lineups', label: t('lineups'), always: false, visible: coverage?.lineups },
    {
      key: 'stats',
      label: t('stats'),
      always: false,
      visible: coverage?.statisticsFixtures,
    },
    {
      key: 'playerRatings',
      label: t('playerRatings'),
      always: false,
      visible: coverage?.statisticsPlayers,
    },
    { key: 'h2h', label: t('h2h'), always: true },
    {
      key: 'prediction',
      label: t('prediction'),
      always: false,
      visible: coverage?.predictions,
    },
    { key: 'media', label: t('media'), always: true },
  ].filter((tab) => tab.always || tab.visible);

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-4">
      <SeoBreadcrumb segments={breadcrumbs} />

      <div className="mt-4">
        <ScoreHeader match={match} locale={typedLocale} />
      </div>

      {/* Tab bar */}
      <nav
        className="mt-4 flex gap-1 overflow-x-auto border-b border-border-subtle"
        aria-label="Match tabs"
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className="shrink-0 border-b-2 border-transparent px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary data-[active=true]:border-accent-gold data-[active=true]:text-text-primary"
            data-active={tab.key === 'summary'}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Tab content placeholder — filled by sub-tasks 8.3+ */}
      <div className="mt-4 min-h-[200px] rounded-lg border border-border-subtle bg-bg-surface p-6 text-center text-sm text-text-tertiary">
        {t('summary')}
      </div>
    </div>
  );
}
