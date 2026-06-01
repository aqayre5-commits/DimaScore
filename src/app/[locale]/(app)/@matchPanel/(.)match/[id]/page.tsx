import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import { db } from '@/lib/db/client';
import {
  getMatchDetail,
  getMatchCoverage,
  getMatchEvents,
  getMatchStatistics,
} from '@/lib/db/queries/match-detail';
import {
  findEntryByCompetitionId,
  buildCompetitionHref,
} from '@/lib/constants/competitions-mega-menu';
import { ScoreHeader, type GoalScorer } from '@/components/match/ScoreHeader';
import { EventTimeline } from '@/components/match/EventTimeline';
import { StatsBars } from '@/components/match/StatsBars';
import type { Locale } from '@/lib/i18n/config';

export const revalidate = 30;

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

function parseFixtureId(raw: string): number | null {
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export default async function MatchPanelPage({ params }: PageProps) {
  const { locale, id: rawId } = await params;
  setRequestLocale(locale);
  const fixtureId = parseFixtureId(decodeURIComponent(rawId));
  if (!fixtureId) notFound();

  const match = await getMatchDetail(db, fixtureId);
  if (!match) notFound();

  const typedLocale = locale as Locale;
  const homeTeamId = match.homeTeam?.id ?? -1;

  const [t, coverage, events, teamStats] = await Promise.all([
    getTranslations({ locale, namespace: 'matchDetail' }),
    getMatchCoverage(db, match.competition.id, match.seasonYear),
    getMatchEvents(db, fixtureId),
    getMatchStatistics(db, fixtureId),
  ]);

  const competitionEntry = findEntryByCompetitionId(match.competition.id);
  const competitionHref = competitionEntry
    ? buildCompetitionHref(competitionEntry, typedLocale)
    : null;

  const hasEvents = (coverage?.events ?? false) && events.length > 0;
  const hasStats = (coverage?.statisticsFixtures ?? false) && teamStats.length === 2;
  const homeStatData = teamStats.find((s) => s.teamId === homeTeamId);
  const awayStatData = teamStats.find((s) => s.teamId === (match.awayTeam?.id ?? -1));

  const goalScorers: GoalScorer[] = events
    .filter((e) => {
      const type = e.type?.toLowerCase() ?? '';
      const detail = (e.detail ?? '').toLowerCase();
      return type === 'goal' && !detail.includes('missed');
    })
    .map((e) => ({
      playerName: e.player?.name?.[typedLocale] ?? e.player?.name?.['en'] ?? '',
      minute: e.minute,
      extraMinute: e.extraMinute,
      isOwnGoal: (e.detail ?? '').toLowerCase().includes('own goal'),
      isPenalty: (e.detail ?? '').toLowerCase().includes('penalty'),
      teamId: e.teamId,
    }));

  return (
    <div className="flex flex-col">
      <ScoreHeader
        match={match}
        locale={typedLocale}
        competitionHref={competitionHref}
        goalScorers={goalScorers}
      />

      {hasEvents && (
        <section className="border-t border-border-subtle">
          <div className="border-b border-border-subtle bg-bg-surface-2 px-4 py-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-accent-green">
              {t('events')}
            </h3>
          </div>
          <EventTimeline events={events} homeTeamId={homeTeamId} locale={typedLocale} />
        </section>
      )}

      {hasStats && homeStatData && awayStatData && (
        <section className="border-t border-border-subtle">
          <div className="border-b border-border-subtle bg-bg-surface-2 px-4 py-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-accent-green">
              {t('stats')}
            </h3>
          </div>
          <StatsBars homeStats={homeStatData} awayStats={awayStatData} />
        </section>
      )}

      {/* View full match — uses <a> to bypass intercepting route */}
      <div className="border-t border-border-subtle p-4">
        <a
          href={`/${locale}/match/${fixtureId}`}
          className="flex items-center justify-center gap-2 rounded-lg bg-accent-azure/10 px-4 py-3 text-sm font-semibold text-accent-azure transition-colors hover:bg-accent-azure/20"
        >
          {t('viewFullMatch')}
          <ArrowRight className="size-4" />
        </a>
      </div>
    </div>
  );
}
