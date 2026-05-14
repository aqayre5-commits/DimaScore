import { AdaptiveTopStrip } from '@/components/chrome/AdaptiveTopStrip';
import { Topbar } from '@/components/chrome/Topbar';
import { Footer } from '@/components/chrome/Footer';
import { MobileBottomTabBar } from '@/components/chrome/MobileBottomTabBar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdaptiveTopStrip />
      <Topbar />
      <main className="flex-1 min-w-0">{children}</main>
      <Footer />
      <MobileBottomTabBar />
    </>
  );
}
