import Link from 'next/link';
import { db } from '@/lib/db/client';
import { getMediaVideos } from '@/lib/db/queries/media';
import { VideoTable } from '@/components/admin/VideoTable';

const PAGE_SIZE = 20;

export default async function AdminMediaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt((params.page as string) ?? '1', 10) || 1);
  const showArchived = params.archived === 'true';

  const { videos, total } = await getMediaVideos(db, {
    isArchived: showArchived,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Media</h1>
          <div className="flex gap-1 text-xs">
            <Link
              href="/admin/media"
              className={`rounded px-2 py-1 ${!showArchived ? 'bg-bg-raised text-text-primary' : 'text-text-tertiary hover:text-text-secondary'}`}
            >
              Active
            </Link>
            <Link
              href="/admin/media?archived=true"
              className={`rounded px-2 py-1 ${showArchived ? 'bg-bg-raised text-text-primary' : 'text-text-tertiary hover:text-text-secondary'}`}
            >
              Archived
            </Link>
          </div>
        </div>
        <Link
          href="/admin/media/new"
          className="inline-flex h-8 items-center rounded-md bg-accent-green px-3 text-sm font-medium text-bg-canvas transition-colors hover:bg-accent-green/90"
        >
          Add video
        </Link>
      </div>

      <VideoTable videos={videos} total={total} page={page} pageSize={PAGE_SIZE} />
    </div>
  );
}
