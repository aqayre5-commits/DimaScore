import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans, IBM_Plex_Sans_Arabic, Fraunces } from 'next/font/google';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/lib/i18n/routing';
import { locales, defaultLocale, isRtl } from '@/lib/i18n/config';
import type { Locale } from '@/lib/i18n/config';
import { BASE_URL } from '@/lib/constants/site';
import '../globals.css';

const ibmPlexSans = IBM_Plex_Sans({
  variable: '--font-ibm-plex-sans',
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
});

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  variable: '--font-ibm-plex-arabic',
  weight: ['400', '500', '600', '700'],
  subsets: ['arabic'],
  display: 'swap',
  // Only used on the Arabic locale — don't preload it on en/fr pages.
  preload: false,
});

const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  display: 'swap',
  // Display face for sparse headings — load on demand, not in the FCP window.
  preload: false,
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const baseUrl = BASE_URL;

// Enables env(safe-area-inset-*) on notched devices and sets the mobile
// status-bar tint. viewport-fit=cover is required for the safe-area insets
// used by the fixed bottom tab bar and full-screen modals.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0d1117',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = `${baseUrl}/${loc}`;
  }
  languages['x-default'] = `${baseUrl}/${defaultLocale}`;

  return {
    metadataBase: new URL(baseUrl),
    title: 'DimaScore',
    description:
      locale === 'ar'
        ? 'كرة القدم المغربية وما بعدها'
        : locale === 'en'
          ? 'Moroccan football and beyond'
          : 'Le football marocain et au-delà',
    alternates: {
      languages,
    },
  };
}

const themeScript = `
  (function() {
    try {
      var t = localStorage.getItem('atlas-theme');
      if (t === 'light') {
        document.documentElement.dataset.theme = 'light';
      }
    } catch (e) { /* localStorage unavailable in SSR/privacy mode */ }
  })();
`;

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const typedLocale = locale as Locale;
  const dir = isRtl(typedLocale) ? 'rtl' : 'ltr';
  const fontClass =
    typedLocale === 'ar'
      ? `${ibmPlexSansArabic.variable} font-[family-name:var(--font-ibm-plex-arabic)]`
      : `${ibmPlexSans.variable} font-[family-name:var(--font-ibm-plex-sans)]`;

  const messages = (await import(`@/lib/i18n/messages/${locale}.json`)).default;

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${ibmPlexSans.variable} ${ibmPlexSansArabic.variable} ${fraunces.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://media.api-sports.io" />
        <link rel="dns-prefetch" href="https://media.api-sports.io" />
      </head>
      <body
        className={`${fontClass} flex min-h-full flex-col bg-bg-canvas pb-[calc(3.5rem+env(safe-area-inset-bottom))] text-text-primary md:pb-0`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
