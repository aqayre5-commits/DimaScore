interface SportsTeamJsonLdProps {
  url: string;
  name: string;
  logo?: string | null;
  /** Primary competition the team plays in → SportsOrganization memberOf. */
  competitionName?: string | null;
  /** Wikipedia/Wikidata entity links (Knowledge Graph). */
  sameAs?: string[];
}

/**
 * SportsTeam JSON-LD for team pages — the club/national-team entity. Server component.
 */
export function SportsTeamJsonLd({
  url,
  name,
  logo,
  competitionName,
  sameAs,
}: SportsTeamJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SportsTeam',
    name,
    sport: 'https://schema.org/Soccer',
    ...(logo ? { logo } : {}),
    ...(competitionName
      ? { memberOf: { '@type': 'SportsOrganization', name: competitionName } }
      : {}),
    ...(sameAs && sameAs.length > 0 ? { sameAs } : {}),
    url,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
