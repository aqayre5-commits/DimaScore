import Image from 'next/image';
import Link from 'next/link';
import type { Locale } from '@/lib/i18n/config';
import { formatMatchDate } from '@/lib/utils/date';
import type { WorldCupResult } from '@/lib/db/queries/team-world-cup';

// Self-contained content labels (same inline-locale pattern as the about/league content).
const HEADING: Record<Locale, string> = {
  en: 'World Cup history',
  fr: 'Historique en Coupe du Monde',
  ar: 'تاريخ كأس العالم',
};

const ROUND_LABELS: Record<string, Record<Locale, string>> = {
  groupStage: { en: 'Group stage', fr: 'Phase de groupes', ar: 'دور المجموعات' },
  roundOf16: { en: 'Round of 16', fr: 'Huitièmes de finale', ar: 'دور الـ16' },
  quarterFinals: { en: 'Quarter-finals', fr: 'Quarts de finale', ar: 'ربع النهائي' },
  semiFinals: { en: 'Semi-finals', fr: 'Demi-finales', ar: 'نصف النهائي' },
  thirdPlace: { en: 'Third place', fr: 'Match pour la 3e place', ar: 'تحديد المركز الثالث' },
  final: { en: 'Final', fr: 'Finale', ar: 'النهائي' },
};

function roundKey(round: string | null): string | null {
  if (!round) return null;
  if (round.startsWith('Group')) return 'groupStage';
  if (round.includes('Round of 16')) return 'roundOf16';
  if (round.includes('Quarter')) return 'quarterFinals';
  if (round.includes('Semi')) return 'semiFinals';
  if (round.includes('3rd Place') || round.toLowerCase().includes('third')) return 'thirdPlace';
  if (round.includes('Final')) return 'final';
  return null;
}

const RESULT_STYLE: Record<'W' | 'D' | 'L', string> = {
  W: 'bg-emerald-500/15 text-emerald-600',
  D: 'bg-amber-500/15 text-amber-600',
  L: 'bg-red-500/15 text-red-600',
};

/**
 * "World Cup history" — a national team's most recent World Cup results (score, opponent,
 * round, date). Rendered only for national teams that have World Cup results.
 */
export function WorldCupHistoryCard({
  results,
  locale,
}: {
  results: WorldCupResult[];
  locale: Locale;
}) {
  const name = (n: Record<string, string>) => n[locale] ?? n['en'] ?? Object.values(n)[0] ?? '';

  return (
    <section className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
      <div className="border-b border-border-subtle px-4 py-2.5">
        <h2 className="label-caps">{HEADING[locale]}</h2>
      </div>
      <ul>
        {results.map((r) => {
          const rk = roundKey(r.round);
          const roundLabel = rk ? ROUND_LABELS[rk][locale] : '';
          const isPen = r.statusCode === 'PEN' && r.home.pen != null && r.away.pen != null;
          return (
            <li key={r.fixtureId}>
              <Link
                href={`/${locale}/match/${r.fixtureId}`}
                className="flex items-center gap-2.5 border-b border-border-subtle px-4 py-2.5 transition-colors last:border-b-0 hover:bg-bg-surface-2"
              >
                <span
                  className={`flex size-5 shrink-0 items-center justify-center rounded text-[10px] font-bold ${RESULT_STYLE[r.result]}`}
                >
                  {r.result}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-sm">
                    {r.home.logoUrl && (
                      <Image
                        src={r.home.logoUrl}
                        alt=""
                        width={16}
                        height={16}
                        className="size-4 shrink-0 object-contain"
                      />
                    )}
                    <span className="truncate text-text-primary">{name(r.home.name)}</span>
                    <span className="shrink-0 font-bold tabular-nums text-text-primary">
                      {r.home.score ?? '-'}–{r.away.score ?? '-'}
                    </span>
                    <span className="truncate text-text-primary">{name(r.away.name)}</span>
                    {r.away.logoUrl && (
                      <Image
                        src={r.away.logoUrl}
                        alt=""
                        width={16}
                        height={16}
                        className="size-4 shrink-0 object-contain"
                      />
                    )}
                    {isPen && (
                      <span className="shrink-0 text-[11px] text-text-tertiary">
                        ({r.home.pen}-{r.away.pen} pen)
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-[11px] text-text-tertiary">
                    {roundLabel ? `${roundLabel} · ` : ''}
                    {formatMatchDate(r.kickoffAt, locale, {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
