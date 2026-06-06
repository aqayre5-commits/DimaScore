import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { type Locale } from '@/lib/i18n/config';
import { SITE_PAGES_CONTENT } from '@/lib/constants/site-pages-content';
import { buildStaticPageMetadata } from '@/lib/seo/static-page-metadata';
import { SeoBreadcrumb } from '@/components/chrome/SeoBreadcrumb';
import { FaqPageJsonLd } from '@/components/seo/FaqPageJsonLd';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const content = SITE_PAGES_CONTENT[locale as Locale].faq;
  return buildStaticPageMetadata(locale as Locale, 'faq', content);
}

export default async function FaqPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const content = SITE_PAGES_CONTENT[locale as Locale].faq;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <SeoBreadcrumb
        segments={[{ label: 'DimaScore', href: `/${locale}` }, { label: content.title }]}
        compact
      />
      <div className="mt-2">
        <h1 className="text-2xl font-bold text-text-primary">{content.title}</h1>
        <p className="mt-2 text-sm text-text-secondary">{content.description}</p>

        <dl className="mt-6 divide-y divide-border-subtle">
          {content.items.map((item, i) => (
            <div key={i} className="py-4">
              <dt className="text-base font-semibold text-text-primary">{item.q}</dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-text-secondary">{item.a}</dd>
            </div>
          ))}
        </dl>
      </div>

      <FaqPageJsonLd faqs={content.items.map((it) => ({ question: it.q, answer: it.a }))} />
    </div>
  );
}
