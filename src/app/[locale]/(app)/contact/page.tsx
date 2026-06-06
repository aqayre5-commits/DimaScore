import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Mail } from 'lucide-react';
import { type Locale } from '@/lib/i18n/config';
import { SITE_PAGES_CONTENT, CONTACT_EMAIL } from '@/lib/constants/site-pages-content';
import { buildStaticPageMetadata } from '@/lib/seo/static-page-metadata';
import { StaticPage } from '@/components/legal/StaticPage';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const content = SITE_PAGES_CONTENT[locale as Locale].contact;
  return buildStaticPageMetadata(locale as Locale, 'contact', content);
}

export default async function ContactPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const content = SITE_PAGES_CONTENT[locale as Locale].contact;

  return (
    <StaticPage content={content} locale={locale as Locale}>
      <div className="mt-6">
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="inline-flex items-center gap-2 rounded-lg bg-accent-azure px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-azure/90"
        >
          <Mail className="size-4" />
          {CONTACT_EMAIL}
        </a>
      </div>
    </StaticPage>
  );
}
