import { useTranslations } from 'next-intl';
import { codeToFlag } from '@/lib/flags';
import type { HistoricalWinner } from '@/lib/constants/tournament-metadata';
import type { Locale } from '@/lib/i18n/config';

interface HistoricalWinnersProps {
  winners: HistoricalWinner[];
  /** Map of 2-letter team code → localized display name */
  teamNames: Record<string, string>;
  locale: Locale;
}

/** English ordinal suffix: 1st, 2nd, 3rd, 4th, 11th, 12th, 13th, 21st... */
function ordinalEN(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n}st`;
  if (mod10 === 2 && mod100 !== 12) return `${n}nd`;
  if (mod10 === 3 && mod100 !== 13) return `${n}rd`;
  return `${n}th`;
}

/** French ordinal: 1er, 2e, 3e... */
function ordinalFR(n: number): string {
  return n === 1 ? '1er' : `${n}e`;
}

/** Locale-aware ordinal string */
function formatOrdinal(n: number, locale: Locale): string {
  if (locale === 'fr') return ordinalFR(n);
  if (locale === 'ar') return `${n}`;
  return ordinalEN(n);
}

/**
 * Overview Block 3 — Historical winners (Titres).
 * Per competition-cup.md Section 7 Tab 1 Block 3.
 * Shows past 5 editions from tournament metadata.
 */
export function HistoricalWinners({ winners, teamNames, locale }: HistoricalWinnersProps) {
  const t = useTranslations('tournament');

  if (winners.length === 0) return null;

  return (
    <div className="rounded-lg border border-border-subtle bg-bg-surface">
      <div className="border-b border-border-subtle px-4 py-2.5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-primary">
          {t('titles')}
        </h3>
      </div>

      <div className="divide-y divide-border-subtle px-4">
        {winners.map((w) => (
          <div key={w.year} className="flex items-center gap-3 py-2.5 text-sm">
            <span className="w-10 shrink-0 tabular-nums text-text-tertiary">{w.year}</span>
            <span className="shrink-0">🏆</span>
            <span className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
              <span className="shrink-0 text-base leading-none">{codeToFlag(w.teamCode)}</span>
              <span className="overflow-hidden text-ellipsis whitespace-nowrap text-text-primary">
                {teamNames[w.teamCode] ?? w.teamCode}
              </span>
            </span>
            <span className="shrink-0 text-xs text-text-tertiary">
              {t('titleOrdinal', { ordinal: formatOrdinal(w.titleNumber, locale) })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
