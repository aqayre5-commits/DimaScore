import type { Metadata } from 'next';
import {
  generateBotolaClassementMetadata,
  renderBotolaClassementRoute,
} from '@/lib/seo/botola-classement-route';
import { BOTOLA_CLASSEMENT_SLUGS } from '@/lib/seo/botola-classement';

interface PageProps {
  params: Promise<{ locale: string }>;
}

const ROUTE_SLUG = BOTOLA_CLASSEMENT_SLUGS.fr;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generateBotolaClassementMetadata(locale);
}

export default async function ClassementBotolaProPage({ params }: PageProps) {
  const { locale } = await params;
  return renderBotolaClassementRoute(locale, ROUTE_SLUG);
}
