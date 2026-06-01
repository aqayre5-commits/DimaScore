import { cacheLife } from 'next/cache';
import type { Locale } from '@/lib/i18n/config';
import type { MegaMenuEntry } from '@/lib/constants/competitions-mega-menu';
import type { CupMetadata } from '@/lib/constants/tournament-metadata';
import { getCompetitionById } from '@/lib/db/queries/league';
import { db } from '@/lib/db/client';
import { renderCupPage } from './render-cup-page';
import { renderLeaguePage } from './render-league-page';
import { renderGenericCupPage } from './render-generic-cup-page';

async function getCachedCompetition(competitionId: number) {
  'use cache';
  cacheLife('minutes');
  return getCompetitionById(db, competitionId);
}

interface CompetitionContentProps {
  searchParams: Promise<{ season?: string }>;
  renderPath: 'cup' | 'league' | 'generic-cup';
  locale: Locale;
  rawLocale: string;
  rawCountry: string;
  rawTournament: string;
  entry: MegaMenuEntry;
  metadata?: CupMetadata;
  competitionLogos: Record<number, string | null>;
}

export async function CompetitionContent({
  searchParams,
  renderPath,
  locale,
  rawLocale,
  rawCountry,
  rawTournament,
  entry,
  metadata,
  competitionLogos,
}: CompetitionContentProps) {
  const { season: seasonParam } = await searchParams;

  if (renderPath === 'cup' && metadata) {
    return renderCupPage(
      metadata,
      locale,
      rawLocale,
      rawCountry,
      rawTournament,
      seasonParam,
      competitionLogos,
    );
  }

  const competition = await getCachedCompetition(entry.competitionId);
  if (!competition) return null;

  if (renderPath === 'league') {
    return renderLeaguePage(
      competition,
      entry,
      locale,
      rawLocale,
      rawCountry,
      rawTournament,
      seasonParam,
      competitionLogos,
    );
  }

  return renderGenericCupPage(
    competition,
    entry,
    locale,
    rawLocale,
    rawCountry,
    seasonParam,
    competitionLogos,
  );
}
