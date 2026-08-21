interface PersonJsonLdProps {
  url: string;
  name: string;
  /** Localized nationality name → Country. */
  nationality?: string | null;
  image?: string | null;
  /** Current club / national team → SportsTeam affiliation. */
  affiliation?: string | null;
  /** e.g. "Professional footballer" / "Football coach". */
  jobTitle?: string | null;
}

/**
 * Person JSON-LD for player and coach pages. `sameAs` (Wikipedia/Wikidata) is a follow-up
 * enrichment. Server component.
 */
export function PersonJsonLd({
  url,
  name,
  nationality,
  image,
  affiliation,
  jobTitle,
}: PersonJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    ...(jobTitle ? { jobTitle } : {}),
    ...(nationality ? { nationality: { '@type': 'Country', name: nationality } } : {}),
    ...(affiliation ? { affiliation: { '@type': 'SportsTeam', name: affiliation } } : {}),
    ...(image ? { image } : {}),
    url,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
