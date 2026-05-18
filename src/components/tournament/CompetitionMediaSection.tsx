import { getTranslations } from 'next-intl/server';
import { db } from '@/lib/db/client';
import { getMediaVideos } from '@/lib/db/queries/media';
import { ShareButton } from '@/components/shared/ShareButton';
import { MediaGrid } from '@/components/media/MediaGrid';
import type { Locale } from '@/lib/i18n/config';

interface CompetitionMediaSectionProps {
  competitionId: number;
  locale: Locale;
}

export async function CompetitionMediaSection({
  competitionId,
  locale,
}: CompetitionMediaSectionProps) {
  const [{ videos }, t] = await Promise.all([
    getMediaVideos(db, { competitionId, limit: 9 }),
    getTranslations({ locale, namespace: 'tournament' }),
  ]);

  if (videos.length === 0) {
    return (
      <section
        id="videos"
        className="mt-6 rounded-lg border border-border-subtle bg-bg-surface p-4"
      >
        <h2 className="text-sm font-semibold text-text-primary">{t('videos')}</h2>
        <p className="mt-1 text-xs text-text-tertiary">{t('videosComingSoon')}</p>
      </section>
    );
  }

  return (
    <section id="videos" className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-text-primary">{t('videos')}</h2>
        <ShareButton title={t('videos')} hash="videos" />
      </div>
      <MediaGrid videos={videos} />
    </section>
  );
}
