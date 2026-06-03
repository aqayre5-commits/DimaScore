import { InnerPageShell } from '@/components/layout/InnerPageShell';
import { MatchInstantFallback } from '@/components/match/MatchInstantFallback';

function Box({ className }: { className?: string }) {
  return <div className={`rounded bg-bg-surface-2 ${className ?? ''}`} />;
}

/**
 * Match-page loading boundary (soft navigation).
 *
 * Center column renders <MatchInstantFallback />, which paints a real partial
 * header from the qk.matchHeader cache seeded by the originating fixture surface
 * (or the original shaped skeleton when no preview exists). Breadcrumb + rails
 * stay as pulsing skeletons. The outer pulse is intentionally gone so a real
 * header does not animate.
 */
export default function MatchLoading() {
  return (
    <div>
      <div className="mx-auto w-full max-w-[1280px] animate-pulse px-4 pt-4">
        <Box className="h-4 w-48" />
      </div>

      <InnerPageShell
        leftRail={
          <div className="animate-pulse space-y-4">
            <Box className="h-48 rounded-xl" />
            <Box className="h-32 rounded-xl" />
          </div>
        }
        center={<MatchInstantFallback />}
        rightRail={
          <div className="animate-pulse space-y-4">
            <Box className="h-64 rounded-xl" />
            <Box className="h-48 rounded-xl" />
          </div>
        }
      />
    </div>
  );
}
