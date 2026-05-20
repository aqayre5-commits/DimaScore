'use client';

import { useTranslations } from 'next-intl';
import type { InjuryRow } from '@/lib/db/queries/injuries';

interface InjuriesTabProps {
  injuries: InjuryRow[];
}

export function InjuriesTab({ injuries }: InjuriesTabProps) {
  const t = useTranslations('leaguePage');

  if (injuries.length === 0) {
    return (
      <div className="rounded-lg border border-border-subtle bg-bg-surface px-4 py-8 text-center">
        <p className="text-sm text-text-tertiary">{t('injuriesEmpty')}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border-subtle bg-bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-subtle bg-bg-surface-2 text-xs font-medium uppercase text-text-tertiary">
            <th className="px-3 py-2 text-start">{t('colPlayer')}</th>
            <th className="px-3 py-2 text-start">{t('colTeam')}</th>
            <th className="px-3 py-2 text-start">{t('colInjury')}</th>
            <th className="hidden px-3 py-2 text-start sm:table-cell">{t('colReason')}</th>
            <th className="px-3 py-2 text-end">{t('colDate')}</th>
          </tr>
        </thead>
        <tbody>
          {injuries.map((row) => (
            <tr
              key={row.id}
              className="border-b border-border-subtle last:border-b-0 hover:bg-bg-surface-2/50"
            >
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  {row.playerPhoto ? (
                    <img
                      src={row.playerPhoto}
                      alt=""
                      className="size-6 rounded-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="size-6 rounded-full bg-bg-surface-2" />
                  )}
                  <span className="truncate font-medium text-text-primary">{row.playerName}</span>
                </div>
              </td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  {row.teamLogo ? (
                    <img
                      src={row.teamLogo}
                      alt=""
                      className="size-4 object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <div className="size-4 rounded bg-bg-surface-2" />
                  )}
                  <span className="truncate text-text-secondary">{row.teamName}</span>
                </div>
              </td>
              <td className="px-3 py-2 text-text-secondary">{row.type ?? '—'}</td>
              <td className="hidden px-3 py-2 text-text-tertiary sm:table-cell">
                {row.reason ?? '—'}
              </td>
              <td className="px-3 py-2 text-end tabular-nums text-text-tertiary">
                {row.date ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
