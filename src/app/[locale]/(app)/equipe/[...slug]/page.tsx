import type { Metadata } from 'next';
import { TeamHubPage, teamHubMetadata } from '@/lib/team/team-hub-page';

interface PageProps {
  params: Promise<{ locale: string; slug: string[] }>;
}

const slugOf = (raw: string[]) => raw.map(decodeURIComponent).pop() ?? '';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  return teamHubMetadata(locale, slugOf(slug), { mode: 'legacy' });
}

export default async function TeamPage({ params }: PageProps) {
  const { locale, slug } = await params;
  return <TeamHubPage locale={locale} teamSlug={slugOf(slug)} route={{ mode: 'legacy' }} />;
}
