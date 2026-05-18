import { useTranslations } from 'next-intl';
import type { MediaVideo } from '@/lib/db/queries/media';
import { MediaGrid } from '@/components/media/MediaGrid';

interface MatchMediaSectionProps {
  videos: MediaVideo[];
}

export function MatchMediaSection({ videos }: MatchMediaSectionProps) {
  const t = useTranslations('matchDetail');

  if (videos.length === 0) {
    return (
      <div className="rounded-lg border border-border-subtle bg-bg-surface px-4 py-6 text-center text-sm text-text-tertiary">
        {t('mediaComingSoon')}
      </div>
    );
  }

  return <MediaGrid videos={videos} />;
}
