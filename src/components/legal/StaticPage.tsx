import type { ReactNode } from 'react';
import { SeoBreadcrumb } from '@/components/chrome/SeoBreadcrumb';
import type { StaticPageContent } from '@/lib/constants/site-pages-content';
import type { Locale } from '@/lib/i18n/config';

/**
 * Shared presentational shell for the static footer pages (legal, privacy, about,
 * contact). Renders a compact breadcrumb, the title/description and the prose
 * sections. The optional children slot is appended after the sections (e.g. the
 * contact page's mailto button).
 */
export function StaticPage({
  content,
  locale,
  children,
}: {
  content: StaticPageContent;
  locale: Locale;
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <SeoBreadcrumb
        segments={[{ label: 'DimaScore', href: `/${locale}` }, { label: content.title }]}
        compact
      />
      <article className="mt-2">
        <h1 className="text-2xl font-bold text-text-primary">{content.title}</h1>
        <p className="mt-2 text-sm text-text-secondary">{content.description}</p>

        <div className="mt-6 space-y-6">
          {content.sections.map((section, i) => (
            <section key={i}>
              <h2 className="text-base font-semibold text-text-primary">{section.heading}</h2>
              <div className="mt-2 space-y-2">
                {section.body.map((paragraph, j) => (
                  <p key={j} className="text-sm leading-relaxed text-text-secondary">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        {children}
      </article>
    </div>
  );
}
