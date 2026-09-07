import type { Metadata } from 'next';
import {
  generateBotolaSeasonOpenerMetadata,
  renderBotolaSeasonOpenerRoute,
} from '@/lib/seo/botola-season-opener-route';
import { BOTOLA_SEASON_OPENER_SLUGS } from '@/lib/seo/botola-season-opener';

interface PageProps {
  params: Promise<{ locale: string }>;
}

const ROUTE_SLUG = BOTOLA_SEASON_OPENER_SLUGS.fr;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generateBotolaSeasonOpenerMetadata(locale);
}

export default async function CalendrierBotolaPro2026Page({ params }: PageProps) {
  const { locale } = await params;
  return renderBotolaSeasonOpenerRoute(locale, ROUTE_SLUG);
}
