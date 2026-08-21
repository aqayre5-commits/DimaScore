interface SportsTeamJsonLdProps {
  url: string;
  name: string;
  logo?: string | null;
  /** Primary competition the team plays in → SportsOrganization memberOf. */
  competitionName?: string | null;
}

/**
 * SportsTeam JSON-LD for team pages — the club/national-team entity. `sameAs` (Wikipedia/Wikidata)
 * is a follow-up enrichment. Server component.
 */
export function SportsTeamJsonLd({ url, name, logo, competitionName }: SportsTeamJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SportsTeam',
    name,
    sport: 'https://schema.org/Soccer',
    ...(logo ? { logo } : {}),
    ...(competitionName
      ? { memberOf: { '@type': 'SportsOrganization', name: competitionName } }
      : {}),
    url,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
