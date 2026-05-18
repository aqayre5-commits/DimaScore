'use client';

import { useState, useMemo } from 'react';
import type { MediaVideo } from '@/lib/db/queries/media';
import { VideoCard } from '@/components/media/VideoCard';
import { VideoPlayerModal } from '@/components/media/VideoPlayerModal';
import { CategoryFilter } from '@/components/media/CategoryFilter';

interface MediaGridProps {
  videos: MediaVideo[];
  emptyMessage?: string;
}

export function MediaGrid({ videos, emptyMessage = 'No videos yet.' }: MediaGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeVideo, setActiveVideo] = useState<MediaVideo | null>(null);

  const categories = useMemo(() => {
    const set = new Set(videos.map((v) => v.category));
    return [...set].sort();
  }, [videos]);

  const filtered = selectedCategory
    ? videos.filter((v) => v.category === selectedCategory)
    : videos;

  if (videos.length === 0) {
    return <p className="py-6 text-center text-sm text-text-tertiary">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-3">
      <CategoryFilter
        categories={categories}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />

      {filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-text-tertiary">No videos in this category.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((video) => (
            <VideoCard key={video.id} video={video} onClick={() => setActiveVideo(video)} />
          ))}
        </div>
      )}

      <VideoPlayerModal
        youtubeId={activeVideo?.youtubeId ?? null}
        title={activeVideo?.title ?? ''}
        open={activeVideo !== null}
        onClose={() => setActiveVideo(null)}
      />
    </div>
  );
}
