import type { Metadata } from 'next';
import { Inter, IBM_Plex_Sans_Arabic } from 'next/font/google';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '@/lib/i18n/routing';
import { isRtl } from '@/lib/i18n/config';
import type { Locale } from '@/lib/i18n/config';
import '../globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  variable: '--font-ibm-plex-arabic',
  weight: ['400', '500', '600', '700'],
  subsets: ['arabic'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Atlas Kings',
  description: 'Moroccan football and beyond',
};

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
      : `${inter.variable} font-[family-name:var(--font-inter)]`;

  const messages = (await import(`@/lib/i18n/messages/${locale}.json`)).default;

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${inter.variable} ${ibmPlexSansArabic.variable} h-full antialiased`}
    >
      <body className={`${fontClass} min-h-full flex flex-col`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
