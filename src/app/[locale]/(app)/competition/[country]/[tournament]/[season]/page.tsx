import { setRequestLocale } from 'next-intl/server';
import { CompetitionContent } from '../competition-content';

interface PageProps {
  params: Promise<{ locale: string; country: string; tournament: string; season: string }>;
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
