import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { type Locale } from '@/lib/i18n/config';
import { SITE_PAGES_CONTENT } from '@/lib/constants/site-pages-content';
import { buildStaticPageMetadata } from '@/lib/seo/static-page-metadata';
import { StaticPage } from '@/components/legal/StaticPage';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const content = SITE_PAGES_CONTENT[locale as Locale].privacy;
  return buildStaticPageMetadata(locale as Locale, 'privacy', content);
}

export default async function PrivacyPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const content = SITE_PAGES_CONTENT[locale as Locale].privacy;
  return <StaticPage content={content} locale={locale as Locale} />;
}
