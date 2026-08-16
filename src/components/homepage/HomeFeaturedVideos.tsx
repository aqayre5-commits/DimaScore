'use client';

import { useState } from 'react';
import type { MediaVideo } from '@/lib/db/queries/media';
import { VideoCard } from '@/components/media/VideoCard';
import { VideoPlayerModal } from '@/components/media/VideoPlayerModal';

interface Props {
  videos: MediaVideo[];
  labels: { featuredVideos: string };
}

/**
 * Homepage featured-video strip — surfaces the curated media library on the front door.
 * Horizontal scroll of the shared VideoCard, opening the same VideoPlayerModal as the media page.
 * Renders nothing when there are no featured videos (never an empty shell).
 */
export function HomeFeaturedVideos({ videos, labels }: Props) {
  const [activeVideo, setActiveVideo] = useState<MediaVideo | null>(null);

  if (videos.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
      <div className="px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-primary">
          {labels.featuredVideos}
        </h2>
      </div>

      <div className="flex gap-2.5 overflow-x-auto px-4 pb-4 scrollbar-none">
        {videos.map((video) => (
          <div key={video.id} className="w-[240px] shrink-0">
            <VideoCard video={video} onClick={() => setActiveVideo(video)} />
          </div>
        ))}
      </div>

      <VideoPlayerModal
        youtubeId={activeVideo?.youtubeId ?? null}
        title={activeVideo?.title ?? ''}
        open={activeVideo !== null}
        onClose={() => setActiveVideo(null)}
      />
    </div>
  );
}
