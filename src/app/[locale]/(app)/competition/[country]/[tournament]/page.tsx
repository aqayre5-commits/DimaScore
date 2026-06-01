import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales, defaultLocale, type Locale } from '@/lib/i18n/config';
import { SeoBreadcrumb, type BreadcrumbSegment } from '@/components/chrome/SeoBreadcrumb';
import {
  getMetadataForCompetition,
  getMetadataForCompetitionSeason,
} from '@/lib/constants/tournament-metadata';
import { ALL_ENTRIES, type MegaMenuEntry } from '@/lib/constants/competitions-mega-menu';
import {
  getCupContent,
  findCupContentBySlug,
  findEditionYearBySlug,
} from '@/lib/constants/cup-content';
import { db } from '@/lib/db/client';
import { competitions } from '@/lib/db/schema';
import { inArray } from 'drizzle-orm';
import { getCompetitionById, getCurrentSeasonYear } from '@/lib/db/queries/league';
import { BASE_URL } from '@/lib/constants/site';
import { renderCupPage } from './render-cup-page';
import { renderLeaguePage } from './render-league-page';
import { renderGenericCupPage } from './render-generic-cup-page';

export const revalidate = 60;

interface PageProps {
  params: Promise<{ locale: string; country: string; tournament: string }>;
  searchParams: Promise<{ season?: string }>;
}

const baseUrl = BASE_URL;

// ── Helpers ──

function resolveEntry(tournament: string, locale: Locale): MegaMenuEntry | undefined {
  // Try current locale first, then fall back to any locale match
  return (
    ALL_ENTRIES.find((entry) => entry.slugs[locale] === tournament) ??
    ALL_ENTRIES.find((entry) => Object.values(entry.slugs).some((slug) => slug === tournament))
  );
}

const LEFT_RAIL_COMP_IDS = [200, 201, 822, 1, 922, 6, 39, 140, 78, 135, 61, 2, 3, 848];

async function getLeftRailLogos(): Promise<Record<number, string | null>> {
  const rows = await db
    .select({ id: competitions.id, logoUrl: competitions.logoUrl })
    .from(competitions)
    .where(inArray(competitions.id, LEFT_RAIL_COMP_IDS));
  return Object.fromEntries(rows.map((r) => [r.id, r.logoUrl]));
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

// ── Page ──

export default async function CompetitionPage({ params, searchParams }: PageProps) {
  const { locale, country: rawCountry, tournament: rawTournament } = await params;
  setRequestLocale(locale);
  const { season: seasonParam } = await searchParams;
  const tournament = decodeURIComponent(rawTournament);
  const typedLocale = locale as Locale;
  const t = await getTranslations({ locale, namespace: 'breadcrumb' });
  const tP = await getTranslations({ locale, namespace: 'placeholder' });

  // Gate: only render full page for competitions with metadata.
  // Slug-aware: if slug matches a specific edition's cup content, use that edition's metadata.
  const entry = resolveEntry(tournament, typedLocale);
  const slugCupContent = findCupContentBySlug(tournament);
  let metadata = entry ? getMetadataForCompetition(entry.competitionId) : undefined;
  // If the slug resolves to a different edition than the default, override metadata
  if (slugCupContent && entry && metadata?.type === 'cup') {
    const editionYear = findEditionYearBySlug(entry.competitionId, tournament);
    if (editionYear != null && editionYear !== metadata.editionYear) {
      const seasonMeta = getMetadataForCompetitionSeason(entry.competitionId, editionYear);
      if (seasonMeta) metadata = seasonMeta;
    }
  }

  // Fetch left rail logos once (shared across all render paths)
  const competitionLogos = await getLeftRailLogos();

  // League or generic cup branch: competition exists in DB but no hardcoded cup metadata
  if (!metadata || metadata.type !== 'cup') {
    if (entry) {
      const competition = await getCompetitionById(db, entry.competitionId);
      if (competition && competition.type === 'League') {
        return renderLeaguePage(
          competition,
          entry,
          typedLocale,
          locale,
          rawCountry,
          rawTournament,
          seasonParam,
          competitionLogos,
        );
      }
      if (competition && competition.type === 'Cup') {
        return renderGenericCupPage(
          competition,
          entry,
          typedLocale,
          locale,
          rawCountry,
          seasonParam,
          competitionLogos,
        );
      }
    }

    // Fallback: coming soon
    const displayName = tournament.replace(/-/g, ' ');
    const breadcrumbs: BreadcrumbSegment[] = [
      { label: t('football'), href: `/${locale}` },
      { label: displayName },
    ];

    return (
      <div className="mx-auto w-full max-w-[1280px] px-4 py-8">
        <SeoBreadcrumb segments={breadcrumbs} />
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

  // ── Cup full render — delegated to render-cup-page ──
  return renderCupPage(
    metadata,
    typedLocale,
    locale,
    rawCountry,
    rawTournament,
    seasonParam,
    competitionLogos,
  );
}
