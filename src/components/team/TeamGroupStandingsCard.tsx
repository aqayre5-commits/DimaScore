'use client';

import { useTranslations } from 'next-intl';
import { getMatchState } from '@/lib/match-status';
import { TeamStandingsSection } from './TeamStandingsSection';
import type {
  TeamCompetitionStandings,
  FixtureWithCompetition,
  TeamDetail,
} from '@/lib/db/queries/team';
import type { Locale } from '@/lib/i18n/config';

interface TeamGroupStandingsCardProps {
  team: TeamDetail;
  fixtures: FixtureWithCompetition[];
  allStandings: TeamCompetitionStandings;
  locale: Locale;
  /** Hash link to the full Standings tab. */
  standingsHref: string;
}

/**
 * Matches-tab card: the standings of the team's nearest upcoming/live tournament,
 * collapsed to the team's own group (e.g. Morocco → World Cup 2026 · Group C).
 * Renders nothing when the team has no upcoming/live fixture in a competition that
 * has standings.
 */
export function TeamGroupStandingsCard({
  team,
  fixtures,
  allStandings,
  locale,
  standingsHref,
}: TeamGroupStandingsCardProps) {
  const t = useTranslations('teamPage');

  const compIds = new Set(allStandings.competitions.map((c) => c.id));
  const candidate = [...fixtures]
    .filter((f) => {
      const s = getMatchState(f.statusCode, f.kickoffAt);
      return s === 'upcoming' || s === 'live';
    })
    .sort((a, b) => a.kickoffAt.getTime() - b.kickoffAt.getTime())
    .find((f) => f.competition?.id != null && compIds.has(f.competition.id));

  if (!candidate?.competition) return null;
  const comp = allStandings.competitions.find((c) => c.id === candidate.competition!.id);
  if (!comp) return null;

  const season = allStandings.seasons.find(
    (s) => (allStandings.standingsByCompSeason[`${comp.id}-${s}`]?.length ?? 0) > 0,
  );
  if (season == null) return null;
  const rows = allStandings.standingsByCompSeason[`${comp.id}-${season}`] ?? [];

  const teamGroup = rows.find((r) => r.teamId === team.id)?.groupLabel ?? null;
  const groupRows = teamGroup ? rows.filter((r) => r.groupLabel === teamGroup) : rows;
  if (groupRows.length === 0) return null;

  const compName = comp.name[locale] ?? comp.name['en'] ?? '';

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
        <h3 className="label-caps truncate">
          {compName}
          {teamGroup ? ` · ${t('group')} ${teamGroup}` : ''}
        </h3>
        <a
          href={standingsHref}
          className="shrink-0 text-xs font-medium text-accent-azure hover:underline"
        >
          {t('viewFullStandings')}
        </a>
      </div>
      <TeamStandingsSection standings={groupRows} highlightTeamId={team.id} locale={locale} />
    </div>
  );
}
