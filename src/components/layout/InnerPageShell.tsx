import type { ReactNode } from 'react';

interface InnerPageShellProps {
  pageHeader?: ReactNode;
  leftRail: ReactNode;
  center: ReactNode;
  rightRail: ReactNode;
}

/**
 * 3-column inner-page shell used by competition, team, player, and match pages.
 * Desktop >=1280px: left (~360-380) + center (~500-520 flex) + right (~280-300).
 * Tablet 768-1279: center full-width, left + right stack below.
 * Mobile <768: single column — center, then left, then right.
 *
 * NOT used by the homepage (single-column layout).
 */
export function InnerPageShell({ pageHeader, leftRail, center, rightRail }: InnerPageShellProps) {
  return (
    <div className="mx-auto w-full max-w-[1280px] px-4">
      {pageHeader && <div className="mb-4">{pageHeader}</div>}

      <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[minmax(360px,380px)_minmax(0,1fr)_minmax(280px,300px)] xl:gap-4">
        {/* Center column — first in DOM for mobile, reordered via grid on desktop */}
        <div className="order-1 min-w-0 xl:order-2">{center}</div>

        {/* Left rail */}
        <aside className="order-2 xl:order-1">{leftRail}</aside>

        {/* Right rail — hidden below xl breakpoint */}
        <aside className="order-3 hidden xl:block">{rightRail}</aside>
      </div>
    </div>
  );
}
