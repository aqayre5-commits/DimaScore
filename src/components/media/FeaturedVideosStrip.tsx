import { getTranslations } from 'next-intl/server';
import { db } from '@/lib/db/client';
import { getMediaVideos } from '@/lib/db/queries/media';
import { MediaGrid } from '@/components/media/MediaGrid';
import type { Locale } from '@/lib/i18n/config';

interface FeaturedVideosStripProps {
  locale: Locale;
}

export async function FeaturedVideosStrip({ locale }: FeaturedVideosStripProps) {
  const [{ videos }, t] = await Promise.all([
    getMediaVideos(db, { isFeatured: true, limit: 9 }),
    getTranslations({ locale, namespace: 'homepage' }),
  ]);

  if (videos.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-[1344px] px-4 pb-12">
      <h2 className="mb-4 text-lg font-semibold text-text-primary">{t('featuredVideos')}</h2>
      <MediaGrid videos={videos} />
    </section>
  );
}
