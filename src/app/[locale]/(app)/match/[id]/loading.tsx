import { InnerPageShell } from '@/components/layout/InnerPageShell';

function Box({ className }: { className?: string }) {
  return <div className={`rounded bg-bg-surface-2 ${className ?? ''}`} />;
}

/**
 * Match-page loading skeleton. Mirrors the real layout — score header (two team
 * slots + score box) + tab strip + section blocks — so the brief route-transition
 * blink reads as "the match is loading in place" rather than a generic dump.
 */
export default function MatchLoading() {
  return (
    <div className="animate-pulse">
      <div className="mx-auto w-full max-w-[1280px] px-4 pt-4">
        <Box className="h-4 w-48" />
      </div>

      <InnerPageShell
        leftRail={
          <div className="space-y-4">
            <Box className="h-48 rounded-xl" />
            <Box className="h-32 rounded-xl" />
          </div>
        }
        center={
          <div className="space-y-4">
            {/* Score header — mirrors ScoreHeader: competition strip, then
                home slot / score / away slot */}
            <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
              <div className="flex justify-center border-b border-border-subtle px-4 py-2.5">
                <Box className="h-3 w-32" />
              </div>
              <div className="flex items-center justify-center gap-6 px-4 py-6">
                <div className="flex flex-1 flex-col items-center gap-2">
                  <Box className="size-14 rounded-full" />
                  <Box className="h-4 w-20" />
                </div>
                <Box className="h-10 w-16 rounded-lg" />
                <div className="flex flex-1 flex-col items-center gap-2">
                  <Box className="size-14 rounded-full" />
                  <Box className="h-4 w-20" />
                </div>
              </div>
            </div>

            {/* Tab strip + content */}
            <div className="rounded-xl border border-border-subtle bg-bg-surface">
              <div className="flex gap-2 border-b border-border-subtle p-3">
                <Box className="h-7 w-20 rounded-md" />
                <Box className="h-7 w-20 rounded-md" />
                <Box className="h-7 w-20 rounded-md" />
                <Box className="h-7 w-20 rounded-md" />
              </div>
              <div className="space-y-3 p-4">
                <Box className="h-24" />
                <Box className="h-24" />
              </div>
            </div>
          </div>
        }
        rightRail={
          <div className="space-y-4">
            <Box className="h-64 rounded-xl" />
            <Box className="h-48 rounded-xl" />
          </div>
        }
      />
    </div>
  );
}
