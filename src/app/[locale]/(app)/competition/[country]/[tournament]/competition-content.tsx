import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { cacheLife } from 'next/cache';
import { inArray } from 'drizzle-orm';
import type { Locale } from '@/lib/i18n/config';
import { SeoBreadcrumb, type BreadcrumbSegment } from '@/components/chrome/SeoBreadcrumb';
import { type MegaMenuEntry } from '@/lib/constants/competitions-mega-menu';
import { resolveCompetitionEntry } from '@/lib/competitions/resolve-competition';
import {
  getMetadataForCompetition,
  getMetadataForCompetitionSeason,
} from '@/lib/constants/tournament-metadata';
import { findCupContentBySlug, findEditionYearBySlug } from '@/lib/constants/cup-content';
import { competitions } from '@/lib/db/schema';
import { db } from '@/lib/db/client';
import { getCachedCompetition } from '@/lib/competitions/cached-competition';
import { resolveCompetitionSeason } from '@/lib/competitions/league-season-query';
import { renderCupPage } from './render-cup-page';
import { renderLeaguePage } from './render-league-page';
import { renderGenericCupPage } from './render-generic-cup-page';
import { renderDomesticCupPage } from './render-domestic-cup-page';
import { getCompetitionFormat } from '@/lib/competitions/formats';
import { NavCompetitionRegister } from '@/components/chrome/NavCompetitionRegister';
import { getRailProps } from '@/components/match/centre/rail-props';
import { GROUP_STAGE_TEMPLATE_IDS } from '@/lib/competitions/group-stage';

/** Normalize slug → competition entry. Locale is unused; aliases share one ID. */
export function resolveEntry(tournament: string, locale?: Locale): MegaMenuEntry | undefined {
  return resolveCompetitionEntry(tournament);
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

interface CompetitionContentProps {
  /** Raw (still percent-encoded) locale string from the route. */
  rawLocale: string;
  /** Raw (still percent-encoded) country slug from the route. */
  rawCountry: string;
  /** Raw (still percent-encoded) tournament slug from the route. */
  rawTournament: string;
  /** Explicit season from the /[season] route; undefined = current season. */
  season?: number;
  /** Round slug from the /round/[round] route. */
  roundSlug?: string;
}

/**
 * Single source of competition-route content: resolves the slug to a
 * competition, picks the render path (cup / league / generic-cup / coming-soon),
 * and dispatches. Reads NO request-time dynamic APIs (no searchParams), so the
 * default route (season undefined) prerenders fully static.
 */
export function CompetitionContent(props: CompetitionContentProps) {
  return (
    <>
      {/* Sibling async components render concurrently: the rail lookup used to be awaited here
       *before* the body started, putting it in front of every other read on the page. */}
      <NavRegistration rawLocale={props.rawLocale} rawTournament={props.rawTournament} />
      <CompetitionBody {...props} />
    </>
  );
}

/** The mobile navbar competition picker (template "PL ▾") gets this competition and the rail. */
async function NavRegistration({
  rawLocale,
  rawTournament,
}: Pick<CompetitionContentProps, 'rawLocale' | 'rawTournament'>) {
  const entry = resolveEntry(decodeURIComponent(rawTournament));
  const nav = await getRailProps(rawLocale as Locale, entry?.competitionId ?? -1);
  return <NavCompetitionRegister current={nav.current} rail={nav.rail} />;
}

async function CompetitionBody({
  rawLocale,
  rawCountry,
  rawTournament,
  season,
  roundSlug,
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

  // Group-stage tournaments (World Cup, AFCON, WAFCON, EURO, CAF club cups, women's UEFA cups,
  // qualifiers, Nations League) use the redesigned cup template when the competition has a DB
  // row. An edition slug (wafcon-2024) picks its season when no /[season] segment is given.
  if (entry && GROUP_STAGE_TEMPLATE_IDS.has(entry.competitionId)) {
    const groupComp = await getCachedCompetition(entry.competitionId);
    if (groupComp) {
      const editionYear = findEditionYearBySlug(entry.competitionId, tournament);
      return renderDomesticCupPage(
        groupComp,
        entry,
        typedLocale,
        rawLocale,
        rawCountry,
        rawTournament,
        seasonParam ?? (editionYear != null ? String(editionYear) : undefined),
        roundSlug,
      );
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

  // Everything below the competition row needs only the competition id, which the slug already
  // gave us. Start the independent cached reads now so they overlap with the competition lookup
  // (and with each other) instead of queueing behind it. The renderers await the same memoised
  // promises (React `cache`), so nothing is fetched twice.
  const competitionPromise = getCachedCompetition(entry.competitionId);
  const requestedYear = season != null && Number.isFinite(season) ? season : null;
  const warm: Promise<unknown>[] = [
    getRailProps(typedLocale, entry.competitionId),
    resolveCompetitionSeason(entry.competitionId, requestedYear),
  ];
  // Warm-ups are best-effort: a failure here resurfaces where the renderer awaits the same promise.
  for (const w of warm) w.catch(() => {});
  const competition = await competitionPromise;
  if (!competition) {
    return <ComingSoon locale={rawLocale} tournament={tournament} />;
  }

  if (competition.type === 'League') {
    return renderLeaguePage(
      competition,
      entry,
      typedLocale,
      rawLocale,
      rawCountry,
      rawTournament,
      seasonParam,
    );
  }

  const competitionLogos = await getLeftRailLogos();

  if (competition.type === 'Cup') {
    const format = getCompetitionFormat(competition.id);
    // Domestic cups and the UEFA league-phase cups (format rows with a configured league phase:
    // CL 2, EL 3, ECL 848) use the reference template. Others stay on the generic cup page.
    if (
      format?.kind === 'domestic-cup' ||
      (format?.kind === 'league-phase-knockout' && format.leaguePhase != null)
    ) {
      return renderDomesticCupPage(
        competition,
        entry,
        typedLocale,
        rawLocale,
        rawCountry,
        rawTournament,
        seasonParam,
        roundSlug,
      );
    }
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
