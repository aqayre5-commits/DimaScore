import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { locales, defaultLocale, type Locale } from '@/lib/i18n/config';
import { findCupContentBySlug } from '@/lib/constants/cup-content';
import { ALL_ENTRIES, TOP_NAV_COMPETITION_IDS } from '@/lib/constants/competitions-mega-menu';
import { getCountrySlug } from '@/lib/constants/country-slugs';
import { db } from '@/lib/db/client';
import { getCompetitionById } from '@/lib/db/queries/league';
import { resolveCompetitionSeason } from '@/lib/competitions/league-season-query';
import { formatSeasonLabel } from '@/lib/competitions/league-season';
import { BASE_URL } from '@/lib/constants/site';
import {
  BOTOLA_2_COMPETITION_ID,
  botola2CompetitionMetaDescription,
  botola2CompetitionPageTitle,
} from '@/lib/seo/botola-2-classement';
import {
  BOTOLA_PRO_COMPETITION_ID,
  botolaProCompetitionHreflang,
  botolaProCompetitionMetaDescription,
  botolaProCompetitionPageTitle,
} from '@/lib/seo/botola-classement';
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
  // Unrecognized slug (cup-content handled above; not in ALL_ENTRIES here) → 404 in this blocking
  // metadata phase so the response commits a real 404 status. notFound() inside the streamed page
  // body renders the 404 UI but leaves the HTTP status at 200 under cacheComponents.
  if (!entry) notFound();
  let displayName = tournament.replace(/-/g, ' ');
  let description = `${displayName} — DimaScore`;
  let title: string | null = null;

  if (entry) {
    const competition = await getCompetitionById(db, entry.competitionId);
    if (competition) {
      displayName = competition.name[typedLocale] ?? competition.name['en'] ?? displayName;
      const { seasonYear } = await resolveCompetitionSeason(competition.id, null);
      const season = seasonYear ? formatSeasonLabel(seasonYear) : '';
      displayName = season ? `${displayName} ${season}` : displayName;
      if (competition.id === BOTOLA_2_COMPETITION_ID) {
        title = botola2CompetitionPageTitle(typedLocale, season);
        description = botola2CompetitionMetaDescription(typedLocale, displayName);
      } else if (competition.id === BOTOLA_PRO_COMPETITION_ID) {
        title = botolaProCompetitionPageTitle(typedLocale, season);
        description = botolaProCompetitionMetaDescription(typedLocale, displayName);
      } else {
        description = `${displayName} — standings, matches, and statistics | DimaScore`;
      }
    }
  }

  const languages: Record<string, string> = {};
  for (const loc of locales) {
    const locEntry = resolveEntry(tournament, loc as Locale) ?? entry;
    const locSlug = locEntry?.slugs[loc as Locale] ?? tournament;
    const locCountry = locEntry?.countryKey
      ? getCountrySlug(locEntry.countryKey, loc as Locale)
      : country;
    languages[loc] = `${baseUrl}/${loc}/competition/${locCountry}/${locSlug}`;
  }
  languages['x-default'] = languages[defaultLocale];

  const isBotolaPro = entry.competitionId === BOTOLA_PRO_COMPETITION_ID;
  const hubLanguages = isBotolaPro ? botolaProCompetitionHreflang(baseUrl) : languages;
  const canonical = hubLanguages[typedLocale] ?? languages[typedLocale];

  return {
    title: title ?? `${displayName} | DimaScore`,
    description,
    alternates: { canonical, languages: hubLanguages },
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
