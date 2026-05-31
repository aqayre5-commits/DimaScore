import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/lib/i18n/config';
import { BASE_URL } from '@/lib/constants/site';
import { SeoBreadcrumb, type BreadcrumbSegment } from '@/components/chrome/SeoBreadcrumb';
import { CoachPageHeader } from '@/components/coach/CoachPageHeader';
import { CoachCareerTable } from '@/components/coach/CoachCareerTable';
import { db } from '@/lib/db/client';
import { getCoachById } from '@/lib/db/queries/coach';

interface PageProps {
  params: Promise<{ locale: string; slug: string[] }>;
}

/** Extract numeric ID from the last slug segment (e.g. "a-conte-2425" → 2425) */
function extractIdFromSlug(slug: string): number | null {
  const match = slug.match(/-(\d+)$/);
  return match ? Number(match[1]) : null;
}

// ── Metadata ──

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug: rawSlug } = await params;
  const lastSegment = rawSlug.map(decodeURIComponent).pop() ?? '';
  const coachId = extractIdFromSlug(lastSegment);

  if (!coachId) return { title: 'Coach | Atlas Kings' };

  const coach = await getCoachById(db, coachId);
  if (!coach) return { title: 'Coach | Atlas Kings' };

  const displayName =
    coach.firstname && coach.lastname ? `${coach.firstname} ${coach.lastname}` : coach.name;
  const t = await getTranslations({ locale, namespace: 'coachPage' });

  const title = `${displayName} — ${t('manager')} | Atlas Kings`;
  const description = `${displayName} — ${t('careerHistory')}.`;
  const slugPath = rawSlug.map(decodeURIComponent).join('/');
  const canonical = `${BASE_URL}/${locale}/entraineur/${slugPath}`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: Object.fromEntries(
        locales.map((l) => [l, `${BASE_URL}/${l}/entraineur/${slugPath}`]),
      ),
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'Atlas Kings',
      locale: locale === 'ar' ? 'ar_MA' : locale === 'fr' ? 'fr_MA' : 'en_US',
      type: 'profile',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

// ── Page ──

export default async function CoachPage({ params }: PageProps) {
  const { locale, slug: rawSlug } = await params;
  const typedLocale = locale as Locale;
  const lastSegment = rawSlug.map(decodeURIComponent).pop() ?? '';
  const coachId = extractIdFromSlug(lastSegment);

  if (!coachId) notFound();

  const coach = await getCoachById(db, coachId);
  if (!coach) notFound();

  const tBc = await getTranslations({ locale, namespace: 'breadcrumb' });
  const displayName =
    coach.firstname && coach.lastname ? `${coach.firstname} ${coach.lastname}` : coach.name;

  const breadcrumbs: BreadcrumbSegment[] = [
    { label: tBc('football'), href: `/${locale}` },
    { label: displayName },
  ];

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-4 px-4 py-4">
      <SeoBreadcrumb segments={breadcrumbs} />
      <CoachPageHeader coach={coach} locale={typedLocale} />
      <CoachCareerTable career={coach.career} />
    </div>
  );
}
