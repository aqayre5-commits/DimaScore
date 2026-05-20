import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { StandingRow } from '@/lib/db/queries';
import type { Locale } from '@/lib/i18n/config';

interface TeamStandingsSectionProps {
  standings: StandingRow[];
  highlightTeamId: number;
  locale: Locale;
}

function resolveTeamName(team: StandingRow['team'], locale: Locale): string {
  if (!team) return '—';
  return (
    team.name[locale] ??
    team.name['en'] ??
    team.shortName[locale] ??
    team.shortName['en'] ??
    team.code ??
    '—'
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
      <div className="rounded-lg border border-border-subtle bg-bg-surface px-4 py-8 text-center">
        <p className="text-sm text-text-tertiary">{t('noStandingsData')}</p>
      </div>
    );
  }

  // Group by groupLabel (for cup competitions with multiple groups)
  const groups = new Map<string, StandingRow[]>();
  for (const row of standings) {
    const label = row.groupLabel || 'League';
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(row);
  }

  return (
    <div className="space-y-4">
      {[...groups.entries()].map(([label, rows]) => (
        <div
          key={label}
          className="rounded-lg border border-border-subtle bg-bg-surface overflow-hidden"
        >
          {groups.size > 1 && (
            <div className="border-b border-border-subtle px-4 py-2">
              <h3 className="label-caps">{label}</h3>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-xs text-text-tertiary">
                  <th className="px-3 py-2 text-start font-medium">#</th>
                  <th className="px-3 py-2 text-start font-medium">{t('teamCol')}</th>
                  <th className="px-3 py-2 text-center font-medium">{t('played')}</th>
                  <th className="px-3 py-2 text-center font-medium">{t('won')}</th>
                  <th className="px-3 py-2 text-center font-medium">{t('drawn')}</th>
                  <th className="px-3 py-2 text-center font-medium">{t('lost')}</th>
                  <th className="px-3 py-2 text-center font-medium">{t('goalDiff')}</th>
                  <th className="px-3 py-2 text-center font-medium">{t('points')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {rows.map((row) => {
                  const isHighlighted = row.teamId === highlightTeamId;
                  return (
                    <tr
                      key={`${row.groupLabel}-${row.teamId}`}
                      className={cn(
                        'transition-colors',
                        isHighlighted
                          ? 'bg-accent-green/10 font-semibold'
                          : 'hover:bg-bg-surface-2',
                      )}
                    >
                      <td className="px-3 py-2 tabular-nums text-text-secondary">{row.rank}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {row.team?.logoUrl && (
                            <img
                              src={row.team.logoUrl}
                              alt=""
                              width={20}
                              height={20}
                              className="size-5 object-contain"
                              loading="lazy"
                            />
                          )}
                          <span
                            className={cn('text-text-primary', isHighlighted && 'font-semibold')}
                          >
                            {resolveTeamName(row.team, locale)}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center tabular-nums">{row.played}</td>
                      <td className="px-3 py-2 text-center tabular-nums">{row.won ?? 0}</td>
                      <td className="px-3 py-2 text-center tabular-nums">{row.drawn ?? 0}</td>
                      <td className="px-3 py-2 text-center tabular-nums">{row.lost ?? 0}</td>
                      <td className="px-3 py-2 text-center tabular-nums">{row.goalDiff ?? 0}</td>
                      <td className="px-3 py-2 text-center tabular-nums font-semibold">
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
