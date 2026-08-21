interface MatchJsonLdProps {
  url: string;
  homeName: string;
  awayName: string;
  homeLogo?: string | null;
  awayLogo?: string | null;
  competitionName: string;
  kickoffAt: Date;
  statusCode: string;
  venueName?: string | null;
  venueCity?: string | null;
  homeSameAs?: string[];
  awaySameAs?: string[];
  competitionSameAs?: string[];
}

/** schema.org eventStatus from our fixture status code (schema has no "in progress"/"completed"). */
function eventStatus(statusCode: string): string {
  if (statusCode === 'PST' || statusCode === 'SUSP' || statusCode === 'TBD')
    return 'https://schema.org/EventPostponed';
  if (statusCode === 'CANC' || statusCode === 'ABD' || statusCode === 'AWD' || statusCode === 'WO')
    return 'https://schema.org/EventCancelled';
  return 'https://schema.org/EventScheduled';
}

/**
 * Per-match SportsEvent JSON-LD — the two teams as competitors, venue, competition and status.
 * This is the match-page equivalent of the tournament-level SportsEventJsonLd. Server component.
 */
export function MatchJsonLd({
  url,
  homeName,
  awayName,
  homeLogo,
  awayLogo,
  competitionName,
  kickoffAt,
  statusCode,
  venueName,
  venueCity,
  homeSameAs,
  awaySameAs,
  competitionSameAs,
}: MatchJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: `${homeName} vs ${awayName}`,
    sport: 'https://schema.org/Soccer',
    startDate: kickoffAt.toISOString(),
    eventStatus: eventStatus(statusCode),
    competitor: [
      {
        '@type': 'SportsTeam',
        name: homeName,
        ...(homeLogo ? { logo: homeLogo } : {}),
        ...(homeSameAs && homeSameAs.length > 0 ? { sameAs: homeSameAs } : {}),
      },
      {
        '@type': 'SportsTeam',
        name: awayName,
        ...(awayLogo ? { logo: awayLogo } : {}),
        ...(awaySameAs && awaySameAs.length > 0 ? { sameAs: awaySameAs } : {}),
      },
    ],
    ...(venueName
      ? {
          location: {
            '@type': 'Place',
            name: venueName,
            ...(venueCity ? { address: venueCity } : {}),
          },
        }
      : {}),
    superEvent: {
      '@type': 'SportsOrganization',
      name: competitionName,
      ...(competitionSameAs && competitionSameAs.length > 0 ? { sameAs: competitionSameAs } : {}),
    },
    url,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
