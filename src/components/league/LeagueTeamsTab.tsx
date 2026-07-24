import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { StandingRow } from '@/lib/db/queries';
import type { TeamSnapshot } from '@/lib/db/queries-hydrate';
import type { Locale } from '@/lib/i18n/config';
import { Flag } from '@/components/shared/Flag';

interface LeagueTeamsTabProps {
  /** Participants for the season — derived from fixtures, so this is populated pre-season too. */
  teams: TeamSnapshot[];
  /** Standings for the same season, used only for the optional rank/points/W-D-L overlay. */
  standings: StandingRow[];
  locale: Locale;
}

function resolveTeamName(team: TeamSnapshot, locale: Locale): string {
  return team.name[locale] ?? team.name['en'] ?? team.shortName[locale] ?? team.code ?? '—';
}

export function LeagueTeamsTab({ teams, standings, locale }: LeagueTeamsTabProps) {
  const t = useTranslations('leaguePage');

  // Standings are an *overlay*, not the source of team identity — pre-season they're empty and the
  // grid still renders every participant (crest + name) without rank/points.
  const statsByTeamId = new Map(
    standings.filter((s) => s.teamId != null).map((s) => [s.teamId as number, s]),
  );

  if (teams.length === 0) {
    return (
      <div className="rounded-xl border border-border-subtle bg-bg-surface p-8 text-center text-sm text-text-tertiary">
        {t('comingSoon')}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {teams.map((team) => {
        const name = resolveTeamName(team, locale);
        const stats = statsByTeamId.get(team.id);

        return (
          <Link
            key={team.id}
            href={`/${locale}/equipe/${team.slug}`}
            className="group relative flex flex-col items-center gap-2 rounded-xl border border-border-subtle bg-bg-surface p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            {/* Position badge — only once the season has a standings table */}
            {stats?.rank != null && (
              <span className="absolute end-2 top-2 text-xs font-semibold text-text-tertiary">
                #{stats.rank}
              </span>
            )}

            <Flag
              countryCode={team.countryCode}
              logoUrl={team.logoUrl}
              isNational={team.isNational}
              size={56}
              label={name}
            />

            <div className="text-center text-sm font-medium text-text-primary">{name}</div>

            {/* Stats — omitted pre-season */}
            {stats && (
              <div className="flex flex-col items-center gap-0.5 text-xs text-text-tertiary">
                <span>
                  <b className="text-text-secondary">{stats.points}</b> pts
                </span>
                <span>
                  {stats.won ?? 0}W {stats.drawn ?? 0}D {stats.lost ?? 0}L
                </span>
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
