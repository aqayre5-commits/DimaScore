import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { db } from '@/lib/db/client';
import { getMatchDetail, getMatchCoverage } from '@/lib/db/queries/match-detail';
import { getMatchState } from '@/lib/match-status';
import { getLocalizedCompetitionName } from '@/lib/constants/competition-names-i18n';
import {
  findEntryByCompetitionId,
  buildCompetitionHref,
} from '@/lib/constants/competitions-mega-menu';
import { getTeamDisplayName } from '@/lib/utils/team-name';
import { SeoBreadcrumb, type BreadcrumbSegment } from '@/components/chrome/SeoBreadcrumb';
import { InnerPageShell } from '@/components/layout/InnerPageShell';
import { ScoreHeader } from '@/components/match/ScoreHeader';
import { MatchLiveUpdater } from '@/components/match/MatchLiveUpdater';
import { MatchClientCenter } from '@/components/match/MatchClientCenter';
import { MatchClientLeftRail, MatchClientRightRail } from '@/components/match/MatchClientSidebar';

import { cacheLife } from 'next/cache';
import { locales, defaultLocale, type Locale } from '@/lib/i18n/config';
import { BASE_URL } from '@/lib/constants/site';

const LIVE_CODES = new Set(['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE']);

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

function parseFixtureId(raw: string): number | null {
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
}

async function getCachedMatchData(fixtureId: number) {
  'use cache';
  cacheLife('match');
  const match = await getMatchDetail(db, fixtureId);
  if (!match) return null;
  const coverage = await getMatchCoverage(db, match.competition.id, match.seasonYear);
  return { match, coverage };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id: rawId } = await params;
  const fixtureId = parseFixtureId(decodeURIComponent(rawId));
  if (!fixtureId) return { title: 'Match | DimaScore' };

  const data = await getCachedMatchData(fixtureId);
  if (!data) return { title: 'Match | DimaScore' };
  const { match } = data;

  const home = getTeamDisplayName(match.homeTeam, locale);
  const away = getTeamDisplayName(match.awayTeam, locale);
  const compName = getLocalizedCompetitionName(
    { id: match.competition.id, name: match.competition.name, slug: match.competition.slug },
    locale,
  );

  const title = `${home} vs ${away} | ${compName} | DimaScore`;
  const description = `${home} vs ${away} — ${compName}${match.round ? `, ${match.round}` : ''}`;
  const canonical = `${BASE_URL}/${locale}/match/${fixtureId}`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: Object.fromEntries(locales.map((l) => [l, `${BASE_URL}/${l}/match/${fixtureId}`])),
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'DimaScore',
      locale: locale === 'ar' ? 'ar_MA' : locale === 'fr' ? 'fr_MA' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export default async function MatchDetailPage({ params }: PageProps) {
  const { locale, id: rawId } = await params;
  setRequestLocale(locale);
  const fixtureId = parseFixtureId(decodeURIComponent(rawId));
  if (!fixtureId) notFound();

  const [data, tBc] = await Promise.all([
    getCachedMatchData(fixtureId),
    getTranslations({ locale, namespace: 'breadcrumb' }),
  ]);
  if (!data) notFound();
  const { match, coverage } = data;

  const typedLocale = locale as Locale;

  const homeTeamId = match.homeTeam?.id ?? -1;
  const awayTeamId = match.awayTeam?.id ?? -1;
  const matchState = getMatchState(match.statusCode, match.kickoffAt);
  const isUpcoming = matchState === 'upcoming';
  const isLive = LIVE_CODES.has(match.statusCode);

  const compName = getLocalizedCompetitionName(
    { id: match.competition.id, name: match.competition.name, slug: match.competition.slug },
    typedLocale,
  );
  const home = getTeamDisplayName(match.homeTeam, typedLocale);
  const away = getTeamDisplayName(match.awayTeam, typedLocale);

  const competitionEntry = findEntryByCompetitionId(match.competition.id);
  const competitionHref = competitionEntry
    ? buildCompetitionHref(competitionEntry, typedLocale)
    : null;

  const breadcrumbs: BreadcrumbSegment[] = [
    { label: tBc('football'), href: `/${locale}` },
    { label: compName, href: competitionHref ?? undefined },
    ...(match.round ? [{ label: match.round }] : []),
    { label: `${home} vs ${away}` },
  ];

  const matchId = String(fixtureId);

  // Serialize match for client components (Date → ISO string)
  const serializedMatch = {
    ...match,
    kickoffAt: match.kickoffAt.toISOString(),
  };

  const pageContent = (
    <>
      <div className="mx-auto w-full max-w-[1280px] px-4 pt-4">
        <SeoBreadcrumb segments={breadcrumbs} />
      </div>

      <InnerPageShell
        leftRail={
          <MatchClientLeftRail
            matchId={matchId}
            locale={typedLocale}
            match={serializedMatch}
            coverage={coverage}
            homeTeamId={homeTeamId}
            awayTeamId={awayTeamId}
            isUpcoming={isUpcoming}
          />
        }
        center={
          <div className="space-y-4">
            <ScoreHeader match={match} locale={typedLocale} competitionHref={competitionHref} />
            <MatchClientCenter
              matchId={matchId}
              locale={typedLocale}
              coverage={coverage}
              homeTeamId={homeTeamId}
              awayTeamId={awayTeamId}
              homeName={home}
              awayName={away}
              isUpcoming={isUpcoming}
            />
          </div>
        }
        rightRail={
          <MatchClientRightRail
            matchId={matchId}
            locale={typedLocale}
            match={serializedMatch}
            competitionHref={competitionHref}
            homeTeamId={homeTeamId}
            awayTeamId={awayTeamId}
            homeName={home}
            awayName={away}
          />
        }
      />
    </>
  );

  if (isLive) {
    return (
      <MatchLiveUpdater
        fixtureId={match.id}
        initialStatus={match.statusCode}
        initialHomeScore={match.homeScore}
        initialAwayScore={match.awayScore}
        initialMinute={match.minute}
        initialExtraMinute={match.extraMinute}
      >
        {pageContent}
      </MatchLiveUpdater>
    );
  }

  return pageContent;
}
