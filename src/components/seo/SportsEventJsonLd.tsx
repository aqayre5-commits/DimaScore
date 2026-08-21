import type { CupMetadata } from '@/lib/constants/tournament-metadata';

interface SportsEventJsonLdProps {
  metadata: CupMetadata;
  tournamentName: string;
  alternateNames: string[];
  canonicalUrl: string;
  /** Wikipedia/Wikidata entity links (Knowledge Graph). */
  sameAs?: string[];
}

/**
 * SportsEvent JSON-LD structured data for tournament pages.
 * Per competition-cup.md §2 — renders in page body as <script> tag.
 * Next.js Metadata API doesn't support arbitrary JSON-LD shapes,
 * so body script tag is the standard approach.
 */
export function SportsEventJsonLd({
  metadata,
  tournamentName,
  alternateNames,
  canonicalUrl,
  sameAs,
}: SportsEventJsonLdProps) {
  const hostCountryNames: Record<string, string> = {
    US: 'United States',
    CA: 'Canada',
    MX: 'Mexico',
    MA: 'Morocco',
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: tournamentName,
    alternateName: alternateNames,
    sport: 'https://schema.org/Soccer',
    startDate: metadata.kickoffDate,
    endDate: metadata.finalDate,
    location: metadata.hostCountryCodes.map((code) => ({
      '@type': 'Country',
      name: hostCountryNames[code] ?? code,
    })),
    organizer: {
      '@type': 'Organization',
      name: 'FIFA',
    },
    ...(sameAs && sameAs.length > 0 ? { sameAs } : {}),
    url: canonicalUrl,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
