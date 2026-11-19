'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { StandingRow } from '@/lib/db/queries';
import type { Locale } from '@/lib/i18n/config';
import { dedupeStandingsByTeam } from '@/lib/standings/dedupe';
import { translateStandingZoneLabel } from '@/lib/standings/zone-labels';
import { Flag } from '@/components/shared/Flag';
import { FormPills } from '@/components/shared/FormPills';

interface LeagueStandingsTabProps {
  standings: StandingRow[];
  locale: Locale;
  compact?: boolean;
  /** Screen-reader caption naming the table (competition + season). */
  caption?: string;
}

// Zone color from API-Football description field
function getZoneColor(description: string | null): string | null {
  if (!description) return null;
  const d = description.toLowerCase();
  if (d.includes('champions league')) return 'bg-emerald-500';
  if (d.includes('europa league') || d.includes('confederation')) return 'bg-amber-500';
  if (d.includes('conference')) return 'bg-sky-500';
  if (d.includes('relegation')) return 'bg-red-500';
  if (d.includes('promotion')) return 'bg-emerald-500';
  return null;
}

// Zone label for legend
interface ZoneLegendItem {
  color: string;
  label: string;
}

function buildLegend(standings: StandingRow[], locale: Locale): ZoneLegendItem[] {
  const seen = new Set<string>();
  const items: ZoneLegendItem[] = [];

  for (const row of standings) {
    if (!row.description) continue;
    const color = getZoneColor(row.description);
    if (!color || seen.has(row.description)) continue;
    seen.add(row.description);
    items.push({
      color,
      label: translateStandingZoneLabel(row.description, locale) ?? row.description,
    });
  }

  return items;
}

export function LeagueStandingsTab({
  standings,
  locale,
  compact,
  caption,
}: LeagueStandingsTabProps) {
  const t = useTranslations('leaguePage');

  // One row per team — a single-table league must not double a team that has variant group labels.
  const rows = dedupeStandingsByTeam(standings);
  const legend = buildLegend(rows, locale);

  return (
    <div className="space-y-3">
      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border-subtle bg-bg-surface">
        <table className="w-full text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr className="border-b border-border-subtle bg-bg-surface-3 text-xs font-medium uppercase text-text-tertiary">
              <th scope="col" className="w-8 px-1 py-2 text-center">
                <abbr title={t('colRankFull')} className="no-underline">
                  #
                </abbr>
              </th>
              <th scope="col" className="px-2 py-2 text-start">
                {t('team')}
              </th>
              <HeadCell short={t('colPlayed')} full={t('colPlayedFull')} className="w-8" />
              <HeadCell short={t('colWon')} full={t('colWonFull')} className="w-8" />
              <HeadCell short={t('colDrawn')} full={t('colDrawnFull')} className="w-8" />
              <HeadCell short={t('colLost')} full={t('colLostFull')} className="w-8" />
              <HeadCell short={t('colGoalDiff')} full={t('colGoalDiffFull')} className="w-10" />
              <HeadCell
                short={t('colGoals')}
                full={t('colGoalsFull')}
                className="hidden w-16 sm:table-cell"
              />
              <th scope="col" className="hidden w-16 px-1 py-2 text-center sm:table-cell">
                {t('colForm')}
              </th>
              <HeadCell
                short={t('colPoints')}
                full={t('colPointsFull')}
                className="w-10 font-semibold"
              />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const zoneColor = getZoneColor(row.description);
              const teamName =
                row.team?.name[locale] ?? row.team?.name['en'] ?? row.team?.code ?? '—';

              return (
                <tr
                  key={row.teamId ?? row.rank}
                  className="border-b border-border-subtle last:border-b-0 hover:bg-bg-surface-2/50"
                >
                  {/* Rank + zone marker */}
                  <td className="relative px-1 py-2 text-center tabular-nums text-text-secondary">
                    {zoneColor && (
                      <span
                        className={cn('absolute inset-y-0 left-0 w-[3px] rounded-full', zoneColor)}
                      />
                    )}
                    {row.rank}
                  </td>

                  {/* Team */}
                  <th scope="row" className="px-2 py-2 text-start font-normal">
                    <div className="flex items-center gap-2">
                      <Flag
                        countryCode={row.team?.countryCode}
                        logoUrl={row.team?.logoUrl}
                        isNational={row.team?.isNational}
                        size={20}
                        label={row.team?.code}
                      />
                      {row.team?.slug ? (
                        <Link
                          href={`/${locale}/equipe/${row.team.slug}`}
                          className="truncate text-sm font-medium text-text-primary hover:text-accent hover:underline"
                        >
                          {teamName}
                        </Link>
                      ) : (
                        <span className="truncate text-sm font-medium text-text-primary">
                          {teamName}
                        </span>
                      )}
                    </div>
                  </th>

                  {/* Stats */}
                  <td className="px-1 py-2 text-center tabular-nums text-text-secondary">
                    {row.played}
                  </td>
                  <td className="px-1 py-2 text-center tabular-nums text-text-secondary">
                    {row.won ?? 0}
                  </td>
                  <td className="px-1 py-2 text-center tabular-nums text-text-secondary">
                    {row.drawn ?? 0}
                  </td>
                  <td className="px-1 py-2 text-center tabular-nums text-text-secondary">
                    {row.lost ?? 0}
                  </td>
                  <td className="px-1 py-2 text-center tabular-nums font-medium text-text-primary">
                    {(row.goalDiff ?? 0) > 0 ? '+' : ''}
                    {row.goalDiff ?? 0}
                  </td>
                  <td className="hidden px-1 py-2 text-center tabular-nums text-text-secondary sm:table-cell">
                    {row.goalsFor ?? 0}:{row.goalsAgainst ?? 0}
                  </td>
                  <td className="hidden px-1 py-2 text-center sm:table-cell">
                    <FormPills
                      form={row.form}
                      formLabels={{ W: t('formWin'), D: t('formDraw'), L: t('formLoss') }}
                    />
                  </td>
                  <td className="px-1 py-2 text-center tabular-nums font-semibold text-text-primary">
                    {row.points}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Qualification legend */}
      {legend.length > 0 && (
        <div className="flex flex-wrap gap-4 px-1">
          {legend.map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span className={cn('inline-block size-2.5 rounded-sm', item.color)} />
              <span className="text-xs text-text-tertiary">{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HeadCell({ short, full, className }: { short: string; full: string; className: string }) {
  return (
    <th scope="col" className={cn('px-1 py-2 text-center tabular-nums', className)}>
      <abbr title={full} className="no-underline">
        {short}
      </abbr>
    </th>
  );
}
