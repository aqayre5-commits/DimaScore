'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { StandingRow } from '@/lib/db/queries';
import type { Locale } from '@/lib/i18n/config';

interface LeagueStandingsTabProps {
  standings: StandingRow[];
  locale: Locale;
  compact?: boolean;
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

function buildLegend(standings: StandingRow[]): ZoneLegendItem[] {
  const seen = new Set<string>();
  const items: ZoneLegendItem[] = [];

  for (const row of standings) {
    if (!row.description) continue;
    const color = getZoneColor(row.description);
    if (!color || seen.has(row.description)) continue;
    seen.add(row.description);
    items.push({ color, label: row.description });
  }

  return items;
}

function FormPills({
  form,
  formLabels,
}: {
  form: string | null;
  formLabels: { W: string; D: string; L: string };
}) {
  if (!form) return null;

  const chars = form.split('').slice(-5);

  return (
    <div className="flex gap-0.5">
      {chars.map((c, i) => (
        <span
          key={i}
          className={cn(
            'inline-block size-3 rounded-sm',
            c === 'W' && 'bg-emerald-500',
            c === 'D' && 'bg-zinc-500',
            c === 'L' && 'bg-red-500',
          )}
          title={c === 'W' ? formLabels.W : c === 'D' ? formLabels.D : formLabels.L}
        />
      ))}
    </div>
  );
}

export function LeagueStandingsTab({ standings, locale, compact }: LeagueStandingsTabProps) {
  const t = useTranslations('leaguePage');

  const legend = buildLegend(standings);

  return (
    <div className="space-y-3">
      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border-subtle bg-bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle bg-bg-surface-3 text-xs font-medium uppercase text-text-tertiary">
              <th className="w-8 px-1 py-2 text-center">#</th>
              <th className="px-2 py-2 text-start">{t('team')}</th>
              <th className="w-8 px-1 py-2 text-center tabular-nums">{t('colPlayed')}</th>
              <th className="w-8 px-1 py-2 text-center tabular-nums">{t('colWon')}</th>
              <th className="w-8 px-1 py-2 text-center tabular-nums">{t('colDrawn')}</th>
              <th className="w-8 px-1 py-2 text-center tabular-nums">{t('colLost')}</th>
              <th className="w-10 px-1 py-2 text-center tabular-nums">{t('colGoalDiff')}</th>
              <th className="w-16 px-1 py-2 text-center tabular-nums">{t('colGoals')}</th>
              <th className="hidden w-16 px-1 py-2 text-center sm:table-cell">{t('colForm')}</th>
              <th className="w-10 px-1 py-2 text-center font-semibold tabular-nums">
                {t('colPoints')}
              </th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row) => {
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
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-2">
                      {row.team?.logoUrl ? (
                        <img
                          src={row.team.logoUrl}
                          alt=""
                          className="size-5 object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <div className="size-5 rounded bg-bg-surface-2" />
                      )}
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
                  </td>

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
                  <td className="px-1 py-2 text-center tabular-nums text-text-secondary">
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
