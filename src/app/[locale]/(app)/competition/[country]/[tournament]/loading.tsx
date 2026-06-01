import { InnerPageShell } from '@/components/layout/InnerPageShell';

export default function CompetitionLoading() {
  return (
    <>
      <div className="mx-auto w-full max-w-[1280px] px-4 pt-4">
        <div className="h-4 w-48 animate-pulse rounded bg-bg-surface-2" />
      </div>
      <InnerPageShell
        pageHeader={<div className="h-48 animate-pulse rounded-xl bg-bg-surface-2" />}
        rightRailTop={<div className="h-48 animate-pulse rounded-xl bg-bg-surface-2" />}
        leftRail={<div className="h-96 animate-pulse rounded-xl bg-bg-surface-2" />}
        center={<div className="min-h-96 animate-pulse rounded-xl bg-bg-surface-2" />}
        rightRail={
          <div className="space-y-4">
            <div className="h-48 animate-pulse rounded-xl bg-bg-surface-2" />
            <div className="h-48 animate-pulse rounded-xl bg-bg-surface-2" />
          </div>
        }
      />
    </>
  );
}
