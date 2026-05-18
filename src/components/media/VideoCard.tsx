import type { MediaVideo } from '@/lib/db/queries/media';

interface VideoCardProps {
  video: MediaVideo;
  onClick: () => void;
}

function formatDuration(seconds: number | null): string | null {
  if (seconds == null || seconds <= 0) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function VideoCard({ video, onClick }: VideoCardProps) {
  const thumbnail =
    video.thumbnailUrl || `https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`;
  const duration = formatDuration(video.duration);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-full overflow-hidden rounded-lg bg-bg-surface text-left transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:outline-none"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={thumbnail}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
        />
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/35">
          <span className="flex size-11 items-center justify-center rounded-full bg-white/90 text-lg text-black shadow-sm">
            ▶
          </span>
        </div>
        {/* Duration badge */}
        {duration && (
          <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 font-[family-name:var(--font-ibm-plex-sans)] text-[11px] font-medium tabular-nums text-white">
            {duration}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="px-2.5 py-2">
        <p className="truncate text-sm font-medium text-text-primary">{video.title}</p>
        {video.channelName && (
          <p className="mt-0.5 truncate text-xs text-text-tertiary">{video.channelName}</p>
        )}
      </div>
    </button>
  );
}
