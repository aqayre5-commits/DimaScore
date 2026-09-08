import type { Metadata } from 'next';
import {
  generateBotolaMatchsMetadata,
  renderBotolaMatchsRoute,
} from '@/lib/seo/botola-matchs-route';
import { BOTOLA_MATCHS_SLUGS } from '@/lib/seo/botola-matchs';

interface PageProps {
  params: Promise<{ locale: string }>;
}

const ROUTE_SLUG = BOTOLA_MATCHS_SLUGS.en;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generateBotolaMatchsMetadata(locale);
}

export default async function BotolaProMatchesPage({ params }: PageProps) {
  const { locale } = await params;
  return renderBotolaMatchsRoute(locale, ROUTE_SLUG);
}
