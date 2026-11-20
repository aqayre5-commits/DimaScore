import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { AdaptiveTopStrip } from '@/components/chrome/AdaptiveTopStrip';
import { Topbar } from '@/components/chrome/Topbar';
import { Footer } from '@/components/chrome/Footer';
import { TodaysMatchLinks } from '@/components/chrome/TodaysMatchLinks';
import { MobileBottomTabBar } from '@/components/chrome/MobileBottomTabBar';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { VisibilityRefresh } from '@/components/providers/VisibilityRefresh';
import { requireLocale } from '@/lib/i18n/require-locale';

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const locale = requireLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: 'chrome' });

  return (
    <QueryProvider>
      <VisibilityRefresh />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-accent-azure focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-bg-canvas"
      >
        {t('skipToContent')}
      </a>
      <Suspense fallback={<div className="sticky top-0 z-50 h-10 bg-bg-surface-3" />}>
        <AdaptiveTopStrip locale={locale} />
      </Suspense>
      <Suspense
        fallback={
          <div className="sticky top-10 z-40 h-12 border-b border-border-subtle bg-bg-surface" />
        }
      >
        <Topbar />
      </Suspense>
      {/* Reserve at least one viewport (minus the 40px strip + 48px topbar) for the page, so the
          streamed "Today's matches" block and footer start below the fold instead of painting in
          view and being pushed down when the page body streams in (home CLS was 0.89, footer).
          Short static pages (StaticPage, FAQ) mark their root with data-fit-content and opt out,
          so they don't get a screen of blank space above the footer. */}
      <main
        id="main"
        className="min-h-[calc(100svh-88px)] min-w-0 flex-1 has-[[data-fit-content]]:min-h-0"
      >
        {children}
      </main>
      <Suspense>
        <TodaysMatchLinks locale={locale} />
      </Suspense>
      {/* Footer has no request-time reads (only its copyright year suspends), so it ships in the
          static shell instead of as one more streamed boundary competing with the page body. */}
      <Footer />
      <Suspense>
        <MobileBottomTabBar />
      </Suspense>
    </QueryProvider>
  );
}
