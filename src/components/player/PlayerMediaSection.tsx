import { getTranslations } from 'next-intl/server';
import { db } from '@/lib/db/client';
import { getMediaVideos } from '@/lib/db/queries/media';
import { MediaGrid } from '@/components/media/MediaGrid';
import type { Locale } from '@/lib/i18n/config';

interface PlayerMediaSectionProps {
  playerId: number;
  locale: Locale;
}

export async function PlayerMediaSection({ playerId, locale }: PlayerMediaSectionProps) {
  const [{ videos }, t] = await Promise.all([
    getMediaVideos(db, { playerId, limit: 9 }),
    getTranslations({ locale, namespace: 'tournament' }),
  ]);

  if (videos.length === 0) return null;

  return (
    <section id="videos" className="rounded-lg border border-border-subtle bg-bg-surface p-4">
      <h2 className="label-caps mb-3">{t('videos')}</h2>
      <MediaGrid videos={videos} />
    </section>
  );
}
