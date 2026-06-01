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
        center={<div className="min-h-96 rounded-xl border border-border-subtle/30" />}
        rightRail={
          <div className="space-y-4">
            <div className="h-48 rounded-xl border border-border-subtle/30" />
            <div className="h-48 rounded-xl border border-border-subtle/30" />
          </div>
        }
      />
    </>
  );
}
