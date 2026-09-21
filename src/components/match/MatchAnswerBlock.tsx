import type { Locale } from '@/lib/i18n/config';

export interface AnswerFact {
  label: string;
  value: string;
}

interface MatchAnswerBlockProps {
  state: 'upcoming' | 'live' | 'finished';
  /** Localized stage word for the pill ("Live" / "Finished" / "Upcoming"). */
  stateLabel: string;
  /** One-sentence direct answer (Answer-First / AEO). */
  answer: string;
  /** Fuller recap / preview / live paragraph beneath the answer. */
  recap: string | null;
  /** Small byline, e.g. "DimaScore · published 20 Sept 2026" (finished only). */
  byline?: string | null;
  facts: AnswerFact[];
  locale: Locale;
}

const PILL_TONE: Record<MatchAnswerBlockProps['state'], string> = {
  live: 'text-accent-crimson bg-accent-crimson/10',
  finished: 'text-accent-green bg-accent-green/10',
  upcoming: 'text-accent-azure bg-accent-azure/10',
};

/**
 * Answer-First block at the top of the match page: a stage pill + one-line direct answer + recap
 * (or preview / live blurb) + an inline facts row. Server-rendered from the SSR match snapshot; the
 * live score keeps ticking in the ScoreHeader below, so a mid-match answer is a load-time snapshot.
 */
export function MatchAnswerBlock({
  state,
  stateLabel,
  answer,
  recap,
  byline,
  facts,
  locale,
}: MatchAnswerBlockProps) {
  const dir = locale === 'ar' ? 'rtl' : undefined;
  return (
    <section
      dir={dir}
      aria-label={answer}
      className="rounded-xl border border-border-subtle bg-bg-surface p-4"
    >
      <div className="mb-2 flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${PILL_TONE[state]}`}
        >
          {state === 'live' && (
            <span className="size-1.5 animate-pulse rounded-full bg-accent-crimson" />
          )}
          {stateLabel}
        </span>
      </div>

      <p className="text-lg font-bold leading-snug tracking-tight text-text-primary">{answer}</p>

      {byline && <p className="mt-1 text-xs text-text-tertiary">{byline}</p>}

      {recap && <p className="mt-2 text-sm leading-relaxed text-text-secondary">{recap}</p>}

      {facts.length > 0 && (
        <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-tertiary">
          {facts.map((f, i) => (
            <div key={i} className="flex gap-1">
              <dt className="font-semibold text-text-secondary">{f.label}:</dt>
              <dd className="min-w-0">{f.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
