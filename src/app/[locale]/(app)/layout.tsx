import { Suspense } from 'react';
import { AdaptiveTopStrip } from '@/components/chrome/AdaptiveTopStrip';
import { Topbar } from '@/components/chrome/Topbar';
import { Footer } from '@/components/chrome/Footer';
import { MobileBottomTabBar } from '@/components/chrome/MobileBottomTabBar';
import type { Locale } from '@/lib/i18n/config';

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as Locale;

  return (
    <>
      <Suspense fallback={<div className="sticky top-0 z-50 h-10 bg-[#0c0c0d]" />}>
        <AdaptiveTopStrip locale={locale} />
      </Suspense>
      <Topbar />
      <main className="flex-1 min-w-0">{children}</main>
      <Footer />
      <MobileBottomTabBar />
    </>
  );
}
