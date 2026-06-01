import { Suspense } from 'react';
import { AdaptiveTopStrip } from '@/components/chrome/AdaptiveTopStrip';
import { Topbar } from '@/components/chrome/Topbar';
import { Footer } from '@/components/chrome/Footer';
import { MobileBottomTabBar } from '@/components/chrome/MobileBottomTabBar';
import { QueryProvider } from '@/components/providers/QueryProvider';
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
    <QueryProvider>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-accent-azure focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-bg-canvas"
      >
        Skip to content
      </a>
      <Suspense fallback={<div className="sticky top-0 z-50 h-10 bg-bg-surface-3" />}>
        <AdaptiveTopStrip locale={locale} />
      </Suspense>
      <Topbar />
      <main id="main" className="flex-1 min-w-0">
        {children}
      </main>
      <Footer />
      <MobileBottomTabBar />
    </QueryProvider>
  );
}
