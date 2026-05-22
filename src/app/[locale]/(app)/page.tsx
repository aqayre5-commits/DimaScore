import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { locales, defaultLocale, type Locale } from '@/lib/i18n/config';
import { WebSiteJsonLd } from '@/components/seo/WebSiteJsonLd';
import { OrganizationJsonLd } from '@/components/seo/OrganizationJsonLd';
import { FixtureList } from '@/components/homepage/FixtureList';
import { EditorialCards } from '@/components/homepage/EditorialCards';
import { MatchesThisWeek } from '@/components/homepage/cards/MatchesThisWeek';
import { RightRail } from '@/components/homepage/RightRail';
import { AboutCard } from '@/components/tournament/AboutCard';
import { FaqPageJsonLd } from '@/components/seo/FaqPageJsonLd';
import { FeaturedVideosStrip } from '@/components/media/FeaturedVideosStrip';
import { getHomepageAboutContent } from '@/lib/constants/homepage-about-content';

interface PageProps {
  params: Promise<{ locale: string }>;
}

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// ── Per-locale metadata (homepage.md §3) ──

const HOME_META: Record<Locale, { title: string; description: string }> = {
  fr: {
    title:
      "Football aujourd'hui \u2014 scores en direct, Botola Pro, WC 2026, Atlas Lions | Atlas Kings",
    description:
      'Suivez le football marocain et mondial en direct : scores Botola Pro, matchs Atlas Lions, qualifications Coupe du Monde 2026, AFCON, WAFCON, classements et statistiques mises \u00e0 jour en temps r\u00e9el.',
  },
  en: {
    title: 'Football today \u2014 live scores, Botola Pro, WC 2026, Atlas Lions | Atlas Kings',
    description:
      'Follow Moroccan and world football live: Botola Pro scores, Atlas Lions fixtures, World Cup 2026 qualifiers, AFCON, WAFCON, standings and statistics updated in real time.',
  },
  ar: {
    title:
      '\u0643\u0631\u0629 \u0627\u0644\u0642\u062f\u0645 \u0627\u0644\u064a\u0648\u0645 \u2014 \u0646\u062a\u0627\u0626\u062c \u0645\u0628\u0627\u0634\u0631\u0629\u060c \u0627\u0644\u0628\u0637\u0648\u0644\u0629 \u0627\u0644\u0627\u062d\u062a\u0631\u0627\u0641\u064a\u0629\u060c \u0643\u0623\u0633 \u0627\u0644\u0639\u0627\u0644\u0645 2026\u060c \u0623\u0633\u0648\u062f \u0627\u0644\u0623\u0637\u0644\u0633 | \u0623\u0637\u0644\u0633 \u0643\u064a\u0646\u063a\u0632',
    description:
      '\u062a\u0627\u0628\u0639\u0648\u0627 \u0643\u0631\u0629 \u0627\u0644\u0642\u062f\u0645 \u0627\u0644\u0645\u063a\u0631\u0628\u064a\u0629 \u0648\u0627\u0644\u0639\u0627\u0644\u0645\u064a\u0629 \u0645\u0628\u0627\u0634\u0631\u0629: \u0646\u062a\u0627\u0626\u062c \u0627\u0644\u0628\u0637\u0648\u0644\u0629 \u0627\u0644\u0627\u062d\u062a\u0631\u0627\u0641\u064a\u0629\u060c \u0645\u0628\u0627\u0631\u064a\u0627\u062a \u0623\u0633\u0648\u062f \u0627\u0644\u0623\u0637\u0644\u0633\u060c \u062a\u0635\u0641\u064a\u0627\u062a \u0643\u0623\u0633 \u0627\u0644\u0639\u0627\u0644\u0645 2026\u060c \u0643\u0623\u0633 \u0623\u0645\u0645 \u0625\u0641\u0631\u064a\u0642\u064a\u0627\u060c \u0643\u0623\u0633 \u0623\u0645\u0645 \u0625\u0641\u0631\u064a\u0642\u064a\u0627 \u0644\u0644\u0633\u064a\u062f\u0627\u062a\u060c \u0627\u0644\u062a\u0631\u062a\u064a\u0628 \u0648\u0627\u0644\u0625\u062d\u0635\u0627\u0626\u064a\u0627\u062a \u0645\u062d\u062f\u062b\u0629 \u0641\u064a \u0627\u0644\u0648\u0642\u062a \u0627\u0644\u0641\u0639\u0644\u064a.',
  },
};

// ── Metadata ──

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const typedLocale = locale as Locale;
  const meta = HOME_META[typedLocale];
  const pageUrl = `${baseUrl}/${locale}`;

  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = `${baseUrl}/${loc}`;
  }
  languages['x-default'] = `${baseUrl}/${defaultLocale}`;

  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: pageUrl, languages },
    robots: { index: true, follow: true },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: pageUrl,
      siteName: 'Atlas Kings',
      locale: typedLocale === 'fr' ? 'fr_FR' : typedLocale === 'ar' ? 'ar_MA' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: meta.title,
      description: meta.description,
    },
  };
}

// ── Page ──

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  const typedLocale = locale as Locale;
  const t = await getTranslations({ locale, namespace: 'homepage' });

  return (
    <>
      {/* H1 + intro block (homepage.md §4) */}
      <div className="mx-auto w-full max-w-[1280px] px-4 pt-8 pb-4">
        <div className="max-w-[720px]">
          <h1 className="text-2xl font-semibold leading-tight text-text-primary">{t('h1')}</h1>
          <p className="mt-2 text-base leading-relaxed text-text-secondary">{t('intro')}</p>
        </div>
      </div>

      {/* 3-column layout: fixture list (left) + editorial cards (center) + right rail */}
      <div className="mx-auto w-full max-w-[1280px] px-4 pb-12">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[480px_1fr] xl:grid-cols-[480px_1fr_320px]">
          {/* Left column — fixture list (homepage.md §6) */}
          <FixtureList locale={typedLocale} />

          {/* Center column — editorial cards + matches this week (homepage.md §7) */}
          <div className="space-y-6 self-start">
            <EditorialCards locale={typedLocale} />
            <MatchesThisWeek locale={typedLocale} />
          </div>

          {/* Right rail — standings widgets (homepage.md §8, >=1280px only) */}
          <RightRail locale={typedLocale} />
        </div>
      </div>

      {/* Featured videos strip (§J.9 item 9) */}
      <FeaturedVideosStrip locale={typedLocale} />

      {/* About / SEO block (homepage.md §9) */}
      <div className="mx-auto w-full max-w-[1280px] px-4 pb-12">
        <AboutCard content={getHomepageAboutContent(typedLocale)} />
      </div>

      {/* Structured data */}
      <WebSiteJsonLd baseUrl={baseUrl} locale={typedLocale} />
      <OrganizationJsonLd baseUrl={baseUrl} />
      <FaqPageJsonLd faqs={getHomepageAboutContent(typedLocale).faqs} />
    </>
  );
}
