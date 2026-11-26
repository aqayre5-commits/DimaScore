import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { locales, defaultLocale, type Locale } from '@/lib/i18n/config';
import { getCountrySlug } from '@/lib/constants/country-slugs';
import { BASE_URL } from '@/lib/constants/site';
import { redirectPlayoffsAlias } from '@/lib/competitions/round-redirect';
import { isMissingBestThirdsPath } from '@/lib/competitions/best-thirds-round';
import { CompetitionContent, resolveEntry } from '../../competition-content';

interface PageProps {
  params: Promise<{ locale: string; country: string; tournament: string; round: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, country: rawCountry, tournament: rawTournament, round: rawRound } = await params;
  const typedLocale = locale as Locale;
  const round = decodeURIComponent(rawRound);
  if (
    isMissingBestThirdsPath(
      `/${locale}/competition/${rawCountry}/${rawTournament}/round/${encodeURIComponent(round)}`,
    )
  ) {
    notFound();
  }
  const entry = resolveEntry(decodeURIComponent(rawTournament), typedLocale);
  if (entry) {
    redirectPlayoffsAlias(
      entry.competitionId,
      round,
      `/${locale}/competition/${rawCountry}/${rawTournament}`,
    );
  }
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    const locEntry = entry;
    const locSlug = locEntry?.slugs[loc as Locale] ?? decodeURIComponent(rawTournament);
    const locCountry = locEntry?.countryKey
      ? getCountrySlug(locEntry.countryKey, loc as Locale)
      : decodeURIComponent(rawCountry);
    languages[loc] =
      `${BASE_URL}/${loc}/competition/${locCountry}/${locSlug}/round/${encodeURIComponent(round)}`;
  }
  languages['x-default'] = languages[defaultLocale];
  const pageUrl = languages[typedLocale];
  return {
    title: round.replace(/-/g, ' '),
    alternates: { canonical: pageUrl, languages },
    robots: { index: true, follow: true },
  };
}

export default async function CupRoundPage({ params }: PageProps) {
  const { locale, country: rawCountry, tournament: rawTournament, round } = await params;
  setRequestLocale(locale);
  if (
    isMissingBestThirdsPath(`/${locale}/competition/${rawCountry}/${rawTournament}/round/${round}`)
  ) {
    notFound();
  }
  const entry = resolveEntry(decodeURIComponent(rawTournament), locale as Locale);
  if (entry) {
    redirectPlayoffsAlias(
      entry.competitionId,
      decodeURIComponent(round),
      `/${locale}/competition/${rawCountry}/${rawTournament}`,
    );
  }
  return (
    <CompetitionContent
      rawLocale={locale}
      rawCountry={rawCountry}
      rawTournament={rawTournament}
      roundSlug={decodeURIComponent(round)}
    />
  );
}
