import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { codeToFlag } from '@/lib/flags';
import { ShareButton } from '@/components/shared/ShareButton';
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
 * 13-column layout: zone · # · team · P · W · D · L · GF · GA · GD · Pts · Form
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
    <div
      id={`group-${groupLabel.toLowerCase()}`}
      className="rounded-lg border border-border-subtle bg-bg-surface"
    >
      {/* Group header */}
      <div className="border-b border-border-subtle px-4 py-2.5">
        <div className="flex items-center justify-between">
          <h3
            className={cn(
              'text-xs font-semibold',
              isMoroccoGroup ? 'text-accent-green' : 'text-text-primary',
            )}
          >
            {t('groupLabel', { label: groupLabel })}
            {isMoroccoGroup && <span className="ml-1">&#9733;</span>}
          </h3>
          <ShareButton
            title={t('groupLabel', { label: groupLabel })}
            hash={`group-${groupLabel.toLowerCase()}`}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border-subtle text-text-tertiary">
              <th scope="col" className="w-1" />
              <th scope="col" className="w-7 py-2 pl-4 text-center font-medium md:pl-6">
                #
              </th>
              <th scope="col" className="py-2 text-start font-medium">
                {t('team')}
              </th>
              <th scope="col" className="w-8 py-2 text-center font-medium">
                {t('colPlayed')}
              </th>
              <th scope="col" className="w-8 py-2 text-center font-medium">
                {t('colWon')}
              </th>
              <th scope="col" className="w-8 py-2 text-center font-medium">
                {t('colDrawn')}
              </th>
              <th scope="col" className="w-8 py-2 text-center font-medium">
                {t('colLost')}
              </th>
              <th scope="col" className="w-6 py-2 text-center font-medium">
                {t('colGoalsFor')}
              </th>
              <th scope="col" className="w-6 py-2 text-center font-medium">
                {t('colGoalsAgainst')}
              </th>
              <th scope="col" className="w-7 py-2 text-center font-medium">
                {t('colGoalDiff')}
              </th>
              <th scope="col" className="w-7 py-2 text-center font-semibold">
                {t('colPoints')}
              </th>
              <th scope="col" className="w-16 py-2 text-center font-medium">
                {t('colForm')}
              </th>
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
              const formChars = row.form
                ? row.form.split('').slice(-5)
                : ['\u2014', '\u2014', '\u2014', '\u2014', '\u2014'];

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
                  <td className="py-2 pl-4 pr-2 text-center tabular-nums text-text-secondary md:pl-6">
                    {row.rank}
                  </td>
                  <td className="py-2">
                    <span className="flex items-center gap-1.5">
                      {flag && <span className="shrink-0 text-sm leading-none">{flag}</span>}
                      {row.team?.slug ? (
                        <Link
                          href={`/${locale}/equipe/${row.team.slug}`}
                          className={cn(
                            'overflow-hidden text-ellipsis whitespace-nowrap hover:underline',
                            isMorocco
                              ? 'text-accent-green'
                              : 'text-text-secondary hover:text-accent',
                          )}
                        >
                          {teamName}
                        </Link>
                      ) : (
                        <span
                          className={cn(
                            'overflow-hidden text-ellipsis whitespace-nowrap',
                            isMorocco ? 'text-accent-green' : 'text-text-secondary',
                          )}
                        >
                          {teamName}
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="py-2 text-center tabular-nums text-text-secondary">
                    {row.played}
                  </td>
                  <td className="py-2 text-center tabular-nums text-text-secondary">
                    {row.won ?? 0}
                  </td>
                  <td className="py-2 text-center tabular-nums text-text-secondary">
                    {row.drawn ?? 0}
                  </td>
                  <td className="py-2 text-center tabular-nums text-text-secondary">
                    {row.lost ?? 0}
                  </td>
                  <td className="py-2 text-center tabular-nums text-text-secondary">
                    {row.goalsFor ?? 0}
                  </td>
                  <td className="py-2 text-center tabular-nums text-text-secondary">
                    {row.goalsAgainst ?? 0}
                  </td>
                  <td className="py-2 text-center tabular-nums text-text-secondary">
                    {row.goalDiff ?? 0}
                  </td>
                  <td
                    className={cn(
                      'py-2 text-center tabular-nums font-semibold',
                      isMorocco ? 'text-accent-green' : 'text-text-primary',
                    )}
                  >
                    {row.points}
                  </td>
                  <td className="py-2 text-center font-mono text-xs text-text-tertiary">
                    {formChars.join(' ')}
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
