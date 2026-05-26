import Link from 'next/link';
import type { CompetitionTeamTile } from '@/lib/db/queries/team';
import type { Locale } from '@/lib/i18n/config';

interface TeamCompetitionTeamsProps {
  teams: CompetitionTeamTile[];
  competitionName: string;
  highlightTeamId: number;
  locale: Locale;
}

function abbreviate(name: string): string {
  if (name.length <= 12) return name;
  const words = name.split(/\s+/);
  if (words.length >= 2) {
    // "Manchester City" → "Man City", "Nottm Forest" stays
    const first = words[0].length > 5 ? words[0].slice(0, 3) : words[0];
    return `${first} ${words.slice(1).join(' ')}`.slice(0, 12);
  }
  return name.slice(0, 10);
}

export function TeamCompetitionTeams({
  teams,
  competitionName,
  highlightTeamId,
  locale,
}: TeamCompetitionTeamsProps) {
  if (teams.length === 0) return null;

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface overflow-hidden">
      <div className="border-b border-border-subtle px-4 py-3">
        <h3 className="label-caps">{competitionName}</h3>
      </div>
      <div className="grid grid-cols-2 gap-px bg-border-subtle">
        {teams.map((team) => {
          const isHighlighted = team.id === highlightTeamId;
          const name =
            team.shortName[locale] ??
            team.shortName['en'] ??
            team.name[locale] ??
            team.name['en'] ??
            '';
          const displayName = abbreviate(name);

          return (
            <Link
              key={team.id}
              href={`/${locale}/equipe/${team.slug}`}
              className={`flex flex-col items-center gap-1.5 bg-bg-surface px-2 py-3.5 transition-colors hover:bg-bg-surface-2 ${
                isHighlighted ? 'ring-2 ring-inset ring-accent-green/60 bg-accent-green/[0.06]' : ''
              }`}
            >
              {team.logoUrl ? (
                <img src={team.logoUrl} alt="" className="size-10 object-contain" loading="lazy" />
              ) : (
                <div className="flex size-10 items-center justify-center rounded-full bg-bg-surface-2 text-[11px] font-bold text-text-tertiary">
                  {(name[0] ?? '?').toUpperCase()}
                </div>
              )}
              <span className="text-[11px] font-medium text-text-secondary text-center leading-tight truncate w-full">
                {displayName}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
