import { useTranslations } from 'next-intl';
import { KnockoutMatchCard } from './KnockoutMatchCard';
import type { FixtureWithTeams } from '@/lib/db/queries';
import type { Locale } from '@/lib/i18n/config';

interface KnockoutCardListProps {
  fixtures: FixtureWithTeams[];
  locale: Locale;
}

/** Normalize an API round name to a stable key (3rd-place is checked before "final"). */
function roundKey(round: string): string {
  const r = round.toLowerCase();
  if (r.includes('round of 32') || r.includes('16th')) return 'r32';
  if (r.includes('round of 16') || r.includes('8th')) return 'r16';
  if (r.includes('quarter')) return 'qf';
  if (r.includes('semi')) return 'sf';
  if (r.includes('3rd') || r.includes('third')) return 'third';
  if (r.includes('final')) return 'final';
  return 'other';
}

const ROUND_ORDER: Record<string, number> = {
  r32: 0,
  r16: 1,
  qf: 2,
  sf: 3,
  third: 4,
  final: 5,
  other: 6,
};

const ROUND_LABELS: Record<string, Record<Locale, string>> = {
  r32: { en: 'Round of 32', fr: 'Seizièmes de finale', ar: 'دور الـ32' },
  r16: { en: 'Round of 16', fr: 'Huitièmes de finale', ar: 'دور الـ16' },
  qf: { en: 'Quarter-finals', fr: 'Quarts de finale', ar: 'ربع النهائي' },
  sf: { en: 'Semi-finals', fr: 'Demi-finales', ar: 'نصف النهائي' },
  third: { en: 'Third place', fr: 'Match pour la 3e place', ar: 'مباراة المركز الثالث' },
  final: { en: 'Final', fr: 'Finale', ar: 'النهائي' },
};

/**
 * Knockout round-grouped list of rich match cards. Same layout on desktop and mobile —
 * one column on mobile, two on desktop. Round headers (Round of 16 → … → Final) at the top.
 */
export function KnockoutCardList({ fixtures, locale }: KnockoutCardListProps) {
  const t = useTranslations('tournament');

  const byRound = new Map<string, FixtureWithTeams[]>();
  for (const f of fixtures) {
    const key = roundKey(f.round ?? '');
    const list = byRound.get(key) ?? [];
    list.push(f);
    byRound.set(key, list);
  }
  for (const list of byRound.values()) {
    list.sort((a, b) => a.kickoffAt.getTime() - b.kickoffAt.getTime());
  }
  const orderedKeys = [...byRound.keys()].sort(
    (a, b) => (ROUND_ORDER[a] ?? 9) - (ROUND_ORDER[b] ?? 9),
  );

  if (fixtures.length === 0) {
    return (
      <div className="rounded-xl border border-border-subtle bg-bg-surface px-4 py-8 text-center">
        <p className="text-sm text-text-tertiary">{t('noMatches')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {orderedKeys.map((key) => {
        const label = ROUND_LABELS[key]?.[locale] ?? byRound.get(key)![0].round ?? '';
        return (
          <section key={key}>
            <h2 className="mb-2.5 px-1 text-sm font-bold uppercase tracking-wide text-text-tertiary">
              {label}
            </h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {byRound.get(key)!.map((f) => (
                <KnockoutMatchCard key={f.id} fixture={f} locale={locale} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
