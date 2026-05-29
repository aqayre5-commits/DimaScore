import type { ReactNode } from 'react';

interface InnerPageShellProps {
  pageHeader?: ReactNode;
  rightRailTop?: ReactNode;
  leftRail: ReactNode;
  center: ReactNode;
  rightRail: ReactNode;
  belowCenter?: ReactNode;
}

/**
 * 3-column inner-page shell (matchwire-derived).
 * Desktop >=1280px: 256px left (sticky) + 1fr center + 320px right (sticky, scrolls to footer).
 * Max-width 1280px, 16px container padding, 24px column gap.
 * <=1280px: right rail hidden, left rail 224px.
 * <768px: single column — center, then left, then right.
 *
 * When rightRailTop is provided, pageHeader spans cols 1-2 at row 1 and
 * rightRailTop sits in col 3 row 1 (same height as hero). Content shifts to row 2.
 * Otherwise, pageHeader is a full-width row above the grid (original behavior).
 */
export function InnerPageShell({
  pageHeader,
  rightRailTop,
  leftRail,
  center,
  rightRail,
  belowCenter,
}: InnerPageShellProps) {
  // Side-by-side hero layout: hero spans left+center, rightRailTop alongside
  if (rightRailTop) {
    return (
      <div className="mx-auto w-full max-w-[1280px] px-4 pt-4">
        <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[256px_minmax(0,1fr)_320px] xl:items-start xl:gap-6">
          {/* Row 1: Page header (cols 1-2) + right rail top (col 3) */}
          {pageHeader && (
            <div className="order-0 xl:order-none xl:col-span-2 xl:col-start-1 xl:row-start-1 xl:self-stretch">
              {pageHeader}
            </div>
          )}
          <div className="order-3 hidden xl:order-none xl:col-start-3 xl:row-start-1 xl:flex xl:flex-col xl:self-stretch">
            {rightRailTop}
          </div>

          {/* Row 2: Left rail */}
          <aside className="order-2 xl:order-none xl:col-start-1 xl:row-start-2 xl:sticky xl:top-[104px] xl:max-h-[calc(100vh-120px)] xl:overflow-y-auto">
            {leftRail}
          </aside>

          {/* Row 2: Center column */}
          <div className="order-1 min-w-0 xl:order-none xl:col-start-2 xl:row-start-2">
            {center}
            {belowCenter && <div className="mt-6">{belowCenter}</div>}
          </div>

          {/* Row 2: Right rail — sticky, scrollable */}
          <aside className="order-3 hidden xl:order-none xl:col-start-3 xl:row-start-2 xl:block xl:sticky xl:top-[104px] xl:max-h-[calc(100vh-120px)] xl:overflow-y-auto">
            {rightRail}
          </aside>
        </div>
      </div>
    );
  }

  // Original layout: full-width pageHeader above the 3-column grid
  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 pt-4">
      {pageHeader && <div className="mb-4">{pageHeader}</div>}

      <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[256px_minmax(0,1fr)_320px] xl:grid-rows-[auto] xl:items-start xl:gap-6">
        {/* Left rail — sticky below header stack */}
        <aside className="order-2 xl:order-none xl:col-start-1 xl:row-start-1 xl:sticky xl:top-[104px] xl:max-h-[calc(100vh-120px)] xl:overflow-y-auto">
          {leftRail}
        </aside>

        {/* Center column — first in DOM for mobile via order */}
        <div className="order-1 min-w-0 xl:order-none xl:col-start-2 xl:row-start-1">
          {center}
          {belowCenter && <div className="mt-6">{belowCenter}</div>}
        </div>

        {/* Right rail — sticky, scrollable, reaches footer */}
        <aside className="order-3 hidden xl:order-none xl:col-start-3 xl:row-start-1 xl:block xl:sticky xl:top-[104px] xl:max-h-[calc(100vh-120px)] xl:overflow-y-auto">
          {rightRail}
        </aside>
      </div>
    </div>
  );
}
