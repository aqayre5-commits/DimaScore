import Link from 'next/link';
import { Radio, Trophy } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n/config';
import { getHomepageEditorial } from '@/lib/constants/homepage-editorial-content';
import { buildCompetitionHrefById } from '@/lib/constants/competitions-mega-menu';
import { LEAGUE_IDS } from '@/lib/constants/canonical-ids';

/**
 * Homepage editorial brand narrative — the page's closing brand block, below the live-scores
 * dashboard. Opens with the brand headline + intro + CTAs, then the themed sections and closing.
 */
export async function HomeEditorial({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'homepage' });
  const { sections, closing } = getHomepageEditorial(locale);
  const competitionsHref =
    buildCompetitionHrefById(LEAGUE_IDS.BOTOLA_PRO_1, locale) ?? `/${locale}`;

  return (
    <section className="rounded-xl border border-border-subtle bg-bg-surface px-5 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-2xl space-y-7">
        {/* Brand lead */}
        <div className="border-b border-border-subtle pb-7">
          <h1 className="text-xl font-bold tracking-tight text-text-primary sm:text-2xl">
            {t('h1')}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">{t('intro')}</p>
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
        </div>

        {sections.map((section) => (
          <div key={section.heading}>
            <h2 className="text-base font-bold text-text-primary sm:text-lg">{section.heading}</h2>
            {section.paragraphs.map((p, i) => (
              <p key={i} className="mt-2 text-sm leading-relaxed text-text-secondary">
                {p}
              </p>
            ))}
          </div>
        ))}

        <div className="border-t border-border-subtle pt-6">
          <h2 className="text-lg font-bold text-text-primary sm:text-xl">{closing.heading}</h2>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">{closing.body}</p>
          <Link
            href="#matches"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-accent-azure px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-azure/90"
          >
            <Radio className="size-4" />
            {t('editorialCta')}
          </Link>
        </div>
      </div>
    </section>
  );
}
