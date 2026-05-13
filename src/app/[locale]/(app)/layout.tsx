import { TopNav } from '@/components/chrome/TopNav';
import { SportNav } from '@/components/chrome/SportNav';
import { LiveTicker } from '@/components/chrome/LiveTicker';
import { LeftRail } from '@/components/chrome/LeftRail';
import { Footer } from '@/components/chrome/Footer';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Sticky chrome: TopNav + SportNav */}
      <div className="sticky top-0 z-40">
        <TopNav />
        <SportNav />
      </div>

      {/* LiveTicker — renders null when no live matches */}
      <LiveTicker />

      {/* Main content area: LeftRail + page content */}
      <div className="flex flex-1">
        <LeftRail />
        <main className="flex-1 min-w-0">{children}</main>
      </div>

      <Footer />
    </>
  );
}
