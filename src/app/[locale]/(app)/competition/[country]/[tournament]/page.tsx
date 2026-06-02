import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { locales, defaultLocale, type Locale } from '@/lib/i18n/config';
import { findCupContentBySlug } from '@/lib/constants/cup-content';
import { ALL_ENTRIES, TOP_NAV_COMPETITION_IDS } from '@/lib/constants/competitions-mega-menu';
import { getCountrySlug } from '@/lib/constants/country-slugs';
import { db } from '@/lib/db/client';
import { getCompetitionById, getCurrentSeasonYear } from '@/lib/db/queries/league';
import { BASE_URL } from '@/lib/constants/site';
import { CompetitionContent, resolveEntry } from './competition-content';

interface PageProps {
  params: Promise<{ locale: string; country: string; tournament: string }>;
}

const baseUrl = BASE_URL;

// ── Static params ──
// Prebuild the top competitions (default season) so navigation to them serves a
// fully static, prefetch-with-data response — instant, skeleton-free in-app nav.
// Non-top competitions still render on demand (dynamicParams defaults to true).

export function generateStaticParams() {
  const params: { locale: string; country: string; tournament: string }[] = [];
  for (const id of TOP_NAV_COMPETITION_IDS) {
    const entry = ALL_ENTRIES.find((e) => e.competitionId === id);
    if (!entry) continue;
    for (const locale of locales) {
      params.push({
        locale,
        country: getCountrySlug(entry.countryKey, locale),
        tournament: entry.slugs[locale],
      });
    }
  }
  return params;
}

// ── Metadata ──

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, country: rawCountry, tournament: rawTournament } = await params;
  const country = decodeURIComponent(rawCountry);
  const tournament = decodeURIComponent(rawTournament);
  const typedLocale = locale as Locale;

  const cupContent = findCupContentBySlug(tournament);
  if (cupContent) {
    const meta = cupContent.meta[typedLocale];
    const pageUrl = cupContent.urls[typedLocale];
    const languages: Record<string, string> = {};
    for (const loc of locales) {
      languages[loc] = cupContent.urls[loc as Locale];
    }
    languages['x-default'] = cupContent.urls[defaultLocale];

    return {
      title: meta.title,
      description: meta.description,
      alternates: { canonical: pageUrl, languages },
      robots: { index: true, follow: true },
      openGraph: {
        title: meta.title,
        description: meta.description,
        url: pageUrl,
        siteName: 'DimaScore',
        locale: typedLocale === 'fr' ? 'fr_FR' : typedLocale === 'ar' ? 'ar_MA' : 'en_US',
        type: 'website',
        images: [
          {
            url: `${baseUrl}/og/${cupContent.titles.en.toLowerCase().replace(/\s+/g, '-')}.png`,
            alt: cupContent.titles[typedLocale],
          },
        ],
      },
      twitter: {
        card: 'summary_large_image' as const,
        title: meta.title,
        description: meta.description,
      },
    };
  }

  // Try to resolve a proper name from mega menu + DB
  const entry = resolveEntry(tournament, typedLocale);
  let displayName = tournament.replace(/-/g, ' ');
  let description = `${displayName} — DimaScore`;

  if (entry) {
    const competition = await getCompetitionById(db, entry.competitionId);
    if (competition) {
      displayName = competition.name[typedLocale] ?? competition.name['en'] ?? displayName;
      const seasonYear = await getCurrentSeasonYear(db, competition.id);
      const season = seasonYear ? `${seasonYear}/${(seasonYear + 1) % 100}` : '';
      displayName = season ? `${displayName} ${season}` : displayName;
      description = `${displayName} — standings, matches, and statistics | DimaScore`;
    }
  }

  const languages: Record<string, string> = {};
  for (const loc of locales) {
    const locEntry = resolveEntry(tournament, loc as Locale) ?? entry;
    const locSlug = locEntry?.slugs[loc as Locale] ?? tournament;
    languages[loc] = `${baseUrl}/${loc}/competition/${country}/${locSlug}`;
  }
  languages['x-default'] = languages[defaultLocale];

  return {
    title: `${displayName} | DimaScore`,
    description,
    alternates: { languages },
    robots: { index: true, follow: true },
  };
}

// ── Page (default season — static for the top competitions) ──

export default async function CompetitionPage({ params }: PageProps) {
  const { locale, country: rawCountry, tournament: rawTournament } = await params;
  setRequestLocale(locale);
  return (
    <CompetitionContent rawLocale={locale} rawCountry={rawCountry} rawTournament={rawTournament} />
  );
}
