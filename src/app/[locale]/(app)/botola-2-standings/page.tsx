import type { Metadata } from 'next';
import {
  generateBotola2ClassementMetadata,
  renderBotola2ClassementRoute,
} from '@/lib/seo/botola-2-classement-route';
import { BOTOLA_2_CLASSEMENT_SLUGS } from '@/lib/seo/botola-2-classement';

interface PageProps {
  params: Promise<{ locale: string }>;
}

const ROUTE_SLUG = BOTOLA_2_CLASSEMENT_SLUGS.en;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generateBotola2ClassementMetadata(locale);
}

export default async function Botola2StandingsPage({ params }: PageProps) {
  const { locale } = await params;
  return renderBotola2ClassementRoute(locale, ROUTE_SLUG);
}
