import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { StandingRow } from '@/lib/db/queries';
import type { Locale } from '@/lib/i18n/config';
import Image from 'next/image';

interface TeamStandingsSectionProps {
  standings: StandingRow[];
  highlightTeamId: number;
  locale: Locale;
}

function resolveTeamName(team: StandingRow['team'], locale: Locale): string {
  if (!team) return '\u2014';
  return (
    team.shortName[locale] ??
    team.shortName['en'] ??
    team.name[locale] ??
    team.name['en'] ??
    team.code ??
    '\u2014'
  );
}

export function TeamStandingsSection({
  standings,
  highlightTeamId,
  locale,
}: TeamStandingsSectionProps) {
  const t = useTranslations('teamPage');

  if (standings.length === 0) {
    return (
      <div className="rounded-xl border border-border-subtle bg-bg-surface px-4 py-8 text-center">
        <p className="text-sm text-text-tertiary">{t('noStandingsData')}</p>
      </div>
    );
  }

  // Group by groupLabel (for cup competitions with multiple groups)
  const groups = new Map<string, StandingRow[]>();
  for (const row of standings) {
    const label = row.groupLabel || t('league');
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(row);
  }

  return (
    <div className="space-y-3">
      {[...groups.entries()].map(([label, rows]) => (
        <div
          key={label}
          className="rounded-xl border border-border-subtle bg-bg-surface overflow-hidden"
        >
          {groups.size > 1 && (
            <div className="border-b border-border-subtle px-4 py-2.5">
              <h3 className="label-caps">{label}</h3>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-border-subtle text-[11px] text-text-tertiary">
                  <th className="w-8 px-2 py-2 text-center font-medium">#</th>
                  <th className="px-2 py-2 text-start font-medium">{t('teamCol')}</th>
                  <th className="w-8 px-1.5 py-2 text-center font-medium">{t('played')}</th>
                  <th className="w-8 px-1.5 py-2 text-center font-medium">{t('won')}</th>
                  <th className="w-8 px-1.5 py-2 text-center font-medium">{t('drawn')}</th>
                  <th className="w-8 px-1.5 py-2 text-center font-medium">{t('lost')}</th>
                  <th className="w-8 px-1.5 py-2 text-center font-medium">{t('goalDiff')}</th>
                  <th className="w-10 px-2 py-2 text-center font-medium">{t('points')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/50">
                {rows.map((row) => {
                  const isHighlighted = row.teamId === highlightTeamId;
                  return (
                    <tr
                      key={`${row.groupLabel}-${row.teamId}`}
                      className={cn(
                        'transition-colors',
                        isHighlighted
                          ? 'bg-accent-azure/[0.08] font-semibold'
                          : 'hover:bg-bg-surface-2',
                      )}
                    >
                      <td className="px-2 py-2 text-center tabular-nums text-text-tertiary">
                        {row.rank}
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-2">
                          {row.team?.logoUrl && (
                            <Image
                              src={row.team.logoUrl}
                              alt=""
                              width={18}
                              height={18}
                              className="size-[18px] shrink-0 object-contain"
                            />
                          )}
                          <span
                            className={cn(
                              'truncate text-text-primary',
                              isHighlighted && 'text-accent-azure font-semibold',
                            )}
                          >
                            {resolveTeamName(row.team, locale)}
                          </span>
                        </div>
                      </td>
                      <td className="px-1.5 py-2 text-center tabular-nums text-text-secondary">
                        {row.played}
                      </td>
                      <td className="px-1.5 py-2 text-center tabular-nums text-text-secondary">
                        {row.won ?? 0}
                      </td>
                      <td className="px-1.5 py-2 text-center tabular-nums text-text-secondary">
                        {row.drawn ?? 0}
                      </td>
                      <td className="px-1.5 py-2 text-center tabular-nums text-text-secondary">
                        {row.lost ?? 0}
                      </td>
                      <td className="px-1.5 py-2 text-center tabular-nums text-text-secondary">
                        {row.goalDiff ?? 0}
                      </td>
                      <td className="px-2 py-2 text-center tabular-nums font-semibold text-text-primary">
                        {row.points}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
