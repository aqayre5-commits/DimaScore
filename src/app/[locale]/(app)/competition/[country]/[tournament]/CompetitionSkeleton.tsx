import { InnerPageShell } from '@/components/layout/InnerPageShell';

export function CompetitionSkeleton() {
  return (
    <>
      <div className="mx-auto w-full max-w-[1280px] px-4 pt-4">
        <div className="h-4 w-48 rounded border border-border-subtle/30" />
      </div>
      <InnerPageShell
        pageHeader={<div className="h-48 rounded-xl border border-border-subtle/30" />}
        rightRailTop={<div className="h-48 rounded-xl border border-border-subtle/30" />}
        leftRail={<div className="h-96 rounded-xl border border-border-subtle/30" />}
        center={
          <div className="rounded-xl border border-border-subtle/30">
            <div className="flex gap-2 border-b border-border-subtle/30 p-3">
              <div className="h-7 w-20 rounded-md border border-border-subtle/30" />
              <div className="h-7 w-20 rounded-md border border-border-subtle/30" />
              <div className="h-7 w-20 rounded-md border border-border-subtle/30" />
              <div className="h-7 w-20 rounded-md border border-border-subtle/30" />
            </div>
            <div className="divide-y divide-border-subtle/30">
              <div className="h-12" />
              <div className="h-12" />
              <div className="h-12" />
              <div className="h-12" />
              <div className="h-12" />
              <div className="h-12" />
              <div className="h-12" />
              <div className="h-12" />
            </div>
          </div>
        }
        rightRail={
          <div className="space-y-4">
            <div className="h-48 rounded-xl border border-border-subtle/30" />
            <div className="h-48 rounded-xl border border-border-subtle/30" />
          </div>
        }
        belowCenter={
          <div className="space-y-4">
            <div className="h-48 rounded-xl border border-border-subtle/30" />
            <div className="h-48 rounded-xl border border-border-subtle/30" />
          </div>
        }
      />
    </>
  );
}
