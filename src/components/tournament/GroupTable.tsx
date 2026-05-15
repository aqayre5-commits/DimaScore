import { useTranslations } from 'next-intl';
import { codeToFlag } from '@/lib/flags';
import type { StandingRow } from '@/lib/db/queries';
import type { Locale } from '@/lib/i18n/config';
import { cn } from '@/lib/utils';

interface QualificationZone {
  positions: number[];
  type: string;
  color: string;
}

interface GroupTableProps {
  groupLabel: string;
  rows: StandingRow[];
  locale: Locale;
  isMoroccoGroup: boolean;
  qualificationZones: QualificationZone[];
}

/**
 * Single group standings table with qualification zone color bands.
 * Per competition-cup.md Section 7 Tab 2.
 * 10-column layout: zone · # · flag · team · P · W · D · L · GD · PTS
 */
export function GroupTable({
  groupLabel,
  rows,
  locale,
  isMoroccoGroup,
  qualificationZones,
}: GroupTableProps) {
  const t = useTranslations('tournament');

  function getZoneColor(rank: number): string | null {
    for (const zone of qualificationZones) {
      if (zone.positions.includes(rank)) return zone.color;
    }
    return null;
  }

  return (
    <div className="rounded-lg border border-border-subtle bg-bg-surface">
      {/* Group header */}
      <div className="border-b border-border-subtle px-4 py-2.5">
        <h3
          className={cn(
            'text-xs font-semibold uppercase tracking-wider',
            isMoroccoGroup ? 'text-accent-gold' : 'text-text-primary',
          )}
        >
          {t('groupLabel', { label: groupLabel })}
          {isMoroccoGroup && <span className="ml-1">&#9733;</span>}
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border-subtle text-text-tertiary">
              <th className="w-1" />
              <th className="w-7 py-2 text-center font-medium">#</th>
              <th className="py-2 text-start font-medium">{t('team')}</th>
              <th className="w-8 py-2 text-center font-medium">P</th>
              <th className="w-8 py-2 text-center font-medium">W</th>
              <th className="w-8 py-2 text-center font-medium">D</th>
              <th className="w-8 py-2 text-center font-medium">L</th>
              <th className="w-9 py-2 text-center font-medium">GD</th>
              <th className="w-10 py-2 text-center font-medium">Pts</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const teamName =
                row.team?.name[locale] ??
                row.team?.name['en'] ??
                row.team?.shortName[locale] ??
                row.team?.code ??
                '\u2014';
              const flag =
                row.team?.isNational && row.team.countryCode
                  ? codeToFlag(row.team.countryCode)
                  : null;
              const isMorocco = row.team?.code === 'MA';
              const zoneColor = getZoneColor(row.rank);

              return (
                <tr
                  key={row.teamId}
                  className={cn(
                    'border-b border-border-subtle last:border-b-0',
                    isMorocco && 'font-semibold',
                  )}
                >
                  {/* Zone color indicator */}
                  <td className="w-1 p-0">
                    {zoneColor && (
                      <div className="h-full w-1" style={{ backgroundColor: zoneColor }} />
                    )}
                  </td>
                  <td className="py-2 text-center tabular-nums text-text-tertiary">{row.rank}</td>
                  <td className="py-2">
                    <span className="flex items-center gap-1.5">
                      {flag && <span className="shrink-0 text-sm leading-none">{flag}</span>}
                      <span
                        className={cn(
                          'overflow-hidden text-ellipsis whitespace-nowrap',
                          isMorocco ? 'text-accent-gold' : 'text-text-secondary',
                        )}
                      >
                        {teamName}
                      </span>
                    </span>
                  </td>
                  <td className="py-2 text-center tabular-nums text-text-tertiary">{row.played}</td>
                  <td className="py-2 text-center tabular-nums text-text-tertiary">
                    {row.won ?? 0}
                  </td>
                  <td className="py-2 text-center tabular-nums text-text-tertiary">
                    {row.drawn ?? 0}
                  </td>
                  <td className="py-2 text-center tabular-nums text-text-tertiary">
                    {row.lost ?? 0}
                  </td>
                  <td className="py-2 text-center tabular-nums text-text-tertiary">
                    {row.goalDiff ?? 0}
                  </td>
                  <td
                    className={cn(
                      'py-2 text-center tabular-nums font-semibold',
                      isMorocco ? 'text-accent-gold' : 'text-text-primary',
                    )}
                  >
                    {row.points}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
