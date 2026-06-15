import Link from 'next/link';
import { Radio, Trophy } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n/config';
import { buildCompetitionHrefById } from '@/lib/constants/competitions-mega-menu';
import { LEAGUE_IDS } from '@/lib/constants/canonical-ids';

/**
 * Homepage brand hero — the editorial lead above the live-scores dashboard.
 * Headline + intro + two CTAs (live matches on this page, then the flagship competition).
 */
export async function HomeBrandHero({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'homepage' });
  const competitionsHref =
    buildCompetitionHrefById(LEAGUE_IDS.BOTOLA_PRO_1, locale) ?? `/${locale}`;

  return (
    <section className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface px-5 py-5 sm:px-6 sm:py-6">
      <h1 className="text-xl font-bold tracking-tight text-text-primary sm:text-2xl">{t('h1')}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">{t('intro')}</p>
      <div className="mt-4 flex flex-wrap gap-2.5">
        <Link
          href="#matches"
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent-azure px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-azure/90"
        >
          <Radio className="size-4" />
          {t('heroCtaPrimary')}
        </Link>
        <Link
          href={competitionsHref}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border-strong px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-bg-surface-2"
        >
          <Trophy className="size-4" />
          {t('heroCtaSecondary')}
        </Link>
      </div>
    </section>
  );
}
