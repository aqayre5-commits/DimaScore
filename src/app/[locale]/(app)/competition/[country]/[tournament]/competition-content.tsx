import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { cacheLife } from 'next/cache';
import { inArray } from 'drizzle-orm';
import type { Locale } from '@/lib/i18n/config';
import { SeoBreadcrumb, type BreadcrumbSegment } from '@/components/chrome/SeoBreadcrumb';
import { ALL_ENTRIES, type MegaMenuEntry } from '@/lib/constants/competitions-mega-menu';
import {
  getMetadataForCompetition,
  getMetadataForCompetitionSeason,
} from '@/lib/constants/tournament-metadata';
import { findCupContentBySlug, findEditionYearBySlug } from '@/lib/constants/cup-content';
import { competitions } from '@/lib/db/schema';
import { db } from '@/lib/db/client';
import { getCompetitionById } from '@/lib/db/queries/league';
import { renderCupPage } from './render-cup-page';
import { renderLeaguePage } from './render-league-page';
import { renderGenericCupPage } from './render-generic-cup-page';

/** Resolve a tournament slug to its mega-menu entry (current locale, then any). */
export function resolveEntry(tournament: string, locale: Locale): MegaMenuEntry | undefined {
  return (
    ALL_ENTRIES.find((entry) => entry.slugs[locale] === tournament) ??
    ALL_ENTRIES.find((entry) => Object.values(entry.slugs).some((slug) => slug === tournament))
  );
}

const LEFT_RAIL_COMP_IDS = [200, 201, 822, 1, 922, 6, 39, 140, 78, 135, 61, 2, 3, 848];

async function getLeftRailLogos(): Promise<Record<number, string | null>> {
  'use cache';
  cacheLife('minutes');
  const rows = await db
    .select({ id: competitions.id, logoUrl: competitions.logoUrl })
    .from(competitions)
    .where(inArray(competitions.id, LEFT_RAIL_COMP_IDS));
  return Object.fromEntries(rows.map((r) => [r.id, r.logoUrl]));
}

async function getCachedCompetition(competitionId: number) {
  'use cache';
  cacheLife('minutes');
  return getCompetitionById(db, competitionId);
}

interface CompetitionContentProps {
  /** Raw (still percent-encoded) locale string from the route. */
  rawLocale: string;
  /** Raw (still percent-encoded) country slug from the route. */
  rawCountry: string;
  /** Raw (still percent-encoded) tournament slug from the route. */
  rawTournament: string;
  /** Explicit season from the /[season] route; undefined = current season. */
  season?: number;
}

/**
 * Single source of competition-route content: resolves the slug to a
 * competition, picks the render path (cup / league / generic-cup / coming-soon),
 * and dispatches. Reads NO request-time dynamic APIs (no searchParams), so the
 * default route (season undefined) prerenders fully static.
 */
export async function CompetitionContent({
  rawLocale,
  rawCountry,
  rawTournament,
  season,
}: CompetitionContentProps) {
  const typedLocale = rawLocale as Locale;
  const tournament = decodeURIComponent(rawTournament);
  const seasonParam = season != null ? String(season) : undefined;

  const entry = resolveEntry(tournament, typedLocale);
  const slugCupContent = findCupContentBySlug(tournament);
  let metadata = entry ? getMetadataForCompetition(entry.competitionId) : undefined;
  if (slugCupContent && entry && metadata?.type === 'cup') {
    const editionYear = findEditionYearBySlug(entry.competitionId, tournament);
    if (editionYear != null && editionYear !== metadata.editionYear) {
      const seasonMeta = getMetadataForCompetitionSeason(entry.competitionId, editionYear);
      if (seasonMeta) metadata = seasonMeta;
    }
  }

  // Cup-metadata path (constants-driven, e.g. WC 2026 / AFCON / WAFCON)
  if (metadata?.type === 'cup') {
    const competitionLogos = await getLeftRailLogos();
    return renderCupPage(
      metadata,
      typedLocale,
      rawLocale,
      rawCountry,
      rawTournament,
      seasonParam,
      competitionLogos,
    );
  }

  if (!entry) {
    // Slug isn't a recognized competition (not in ALL_ENTRIES or cup-content) → real 404, not a
    // 200 soft-404 shell. This covers raw DB slugs (e.g. `world-cup` vs `world-cup-2026`) and
    // garbage. Covered-but-dataless competitions (entry resolves, no DB row) still show ComingSoon.
    if (!slugCupContent) notFound();
    return <ComingSoon locale={rawLocale} tournament={tournament} />;
  }

  const competition = await getCachedCompetition(entry.competitionId);
  if (!competition) {
    return <ComingSoon locale={rawLocale} tournament={tournament} />;
  }

  const competitionLogos = await getLeftRailLogos();

  if (competition.type === 'League') {
    return renderLeaguePage(
      competition,
      entry,
      typedLocale,
      rawLocale,
      rawCountry,
      rawTournament,
      seasonParam,
      competitionLogos,
    );
  }

  if (competition.type === 'Cup') {
    return renderGenericCupPage(
      competition,
      entry,
      typedLocale,
      rawLocale,
      rawCountry,
      seasonParam,
      competitionLogos,
    );
  }

  return <ComingSoon locale={rawLocale} tournament={tournament} />;
}

async function ComingSoon({ locale, tournament }: { locale: string; tournament: string }) {
  const t = await getTranslations({ locale, namespace: 'breadcrumb' });
  const tP = await getTranslations({ locale, namespace: 'placeholder' });
  const displayName = tournament.replace(/-/g, ' ');
  const breadcrumbs: BreadcrumbSegment[] = [
    { label: t('football'), href: `/${locale}` },
    { label: displayName },
  ];

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-8">
      <SeoBreadcrumb segments={breadcrumbs} compact />
      <div className="mt-8 flex flex-col items-center gap-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-bg-surface-2">
          <span className="text-2xl">🏆</span>
        </div>
        <h1 className="text-xl font-semibold capitalize text-text-primary">{displayName}</h1>
        <p className="text-sm text-text-tertiary">{tP('competitionComingSoon')}</p>
      </div>
    </div>
  );
}
