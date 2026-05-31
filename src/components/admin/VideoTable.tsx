'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { MediaVideo } from '@/lib/db/queries/media';
import Image from 'next/image';

interface VideoTableProps {
  videos: MediaVideo[];
  total: number;
  page: number;
  pageSize: number;
}

export function VideoTable({ videos, total, page, pageSize }: VideoTableProps) {
  const router = useRouter();
  const totalPages = Math.ceil(total / pageSize);

  async function handleToggle(id: string, field: 'isFeatured' | 'isArchived', current: boolean) {
    await fetch(`/api/v1/media/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: !current }),
    });
    router.refresh();
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await fetch(`/api/v1/media/${id}`, { method: 'DELETE' });
    router.refresh();
  }

  if (videos.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-text-tertiary">
        No videos found. Add one to get started.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-border-subtle">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle bg-bg-raised text-left text-xs font-medium text-text-secondary">
              <th className="px-3 py-2">Video</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Tags</th>
              <th className="px-3 py-2 text-center">Featured</th>
              <th className="px-3 py-2 text-center">Archived</th>
              <th className="px-3 py-2">Added</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {videos.map((v) => {
              const tagCount =
                (v.competitionIds?.length ?? 0) +
                (v.teamIds?.length ?? 0) +
                (v.fixtureIds?.length ?? 0) +
                (v.playerIds?.length ?? 0);

              return (
                <tr key={v.id} className="border-b border-border-subtle last:border-0">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2.5">
                      {v.thumbnailUrl && (
                        <Image
                          src={v.thumbnailUrl}
                          alt=""
                          className="h-9 w-16 shrink-0 rounded object-cover"
                          width={64}
                          height={36}
                        />
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-medium text-text-primary" title={v.title}>
                          {v.title}
                        </p>
                        {v.channelName && (
                          <p className="truncate text-xs text-text-tertiary">{v.channelName}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span className="inline-block rounded bg-bg-raised px-1.5 py-0.5 text-xs font-medium text-text-secondary">
                      {v.category}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-text-tertiary">{tagCount}</td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => handleToggle(v.id, 'isFeatured', v.isFeatured ?? false)}
                      className="text-lg transition-opacity hover:opacity-80"
                      title={v.isFeatured ? 'Remove from featured' : 'Mark as featured'}
                    >
                      {v.isFeatured ? '\u2605' : '\u2606'}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => handleToggle(v.id, 'isArchived', v.isArchived ?? false)}
                      className="text-xs transition-opacity hover:opacity-80"
                      title={v.isArchived ? 'Unarchive' : 'Archive'}
                    >
                      {v.isArchived ? 'Restore' : 'Archive'}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-xs text-text-tertiary">
                    {v.createdAt
                      ? new Date(v.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '-'}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => handleDelete(v.id, v.title)}
                      className="text-xs text-red-400 transition-opacity hover:opacity-80"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-text-tertiary">
          <span>
            {total} video{total !== 1 ? 's' : ''} — page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/admin/media?page=${page - 1}`}
                className="rounded border border-border-subtle px-2.5 py-1 hover:bg-bg-raised"
              >
                Prev
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin/media?page=${page + 1}`}
                className="rounded border border-border-subtle px-2.5 py-1 hover:bg-bg-raised"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
