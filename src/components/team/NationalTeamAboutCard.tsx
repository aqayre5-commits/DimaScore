import { Trophy } from 'lucide-react';
import type { Locale } from '@/lib/i18n/config';
import type { NationalTeamContent } from '@/lib/constants/national-team-content';

const LABELS: Record<Locale, { about: string; honours: string }> = {
  en: { about: 'About', honours: 'Honours' },
  fr: { about: 'À propos', honours: 'Palmarès' },
  ar: { about: 'نبذة', honours: 'الألقاب' },
};

/**
 * Curated "About + Honours" for a national team. Rendered only when curated content exists
 * (see national-team-content.ts) — keeps facts accurate rather than derived from partial data.
 */
export function NationalTeamAboutCard({
  content,
  locale,
}: {
  content: NationalTeamContent;
  locale: Locale;
}) {
  const l = LABELS[locale];
  return (
    <section className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
      <div className="border-b border-border-subtle px-4 py-2.5">
        <h2 className="label-caps">{l.about}</h2>
      </div>
      <p className="px-4 py-3 text-sm leading-relaxed text-text-secondary">{content.about}</p>

      {content.honours.length > 0 && (
        <>
          <div className="border-y border-border-subtle px-4 py-2.5">
            <h2 className="label-caps">{l.honours}</h2>
          </div>
          <ul>
            {content.honours.map((h) => (
              <li
                key={h.competition}
                className="flex items-center gap-2.5 border-b border-border-subtle px-4 py-2.5 last:border-b-0"
              >
                <Trophy className="size-4 shrink-0 text-amber-500" />
                <div className="min-w-0 text-sm">
                  <span className="font-medium text-text-primary">{h.competition}</span>
                  <span className="text-text-tertiary"> · {h.detail}</span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
