import { useTranslations } from 'next-intl';
import { codeToFlag } from '@/lib/flags';
import type { BestThirdRow } from '@/lib/standings/best-third';
import type { Locale } from '@/lib/i18n/config';
import { cn } from '@/lib/utils';

interface BestThirdTableProps {
  rows: BestThirdRow[];
  locale: Locale;
  qualifiedCount: number;
}

/**
 * 12-row cross-group table for best third-placed teams.
 * Rows 1–qualifiedCount get green left-border (advance to knockout).
 */
export function BestThirdTable({ rows, locale, qualifiedCount }: BestThirdTableProps) {
  const t = useTranslations('tournament');

  return (
    <div className="overflow-x-auto rounded-lg border border-border-subtle bg-bg-surface">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border-subtle text-text-tertiary">
            <th scope="col" className="w-1" />
            <th scope="col" className="w-7 py-2 text-center font-medium">
              {t('bestThirdRankCol')}
            </th>
            <th scope="col" className="w-9 py-2 text-center font-medium">
              {t('bestThirdGroupCol')}
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
            <th scope="col" className="w-8 py-2 text-center font-medium">
              {t('colGoalsFor')}
            </th>
            <th scope="col" className="w-8 py-2 text-center font-medium">
              {t('colGoalsAgainst')}
            </th>
            <th scope="col" className="w-9 py-2 text-center font-medium">
              {t('colGoalDiff')}
            </th>
            <th scope="col" className="w-10 py-2 text-center font-semibold">
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
            const isQualified = row.crossGroupRank <= qualifiedCount;
            const formChars = row.form
              ? row.form.split('').slice(-5)
              : ['\u2014', '\u2014', '\u2014', '\u2014', '\u2014'];

            return (
              <tr
                key={row.teamId ?? row.group}
                className={cn(
                  'border-b border-border-subtle last:border-b-0',
                  isMorocco && 'font-semibold',
                )}
              >
                {/* Qualification zone indicator */}
                <td className="w-1 p-0">
                  <div
                    className="h-full w-1"
                    style={{
                      backgroundColor: isQualified
                        ? 'var(--accent-emerald)'
                        : 'var(--accent-crimson)',
                    }}
                  />
                </td>
                <td className="py-2 text-center tabular-nums text-text-tertiary">
                  {row.crossGroupRank}
                </td>
                <td className="py-2 text-center text-text-tertiary">{row.group}</td>
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
                <td className="py-2 text-center tabular-nums text-text-tertiary">{row.won ?? 0}</td>
                <td className="py-2 text-center tabular-nums text-text-tertiary">
                  {row.drawn ?? 0}
                </td>
                <td className="py-2 text-center tabular-nums text-text-tertiary">
                  {row.lost ?? 0}
                </td>
                <td className="py-2 text-center tabular-nums text-text-tertiary">
                  {row.goalsFor ?? 0}
                </td>
                <td className="py-2 text-center tabular-nums text-text-tertiary">
                  {row.goalsAgainst ?? 0}
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
                <td className="py-2 text-center font-mono text-[10px] text-text-tertiary">
                  {formChars.join(' ')}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
