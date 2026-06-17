import Link from 'next/link';
import Image from 'next/image';
import type { StandingRow } from '@/lib/db/queries';
import type { Locale } from '@/lib/i18n/config';
import { dedupeStandingsByTeam } from '@/lib/standings/dedupe';

interface LeagueTeamsTabProps {
  standings: StandingRow[];
  locale: Locale;
}

function resolveTeamName(team: StandingRow['team'], locale: Locale): string {
  if (!team) return '—';
  return team.name[locale] ?? team.name['en'] ?? team.shortName[locale] ?? team.code ?? '—';
}

function buildTeamHref(team: StandingRow['team'], locale: Locale): string {
  if (!team) return '#';
  return `/${locale}/equipe/${team.slug}`;
}

export function LeagueTeamsTab({ standings, locale }: LeagueTeamsTabProps) {
  // One card per team — standings can carry duplicate rows per team under variant group labels.
  const sorted = dedupeStandingsByTeam(standings).sort((a, b) => {
    const nameA = resolveTeamName(a.team, locale);
    const nameB = resolveTeamName(b.team, locale);
    return nameA.localeCompare(nameB);
  });

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {sorted.map((row) => {
        const name = resolveTeamName(row.team, locale);
        const logo = row.team?.logoUrl;

        return (
          <Link
            key={row.teamId ?? row.rank}
            href={buildTeamHref(row.team, locale)}
            className="group relative flex flex-col items-center gap-2 rounded-xl border border-border-subtle bg-bg-surface p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            {/* Position badge */}
            <span className="absolute right-2 top-2 text-xs font-semibold text-text-tertiary">
              #{row.rank}
            </span>

            {/* Team crest */}
            {logo ? (
              <Image
                src={logo}
                alt={name}
                width={56}
                height={56}
                className="size-14 object-contain"
              />
            ) : (
              <div className="flex size-14 items-center justify-center rounded-full bg-bg-surface-2 text-lg font-bold text-text-tertiary">
                {name.slice(0, 2).toUpperCase()}
              </div>
            )}

            {/* Team name */}
            <div className="text-center text-sm font-medium text-text-primary">{name}</div>

            {/* Stats */}
            <div className="flex flex-col items-center gap-0.5 text-xs text-text-tertiary">
              <span>
                <b className="text-text-secondary">{row.points}</b> pts
              </span>
              <span>
                {row.won ?? 0}W {row.drawn ?? 0}D {row.lost ?? 0}L
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
