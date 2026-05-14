import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { locales, defaultLocale, type Locale } from '@/lib/i18n/config';
import { InnerPageShell } from '@/components/layout/InnerPageShell';
import { SeoBreadcrumb, type BreadcrumbSegment } from '@/components/chrome/SeoBreadcrumb';
import { getMetadataForCompetition } from '@/lib/constants/tournament-metadata';
import { MEGA_MENU_SECTIONS, type MegaMenuEntry } from '@/lib/constants/competitions-mega-menu';

interface PageProps {
  params: Promise<{ locale: string; country: string; tournament: string }>;
}

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

/**
 * Per-locale hand-written metadata for WC 2026 (competition-cup.md Section 2).
 */
const WC_2026_META: Record<Locale, { title: string; description: string }> = {
  fr: {
    title: 'Coupe du Monde 2026 — Calendrier, groupes, classement et phase finale | Atlas Kings',
    description:
      "Suivez la Coupe du Monde FIFA 2026 en direct: calendrier des 104 matchs, les 12 groupes, classement de chaque groupe, phase a elimination directe. Le Maroc dans le Groupe C avec l'Argentine, l'Arabie saoudite et l'Egypte.",
  },
  en: {
    title: 'FIFA World Cup 2026 — Fixtures, groups, standings and knockout | Atlas Kings',
    description:
      'Follow the FIFA World Cup 2026 live: 104-match schedule, 12 groups, standings per group, knockout bracket. Morocco in Group C with Argentina, Saudi Arabia, and Egypt.',
  },
  ar: {
    title: 'كأس العالم 2026 — الجدول، المجموعات، الترتيب ومرحلة الإقصاء | أطلس كينغز',
    description:
      'تابعوا كأس العالم فيفا 2026 مباشرة: جدول 104 مباريات، 12 مجموعة، ترتيب كل مجموعة، الأدوار الإقصائية. المغرب في المجموعة C مع الأرجنتين والمملكة العربية السعودية ومصر.',
  },
};

const WC_2026_SLUGS = ['coupe-du-monde-2026', 'world-cup-2026', 'كأس-العالم-2026'];

/**
 * Resolve a tournament slug to a known mega-menu entry (and thus a competition ID).
 * Returns undefined if the slug doesn't match any implemented competition.
 */
function resolveEntry(tournament: string, locale: Locale): MegaMenuEntry | undefined {
  for (const section of MEGA_MENU_SECTIONS) {
    for (const entry of section.entries) {
      if (entry.slugs[locale] === tournament) return entry;
    }
  }
  return undefined;
}

function isWc2026(tournament: string): boolean {
  return WC_2026_SLUGS.includes(tournament);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, country, tournament } = await params;
  const typedLocale = locale as Locale;

  if (isWc2026(tournament)) {
    const meta = WC_2026_META[typedLocale];
    const languages: Record<string, string> = {};
    languages['fr'] = `${baseUrl}/fr/competition/fifa/coupe-du-monde-2026`;
    languages['en'] = `${baseUrl}/en/competition/fifa/world-cup-2026`;
    languages['ar'] = `${baseUrl}/ar/competition/فيفا/كأس-العالم-2026`;
    languages['x-default'] = languages[defaultLocale];

    return {
      title: meta.title,
      description: meta.description,
      alternates: { languages },
    };
  }

  // Fallback for all other competition URLs
  const displayName = tournament.replace(/-/g, ' ');
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = `${baseUrl}/${loc}/competition/${country}/${tournament}`;
  }
  languages['x-default'] = languages[defaultLocale];

  return {
    title: `${displayName} | Atlas Kings`,
    description: `${displayName} — Atlas Kings`,
    alternates: { languages },
  };
}

export default async function CompetitionPage({ params }: PageProps) {
  const { locale, country, tournament } = await params;
  const typedLocale = locale as Locale;
  const t = await getTranslations({ locale, namespace: 'breadcrumb' });
  const tP = await getTranslations({ locale, namespace: 'placeholder' });

  // Gate: only render full page for competitions with metadata in tournament-metadata.ts
  const entry = resolveEntry(tournament, typedLocale);
  const metadata = entry ? getMetadataForCompetition(entry.competitionId) : undefined;

  // If no metadata, this competition page isn't implemented yet — show placeholder
  if (!metadata || metadata.type !== 'cup') {
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

  // ── WC 2026 full render ──

  const pageTitle =
    locale === 'ar'
      ? 'كأس العالم فيفا 2026'
      : locale === 'en'
        ? 'FIFA World Cup 2026'
        : 'Coupe du Monde FIFA 2026';

  const breadcrumbSegments: BreadcrumbSegment[] = [
    { label: t('football'), href: `/${locale}` },
    { label: t('international') },
    { label: 'FIFA' },
    { label: pageTitle },
  ];

  const pageHeader = (
    <>
      <SeoBreadcrumb segments={breadcrumbSegments} />
      <div className="px-4 py-6">
        <h1 className="text-[32px] font-semibold leading-tight text-text-primary">{pageTitle}</h1>
        <p className="mt-2 max-w-[720px] text-[15px] leading-relaxed text-text-secondary">
          {locale === 'ar'
            ? 'يجمع كأس العالم فيفا 2026 48 منتخباً وطنياً في الولايات المتحدة وكندا والمكسيك والمغرب، أول دولة إفريقية تستضيف في تاريخ البطولة. تابعوا الجدول الكامل، 12 مجموعة، الترتيب ومرحلة الأدوار الإقصائية مباشرة.'
            : locale === 'en'
              ? 'The FIFA World Cup 2026 brings 48 national teams to the United States, Canada, Mexico, and Morocco — the first African co-host in tournament history. Follow the full schedule, 12 groups, standings, and knockout bracket live.'
              : "La Coupe du Monde FIFA 2026 reunit 48 equipes nationales aux Etats-Unis, au Canada, au Mexique et au Maroc, premier hote africain de l'histoire. Suivez le calendrier complet, les 12 groupes, les classements et la phase a elimination directe en direct."}
        </p>
      </div>
    </>
  );

  return (
    <InnerPageShell
      pageHeader={pageHeader}
      leftRail={
        <div className="space-y-4">
          <div className="rounded-lg border border-border-subtle bg-bg-surface p-4">
            <p className="text-sm text-text-tertiary">Left rail — Sub-task 6.2</p>
          </div>
        </div>
      }
      center={
        <div className="space-y-4">
          <div className="rounded-lg border border-border-subtle bg-bg-surface p-4">
            <p className="text-sm text-text-tertiary">Center column tabs — Sub-task 6.3</p>
          </div>
        </div>
      }
      rightRail={
        <div className="space-y-4">
          <div className="rounded-lg border border-border-subtle bg-bg-surface p-4">
            <p className="text-sm text-text-tertiary">Right rail — Sub-task 6.4</p>
          </div>
        </div>
      }
    />
  );
}
