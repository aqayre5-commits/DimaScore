import { useTranslations } from 'next-intl';
import { formatMonthYear } from '@/lib/utils/date';
import type { CareerEntry } from '@/lib/db/queries/coach';
import Image from 'next/image';

interface CoachCareerTableProps {
  career: CareerEntry[];
}

export function CoachCareerTable({ career }: CoachCareerTableProps) {
  const t = useTranslations('coachPage');

  if (career.length === 0) {
    return (
      <div className="rounded-xl border border-border-subtle bg-bg-surface p-6">
        <p className="text-sm text-text-tertiary">{t('noCareerData')}</p>
      </div>
    );
  }

  // Sort career: current (end=null) first, then by start date descending
  const sorted = [...career].sort((a, b) => {
    if (!a.end && b.end) return -1;
    if (a.end && !b.end) return 1;
    const aStart = a.start ? new Date(a.start).getTime() : 0;
    const bStart = b.start ? new Date(b.start).getTime() : 0;
    return bStart - aStart;
  });

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface">
      <div className="px-4 py-3">
        <h2 className="text-sm font-semibold text-text-primary">{t('careerHistory')}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-t border-border-subtle text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">
              <th className="px-4 py-2 text-left">{t('team')}</th>
              <th className="px-4 py-2 text-left">{t('from')}</th>
              <th className="px-4 py-2 text-left">{t('to')}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((entry, i) => (
              <tr
                key={`${entry.team.id}-${entry.start}-${i}`}
                className="border-t border-border-subtle transition-colors hover:bg-bg-surface-2"
              >
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    {entry.team.logo ? (
                      <Image
                        src={entry.team.logo}
                        alt=""
                        className="size-5 shrink-0 object-contain"
                        width={20}
                        height={20}
                      />
                    ) : (
                      <div className="flex size-5 items-center justify-center rounded bg-bg-surface-2 text-[8px] font-bold text-text-tertiary">
                        ?
                      </div>
                    )}
                    <span className="font-medium text-text-primary">{entry.team.name}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-text-secondary">{formatMonthYear(entry.start)}</td>
                <td className="px-4 py-2.5 text-text-secondary">
                  {entry.end ? formatMonthYear(entry.end) : t('present')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
