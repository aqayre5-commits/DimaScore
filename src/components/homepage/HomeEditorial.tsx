import Link from 'next/link';
import { Radio } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n/config';
import { getHomepageEditorial } from '@/lib/constants/homepage-editorial-content';

/**
 * Homepage editorial brand narrative — sits above the factual About/FAQ block.
 * Lighter, reading-first treatment so it's visually distinct from the keyword About card.
 */
export async function HomeEditorial({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'homepage' });
  const { sections, closing } = getHomepageEditorial(locale);

  return (
    <section className="rounded-xl border border-border-subtle bg-bg-surface px-5 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-2xl space-y-7">
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
