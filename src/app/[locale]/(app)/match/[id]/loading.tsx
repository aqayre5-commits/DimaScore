import { InnerPageShell } from '@/components/layout/InnerPageShell';

export default function MatchLoading() {
  return (
    <>
      <div className="mx-auto w-full max-w-[1280px] px-4 pt-4">
        <div className="h-4 w-48 animate-pulse rounded bg-bg-surface-2" />
      </div>
      <InnerPageShell
        leftRail={
          <div className="space-y-4">
            <div className="h-48 animate-pulse rounded-xl bg-bg-surface-2" />
            <div className="h-32 animate-pulse rounded-xl bg-bg-surface-2" />
          </div>
        }
        center={
          <div className="space-y-4">
            <div className="h-48 animate-pulse rounded-xl bg-bg-surface-2" />
            <div className="min-h-96 animate-pulse rounded-xl bg-bg-surface-2" />
          </div>
        }
        rightRail={
          <div className="space-y-4">
            <div className="h-64 animate-pulse rounded-xl bg-bg-surface-2" />
            <div className="h-48 animate-pulse rounded-xl bg-bg-surface-2" />
          </div>
        }
      />
    </>
  );
}
