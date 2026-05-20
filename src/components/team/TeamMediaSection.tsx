import { getTranslations } from 'next-intl/server';
import { db } from '@/lib/db/client';
import { getMediaVideos } from '@/lib/db/queries/media';
import { MediaGrid } from '@/components/media/MediaGrid';
import type { Locale } from '@/lib/i18n/config';

interface TeamMediaSectionProps {
  teamId: number;
  locale: Locale;
}

export async function TeamMediaSection({ teamId, locale }: TeamMediaSectionProps) {
  const [{ videos }, t] = await Promise.all([
    getMediaVideos(db, { teamId, limit: 9 }),
    getTranslations({ locale: locale, namespace: 'tournament' }),
  ]);

  if (videos.length === 0) {
    return (
      <section id="videos" className="rounded-lg border border-border-subtle bg-bg-surface p-4">
        <h2 className="text-sm font-semibold text-text-primary">{t('videos')}</h2>
        <p className="mt-1 text-xs text-text-tertiary">{t('videosComingSoon')}</p>
      </section>
    );
  }

  return (
    <section id="videos" className="rounded-lg border border-border-subtle bg-bg-surface p-4">
      <h2 className="label-caps mb-3">{t('videos')}</h2>
      <MediaGrid videos={videos} />
    </section>
  );
}
