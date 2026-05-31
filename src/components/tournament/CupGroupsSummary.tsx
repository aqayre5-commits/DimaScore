import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { StandingRow } from '@/lib/db/queries';
import type { Locale } from '@/lib/i18n/config';
import Image from 'next/image';

interface CupGroupsSummaryProps {
  standings: StandingRow[];
  locale: Locale;
}

/**
 * Compact "Groups en bref" widget for cup right rails.
 * Shows top 2 teams per group with points.
 */
export function CupGroupsSummary({ standings, locale }: CupGroupsSummaryProps) {
  const t = useTranslations('tournament');

  // Group standings by group label
  const byGroup = new Map<string, StandingRow[]>();
  for (const row of standings) {
    const arr = byGroup.get(row.groupLabel) ?? [];
    arr.push(row);
    byGroup.set(row.groupLabel, arr);
  }

  const groups = [...byGroup.entries()].sort(([a], [b]) => a.localeCompare(b));

  if (groups.length === 0) return null;

  return (
    <div className="rounded-lg border border-border-subtle bg-bg-surface">
      <div className="border-b border-border-subtle px-4 py-2.5">
        <h3 className="label-caps">{t('standings')}</h3>
      </div>
      <div className="divide-y divide-border-subtle">
        {groups.map(([groupLabel, rows]) => {
          const top2 = rows.slice(0, 2);
          return (
            <div key={groupLabel} className="px-4 py-2">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
                {t('groupLabel', { label: groupLabel })}
              </p>
              {top2.map((row) => {
                const name =
                  row.team?.shortName[locale] ??
                  row.team?.name[locale] ??
                  row.team?.name['en'] ??
                  row.team?.code ??
                  '—';

                return (
                  <div key={row.teamId ?? row.rank} className="flex items-center gap-1.5 py-0.5">
                    <span className="w-4 text-[10px] tabular-nums text-text-tertiary">
                      {row.rank}
                    </span>
                    {row.team?.logoUrl ? (
                      <Image
                        src={row.team.logoUrl}
                        alt=""
                        className="size-3.5 object-contain"
                        width={12}
                        height={12}
                      />
                    ) : (
                      <div className="size-3.5 rounded bg-bg-surface-2" />
                    )}
                    {row.team?.slug ? (
                      <Link
                        href={`/${locale}/equipe/${row.team.slug}`}
                        className="min-w-0 flex-1 truncate text-xs text-text-primary hover:text-accent hover:underline"
                      >
                        {name}
                      </Link>
                    ) : (
                      <span className="min-w-0 flex-1 truncate text-xs text-text-primary">
                        {name}
                      </span>
                    )}
                    <span className="text-xs tabular-nums font-medium text-text-secondary">
                      {row.points}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
