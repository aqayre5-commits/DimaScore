import { useTranslations } from 'next-intl';
import { ShareButton } from '@/components/shared/ShareButton';

interface VideosSectionProps {
  youtubeIds: string[];
}

/**
 * Videos section — full content width, below center column.
 * Pre-Phase 9: renders compact empty state when youtubeIds is empty.
 * Phase 9+: 3-up grid with facade pattern (thumbnail + play overlay → iframe swap on click).
 */
export function VideosSection({ youtubeIds }: VideosSectionProps) {
  const t = useTranslations('tournament');

  if (youtubeIds.length === 0) {
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {youtubeIds.slice(0, 9).map((id) => (
          <div
            key={id}
            className="relative aspect-video overflow-hidden rounded-lg bg-bg-surface-2"
          >
            <img
              src={`https://img.youtube.com/vi/${id}/mqdefault.jpg`}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
            <button
              className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors hover:bg-black/40"
              aria-label={t('playVideo')}
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-white/90 text-xl text-black">
                ▶
              </span>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
