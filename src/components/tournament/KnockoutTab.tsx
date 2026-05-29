'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { WC_2026_BRACKETS_BY_LOCALE } from '@/lib/constants/wc2026-bracket-builder';
import { KnockoutBracket } from './KnockoutBracket';
import type { Locale } from '@/lib/i18n/config';
import type { BracketMatch, KnockoutPhase } from './BracketMatchCell';

interface KnockoutTabProps {
  locale: Locale;
  bracketHref?: string;
  /** DB-driven matches. When provided, static WC_2026 schedule is bypassed. */
  matches?: BracketMatch[];
  thirdPlaceMatch?: BracketMatch;
  activePhase?: KnockoutPhase;
}

/**
 * Knockout tab — converging bracket visualization.
 * Accepts optional DB-driven data; falls back to static WC 2026 schedule
 * when no dynamic data is available (pre-tournament).
 */
export function KnockoutTab({
  locale,
  bracketHref,
  matches,
  thirdPlaceMatch,
  activePhase,
}: KnockoutTabProps) {
  const t = useTranslations('tournament');

  const data = matches ? { matches, thirdPlaceMatch } : WC_2026_BRACKETS_BY_LOCALE[locale];

  const phase = activePhase ?? 'r32';

  return (
    <div className="space-y-4">
      {bracketHref && (
        <Link
          href={bracketHref}
          className="inline-flex items-center gap-1 rounded-lg border border-accent-azure/30 bg-accent-azure/10 px-3 py-1.5 text-xs font-medium text-accent-azure transition-colors hover:bg-accent-azure/20"
        >
          {t('viewFullBracket')} →
        </Link>
      )}
      <KnockoutBracket
        matches={data.matches}
        thirdPlaceMatch={data.thirdPlaceMatch}
        locale={locale}
        activePhase={phase}
      />
    </div>
  );
}
