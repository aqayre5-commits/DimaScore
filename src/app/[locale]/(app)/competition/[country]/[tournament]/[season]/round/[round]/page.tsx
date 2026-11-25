import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { locales, defaultLocale, type Locale } from '@/lib/i18n/config';
import { getCountrySlug } from '@/lib/constants/country-slugs';
import { BASE_URL } from '@/lib/constants/site';
import { isSeasonSegment } from '@/lib/seo/competition-tab-redirects';
import { CompetitionContent, resolveEntry } from '../../../competition-content';

interface PageProps {
  params: Promise<{
    locale: string;
    country: string;
    tournament: string;
    season: string;
    round: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, country: rawCountry, tournament: rawTournament, season, round: rawRound } =
    await params;
  if (!isSeasonSegment(season)) notFound();
  const typedLocale = locale as Locale;
  const round = decodeURIComponent(rawRound);
  const entry = resolveEntry(decodeURIComponent(rawTournament), typedLocale);
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    const locSlug = entry?.slugs[loc as Locale] ?? decodeURIComponent(rawTournament);
    const locCountry = entry?.countryKey
      ? getCountrySlug(entry.countryKey, loc as Locale)
      : decodeURIComponent(rawCountry);
    languages[loc] =
      `${BASE_URL}/${loc}/competition/${locCountry}/${locSlug}/${season}/round/${encodeURIComponent(round)}`;
  }
  languages['x-default'] = languages[defaultLocale];
  return {
    title: `${round.replace(/-/g, ' ')} · ${season}`,
    alternates: { canonical: languages[typedLocale], languages },
    robots: { index: true, follow: true },
  };
}

export default async function CupSeasonRoundPage({ params }: PageProps) {
  const { locale, country: rawCountry, tournament: rawTournament, season, round } = await params;
  setRequestLocale(locale);
  if (!isSeasonSegment(season)) notFound();
  const seasonYear = Number(season);
  return (
    <CompetitionContent
      rawLocale={locale}
      rawCountry={rawCountry}
      rawTournament={rawTournament}
      season={Number.isFinite(seasonYear) ? seasonYear : undefined}
      roundSlug={decodeURIComponent(round)}
    />
  );
}
