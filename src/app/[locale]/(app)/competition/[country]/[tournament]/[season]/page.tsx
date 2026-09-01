import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { locales, defaultLocale, type Locale } from '@/lib/i18n/config';
import { db } from '@/lib/db/client';
import { getCompetitionById, getCurrentSeasonYear } from '@/lib/db/queries/league';
import { BASE_URL } from '@/lib/constants/site';
import { getCountrySlug } from '@/lib/constants/country-slugs';
import { CompetitionContent, resolveEntry } from '../competition-content';

interface PageProps {
  params: Promise<{ locale: string; country: string; tournament: string; season: string }>;
}

// ── Metadata ──
// Historical-season pages need their own season-specific title + a canonical, else every season of
// every competition ships the generic root-layout title ("DimaScore") with no canonical — hundreds
// of near-duplicate pages. The current-season URL (…/{currentYear}) duplicates the base page, so it
// canonicalises there; past seasons canonicalise to themselves.
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, country: rawCountry, tournament: rawTournament, season } = await params;
  const typedLocale = locale as Locale;
  const country = decodeURIComponent(rawCountry);
  const tournament = decodeURIComponent(rawTournament);
  const seasonYear = Number(season);

  const entry = resolveEntry(tournament, typedLocale);
  if (!entry) notFound();

  const competition = await getCompetitionById(db, entry.competitionId);
  let displayName = tournament.replace(/-/g, ' ');
  if (competition)
    displayName = competition.name[typedLocale] ?? competition.name['en'] ?? displayName;
  const seasonLabel = Number.isFinite(seasonYear) ? `${seasonYear}/${(seasonYear + 1) % 100}` : '';
  const fullName = seasonLabel ? `${displayName} ${seasonLabel}` : displayName;
  const title = `${fullName} | DimaScore`;
  const description = `${fullName} — standings, results, and statistics | DimaScore`;

  const seasonUrl = `${BASE_URL}/${locale}/competition/${country}/${tournament}/${season}`;
  const baseUrlNoSeason = `${BASE_URL}/${locale}/competition/${country}/${tournament}`;
  const currentYear = competition ? await getCurrentSeasonYear(db, competition.id) : null;
  const canonical = currentYear && seasonYear === currentYear ? baseUrlNoSeason : seasonUrl;

  const languages: Record<string, string> = {};
  for (const loc of locales) {
    const locEntry = resolveEntry(tournament, loc as Locale) ?? entry;
    const locSlug = locEntry?.slugs[loc as Locale] ?? tournament;
    const locCountry = locEntry?.countryKey
      ? getCountrySlug(locEntry.countryKey, loc as Locale)
      : country;
    languages[loc] = `${BASE_URL}/${loc}/competition/${locCountry}/${locSlug}/${season}`;
  }
  languages['x-default'] = languages[defaultLocale];

  return {
    title,
    description,
    alternates: { canonical, languages },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: seasonUrl,
      siteName: 'DimaScore',
      locale: typedLocale === 'fr' ? 'fr_FR' : typedLocale === 'ar' ? 'ar_MA' : 'en_US',
      type: 'website',
    },
  };
}

// Historical-season view (e.g. /competition/morocco/botola-pro/2024). Dynamic
// on demand — the default (current-season) page is the static one. The season
// segment is dynamic, so the static `/bracket` segment still takes precedence.
export default async function CompetitionSeasonPage({ params }: PageProps) {
  const { locale, country: rawCountry, tournament: rawTournament, season } = await params;
  setRequestLocale(locale);
  const seasonYear = Number(season);
  return (
    <CompetitionContent
      rawLocale={locale}
      rawCountry={rawCountry}
      rawTournament={rawTournament}
      season={Number.isFinite(seasonYear) ? seasonYear : undefined}
    />
  );
}
