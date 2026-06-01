import { InnerPageShell } from '@/components/layout/InnerPageShell';

export default function MatchLoading() {
  return (
    <>
      <div className="mx-auto w-full max-w-[1280px] px-4 pt-4">
        <div className="h-4 w-48 rounded border border-border-subtle/30" />
      </div>
      <InnerPageShell
        leftRail={
          <div className="space-y-4">
            <div className="h-48 rounded-xl border border-border-subtle/30" />
            <div className="h-32 rounded-xl border border-border-subtle/30" />
          </div>
        }
        center={
          <div className="space-y-4">
            <div className="h-48 rounded-xl border border-border-subtle/30" />
            <div className="min-h-96 rounded-xl border border-border-subtle/30" />
          </div>
        }
        rightRail={
          <div className="space-y-4">
            <div className="h-64 rounded-xl border border-border-subtle/30" />
            <div className="h-48 rounded-xl border border-border-subtle/30" />
          </div>
        }
      />
    </>
  );
}
