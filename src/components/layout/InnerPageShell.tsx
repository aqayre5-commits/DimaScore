import type { ReactNode } from 'react';

interface InnerPageShellProps {
  pageHeader?: ReactNode;
  leftRail: ReactNode;
  center: ReactNode;
  rightRail: ReactNode;
  belowCenter?: ReactNode;
}

/**
 * 3-column inner-page shell (matchwire-derived).
 * Desktop >=1280px: 256px left (sticky) + 1fr center + 320px right.
 * Max-width 1280px, 16px container padding, 24px column gap.
 * <=1280px: right rail hidden, left rail 224px.
 * <768px: single column — center, then left, then right.
 */
export function InnerPageShell({
  pageHeader,
  leftRail,
  center,
  rightRail,
  belowCenter,
}: InnerPageShellProps) {
  return (
    <div className="mx-auto w-full max-w-[1280px] px-4">
      {pageHeader && <div className="mb-4">{pageHeader}</div>}

      <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[256px_minmax(0,1fr)_320px] xl:gap-6">
        {/* Center column — first in DOM for mobile, reordered via grid on desktop */}
        <div className="order-1 min-w-0 xl:order-2">{center}</div>

        {/* Left rail — sticky below header stack */}
        <aside className="order-2 xl:order-1 xl:sticky xl:top-[156px] xl:max-h-[calc(100vh-172px)] xl:overflow-y-auto">
          {leftRail}
        </aside>

        {/* Right rail — hidden below xl breakpoint */}
        <aside className="order-3 hidden xl:block">{rightRail}</aside>
      </div>

      {belowCenter && <div className="mt-6 space-y-6">{belowCenter}</div>}
    </div>
  );
}
