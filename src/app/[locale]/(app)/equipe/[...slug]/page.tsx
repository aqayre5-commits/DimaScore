import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SeoBreadcrumb, type BreadcrumbSegment } from '@/components/chrome/SeoBreadcrumb';

interface PageProps {
  params: Promise<{ locale: string; slug: string[] }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = rawSlug.map(decodeURIComponent);
  const display = slug.join(' / ').replace(/-/g, ' ');
  return { title: `${display} | Atlas Kings` };
}

export default async function TeamPlaceholderPage({ params }: PageProps) {
  const { locale, slug: rawSlug } = await params;
  const slug = rawSlug.map(decodeURIComponent);
  const t = await getTranslations({ locale, namespace: 'placeholder' });
  const tBc = await getTranslations({ locale, namespace: 'breadcrumb' });

  const breadcrumbs: BreadcrumbSegment[] = [
    { label: tBc('football'), href: `/${locale}` },
    { label: slug.join(' / ').replace(/-/g, ' ') },
  ];

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-8">
      <SeoBreadcrumb segments={breadcrumbs} />
      <div className="mt-8 flex flex-col items-center gap-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-bg-surface-2">
          <span className="text-2xl">⚽</span>
        </div>
        <h1 className="text-xl font-semibold text-text-primary">
          {slug[slug.length - 1]?.replace(/-/g, ' ')}
        </h1>
        <p className="text-sm text-text-tertiary">{t('pageComingSoon')}</p>
      </div>
    </div>
  );
}
