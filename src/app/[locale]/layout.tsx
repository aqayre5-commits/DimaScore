import type { Metadata } from 'next';
import { IBM_Plex_Sans, IBM_Plex_Sans_Arabic, Fraunces } from 'next/font/google';
import Script from 'next/script';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '@/lib/i18n/routing';
import { locales, defaultLocale, isRtl } from '@/lib/i18n/config';
import type { Locale } from '@/lib/i18n/config';
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
});

const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  display: 'swap',
});

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

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
    title: 'Atlas Kings',
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
    } catch (e) {}
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
    >
      <body className={`${fontClass} min-h-full flex flex-col`}>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeScript}
        </Script>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
